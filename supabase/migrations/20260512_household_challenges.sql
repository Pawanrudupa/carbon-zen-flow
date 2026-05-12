-- Add household_id and is_custom to challenges
ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS household_id UUID REFERENCES public.households(id) ON DELETE CASCADE;
ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS is_custom BOOLEAN DEFAULT false;

-- Update RLS for challenges
DROP POLICY IF EXISTS "Anyone can view challenges" ON public.challenges;
DROP POLICY IF EXISTS "Users can view global and their household challenges" ON public.challenges;

CREATE POLICY "Users can view global and their household challenges" 
ON public.challenges FOR SELECT
USING (
  household_id IS NULL OR
  EXISTS (
    SELECT 1 FROM public.household_members
    WHERE household_members.household_id = challenges.household_id
    AND household_members.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Household members can insert custom challenges" ON public.challenges;
CREATE POLICY "Household members can insert custom challenges" 
ON public.challenges FOR INSERT
TO authenticated
WITH CHECK (
  household_id IS NOT NULL AND
  is_custom = true AND
  EXISTS (
    SELECT 1 FROM public.household_members
    WHERE household_members.household_id = challenges.household_id
    AND household_members.user_id = auth.uid()
  )
);

-- Create household_challenge_suggestions table
CREATE TABLE IF NOT EXISTS public.household_challenge_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  duration_days INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.household_challenge_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Household members can view suggestions" 
ON public.household_challenge_suggestions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.household_members
    WHERE household_members.household_id = household_challenge_suggestions.household_id
    AND household_members.user_id = auth.uid()
  )
);

CREATE POLICY "Household members can insert suggestions" 
ON public.household_challenge_suggestions FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.household_members
    WHERE household_members.household_id = household_challenge_suggestions.household_id
    AND household_members.user_id = auth.uid()
  )
);

CREATE POLICY "Household members can update suggestions" 
ON public.household_challenge_suggestions FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.household_members
    WHERE household_members.household_id = household_challenge_suggestions.household_id
    AND household_members.user_id = auth.uid()
  )
);
