# Leave Approval System

A production-ready internal tool for managing employee leave requests.

## 🛠 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Backend / DB**: Supabase (PostgreSQL, Auth, RLS)
- **Icons**: Lucide React

## 🚀 Setup Instructions

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Configure Supabase**
   - Create a new project on [Supabase](https://supabase.com).
   - Go to the **SQL Editor** and paste the content of `schema.sql`. Run it to set up tables, RLS policies, and triggers.
   - Go to **Authentication > Providers** and enable **Google**. Add the redirect URL: `http://localhost:3000/auth/callback` (and your production URL).

3. **Environment Variables**
   - Rename `env.example` in file `.env.local` (or create it) with your Supabase keys:
     ```env
     NEXT_PUBLIC_SUPABASE_URL=your_project_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
     ```

4. **Run Locally**
   ```bash
   npm run dev
   ```

## 📂 Project Structure

- `app/` - Next.js App Router pages
  - `login/` - Login page
  - `dashboard/` - Employee Dashboard (My Leaves)
  - `apply-leave/` - Leave Application Form
  - `approvals/` - Approver Dashboard (Pending Requests)
  - `actions/` - Server Actions (Create, Approve, Reject)
  - `auth/` - Auth Callback route
- `components/` - React components (UI + Business logic)
- `utils/supabase/` - Supabase clients (Server, Browser, Middleware)
- `schema.sql` - Database migrations and RLS policies

## 🔐 Security & Roles

- **RLS (Row Level Security)** is enforced:
  - **Employees**: Can only view their own leaves.
  - **Approvers**: Can view all pending leaves and all leave details.
  - **Actions**: Only approvers can approve/reject.
- **Roles**: Defined in `profiles` table. Default is `employee`. Manually update a user to `approver` in Supabase table editor or via SQL `UPDATE public.profiles SET role = 'approver' WHERE email = '...';`

## 🧪 Deployment

1. Push to GitHub.
2. Deploy on Vercel.
3. Add Environment Variables in Vercel Project Settings.
4. Update Supabase Auth Redirect URL to your Vercel domain.
