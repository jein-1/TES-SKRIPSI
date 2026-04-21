// ═══════════════════════════════════════════════════════════════
// NAVIGATE PAGE — Normal map viewer + Emergency mode
// - Normal: free rotation, shows nearest shelter on map
// - Emergency (tsunami): heading-up mode, red headers, full routing
// - Map rotation PERSISTS until user manually resets
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect, useRef, useCallback } from 'react'
import { MapContainer, TileLayer, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-rotate'
import {
  AlertTriangle, ArrowRight, Navigation2, Phone, ChevronLeft,
  MapPin, RotateCcw, Compass, Lock, Unlock
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import type { RouteResult } from '../../lib/evacuation'
import { TILE_DARK } from '../../constants/mapConfig'
import { CompassWidget } from '../map/MapRotation'

interface Props {
  routes: RouteResult[]
  selectedRoute: number
  tsunamiAlert: boolean
  userPosition: [number, number] | null
  onBack?: () => void
}

// ── Bearing helpers ────────────────────────────────────────────
function getBearing(from: [number, number], to: [number, number]): number {
  const r = (d: number) => d * Math.PI / 180
  const dL = r(to[1] - from[1])
  const φ1 = r(from[0]), φ2 = r(to[0])
  const y = Math.sin(dL) * Math.cos(φ2)
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(dL)
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360
}

function haversineM(a: [number, number], b: [number, number]): number {
  const R = 6371000, r = (d: number) => d * Math.PI / 180
  const dLat = r(b[0] - a[0]), dLng = r(b[1] - a[1])
  const h = Math.sin(dLat/2)**2 + Math.cos(r(a[0]))*Math.cos(r(b[0]))*Math.sin(dLng/2)**2
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1-h))
}

function bearingLabel(b: number): { label: string; icon: string } {
  if (b < 22.5 || b >= 337.5) return { label: 'Terus Lurus', icon: '↑' }
  if (b < 67.5)  return { label: 'Belok Kanan', icon: '↗' }
  if (b < 112.5) return { label: 'Belok Kanan', icon: '→' }
  if (b < 157.5) return { label: 'Kanan Jauh', icon: '↘' }
  if (b < 202.5) return { label: 'Putar Balik', icon: '↓' }
  if (b < 247.5) return { label: 'Kiri Jauh', icon: '↙' }
  if (b < 292.5) return { label: 'Belok Kiri', icon: '←' }
  return { label: 'Belok Kiri', icon: '↖' }
}

// ── User triangle icon ─────────────────────────────────────────
function makeTriangleIcon(bearing: number): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `<div style="width:36px;height:36px;display:flex;align-items:center;justify-content:center">
      <svg width="36" height="36" viewBox="0 0 36 36">
        <circle cx="18" cy="18" r="16" fill="rgba(99,102,241,0.15)" stroke="#6366f1" stroke-width="1.5"/>
        <polygon points="18,5 26,28 18,23 10,28" fill="#6366f1" transform="rotate(${bearing}, 18, 18)"/>
        <circle cx="18" cy="18" r="3" fill="white"/>
      </svg>
    </div>`,
    iconSize: [36, 36], iconAnchor: [18, 18],
  })
}

// Emergency user icon (red)
function makeEmergencyIcon(bearing: number): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `<div style="width:36px;height:36px;display:flex;align-items:center;justify-content:center">
      <svg width="36" height="36" viewBox="0 0 36 36">
        <circle cx="18" cy="18" r="16" fill="rgba(239,68,68,0.15)" stroke="#ef4444" stroke-width="1.5"/>
        <polygon points="18,5 26,28 18,23 10,28" fill="#ef4444" transform="rotate(${bearing}, 18, 18)"/>
        <circle cx="18" cy="18" r="3" fill="white"/>
      </svg>
    </div>`,
    iconSize: [36, 36], iconAnchor: [18, 18],
  })
}

const shelterIcon = L.divIcon({
  className: '',
  html: `<div style="width:30px;height:30px;background:#22c55e;border:2px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 0 12px rgba(34,197,94,0.6)">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9,22 9,12 15,12 15,22"/>
    </svg>
  </div>`,
  iconSize: [30, 30], iconAnchor: [15, 15],
})

