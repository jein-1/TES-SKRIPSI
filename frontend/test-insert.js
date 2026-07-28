import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Read .env manually
const env = fs.readFileSync('../.env', 'utf-8');
let supabaseUrl = '';
let serviceRoleKey = '';
env.split('\n').forEach(line => {
  if (line.startsWith('VITE_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim().replace(/['"\r]/g, '');
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) serviceRoleKey = line.split('=')[1].trim().replace(/['"\r]/g, '');
  if (line.startsWith('SUPABASE_URL=') && !supabaseUrl) supabaseUrl = line.split('=')[1].trim().replace(/['"\r]/g, '');
});

const supabase = createClient(supabaseUrl, serviceRoleKey);
supabase.from('custom_shelters').insert({
  id: 'test_123' + Date.now(),
  name: 'Test Shelter',
  lat: 1.0,
  lng: 1.0,
  capacity: 1000,
  radius_meters: 50,
  address: null
}).select().single()
  .then(res => {
    console.log('Result:', JSON.stringify(res));
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
