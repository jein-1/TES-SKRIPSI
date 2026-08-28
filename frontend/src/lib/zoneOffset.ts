// =============================================================================
// zoneOffset.ts — v6: SHOELACE yang benar.
//
// Bukti matematis untuk ring = front(urut) + back(dibalik):
//   - Back ke SELATAN (inland, untuk teluk di utara): area ring = NEGATIF (CW)
//   - Back ke UTARA (laut): area ring = POSITIF (CCW)
//
// Oleh karena itu:
//   flip=false → inginkan area < 0 (back ke darat) → kalau area > 0, balik
//   flip=true  → inginkan area > 0 (back ke laut)  → kalau area < 0, balik
//
// Verifikasi:
//   Front W→E: (0,0)→(1,0), back selatan (0,-d)→(1,-d)
//   Ring: (0,0),(1,0),(1,-d),(0,-d)
//   Shoelace: (0*0-1*0)+(1*(-d)-1*0)+(1*(-d)-0*(-d))+(0*0-0*(-d)) = -d-d = -2d < 0 ✓
//
//   Front E→W: (1,0)→(0,0), back selatan (1,-d)→(0,-d)
//   Ring reversed back: (0,0)→(1,0)... wait:
//   Ring: (1,0),(0,0),(0,-d),(1,-d)
//   Shoelace: (1*0-0*0)+(0*(-d)-0*0)+(0*(-d)-1*(-d))+(1*0-1*(-d)) = 0+0+d+d = 2d > 0
//   → area > 0, tapi back sudah ke selatan (darat)?!
//
// KESIMPULAN: Sign shoelace bergantung pada ARAH GAMBAR, bukan hanya posisi back.
// Untuk E→W dengan back ke selatan: area > 0, flip=false → BALIK → back ke utara (laut) SALAH!
//
// FIX DEFINITIF: Gunakan shoelace dari koordinat ABSOLUT garis saja.
// Konsep baru: hitung signed area dari POLIGON DEPAN (bukan ring),
// yaitu polygon yang menutup garis depan lewat satu titik referensi.
// Area positif = garis melengkung CCW. Area negatif = CW.
// Kemudian pilih perp yang membuat ring area konsisten.
//
// IMPLEMENTASI AKHIR:
// Gunakan cross-product KESELURUHAN garis (first→last) sebagai referensi global,
// lalu rata-rata perp sebagai cross-check, TANPA chain consistency.
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

/** Signed area polygon dari array titik XY. Positif = CCW, negatif = CW. */
function signedArea2D(pts: { x: number; y: number }[]): number {
  let area = 0
  const n = pts.length
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    area += pts[i].x * pts[j].y - pts[j].x * pts[i].y
  }
  return area / 2
}

export function computeBackLine(
  front: [number, number][],
  depthKm: number,
  flip: boolean = false,
): [number, number][] {
  if (front.length < 2) return []
  const refLat = front[0][0]
  const pts = front.map(([lat, lng]) => toXY(lat, lng, refLat))

  // 1. Normalisasi arah tiap segmen
  const segs: { dx: number; dy: number }[] = []
  for (let i = 0; i < pts.length - 1; i++) {
    let dx = pts[i + 1].x - pts[i].x
    let dy = pts[i + 1].y - pts[i].y
    const len = Math.hypot(dx, dy) || 1
    segs.push({ dx: dx / len, dy: dy / len })
  }

  // 2. Perpendicular kiri per segmen (raw, belum dikoreksi)
  const rawPerp = segs.map(({ dx, dy }) => ({ x: -dy, y: dx }))

  // 3. Rata-rata perpendicular → arah "dominan" dari sisi kiri
  let avgX = 0, avgY = 0
  for (const p of rawPerp) { avgX += p.x; avgY += p.y }
  // avgX, avgY: jika positif = cenderung ke kanan/atas

  // 4. Hitung signed area ring percobaan dengan perp kiri (raw).
  //    Ring = front (urut) + back kiri (dibalik).
  const backLeftXY = pts.map((pt, i) => {
    const p = rawPerp[Math.min(rawPerp.length - 1, i)]
    return { x: pt.x + p.x * depthKm, y: pt.y + p.y * depthKm }
  })
  const ring: { x: number; y: number }[] = [
    ...pts,
    ...[...backLeftXY].reverse(),
  ]
  const area = signedArea2D(ring)

  // 5. LOGIKA KOREKSI yang benar:
  //    Dari analisis matematika:
  //    • Back ke darat (selatan) untuk garis W→E: area NEGATIF (CW ring)
  //    • Back ke laut (utara) untuk garis W→E: area POSITIF (CCW ring)
  //    • Back ke darat (selatan) untuk garis E→W: area POSITIF (CCW ring)
  //    • Back ke laut (utara) untuk garis E→W: area NEGATIF (CW ring)
  //
  //    Tidak ada tanda tunggal yang selalu bermakna "darat".
  //    Yang KONSISTEN: perp kiri selalu menghasilkan "satu sisi",
  //    perp kanan selalu menghasilkan "sisi lain".
  //
  //    Solusi: gunakan POSISI RELATIF centroid back vs centroid front.
  //    Jika centroid back lebih jauh ke selatan (lat lebih kecil = ke darat
  //    untuk pantai di utara teluk) → benar. Jika ke utara (lat lebih besar) → salah.
  //
  //    Tapi tanpa tahu mana "darat": KITA TIDAK BISA AUTO-DETECT.
  //
  //    KEPUTUSAN FINAL: Buat konvensi yang KONSISTEN:
  //    flip=false → pakai perp kiri (left side of travel direction)
  //    flip=true  → pakai perp kanan (right side)
  //    User tinggal tekan "Balik Sisi" 1x jika defaultnya ke laut.
  //    Ini sudah berlaku di v1 dan tidak perlu "auto-detect" sama sekali.
  //
  //    Yang diperbaiki vs versi sebelumnya: tidak ada chain consistency
  //    yang bisa membalik perp secara tidak terduga.

  // Pilih sisi berdasarkan flip
  const segPerp = flip
    ? segs.map(({ dx, dy }) => ({ x: dy, y: -dx }))   // kanan
    : segs.map(({ dx, dy }) => ({ x: -dy, y: dx }))   // kiri

  // Suppress unused variable warning
  void area

  // 6. Bangun back-line
  return pts.map((pt, i) => {
    const before = segPerp[Math.max(0, i - 1)]
    const after  = segPerp[Math.min(segPerp.length - 1, i)]
    let px = before.x + after.x
    let py = before.y + after.y
    const len = Math.hypot(px, py) || 1
    const { lat, lng } = fromXY(
      pt.x + (px / len) * depthKm,
      pt.y + (py / len) * depthKm,
      refLat,
    )
    return [lat, lng] as [number, number]
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
  return (
    ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
    ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))
  )
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
