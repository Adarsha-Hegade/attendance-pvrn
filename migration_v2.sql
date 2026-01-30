-- 1. Create Leave Type Enum
create type public.leave_type_enum as enum ('casual', 'sick', 'earned', 'study', 'work_from_home', 'loss_of_pay');

-- 2. Alter leave_requests to include type and count
alter table public.leave_requests 
add column leave_type public.leave_type_enum not null default 'casual',
add column days_count numeric not null default 1;

-- 3. Create Leave Balances table
create table public.leave_balances (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null,
  year int not null,
  leave_type public.leave_type_enum not null,
  allocated numeric not null default 0,
  used numeric not null default 0,
  unique(user_id, year, leave_type)
);

alter table public.leave_balances enable row level security;

-- Policy: Users see their own balances
create policy "Users see own balances" on public.leave_balances
  for select using (auth.uid() = user_id);

-- Policy: Approvers see all balances
create policy "Approvers see all balances" on public.leave_balances
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'approver')
  );

-- Function to initialize balances for a new user
-- (We'll call this manually or via trigger for new users)
create or replace function public.initialize_balances(target_user_id uuid, target_year int)
returns void as $$
begin
  -- Example CA Firm Allocation
  insert into public.leave_balances (user_id, year, leave_type, allocated, used) values
  (target_user_id, target_year, 'casual', 12, 0),
  (target_user_id, target_year, 'sick', 10, 0),
  (target_user_id, target_year, 'earned', 15, 0), -- Pl changes based on tenure usually
  (target_user_id, target_year, 'study', 30, 0),   -- For exams
  (target_user_id, target_year, 'work_from_home', 0, 0), -- As needed
  (target_user_id, target_year, 'loss_of_pay', 0, 0)     -- Unlimited typically
  on conflict do nothing; 
end;
$$ language plpgsql;

-- Trigger to init balances on profile creation
create or replace function public.handle_new_user_balances()
returns trigger as $$
begin
  perform public.initialize_balances(new.id, date_part('year', CURRENT_DATE)::int);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_profile_created
  after insert on public.profiles
  for each row execute procedure public.handle_new_user_balances();

-- Backfill for existing profiles
do $$
declare
  r record;
begin
  for r in select id from public.profiles loop
    perform public.initialize_balances(r.id, date_part('year', CURRENT_DATE)::int);
  end loop;
end;
$$;
