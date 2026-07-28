import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

// Init Supabase with Service Role
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
let supabase = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress || 'unknown';

  if (!supabase) {
    return res.status(500).json({ error: 'Server misconfigured: brute-force protection unavailable' });
  }

  const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();

  // 1. Username Rate Limit: >= 5 fails per Username in last 15 mins
  const { count: userFailCount, error: userError } = await supabase
    .from('login_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('username', username)
    .eq('success', false)
    .gte('created_at', fifteenMinsAgo);
    
  if (!userError && userFailCount >= 5) {
    return res.status(429).json({ error: 'Terlalu banyak percobaan gagal. Coba lagi dalam beberapa menit.' });
  }

  // 2. IP Rate Limit: >= 20 fails per IP in last 15 mins
  const { count: ipFailCount, error: ipError } = await supabase
    .from('login_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('ip', ip)
    .eq('success', false)
    .gte('created_at', fifteenMinsAgo);
  
  if (!ipError && ipFailCount >= 20) {
    return res.status(429).json({ error: 'Terlalu banyak percobaan gagal. Coba lagi dalam beberapa menit.' });
  }

  // Parse admin accounts from environment variable (JSON string)
  let adminAccounts = [];
  try {
    if (process.env.ADMIN_ACCOUNTS_JSON) {
      adminAccounts = JSON.parse(process.env.ADMIN_ACCOUNTS_JSON);
    } else {
      console.warn('WARNING: ADMIN_ACCOUNTS_JSON is not configured in environment.');
    }
  } catch (err) {
    console.error('Failed to parse ADMIN_ACCOUNTS_JSON:', err);
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const account = adminAccounts.find(a => a.username === username);
  
  if (!account) {
    // Prevent timing attacks by hashing a dummy string if user not found
    await bcrypt.hash(password, 10);
  }

  const isMatch = account ? await bcrypt.compare(password, account.passwordHash) : false;
  
  if (!account || !isMatch) {
    await supabase.from('login_attempts').insert([{ username, ip, success: false }]);
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  // Log success
  await supabase.from('login_attempts').insert([{ username, ip, success: true }]);
  // Reset counter for this username
  await supabase.from('login_attempts').delete().eq('username', username).eq('success', false);

  // Generate JWT token (expires in 2 hours)
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('ERROR: JWT_SECRET is missing from environment variables.');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const token = jwt.sign(
    { sub: account.username, name: account.name, role: account.role },
    secret,
    { expiresIn: '2h' }
  );

  return res.status(200).json({
    success: true,
    token,
    name: account.name,
    role: account.role,
  });
}
