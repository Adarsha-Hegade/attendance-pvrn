-- Migration v3: Add half-day leave support, cancellation, and rejection reason

-- Add is_half_day column to leave_requests
ALTER TABLE public.leave_requests ADD COLUMN IF NOT EXISTS is_half_day boolean DEFAULT false;

-- Add half_day_period for morning or afternoon
ALTER TABLE public.leave_requests ADD COLUMN IF NOT EXISTS half_day_period text CHECK (half_day_period IN ('morning', 'afternoon'));

-- Add rejection_reason column
ALTER TABLE public.leave_requests ADD COLUMN IF NOT EXISTS rejection_reason text;

-- Add leave_type column if not exists
ALTER TABLE public.leave_requests ADD COLUMN IF NOT EXISTS leave_type text DEFAULT 'casual';

-- Add days_count column if not exists  
ALTER TABLE public.leave_requests ADD COLUMN IF NOT EXISTS days_count numeric DEFAULT 1;

-- Update status check to include 'cancelled'
ALTER TABLE public.leave_requests DROP CONSTRAINT IF EXISTS leave_requests_status_check;
ALTER TABLE public.leave_requests ADD CONSTRAINT leave_requests_status_check 
  CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled'));

-- Policy: Users can cancel their own pending leaves
DROP POLICY IF EXISTS "Users can cancel own pending leaves" ON public.leave_requests;
CREATE POLICY "Users can cancel own pending leaves" ON public.leave_requests
  FOR UPDATE USING (
    auth.uid() = user_id 
    AND status = 'pending'
  );

-- Leave balances table (if not exists)
CREATE TABLE IF NOT EXISTS public.leave_balances (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) NOT NULL,
  year int NOT NULL,
  leave_type text NOT NULL,
  allocated numeric DEFAULT 0,
  used numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, year, leave_type)
);

-- RLS for leave_balances
ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own balances" ON public.leave_balances;
CREATE POLICY "Users can view own balances" ON public.leave_balances
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Approvers can view all balances" ON public.leave_balances;
CREATE POLICY "Approvers can view all balances" ON public.leave_balances
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'approver')
  );

DROP POLICY IF EXISTS "Approvers can update balances" ON public.leave_balances;
CREATE POLICY "Approvers can update balances" ON public.leave_balances
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'approver')
  );

DROP POLICY IF EXISTS "Approvers can insert balances" ON public.leave_balances;
CREATE POLICY "Approvers can insert balances" ON public.leave_balances
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'approver')
  );
