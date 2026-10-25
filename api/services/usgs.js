import axios from 'axios';

const USGS_API = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson';

/**
 * Fetch earthquake data from USGS GeoJSON feed
 * @param {object} params
 * @param {number} [params.minMagnitude=4.0]
 * @param {number} [params.limit=30]
 * @returns {Promise<Array>}
 */
export async function fetchUsgsEarthquakes(params = {}) {
  const { minMagnitude = 4.0, limit = 30 } = params;

  try {
    const response = await axios.get(USGS_API, { timeout: 6000 });
    const features = response.data?.features || [];

    return features
      .filter(f => f.properties && f.properties.mag !== null && f.properties.mag >= minMagnitude)
      .slice(0, limit)
      .map(f => {
        const coords = f.geometry?.coordinates || [0, 0, 0];
        return {
          eventId: f.id || f.properties.url,
          magnitude: f.properties.mag,
          depth: `${coords[2]} km`,
          location: f.properties.place,
          coordinates: `${coords[1]},${coords[0]}`,
          url: f.properties.url,
          reportDatetime: new Date(f.properties.time).toISOString()
        };
      });
  } catch (error) {
    console.warn('[USGS] Warning fetching USGS:', error.message);
    return [];
  }
}
