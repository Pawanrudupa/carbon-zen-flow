-- Create households table
CREATE TABLE IF NOT EXISTS public.households (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create household_members table
CREATE TABLE IF NOT EXISTS public.household_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(household_id, user_id)
);

-- Enable RLS
ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.household_members ENABLE ROW LEVEL SECURITY;

-- Policies for households
CREATE POLICY "Users can view their own household"
  ON public.households
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.household_members
      WHERE household_id = households.id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Any authenticated user can insert households"
  ON public.households
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Owners can update their household"
  ON public.households
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.household_members
      WHERE household_id = households.id
      AND user_id = auth.uid()
      AND role = 'owner'
    )
  );

-- Policies for household_members
CREATE POLICY "Users can view members of their household"
  ON public.household_members
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.household_members hm
      WHERE hm.household_id = household_members.household_id
      AND hm.user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can join households"
  ON public.household_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
  );

CREATE POLICY "Owners and admins can manage members"
  ON public.household_members
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.household_members hm
      WHERE hm.household_id = household_members.household_id
      AND hm.user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Owners and admins can delete members"
  ON public.household_members
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.household_members hm
      WHERE hm.household_id = household_members.household_id
      AND hm.user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );
