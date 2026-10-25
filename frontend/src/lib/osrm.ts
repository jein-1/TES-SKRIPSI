export interface OsrmStep {
  maneuver: {
    type: string;
    modifier?: string;
  };
  name: string;
  distance: number;
  duration: number;
}

export interface OsrmRouteData {
  coordinates: [number, number][]; // [lng, lat] format for MapLibre
  duration: number; // seconds
  distance: number; // meters
  steps?: OsrmStep[];
}

/** Fetch route from primary OSRM public server (foot profile) */
async function tryOsrm(startLng: number, startLat: number, endLng: number, endLat: number): Promise<OsrmRouteData[]> {
  const url = `https://router.project-osrm.org/route/v1/foot/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson&steps=true&alternatives=true`;
  const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error(`OSRM HTTP ${response.status}`);
  const data = await response.json();
  if (data.code !== 'Ok' || !data.routes?.length) throw new Error('No OSRM routes');
  return data.routes.map((route: any) => ({
    coordinates: route.geometry.coordinates as [number, number][],
    duration: route.duration,
    distance: route.distance,
    steps: route.legs?.[0]?.steps?.map((s: any) => ({
      maneuver: {
        type: s.maneuver?.type || 'turn',
        modifier: s.maneuver?.modifier || 'straight',
      },
      name: s.name || '',
      distance: s.distance || 0,
      duration: s.duration || 0,
    })) || [],
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
  let routes: OsrmRouteData[] = [];
  try {
    const result = await tryOsrm(startLng, startLat, endLng, endLat);
    if (result.length > 0) routes = result;
  } catch (err) {
    console.warn('[Routing] OSRM failed, trying Valhalla...', err);
  }
  if (routes.length === 0) {
    try {
      const result = await tryValhalla(startLng, startLat, endLng, endLat);
      if (result.length > 0) routes = result;
    } catch (err) {
      console.warn('[Routing] Valhalla failed too:', err);
    }
  }

  if (routes.length > 0) {
    return routes.map(r => {
      const coords = [...r.coordinates];
      if (coords.length > 0) {
        const first = coords[0];
        // Connect start position to road entrance if not exactly identical
        if (Math.hypot(first[0] - startLng, first[1] - startLat) > 0.00002) {
          coords.unshift([startLng, startLat]);
        }
        const last = coords[coords.length - 1];
        // Connect road exit directly into shelter position
        if (Math.hypot(last[0] - endLng, last[1] - endLat) > 0.00002) {
          coords.push([endLng, endLat]);
        }
      } else {
        coords.push([startLng, startLat], [endLng, endLat]);
      }
      return { ...r, coordinates: coords };
    });
  }

  return [];
}
