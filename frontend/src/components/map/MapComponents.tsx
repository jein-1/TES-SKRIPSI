// ═══════════════════════════════════════════════════════════════
// MAP COMPONENTS
// Komponen Leaflet murni (stateless) — tidak ada state App di sini
// ═══════════════════════════════════════════════════════════════

import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import { Plus, Minus, Crosshair } from 'lucide-react'
import { MAP_LOCATE_ZOOM } from '../../constants/mapConfig'

// ── FlyToController ─────────────────────────────────────────────
// Memindahkan viewport peta ke posisi tertentu dengan animasi flyTo.
// Hanya aktif saat prop `position` berubah.
export function FlyToController({
  position,
  zoom = 15,
}: {
  position: [number, number] | null
  zoom?: number
}) {
  const map = useMap()
  useEffect(() => {
    if (position) map.flyTo(position, zoom, { duration: 1.2 })
  }, [position, zoom, map])
  return null
}

// ── MapResizer ──────────────────────────────────────────────────
// Memanggil invalidateSize() setiap kali container berubah ukuran,
// mencegah area putih kosong saat panel slide in/out.
export function MapResizer({
  showPanel,
  showLeftSidebar,
}: {
  showPanel: boolean
  showLeftSidebar: boolean
}) {
  const map = useMap()

  useEffect(() => {
    const container = map.getContainer()
    const ro = new ResizeObserver(() => { map.invalidateSize() })
    ro.observe(container)
    return () => ro.disconnect()
  }, [map])

  useEffect(() => {
    const t1 = setTimeout(() => { map.invalidateSize() }, 50)
    const t2 = setTimeout(() => { map.invalidateSize() }, 200)
    const t3 = setTimeout(() => { map.invalidateSize() }, 450)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [showPanel, showLeftSidebar, map])

  return null
}

// ── CustomMapControls ───────────────────────────────────────────
// Tombol Zoom In, Zoom Out, dan Pusatkan Lokasi — menggantikan
// kontrol default Leaflet dengan desain yang sesuai tema.
export function CustomMapControls({
  userPosition,
  onLocateClick,
}: {
  userPosition: [number, number] | null
  onLocateClick: () => void
}) {
  const map = useMap()
  return (
    <div className="absolute left-3 md:left-6 top-[140px] md:top-[180px] z-[1000] flex flex-col gap-2 pointer-events-auto">
      <button
        onClick={() => map.zoomIn()}
        title="Zoom In"
        className="w-9 h-9 bg-[#1e293b]/90 backdrop-blur-md hover:bg-slate-700 rounded-xl flex items-center justify-center text-slate-300 shadow-[0_4px_20px_rgba(0,0,0,0.5)] border border-slate-700 transition-colors"
      >
        <Plus className="w-5 h-5" />
      </button>

      <button
        onClick={() => map.zoomOut()}
        title="Zoom Out"
        className="w-9 h-9 bg-[#1e293b]/90 backdrop-blur-md hover:bg-slate-700 rounded-xl flex items-center justify-center text-slate-300 shadow-[0_4px_20px_rgba(0,0,0,0.5)] border border-slate-700 transition-colors"
      >
        <Minus className="w-5 h-5" />
      </button>

      <button
        onClick={() => {
          onLocateClick()
          if (userPosition) {
            map.flyTo(userPosition, MAP_LOCATE_ZOOM, { duration: 1.2, easeLinearity: 0.25 })
          }
        }}
        title="Pusatkan ke lokasi saya"
        className={`w-9 h-9 mt-2 backdrop-blur-md rounded-xl flex items-center justify-center shadow-[0_4px_20px_rgba(0,0,0,0.5)] border transition-all
          ${userPosition
            ? 'bg-indigo-600/90 hover:bg-indigo-500 border-indigo-500 text-white'
            : 'bg-[#1e293b]/90 hover:bg-slate-700 border-slate-700 text-slate-300'
          }`}
      >
        <Crosshair className="w-5 h-5" />
      </button>
    </div>
  )
}
