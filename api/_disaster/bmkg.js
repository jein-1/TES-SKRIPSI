import { fetchBmkgEvents } from '../_services/bmkg.js';
import { getOrCache } from '../_services/cache.js';

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
    const data = await getOrCache('bmkg_events_feed', async () => {
      const events = await fetchBmkgEvents();
      return {
        source: 'BMKG Indonesia (TEWS)',
        count: events.length,
        events
      };
    }, 10000);

    res.setHeader('Cache-Control', 'public, max-age=10');
    return res.status(200).json(data);
  } catch (error) {
    console.error('Failed to get /api/disaster/bmkg:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

