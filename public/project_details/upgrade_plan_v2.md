# Upgrade Plan: CA Firm Leave Portal

## 1. Core Logic & Data Structure Improvements

### A. Leave Types

Currently, the system only has a genetic "leave". A CA firm needs specific types:

- **Casual Leave (CL)**: For personal matters.
- **Sick Leave (SL)**: For medical reasons.
- **Earned/Privilege Leave (EL/PL)**: Based on days worked.
- **Study Leave**: Critical for Article Assistants.
- **Work from Home (WFH)**: Often tracked separately.
- **Loss of Pay (LOP)**: When balances are exhausted.

### B. Leave Balances

- Each employee must have a balance for each leave type.
- **Logic**:
  - `leave_balances` table: `user_id` | `leave_type` | `total_allocated` | `used` | `year`
  - Balance Check: Before creating a request, check `(total - used) > requested_days`.
  - Deduction: On approval, increment `used` in `leave_balances`.

### C. Leave Request Meta

- `leave_type` column in `leave_requests`.
- `days_count` column (calculated from start/end dates, excluding weekends/holidays if we get fancy, but simple diff for now).

## 2. Dashboard Overhaul

### A. Approver/Admin Dashboard

1.  **"Who is Working Today" Widget**:
    - Total Employees (count `profiles`)
    - On Leave Today (count `leave_requests` where `status='approved'` AND `today BETWEEN start_date AND end_date`)
    - Present = Total - On Leave.
2.  **"On Leave Today" List**:
    - List of names of people currently absent.
3.  **"Upcoming Leaves" Widget**:
    - List of approved leaves starting in the next 7 days.
4.  **"Pending Actions"**:
    - The existing list, but enhanced with "Leave Type" and "Days Count".

### B. Employee Dashboard

1.  **Leave Balance Cards**:
    - Grid showing: "CL: 5/12", "SL: 2/10", "Study: 10/30".
2.  **"My Status"**:
    - Existing table, enhanced.

## 3. Reporting & Directory

- **"All Users" View**: A directory of all staff with their current status (Active/On Leave).
- **Employee Leave Report**: A page to view a specific employee's history.

---

## 4. Implementation Steps

1.  **Database Migration**:
    - Create `leave_types` enum.
    - Alter `leave_requests` to add `leave_type` and `days_count`.
    - Create `leave_balances` table.
    - Seed default balances for existing users.
2.  **Backend Logic**:
    - Update `createLeave` action:
      - Calculate days.
      - Validate balance (?) -> _Optional for V1, maybe just warn or allow negative (LOP)._ Let's start with tracking only.
    - Update `approveLeave` action:
      - Update `leave_balances` tally.
3.  **Frontend**:
    - **Dashboard**: Create the 3-column layout (Stats, Upcoming, Pending).
    - **Apply Form**: Add "Leave Type" dropdown.
    - **Nav**: Add "Directory" / "Reports" link.

## 5. Timeline

- Now: Database Migrations.
- Next: Update Server Actions & Types.
- Then: Dashboard Widgets Component.
- Finally: Polish UI.
