/**
 * Generate rain tile metadata URLs for high-resolution & forecast radar
 * @param {string} refTime - Timestamp string YYYYMMDDHHmmss
 * @param {string} type - 'observation' | 'forecast'
 * @param {number} hours - forecast offset hours
 * @returns {Array}
 */
export function generateRainTiles(refTime, type = 'observation', hours = 0) {
  const tiles = [];
  const baseDate = new Date();

  // Zoom levels 0-6 for precipitation radar
  for (let z = 0; z <= 6; z++) {
    tiles.push({
      url: `/api/disaster/tiles/${type}/${refTime}/${z}/{x}/{y}.png`,
      external_source: `https://tilecache.rainviewer.com/v2/radar/${Math.floor(Date.now() / 1000)}/256/{z}/{x}/{y}/2/1_1.png`,
      time: baseDate.getTime() + (hours * 3600000),
      type: type,
      zoom: z,
      mesh_type: z <= 2 ? '1km' : '250m'
    });
  }

  return tiles;
}
