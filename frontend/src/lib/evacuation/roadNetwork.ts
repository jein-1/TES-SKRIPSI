/**
 * =============================================================================
 * JARINGAN JALAN KOTA PALU (ROAD NETWORK GRAPH)
 * =============================================================================
 * Node = persimpangan jalan utama di Kota Palu
 * Edge = ruas jalan antar persimpangan (bidirectional)
 * Bobot edge = jarak Haversine antara dua node (km)
 *
 * Cakupan area:
 *   Lere (Barat) → Besusu Tengah → Talise → Kaombona (Timur) + Palu Selatan
 */

import type { RoadNode, RoadEdge } from './types.ts'
import { calculateHaversine } from './haversine.ts'

export const roadNodes: RoadNode[] = [
  // ── Area Lere (Barat) ─────────────────────────────────────────
  { id: 'N1',  lat: -0.8960, lng: 119.8380 },  // Jl. Pattimura ujung barat
  { id: 'N2',  lat: -0.8940, lng: 119.8410 },  // Persimpangan Jl. Pattimura
  { id: 'N3',  lat: -0.8912, lng: 119.8456 },  // Dekat Masjid Raya (S4)
  { id: 'N4',  lat: -0.8930, lng: 119.8480 },  // Jl. Hasanuddin

  // ── Area Pusat - Besusu ───────────────────────────────────────
  { id: 'N5',  lat: -0.8910, lng: 119.8510 },  // Jl. Sam Ratulangi
  { id: 'N6',  lat: -0.8890, lng: 119.8540 },  // Persimpangan Jl. Gajah Mada
  { id: 'N7',  lat: -0.8870, lng: 119.8570 },  // Jl. Moh. Yamin

  // ── Area Talise ───────────────────────────────────────────────
  { id: 'N8',  lat: -0.8860, lng: 119.8600 },  // Jl. Towua
  { id: 'N9',  lat: -0.8850, lng: 119.8620 },  // Dekat Taman GOR (S1)
  { id: 'N10', lat: -0.8840, lng: 119.8650 },  // Jl. Talise Raya

  // ── Area Kaombona (Timur) ─────────────────────────────────────
  { id: 'N11', lat: -0.8820, lng: 119.8680 },  // Jl. Soekarno Hatta
  { id: 'N12', lat: -0.8800, lng: 119.8710 },  // Persimpangan Kaombona
  { id: 'N13', lat: -0.8780, lng: 119.8750 },  // Menuju Hutan Kota (S3)

  // ── Area Selatan - Palu Selatan ───────────────────────────────
  { id: 'N14', lat: -0.8950, lng: 119.8550 },  // Jl. Juanda
  { id: 'N15', lat: -0.8960, lng: 119.8600 },  // Persimpangan Jl. Basuki Rahmat
  { id: 'N16', lat: -0.8955, lng: 119.8650 },  // Jl. Monginsidi
  { id: 'N17', lat: -0.8960, lng: 119.8700 },  // Jl. Wolter Monginsidi
  { id: 'N18', lat: -0.8970, lng: 119.8720 },  // Dekat Kantor Gubernur (S2)

  // ── Node Penghubung ───────────────────────────────────────────
  { id: 'N19', lat: -0.8900, lng: 119.8470 },  // Penghubung Lere-Pusat
  { id: 'N20', lat: -0.8880, lng: 119.8500 },  // Jl. Diponegoro
  { id: 'N21', lat: -0.8930, lng: 119.8550 },  // Jl. Sudirman
  { id: 'N22', lat: -0.8920, lng: 119.8630 },  // Jl. Ahmad Yani (selatan Talise)
  { id: 'N23', lat: -0.8810, lng: 119.8620 },  // Jl. Talise Pantai (utara)
  { id: 'N24', lat: -0.8835, lng: 119.8560 },  // Penghubung utara pusat
]

/**
 * Membangun daftar edge (ruas jalan) dengan bobot jarak Haversine.
 * Setiap ruas bersifat dua arah (bidirectional).
 */
function buildRoadEdges(): RoadEdge[] {
  const connections: [string, string][] = [
    // Jalur utama barat (Lere) → Pusat
    ['N1', 'N2'], ['N2', 'N3'], ['N2', 'N4'],
    ['N3', 'N19'], ['N4', 'N19'], ['N19', 'N5'],

    // Jalur pusat
    ['N5', 'N6'], ['N5', 'N20'],
    ['N6', 'N7'], ['N6', 'N20'],
    ['N20', 'N24'],

    // Jalur pusat → Talise
    ['N7', 'N8'], ['N7', 'N24'],
    ['N8', 'N9'],
    ['N24', 'N23'], ['N23', 'N9'],

    // Jalur Talise → Kaombona
    ['N9', 'N10'], ['N10', 'N11'],
    ['N10', 'N23'],
    ['N11', 'N12'], ['N12', 'N13'],

    // Jalur selatan (alternatif)
    ['N4', 'N21'], ['N5', 'N21'],
    ['N21', 'N14'], ['N14', 'N15'],
    ['N15', 'N16'], ['N16', 'N17'],
    ['N17', 'N18'],

    // Jalur penghubung selatan-tengah
    ['N6', 'N21'],
    ['N8', 'N22'], ['N15', 'N22'],
    ['N22', 'N9'], ['N16', 'N22'],
    ['N11', 'N17'],
    ['N14', 'N6'],
  ]

  const edges: RoadEdge[] = []
  const nodeMap = new Map(roadNodes.map(n => [n.id, n]))

  for (const [fromId, toId] of connections) {
    const from = nodeMap.get(fromId)
    const to   = nodeMap.get(toId)
    if (!from || !to) continue
    const distance = calculateHaversine(from.lat, from.lng, to.lat, to.lng)
    edges.push({ from: fromId, to: toId,   distance })
    edges.push({ from: toId,   to: fromId, distance })
  }
  return edges
}

// Build edges saat module di-load (sekali saja)
export const roadEdges: RoadEdge[] = buildRoadEdges()
