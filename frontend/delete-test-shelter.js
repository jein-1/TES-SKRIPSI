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

// Hapus Test Shelter (lat=1, lng=1)
const { data, error } = await supabase
  .from('custom_shelters')
  .delete()
  .eq('id', 'test_1231785222048794');

if (error) {
  console.error('Gagal hapus:', error.message);
} else {
  console.log('Test Shelter berhasil dihapus!');
}
process.exit(0);
