// ═══════════════════════════════════════════════════════════════
// NAVIGATE PAGE — Google Maps-style Navigation with Rotating Map
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { AlertTriangle, ArrowRight, Navigation2, Phone, ChevronLeft, MapPin } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import type { RouteResult } from '../../lib/evacuation'
import { TILE_DARK } from '../../constants/mapConfig'

interface Props {
  routes: RouteResult[]
  selectedRoute: number
  tsunamiAlert: boolean
  userPosition: [number, number] | null
  onBack?: () => void
}

// ── Bearing helpers ────────────────────────────────────────────
function getBearing(from: [number, number], to: [number, number]): number {
  const toRad = (d: number) => d * Math.PI / 180
  const dLng = toRad(to[1] - from[1])
  const lat1 = toRad(from[0]); const lat2 = toRad(to[0])
  const y = Math.sin(dLng) * Math.cos(lat2)
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng)
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360
}

function haversineMeters(a: [number, number], b: [number, number]): number {
  const R = 6371000
  const toRad = (d: number) => d * Math.PI / 180
  const dLat = toRad(b[0] - a[0])
  const dLng = toRad(b[1] - a[1])
  const x = Math.sin(dLat/2)**2 + Math.cos(toRad(a[0]))*Math.cos(toRad(b[0]))*Math.sin(dLng/2)**2
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1-x))
}

function bearingToInstruction(b: number): { label: string; icon: string } {
  if (b < 22.5 || b >= 337.5) return { label: 'Terus Lurus', icon: '↑' }
  if (b < 67.5)  return { label: 'Belok Kanan', icon: '↗' }
  if (b < 112.5) return { label: 'Belok Kanan', icon: '→' }
  if (b < 157.5) return { label: 'Belok Kanan Jauh', icon: '↘' }
  if (b < 202.5) return { label: 'Putar Balik', icon: '↓' }
  if (b < 247.5) return { label: 'Belok Kiri Jauh', icon: '↙' }
  if (b < 292.5) return { label: 'Belok Kiri', icon: '←' }
  return { label: 'Belok Kiri', icon: '↖' }
}

// ── Triangle user icon ─────────────────────────────────────────
function makeUserIcon(bearing: number): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `
      <div style="
        width: 32px; height: 32px;
        display: flex; align-items: center; justify-content: center;
        transform: rotate(${bearing}deg);
        transition: transform 0.4s ease;
      ">
        <svg width="32" height="32" viewBox="0 0 32 32">
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>
          <circle cx="16" cy="16" r="14" fill="rgba(99,102,241,0.2)" stroke="#6366f1" stroke-width="1.5"/>
          <polygon points="16,4 24,26 16,21 8,26" fill="#6366f1" filter="url(#glow)"/>
          <circle cx="16" cy="16" r="3" fill="white"/>
        </svg>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  })
}

// ── Map controller: centers on user + rotates map ─────────────
function MapNavController({
  userPosition,
  bearing,
  routeCoords,
}: {
  userPosition: [number, number] | null
  bearing: number
  routeCoords: [number, number][]
}) {
  const map = useMap()
  const markerRef = useRef<L.Marker | null>(null)
  const prevBearingRef = useRef(0)

  useEffect(() => {
    if (!userPosition) return

    // Fly to user position with offset so instruction cards have room
    map.setView(userPosition, map.getZoom(), { animate: true, duration: 0.6 })

    // Rotate map container to heading-up (CSS approach)
    const container = map.getContainer()
    const smoothBearing = bearing
    container.style.transform = `rotate(${-smoothBearing}deg)`
    container.style.transition = 'transform 0.5s ease'
    prevBearingRef.current = smoothBearing

    // User marker
    if (!markerRef.current) {
      markerRef.current = L.marker(userPosition, { icon: makeUserIcon(0), zIndexOffset: 1000 }).addTo(map)
    } else {
      markerRef.current.setLatLng(userPosition)
    }
    // Counter-rotate marker so it stays upright
    markerRef.current.setIcon(makeUserIcon(smoothBearing))

    return () => {
      // Reset rotation when unmounted
      container.style.transform = ''
    }
  }, [userPosition, bearing, map])

  useEffect(() => {
    return () => {
      markerRef.current?.remove()
    }
  }, [])

  return null
}

// ── Shelter icon ───────────────────────────────────────────────
const shelterMapIcon = L.divIcon({
  className: '',
  html: `<div style="width:28px;height:28px;background:#22c55e;border:2px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 0 12px rgba(34,197,94,0.6)">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9,22 9,12 15,12 15,22"/>
    </svg>
  </div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
})

