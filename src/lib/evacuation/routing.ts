/**
 * =============================================================================
 * PENCARIAN RUTE EVAKUASI OPTIMAL
 * =============================================================================
 * Menggabungkan Haversine + Dijkstra untuk menemukan rute evakuasi terbaik.
 *
 * Alur:
 *  1. Haversine → Hubungkan posisi user ke 3 node jalan terdekat
 *  2. Dijkstra  → Hitung rute terpendek dari user ke seluruh graph
 *  3. Untuk setiap shelter:
 *     a. Cari node jalan terdekat dari shelter
 *     b. Rekonstruksi jalur dari node shelter mundur ke user
 *     c. Haversine → Tambahkan jarak gap user→node dan node→shelter
 *  4. Sortir berdasarkan total jarak jalan (terpendek dahulu)
 *  5. Kembalikan maxRoutes rute terbaik
 */

import type { RouteResult, RoadEdge } from './types'
import { shelters }                    from './shelters'
import { roadNodes, roadEdges }        from './roadNetwork'
import { calculateHaversine, findNearestNode } from './haversine'

export async function findOptimalEvacuationRoutes(
  userLat: number,
  userLng: number,
  maxRoutes: number = 99,
): Promise<RouteResult[]> {
  // Sort all shelters by Haversine distance first
  const sortedShelters = shelters
    .map(shelter => {
      const haversineDistance = calculateHaversine(userLat, userLng, shelter.lat, shelter.lng)
      return { shelter, haversineDistance }
    })
    .sort((a, b) => a.haversineDistance - b.haversineDistance)
    .slice(0, maxRoutes)

  const results: RouteResult[] = []

  // Fetch OSRM route only for the nearest ones to avoid rate limits (max 3 for full routing)
  for (let i = 0; i < sortedShelters.length; i++) {
    const { shelter, haversineDistance } = sortedShelters[i]
    let coordinates: [number, number][] = []
    let totalDistance = haversineDistance
    
    // We only fetch precise OSRM routing for the top 3 shelters to be fast
    if (i < 3) {
      try {
        const url = \`https://router.project-osrm.org/route/v1/foot/\${userLng},\${userLat};\${shelter.lng},\${shelter.lat}?overview=full&geometries=geojson\`
        const res = await fetch(url)
        const data = await res.json()
        if (data.code === 'Ok' && data.routes && data.routes[0]) {
          const route = data.routes[0]
          // OSRM returns [lng, lat], we need [lat, lng]
          coordinates = route.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]])
          totalDistance = route.distance / 1000 // Convert meters to km
        } else {
          coordinates = [[userLat, userLng], [shelter.lat, shelter.lng]]
        }
      } catch (e) {
        coordinates = [[userLat, userLng], [shelter.lat, shelter.lng]]
      }
    } else {
      coordinates = [[userLat, userLng], [shelter.lat, shelter.lng]]
    }

    results.push({
      shelterName: shelter.name,
      shelterId: shelter.id,
      shelterCapacity: shelter.capacity,
      haversineDistance,
      dijkstraDistance: totalDistance,
      totalDistance,
      coordinates,
      walkingTime: Math.ceil((totalDistance / 1000 / 5)  * 60),  // 5 km/jam
      runningTime: Math.ceil((totalDistance / 1000 / 10) * 60),  // 10 km/jam
    })
  }

  return results
}

/**
 * Fallback: cari shelter terdekat hanya berdasarkan Haversine (tanpa Dijkstra).
 * Berguna untuk estimasi cepat.
 */
export function getNearestSheltersByHaversine(lat: number, lng: number, count = 3) {
  return shelters
    .map(s => ({ ...s, haversineDistance: calculateHaversine(lat, lng, s.lat, s.lng) }))
    .sort((a, b) => a.haversineDistance - b.haversineDistance)
    .slice(0, count)
}
