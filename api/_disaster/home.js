import { getOrCache } from '../_services/cache.js';
import { fetchBmkgEvents } from '../_services/bmkg.js';
import { fetchUsgsEarthquakes } from '../_services/usgs.js';
import { fetchJmaTyphoons } from '../_services/jma.js';

const HOME_CACHE_TTL = 5 * 1000; // 5 detik cache

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

  try {
    const data = await getOrCache('home_disaster_all', async () => {
      const [bmkgEvents, jmaTyphoons, usgsQuakes] = await Promise.all([
        fetchBmkgEvents().catch(err => {
          console.warn('[Home] BMKG fetch failed:', err.message);
          return [];
        }),
        fetchJmaTyphoons().catch(err => {
          console.warn('[Home] JMA fetch failed:', err.message);
          return [];
        }),
        fetchUsgsEarthquakes({ minMagnitude: 4.0, limit: 20 }).catch(err => {
          console.warn('[Home] USGS fetch failed:', err.message);
          return [];
        })
      ]);

      return {
        timestamp: new Date().toISOString(),
        system: 'ATLAS-NERVE UNIFIED DISASTER HUB',
        informations: [
          // JMA Typhoons
          ...jmaTyphoons.map(t => ({
            type: 'typhoonInformation',
            source: 'JMA',
            event_id: t.eventId,
            title: t.title,
            headline: t.headline,
            content: t.content,
            typhoon_codes: t.typhoonCodes || [],
            isTyphoon: true,
            report_datetime: t.reportDatetime,
            serial: t.serial
          })),
          // BMKG Earthquakes
          ...bmkgEvents.map(e => ({
            type: 'earthquake',
            source: 'BMKG',
            event_id: e.eventId,
            magnitude: e.magnitude,
            depth: e.depth,
            location: e.location,
            coordinates: e.coordinates,
            timezone: e.timezone,
            potensi: e.potensi,
            shakemap: e.shakemap,
            report_datetime: e.reportDatetime
          })),
          // USGS Earthquakes
          ...usgsQuakes.map(q => ({
            type: 'earthquake',
            source: 'USGS',
            event_id: q.eventId,
            magnitude: q.magnitude,
            depth: q.depth,
            location: q.location,
            coordinates: q.coordinates,
            url: q.url,
            report_datetime: q.reportDatetime
          }))
        ]
      };
    }, HOME_CACHE_TTL);

    res.setHeader('Cache-Control', 'public, max-age=5');
    return res.status(200).json(data);
  } catch (error) {
    console.error('Failed to get /api/disaster/home data:', error);
    return res.status(500).json({ error: 'Internal Server Error', informations: [] });
  }
}

