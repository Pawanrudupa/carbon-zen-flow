import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf8')
  .split('\n')
  .reduce((acc, line) => {
    const parts = line.split('=');
    if (parts.length === 2) {
      acc[parts[0].trim()] = parts[1].replace(/"/g, '').trim();
    }
    return acc;
  }, {});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function run() {
  console.log('Querying profiles...');
  const { data, error } = await supabase.from('profiles').select('*').limit(1);
  console.log('Data:', data);
  console.log('Error:', error);
}

run();
