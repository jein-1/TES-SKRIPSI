// ═══════════════════════════════════════════════════════════════
// NAVIGATE PAGE — Peta interaktif shelter, rute & simulasi
// Normal: tampilkan semua shelter + pilih rute, BEBAS gerak peta
// Emergency: rute aktif (merah), arah ke shelter terdekat
// Admin: TIDAK ditampilkan (admin pakai admin map)
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect, useRef, useCallback } from 'react'
import { MapContainer, TileLayer, Polyline, Polygon, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-rotate'
import {
  AlertTriangle, Navigation2, Phone, ChevronLeft,
  MapPin, Compass, Lock, Unlock, ChevronRight, ArrowRight
} from 'lucide-react'
import { motion } from 'motion/react'
import type { RouteResult } from '../../lib/evacuation'
import { shelters, hazardZones } from '../../lib/evacuation'
import { TILE_NORMAL } from '../../constants/mapConfig'
import { CompassWidget } from '../map/MapRotation'

interface Props {
  routes: RouteResult[]
  selectedRoute: number
  tsunamiAlert: boolean
  userPosition: [number, number] | null
  onBack?: () => void
}

// ── Helpers ────────────────────────────────────────────────────
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
  if (b < 67.5)  return { label: 'Kanan Diagonal', icon: '↗' }
  if (b < 112.5) return { label: 'Belok Kanan', icon: '→' }
  if (b < 157.5) return { label: 'Kanan Jauh', icon: '↘' }
  if (b < 202.5) return { label: 'Putar Balik', icon: '↓' }
  if (b < 247.5) return { label: 'Kiri Jauh', icon: '↙' }
  if (b < 292.5) return { label: 'Belok Kiri', icon: '←' }
  return { label: 'Kiri Diagonal', icon: '↖' }
}

