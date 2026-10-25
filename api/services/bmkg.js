import axios from 'axios';

const BMKG_API = 'https://data.bmkg.go.id/DataMKG/TEWS';

/**
 * Fetch latest earthquake events from BMKG TEWS
 * @returns {Promise<Array>}
 */
export async function fetchBmkgEvents() {
  const events = [];

  try {
    // 1. Fetch autogempa (gempa terbaru)
    const autoRes = await axios.get(`${BMKG_API}/autogempa.json`, { timeout: 6000 });
    const autoGempa = autoRes.data?.Infogempa?.gempa;
    if (autoGempa) {
      events.push({
        eventId: `bmkg_${autoGempa.DateTime || (autoGempa.Tanggal + '_' + autoGempa.Jam).replace(/\s+/g, '')}`,
        magnitude: parseFloat(autoGempa.Magnitude) || autoGempa.Magnitude,
        depth: autoGempa.Kedalaman,
        location: autoGempa.Wilayah,
        coordinates: autoGempa.Coordinates,
        timezone: 'WIB',
        potensi: autoGempa.Potensi,
        shakemap: autoGempa.Shakemap ? `https://data.bmkg.go.id/DataMKG/TEWS/${autoGempa.Shakemap}` : null,
        reportDatetime: autoGempa.DateTime || new Date().toISOString()
      });
    }

    // 2. Fetch gempaterkini (M >= 5.0 terbaru)
    const terkiniRes = await axios.get(`${BMKG_API}/gempaterkini.json`, { timeout: 6000 });
    const listGempa = terkiniRes.data?.Infogempa?.gempa;
    if (Array.isArray(listGempa)) {
      for (const g of listGempa.slice(0, 10)) {
        const id = `bmkg_${g.DateTime || (g.Tanggal + '_' + g.Jam).replace(/\s+/g, '')}`;
        // Hindari duplikasi jika sudah ada dari autogempa
        if (!events.some(e => e.eventId === id)) {
          events.push({
            eventId: id,
            magnitude: parseFloat(g.Magnitude) || g.Magnitude,
            depth: g.Kedalaman,
            location: g.Wilayah,
            coordinates: g.Coordinates,
            timezone: 'WIB',
            potensi: g.Potensi,
            reportDatetime: g.DateTime || new Date().toISOString()
          });
        }
      }
    }
  } catch (error) {
    console.warn('[BMKG] Warning fetching BMKG TEWS:', error.message);
  }

  return events;
}
