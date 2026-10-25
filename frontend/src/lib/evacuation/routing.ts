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

/**
 * Ambil irisan geometry jalan dari titik snap (titik proyeksi) menuju target node (edge.from atau edge.to)
 * Hasilnya terurut: mulai dari [snapLat, snapLng] menuju ke target node.
 */
function getEdgeGeometryFromSnapToNode(
  edge: (typeof roadEdges)[number],
  snapLat: number,
  snapLng: number,
  targetNodeId: string
): [number, number][] {
  const geom = edge.geometry
  if (!geom || geom.length < 2) return [[snapLat, snapLng]]

  let bestIdx = 0
  let bestDist = Infinity
  for (let i = 0; i < geom.length; i++) {
    const d = calculateHaversine(snapLat, snapLng, geom[i][0], geom[i][1])
    if (d < bestDist) {
      bestDist = d
      bestIdx = i
    }
  }

  const out: [number, number][] = [[snapLat, snapLng]]
  if (targetNodeId === edge.to) {
    for (let i = bestIdx + 1; i < geom.length; i++) {
      out.push(geom[i])
    }
  } else {
    for (let i = bestIdx - 1; i >= 0; i--) {
      out.push(geom[i])
    }
  }
  return out
}

/**
 * Ambil irisan geometry jalan dari start node (edge.from atau edge.to) menuju titik snap
 * Hasilnya terurut: mulai dari start node menuju ke [snapLat, snapLng].
 */
function getEdgeGeometryFromNodeToSnap(
  edge: (typeof roadEdges)[number],
  startNodeId: string,
  snapLat: number,
  snapLng: number
): [number, number][] {
  const geom = edge.geometry
  if (!geom || geom.length < 2) return [[snapLat, snapLng]]

  let bestIdx = 0
  let bestDist = Infinity
  for (let i = 0; i < geom.length; i++) {
    const d = calculateHaversine(snapLat, snapLng, geom[i][0], geom[i][1])
    if (d < bestDist) {
      bestDist = d
      bestIdx = i
    }
  }

  const out: [number, number][] = []
  if (startNodeId === edge.from) {
    for (let i = 0; i <= bestIdx; i++) {
      out.push(geom[i])
    }
  } else {
    for (let i = geom.length - 1; i >= bestIdx; i--) {
      out.push(geom[i])
    }
  }
  out.push([snapLat, snapLng])
  return out
}

export function findOptimalEvacuationRoutes(
  userLat: number,
  userLng: number,
  maxRoutes: number = 99,
  algorithm: 'dijkstra' | 'haversine' = 'dijkstra',
): RouteResult[] {
  // ── Haversine mode: skip Dijkstra entirely, return straight-line results ──
  if (algorithm === 'haversine') {
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
        const firstGraphNode = pathNodeIds[0]
        const userStub = getEdgeGeometryFromSnapToNode(
          userSnap.edge,
          userSnap.lat,
          userSnap.lng,
          firstGraphNode
        )

        // Potongan akhir: dari node terakhir graf sampai titik shelter (di jalan)
        const lastGraphNode = pathNodeIds[pathNodeIds.length - 1]
        const shelterStub = getEdgeGeometryFromNodeToSnap(
          shelterSnap.edge,
          lastGraphNode,
          shelterSnap.lat,
          shelterSnap.lng
        )

        // Sambungkan posisi user jika berada dalam toleransi akses jalan terdekat (< 25 meter).
        // Jika user berada di dalam bangunan atau gang tak berujung, rute mulai dari jalan terdekat tanpa lompatan liar.
        const startPoint: [number, number][] = userSnap.perpendicularDistKm <= 0.025
          ? [[userLat, userLng]]
          : []

        // Hindari duplikasi titik sambungan antara userStub, roadCoords, dan shelterStub
        const cleanRoadCoords = (roadCoords.length > 0 && userStub.length > 0)
          ? roadCoords.slice(1)
          : roadCoords

        const cleanShelterStub = (cleanRoadCoords.length > 0 && shelterStub.length > 0)
          ? shelterStub.slice(1)
          : shelterStub

        coordinates = [
          ...startPoint,
          ...userStub,
          ...cleanRoadCoords,
          ...cleanShelterStub,
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
    .sort((a, b) => {
      const distA = isFinite(a.totalDistance) ? a.totalDistance : a.haversineDistance;
      const distB = isFinite(b.totalDistance) ? b.totalDistance : b.haversineDistance;
      return distA - distB;
    })
    .slice(0, maxRoutes);
}

/** Fallback: cari shelter terdekat hanya berdasarkan Haversine (tanpa Dijkstra). */
export function getNearestSheltersByHaversine(lat: number, lng: number, count = 3) {
  return shelters
    .map(s => ({ ...s, haversineDistance: calculateHaversine(lat, lng, s.lat, s.lng) }))
    .sort((a, b) => a.haversineDistance - b.haversineDistance)
    .slice(0, count)
}