// ── Map Markers & Bearing Controller ─────────────────────────
function NavMapController({ userPos, heading, emergency, routeCoords, shelterPos, shelterName, headingLocked }: {
  userPos: [number, number] | null
  heading: number
  emergency: boolean
  routeCoords: [number, number][]
  shelterPos: [number, number] | undefined
  shelterName: string
  headingLocked: boolean
}) {
  const map = useMap()
  const userMarker = useRef<L.Marker | null>(null)
  const shelterMarker = useRef<L.Marker | null>(null)
  const isFirstRef = useRef(true)

  // Enable touch rotation (preserves position between renders)
  useEffect(() => {
    const m = map as any
    if (m.touchRotate) { try { m.touchRotate.enable() } catch {} }
  }, [map])

  // Auto-rotate to heading ONLY in emergency+headingLocked mode
  useEffect(() => {
    if (!emergency || !headingLocked) return
    const m = map as any
    if (typeof m.setBearing === 'function') m.setBearing(heading)
  }, [map, heading, emergency, headingLocked])

  // Pan to user only on first render or when emergency mode starts
  useEffect(() => {
    if (!userPos) return
    if (isFirstRef.current || emergency) {
      map.setView(userPos, 16, { animate: true, duration: 0.6 })
      isFirstRef.current = false
    } else {
      // Gentle pan without resetting zoom/bearing
      map.panTo(userPos, { animate: true, duration: 0.4 })
    }
  }, [map, userPos, emergency])

  // User position marker
  useEffect(() => {
    if (!userPos) return
    const icon = emergency ? makeEmergencyIcon(heading) : makeTriangleIcon(heading)
    if (!userMarker.current) {
      userMarker.current = L.marker(userPos, { icon, zIndexOffset: 1000 }).addTo(map)
    } else {
      userMarker.current.setLatLng(userPos)
      userMarker.current.setIcon(icon)
    }
  }, [map, userPos, heading, emergency])

  // Shelter marker
  useEffect(() => {
    if (!shelterPos || shelterMarker.current) return
    shelterMarker.current = L.marker(shelterPos, { icon: shelterIcon }).addTo(map)
    shelterMarker.current.bindPopup(`<b>${shelterName}</b><br/>Titik Evakuasi Aman`)
    return () => { shelterMarker.current?.remove(); shelterMarker.current = null }
  }, [map, shelterPos, shelterName])

  useEffect(() => () => {
    userMarker.current?.remove()
  }, [])

  return null
}

// ── Bearing tracker ───────────────────────────────────────────
function BearingTracker({ onBearing }: { onBearing: (b: number) => void }) {
  const map = useMap()
  useEffect(() => {
    const m = map as any
    const h = () => { if (m.getBearing) onBearing(m.getBearing()) }
    map.on('rotate' as any, h)
    return () => { map.off('rotate' as any, h) }
  }, [map, onBearing])
  return null
}

