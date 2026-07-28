import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Read .env manually
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
supabase.from('custom_shelters').delete().like('id', 'test_api_%').then(res => {
  console.log('Deleted test API shelters', res.data);
  process.exit(0);
});
