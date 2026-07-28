import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('../.env', 'utf-8');
let supabaseUrl = '';
let serviceRoleKey = '';
env.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length < 2) return;
  const val = parts.slice(1).join('=').trim().replace(/['"\r]/g, '');
  if (line.startsWith('VITE_SUPABASE_URL=')) supabaseUrl = val;
  if (line.startsWith('SUPABASE_URL=') && !supabaseUrl) supabaseUrl = val;
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) serviceRoleKey = val;
});

const supabase = createClient(supabaseUrl, serviceRoleKey);
supabase.from('custom_shelters').select('*').then(res => {
  console.log(JSON.stringify(res.data, null, 2));
  process.exit(0);
});