// ── MAIN NavigatePage ─────────────────────────────────────────
export default function NavigatePage({ routes, selectedRoute, tsunamiAlert, userPosition, onBack }: Props) {
  const [showMedical, setShowMedical] = useState(false)
  const [deviceHeading, setDeviceHeading] = useState<number | null>(null)
  const [mapBearing, setMapBearing] = useState(0)
  const [headingLocked, setHeadingLocked] = useState(true) // heading-up by default in emergency
  const mapRef = useRef<L.Map | null>(null)

  const route = routes[selectedRoute]
  const shelterPos = route?.coordinates[route.coordinates.length - 1] as [number, number] | undefined
  const routeCoords = (route?.coordinates ?? []) as [number, number][]
  const computedBearing = (userPosition && shelterPos) ? getBearing(userPosition, shelterPos) : 0
  const heading = deviceHeading ?? computedBearing

  const distanceM = (userPosition && shelterPos)
    ? haversineM(userPosition, shelterPos)
    : (route?.totalDistance ? route.totalDistance * 1000 : 0)
  const distanceLabel = distanceM < 1000 ? `${Math.round(distanceM)}m` : `${(distanceM/1000).toFixed(1)} km`
  const etaMin = Math.max(1, Math.ceil(distanceM / 1000 / 5 * 60))
  const { label: mainInstruction, icon: dirIcon } = bearingLabel(heading)
  const mapCenter: [number, number] = userPosition ?? (shelterPos ?? [-0.8917, 119.8577])

  // Reset heading lock when switching between normal/emergency
  useEffect(() => { setHeadingLocked(true) }, [tsunamiAlert])

  // Device compass
  useEffect(() => {
    const handler = (e: DeviceOrientationEvent) => {
      if (e.alpha !== null) setDeviceHeading((360 - e.alpha) % 360)
    }
    const req = (DeviceOrientationEvent as any).requestPermission
    if (typeof req === 'function') {
      req().then((p: string) => { if (p === 'granted') window.addEventListener('deviceorientation', handler) })
    } else {
      window.addEventListener('deviceorientation', handler)
    }
    return () => window.removeEventListener('deviceorientation', handler)
  }, [])

  const resetNorth = useCallback(() => {
    const m = mapRef.current as any
    if (m?.setBearing) { m.setBearing(0); setMapBearing(0) }
  }, [])

  // Medical modal
  if (showMedical) return (
    <div className="fixed inset-0 z-[1900] flex items-center justify-center bg-black/90 p-6">
      <motion.div initial={{ scale:0.85,opacity:0 }} animate={{ scale:1,opacity:1 }}
        className="w-full max-w-sm p-6 rounded-3xl border border-red-500/40 bg-[#150808] text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
          <Phone className="w-8 h-8 text-red-400"/>
        </div>
        <h3 className="text-xl font-black text-white mb-2">Bantuan Medis</h3>
        <p className="text-sm text-slate-400 mb-6">Tim SAR akan dikirimkan ke koordinat GPS Anda saat ini.</p>
        <button className="w-full py-3.5 bg-red-600 text-white rounded-2xl font-black text-sm mb-3">KIRIM PERMINTAAN BANTUAN</button>
        <button onClick={()=>setShowMedical(false)} className="w-full py-3 bg-slate-800 text-slate-300 rounded-2xl font-bold text-sm">Batal</button>
      </motion.div>
    </div>
  )

  // Header color based on mode
  const headerBg = tsunamiAlert ? '#0f0505' : '#0a1020'
  const headerBorder = tsunamiAlert ? 'border-red-900/40' : 'border-slate-800/60'

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="fixed inset-0 z-[1800] flex flex-col" style={{background:'#080e1a'}}>

      {/* ── Header ── */}
      <div className={`shrink-0 flex items-center justify-between px-4 py-3 border-b ${headerBorder}`}
        style={{background: headerBg}}>
        <div className="flex items-center gap-2">
          {onBack && (
            <button onClick={onBack}
              className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
                tsunamiAlert ? 'bg-red-900/30 border-red-800/50' : 'bg-slate-800/60 border-slate-700/50'
              }`}>
              <ChevronLeft className={`w-4 h-4 ${tsunamiAlert ? 'text-red-300' : 'text-slate-400'}`}/>
            </button>
          )}
          {tsunamiAlert
            ? <AlertTriangle className="w-5 h-5 text-amber-400 animate-pulse"/>
            : <Compass className="w-5 h-5 text-indigo-400"/>
          }
          <span className="text-sm font-black text-white tracking-widest">
            {tsunamiAlert ? 'AEGIS RESPONSE' : 'NAVIGASI'}
          </span>
        </div>
        {tsunamiAlert
          ? <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-600 border border-red-500/50">
              <div className="w-1.5 h-1.5 rounded-full bg-red-200 animate-pulse"/>
              <span className="text-xs font-black text-white">EMERGENCY ACTIVE</span>
            </div>
          : <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/60 border border-slate-700/40">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"/>
              <span className="text-xs font-bold text-slate-300">PETA EVAKUASI</span>
            </div>
        }
      </div>

      {/* ── Destination card (compact) ── */}
      {route && (
        <div className="shrink-0 px-3 pt-2 pb-1.5">
          <div className={`p-3 rounded-2xl border flex items-center gap-3 ${
            tsunamiAlert ? 'border-red-800/40' : 'border-slate-700/40'
          }`} style={{background: tsunamiAlert ? '#160808' : '#0f1a2e'}}>
            <div className={`w-1 self-stretch rounded-full shrink-0 ${tsunamiAlert ? 'bg-red-500' : 'bg-indigo-500'}`}/>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">
                {tsunamiAlert ? 'Rute Evakuasi Aktif' : 'Shelter Terdekat'}
              </p>
              <p className="text-sm font-black text-white truncate">{route.shelterName}</p>
            </div>
            <div className="text-right shrink-0">
              <p className={`text-base font-black ${tsunamiAlert ? 'text-red-300' : 'text-white'}`}>{distanceLabel}</p>
              <p className="text-[9px] text-slate-500 font-bold">{etaMin} mnt</p>
            </div>
          </div>
        </div>
      )}

      {/* ── MAP AREA ── */}
      <div className="flex-1 relative overflow-hidden min-h-0">
        <MapContainer
          center={mapCenter} zoom={15}
          zoomControl={false} attributionControl={false}
          className="w-full h-full"
          ref={mapRef as any}
          {...({ rotate: true, touchRotate: true } as any)}
        >
          <TileLayer url={TILE_DARK} maxNativeZoom={20} maxZoom={20}/>
          {routeCoords.length > 0 && <>
            <Polyline positions={routeCoords}
              color={tsunamiAlert ? '#ef4444' : '#6366f1'} weight={5} opacity={0.85}/>
            <Polyline positions={routeCoords}
              color={tsunamiAlert ? '#fca5a5' : '#818cf8'} weight={10} opacity={0.2}/>
          </>}
          <NavMapController
            userPos={userPosition}
            heading={heading}
            emergency={tsunamiAlert}
            routeCoords={routeCoords}
            shelterPos={shelterPos}
            shelterName={route?.shelterName ?? ''}
            headingLocked={headingLocked}
          />
          <BearingTracker onBearing={setMapBearing}/>
        </MapContainer>

        {/* Compass */}
        <div className="absolute top-3 right-3 z-[500] flex flex-col gap-2">
          <CompassWidget bearing={mapBearing} onReset={resetNorth}/>
          {/* Heading lock toggle (emergency only) */}
          {tsunamiAlert && (
            <button onClick={() => setHeadingLocked(!headingLocked)}
              title={headingLocked ? 'Klik untuk bebas putar' : 'Klik untuk heading-up'}
              className={`w-11 h-11 rounded-full flex items-center justify-center border shadow-lg ${
                headingLocked
                  ? 'bg-red-600/80 border-red-500/60 text-white'
                  : 'bg-slate-900/80 border-slate-700/60 text-slate-400'
              }`}>
              {headingLocked ? <Lock className="w-4 h-4"/> : <Unlock className="w-4 h-4"/>}
            </button>
          )}
        </div>

        {/* Bearing display */}
        <div className="absolute bottom-3 left-3 z-[500] px-2 py-1.5 rounded-xl bg-slate-900/80 border border-slate-700/60">
          <p className="text-[10px] font-black text-white">{Math.round(mapBearing)}°</p>
          <p className="text-[8px] text-slate-500">BEARING</p>
        </div>

        {/* No GPS prompt */}
        {!userPosition && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[500] px-3 py-1.5 rounded-xl bg-amber-900/80 border border-amber-700/60">
            <p className="text-[10px] font-bold text-amber-300">GPS belum aktif</p>
          </div>
        )}
      </div>

      {/* ── Direction (emergency only) ── */}
      {tsunamiAlert && route && (
        <div className="shrink-0 px-4 py-2 text-center border-t border-red-900/30"
          style={{background:'#100505'}}>
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-red-600/20 border border-red-500/30 flex items-center justify-center shrink-0">
              <span className="text-2xl font-black text-red-300">{dirIcon}</span>
            </div>
            <div className="text-left">
              <h1 className="text-xl font-black text-white leading-none">{mainInstruction}</h1>
              <p className="text-xs text-slate-400">{distanceLabel} → {route.shelterName}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Next step (emergency only) ── */}
      {tsunamiAlert && route && (
        <div className="shrink-0 px-3 pb-2" style={{background:'#100505'}}>
          <div className="p-2.5 rounded-xl border border-red-800/30 flex items-center gap-2.5" style={{background:'#160808'}}>
            <div className="w-7 h-7 rounded-lg bg-red-500/20 flex items-center justify-center shrink-0">
              <ArrowRight className="w-3.5 h-3.5 text-red-400"/>
            </div>
            <div>
              <p className="text-[9px] text-red-400 uppercase tracking-widest font-bold">Langkah Berikutnya</p>
              <p className="text-xs font-bold text-white">
                {heading < 180 ? 'Belok Kanan di Persimpangan' : 'Belok Kiri di Persimpangan'}
              </p>
            </div>
            <MapPin className="w-3.5 h-3.5 text-slate-600 ml-auto shrink-0"/>
          </div>
        </div>
      )}

      {/* ── Medical button (emergency only) ── */}
      {tsunamiAlert && (
        <div className="shrink-0 px-3 pb-4" style={{background:'#100505'}}>
          <button onClick={()=>setShowMedical(true)}
            className="w-full py-3 rounded-2xl bg-red-600 text-white font-black text-sm tracking-wide flex items-center justify-center gap-2">
            <span>🏥</span> BANTUAN MEDIS DARURAT
          </button>
        </div>
      )}

      {/* ── Normal mode info ── */}
      {!tsunamiAlert && (
        <div className="shrink-0 px-4 py-3 border-t border-slate-800/40" style={{background:'#0a1020'}}>
          <div className="flex items-center gap-3">
            <Navigation2 className="w-4 h-4 text-indigo-400 shrink-0"/>
            <div className="flex-1">
              <p className="text-[10px] text-slate-500 font-bold">MODE NORMAL · Peta Evakuasi</p>
              <p className="text-xs text-slate-300">
                {route ? `Shelter terdekat: ${route.shelterName}` : 'Aktifkan GPS untuk melihat shelter terdekat'}
              </p>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}
