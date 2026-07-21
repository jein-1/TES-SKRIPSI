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

let isLoaded = false;
export async function loadRoadNetwork(): Promise<void> {
  if (isLoaded) return;
  try {
    const res = await fetch('/roadNetwork.data.json');
    if (!res.ok) throw new Error('Failed to load road network');
    const data = await res.json();
    roadNodes = data.roadNodes;
    roadEdges = data.roadEdges;
    isLoaded = true;
  } catch (err) {
    console.error('Error loading road network:', err);
  }
}
