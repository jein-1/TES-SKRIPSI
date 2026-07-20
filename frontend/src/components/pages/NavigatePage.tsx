// ═══════════════════════════════════════════════════════════════
// NAVIGATE PAGE — Peta interaktif shelter, rute & simulasi (MAPCN VERSION)
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Map, MapMarker, MarkerContent, MapRoute, MapGeoJSON, type MapViewport, type MapRef } from '@/components/ui/map'
import { fetchOsrmRoute, type OsrmRouteData } from '../../lib/osrm'
import {
  AlertTriangle, Navigation2, Phone, ChevronLeft,
  MapPin, Compass, Lock, Unlock, ChevronRight, ArrowRight, Radio
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { findOptimalEvacuationRoutes, type RouteResult } from "../../lib/evacuation";
import { useBMKG, createCirclePolygon } from "../../lib/useBMKG";
import { shelters, hazardZones } from '../../lib/evacuation'
import { Geolocation } from '@capacitor/geolocation'
import type * as GeoJSON from 'geojson'

interface Props {
  routes: RouteResult[]
  selectedRoute: number
  tsunamiAlert: boolean
  userPosition: [number, number] | null
  onBack?: () => void
  adminPing?: { fromName: string; role: string; fromId: string } | null
  onAdminPingDismiss?: () => void
  onStartGps?: () => void
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

// ── MAIN ──────────────────────────────────────────────────────
export default function NavigatePage({ routes, selectedRoute, tsunamiAlert, userPosition, onBack, adminPing, onAdminPingDismiss, onStartGps }: Props) {
  const { gempa } = useBMKG();
  const [showMedical, setShowMedical]     = useState(false)
  const [deviceHeading, setDeviceHeading] = useState<number | null>(null)
  const [headingLocked, setHeadingLocked] = useState(true)
  const [activeRouteIdx, setActiveRouteIdx] = useState(selectedRoute)
  const [showRoutePanel, setShowRoutePanel] = useState(true)
  const [localPos, setLocalPos] = useState<[number,number] | null>(null)
  const mapRef = useRef<MapRef | null>(null)
  const [showCalibration, setShowCalibration] = useState(() => !sessionStorage.getItem('compassCalibrated'))
  
  // OSRM Data
  const [osrmRoutes, setOsrmRoutes] = useState<OsrmRouteData[]>([])

  const [viewport, setViewport] = useState<MapViewport>({
    center: [119.8577, -0.8917], // MapLibre uses [lng, lat]
    zoom: 14,
    bearing: 0,
    pitch: 0
  })

  // Convert to [lng, lat] for MapLibre
  const effectivePosRaw = userPosition ?? localPos
  const effectivePos: [number, number] | null = effectivePosRaw ? [effectivePosRaw[1], effectivePosRaw[0]] : null

  useEffect(() => {
    if (userPosition) { setLocalPos(userPosition); return }
    let watchId: string | null = null;
    const startWatch = async () => {
      try {
        watchId = await Geolocation.watchPosition({ enableHighAccuracy: true, maximumAge: 5000 }, (p, err) => {
          if (err || !p) return;
          setLocalPos([p.coords.latitude, p.coords.longitude]);
        });
      } catch (e) {}
    };
    startWatch();
    return () => {
      if (watchId) Geolocation.clearWatch({ id: watchId }).catch(() => {});
    };
  }, [userPosition])

  useEffect(() => {
    if (!userPosition && onStartGps) {
      const t = setTimeout(() => onStartGps(), 500)
      return () => clearTimeout(t)
    }
  }, [])

  const handleCalibrate = () => {
    sessionStorage.setItem('compassCalibrated', 'true')
    setShowCalibration(false)
  }
  const emergency = tsunamiAlert

  const activeRoutes = routes.length > 0 ? routes : (effectivePosRaw ? findOptimalEvacuationRoutes(effectivePosRaw[0], effectivePosRaw[1]) : [])
  const nearestIdx = effectivePosRaw
    ? (() => {
        if (activeRoutes.length === 0) return 0
        let minDist = Infinity, idx = 0
        activeRoutes.forEach((r, i) => {
          const sp = r.coordinates[r.coordinates.length - 1] as [number, number]
          if (!sp) return
          const d = haversineM(effectivePosRaw, sp)
          if (d < minDist) { minDist = d; idx = i }
        })
        return idx
      })()
    : selectedRoute

  useEffect(() => {
    setActiveRouteIdx(nearestIdx)
  }, [nearestIdx])

  const route       = activeRoutes[activeRouteIdx]
  const shelterPosRaw  = route ? [shelters.find(s => s.id === route.shelterId)?.lat ?? route.coordinates[route.coordinates.length-1]?.[0], shelters.find(s => s.id === route.shelterId)?.lng ?? route.coordinates[route.coordinates.length-1]?.[1]] as [number, number] : undefined
  const shelterPos: [number, number] | undefined = shelterPosRaw ? [shelterPosRaw[1], shelterPosRaw[0]] : undefined

  // Fetch OSRM Route when origin/destination changes
  useEffect(() => {
    if (effectivePos && shelterPos) {
      fetchOsrmRoute(effectivePos[0], effectivePos[1], shelterPos[0], shelterPos[1])
        .then(data => setOsrmRoutes(data))
        .catch(() => setOsrmRoutes([]))
    }
  }, [effectivePos?.[0], effectivePos?.[1], shelterPos?.[0], shelterPos?.[1]])

  const computedBearing = (effectivePosRaw && shelterPosRaw) ? getBearing(effectivePosRaw, shelterPosRaw) : 0
  const heading = deviceHeading ?? computedBearing

  // Map viewport control
  useEffect(() => {
    if (effectivePos) {
      setViewport(v => ({
        ...v,
        center: effectivePos,
        zoom: 16,
        pitch: emergency ? 60 : 0,
        bearing: (emergency && headingLocked) ? heading : v.bearing
      }))
    }
  }, [effectivePos?.[0], effectivePos?.[1], emergency, heading, headingLocked])

  const distanceM   = (effectivePosRaw && shelterPosRaw) ? haversineM(effectivePosRaw, shelterPosRaw) : (route?.totalDistance ? route.totalDistance * 1000 : 0)
  const distLabel   = osrmRoutes.length > 0 ? (osrmRoutes[0].distance < 1000 ? `${Math.round(osrmRoutes[0].distance)}m` : `${(osrmRoutes[0].distance/1000).toFixed(1)} km`) : (distanceM < 1000 ? `${Math.round(distanceM)}m` : `${(distanceM/1000).toFixed(1)} km`)
  const etaMin      = osrmRoutes.length > 0 ? Math.round(osrmRoutes[0].duration / 60) : Math.max(1, Math.ceil(distanceM / 1000 / 5 * 60))
  const { label: mainDir, icon: dirIcon } = bearingLabel(heading)

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
      if ('ondeviceorientationabsolute' in (window as any)) {
        (window as any).addEventListener('deviceorientationabsolute', handler)
      } else {
        window.addEventListener('deviceorientation', handler)
      }
    }
    return () => {
      (window as any).removeEventListener('deviceorientationabsolute', handler)
      window.removeEventListener('deviceorientation', handler)
    }
  }, [])

  const resetNorth = useCallback(() => {
    setHeadingLocked(false)
    setViewport(v => ({ ...v, bearing: 0, pitch: 0 }))
  }, [])

  const recenterMap = useCallback(() => {
    if (effectivePos) {
      setHeadingLocked(true)
      setViewport(v => ({ ...v, center: effectivePos, zoom: 16 }))
    }
  }, [effectivePos])

  const headerBg = emergency ? '#0f0505' : '#0a1020'
  const headerBorder = emergency ? 'border-red-900/40' : 'border-slate-800/60'

  if (showCalibration) return (
    <div className="fixed inset-0 z-[1900] flex items-center justify-center bg-black/95 p-6">
      <motion.div initial={{ scale:0.85,opacity:0 }} animate={{ scale:1,opacity:1 }}
        className="w-full max-w-sm p-6 rounded-3xl border border-indigo-500/40 bg-[#0a1020] text-center">
        <div className="w-20 h-20 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 16l2.879-2.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-black text-white tracking-wide mb-3">KALIBRASI KOMPAS</h2>
        <p className="text-sm text-slate-400 leading-relaxed mb-6">
          Untuk mendapatkan akurasi arah yang maksimal, mohon gerakkan HP Anda membentuk <b>angka 8</b> di udara beberapa kali.
        </p>
        <button onClick={handleCalibrate}
          className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold tracking-widest text-sm shadow-[0_0_20px_rgba(79,70,229,0.4)]">
          SAYA MENGERTI
        </button>
      </motion.div>
    </div>
  )

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
        <Map
          ref={mapRef}
          viewport={viewport}
          onViewportChange={setViewport}
        >
          {/* BMKG GEMPA TERKINI (Epicenter & Radius) */}
          {gempa && (
            <>
              <MapMarker longitude={gempa.lng} latitude={gempa.lat}>
                <MarkerContent>
                  <div style={{
                    width: 40, height: 40, background: 'rgba(239, 68, 68, 0.2)', border: '2px solid #ef4444',
                    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 0 20px rgba(239, 68, 68, 0.6)', animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite'
                  }}>
                    <div style={{width: 12, height: 12, background: '#ef4444', borderRadius: '50%'}}></div>
                  </div>
                </MarkerContent>
              </MapMarker>
              
              {gempa.Potensi.toLowerCase().includes('tsunami') && (
                <MapGeoJSON
                  data={createCirclePolygon(gempa.lat, gempa.lng, 100) as any}
                  fillPaint={{ 'fill-color': '#ef4444', 'fill-opacity': 0.15 }}
                  linePaint={{ 'line-color': '#ef4444', 'line-width': 2 }}
                />
              )}
            </>
          )}

          {/* Hazard Zones MapGeoJSON */}
          {hazardZones.map((zone, i) => (
            <MapGeoJSON 
              key={`hazard-${i}`}
              data={{
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'Polygon',
                  coordinates: [zone.coords.map(c => [c[1], c[0]])] // [lat, lng] to [lng, lat]
                }
              }}
              fillPaint={{ 'fill-color': '#ef4444', 'fill-opacity': 0.12 }}
              linePaint={{ 'line-color': '#ef4444', 'line-width': 1.5, 'line-dasharray': [5, 5] }}
            />
          ))}

          {/* Shelters */}
          {shelters.map((s, i) => {
            const isNearest = routes.length > 0 && routes[activeRouteIdx]?.shelterName === s.name
            const pos: [number, number] = [s.lng, s.lat]
            const bg = isNearest && emergency ? '#ef4444' : isNearest ? '#22c55e' : '#334155'
            const shadow = isNearest ? (emergency ? 'rgba(239,68,68,0.7)' : 'rgba(34,197,94,0.7)') : 'none'
            return (
              <MapMarker key={s.id} longitude={pos[0]} latitude={pos[1]}>
                <MarkerContent>
                  <div style={{
                    width:30, height:30, background:bg, border:'2.5px solid #fff', borderRadius:'50%',
                    display:'flex', alignItems:'center', justifyContent:'center', boxShadow:`0 0 12px ${shadow}`,
                    fontSize:13, lineHeight:1
                  }}>🏠</div>
                </MarkerContent>
              </MapMarker>
            )
          })}

          {/* Routes (OSRM or straight line) - HANYA MUNCUL SAAT DARURAT */}
          {emergency && (osrmRoutes.length > 0 ? (
            <MapRoute 
              coordinates={osrmRoutes[0].coordinates} 
              color={emergency ? "#ef4444" : "#6366f1"}
              width={6}
              opacity={0.9}
            />
          ) : (
            effectivePos && shelterPos && (
              <MapRoute 
                coordinates={[effectivePos, shelterPos]} 
                color={emergency ? "#ef4444" : "#6366f1"}
                width={4}
                opacity={0.9}
                dashArray={[2, 2]}
              />
            )
          ))}

          {/* User Location Marker with Flashlight */}
          {effectivePos && (
            <MapMarker longitude={effectivePos[0]} latitude={effectivePos[1]} rotation={heading} rotationAlignment="map">
              <MarkerContent>
                <div style={{ position:'relative', width:60, height:60 }}>
                  <svg style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%' }} viewBox="0 0 100 100">
                    <defs>
                      <radialGradient id={`grad-${emergency ? 'red' : 'blue'}`} cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor={emergency ? '#ef4444' : '#3b82f6'} stopOpacity="0.6" />
                        <stop offset="100%" stopColor={emergency ? '#ef4444' : '#3b82f6'} stopOpacity="0" />
                      </radialGradient>
                    </defs>
                    <polygon points="50,50 20,5 80,5" fill={`url(#grad-${emergency ? 'red' : 'blue'})`} />
                  </svg>
                  <div style={{
                    position:'absolute', top:18, left:18, width:24, height:24, 
                    background: emergency ? '#ef4444' : '#3b82f6', borderRadius:'50%',
                    animation: emergency ? 'haloPulseFast 1s infinite' : 'haloPulse 2s infinite'
                  }}></div>
                  <div style={{
                    position:'absolute', top:22, left:22, width:16, height:16, 
                    background: emergency ? '#ef4444' : '#3b82f6', border:'2.5px solid white', 
                    borderRadius:'50%', boxShadow:'0 0 6px rgba(0,0,0,0.4)'
                  }}></div>
                </div>
              </MarkerContent>
            </MapMarker>
          )}

        </Map>

        {/* Controls */}
        <div className="absolute top-3 right-3 z-[500] flex flex-col gap-2">
          {/* Compass */}
          <button onClick={resetNorth}
            className="w-11 h-11 rounded-full flex items-center justify-center bg-slate-900/80 border border-slate-700/60 shadow-lg"
            style={{ transform: `rotate(${-viewport.bearing}deg)`, transition: 'transform 0.1s' }}
          >
            <Compass className="w-5 h-5 text-red-500"/>
          </button>
          
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
          <p className="text-[10px] font-black text-white">{Math.round(viewport.bearing)}°</p>
          <p className="text-[8px] text-slate-500">BEARING</p>
        </div>

        {!effectivePos && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[500] px-3 py-1.5 rounded-xl bg-amber-900/80 border border-amber-700/60">
            <p className="text-[10px] font-bold text-amber-300">⏳ Mendeteksi GPS...</p>
          </div>
        )}

        {/* BMKG OVERLAY */}
        {gempa && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[500] bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-2xl p-4 shadow-2xl flex items-center gap-4 max-w-[90%] w-80">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${gempa.Potensi.toLowerCase().includes('tsunami') ? 'bg-red-500/20 text-red-500' : 'bg-orange-500/20 text-orange-400'}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <h3 className="text-[10px] font-black text-white uppercase tracking-wider">INFO GEMPA</h3>
                <span className="text-[9px] font-bold text-slate-400">{gempa.Jam.split(' ')[0]}</span>
              </div>
              <p className="text-[11px] text-slate-300 font-medium truncate">Mag {gempa.Magnitude} • Kd {gempa.Kedalaman}</p>
              <p className="text-[9px] text-slate-400 truncate">{gempa.Wilayah}</p>
            </div>
          </div>
        )}
      </div>

      {/* Route panel (normal mode) - Dihapus karena instruksi: tidak menunjukkan rute saat normal */}
      {false && !emergency && showRoutePanel && activeRoutes.length > 0 && (
        <div className="shrink-0 border-t border-slate-800/50" style={{background:'#0a1020', maxHeight: 210, overflowY: 'auto'}}>
          <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold px-3 pt-2 pb-0.5">Pilih Rute Evakuasi</p>
          {activeRoutes.slice(0, 10).map((r, i) => {
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

      {/* ── ADMIN PING POPUP — muncul saat admin mengirim ping selama emergency ── */}
      {adminPing && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <motion.div
            initial={{ scale: 0.85, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.85, y: 30, opacity: 0 }}
            className="w-full max-w-xs bg-[#100508] border-2 border-red-500/60 rounded-3xl p-6 shadow-[0_0_60px_rgba(239,68,68,0.4)] relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-red-500/5 animate-pulse pointer-events-none rounded-3xl" />
            <div className="relative z-10 flex flex-col items-center text-center">
              {/* Icon */}
              <div className="w-20 h-20 rounded-full bg-red-600/20 border-2 border-red-500/50 flex items-center justify-center mb-4">
                <Radio className="w-10 h-10 text-red-400 animate-ping" />
              </div>
              <p className="text-[10px] text-red-400 uppercase tracking-widest font-bold mb-1">PANGGILAN DARURAT</p>
              <h2 className="text-2xl font-black text-white mb-1 tracking-wide">ADMIN MENGHUBUNGI</h2>
              <div className="w-full p-3 rounded-2xl bg-red-950/60 border border-red-800/40 mb-4 text-left">
                <p className="text-[10px] text-red-400 uppercase tracking-widest font-bold mb-0.5">Pengirim</p>
                <p className="text-white font-black text-sm">{adminPing.fromName}</p>
                <p className="text-[11px] text-red-300/70 mt-0.5">{adminPing.role}</p>
              </div>
              <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                Tim petugas sedang memantau situasi Anda. Konfirmasi bahwa Anda aman dan sedang dalam proses evakuasi.
              </p>
              <button
                onClick={() => onAdminPingDismiss?.()}
                className="w-full py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black text-sm tracking-widest shadow-[0_4px_20px_rgba(239,68,68,0.5)] active:scale-95 transition-all"
              >
                SAYA AMAN — KONFIRMASI
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}
