// ═══════════════════════════════════════════════════════════════
// MAP CONFIGURATION — URL tile, warna rute, dan konstanta peta
// ═══════════════════════════════════════════════════════════════

export const TILE_NORMAL    = 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}'
export const TILE_DARK      = 'https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}'
export const TILE_SATELLITE = 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'

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
