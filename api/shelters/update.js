import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

// ── Env vars (fail loud jika SUPABASE_SERVICE_ROLE_KEY kosong, persis add.js) ──
const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Initialize without key first, check in handler (same pattern as add.js)
const supabase = serviceRoleKey ? createClient(supabaseUrl, serviceRoleKey) : null;

export default async function handler(req, res) {
  // ── CORS Headers (identical to add.js) ──────────────────────────────────────
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

  // ── Accept PATCH or PUT ──────────────────────────────────────────────────────
  if (req.method !== 'PATCH' && req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // ── 1. Validate JWT (identical logic to add.js) ─────────────────────────────
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
  const { id, name, capacity, radiusMeters, address, customMessage } = req.body;
  if (!id) {
    return res.status(400).json({ error: 'Bad Request: Missing required field: id' });
  }

  // Build update object — only include fields that were explicitly provided
  const updates = {};
  if (name !== undefined)          updates.name          = name;
  if (capacity !== undefined)      updates.capacity      = capacity;
  if (radiusMeters !== undefined)  updates.radius_meters  = radiusMeters;
  if (address !== undefined)       updates.address       = address;
  if (customMessage !== undefined) updates.custom_message = customMessage;

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'Bad Request: No updatable fields provided (name, capacity, radiusMeters, address)' });
  }

  // ── 3. Update via Service Role Key (bypasses RLS) ───────────────────────────
  const { data, error } = await supabase
    .from('custom_shelters')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[shelters/update] Supabase update error:', error.message);
    return res.status(500).json({ error: 'Database update failed', detail: error.message });
  }

  // ── 4. Broadcast SHELTER_UPDATED on the same "aegis-events" channel ─────────
  // This mirrors how SHELTER_ADDED is broadcast, so all connected clients
  // (other admin tabs, user devices) instantly receive the updated shelter data.
  try {
    const broadcastChannel = supabase.channel('aegis-events');
    await broadcastChannel.send({
      type: 'broadcast',
      event: 'SHELTER_UPDATED',
      payload: {
        shelter: {
          id: data.id,
          name: data.name,
          lat: data.lat,
          lng: data.lng,
          capacity: data.capacity,
          radiusMeters: data.radius_meters,
          address: data.address ?? undefined,
          customMessage: data.custom_message ?? undefined,
        },
      },
    });
    // Cleanup channel after send (serverless — no persistent connection)
    await supabase.removeChannel(broadcastChannel);
  } catch (broadcastErr) {
    // Non-fatal: DB update already succeeded; log but don't fail the response
    console.warn('[shelters/update] Broadcast warning:', broadcastErr?.message ?? broadcastErr);
  }

  return res.status(200).json({ success: true, shelter: data });
}
