// =============================================================================
// zoneOffset.ts — v4: perpendicular per-segmen dengan koreksi arah pakai
// SIGNED AREA (shoelace formula) dari ring yang dihasilkan.
//
// Pendekatan sebelumnya (v3: rata-rata global perpendicular) gagal di teluk
// yang melengkung >90° karena vektor-vektor saling membatalkan → refLen ≈ 0
// → koreksi arah tidak reliable.
//
// v4 ini bekerja dengan cara:
//   1. Hitung perpendicular per segmen (sudah ada di v1).
//   2. Koreksi konsistensi: tiap segmen berlawanan >90° dari tetangga DEKAT
//      (bukan rata-rata global, tapi iterasi dari segmen pertama ke akhir —
//      ini hanya memastikan tidak ada "lompatan arah" antar segmen bersebelahan).
//   3. Bangun ring percobaan (front + back).
//   4. Hitung signed area ring percobaan pakai shoelace formula.
//      - Area positif → winding CCW (berlawanan jarum jam) → back ada di
//        sisi kiri garis depan (default: "sisi dalam" layar / darat).
//      - Area negatif → winding CW → back ada di sisi kanan (laut di
//        konfigurasi ini).
//   5. Kalau flip=false inginkan area > 0 (CCW); kalau flip=true inginkan
//      area < 0 (CW). Kalau tanda tidak cocok, balik semua perpendicular.
//   6. Hitung ulang back-line dengan perpendicular yang sudah pasti benar.
//
// Hasilnya: arah selalu konsisten TERLEPAS dari bentuk pantai, bahkan
// untuk teluk >180°. Tombol "Balik Sisi" hanya untuk override manual.
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

/** Signed area pakai shoelace formula. Positif = CCW, negatif = CW. */
function signedArea2D(pts: { x: number; y: number }[]): number {
  let area = 0
  const n = pts.length
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    area += pts[i].x * pts[j].y
    area -= pts[j].x * pts[i].y
  }
  return area / 2
}

/** Hitung back-line XY dari array perpendicular yang sudah terkoreksi. */
function buildBackXY(
  pts: { x: number; y: number }[],
  perps: { x: number; y: number }[],
  depthKm: number,
): { x: number; y: number }[] {
  return pts.map((pt, i) => {
    const before = perps[Math.max(0, i - 1)]
    const after  = perps[Math.min(perps.length - 1, i)]
    let px = before.x + after.x
    let py = before.y + after.y
    const len = Math.hypot(px, py) || 1
    px /= len
    py /= len
    return { x: pt.x + px * depthKm, y: pt.y + py * depthKm }
  })
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
    // Perpendicular kiri: (-dy, dx)
    segPerp.push({ x: -dy, y: dx })
  }

  // 2. Konsistensi berantai: tiap segmen tidak boleh berlawanan >90° dari
  //    segmen sebelumnya (mencegah "lompatan flip" antar segmen bersebelahan).
  for (let i = 1; i < segPerp.length; i++) {
    const dot = segPerp[i].x * segPerp[i - 1].x + segPerp[i].y * segPerp[i - 1].y
    if (dot < 0) segPerp[i] = { x: -segPerp[i].x, y: -segPerp[i].y }
  }

  // 3. Bangun ring percobaan dari perpendicular saat ini.
  const backTry = buildBackXY(pts, segPerp, depthKm)

  // Ring = front (urut) + back (dibalik) → ring tertutup
  const ring: { x: number; y: number }[] = [
    ...pts,
    ...[...backTry].reverse(),
  ]

  // 4. Hitung signed area ring percobaan.
  //    CCW (area > 0) → perpendicular mengarah ke "kiri" garis (sisi dalam).
  //    CW  (area < 0) → perpendicular mengarah ke "kanan" garis (sisi luar).
  //
  //    Kita inginkan area > 0 (CCW) sebagai default (flip=false).
  //    Kalau flip=true, kita inginkan area < 0 (CW).
  const area = signedArea2D(ring)

  // Tentukan apakah perlu balik semua perpendicular:
  // - flip=false → inginkan area > 0 (CCW) → kalau area < 0, balik
  // - flip=true  → inginkan area < 0 (CW)  → kalau area > 0, balik
  const needFlip = flip ? area > 0 : area < 0
  if (needFlip) {
    for (let i = 0; i < segPerp.length; i++) {
      segPerp[i] = { x: -segPerp[i].x, y: -segPerp[i].y }
    }
  }

  // 5. Hitung back-line final dengan perpendicular yang sudah pasti benar.
  const backFinal = buildBackXY(pts, segPerp, depthKm)
  return backFinal.map(({ x, y }) => {
    const { lat, lng } = fromXY(x, y, refLat)
    return [lat, lng]
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
