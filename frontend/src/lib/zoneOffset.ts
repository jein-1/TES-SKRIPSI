// =============================================================================
// zoneOffset.ts — v2: perpendicular per-segmen dengan koreksi konsistensi arah
// (mencegah garis "melompat" saat garis pantai sedikit zigzag/dibalik).
// Timpa file frontend/src/lib/zoneOffset.ts dengan ini.
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

/**
 * Hitung garis "belakang" (offset sejajar ke darat) dari garis depan.
 *
 * v2: perpendicular dihitung per SEGMEN dulu (bukan per titik langsung),
 * lalu arahnya dipaksa konsisten (tidak boleh berbalik arah dibanding
 * segmen sebelumnya, dicek lewat dot product) SEBELUM dirata-ratakan per
 * titik (miter join). Ini mencegah titik "melompat" ke arah berlawanan
 * saat garis depan sedikit zigzag — yang sebelumnya bisa membuat polygon
 * jadi kacau/error saat ada titik baru yang posisinya sedikit mundur dari
 * arah umum garis.
 */
export function computeBackLine(
  front: [number, number][],
  depthKm: number,
  flip: boolean = false,
): [number, number][] {
  if (front.length < 2) return []
  const refLat = front[0][0]
  const pts = front.map(([lat, lng]) => toXY(lat, lng, refLat))

  // 1. Perpendicular per segmen (n-1 segmen untuk n titik)
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

  // 2. (Dihapus) Paksa arah konsisten dengan dot product dihapus karena
  // menyebabkan offset membalik arah 180 derajat jika garis pantai melengkung.

  // 3. Per titik: rata-rata perpendicular segmen sebelum & sesudahnya
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
// SELF-INTERSECTION DETECTION
// =============================================================================

/**
 * Cek apakah dua segmen garis (p1→p2) dan (p3→p4) saling berpotongan.
 * Menggunakan metode cross product (orientasi titik).
 * [lat, lng] coords — order tidak penting karena hanya cek silang 2D.
 */
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

  // Collinear / on-segment cases (treated as non-crossing to avoid false positives)
  return false
}

/**
 * Cek apakah menambahkan `newPoint` ke ujung `existingLine` akan membuat
 * garis menyilang diri sendiri.
 *
 * Segmen baru = [lastPoint → newPoint].
 * Kita skip 1 segmen terakhir (bertetangga dengan segmen baru) karena
 * keduanya berbagi titik ujung — itu bukan silangan asli.
 */
export function wouldSelfCross(
  existingLine: [number, number][],
  newPoint: [number, number],
): boolean {
  const n = existingLine.length
  if (n < 2) return false

  const last = existingLine[n - 1]
  // Segmen baru: last → newPoint
  // Cek terhadap semua segmen KECUALI segmen terakhir (index n-2 → n-1),
  // karena itu bertetangga dan berbagi titik `last`.
  for (let i = 0; i < n - 2; i++) {
    if (segmentsIntersect(last, newPoint, existingLine[i], existingLine[i + 1])) {
      return true
    }
  }
  return false
}
