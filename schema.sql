-- Create profiles table
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  avatar_url text,
  role text default 'employee' check (role in ('employee', 'approver')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for profiles
alter table public.profiles enable row level security;
create policy "Public profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can insert their own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update their own profile" on public.profiles for update using (auth.uid() = id);

-- Trigger for new user
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, role)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', 'employee');
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists to avoid error on replay
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Leave Requests
create table public.leave_requests (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null,
  start_date date not null,
  end_date date not null,
  reason text,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table public.leave_requests enable row level security;

-- Policy: Employees see their own leaves
create policy "Employees see their own leaves" on public.leave_requests
  for select using (auth.uid() = user_id);

-- Policy: Approvers see all leaves
create policy "Approvers see all leaves" on public.leave_requests
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'approver')
  );

-- Policy: Employees can create leaves
create policy "Employees can create leaves" on public.leave_requests
  for insert with check (auth.uid() = user_id);

-- Policy: Approvers can update status
create policy "Approvers can update leaves" on public.leave_requests
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'approver')
  );

-- Leave Actions
create table public.leave_actions (
  id uuid default gen_random_uuid() primary key,
  leave_id uuid references public.leave_requests(id) not null,
  approver_id uuid references public.profiles(id) not null,
  action text check (action in ('approve', 'reject')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.leave_actions enable row level security;

-- Policy: visible to everyone involved
create policy "Visible to involved" on public.leave_actions
  for select using (
    exists (select 1 from public.leave_requests where id = leave_id and user_id = auth.uid())
    or
    exists (select 1 from public.profiles where id = auth.uid() and role = 'approver')
  );

-- Policy: Insert only by approvers
create policy "Approvers can record actions" on public.leave_actions
  for insert with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'approver')
  );

-- Helper function to prevent updates if not pending?
-- Not strictly asked for SQL function enforcement beyond RLS and check constraints.
-- Application can handle logic, but database consistency is key.
-- Let's consider a trigger to lock updates if status is not pending.
create or replace function prevent_update_on_final_status()
returns trigger as $$
begin
  if old.status in ('approved', 'rejected') then
    raise exception 'Cannot modify a leave request that is already approved or rejected.';
  end if;
  return new;
end;
$$ language plpgsql;

create trigger check_status_update
  before update on public.leave_requests
  for each row execute procedure prevent_update_on_final_status();
