/**
 * =============================================================================
 * ALGORITMA DIJKSTRA
 * =============================================================================
 * Mencari rute terpendek (shortest path) pada graf berbobot jaringan jalan.
 *
 * Input:
 *   - startNodeId: ID node awal (node jalan terdekat dari posisi user)
 *   - endNodeId:   ID node tujuan (node jalan terdekat dari shelter)
 *
 * Proses:
 *   1. Inisialisasi: semua node jarak = ∞, kecuali start = 0
 *   2. Pilih node dengan jarak terkecil yang belum dikunjungi
 *   3. Untuk setiap tetangga: jarak_baru = jarak_saat_ini + bobot_edge
 *   4. Jika jarak_baru < jarak_lama → update (relaxation)
 *   5. Ulangi sampai node tujuan dicapai
 *
 * Output:
 *   - distance:    total jarak rute via jalan (km)
 *   - path:        daftar node ID yang dilalui
 *   - coordinates: daftar koordinat [lat, lng] rute
 */

import type { DijkstraResult } from './types'
import { roadNodes, roadEdges } from './roadNetwork'

export function dijkstra(startNodeId: string, endNodeId: string): DijkstraResult {
  // Langkah 1: Inisialisasi
  const distances: Record<string, number> = {}
  const previous: Record<string, string | null> = {}
  const unvisited = new Set<string>()

  for (const node of roadNodes) {
    distances[node.id] = node.id === startNodeId ? 0 : Infinity
    previous[node.id] = null
    unvisited.add(node.id)
  }

  // Langkah 2-4: Iterasi Dijkstra
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
    if (currentNode === endNodeId) break
    unvisited.delete(currentNode)

    const neighborEdges = roadEdges.filter(e => e.from === currentNode)
    for (const edge of neighborEdges) {
      if (!unvisited.has(edge.to)) continue
      const alt = distances[currentNode] + edge.distance
      if (alt < distances[edge.to]) {
        distances[edge.to] = alt
        previous[edge.to] = currentNode
      }
    }
  }

  // Langkah 5: Rekonstruksi path
  const path: string[] = []
  let current: string | null = endNodeId
  while (current !== null) {
    path.unshift(current)
    current = previous[current]
  }

  const nodeMap = new Map(roadNodes.map(n => [n.id, n]))
  const coordinates: [number, number][] = path
    .map(id => {
      const node = nodeMap.get(id)
      return node ? [node.lat, node.lng] as [number, number] : null
    })
    .filter((c): c is [number, number] => c !== null)

  return { distance: distances[endNodeId] ?? Infinity, path, coordinates }
}
