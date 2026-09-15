import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

const envFile = readFileSync('.env', 'utf-8');
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    process.env[match[1].trim()] = match[2].trim().replace(/^['"](.*)['"]$/, '$1');
  }
});

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function test() {
  const payload = {
    id: 'HZ' + Date.now(),
    name: "test zona",
    coordinates: [[-0.8, 119.8], [-0.81, 119.81]],
    zrb_level: 4,
    description: "test",
  };
  console.log("Inserting...", payload);
  const { data, error } = await supabase.from('hazard_zones').insert(payload).select().single();
  console.log("Data:", data);
  console.log("Error:", error);
}

test();
