import { fetchBmkgEvents } from './api/services/bmkg.js';
import { fetchUsgsEarthquakes } from './api/services/usgs.js';
import { fetchJmaTyphoons } from './api/services/jma.js';
import { generateRainTiles } from './api/services/tileRenderer.js';
import { syncDisasterEvents } from './api/services/disasterSync.js';

async function runTests() {
  console.log('--- Testing BMKG TEWS Service ---');
  try {
    const bmkg = await fetchBmkgEvents();
    console.log(`[PASS] BMKG Events fetched: ${bmkg.length}`);
    if (bmkg.length > 0) {
      console.log('Sample BMKG Event:', {
        eventId: bmkg[0].eventId,
        magnitude: bmkg[0].magnitude,
        location: bmkg[0].location,
        potensi: bmkg[0].potensi
      });
    }
  } catch (err) {
    console.error('[FAIL] BMKG:', err.message);
  }

  console.log('\n--- Testing USGS Earthquake Service ---');
  try {
    const usgs = await fetchUsgsEarthquakes({ minMagnitude: 4.5, limit: 5 });
    console.log(`[PASS] USGS Earthquakes fetched: ${usgs.length}`);
    if (usgs.length > 0) {
      console.log('Sample USGS Event:', {
        eventId: usgs[0].eventId,
        magnitude: usgs[0].magnitude,
        location: usgs[0].location
      });
    }
  } catch (err) {
    console.error('[FAIL] USGS:', err.message);
  }

  console.log('\n--- Testing JMA Typhoon Service ---');
  try {
    const jma = await fetchJmaTyphoons();
    console.log(`[PASS] JMA Typhoons fetched: ${jma.length}`);
  } catch (err) {
    console.error('[FAIL] JMA:', err.message);
  }

  console.log('\n--- Testing Rain Tile Generator ---');
  try {
    const tiles = generateRainTiles('20261025110000', 'observation', 0);
    console.log(`[PASS] Rain tiles generated: ${tiles.length} levels`);
  } catch (err) {
    console.error('[FAIL] Tiles:', err.message);
  }

  console.log('\n--- Testing Disaster Sync Engine ---');
  try {
    const syncRes = await syncDisasterEvents();
    console.log('[PASS] Sync Result:', syncRes);
  } catch (err) {
    console.error('[FAIL] Disaster Sync:', err.message);
  }

  console.log('\nAll tests completed.');
}

runTests();
