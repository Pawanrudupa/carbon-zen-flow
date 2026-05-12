-- Add monthly goal to households table
ALTER TABLE public.households
  ADD COLUMN IF NOT EXISTS goal_monthly_kg decimal(10,2) DEFAULT 800,
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create household_invites table
CREATE TABLE IF NOT EXISTS public.household_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  invite_code text UNIQUE NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.household_invites ENABLE ROW LEVEL SECURITY;

-- Anyone (authenticated) can read invite codes to validate them
DROP POLICY IF EXISTS "Anyone can read active invites" ON public.household_invites;
CREATE POLICY "Anyone can read active invites"
  ON public.household_invites FOR SELECT
  TO authenticated
  USING (expires_at IS NULL OR expires_at > now());

-- Household members can create invites for their household
DROP POLICY IF EXISTS "Household members can create invites" ON public.household_invites;
CREATE POLICY "Household members can create invites"
  ON public.household_invites FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.household_members
      WHERE household_id = household_invites.household_id
        AND user_id = auth.uid()
    )
  );

-- Household members can delete invites (refresh code)
DROP POLICY IF EXISTS "Household members can delete invites" ON public.household_invites;
CREATE POLICY "Household members can delete invites"
  ON public.household_invites FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.household_members
      WHERE household_id = household_invites.household_id
        AND user_id = auth.uid()
    )
  );

-- Function to generate a random 8-char uppercase invite code
CREATE OR REPLACE FUNCTION generate_invite_code() RETURNS text AS $$
  SELECT upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8))
$$ LANGUAGE SQL VOLATILE;

-- Allow owners/admins to delete households
DROP POLICY IF EXISTS "Owners can delete household" ON public.households;
CREATE POLICY "Owners can delete household"
  ON public.households FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.household_members
      WHERE household_id = households.id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

