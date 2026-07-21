/**
 * =============================================================================
 * PENCARIAN RUTE EVAKUASI OPTIMAL — versi graf jalan asli (OpenStreetMap)
 * =============================================================================
 * Alur:
 *  1. Snap posisi user & tiap shelter ke titik terdekat DI SEPANJANG JALAN
 *     (bukan cuma ke persimpangan terdekat) — lihat snapping.ts
 *  2. Dijkstra (priority queue, pathfinding.ts) dari titik user ke semua
 *     persimpangan sekali jalan
 *  3. Untuk tiap shelter, ambil jarak terpendek + rekonstruksi jalur
 *  4. Gambar rute pakai geometry asli tiap ruas jalan (mengikuti jalan
 *     sungguhan), bukan garis lurus antar persimpangan
 */

import type { RouteResult } from './types'
import { shelters } from './shelters'
import { roadEdges } from './roadNetwork'
import { calculateHaversine } from './haversine'
import { buildAdjacency, dijkstraFrom, type AdjacencyEntry } from './pathfinding'
import { snapToNearestRoad, type SnapResult } from './snapping'

let baseAdjacency: Map<string, AdjacencyEntry[]> | null = null;
let edgeLookup: Map<string, (typeof roadEdges)[number]> | null = null;
let cachedRoadNodesForDijkstra: { id: string }[] | null = null;

function ensureGraphInitialized() {
  if (baseAdjacency) return;
  if (roadEdges.length === 0) return;
  
  baseAdjacency = buildAdjacency(roadEdges);
  edgeLookup = new Map();
  for (const e of roadEdges) edgeLookup!.set(`${e.from}->${e.to}`, e);
  cachedRoadNodesForDijkstra = [...new Set(roadEdges.flatMap(e => [e.from, e.to]))].map(id => ({ id }));
}

const USER_NODE_ID = '__USER_START__'
const MIN_STUB_DISTANCE = 0.001 // km, hindari edge berbobot 0 di Dijkstra

/** Ambil potongan geometry dari awal sampai jarak `keepKm` sepanjang edge. */
function trimGeometryFromStart(geom: [number, number][], edgeDistance: number, keepKm: number, endPoint: [number, number]): [number, number][] {
  if (geom.length < 2 || edgeDistance <= 0) return [endPoint]
  const out: [number, number][] = [geom[0]]
  let cumulative = 0
  for (let i = 1; i < geom.length; i++) {
    const segLen = calculateHaversine(geom[i - 1][0], geom[i - 1][1], geom[i][0], geom[i][1])
    if (cumulative + segLen > keepKm) break
    out.push(geom[i])
    cumulative += segLen
  }
  out.push(endPoint)
  return out
}

/** Ambil potongan geometry dari jarak `fromEndKm` (dihitung dari ujung akhir) sampai akhir. */
function trimGeometryFromEnd(geom: [number, number][], edgeDistance: number, fromEndKm: number, startPoint: [number, number]): [number, number][] {
  if (geom.length < 2 || edgeDistance <= 0) return [startPoint]
  const out: [number, number][] = [startPoint]
  let cumulative = 0
  for (let i = geom.length - 2; i >= 0; i--) {
    const segLen = calculateHaversine(geom[i + 1][0], geom[i + 1][1], geom[i][0], geom[i][1])
    if (cumulative + segLen > fromEndKm) break
    out.push(geom[i])
    cumulative += segLen
  }
  return out
}

