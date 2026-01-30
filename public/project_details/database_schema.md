## Tables

### users

Managed by Supabase Auth

### profiles

id (uuid, PK)
email (text)
full_name (text)
role (enum: employee, approver)

### leave_requests

id (uuid, PK)
user_id (uuid, FK -> profiles.id)
start_date (date)
end_date (date)
reason (text)
status (enum: pending, approved, rejected)
created_at (timestamp)

### leave_actions

id (uuid, PK)
leave_id (uuid, FK -> leave_requests.id)
action_by (uuid, FK -> profiles.id)
action (approved/rejected)
action_at (timestamp)
