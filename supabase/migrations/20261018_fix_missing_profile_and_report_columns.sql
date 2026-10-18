-- Migration: Fix missing profile settings, targets, and notifications columns + household RLS helper
-- Created at: 2026-10-18

-- 1. Add notification, targets, and report preference columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS notify_daily_reminder boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS notify_daily_time text DEFAULT '20:00',
  ADD COLUMN IF NOT EXISTS notify_weekly_summary boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS notify_challenge_deadlines boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS notify_monthly_report boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS notify_household_activity boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS notify_goal_achieved boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS monthly_target numeric(10,2) DEFAULT 350.00,
  ADD COLUMN IF NOT EXISTS yearly_target numeric(10,2) DEFAULT 4200.00,
  ADD COLUMN IF NOT EXISTS auto_generate_reports boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS report_email text;

-- 2. Ensure RLS policies allow authenticated users to update and delete their own profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
CREATE POLICY "Users can delete own profile"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

-- 3. Security Definer helper to prevent infinite recursion in household_members RLS
CREATE OR REPLACE FUNCTION public.is_household_member(lookup_household_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.household_members
    WHERE household_id = lookup_household_id
    AND user_id = auth.uid()
  );
$$;

DROP POLICY IF EXISTS "Users can view members of their household" ON public.household_members;
CREATE POLICY "Users can view members of their household"
  ON public.household_members
  FOR SELECT
  TO authenticated
  USING (public.is_household_member(household_id));
