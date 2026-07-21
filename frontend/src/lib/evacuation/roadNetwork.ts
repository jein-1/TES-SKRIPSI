/**
 * =============================================================================
 * JARINGAN JALAN KOTA PALU (ROAD NETWORK GRAPH)
 * =============================================================================
 * Data diambil dari OpenStreetMap lewat tools/generate-road-network.mjs
 * dan disimpan di roadNetwork.data.json. Jalankan ulang script itu kalau
 * ingin memperbarui data jalan.
 */

import type { RoadNode, RoadEdge } from './types'
import data from './roadNetwork.data.json'

export const roadNodes: RoadNode[] = (data as any).roadNodes
export const roadEdges: RoadEdge[] = (data as any).roadEdges
