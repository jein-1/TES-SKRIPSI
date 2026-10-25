import webpush from 'web-push';
import { supabase } from './supabase.js';
import { fetchBmkgEvents } from './bmkg.js';
import { fetchUsgsEarthquakes } from './usgs.js';
import { fetchJmaTyphoons } from './jma.js';

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  try {
    webpush.setVapidDetails(
      'mailto:admin@aegis.com',
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
  } catch (e) {
    console.warn('[VAPID] WebPush disabled due to invalid/placeholder keys:', e.message);
  }
}

/**
 * Sync latest disaster data from all providers into Supabase
 * and trigger automatic tsunami alert if detected
 * @returns {Promise<object>}
 */
export async function syncDisasterEvents() {
  const [bmkgEvents, usgsQuakes, jmaTyphoons] = await Promise.all([
    fetchBmkgEvents().catch(err => {
      console.warn('[Sync] BMKG fetch failed:', err.message);
      return [];
    }),
    fetchUsgsEarthquakes({ minMagnitude: 4.0, limit: 30 }).catch(err => {
      console.warn('[Sync] USGS fetch failed:', err.message);
      return [];
    }),
    fetchJmaTyphoons().catch(err => {
      console.warn('[Sync] JMA fetch failed:', err.message);
      return [];
    })
  ]);

  const allRecords = [];
  let tsunamiTriggered = false;

  // 1. Process BMKG Events
  for (const e of bmkgEvents) {
    allRecords.push({
      id: e.eventId,
      source: 'BMKG',
      type: 'earthquake',
      title: `Gempa ${e.magnitude} M - ${e.location}`,
      magnitude: typeof e.magnitude === 'number' ? e.magnitude : parseFloat(e.magnitude) || 0,
      depth: e.depth || '',
      location: e.location || '',
      coordinates: e.coordinates || '',
      payload: e,
      report_datetime: e.reportDatetime
    });

    // Cek potensi tsunami: ada kata tsunami tapi bukan "tidak berpotensi tsunami"
    const potensiStr = String(e.potensi || '').toLowerCase();
    const isTsunamiThreat = potensiStr.includes('tsunami') && !potensiStr.includes('tidak berpotensi');

    if (isTsunamiThreat && supabase) {
      tsunamiTriggered = true;
      try {
        await triggerAutoTsunamiAlert(e);
      } catch (err) {
        console.error('[Sync] Error triggering auto tsunami alert:', err.message);
      }
    }
  }

  // 2. Process USGS Quakes
  for (const q of usgsQuakes) {
    allRecords.push({
      id: q.eventId,
      source: 'USGS',
      type: 'earthquake',
      title: `M ${q.magnitude} - ${q.location}`,
      magnitude: typeof q.magnitude === 'number' ? q.magnitude : parseFloat(q.magnitude) || 0,
      depth: q.depth || '',
      location: q.location || '',
      coordinates: q.coordinates || '',
      payload: q,
      report_datetime: q.reportDatetime
    });
  }

  // 3. Process JMA Typhoons
  for (const t of jmaTyphoons) {
    allRecords.push({
      id: t.eventId,
      source: 'JMA',
      type: 'typhoon',
      title: t.title,
      magnitude: null,
      depth: null,
      location: 'Pasifik Barat / Asia',
      coordinates: '',
      payload: t,
      report_datetime: t.reportDatetime
    });
  }

  // Simpan/Upsert ke Supabase jika client tersedia
  let savedCount = 0;
  if (supabase && allRecords.length > 0) {
    const { data, error } = await supabase
      .from('disaster_events')
      .upsert(allRecords, { onConflict: 'id', ignoreDuplicates: true });

    if (!error) {
      savedCount = allRecords.length;
    } else {
      console.warn('[Sync] Supabase upsert note:', error.message);
    }
  }

  return {
    synchronized_at: new Date().toISOString(),
    total_fetched: allRecords.length,
    saved_count: savedCount,
    tsunami_triggered: tsunamiTriggered,
    counts: {
      bmkg: bmkgEvents.length,
      usgs: usgsQuakes.length,
      jma: jmaTyphoons.length
    }
  };
}

/**
 * Trigger Tsunami Emergency State & Web Push automatically
 */
async function triggerAutoTsunamiAlert(gempa) {
  const now = new Date().toISOString();

  // 1. Update tsunami_state ke active
  await supabase
    .from('tsunami_state')
    .update({ active: true, updated_at: now })
    .eq('id', 1);

  // 2. Kirim Web Push Notification jika kredensial VAPID ada
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('*');

    if (subs && subs.length > 0) {
      const payload = JSON.stringify({
        title: 'PERINGATAN DINI TSUNAMI OTOMATIS (BMKG)',
        body: `Gempa ${gempa.magnitude} M di ${gempa.location}. ${gempa.potensi || 'Potensi Tsunami Terdeteksi!'} Segera evakuasi!`
      });

      await Promise.allSettled(
        subs.map(async (sub) => {
          try {
            await webpush.sendNotification({
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth }
            }, payload);
          } catch (err) {
            if (err.statusCode === 404 || err.statusCode === 410) {
              await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
            }
          }
        })
      );
    }
  }
}
