import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

// ── Env vars (fail loud jika SUPABASE_SERVICE_ROLE_KEY kosong) ──
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Initialize without key first, check in handler
const supabase = serviceRoleKey ? createClient(supabaseUrl, serviceRoleKey) : null;

export default async function handler(req, res) {
  // ── CORS Headers ──────────────────────────────────────
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ── Fail loud: SUPABASE_SERVICE_ROLE_KEY wajib ada ──────────────────────────
  if (!supabase) {
    console.error('ERROR: SUPABASE_SERVICE_ROLE_KEY is missing from environment variables.');
    return res.status(500).json({ error: 'Server misconfigured: SUPABASE_SERVICE_ROLE_KEY is missing' });
  }

  // ── Accept DELETE ──────────────────────────────────────────────────────
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // ── 1. Validate JWT ─────────────────────────────
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

  // ── 2. Validate payload ──────────────────────────────────────────────────────
  const id = req.body.id || req.query.id;
  if (!id) {
    return res.status(400).json({ error: 'Bad Request: Missing required field: id' });
  }

  // ── 3. Delete via Service Role Key (bypasses RLS) ───────────────────────────
  const { error } = await supabase
    .from('custom_shelters')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[shelters/delete] Supabase delete error:', error.message);
    return res.status(500).json({ error: 'Database delete failed', detail: error.message });
  }

  // ── 4. Broadcast SHELTER_DELETED on the same "aegis-events" channel ─────────
  try {
    const broadcastChannel = supabase.channel('aegis-events');
    await broadcastChannel.send({
      type: 'broadcast',
      event: 'SHELTER_DELETED',
      payload: { id },
    });
    // Cleanup channel after send
    await supabase.removeChannel(broadcastChannel);
  } catch (broadcastErr) {
    console.warn('[shelters/delete] Broadcast warning:', broadcastErr?.message ?? broadcastErr);
  }

  return res.status(200).json({ success: true, id });
}
