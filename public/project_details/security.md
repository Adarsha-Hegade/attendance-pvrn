Supabase RLS Rules

- Users can only see their own leave_requests
- Approvers can see all pending leave_requests
- Only approvers can insert into leave_actions
- leave_requests.status cannot be updated if not pending
