import { syncDisasterEvents } from '../services/disasterSync.js';

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const result = await syncDisasterEvents();
    return res.status(200).json({
      success: true,
      message: 'Disaster synchronization completed',
      ...result
    });
  } catch (error) {
    console.error('Failed to run disaster sync:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error'
    });
  }
}
