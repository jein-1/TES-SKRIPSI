import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

// Use Service Role Key to bypass RLS and insert securely
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'placeholder'
);

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
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
  const { id, name, lat, lng, capacity, radiusMeters } = req.body;
  if (!id || !name || typeof lat !== 'number' || typeof lng !== 'number') {
    return res.status(400).json({ error: 'Bad Request: Missing required shelter fields' });
  }

  // 3. Insert to Supabase using Service Role Key
  const { data, error } = await supabase.from('custom_shelters').insert({
    id,
    name,
    lat,
    lng,
    capacity: capacity || 1000,
    radiusMeters: radiusMeters || 50
  }).select().single();

  if (error) {
    console.error('Supabase insert error:', error.message);
    return res.status(500).json({ error: 'Database insert failed' });
  }

  return res.status(200).json({ success: true, shelter: data });
}
