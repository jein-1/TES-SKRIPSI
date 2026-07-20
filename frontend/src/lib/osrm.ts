export interface OsrmRouteData {
  coordinates: [number, number][];
  duration: number; // seconds
  distance: number; // meters
}

export async function fetchOsrmRoute(
  startLng: number,
  startLat: number,
  endLng: number,
  endLat: number
): Promise<OsrmRouteData[]> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson&alternatives=true`;
    const response = await fetch(url);
    const data = await response.json();
    if (data.routes?.length > 0) {
      return data.routes.map((route: any) => ({
        coordinates: route.geometry.coordinates,
        duration: route.duration,
        distance: route.distance,
      }));
    }
  } catch (error) {
    console.error("OSRM fetch error:", error);
  }
  return [];
}
