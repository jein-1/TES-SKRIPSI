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

export function findOptimalEvacuationRoutes(
  userLat: number,
  userLng: number,
  maxRoutes: number = 99,   // Tampilkan SEMUA shelter, sort by distance
): RouteResult[] {
  // Inisialisasi Dijkstra dengan multi-node snapping (3 node terdekat)
  // untuk mencegah backtracking saat snap ke 1 node saja.
  const distances: Record<string, number> = {}
  const previous: Record<string, string | null> = {}
  const unvisited = new Set<string>()

  for (const node of roadNodes) {
    distances[node.id] = Infinity
    previous[node.id] = null
    unvisited.add(node.id)
  }

  const USER_NODE_ID = 'USER_START'
  distances[USER_NODE_ID] = 0
  previous[USER_NODE_ID] = null
  unvisited.add(USER_NODE_ID)

  // Sambungkan user ke 3 node jalan terdekat sebagai edge dinamis
  const nearestNodes = [...roadNodes]
    .map(node => ({ node, dist: calculateHaversine(userLat, userLng, node.lat, node.lng) }))
    .sort((a, b) => a.dist - b.dist)
    .slice(0, 3)

  const userEdges: RoadEdge[] = nearestNodes.map(n => ({
    from: USER_NODE_ID,
    to: n.node.id,
    distance: n.dist,
  }))

  // Jalankan Dijkstra menyapu seluruh graf
  while (unvisited.size > 0) {
    let currentNode: string | null = null
    let currentDist = Infinity
    for (const nodeId of unvisited) {
      if (distances[nodeId] < currentDist) {
        currentDist = distances[nodeId]
        currentNode = nodeId
      }
    }
    if (currentNode === null || currentDist === Infinity) break
    unvisited.delete(currentNode)

    const neighborEdges: { to: string, distance: number }[] =
      currentNode === USER_NODE_ID
        ? userEdges.map(e => ({ to: e.to, distance: e.distance }))
        : roadEdges
            .filter(e => e.from === currentNode || e.to === currentNode)
            .map(e => ({
              to: e.from === currentNode ? e.to : e.from,
              distance: e.distance,
            }))

    for (const edge of neighborEdges) {
      if (!unvisited.has(edge.to)) continue
      const alt = distances[currentNode] + edge.distance
      if (alt < distances[edge.to]) {
        distances[edge.to] = alt
        previous[edge.to] = currentNode
      }
    }
  }

  // Hitung rute ke setiap shelter
  const nodeMap = new Map(roadNodes.map(n => [n.id, n]))
  const allRoutes: RouteResult[] = shelters.map(shelter => {
    const haversineDistance = calculateHaversine(userLat, userLng, shelter.lat, shelter.lng)
    const shelterNode = findNearestNode(shelter.lat, shelter.lng)
    const distNodeToShelter = calculateHaversine(
      shelterNode.lat, shelterNode.lng,
      shelter.lat, shelter.lng,
    )

    // Rekonstruksi rute dari shelterNode ke USER_START
    const path: string[] = []
    let curr: string | null = shelterNode.id
    while (curr !== null && curr !== USER_NODE_ID) {
      path.unshift(curr)
      curr = previous[curr]
    }

    const dijkstraPathCoords: [number, number][] = path
      .map(id => {
        const node = nodeMap.get(id)
        return node ? [node.lat, node.lng] as [number, number] : null
      })
      .filter((c): c is [number, number] => c !== null)

    let dijkstraDistance = distances[shelterNode.id]
    let totalDistance = dijkstraDistance + distNodeToShelter
    let coordinates: [number, number][] = []

    if (!isFinite(dijkstraDistance)) {
      // FALLBACK: Hanya jika graf benar-benar terputus.
      // Jika ada jalan raya, red line AKAN SELALU mengikuti jalan raya (Dijkstra)
      // meskipun jalurnya memutar sangat jauh (misal untuk menghindari sungai/kuala).
      dijkstraDistance = haversineDistance
      totalDistance = haversineDistance
      coordinates = [
        [userLat, userLng],
        [shelter.lat, shelter.lng],
      ]
    } else {
      coordinates = [
        [userLat, userLng],
        ...dijkstraPathCoords,
        [shelter.lat, shelter.lng],
      ]
    }

    return {
      shelterName:      shelter.name,
      shelterId:        shelter.id,
      shelterCapacity:  shelter.capacity,
      haversineDistance,
      dijkstraDistance,
      totalDistance,
      coordinates,
      walkingTime: Math.ceil((totalDistance / 1000 / 5)  * 60),  // 5 km/jam
      runningTime: Math.ceil((totalDistance / 1000 / 10) * 60),  // 10 km/jam
    }
  })

  return allRoutes
    .sort((a, b) => a.haversineDistance - b.haversineDistance)
    .slice(0, maxRoutes)
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