export default function NavigatePage({ routes, selectedRoute, tsunamiAlert, userPosition, onBack }: Props) {
  const [showMedical, setShowMedical] = useState(false)
  const [deviceBearing, setDeviceBearing] = useState<number | null>(null)
  const route = routes[selectedRoute]
  const shelterPos = route?.coordinates[route.coordinates.length - 1] as [number, number] | undefined

  // Use device compass if available, else compute from GPS bearing to shelter
  const computedBearing = (userPosition && shelterPos)
    ? getBearing(userPosition, shelterPos) : 0
  const bearing = deviceBearing ?? computedBearing

  const distanceM = (userPosition && shelterPos)
    ? haversineMeters(userPosition, shelterPos)
    : (route?.totalDistance ? route.totalDistance * 1000 : 0)

  const distanceLabel = distanceM < 1000
    ? `${Math.round(distanceM)}m`
    : `${(distanceM / 1000).toFixed(1)} km`

  const etaMin = Math.max(1, Math.ceil(distanceM / 1000 / 5 * 60))
  const { label: mainInstruction, icon: dirIcon } = bearingToInstruction(bearing)

  // Request device orientation (compass)
  useEffect(() => {
    function handleOrientation(e: DeviceOrientationEvent) {
      if (e.alpha !== null) setDeviceBearing((360 - e.alpha) % 360)
    }
    const req = (DeviceOrientationEvent as any).requestPermission
    if (typeof req === 'function') {
      req().then((perm: string) => {
        if (perm === 'granted') window.addEventListener('deviceorientation', handleOrientation)
      }).catch(() => {})
    } else {
      window.addEventListener('deviceorientation', handleOrientation)
    }
    return () => window.removeEventListener('deviceorientation', handleOrientation)
  }, [])

  // ── Medical modal ──────────────────────────────────────────────
  if (showMedical) {
    return (
      <div className="fixed inset-0 z-[1900] flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm p-6">
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-sm p-6 rounded-3xl border border-red-500/40 bg-[#150808] text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
            <Phone className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-xl font-black text-white mb-2">Bantuan Medis</h3>
          <p className="text-sm text-slate-400 mb-6">Tim SAR akan dikirimkan ke koordinat GPS Anda saat ini.</p>
          <div className="space-y-3">
            <button className="w-full py-3.5 bg-red-600 text-white rounded-2xl font-black text-sm">
              KIRIM PERMINTAAN BANTUAN
            </button>
            <button onClick={() => setShowMedical(false)}
              className="w-full py-3 bg-slate-800 text-slate-300 rounded-2xl font-bold text-sm">
              Batal
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  // ── No route state ─────────────────────────────────────────────
  if (!route) {
    return (
      <div className="fixed inset-0 z-[1800] flex flex-col" style={{ background: '#080e1a' }}>
        <div className="shrink-0 flex items-center gap-2 px-4 py-3 border-b border-slate-800/60" style={{ background: '#0a1020' }}>
          {onBack && (
            <button onClick={onBack} className="w-8 h-8 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center">
              <ChevronLeft className="w-4 h-4 text-slate-400" />
            </button>
          )}
          <Navigation2 className="w-5 h-5 text-indigo-400" />
          <span className="text-sm font-black text-white tracking-widest">NAVIGASI</span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-20 h-20 rounded-2xl bg-slate-800/60 border border-slate-700/40 flex items-center justify-center mb-4">
            <Navigation2 className="w-10 h-10 text-slate-600" />
          </div>
          <p className="text-white font-bold mb-2">GPS Belum Aktif</p>
          <p className="text-slate-500 text-sm">Aktifkan GPS dari halaman STATUS untuk memulai navigasi darurat.</p>
        </div>
      </div>
    )
  }

  const routeCoords = route.coordinates as [number, number][]
  const mapCenter: [number, number] = userPosition ?? routeCoords[0]

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[1800] flex flex-col"
      style={{ background: '#080e1a' }}
    >
      {/* ── Emergency Header ── */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-red-900/40 z-10 relative"
        style={{ background: '#0f0505' }}>
        <div className="flex items-center gap-2">
          {onBack && (
            <button onClick={onBack}
              className="w-8 h-8 rounded-xl bg-red-900/30 border border-red-800/50 flex items-center justify-center">
              <ChevronLeft className="w-4 h-4 text-red-300" />
            </button>
          )}
          <AlertTriangle className="w-5 h-5 text-amber-400 animate-pulse" />
          <span className="text-sm font-black text-white tracking-widest">AEGIS RESPONSE</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-600 border border-red-500/50">
          <div className="w-1.5 h-1.5 rounded-full bg-red-200 animate-pulse" />
          <span className="text-xs font-black text-white tracking-wider">EMERGENCY ACTIVE</span>
        </div>
      </div>

      {/* ── Destination Card (compact) ── */}
      <div className="shrink-0 px-3 pt-3 pb-2 z-10 relative">
        <div className="p-3 rounded-2xl border border-slate-700/40 flex items-center gap-3" style={{ background: '#0f1a2e' }}>
          <div className="w-1 self-stretch rounded-full bg-indigo-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Tujuan Evakuasi</p>
            <p className="text-base font-black text-white leading-tight truncate">Lari ke {route.shelterName}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-lg font-black text-white">{distanceLabel}</p>
            <p className="text-[9px] text-slate-500 font-bold">{etaMin} menit</p>
          </div>
        </div>
      </div>

      {/* ── MAP AREA (rotating, Google Maps style) ── */}
      <div className="flex-1 relative overflow-hidden">
        {/* Map container — overflow hidden clips the rotated edges */}
        <div className="absolute inset-0" style={{ background: '#080e1a' }}>
          <MapContainer
            center={mapCenter}
            zoom={16}
            zoomControl={false}
            attributionControl={false}
            className="w-full h-full"
            dragging={true}
            touchZoom={true}
            scrollWheelZoom={true}
            style={{ background: '#080e1a' }}
          >
            <TileLayer
              url={TILE_DARK}
              maxNativeZoom={20}
              maxZoom={20}
            />

            {/* Route polyline */}
            <Polyline
              positions={routeCoords}
              color="#6366f1"
              weight={5}
              opacity={0.85}
              dashArray="0"
            />
            {/* Route glow */}
            <Polyline
              positions={routeCoords}
              color="#818cf8"
              weight={10}
              opacity={0.25}
            />

            {/* Shelter marker */}
            {shelterPos && (
              <>{/* We use a DivIcon marker for the shelter */}
                <MapShelterMarker pos={shelterPos} name={route.shelterName} />
              </>
            )}

            {/* Rotating map controller + user triangle */}
            <MapNavController
              userPosition={userPosition}
              bearing={bearing}
              routeCoords={routeCoords}
            />
          </MapContainer>
        </div>

        {/* Compass rose (top-right, counter-rotates so it always shows N up) */}
        <div className="absolute top-3 right-3 z-[500] w-12 h-12 pointer-events-none">
          <div className="w-full h-full rounded-full bg-slate-900/80 border border-slate-700/60 flex items-center justify-center backdrop-blur-sm"
            style={{ transform: `rotate(${bearing}deg)`, transition: 'transform 0.5s ease' }}>
            <svg viewBox="0 0 32 32" width="28" height="28">
              <polygon points="16,3 19,16 16,14 13,16" fill="#ef4444"/>
              <polygon points="16,29 19,16 16,18 13,16" fill="#94a3b8"/>
              <text x="16" y="9" textAnchor="middle" fontSize="5" fill="white" fontWeight="bold">N</text>
            </svg>
          </div>
        </div>

        {/* Bearing indicator (bottom-left) */}
        <div className="absolute bottom-3 left-3 z-[500] px-2.5 py-1.5 rounded-xl bg-slate-900/80 border border-slate-700/60 backdrop-blur-sm">
          <p className="text-[10px] font-black text-white">{Math.round(bearing)}°</p>
          <p className="text-[8px] text-slate-500">BEARING</p>
        </div>
      </div>

      {/* ── Direction Instruction ── */}
      <div className="shrink-0 z-10 relative px-4 py-3 text-center border-t border-slate-800/40"
        style={{ background: '#0a1020' }}>
        <div className="flex items-center justify-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
            <span className="text-3xl font-black text-indigo-300">{dirIcon}</span>
          </div>
          <div className="text-left">
            <h1 className="text-2xl font-black text-white leading-none">{mainInstruction}</h1>
            <p className="text-xs text-slate-400 mt-0.5">{distanceLabel} menuju {route.shelterName}</p>
          </div>
        </div>
      </div>

      {/* ── Next Step + Medical ── */}
      <div className="shrink-0 z-10 relative px-3 pb-4 space-y-2" style={{ background: '#0a1020' }}>
        <div className="p-3 rounded-2xl border border-slate-700/40 flex items-center gap-3" style={{ background: '#0f1a2e' }}>
          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 flex items-center justify-center shrink-0">
            <ArrowRight className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <p className="text-[9px] text-indigo-400 uppercase tracking-widest font-bold">Langkah Berikutnya</p>
            <p className="text-sm font-bold text-white">
              {bearing < 180 ? 'Belok Kanan di Persimpangan' : 'Belok Kiri di Persimpangan'}
            </p>
          </div>
          <div className="ml-auto text-right shrink-0">
            <MapPin className="w-4 h-4 text-slate-600" />
          </div>
        </div>

        <button
          onClick={() => setShowMedical(true)}
          className="w-full py-3.5 rounded-2xl bg-red-600 text-white font-black text-sm tracking-wide flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(239,68,68,0.35)]"
        >
          <span>🏥</span> BANTUAN MEDIS
        </button>
      </div>
    </motion.div>
  )
}

// ── Shelter Marker Component ───────────────────────────────────
function MapShelterMarker({ pos, name }: { pos: [number, number]; name: string }) {
  const map = useMap()
  const markerRef = useRef<L.Marker | null>(null)
  useEffect(() => {
    markerRef.current = L.marker(pos, { icon: shelterMapIcon }).addTo(map)
    markerRef.current.bindPopup(`<b>${name}</b><br/>Titik Evakuasi`)
    return () => { markerRef.current?.remove() }
  }, [map, pos, name])
  return null
}
