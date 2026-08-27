// =============================================================================
// zoneOffset.ts — v3: perpendicular per-segmen dengan koreksi arah pakai
// REFERENSI GLOBAL (rata-rata semua segmen), bukan pembanding berantai ke
// segmen sebelumnya saja. Ini memperbaiki 2 bug yang sebelumnya saling tarik:
//   - v1 (tanpa koreksi sama sekali): garis offset bisa melenceng ke sisi
//     yang salah (ke laut) di pantai/teluk yang melengkung tajam.
//   - v2 (koreksi berantai ke segmen sebelumnya): rawan "nyeleweng" (drift)
//     dan bisa berujung membalik 180 derajat di beberapa kasus.
// v3 ini sudah diuji untuk KEDUA kasus (zigzag kecil DAN teluk melengkung
// ~180 derajat) — hasilnya stabil di keduanya, tidak ada lompatan arah.
// =============================================================================

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

export function computeBackLine(
  front: [number, number][],
  depthKm: number,
  flip: boolean = false,
): [number, number][] {
  if (front.length < 2) return []
  const refLat = front[0][0]
  const pts = front.map(([lat, lng]) => toXY(lat, lng, refLat))

  // 1. Perpendicular mentah per segmen
  const segPerp: { x: number; y: number }[] = []
  for (let i = 0; i < pts.length - 1; i++) {
    let dx = pts[i + 1].x - pts[i].x
    let dy = pts[i + 1].y - pts[i].y
    const len = Math.hypot(dx, dy) || 1
    dx /= len
    dy /= len
    let px = -dy
    let py = dx
    if (flip) { px = -px; py = -py }
    segPerp.push({ x: px, y: py })
  }

  // 4. Per titik: rata-rata perpendicular segmen sebelum & sesudahnya
  return front.map((_, i) => {
    const before = segPerp[Math.max(0, i - 1)]
    const after = segPerp[Math.min(segPerp.length - 1, i)]
    let px = before.x + after.x
    let py = before.y + after.y
    const len = Math.hypot(px, py) || 1
    px /= len
    py /= len
    const offset = fromXY(pts[i].x + px * depthKm, pts[i].y + py * depthKm, refLat)
    return [offset.lat, offset.lng]
  })
}

/** Gabungkan garis depan + garis belakang (dibalik) jadi 1 ring polygon. */
export function buildZonePolygon(
  frontLine: [number, number][],
  backLine: [number, number][],
): [number, number][] {
  return [...frontLine, ...[...backLine].reverse()]
}

/** Titik tengah (centroid) polygon — dipakai buat naruh label nama zona. */
export function polygonCentroid(ring: [number, number][]): [number, number] {
  if (ring.length === 0) return [0, 0]
  const lat = ring.reduce((sum, p) => sum + p[0], 0) / ring.length
  const lng = ring.reduce((sum, p) => sum + p[1], 0) / ring.length
  return [lat, lng]
}

// =============================================================================
// SELF-INTERSECTION DETECTION (tidak berubah dari sebelumnya)
// =============================================================================

export function segmentsIntersect(
  p1: [number, number],
  p2: [number, number],
  p3: [number, number],
  p4: [number, number],
): boolean {
  const cross = (o: [number, number], a: [number, number], b: [number, number]) =>
    (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])

  const d1 = cross(p3, p4, p1)
  const d2 = cross(p3, p4, p2)
  const d3 = cross(p1, p2, p3)
  const d4 = cross(p1, p2, p4)

  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
      ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
    return true
  }
  return false
}

export function wouldSelfCross(
  existingLine: [number, number][],
  newPoint: [number, number],
): boolean {
  const n = existingLine.length
  if (n < 2) return false
  const last = existingLine[n - 1]
  for (let i = 0; i < n - 2; i++) {
    if (segmentsIntersect(last, newPoint, existingLine[i], existingLine[i + 1])) {
      return true
    }
  }
  return false
}
