// =============================================================================
// zoneOffset.ts — Hitung garis "kedalaman" (offset sejajar ke darat) dari
// garis pantai yang diklik admin, buat fitur gambar zona bahaya.
// Taruh di: frontend/src/lib/zoneOffset.ts
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
 * Hitung garis "belakang" (offset sejajar, ke arah darat) dari garis depan
 * (titik-titik yang diklik admin di pinggir laut), bergeser sejauh depthKm
 * tegak lurus arah lokal garis di tiap titik — supaya tetap sejajar walau
 * garis pantainya melengkung.
 *
 * @param front    Titik-titik garis depan [lat,lng][], urut sesuai klik admin
 * @param depthKm  Jarak offset ke darat (km)
 * @param flip     Balik ke sisi berlawanan (kalau ternyata offset-nya ke laut, bukan darat)
 */
export function computeBackLine(
  front: [number, number][],
  depthKm: number,
  flip: boolean = false,
): [number, number][] {
  if (front.length < 2) return []
  const refLat = front[0][0]
  const pts = front.map(([lat, lng]) => toXY(lat, lng, refLat))

  return front.map((_, i) => {
    // Arah lokal: rata-rata segmen sebelum & sesudah titik i (halus di tikungan)
    const prev = pts[Math.max(0, i - 1)]
    const next = pts[Math.min(pts.length - 1, i + 1)]
    let dx = next.x - prev.x
    let dy = next.y - prev.y
    const len = Math.hypot(dx, dy) || 1
    dx /= len
    dy /= len
    // Tegak lurus arah garis (rotasi 90°) — konsisten satu sisi sepanjang garis
    let perpX = -dy
    let perpY = dx
    if (flip) { perpX = -perpX; perpY = -perpY }
    const offset = fromXY(pts[i].x + perpX * depthKm, pts[i].y + perpY * depthKm, refLat)
    return [offset.lat, offset.lng]
  })
}

/**
 * Gabungkan garis depan + garis belakang (dibalik urutannya) jadi 1 ring
 * polygon yang valid dan tidak self-intersect, siap dipakai sebagai
 * geometry Polygon (GeoJSON butuh titik pertama diulang di akhir untuk
 * menutup ring — itu sudah ditangani di kode render yang sudah ada,
 * jadi fungsi ini cukup kembalikan urutan titiknya saja).
 */
export function buildZonePolygon(
  frontLine: [number, number][],
  backLine: [number, number][],
): [number, number][] {
  return [...frontLine, ...[...backLine].reverse()]
}
