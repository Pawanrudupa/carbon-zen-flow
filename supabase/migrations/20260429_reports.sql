CREATE TABLE reports (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  period text,
  format text,
  generated_at timestamp default now(),
  file_url text,
  file_size_kb int,
  data jsonb
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own reports" 
  ON reports FOR ALL 
  USING (auth.uid() = user_id);
