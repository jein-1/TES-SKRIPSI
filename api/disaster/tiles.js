import { generateRainTiles } from '../services/tileRenderer.js';
import { getOrCache } from '../services/cache.js';

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
    const data = await getOrCache('rain_tiles_metadata', async () => {
      const now = new Date();
      const refTime = now.toISOString().replace(/[-:]/g, '').slice(0, 14);

      return {
        hires: {
          ref_time: refTime,
          tiles: generateRainTiles(refTime, 'observation', 0)
        },
        forecast6: {
          ref_time: refTime,
          tiles: generateRainTiles(refTime, 'forecast', 6)
        },
        forecast15: {
          ref_time: refTime,
          tiles: generateRainTiles(refTime, 'forecast', 15)
        }
      };
    }, 5000);

    res.setHeader('Cache-Control', 'public, max-age=5');
    return res.status(200).json(data);
  } catch (error) {
    console.error('Failed to get /api/disaster/tiles:', error);
    return res.status(500).json({ error: 'Failed to generate rain tiles' });
  }
}