// ── Shelter icon menggunakan div CSS (bukan SVG inline agar muncul di WebView) ──
function makeShelterIcon(isNearest: boolean, isEmergency: boolean): L.DivIcon {
  const bg    = isNearest && isEmergency ? '#ef4444' : isNearest ? '#22c55e' : '#334155'
  const shadow = isNearest ? (isEmergency ? 'rgba(239,68,68,0.7)' : 'rgba(34,197,94,0.7)') : 'none'
  return L.divIcon({
    className: '',
    html: `<div style="
      width:30px;height:30px;
      background:${bg};
      border:2.5px solid #fff;
      border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      box-shadow:0 0 12px ${shadow};
      font-size:13px;line-height:1;
    ">🏠</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -16],
  })
}

// ── User position icon ─────────────────────────────────────────
function makeUserIcon(bearing: number, emergency = false): L.DivIcon {
  const col = emergency ? '#ef4444' : '#3b82f6'
  const pulseAnim = emergency ? 'haloPulseFast' : 'haloPulse'
  return L.divIcon({
    className: '',
    html: `<div style="position:relative;width:60px;height:60px;">
      <!-- Flashlight / Beam -->
      <svg style="position:absolute;top:0;left:0;width:100%;height:100%;transform:rotate(${bearing}deg);transform-origin:50% 50%;" viewBox="0 0 100 100">
         <defs>
           <radialGradient id="grad-${emergency ? 'red' : 'blue'}" cx="50%" cy="50%" r="50%">
             <stop offset="0%" stop-color="${col}" stop-opacity="0.6" />
             <stop offset="100%" stop-color="${col}" stop-opacity="0" />
           </radialGradient>
         </defs>
         <polygon points="50,50 20,5 80,5" fill="url(#grad-${emergency ? 'red' : 'blue'})" />
      </svg>
      <!-- Pulsing Halo -->
      <div style="position:absolute;top:18px;left:18px;width:24px;height:24px;background:${col};border-radius:50%;animation:${pulseAnim} ${emergency ? '1s' : '2s'} infinite;"></div>
      <!-- Center Dot -->
      <div style="position:absolute;top:22px;left:22px;width:16px;height:16px;background:${col};border:2.5px solid white;border-radius:50%;box-shadow:0 0 6px rgba(0,0,0,0.4);"></div>
    </div>`,
    iconSize: [60, 60],
    iconAnchor: [30, 30],
  })
}

// ── Map controller — hanya center SEKALI saat pertama / awal emergency ──
function NavMapController({ userPos, heading, emergency, headingLocked }: {
  userPos: [number, number] | null
  heading: number
  emergency: boolean
  headingLocked: boolean
}) {
  const map = useMap()
  const userMarker = useRef<L.Marker | null>(null)
  const centeredRef = useRef(false)   // hanya center sekali

  useEffect(() => {
    const m = map as any
    if (m.touchRotate) { try { m.touchRotate.enable() } catch {} }
  }, [map])

  // Auto-rotate bearing saat emergency + locked
  useEffect(() => {
    if (!emergency || !headingLocked) return
    const m = map as any
    if (typeof m.setBearing === 'function') m.setBearing(heading)
  }, [map, heading, emergency, headingLocked])

  // Center HANYA saat pertama kali dapat GPS, atau saat emergency pertama kali aktif
  useEffect(() => {
    if (!userPos) return
    if (!centeredRef.current) {
      map.setView(userPos, 16, { animate: true, duration: 0.7 })
      centeredRef.current = true
    }
  }, [map, userPos])

  // Re-center saat emergency baru aktif
  useEffect(() => {
    if (!emergency || !userPos) return
    map.setView(userPos, 16, { animate: true, duration: 0.7 })
  }, [map, emergency]) // eslint-disable-line react-hooks/exhaustive-deps

  // User marker
  useEffect(() => {
    if (!userPos) return
    const icon = makeUserIcon(heading, emergency)
    if (!userMarker.current) {
      userMarker.current = L.marker(userPos, { icon, zIndexOffset: 1000 }).addTo(map)
    } else {
      userMarker.current.setLatLng(userPos)
      userMarker.current.setIcon(icon)
    }
  }, [map, userPos, heading, emergency])

  useEffect(() => () => { userMarker.current?.remove() }, [])
  return null
}

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

// ── MAIN ──────────────────────────────────────────────────────
export default function NavigatePage({ routes, selectedRoute, tsunamiAlert, userPosition, onBack }: Props) {
  const [showMedical, setShowMedical]     = useState(false)
  const [deviceHeading, setDeviceHeading] = useState<number | null>(null)
  const [mapBearing, setMapBearing]       = useState(0)
  const [headingLocked, setHeadingLocked] = useState(true)
  const [activeRouteIdx, setActiveRouteIdx] = useState(selectedRoute)
  const [showRoutePanel, setShowRoutePanel] = useState(true)
  const mapRef = useRef<L.Map | null>(null)
  const emergency = tsunamiAlert

  // Selalu hitung index shelter terdekat dari posisi user saat ini
  // agar rute aktif tetap konsisten "paling dekat".
  const nearestIdx = userPosition
    ? (() => {
        if (routes.length === 0) return 0
        let minDist = Infinity, idx = 0
        routes.forEach((r, i) => {
          const sp = r.coordinates[r.coordinates.length - 1] as [number, number]
          if (!sp) return
          const d = haversineM(userPosition, sp)
          if (d < minDist) { minDist = d; idx = i }
        })
        return idx
      })()
    : selectedRoute

  // Sync rute aktif ke shelter terdekat saat data/posisi berubah
  useEffect(() => {
    setActiveRouteIdx(nearestIdx)
  }, [nearestIdx])

  useEffect(() => { setHeadingLocked(true) }, [tsunamiAlert])

  const route       = routes[activeRouteIdx]
  const shelterPos  = route ? [shelters.find(s => s.id === route.shelterId)?.lat ?? route.coordinates[route.coordinates.length-1]?.[0], shelters.find(s => s.id === route.shelterId)?.lng ?? route.coordinates[route.coordinates.length-1]?.[1]] as [number, number] : undefined

  const computedBearing = (userPosition && shelterPos) ? getBearing(userPosition, shelterPos) : 0
  const heading = deviceHeading ?? computedBearing

  const distanceM   = (userPosition && shelterPos) ? haversineM(userPosition, shelterPos) : (route?.totalDistance ? route.totalDistance * 1000 : 0)
  const distLabel   = distanceM < 1000 ? `${Math.round(distanceM)}m` : `${(distanceM/1000).toFixed(1)} km`
  const etaMin      = Math.max(1, Math.ceil(distanceM / 1000 / 5 * 60))
  const { label: mainDir, icon: dirIcon } = bearingLabel(heading)
  const mapCenter: [number, number]       = userPosition ?? [-0.8917, 119.8577]

  // Device compass
  useEffect(() => {
    const handler = (e: any) => {
      if (e.webkitCompassHeading !== undefined) {
        setDeviceHeading(e.webkitCompassHeading)
      } else if (e.alpha !== null) {
        setDeviceHeading((360 - e.alpha) % 360)
      }
    }
    const req = (DeviceOrientationEvent as any).requestPermission
    if (typeof req === 'function') {
      req().then((p: string) => { 
        if (p === 'granted') window.addEventListener('deviceorientation', handler) 
      })
    } else {
      if ('ondeviceorientationabsolute' in window) {
        window.addEventListener('deviceorientationabsolute', handler)
      } else {
        window.addEventListener('deviceorientation', handler)
      }
    }
    return () => {
      window.removeEventListener('deviceorientationabsolute', handler)
      window.removeEventListener('deviceorientation', handler)
    }
  }, [])

  const resetNorth = useCallback(() => {
    const m = mapRef.current as any
    if (m?.setBearing) { m.setBearing(0); setMapBearing(0) }
  }, [])

  // Re-center button
  const recenterMap = useCallback(() => {
    if (userPosition && mapRef.current) {
      mapRef.current.setView(userPosition, 16, { animate: true, duration: 0.5 })
    }
  }, [userPosition])

  const headerBg = emergency ? '#0f0505' : '#0a1020'
  const headerBorder = emergency ? 'border-red-900/40' : 'border-slate-800/60'

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

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="fixed inset-0 z-[1800] flex flex-col" style={{background:'#080e1a'}}>

      {/* Header */}
      <div className={`shrink-0 flex items-center justify-between px-4 py-3 border-b ${headerBorder}`} style={{background: headerBg}}>
        <div className="flex items-center gap-2">
          {onBack && (
            <button onClick={onBack}
              className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
                emergency ? 'bg-red-900/30 border-red-800/50' : 'bg-slate-800/60 border-slate-700/50'
              }`}>
              <ChevronLeft className={`w-4 h-4 ${emergency ? 'text-red-300' : 'text-slate-400'}`}/>
            </button>
          )}
          {emergency
            ? <AlertTriangle className="w-5 h-5 text-amber-400 animate-pulse"/>
            : <Compass className="w-5 h-5 text-indigo-400"/>
          }
          <span className="text-sm font-black text-white tracking-widest">
            {emergency ? 'RUTE EVAKUASI DARURAT' : 'PETA EVAKUASI'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {!emergency && (
            <button onClick={() => setShowRoutePanel(p => !p)}
              className="px-2 py-1.5 rounded-xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-[9px] font-black">
              {showRoutePanel ? 'TUTUP' : 'RUTE'}
            </button>
          )}
          {emergency
            ? <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-600 border border-red-500/50">
                <div className="w-1.5 h-1.5 rounded-full bg-red-200 animate-pulse"/>
                <span className="text-xs font-black text-white">EMERGENCY</span>
              </div>
            : <div className="flex items-center gap-2 px-2 py-1.5 rounded-xl bg-emerald-900/40 border border-emerald-700/40">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"/>
                <span className="text-xs font-bold text-emerald-300">{shelters.length} SHELTER</span>
              </div>
          }
        </div>
      </div>

      {/* Active shelter card */}
      {route && (
        <div className="shrink-0 px-3 pt-2 pb-1.5">
          <div className={`p-3 rounded-2xl border flex items-center gap-3 ${
            emergency ? 'border-red-800/40' : 'border-slate-700/40'
          }`} style={{background: emergency ? '#160808' : '#0f1a2e'}}>
            <div className={`w-1 self-stretch rounded-full shrink-0 ${emergency ? 'bg-red-500' : 'bg-emerald-500'}`}/>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">
                {emergency ? '🚨 Rute Evakuasi Aktif' : '🏠 Shelter Terdekat'}
              </p>
              <p className="text-sm font-black text-white truncate">{route.shelterName}</p>
            </div>
            <div className="text-right shrink-0">
              <p className={`text-base font-black ${emergency ? 'text-red-300' : 'text-white'}`}>{distLabel}</p>
              <p className="text-[9px] text-slate-500 font-bold">{etaMin} mnt berjalan</p>
            </div>
          </div>
        </div>
      )}

      {/* MAP */}
      <div className="flex-1 relative overflow-hidden min-h-0">
        <MapContainer
          center={mapCenter} zoom={14}
          zoomControl={false} attributionControl={false}
          className="w-full h-full"
          ref={mapRef as any}
          {...({ rotate: true, touchRotate: true } as any)}
        >
          <TileLayer url={TILE_NORMAL} maxNativeZoom={20} maxZoom={20}/>

          {/* Hazard zones */}
          {hazardZones.map((zone, i) => (
            <Polygon key={i}
              positions={zone.coords as [number,number][]}
              pathOptions={{ color:'#ef4444', fillColor:'#ef4444', fillOpacity:0.12, weight:1.5, dashArray:'5 5' }}
            />
          ))}

          {/* Shelter markers — selalu tampil */}
          {shelters.map((s, i) => {
            const isNearest = routes.length > 0 && routes[activeRouteIdx]?.shelterName === s.name
            const pos: [number, number] = [s.lat, s.lng]
            const distKm = userPosition ? (haversineM(userPosition, pos)/1000).toFixed(2) : null
            return (
              <Marker key={s.id} position={pos} icon={makeShelterIcon(isNearest, emergency)}>
                <Popup>
                  <div style={{ minWidth: 160, background: '#0f1a2e', padding: 4, borderRadius: 8 }}>
                    <p style={{ fontWeight: 900, fontSize: 13, color: '#fff', margin: '0 0 4px' }}>{s.name}</p>
                    <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 2px' }}>
                      👥 Kapasitas: <b style={{ color: '#22c55e' }}>{s.capacity.toLocaleString()} orang</b>
                    </p>
                    {distKm && (
                      <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 8px' }}>
                        📍 Jarak: <b style={{ color: '#818cf8' }}>{distKm} km</b>
                      </p>
                    )}
                    {routes.length > 0 && (() => {
                      const idx = routes.findIndex(r => r.shelterName === s.name)
                      if (idx < 0) return null
                      return (
                        <button
                          style={{ width:'100%', padding:'6px 0', background: isNearest ? '#22c55e' : '#6366f1', color:'#fff', border:'none', borderRadius:8, fontWeight:900, fontSize:12, cursor:'pointer' }}
                          onClick={() => setActiveRouteIdx(idx)}>
                          {isNearest ? '✓ Rute Aktif' : '🗺️ Pilih Rute Ini'}
                        </button>
                      )
                    })()}
                  </div>
                </Popup>
              </Marker>
            )
          })}

          {/* ─── GARIS LURUS BEELINE (khusus mode simulasi) ─── */}
          {emergency && userPosition && shelterPos && (
            <Polyline
              positions={[userPosition, shelterPos]}
              color="#f59e0b" weight={3} opacity={0.9} dashArray="8 10"
            />
          )}

          <NavMapController
            userPos={userPosition}
            heading={heading}
            emergency={emergency}
            headingLocked={headingLocked}
          />
          <BearingTracker onBearing={setMapBearing}/>
        </MapContainer>

        {/* Controls */}
        <div className="absolute top-3 right-3 z-[500] flex flex-col gap-2">
          <CompassWidget bearing={mapBearing} onReset={resetNorth}/>
          {/* Re-center button */}
          <button onClick={recenterMap}
            className="w-11 h-11 rounded-full flex items-center justify-center bg-slate-900/80 border border-slate-700/60 text-white shadow-lg"
            title="Kembali ke posisi saya">
            <Navigation2 className="w-4 h-4 text-indigo-400"/>
          </button>
          {emergency && (
            <button onClick={() => setHeadingLocked(!headingLocked)}
              className={`w-11 h-11 rounded-full flex items-center justify-center border shadow-lg ${
                headingLocked ? 'bg-red-600/80 border-red-500/60 text-white' : 'bg-slate-900/80 border-slate-700/60 text-slate-400'
              }`}>
              {headingLocked ? <Lock className="w-4 h-4"/> : <Unlock className="w-4 h-4"/>}
            </button>
          )}
        </div>

        {/* Bearing */}
        <div className="absolute bottom-3 left-3 z-[500] px-2 py-1.5 rounded-xl bg-slate-900/80 border border-slate-700/60">
          <p className="text-[10px] font-black text-white">{Math.round(mapBearing)}°</p>
          <p className="text-[8px] text-slate-500">BEARING</p>
        </div>

        {!userPosition && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[500] px-3 py-1.5 rounded-xl bg-amber-900/80 border border-amber-700/60">
            <p className="text-[10px] font-bold text-amber-300">⏳ Mendeteksi GPS...</p>
          </div>
        )}
      </div>

      {/* Route panel (normal mode) */}
      {!emergency && showRoutePanel && routes.length > 0 && (
        <div className="shrink-0 border-t border-slate-800/50" style={{background:'#0a1020', maxHeight: 210, overflowY: 'auto'}}>
          <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold px-3 pt-2 pb-0.5">Pilih Rute Evakuasi</p>
          {routes.slice(0, 10).map((r, i) => {
            const dKm  = r.totalDistance === Infinity ? '—' : `${r.totalDistance.toFixed(2)} km`
            const t    = r.totalDistance === Infinity ? '—' : `${r.walkingTime} mnt`
            const cap  = shelters.find(s => s.name === r.shelterName)?.capacity?.toLocaleString() ?? '—'
            const isAct = i === activeRouteIdx
            return (
              <button key={r.shelterName} onClick={() => setActiveRouteIdx(i)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 border-b border-slate-800/30 text-left transition-colors ${isAct ? 'bg-indigo-600/20' : 'hover:bg-slate-800/40'}`}>
                <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs font-black ${isAct ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-400'}`}>{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-black truncate ${isAct ? 'text-white' : 'text-slate-300'}`}>{r.shelterName}</p>
                  <p className="text-[9px] text-slate-500">Kapasitas: {cap} orang</p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-sm font-black ${isAct ? 'text-indigo-300' : 'text-slate-400'}`}>{dKm}</p>
                  <p className="text-[9px] text-slate-600">{t}</p>
                </div>
                {isAct && <ChevronRight className="w-3.5 h-3.5 text-indigo-400 shrink-0"/>}
              </button>
            )
          })}
        </div>
      )}

      {/* Emergency direction */}
      {emergency && route && (
        <div className="shrink-0 px-4 py-2 text-center border-t border-red-900/30" style={{background:'#100505'}}>
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-red-600/20 border border-red-500/30 flex items-center justify-center shrink-0">
              <span className="text-2xl font-black text-red-300">{dirIcon}</span>
            </div>
            <div className="text-left">
              <h1 className="text-xl font-black text-white leading-none">{mainDir}</h1>
              <p className="text-xs text-slate-400">{distLabel} → {route.shelterName}</p>
            </div>
          </div>
        </div>
      )}
      {emergency && route && (
        <div className="shrink-0 px-3 pb-1 pt-1.5" style={{background:'#100505'}}>
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
      {emergency && (
        <div className="shrink-0 px-3 pb-4 pt-1" style={{background:'#100505'}}>
          <button onClick={()=>setShowMedical(true)}
            className="w-full py-3 rounded-2xl bg-red-600 text-white font-black text-sm tracking-wide flex items-center justify-center gap-2">
            <span>🏥</span> BANTUAN MEDIS DARURAT
          </button>
        </div>
      )}
    </motion.div>
  )
}
