// =============================================================================
// zoneOffset.ts — v5: koreksi arah pakai WINDING DETECTION (signed curvature).
//
// Akar masalah v4 (shoelace): untuk arc CW (garis pantai digambar T→B),
// ring area bernilai positif BAIK saat back ke laut MAUPUN ke darat →
// shoelace tidak bisa membedakan keduanya → koreksi tidak bekerja.
//
// v5 menggunakan total signed curvature dari garis depan:
//   turnSum = Σ cross(seg[i], seg[i+1])  (cross product arah antar segmen)
//   turnSum < 0  → garis digambar CW  → "keluar kurva" = perpendicular KANAN (dy, −dx)
//   turnSum > 0  → garis digambar CCW → "keluar kurva" = perpendicular KIRI (−dy, dx)
//   turnSum ≈ 0  → garis lurus → default ke kiri, user pakai tombol Balik
//
// "Keluar kurva" = menjauhi pusat lengkungan = ke arah DARAT untuk teluk.
// Tombol "Balik Sisi" membalik antara keluar/masuk kurva.
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

  // 1. Normalisasi arah tiap segmen
  const segs: { dx: number; dy: number }[] = []
  for (let i = 0; i < pts.length - 1; i++) {
    let dx = pts[i + 1].x - pts[i].x
    let dy = pts[i + 1].y - pts[i].y
    const len = Math.hypot(dx, dy) || 1
    segs.push({ dx: dx / len, dy: dy / len })
  }

  // 2. Hitung total signed curvature (jumlah cross-product antar segmen berurutan).
  //    Nilai ini menentukan arah gambar (CW atau CCW) secara keseluruhan.
  let turnSum = 0
  for (let i = 0; i < segs.length - 1; i++) {
    // z-component of cross product seg[i] × seg[i+1]
    turnSum += segs[i].dx * segs[i + 1].dy - segs[i].dy * segs[i + 1].dx
  }
  // turnSum < 0 → CW (mis. gambar dari timur ke barat di utara teluk)
  // turnSum > 0 → CCW (gambar dari barat ke timur)

  // 3. Pilih arah perpendicular "keluar kurva" berdasarkan winding:
  //    CW  → outward = perpendicular KANAN = (dy, −dx)
  //    CCW → outward = perpendicular KIRI  = (−dy, dx)
  //    Lurus (≈0) → default KIRI
  const useRight = turnSum < 0

  const segPerp: { x: number; y: number }[] = segs.map(({ dx, dy }) =>
    useRight
      ? { x: dy, y: -dx }   // kanan: outward untuk CW arc (→ darat)
      : { x: -dy, y: dx }   // kiri:  outward untuk CCW arc (→ darat)
  )

  // 4. Konsistensi berantai: cegah "lompatan flip" antar segmen bersebelahan.
  //    (Diperlukan untuk coast yang berubah-ubah arah tajam.)
  for (let i = 1; i < segPerp.length; i++) {
    const dot = segPerp[i].x * segPerp[i - 1].x + segPerp[i].y * segPerp[i - 1].y
    if (dot < 0) segPerp[i] = { x: -segPerp[i].x, y: -segPerp[i].y }
  }

  // 5. Kalau flip=true, balik semua perpendicular (ke sisi inward / laut).
  if (flip) {
    for (let i = 0; i < segPerp.length; i++) {
      segPerp[i] = { x: -segPerp[i].x, y: -segPerp[i].y }
    }
  }

  // 6. Bangun back-line: tiap titik = rata-rata perp segmen sebelum & sesudahnya.
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
