/**
 * =============================================================================
 * FORMULA HAVERSINE
 * =============================================================================
 * Menghitung jarak geografis (great-circle distance) antara dua titik koordinat
 * pada permukaan bumi berdasarkan lintang dan bujur.
 *
 * Formula:
 *   a = sin²(Δlat/2) + cos(lat1) · cos(lat2) · sin²(Δlon/2)
 *   c = 2 · atan2(√a, √(1-a))
 *   d = R · c
 *
 * dimana R = 6371 km (radius rata-rata bumi)
 *
 * Return: jarak dalam kilometer (km)
 */

import type { RoadNode } from './types.ts'
import { roadNodes } from './roadNetwork.ts'

export function calculateHaversine(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number {
  const R = 6371
  const toRad = (deg: number) => deg * (Math.PI / 180)

  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Mencari road node terdekat dari suatu titik koordinat menggunakan Haversine.
 * Digunakan untuk meng-"snap" posisi user/shelter ke graf jaringan jalan.
 */
export function findNearestNode(lat: number, lng: number): RoadNode {
  let nearest = roadNodes[0]
  let minDist = Infinity

  for (const node of roadNodes) {
    const dist = calculateHaversine(lat, lng, node.lat, node.lng)
    if (dist < minDist) {
      minDist = dist
      nearest = node
    }
  }
  return nearest
}
