
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view challenges"
ON public.challenges
FOR SELECT
TO authenticated
USING (true);
