import axios from 'axios';

/**
 * Fetch active typhoons from JMA Bosai feed
 * @returns {Promise<Array>}
 */
export async function fetchJmaTyphoons() {
  try {
    const response = await axios.get('https://www.jma.go.jp/bosai/typhoon/data/targetTC.json', {
      timeout: 5000,
      headers: {
        'User-Agent': 'ATLAS-Disaster-System/1.0'
      }
    });

    const data = response.data;
    if (!Array.isArray(data)) return [];

    return data.map((t, idx) => ({
      eventId: t.tcNumber || `jma_tc_${idx}`,
      title: t.name || t.name_en || `Typhoon No. ${t.tcNumber}`,
      headline: t.headline || `Tropical cyclone alert issued by JMA`,
      content: t.remark || '',
      typhoonCodes: [t.tcNumber].filter(Boolean),
      reportDatetime: t.dateTime || new Date().toISOString(),
      serial: t.serial || idx + 1
    }));
  } catch (error) {
    return [];
  }
}
