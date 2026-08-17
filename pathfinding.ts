/**
 * =============================================================================
 * PATHFINDING — Dijkstra (priority queue) + A* (A-star)
 * =============================================================================
 * dijkstraFrom  : single-source ke SEMUA node sekaligus. Dipakai saat perlu
 *                 jarak ke banyak tujuan sekaligus (misal: ke semua shelter).
 * aStarTo       : single-source ke SATU tujuan spesifik, pakai heuristic
 *                 (jarak lurus/Haversine ke tujuan) supaya eksplorasi lebih
 *                 terarah dan biasanya berhenti lebih cepat daripada Dijkstra.
 *                 Cocok dipakai kalau rute dihitung satu-per-satu per shelter.
 */

import type { RoadEdge, RoadNode } from './types'

export interface AdjacencyEntry {
  to: string
  distance: number
}

export function buildAdjacency(roadEdges: RoadEdge[]): Map<string, AdjacencyEntry[]> {
  const adjacency = new Map<string, AdjacencyEntry[]>()
  for (const edge of roadEdges) {
    if (!adjacency.has(edge.from)) adjacency.set(edge.from, [])
    adjacency.get(edge.from)!.push({ to: edge.to, distance: edge.distance })
  }
  return adjacency
}

class MinHeap<T extends { f: number }> {
  private a: T[] = []
  size() { return this.a.length }
  push(item: T) {
    this.a.push(item)
    let i = this.a.length - 1
    while (i > 0) {
      const p = (i - 1) >> 1
      if (this.a[p].f <= this.a[i].f) break
      ;[this.a[p], this.a[i]] = [this.a[i], this.a[p]]
      i = p
    }
  }
  pop(): T {
    const top = this.a[0]
    const last = this.a.pop()!
    if (this.a.length) {
      this.a[0] = last
      let i = 0
      while (true) {
        const l = 2 * i + 1, r = 2 * i + 2
        let smallest = i
        if (l < this.a.length && this.a[l].f < this.a[smallest].f) smallest = l
        if (r < this.a.length && this.a[r].f < this.a[smallest].f) smallest = r
        if (smallest === i) break
        ;[this.a[smallest], this.a[i]] = [this.a[i], this.a[smallest]]
        i = smallest
      }
    }
    return top
  }
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export interface DijkstraFromResult {
  dist: Map<string, number>
  prev: Map<string, string | null>
}

/** Single-source shortest path dari startId ke SEMUA node lain sekaligus. */
export function dijkstraFrom(
  startId: string,
  roadNodes: RoadNode[],
  adjacency: Map<string, AdjacencyEntry[]>,
  extraNodeIds: string[] = [],
): DijkstraFromResult {
  const dist = new Map<string, number>()
  const prev = new Map<string, string | null>()

  for (const n of roadNodes) { dist.set(n.id, Infinity); prev.set(n.id, null) }
  for (const id of extraNodeIds) { dist.set(id, Infinity); prev.set(id, null) }
  dist.set(startId, 0)

  const pq = new MinHeap<{ id: string; f: number }>()
  pq.push({ id: startId, f: 0 })
  const visited = new Set<string>()

  while (pq.size()) {
    const { id } = pq.pop()
    if (visited.has(id)) continue
    visited.add(id)
    const d = dist.get(id)!
    const neighbors = adjacency.get(id) || []
    for (const { to, distance } of neighbors) {
      if (visited.has(to)) continue
      const alt = d + distance
      if (alt < (dist.get(to) ?? Infinity)) {
        dist.set(to, alt)
        prev.set(to, id)
        pq.push({ id: to, f: alt })
      }
    }
  }
  return { dist, prev }
}

export interface AStarResult {
  distance: number
  prev: Map<string, string | null>
  /** Jumlah node yang dieksplorasi — indikator efisiensi, berguna untuk benchmark vs Dijkstra */
  exploredCount: number
}

/**
 * A* — cari jarak+jalur terpendek dari startId ke SATU goalId spesifik.
 * `coordOf(id)` harus mengembalikan [lat, lng] node tsb (termasuk node virtual
 * seperti titik user/shelter hasil snapping — sediakan koordinatnya lewat
 * `extraCoords`).
 */
export function aStarTo(
  startId: string,
  goalId: string,
  adjacency: Map<string, AdjacencyEntry[]>,
  coordOf: (id: string) => [number, number] | undefined,
): AStarResult {
  const goalCoord = coordOf(goalId)
  const h = (id: string): number => {
    if (!goalCoord) return 0
    const c = coordOf(id)
    if (!c) return 0
    return haversineKm(c[0], c[1], goalCoord[0], goalCoord[1])
  }

  const gScore = new Map<string, number>([[startId, 0]])
  const prev = new Map<string, string | null>([[startId, null]])
  const pq = new MinHeap<{ id: string; f: number }>()
  pq.push({ id: startId, f: h(startId) })
  const visited = new Set<string>()
  let exploredCount = 0

  while (pq.size()) {
    const { id } = pq.pop()
    if (visited.has(id)) continue
    visited.add(id)
    exploredCount++
    if (id === goalId) break // early exit — keunggulan utama A* dibanding Dijkstra

    const neighbors = adjacency.get(id) || []
    for (const { to, distance } of neighbors) {
      if (visited.has(to)) continue
      const alt = (gScore.get(id) ?? Infinity) + distance
      if (alt < (gScore.get(to) ?? Infinity)) {
        gScore.set(to, alt)
        prev.set(to, id)
        pq.push({ id: to, f: alt + h(to) })
      }
    }
  }

  return {
    distance: gScore.get(goalId) ?? Infinity,
    prev,
    exploredCount,
  }
}
