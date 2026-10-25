import { supabase } from '../services/supabase.js';
import { getOrCache } from '../services/cache.js';
import { fetchBmkgEvents } from '../services/bmkg.js';
import { fetchUsgsEarthquakes } from '../services/usgs.js';
import { fetchJmaTyphoons } from '../services/jma.js';

const TIMELINE_CACHE_TTL = 10 * 1000; // 10 detik

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);

  try {
    const data = await getOrCache(`timeline_all_${limit}`, async () => {
      let histories = [];

      // 1. Coba ambil dari database Supabase jika tabel sudah dimigrasi
      if (supabase) {
        const { data: dbEvents, error } = await supabase
          .from('disaster_events')
          .select('id, source, type, title, magnitude, depth, location, coordinates, report_datetime')
          .order('report_datetime', { ascending: false })
          .limit(limit);

        if (!error && dbEvents && dbEvents.length > 0) {
          histories = dbEvents.map(e => ({
            event_id: e.id,
            source: e.source,
            type: e.type,
            title: e.title,
            magnitude: e.magnitude,
            depth: e.depth,
            location: e.location,
            coordinates: e.coordinates,
            report_datetime: e.report_datetime
          }));
        }
      }

      // 2. Jika database kosong atau belum terisi, lakukan on-demand live fetch
      if (!histories || histories.length === 0) {
        const [bmkg, usgs, jma] = await Promise.all([
          fetchBmkgEvents().catch(() => []),
          fetchUsgsEarthquakes({ minMagnitude: 4.0, limit: 30 }).catch(() => []),
          fetchJmaTyphoons().catch(() => [])
        ]);

        histories = [
          ...jma.map(t => ({
            type: 'typhoon',
            source: 'JMA',
            event_id: t.eventId,
            title: t.title,
            headline: t.headline,
            report_datetime: t.reportDatetime
          })),
          ...bmkg.map(e => ({
            type: 'earthquake',
            source: 'BMKG',
            event_id: e.eventId,
            magnitude: e.magnitude,
            depth: e.depth,
            location: e.location,
            coordinates: e.coordinates,
            potensi: e.potensi,
            report_datetime: e.reportDatetime
          })),
          ...usgs.map(q => ({
            type: 'earthquake',
            source: 'USGS',
            event_id: q.eventId,
            magnitude: q.magnitude,
            depth: q.depth,
            location: q.location,
            coordinates: q.coordinates,
            report_datetime: q.reportDatetime
          }))
        ];

        histories.sort((a, b) => new Date(b.report_datetime) - new Date(a.report_datetime));
      }

      return { histories: histories.slice(0, limit) };
    }, TIMELINE_CACHE_TTL);

    res.setHeader('Cache-Control', 'public, max-age=10');
    return res.status(200).json(data);
  } catch (error) {
    console.error('Failed to get /api/disaster/timeline data:', error);
    return res.status(500).json({ error: 'Internal Server Error', histories: [] });
  }
}
