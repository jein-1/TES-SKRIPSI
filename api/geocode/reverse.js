// In-memory rate limiting map
// Key: IP Address, Value: Timestamp of last request
const rateLimitMap = new Map();
const RATE_LIMIT_MS = 1500; // 1.5 seconds

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Rate Limiting
  // Get IP address (Vercel standard)
  const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown-ip';
  const now = Date.now();

  if (rateLimitMap.has(ip)) {
    const lastRequest = rateLimitMap.get(ip);
    if (now - lastRequest < RATE_LIMIT_MS) {
      return res.status(429).json({ 
        error: 'Too Many Requests', 
        retryAfterMs: RATE_LIMIT_MS - (now - lastRequest) 
      });
    }
  }

  rateLimitMap.set(ip, now);

  // Periodic cleanup of the map to prevent memory leak
  if (rateLimitMap.size > 1000) {
    const oldestAllowed = now - 60000;
    for (const [key, timestamp] of rateLimitMap.entries()) {
      if (timestamp < oldestAllowed) {
        rateLimitMap.delete(key);
      }
    }
  }

  const { lat, lng } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ error: 'Bad Request: Missing lat or lng parameters' });
  }

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'AegisResponse-PaluTsunami/1.0 (kontak: admin@aegis-tsunami.local)',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7' // Prefer Indonesian translation if available
      }
    });

    if (!response.ok) {
      throw new Error(`Nominatim responded with status: ${response.status}`);
    }

    const data = await response.json();

    // Simplify the payload for the client
    let road = '';
    let suburb = '';

    if (data.address) {
      road = data.address.road || '';
      // Fallback chain for suburb/village representation
      suburb = data.address.suburb || data.address.village || data.address.city || data.address.town || data.address.county || '';
    }

    const simplified = {
      displayName: data.display_name || 'Alamat tidak diketahui',
      road,
      suburb
    };

    return res.status(200).json(simplified);
  } catch (error) {
    console.error('Nominatim Geocode Error:', error);
    return res.status(502).json({ error: 'Bad Gateway: Failed to fetch from upstream geocoding service' });
  }
}
