// ═══════════════════════════════════════════════════════════════
// MAP CONFIGURATION — URL tile, warna rute, dan konstanta peta
// ═══════════════════════════════════════════════════════════════

// ── Tile Provider URLs ──────────────────────────────────────────
export const TILE_NORMAL    = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
export const TILE_DARK      = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
export const TILE_SATELLITE = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'

// ── Default Map Center (Kota Palu) ──────────────────────────────
export const MAP_CENTER: [number, number] = [-0.8917, 119.8577]
export const MAP_DEFAULT_ZOOM = 14
export const MAP_LOCATE_ZOOM  = 17  // Zoom level saat tombol "pusatkan" ditekan

// ── Warna Rute per Index ────────────────────────────────────────
export const routeColors: Record<number, string> = {
  0: '#6366f1',  // Indigo — rute tercepat
  1: '#f59e0b',  // Amber  — alternatif 1
  2: '#10b981',  // Emerald — alternatif 2
}

// ── Warna Badge Nomor Rute ──────────────────────────────────────
export const routeBadgeColors: Record<number, string> = {
  0: 'bg-indigo-500',
  1: 'bg-amber-500',
  2: 'bg-emerald-500',
}
