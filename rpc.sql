create or replace function public.increment_balance_used(p_user_id uuid, p_year int, p_leave_type public.leave_type_enum, p_days numeric)
returns void as $$
begin
  update public.leave_balances
  set used = used + p_days
  where user_id = p_user_id and year = p_year and leave_type = p_leave_type;
end;
$$ language plpgsql security definer;
