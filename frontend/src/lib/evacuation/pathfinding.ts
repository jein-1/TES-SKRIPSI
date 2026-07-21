/**
 * =============================================================================
 * PATHFINDING — Dijkstra dengan Priority Queue (Min-Heap)
 * =============================================================================
 * Menggantikan implementasi Dijkstra lama yang O(V²) (linear scan tiap iterasi).
 * Versi ini O((V+E) log V) — perlu untuk graf jalan asli yang jauh lebih besar
 * dari graf hardcoded lama (24 node).
 */

import type { RoadEdge, RoadNode } from './types'

export interface AdjacencyEntry {
  to: string
  distance: number
}

/** Bangun adjacency list sekali saja dari roadEdges (hindari filter linear berulang). */
export function buildAdjacency(roadEdges: RoadEdge[]): Map<string, AdjacencyEntry[]> {
  const adjacency = new Map<string, AdjacencyEntry[]>()
  for (const edge of roadEdges) {
    if (!adjacency.has(edge.from)) adjacency.set(edge.from, [])
    adjacency.get(edge.from)!.push({ to: edge.to, distance: edge.distance })
  }
  return adjacency
}

class MinHeap {
  private a: { id: string; dist: number }[] = []
  size() { return this.a.length }
  push(item: { id: string; dist: number }) {
    this.a.push(item)
    let i = this.a.length - 1
    while (i > 0) {
      const p = (i - 1) >> 1
      if (this.a[p].dist <= this.a[i].dist) break
      ;[this.a[p], this.a[i]] = [this.a[i], this.a[p]]
      i = p
    }
  }
  pop() {
    const top = this.a[0]
    const last = this.a.pop()!
    if (this.a.length) {
      this.a[0] = last
      let i = 0
      while (true) {
        const l = 2 * i + 1, r = 2 * i + 2
        let smallest = i
        if (l < this.a.length && this.a[l].dist < this.a[smallest].dist) smallest = l
        if (r < this.a.length && this.a[r].dist < this.a[smallest].dist) smallest = r
        if (smallest === i) break
        ;[this.a[smallest], this.a[i]] = [this.a[i], this.a[smallest]]
        i = smallest
      }
    }
    return top
  }
}

export interface DijkstraFromResult {
  dist: Map<string, number>
  prev: Map<string, string | null>
}

/**
 * Single-source shortest path dari startId ke SEMUA node lain sekaligus.
 * `extraNodeIds` & `extraAdjacency` dipakai untuk menyisipkan node virtual
 * (misal titik snapping user) tanpa harus memodifikasi graf asli.
 */
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

  const pq = new MinHeap()
  pq.push({ id: startId, dist: 0 })
  const visited = new Set<string>()

  while (pq.size()) {
    const { id, dist: d } = pq.pop()
    if (visited.has(id)) continue
    visited.add(id)
    const neighbors = adjacency.get(id) || []
    for (const { to, distance } of neighbors) {
      if (visited.has(to)) continue
      const alt = d + distance
      if (alt < (dist.get(to) ?? Infinity)) {
        dist.set(to, alt)
        prev.set(to, id)
        pq.push({ id: to, dist: alt })
      }
    }
  }
  return { dist, prev }
}