export function findOptimalEvacuationRoutes(
  userLat: number,
  userLng: number,
  maxRoutes: number = 99,
): RouteResult[] {
  ensureGraphInitialized();
  if (!baseAdjacency || !edgeLookup || !cachedRoadNodesForDijkstra) {
    return getNearestSheltersByHaversine(userLat, userLng, maxRoutes).map(s => ({
      shelterName: s.name,
      shelterId: s.id,
      shelterCapacity: s.capacity,
      haversineDistance: s.haversineDistance,
      dijkstraDistance: Infinity,
      totalDistance: s.haversineDistance,
      coordinates: [[userLat, userLng], [s.lat, s.lng]],
      walkingTime: Math.ceil((s.haversineDistance / 5) * 60),
      runningTime: Math.ceil((s.haversineDistance / 10) * 60),
    }));
  }

  const userSnap = snapToNearestRoad(userLat, userLng, roadEdges)

  let dist = new Map<string, number>()
  let prev = new Map<string, string | null>()

  if (userSnap) {
    const extraAdjacency = new Map(baseAdjacency)
    const userEdges: AdjacencyEntry[] = [
      { to: userSnap.edge.from, distance: Math.max(userSnap.distFromStart, MIN_STUB_DISTANCE) },
      { to: userSnap.edge.to, distance: Math.max(userSnap.distToEnd, MIN_STUB_DISTANCE) },
    ]
    extraAdjacency.set(USER_NODE_ID, userEdges)

    const result = dijkstraFrom(USER_NODE_ID, cachedRoadNodesForDijkstra as any, extraAdjacency, [USER_NODE_ID])
    dist = result.dist
    prev = result.prev
  }

  const allRoutes: RouteResult[] = shelters.map(shelter => {
    const haversineDistance = calculateHaversine(userLat, userLng, shelter.lat, shelter.lng)
    const shelterSnap: SnapResult | null = snapToNearestRoad(shelter.lat, shelter.lng, roadEdges)

    let dijkstraDistance = Infinity
    let coordinates: [number, number][] = []

    if (userSnap && shelterSnap) {
      const distViaFrom = (dist.get(shelterSnap.edge.from) ?? Infinity) + shelterSnap.distFromStart
      const distViaTo = (dist.get(shelterSnap.edge.to) ?? Infinity) + shelterSnap.distToEnd
      const viaFrom = distViaFrom <= distViaTo
      dijkstraDistance = viaFrom ? distViaFrom : distViaTo

      if (isFinite(dijkstraDistance)) {
        const endNodeId = viaFrom ? shelterSnap.edge.from : shelterSnap.edge.to

        // Rekonstruksi urutan node dari USER_NODE_ID sampai endNodeId
        const pathNodeIds: string[] = []
        let curr: string | null = endNodeId
        let guard = 0
        while (curr !== null && curr !== USER_NODE_ID && guard < 5000) {
          pathNodeIds.unshift(curr)
          curr = prev.get(curr) ?? null
          guard++
        }

        // Gabungkan geometry tiap edge sepanjang jalur (mengikuti jalan asli)
        const roadCoords: [number, number][] = []
        for (let i = 0; i < pathNodeIds.length - 1; i++) {
          const edge = edgeLookup!.get(`${pathNodeIds[i]}->${pathNodeIds[i + 1]}`)
          if (edge?.geometry) {
            const segment = roadCoords.length > 0 ? edge.geometry.slice(1) : edge.geometry
            roadCoords.push(...segment)
          }
        }

        // Potongan awal: dari titik user (di jalan) sampai node pertama graf
        const userStub = trimGeometryFromStart(
          userSnap.edge.geometry ?? [],
          userSnap.edge.distance,
          Math.min(userSnap.distFromStart, userSnap.distToEnd),
          [userSnap.lat, userSnap.lng],
        )

        // Potongan akhir: dari node terakhir graf sampai titik shelter (di jalan)
        const shelterStub = viaFrom
          ? trimGeometryFromStart(shelterSnap.edge.geometry ?? [], shelterSnap.edge.distance, shelterSnap.distFromStart, [shelterSnap.lat, shelterSnap.lng])
          : trimGeometryFromEnd(shelterSnap.edge.geometry ?? [], shelterSnap.edge.distance, shelterSnap.distToEnd, [shelterSnap.lat, shelterSnap.lng])

        coordinates = [
          [userLat, userLng],
          ...userStub,
          ...roadCoords,
          ...shelterStub,
          [shelter.lat, shelter.lng],
        ]
      }
    }

    const finalDijkstraDistance = isFinite(dijkstraDistance) ? dijkstraDistance : haversineDistance
    const totalDistance = finalDijkstraDistance
    if (!isFinite(dijkstraDistance) || coordinates.length === 0) {
      // Fallback: graf terputus / tidak ada jalan sama sekali di dekat titik ini
      coordinates = [[userLat, userLng], [shelter.lat, shelter.lng]]
    }

    return {
      shelterName: shelter.name,
      shelterId: shelter.id,
      shelterCapacity: shelter.capacity,
      haversineDistance,
      dijkstraDistance: finalDijkstraDistance,
      totalDistance,
      coordinates,
      walkingTime: Math.ceil((totalDistance / 5) * 60), // 5 km/jam
      runningTime: Math.ceil((totalDistance / 10) * 60), // 10 km/jam
    }
  })

  return allRoutes
    .sort((a, b) => a.haversineDistance - b.haversineDistance)
    .slice(0, maxRoutes)
}

/** Fallback: cari shelter terdekat hanya berdasarkan Haversine (tanpa Dijkstra). */
export function getNearestSheltersByHaversine(lat: number, lng: number, count = 3) {
  return shelters
    .map(s => ({ ...s, haversineDistance: calculateHaversine(lat, lng, s.lat, s.lng) }))
    .sort((a, b) => a.haversineDistance - b.haversineDistance)
    .slice(0, count)
}
