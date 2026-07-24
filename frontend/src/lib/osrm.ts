export interface OsrmRouteData {
  coordinates: [number, number][]; // [lng, lat] format for MapLibre
  duration: number; // seconds
  distance: number; // meters
}

/** Fetch route from primary OSRM public server (foot profile) */
async function tryOsrm(startLng: number, startLat: number, endLng: number, endLat: number): Promise<OsrmRouteData[]> {
  const url = `https://router.project-osrm.org/route/v1/foot/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson&alternatives=true`;
  const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error(`OSRM HTTP ${response.status}`);
  const data = await response.json();
  if (data.code !== 'Ok' || !data.routes?.length) throw new Error('No OSRM routes');
  return data.routes.map((route: any) => ({
    coordinates: route.geometry.coordinates as [number, number][],
    duration: route.duration,
    distance: route.distance,
  }));
}

/** Fallback: Valhalla routing (OpenStreetMap-based, covers Indonesia better) */
async function tryValhalla(startLng: number, startLat: number, endLng: number, endLat: number): Promise<OsrmRouteData[]> {
  const body = {
    locations: [
      { lon: startLng, lat: startLat },
      { lon: endLng, lat: endLat }
    ],
    costing: 'pedestrian',
    directions_options: { units: 'km' }
  };
  const url = `https://valhalla1.openstreetmap.de/route`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(`Valhalla HTTP ${response.status}`);
  const data = await response.json();
  const leg = data?.trip?.legs?.[0];
  if (!leg) throw new Error('No Valhalla route legs');

  // Valhalla returns encoded polyline — decode it
  const coords = decodePolyline(leg.shape, 6);
  return [{
    coordinates: coords,
    duration: data.trip.summary.time,
    distance: data.trip.summary.length * 1000,
  }];
}

/** Decode Google-format polyline (precision 6 for Valhalla) */
function decodePolyline(encoded: string, precision = 5): [number, number][] {
  const coords: [number, number][] = [];
  let index = 0, lat = 0, lng = 0;
  const factor = Math.pow(10, precision);
  while (index < encoded.length) {
    let b, shift = 0, result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lat += (result & 1) ? ~(result >> 1) : result >> 1;
    shift = 0; result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lng += (result & 1) ? ~(result >> 1) : result >> 1;
    // Valhalla: lat/lng → MapLibre needs [lng, lat]
    coords.push([lng / factor, lat / factor]);
  }
  return coords;
}

/**
 * Fetch a real-road walking route between two points.
 * Tries OSRM first, falls back to Valhalla if OSRM fails.
 * Both return coordinates in [lng, lat] format for MapLibre.
 */
export async function fetchOsrmRoute(
  startLng: number,
  startLat: number,
  endLng: number,
  endLat: number
): Promise<OsrmRouteData[]> {
  try {
    const result = await tryOsrm(startLng, startLat, endLng, endLat);
    if (result.length > 0) return result;
  } catch (err) {
    console.warn('[Routing] OSRM failed, trying Valhalla...', err);
  }
  try {
    const result = await tryValhalla(startLng, startLat, endLng, endLat);
    if (result.length > 0) return result;
  } catch (err) {
    console.warn('[Routing] Valhalla failed too:', err);
  }
  return [];
}
