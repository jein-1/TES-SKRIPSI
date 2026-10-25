import { fetchUsgsEarthquakes } from '../_services/usgs.js';
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

  const minMagnitude = parseFloat(req.query.minMag) || 4.0;
  const limit = Math.min(parseInt(req.query.limit, 10) || 30, 100);

  try {
    const data = await getOrCache(`usgs_events_${minMagnitude}_${limit}`, async () => {
      const quakes = await fetchUsgsEarthquakes({ minMagnitude, limit });
      return {
        source: 'USGS Global Seismic Feed',
        minMagnitude,
        count: quakes.length,
        earthquakes: quakes
      };
    }, 15000);

    res.setHeader('Cache-Control', 'public, max-age=15');
    return res.status(200).json(data);
  } catch (error) {
    console.error('Failed to get /api/disaster/usgs:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

