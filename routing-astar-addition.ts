// =============================================================================
// TAMBAHAN untuk routing.ts — Rute via A* (untuk benchmark & mode alternatif)
// Tempel kode di bawah ini ke BAGIAN BAWAH file routing.ts yang sudah ada
// (jangan hapus apapun yang sudah ada, ini murni tambahan).
// =============================================================================

import { aStarTo } from './pathfinding'

export interface RouteBenchmarkResult {
  shelterId: string
  shelterName: string
  dijkstraDistanceKm: number
  aStarDistanceKm: number
  /** Jumlah node yang "selesai diproses" masing-masing algoritma — bukti efisiensi A* untuk skripsi */
  dijkstraExploredNodes: number
  aStarExploredNodes: number
  /** true kalau kedua algoritma sepakat soal jarak terpendek (harus selalu true kalau implementasi benar) */
  distancesMatch: boolean
}

/**
 * Bandingkan Dijkstra vs A* untuk rute user -> satu shelter tertentu.
 * Dipakai untuk keperluan analisis/skripsi (bab perbandingan algoritma),
 * bukan dipanggil di alur evakuasi utama (yang tetap pakai Dijkstra multi-target
 * di findOptimalEvacuationRoutes karena lebih efisien untuk banyak shelter sekaligus).
 */
export function benchmarkRouteToShelter(
  userLat: number,
  userLng: number,
  shelterId: string,
): RouteBenchmarkResult | null {
  ensureGraphInitialized()
  if (!baseAdjacency) return null

  const shelter = shelters.find(s => s.id === shelterId)
  if (!shelter) return null

  const userSnap = snapToNearestRoad(userLat, userLng, roadEdges)
  const shelterSnap = snapToNearestRoad(shelter.lat, shelter.lng, roadEdges)
  if (!userSnap || !shelterSnap) return null

  // ── Siapkan graf sementara dengan node virtual USER & SHELTER ──
  // PENTING: new Map(baseAdjacency) cuma shallow copy — array di dalamnya masih
  // REFERENCE YANG SAMA dengan baseAdjacency. Kalau langsung di-push, baseAdjacency
  // (graf utama yang dipakai ulang di tiap pemanggilan) ikut ter-mutate permanen.
  // Makanya di sini SELALU clone array-nya dulu pakai spread sebelum ditambah.
  const extraAdjacency = new Map(baseAdjacency)
  extraAdjacency.set(USER_NODE_ID, [
    { to: userSnap.edge.from, distance: Math.max(userSnap.distFromStart, MIN_STUB_DISTANCE) },
    { to: userSnap.edge.to, distance: Math.max(userSnap.distToEnd, MIN_STUB_DISTANCE) },
  ])

  const SHELTER_NODE_ID = '__SHELTER_TARGET__'
  for (const nodeId of [shelterSnap.edge.from, shelterSnap.edge.to]) {
    const distToShelter = nodeId === shelterSnap.edge.from ? shelterSnap.distFromStart : shelterSnap.distToEnd
    const existing = extraAdjacency.get(nodeId) ?? baseAdjacency.get(nodeId) ?? []
    extraAdjacency.set(nodeId, [...existing, { to: SHELTER_NODE_ID, distance: Math.max(distToShelter, MIN_STUB_DISTANCE) }])
  }

  // ── Dijkstra (dari user, target ukur = SHELTER_NODE_ID) ──
  const nodesForDijkstra = [...(cachedRoadNodesForDijkstra ?? []), { id: SHELTER_NODE_ID }]
  const dijkstraResult = dijkstraFrom(USER_NODE_ID, nodesForDijkstra as any, extraAdjacency, [USER_NODE_ID, SHELTER_NODE_ID])
  const dijkstraDistanceKm = dijkstraResult.dist.get(SHELTER_NODE_ID) ?? Infinity
  const dijkstraExploredNodes = [...dijkstraResult.dist.values()].filter(d => isFinite(d)).length

  // ── A* (langsung dari user ke SHELTER_NODE_ID, pakai heuristic Haversine) ──
  const coordMap = new Map<string, [number, number]>()
  coordMap.set(USER_NODE_ID, [userLat, userLng])
  coordMap.set(SHELTER_NODE_ID, [shelter.lat, shelter.lng])
  for (const edge of roadEdges) {
    if (edge.geometry?.[0] && !coordMap.has(edge.from)) coordMap.set(edge.from, edge.geometry[0])
    if (edge.geometry?.length && !coordMap.has(edge.to)) coordMap.set(edge.to, edge.geometry[edge.geometry.length - 1])
  }
  const coordOf = (id: string) => coordMap.get(id)

  const aStarResult = aStarTo(USER_NODE_ID, SHELTER_NODE_ID, extraAdjacency, coordOf)

  return {
    shelterId: shelter.id,
    shelterName: shelter.name,
    dijkstraDistanceKm,
    aStarDistanceKm: aStarResult.distance,
    dijkstraExploredNodes,
    aStarExploredNodes: aStarResult.exploredCount,
    distancesMatch: Math.abs(dijkstraDistanceKm - aStarResult.distance) < 0.001,
  }
}

/** Jalankan benchmark ke SEMUA shelter sekaligus — buat tabel perbandingan di skripsi. */
export function benchmarkAllShelters(userLat: number, userLng: number): RouteBenchmarkResult[] {
  return shelters
    .map(s => benchmarkRouteToShelter(userLat, userLng, s.id))
    .filter((r): r is RouteBenchmarkResult => r !== null)
}
