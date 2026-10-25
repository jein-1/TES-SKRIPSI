import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = serviceRoleKey ? createClient(supabaseUrl, serviceRoleKey) : null;

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!supabase) {
    return res.status(500).json({ error: 'Server misconfigured: SUPABASE_SERVICE_ROLE_KEY is missing' });
  }

  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 1. Validate JWT
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('ERROR: JWT_SECRET is missing from environment variables.');
      return res.status(500).json({ error: 'Server configuration error' });
    }
    jwt.verify(token, secret);
  } catch (err) {
    console.error('JWT Verification failed:', err.message);
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }

  // 2. Validate payload
  const { id } = req.body || req.query; // Allow ID from query string or body
  if (!id) {
    return res.status(400).json({ error: 'Bad Request: Missing hazard zone ID' });
  }

  // 3. Delete from Supabase using Service Role Key
  const { error } = await supabase.from('hazard_zones')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Supabase delete error:', error.message);
    return res.status(500).json({ error: 'Database delete failed' });
  }

  return res.status(200).json({ success: true });
}
