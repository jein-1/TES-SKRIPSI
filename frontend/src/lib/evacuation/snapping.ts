/**
 * =============================================================================
 * SNAPPING — Proyeksikan titik ke segmen jalan terdekat (bukan node terdekat)
 * =============================================================================
 * Dipakai supaya posisi user/shelter yang berada di tengah ruas jalan tetap
 * dipetakan secara akurat ke jaringan jalan, bukan "meloncat" ke persimpangan
 * terdekat yang mungkin jauh.
 */

import type { RoadEdge } from './types'

function toXY(lat: number, lng: number, refLat: number) {
  const kmPerDegLat = 111.32
  const kmPerDegLng = 111.32 * Math.cos((refLat * Math.PI) / 180)
  return { x: lng * kmPerDegLng, y: lat * kmPerDegLat }
}
function fromXY(x: number, y: number, refLat: number) {
  const kmPerDegLat = 111.32
  const kmPerDegLng = 111.32 * Math.cos((refLat * Math.PI) / 180)
  return { lat: y / kmPerDegLat, lng: x / kmPerDegLng }
}

function projectPointOnSegment(
  pLat: number, pLng: number,
  aLat: number, aLng: number,
  bLat: number, bLng: number,
) {
  const refLat = aLat
  const p = toXY(pLat, pLng, refLat)
  const a = toXY(aLat, aLng, refLat)
  const b = toXY(bLat, bLng, refLat)
  const abx = b.x - a.x, aby = b.y - a.y
  const apx = p.x - a.x, apy = p.y - a.y
  const abLenSq = abx * abx + aby * aby
  let t = abLenSq === 0 ? 0 : (apx * abx + apy * aby) / abLenSq
  t = Math.max(0, Math.min(1, t))
  const projX = a.x + t * abx, projY = a.y + t * aby
  const proj = fromXY(projX, projY, refLat)
  const dx = p.x - projX, dy = p.y - projY
  const distKm = Math.sqrt(dx * dx + dy * dy)
  return { t, lat: proj.lat, lng: proj.lng, distKm }
}

export interface SnapResult {
  edge: RoadEdge
  lat: number
  lng: number
  /** Jarak (km) sepanjang jalan dari edge.from sampai titik proyeksi */
  distFromStart: number
  /** Jarak (km) sepanjang jalan dari titik proyeksi sampai edge.to */
  distToEnd: number
  /** Jarak tegak lurus (km) dari titik asli ke jalan — indikator akurasi snap */
  perpendicularDistKm: number
}

/**
 * Cari titik terdekat di SELURUH jaringan jalan (di sepanjang garis, bukan cuma node)
 * untuk suatu koordinat (lat,lng). Mengiterasi tiap sub-segmen geometry setiap edge.
 */
export function snapToNearestRoad(lat: number, lng: number, roadEdges: RoadEdge[]): SnapResult | null {
  let best: SnapResult | null = null

  for (const edge of roadEdges) {
    const geom = edge.geometry && edge.geometry.length >= 2
      ? edge.geometry
      : null
    if (!geom) continue

    // Hitung jarak kumulatif tiap titik geometry dari edge.from (untuk distFromStart/distToEnd)
    let cumulative = 0
    for (let i = 0; i < geom.length - 1; i++) {
      const [aLat, aLng] = geom[i]
      const [bLat, bLng] = geom[i + 1]
      const proj = projectPointOnSegment(lat, lng, aLat, aLng, bLat, bLng)

      // Panjang sub-segmen ini (haversine sederhana, cukup akurat untuk skala kota)
      const segLen = haversineKm(aLat, aLng, bLat, bLng)
      const distFromStart = cumulative + proj.t * segLen

      if (!best || proj.distKm < best.perpendicularDistKm) {
        best = {
          edge,
          lat: proj.lat,
          lng: proj.lng,
          distFromStart,
          distToEnd: edge.distance - distFromStart,
          perpendicularDistKm: proj.distKm,
        }
      }
      cumulative += segLen
    }
  }
  return best
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
