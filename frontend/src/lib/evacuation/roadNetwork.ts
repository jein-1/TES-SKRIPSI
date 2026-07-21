/**
 * =============================================================================
 * JARINGAN JALAN KOTA PALU (ROAD NETWORK GRAPH)
 * =============================================================================
 * Data diambil dari OpenStreetMap lewat tools/generate-road-network.mjs
 * dan disimpan di roadNetwork.data.json. Jalankan ulang script itu kalau
 * ingin memperbarui data jalan.
 */

import type { RoadNode, RoadEdge } from './types'
export let roadNodes: RoadNode[] = [];
export let roadEdges: RoadEdge[] = [];

export let roadNetworkLoadFailed = false;

let isLoaded = false;
export async function loadRoadNetwork(): Promise<boolean> {
  if (isLoaded) return true;
  try {
    const res = await fetch('/roadNetwork.data.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    roadNodes = data.roadNodes;
    roadEdges = data.roadEdges;
    isLoaded = true;
    roadNetworkLoadFailed = false;
    return true;
  } catch (err) {
    console.error('ERROR CRITICAL: Gagal memuat data graf evakuasi (roadNetwork.data.json). Pastikan file JSON sudah di-generate di folder public/.', err);
    roadNetworkLoadFailed = true;
    return false;
  }
}
