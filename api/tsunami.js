import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_ANON_KEY || 'placeholder'
);

webpush.setVapidDetails(
  'mailto:admin@aegis.com',
  process.env.VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || ''
);

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-Admin-Key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('tsunami_state')
      .select('active, updated_at')
      .eq('id', 1)
      .single();
      
    if (error) {
      return res.status(500).json({ active: false, ts: 0 });
    }
    
    return res.status(200).json({ 
      active: data.active, 
      ts: new Date(data.updated_at).getTime() 
    });
  }

  if (req.method === 'POST') {
    const adminKey = req.headers['x-admin-key'];
    const expectedKey = process.env.ADMIN_KEY || 'aegis2024';

    if (!adminKey || adminKey !== expectedKey) {
      return res.status(403).json({ error: 'Unauthorized: Invalid admin key' });
    }

    const { active } = req.body;
    const now = new Date().toISOString();

    // Update Supabase
    const { error: updateError } = await supabase
      .from('tsunami_state')
      .update({ active, updated_at: now })
      .eq('id', 1);

    if (updateError) {
      return res.status(500).json({ error: 'Database update failed' });
    }

    // Send Web Push Notifications
    if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
      const { data: subs, error: subsError } = await supabase
        .from('push_subscriptions')
        .select('*');

      if (!subsError && subs && subs.length > 0) {
        const payload = JSON.stringify({
          title: active ? 'PERINGATAN TSUNAMI' : 'Peringatan Dicabut',
          body: active
            ? 'Potensi tsunami terdeteksi. Segera evakuasi ke tempat tinggi!'
            : 'Ancaman tsunami telah berakhir. Tetap waspada.',
        });

        // Send pushes in parallel
        await Promise.allSettled(
          subs.map(async (sub) => {
            const pushSub = {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            };
            try {
              await webpush.sendNotification(pushSub, payload);
            } catch (err) {
              if (err.statusCode === 404 || err.statusCode === 410) {
                // Subscription expired, remove from database
                await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
              }
            }
          })
        );
      }
    }

    return res.status(200).json({ 
      success: true, 
      active, 
      ts: new Date(now).getTime() 
    });
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
