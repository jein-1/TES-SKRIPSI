// ═══════════════════════════════════════════════════════════════
// NAVIGATE PAGE — Peta interaktif shelter, rute & simulasi (MAPCN VERSION)
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect, useRef, useCallback, useMemo, Fragment } from 'react'
import { Map, MapMarker, MarkerContent, MapRoute, MapGeoJSON, type MapViewport, type MapRef } from '@/components/ui/map'
import { fetchOsrmRoute, type OsrmRouteData, type OsrmStep } from '../../lib/osrm'
import { useAegisSync, type AegisSyncEvent } from '../../lib/useAegisSync'
import {
  AlertTriangle, Navigation2, Phone, ChevronLeft,
  MapPin, Compass, Lock, Unlock, ChevronRight, ArrowRight, Radio, X,
  Search, Loader2
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { findOptimalEvacuationRoutes, type RouteResult } from "../../lib/evacuation";
import type { GempaData } from "../../lib/useBMKG";
import { shelters, hazardZones, type Shelter } from '../../lib/evacuation'
import { Geolocation } from '@capacitor/geolocation'
import { Capacitor } from '@capacitor/core'
import type * as GeoJSON from 'geojson'
import { polygonCentroid } from '../../lib/zoneOffset'
import { ZRB_REFERENCE } from '../../lib/evacuation/zrbReference'
import type { HazardZone } from '../../lib/evacuation/hazardZones'
import { sendEmergencySmsSos, callEmergency115 } from '../../lib/smsGateway'

interface Props {
  routes: RouteResult[]
  selectedRoute?: number
  tsunamiAlert: boolean
  userPosition: [number, number] | null
  onBack?: () => void
  onCancelRoute?: () => void
  onSelectRoute?: (idx: number | undefined) => void
  adminPing?: { fromName: string; role: string; fromId: string; message?: string } | null
  onAdminPingDismiss?: () => void
  onStartGps?: () => void
  onUpdateUserPosition?: (pos: [number, number]) => void
  // BMKG — passed from App.tsx (single source of truth with localStorage persistence)
  gempa?: GempaData | null
  isGempaDismissed?: boolean
  onDismissGempa?: () => void
  settings?: { algorithm: 'dijkstra' | 'haversine' }
  isEvacuationCompleted?: boolean
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

function formatManeuver(step?: OsrmStep, fallbackLabel?: string): { label: string; icon: string; detail: string } {
  if (!step) return { label: fallbackLabel || 'Terus Lurus', icon: '↑', detail: '' }
  const mod = step.maneuver.modifier
  const type = step.maneuver.type

  if (type === 'arrive') {
    return { label: 'Tiba di Shelter Tujuan', icon: '🏁', detail: step.name ? `di ${step.name}` : '' }
  }

  let icon = '↑'
  let action = 'Lurus Terus'
  if (mod === 'left') { action = 'Belok Kiri'; icon = '←' }
  else if (mod === 'right') { action = 'Belok Kanan'; icon = '→' }
  else if (mod === 'slight left') { action = 'Kiri Diagonal'; icon = '↖' }
  else if (mod === 'slight right') { action = 'Kanan Diagonal'; icon = '↗' }
  else if (mod === 'sharp left') { action = 'Kiri Tajam'; icon = '↙' }
  else if (mod === 'sharp right') { action = 'Kanan Tajam'; icon = '↘' }
  else if (mod === 'uturn') { action = 'Putar Balik'; icon = '↓' }

  const road = step.name ? `ke ${step.name}` : ''
  const dist = step.distance > 0 ? (step.distance < 1000 ? `${Math.round(step.distance)}m` : `${(step.distance / 1000).toFixed(1)} km`) : ''

  return {
    label: `${action} ${road}`.trim(),
    icon,
    detail: dist ? `dalam ${dist}` : ''
  }
}

// ── Figure-8 Calibration Modal REMOVED — replaced by Google Maps-style direct tracking ──

// ── MAIN ──────────────────────────────────────────────────────
export default function NavigatePage({
  routes,
  selectedRoute,
  tsunamiAlert,
  userPosition,
  onBack,
  onCancelRoute,
  onSelectRoute,
  adminPing,
  onAdminPingDismiss,
  onStartGps,
  onUpdateUserPosition,
  gempa,
  isGempaDismissed,
  onDismissGempa,
  settings,
  isEvacuationCompleted,
}: Props) {
  const [showMedical, setShowMedical]     = useState(false)
  const [selectedZoneInfo, setSelectedZoneInfo] = useState<HazardZone | null>(null)
  const [deviceHeading, setDeviceHeading] = useState<number | null>(null)
  const [headingLocked, setHeadingLocked] = useState(true)
  const [activeRouteIdx, setActiveRouteIdx] = useState<number>(() => (tsunamiAlert ? (selectedRoute ?? 0) : (selectedRoute ?? -1)))
  const [showRoutePanel, setShowRoutePanel] = useState(false)
  const [localPos, setLocalPos] = useState<[number,number] | null>(null)
  const [isCalibrating, setIsCalibrating] = useState(false)
  const [isManualPinned, setIsManualPinned] = useState<boolean>(() => {
    try {
      return localStorage.getItem('atlas_manual_pinned') === 'true'
    } catch {
      return false
    }
  })
  const [customTargetRoute, setCustomTargetRoute] = useState<RouteResult | null>(null)
  const mapRef = useRef<MapRef | null>(null)
  const [osrmRoutes, setOsrmRoutes] = useState<OsrmRouteData[]>([])
  const [inspectingShelter, setInspectingShelter] = useState<Shelter | null>(null)
  const [showSmsModal, setShowSmsModal] = useState(false)
  const [smsTargetPhone, setSmsTargetPhone] = useState('')
  const [isRouteActive, setIsRouteActive] = useState<boolean>(() => {
    return tsunamiAlert ? true : (selectedRoute !== undefined && selectedRoute >= 0)
  })

  const handleCancelRoute = useCallback(() => {
    setIsRouteActive(false);
    setCustomTargetRoute(null);
    setOsrmRoutes([]);
    setActiveRouteIdx(-1);
    setInspectingShelter(null);
    onCancelRoute?.();
    onSelectRoute?.(undefined);
  }, [onCancelRoute, onSelectRoute]);

  // Pastikan shelter selalu termuat bahkan saat offline tanpa internet
  useEffect(() => {
    if (shelters.length === 0) {
      import('../../lib/evacuation/shelters').then(({ loadShelters }) => {
        loadShelters();
        setShelterVersion(v => v + 1);
      }).catch(() => {});
    }
  }, [])

  const [viewport, setViewport] = useState<MapViewport>({
    center: [119.8577, -0.8917], // MapLibre uses [lng, lat]
    zoom: 14,
    bearing: 0,
    pitch: 0
  })

  // Convert to [lng, lat] for MapLibre
  const effectivePosRaw = userPosition ?? localPos
  const effectivePos: [number, number] | null = effectivePosRaw ? [effectivePosRaw[1], effectivePosRaw[0]] : null

  const [gpsRefreshing, setGpsRefreshing] = useState(false)
  const [calibrationFeedback, setCalibrationFeedback] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchingLocation, setSearchingLocation] = useState(false)

  const handleApplyNewPosition = (pos: [number, number], feedbackText?: string, isManual = true) => {
    setLocalPos(pos)
    localStorage.setItem('atlas_user_position', JSON.stringify(pos))
    if (isManual) {
      setIsManualPinned(true)
      localStorage.setItem('atlas_manual_pinned', 'true')
    }
    onUpdateUserPosition?.(pos)
    setViewport(v => ({ ...v, center: [pos[1], pos[0]], zoom: Math.max(v.zoom, 14) }))
    setCalibrationFeedback(feedbackText || `✓ Pin dipindahkan ke [${pos[0].toFixed(4)}, ${pos[1].toFixed(4)}]`)
  }

  const handleSearchLocation = async (e: React.FormEvent) => {
    e.preventDefault()
    const q = searchQuery.trim()
    if (!q) return
    setSearchingLocation(true)
    setCalibrationFeedback(`Mencari "${q}"...`)
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`)
      if (res.ok) {
        const data = await res.json()
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat)
          const lon = parseFloat(data[0].lon)
          handleApplyNewPosition([lat, lon], `✓ Ditemukan: ${data[0].display_name.split(',')[0]}`, true)
          setSearchQuery('')
          setSearchingLocation(false)
          return
        }
      }
      setCalibrationFeedback(`Lokasi "${q}" tidak ditemukan. Coba ketik nama kota / jalan lain.`)
    } catch {
      setCalibrationFeedback(`Gagal mencari lokasi. Pastikan koneksi internet aktif.`)
    }
    setSearchingLocation(false)
  }

  const handleNudge = (dLatMeters: number, dLngMeters: number) => {
    const cur = effectivePosRaw || userPosition || localPos || [-0.8917, 119.8577]
    const lat = cur[0]
    const lng = cur[1]
    const deltaLat = dLatMeters / 111320
    const deltaLng = dLngMeters / (111320 * Math.cos(lat * (Math.PI / 180)))
    const newPos: [number, number] = [lat + deltaLat, lng + deltaLng]
    const dir = dLatMeters > 0 ? 'Utara' : dLatMeters < 0 ? 'Selatan' : dLngMeters > 0 ? 'Timur' : 'Barat'
    handleApplyNewPosition(newPos, `✓ Geser mikro (${dir} ${Math.abs(dLatMeters || dLngMeters)}m): [${newPos[0].toFixed(5)}, ${newPos[1].toFixed(5)}]`, true)
  }

  const handleForceGpsRefresh = async () => {
    setGpsRefreshing(true)
    setCalibrationFeedback("🛰️ Mengunci telemetri posisi (Seluler & Satelit)...")

    // Langsung bebaskan kunci pin manual agar peta tidak membeku
    setIsManualPinned(false)
    try {
      localStorage.removeItem('atlas_manual_pinned')
      localStorage.removeItem('atlas_manual_pinned_ts')
    } catch {}

    const isNative = typeof window !== "undefined" && Capacitor.isNativePlatform()
    let resolved = false
    let tempWatchId: string | null = null
    let graceTimer: any = null
    let bestFixCandidate: { lat: number; lng: number; acc: number; label: string } | null = null

    // Helper untuk menetapkan posisi hasil kunci satelit/fused yang akurat
    const commitGpsFix = (lat: number, lng: number, acc: number, label: string) => {
      if (resolved) return
      resolved = true
      if (graceTimer) clearTimeout(graceTimer)
      if (tempWatchId && isNative) {
        Geolocation.clearWatch({ id: tempWatchId }).catch(() => {})
        tempWatchId = null
      }
      setGpsRefreshing(false)
      handleApplyNewPosition([lat, lng], `✓ Posisi terkunci: [${lat.toFixed(4)}, ${lng.toFixed(4)}] (±${Math.round(acc)}m via ${label})`, false)
    }

    const processCandidate = (lat: number, lng: number, acc: number, defaultLabel?: string) => {
      if (resolved) return
      const label = defaultLabel || (acc <= 25 ? "GNSS Satelit Multi-Band" : acc <= 60 ? "Fused Multi-Sensor" : "Jaringan Seluler BTS")
      if (!bestFixCandidate || acc < bestFixCandidate.acc) {
        bestFixCandidate = { lat, lng, acc, label }
      }

      // Kunci instan jika sinyal GNSS satelit / presisi tinggi tercapai (<= 35m)
      if (acc <= 35) {
        commitGpsFix(lat, lng, acc, label)
        return
      }

      // Jika dalam gedung dan sinyal BTS seluler tersedia (<= 500m)
      if (acc <= 500) {
        setCalibrationFeedback(`📡 Sinyal seluler terdeteksi (±${Math.round(acc)}m via ${label})...`)
        if (!graceTimer) {
          // Beri jeda 2.5 detik untuk satelit; jika terhalang beton, otomatis gunakan seluler terbaik
          graceTimer = setTimeout(() => {
            if (bestFixCandidate && !resolved) {
              commitGpsFix(bestFixCandidate.lat, bestFixCandidate.lng, bestFixCandidate.acc, bestFixCandidate.label)
            }
          }, 2500)
        }
      }
    }

    try {
      await Geolocation.requestPermissions()
    } catch {}

    if (isNative) {
      // 1. Jalur Seluler Instan (Network Provider — cepat merespons di dalam gedung tebal!)
      Geolocation.getCurrentPosition({ enableHighAccuracy: false, timeout: 4000, maximumAge: 60000 })
        .then((pos) => {
          if (pos?.coords) {
            const acc = pos.coords.accuracy ?? 150
            processCandidate(pos.coords.latitude, pos.coords.longitude, acc, "Jaringan Seluler BTS")
          }
        })
        .catch(() => {})

      // 2. Jalur Satelit Presisi GNSS (High Accuracy)
      Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 8000, maximumAge: 0 })
        .then((pos) => {
          if (pos?.coords) {
            const acc = pos.coords.accuracy ?? 30
            processCandidate(pos.coords.latitude, pos.coords.longitude, acc)
          }
        })
        .catch(() => {})

      // 3. Multi-sample Watcher (Sharelock Grade)
      try {
        tempWatchId = await Geolocation.watchPosition(
          { enableHighAccuracy: true, maximumAge: 0 },
          (pos, err) => {
            if (resolved || err || !pos?.coords) return
            const acc = pos.coords.accuracy ?? 100
            processCandidate(pos.coords.latitude, pos.coords.longitude, acc)
          }
        )
      } catch (e) {
        console.warn('[ATLAS GPS] Watch fallback error:', e)
      }
    } else {
      // Mode Web Browser / Desktop
      if (typeof window !== "undefined" && "geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (pos?.coords) {
              const acc = pos.coords.accuracy ?? 50
              processCandidate(pos.coords.latitude, pos.coords.longitude, acc, "Browser Geolocation")
            }
          },
          () => {},
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
        )
      }
    }

    // Safety timeout: jika dalam 6 detik sinyal belum <= 35m, gunakan kandidat terbaik
    setTimeout(() => {
      if (resolved) return
      if (bestFixCandidate) {
        commitGpsFix(bestFixCandidate.lat, bestFixCandidate.lng, bestFixCandidate.acc, bestFixCandidate.label)
        return
      }
      resolved = true
      if (graceTimer) clearTimeout(graceTimer)
      if (tempWatchId && isNative) {
        Geolocation.clearWatch({ id: tempWatchId }).catch(() => {})
        tempWatchId = null
      }
      setGpsRefreshing(false)
      setCalibrationFeedback("⚠️ Sinyal posisi belum tertangkap di dalam ruangan. Menunggu pembaruan telemetri...")
    }, 6000)
  }

  // ── HIGH-PRECISION GPS TRACKING (Authoritative App.tsx Engine) ──
  // Sinkronisasi koordinat langsung dari App.tsx (Kalman-filtered Sharelock Grade)
  // Menghilangkan duplikasi watchPosition yang memicu lag dan jeda saat berjalan
  useEffect(() => {
    const isManual = localStorage.getItem('atlas_manual_pinned') === 'true'
    if (userPosition && !isManual) {
      setLocalPos(userPosition)
      if (headingLocked) {
        setViewport(v => ({ ...v, center: [userPosition[1], userPosition[0]] }))
      }
    }
  }, [userPosition, headingLocked])

  useEffect(() => {
    onStartGps?.()
  }, [onStartGps])

  // Status Darurat: Otomatis nonaktif jika sesi evakuasi pengguna telah selesai (Sudah Aman)
  const isEvacSafeSession = isEvacuationCompleted || (typeof window !== 'undefined' && sessionStorage.getItem('atlas_evacuation_completed') === 'true')
  const emergency = tsunamiAlert && !isEvacSafeSession

  const [shelterVersion, setShelterVersion] = useState(0)

  useAegisSync((event: AegisSyncEvent) => {
    if (
      event.type === 'SHELTER_ADDED' ||
      event.type === 'SHELTER_UPDATED' ||
      event.type === 'SHELTER_DELETED'
    ) {
      setShelterVersion(v => v + 1)
    }
  })

  const activeRoutes = useMemo(() => {
    let baseList = routes
    if (baseList.length === 0 && effectivePosRaw) {
      baseList = findOptimalEvacuationRoutes(
        effectivePosRaw[0],
        effectivePosRaw[1],
        99,
        settings?.algorithm ?? 'dijkstra'
      )
    }
    if (customTargetRoute) {
      return [
        customTargetRoute,
        ...baseList.filter(r => r.shelterId !== customTargetRoute.shelterId && r.shelterName !== customTargetRoute.shelterName)
      ]
    }
    return baseList
  }, [routes, effectivePosRaw?.[0], effectivePosRaw?.[1], settings?.algorithm, shelterVersion, customTargetRoute])

  useEffect(() => {
    if (selectedRoute !== undefined && selectedRoute >= 0) {
      setActiveRouteIdx(selectedRoute)
      setIsRouteActive(true)
    } else if (selectedRoute === undefined && !tsunamiAlert) {
      setActiveRouteIdx(-1)
      setIsRouteActive(false)
    }
  }, [selectedRoute, tsunamiAlert])

  const route       = activeRouteIdx >= 0 ? (activeRoutes[activeRouteIdx] || activeRoutes[0]) : (emergency ? activeRoutes[0] : null)
  const shelter     = route ? shelters.find(s => s.id === route.shelterId || s.name === route.shelterName) : undefined
  const shelterPosRaw: [number, number] | undefined = shelter
    ? [shelter.lat, shelter.lng]
    : (route?.coordinates && route.coordinates.length > 0
        ? [route.coordinates[route.coordinates.length - 1][0], route.coordinates[route.coordinates.length - 1][1]]
        : undefined)
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

  const userInteractedRef = useRef(false)

  // Map viewport control (locked to user position ONLY when user hasn't panned/zoomed, not calibrating, and not inspecting a shelter)
  useEffect(() => {
    if (effectivePos && !inspectingShelter && !isCalibrating && !userInteractedRef.current) {
      setViewport(v => ({
        ...v,
        center: effectivePos,
        zoom: v.zoom || 16,
        pitch: 0,
        bearing: (emergency && headingLocked) ? heading : v.bearing
      }))
    }
  }, [effectivePos?.[0], effectivePos?.[1], emergency, heading, headingLocked, inspectingShelter, isCalibrating])

  // Google Maps-style fitBounds helper (Smooth animated zoom-out to fit user, route & shelter)
  const fitRouteBounds = useCallback((destLngLat?: [number, number], customCoords?: [number, number][]) => {
    if (!effectivePos) return;
    const pts: [number, number][] = [effectivePos];
    if (destLngLat) pts.push(destLngLat);
    if (customCoords && customCoords.length > 0) {
      customCoords.forEach(c => pts.push(c));
    }
    
    let minLng = pts[0][0], maxLng = pts[0][0];
    let minLat = pts[0][1], maxLat = pts[0][1];
    for (const [lng, lat] of pts) {
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    }
    
    userInteractedRef.current = true;
    if (mapRef.current && typeof (mapRef.current as any).fitBounds === 'function') {
      try {
        (mapRef.current as any).fitBounds(
          [[minLng, minLat], [maxLng, maxLat]],
          {
            padding: { top: 130, bottom: 250, left: 60, right: 60 },
            maxZoom: 16,
            duration: 900,
            essential: true
          }
        );
        return;
      } catch (err) {
        console.warn('[ATLAS MAP] fitBounds fallback:', err);
      }
    }
    
    // Fallback if mapRef.current.fitBounds is not directly available
    const centerLng = (minLng + maxLng) / 2;
    const centerLat = (minLat + maxLat) / 2;
    const dLng = Math.abs(maxLng - minLng);
    const dLat = Math.abs(maxLat - minLat);
    const maxDelta = Math.max(dLng, dLat);
    let calculatedZoom = 14;
    if (maxDelta > 0.15) calculatedZoom = 11;
    else if (maxDelta > 0.08) calculatedZoom = 12;
    else if (maxDelta > 0.04) calculatedZoom = 13;
    else if (maxDelta > 0.02) calculatedZoom = 14;
    else calculatedZoom = 15;
    
    setViewport(v => ({
      ...v,
      center: [centerLng, centerLat],
      zoom: calculatedZoom
    }));
  }, [effectivePos]);

  // Memoized Hazard Zones to prevent heavy polygon recalculations during map drag/pan (lag fix)
  const memoizedHazardZones = useMemo(() => {
    return hazardZones.map((zone) => {
      const centroid = polygonCentroid(zone.coords);
      const color = ZRB_REFERENCE[zone.zrbLevel]?.color || '#ef4444';
      const nF = Math.floor(zone.coords.length / 2);
      
      const front   = zone.coords.slice(0, nF);
      const backRev = zone.coords.slice(nF);
      const back    = [...backRev].reverse();
      const quads = nF >= 2 ? front.slice(0, -1).flatMap((p1, qi) => {
        const p2 = front[qi+1], b1 = back[qi], b2 = back[qi+1];
        if (!p2 || !b1 || !b2) return [];
        return [[ [p1[1],p1[0]], [p2[1],p2[0]], [b2[1],b2[0]], [b1[1],b1[0]], [p1[1],p1[0]] ]];
      }) : [];
      const fillGeom = quads.length > 0
        ? { type: 'MultiPolygon' as const, coordinates: quads }
        : { type: 'Polygon' as const, coordinates: [zone.coords.map(c => [c[1], c[0]])] };
        
      const frontGeom = nF >= 2 ? { type: 'LineString' as const, coordinates: zone.coords.slice(0, nF).map(c => [c[1], c[0]]) } : null;
      const backGeom = nF >= 2 ? { type: 'LineString' as const, coordinates: zone.coords.slice(nF).map(c => [c[1], c[0]]) } : null;

      return {
        zone,
        centroid,
        color,
        fillGeom,
        frontGeom,
        backGeom
      };
    });
  }, [hazardZones]);

  const distanceM   = (effectivePosRaw && shelterPosRaw) ? haversineM(effectivePosRaw, shelterPosRaw) : (route?.totalDistance ? route.totalDistance * 1000 : 0)
  const distLabel   = osrmRoutes.length > 0 ? (osrmRoutes[0].distance < 1000 ? `${Math.round(osrmRoutes[0].distance)}m` : `${(osrmRoutes[0].distance/1000).toFixed(1)} km`) : (distanceM < 1000 ? `${Math.round(distanceM)}m` : `${(distanceM/1000).toFixed(1)} km`)
  const etaMin      = osrmRoutes.length > 0 ? Math.round(osrmRoutes[0].duration / 60) : Math.max(1, Math.ceil(distanceM / 1000 / 5 * 60))
  const { label: mainDir, icon: dirIcon } = bearingLabel(heading)

  // Turn-by-turn navigation data from real OSRM steps
  const osrmSteps = osrmRoutes[0]?.steps || []
  const currentStep = osrmSteps.find(s => s.maneuver.type !== 'depart') || osrmSteps[0]
  const currentStepIdx = currentStep ? osrmSteps.indexOf(currentStep) : -1
  const nextStep = currentStepIdx >= 0 && currentStepIdx + 1 < osrmSteps.length ? osrmSteps[currentStepIdx + 1] : undefined

  const primaryNav = currentStep
    ? formatManeuver(currentStep, mainDir)
    : { label: mainDir, icon: dirIcon, detail: '' }
  const secondaryNav = nextStep
    ? formatManeuver(nextStep)
    : null

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
      userInteractedRef.current = false
      setHeadingLocked(true)
      setViewport(v => ({ ...v, center: effectivePos, zoom: 16 }))
      mapRef.current?.flyTo({ center: effectivePos, zoom: 16, duration: 800, essential: true })
    }
  }, [effectivePos])

  const headerBg = emergency ? '#160608' : '#0B0F19'
  const headerBorder = emergency ? 'border-nerv-red' : 'border-nerv-border'

  // Figure-8 calibration gate removed — direct to map

  if (showMedical) return (
    <div className="fixed inset-0 z-[1900] flex items-center justify-center bg-black/90 p-6 backdrop-blur-md">
      <motion.div initial={{ scale:0.95,opacity:0 }} animate={{ scale:1,opacity:1 }}
        className="w-full max-w-sm p-6 rounded-lg border border-nerv-red bg-nerv-card text-center font-mono shadow-2xl">
        <div className="w-14 h-14 rounded-full bg-nerv-red/20 border border-nerv-red flex items-center justify-center mx-auto mb-3">
          <Phone className="w-7 h-7 text-nerv-red animate-pulse"/>
        </div>
        <p className="text-[9px] text-nerv-red uppercase tracking-widest font-bold mb-1">
          TACTICAL MEDICAL DISPATCH
        </p>
        <h3 className="text-base font-bold text-white mb-2">BANTUAN MEDIS DARURAT</h3>
        <p className="text-xs text-slate-300 font-sans mb-5 leading-relaxed">
          Sinyal darurat dan koordinat telemetri GPS Anda akan dikirimkan langsung ke pusat komando evakuasi.
        </p>
        <button className="w-full py-3.5 bg-nerv-red hover:bg-red-700 text-white rounded font-mono font-bold text-xs uppercase tracking-widest mb-2 shadow-[0_0_20px_rgba(255,23,68,0.5)] transition-all">
          TRANSMIT EMERGENCY SOS
        </button>
        <button onClick={()=>setShowMedical(false)} className="w-full py-2 bg-black/60 border border-nerv-border text-slate-400 rounded font-mono text-xs hover:text-white transition-colors">
          BATALKAN
        </button>
      </motion.div>
    </div>
  )

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="fixed inset-0 z-[1800] flex flex-col bg-nerv-bg text-slate-200">

      {/* Header */}
      <div className={`shrink-0 flex items-center justify-between px-4 pt-[max(env(safe-area-inset-top,0px),1rem)] pb-3 border-b ${headerBorder}`} style={{background: headerBg}}>
        <div className="flex items-center gap-2.5 min-w-0">
          {onBack && (
            <button onClick={onBack}
              className="w-8 h-8 rounded bg-nerv-card border border-nerv-border flex items-center justify-center shrink-0 hover:border-nerv-orange transition-colors">
              <ChevronLeft className="w-4 h-4 text-slate-300"/>
            </button>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <div className={`w-1.5 h-1.5 rounded-full ${emergency ? 'bg-nerv-red animate-ping' : 'bg-nerv-cyan animate-pulse'}`} />
              <span className="text-[9px] font-mono font-bold tracking-widest text-slate-400 uppercase">
                A.T.L.A.S // NAVIGATION
              </span>
            </div>
            <h2 className="text-sm font-mono font-bold text-white tracking-wide truncate">
              {emergency ? 'EMERGENCY COCKPIT' : 'TACTICAL MAP'}
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {!emergency && (
            <button onClick={() => setShowRoutePanel(p => !p)}
              className="px-2.5 py-1 rounded bg-black/60 border border-nerv-border hover:border-nerv-cyan text-nerv-cyan text-[10px] font-mono font-bold transition-colors">
              {showRoutePanel ? 'TUTUP DAFTAR' : 'PILIH RUTE'}
            </button>
          )}
          {emergency ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-nerv-red/20 border border-nerv-red text-nerv-red font-mono font-bold text-[10px] animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>DEFCON 1</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-black/60 border border-nerv-border text-nerv-green font-mono font-bold text-[10px]">
              <div className="w-1.5 h-1.5 rounded-full bg-nerv-green" />
              <span>{shelters.length} SHELTER</span>
            </div>
          )}
        </div>
      </div>

      {/* Active shelter card with in-card Cancel button */}
      {(emergency || isRouteActive) && route && (
        <div className="shrink-0 px-3 pt-2 pb-1.5">
          <div
            className={`p-3 rounded-2xl border flex items-center gap-3 transition-transform ${
              emergency ? 'border-red-800/40' : 'border-slate-700/40'
            }`}
            style={{background: emergency ? '#160808' : '#0f1a2e'}}
          >
            <div
              onClick={() => {
                if (shelterPos) {
                  fitRouteBounds(shelterPos, osrmRoutes[0]?.coordinates || route.coordinates?.map((c: any) => [c[1], c[0]]));
                }
              }}
              className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
              title="Ketuk untuk melihat seluruh rute dan shelter di peta"
            >
              <div className={`w-1 self-stretch rounded-full shrink-0 ${emergency ? 'bg-red-500' : 'bg-emerald-500'}`}/>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">
                  {emergency ? '🚨 Rute Evakuasi Aktif' : '🏠 Shelter Terpilih'}
                </p>
                <p className="text-sm font-black text-white truncate">{route.shelterName}</p>
              </div>
              <div className="text-right shrink-0">
                <p className={`text-base font-black ${emergency ? 'text-red-300' : 'text-white'}`}>{distLabel}</p>
                <p className="text-[9px] text-slate-500 font-bold">{etaMin} mnt berjalan</p>
              </div>
            </div>

            {/* In-card Cancel Button */}
            {!emergency && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCancelRoute();
                }}
                className="px-2.5 py-1.5 rounded-xl bg-red-950/80 border border-red-500/50 hover:bg-red-900 text-red-300 hover:text-white text-[10px] font-mono font-bold transition-colors flex items-center gap-1 shrink-0 active:scale-95 shadow-sm"
                title="Batalkan proyeksi rute"
              >
                <X className="w-3.5 h-3.5 text-red-400" />
                <span>BATAL</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* MAP */}
      <div className="flex-1 relative overflow-hidden min-h-0" style={{ willChange: 'transform', transform: 'translateZ(0)' }}>
        <Map
          ref={mapRef}
          viewport={viewport}
          onViewportChange={(newV) => {
            userInteractedRef.current = true
            setViewport(newV)
          }}
          onMapClick={(e) => {
            if (isCalibrating && e.lngLat) {
              handleApplyNewPosition([e.lngLat.lat, e.lngLat.lng]);
            }
          }}
        >
          {/* BMKG GEMPA TERKINI (Epicenter & Radius) - Removed from User POV to avoid squished view, but Overlay widget is kept at the top */}

          {/* Hazard Zones MapGeoJSON (Memoized for smooth 60fps pan/zoom) */}
          {memoizedHazardZones.map((item, i) => (
            <Fragment key={`hazard-group-${i}`}>
              <MapGeoJSON 
                key={`hazard-fill-${i}`}
                data={{ type: 'Feature', properties: {}, geometry: item.fillGeom as any }}
                fillPaint={{ 'fill-color': item.color, 'fill-opacity': 0.12 }}
                fillHoverPaint={{ 'fill-opacity': 0.25 }}
                interactive={true}
                onClick={() => setSelectedZoneInfo(item.zone)}
              />
              {item.frontGeom && (
                <MapGeoJSON
                  key={`hazard-front-${i}`}
                  data={{ type: 'Feature', properties: {}, geometry: item.frontGeom as any }}
                  linePaint={{ 'line-color': item.color, 'line-width': 1.5, 'line-opacity': 0.9 }}
                />
              )}
              {item.backGeom && (
                <MapGeoJSON
                  key={`hazard-back-${i}`}
                  data={{ type: 'Feature', properties: {}, geometry: item.backGeom as any }}
                  linePaint={{ 'line-color': item.color, 'line-width': 1, 'line-opacity': 0.6, 'line-dasharray': [5, 4] }}
                />
              )}
              <MapMarker latitude={item.centroid[0]} longitude={item.centroid[1]}>
                <MarkerContent>
                  <div style={{ pointerEvents: 'none' }} className="bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap font-bold shadow-sm">
                    {item.zone.name}
                  </div>
                </MarkerContent>
              </MapMarker>
            </Fragment>
          ))}

          {/* Shelters — Hanya dari pengaturan Admin */}
          {shelters.map((s) => {
            const isSelected = (route?.shelterId === s.id) || (route?.shelterName === s.name)
            const pos: [number, number] = [s.lng, s.lat]
            const bg = isSelected && emergency ? '#ef4444' : isSelected ? '#22c55e' : '#1e293b'
            const shadow = isSelected ? (emergency ? 'rgba(239,68,68,0.8)' : 'rgba(34,197,94,0.8)') : 'rgba(0,0,0,0.5)'
            return (
              <MapMarker key={s.id} longitude={pos[0]} latitude={pos[1]}>
                <MarkerContent>
                  <div
                    onClick={() => {
                      setInspectingShelter(s);
                      setViewport(v => ({ ...v, center: [s.lng, s.lat], zoom: 16.5 }));
                      mapRef.current?.flyTo({ center: [s.lng, s.lat], zoom: 16.5, duration: 1000, essential: true });
                      const rIdx = activeRoutes.findIndex(r => r.shelterId === s.id || r.shelterName === s.name);
                      if (rIdx !== -1) setActiveRouteIdx(rIdx);
                    }}
                    className="cursor-pointer group relative flex flex-col items-center"
                    title={`${s.name} (Kapasitas: ${s.capacity} orang)`}
                  >
                    <div style={{
                      width: 32, height: 32, background: bg, border: isSelected ? '2.5px solid #fff' : '2px solid rgba(255,255,255,0.7)',
                      borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: `0 0 14px ${shadow}`, fontSize: 14, lineHeight: 1,
                      transform: isSelected ? 'scale(1.15)' : 'scale(1)',
                      transition: 'transform 0.2s'
                    }}>
                      🏠
                    </div>
                    <div className="mt-1 bg-black/85 text-[9px] font-mono font-bold text-white px-2 py-0.5 rounded border border-slate-700/80 whitespace-nowrap shadow-md pointer-events-none">
                      {s.name}
                    </div>
                  </div>
                </MarkerContent>
              </MapMarker>
            )
          })}

          {/* Routes (OSRM or Dijkstra road graph or straight line) - AKTIF JIKA DARURAT ATAU DIPILIH */}
          {(() => {
            if (!emergency && !isRouteActive) return null;
            const osrmValid = osrmRoutes.length > 0 && osrmRoutes[0].coordinates.length > 1;
            const osrmSnapDist = osrmRoutes[0]?.startSnapDistMeters ?? 0;
            const preferDijkstra = !!(route?.coordinates && route.coordinates.length > 1 && (osrmSnapDist > 35 || !osrmValid));
            const routeColor = emergency ? "#ef4444" : "#06b6d4";

            if (!preferDijkstra && osrmValid) {
              return (
                <MapRoute 
                  coordinates={osrmRoutes[0].coordinates} 
                  color={routeColor}
                  width={6}
                  opacity={0.9}
                />
              );
            }
            if (route?.coordinates && route.coordinates.length > 1) {
              return (
                <MapRoute 
                  coordinates={route.coordinates.map((c: any) => [c[1], c[0]])} 
                  color={routeColor}
                  width={6}
                  opacity={0.9}
                />
              );
            }
            if (effectivePos && shelterPos) {
              return (
                <MapRoute 
                  coordinates={[effectivePos, shelterPos]} 
                  color={routeColor}
                  width={4}
                  opacity={0.9}
                  dashArray={[2, 2]}
                />
              );
            }
            return null;
          })()}

          {/* User Location Marker with Flashlight */}
          {effectivePos && (
            <MapMarker
              longitude={effectivePos[0]}
              latitude={effectivePos[1]}
              rotation={heading}
              rotationAlignment="map"
              draggable={isCalibrating}
              onDragEnd={(lngLat) => {
                handleApplyNewPosition([lngLat.lat, lngLat.lng])
              }}
            >
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
                    background: isCalibrating ? '#ff5722' : (emergency ? '#ef4444' : '#3b82f6'), borderRadius:'50%',
                    animation: emergency ? 'haloPulseFast 1s infinite' : 'haloPulse 2s infinite'
                  }}></div>
                  <div style={{
                    position:'absolute', top:22, left:22, width:16, height:16, 
                    background: isCalibrating ? '#ff5722' : (emergency ? '#ef4444' : '#3b82f6'), border:'2.5px solid white', 
                    borderRadius:'50%', boxShadow:'0 0 6px rgba(0,0,0,0.4)'
                  }}></div>
                </div>
              </MarkerContent>
            </MapMarker>
          )}

        </Map>

        {/* Floating Manual Pin Active Indicator */}
        {isManualPinned && !isCalibrating && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[500] bg-black/85 border border-amber-500/70 rounded-full px-3 py-1 flex items-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.3)] backdrop-blur-md">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-[10px] font-mono font-bold text-amber-300 tracking-wider">PIN MANUAL TERKUNCI</span>
            <button
              onClick={handleForceGpsRefresh}
              className="text-[9px] font-mono font-black text-black bg-amber-400 hover:bg-amber-300 px-2 py-0.5 rounded-full transition-colors ml-1 shadow-sm"
            >
              KEMBALIKAN KE GPS
            </button>
          </div>
        )}

        {/* Floating Calibration Guide Banner */}
        {isCalibrating && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[600] max-w-md w-[94%] bg-[#080d1a]/95 border border-nerv-orange rounded-xl p-3.5 shadow-2xl font-mono text-center space-y-2.5 backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-nerv-border pb-1.5">
              <div className="flex items-center gap-1.5 text-nerv-orange text-xs font-bold uppercase">
                <MapPin className="w-4 h-4 animate-bounce" />
                <span>ATUR / GESER LOKASI MANUAL</span>
              </div>
              <button
                type="button"
                onClick={() => setIsCalibrating(false)}
                className="w-6 h-6 rounded bg-black/60 border border-nerv-border flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick Location Search */}
            <form onSubmit={handleSearchLocation} className="flex gap-1.5">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ketik nama jalan / kota / daerah..."
                  className="w-full pl-8 pr-2 py-1.5 text-xs bg-black/80 border border-nerv-border focus:border-nerv-cyan rounded text-white focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={searchingLocation}
                className="px-3 py-1.5 rounded bg-nerv-cyan hover:bg-cyan-400 text-black font-black text-xs uppercase disabled:opacity-40"
              >
                {searchingLocation ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'CARI'}
              </button>
            </form>

            <p className="text-[11px] text-slate-300 font-sans leading-tight">
              Sentuh/klik peta langsung atau geser pin lingkaran biru ke titik Anda saat ini.
            </p>

            {calibrationFeedback && (
              <p className="text-[10px] font-mono font-bold p-1.5 rounded bg-black/60 border border-nerv-border text-nerv-cyan">
                {calibrationFeedback}
              </p>
            )}

            {/* Micro-Nudge Controls */}
            <div className="flex items-center justify-between px-3 py-1.5 rounded bg-black/60 border border-nerv-border">
              <div className="text-left">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                  GESER MIKRO (2 METER)
                </span>
                <span className="text-[8px] text-slate-500 font-sans block">
                  Geser pin dengan presisi meter
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleNudge(0, -2)}
                  className="w-7 h-7 rounded bg-black/80 border border-nerv-border hover:border-nerv-cyan text-white text-xs font-black flex items-center justify-center active:scale-95 transition-colors"
                  title="Geser Barat 2m"
                >
                  ◄
                </button>
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => handleNudge(2, 0)}
                    className="w-7 h-3.5 rounded bg-black/80 border border-nerv-border hover:border-nerv-cyan text-white text-[8px] font-black flex items-center justify-center active:scale-95 transition-colors"
                    title="Geser Utara 2m"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNudge(-2, 0)}
                    className="w-7 h-3.5 rounded bg-black/80 border border-nerv-border hover:border-nerv-cyan text-white text-[8px] font-black flex items-center justify-center active:scale-95 transition-colors"
                    title="Geser Selatan 2m"
                  >
                    ▼
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => handleNudge(0, 2)}
                  className="w-7 h-7 rounded bg-black/80 border border-nerv-border hover:border-nerv-cyan text-white text-xs font-black flex items-center justify-center active:scale-95 transition-colors"
                  title="Geser Timur 2m"
                >
                  ►
                </button>
              </div>
            </div>

            <div className="flex gap-2 justify-center pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsCalibrating(false)
                  if (effectivePosRaw) {
                    handleApplyNewPosition(effectivePosRaw, `✓ Posisi manual dikunci di [${effectivePosRaw[0].toFixed(4)}, ${effectivePosRaw[1].toFixed(4)}]`, true)
                  }
                }}
                className="flex-1 py-1.5 rounded bg-nerv-green hover:bg-emerald-500 text-black font-black text-xs uppercase tracking-wider shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-colors"
              >
                SIMPAN POSISI INI
              </button>
              <button
                type="button"
                disabled={gpsRefreshing}
                onClick={handleForceGpsRefresh}
                className="px-3 py-1.5 rounded bg-black/60 border border-nerv-cyan text-nerv-cyan text-xs font-bold hover:bg-nerv-cyan/20 flex items-center gap-1.5 transition-colors"
              >
                {gpsRefreshing && <Loader2 className="w-3 h-3 animate-spin" />}
                GPS PRESISI
              </button>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="absolute top-3 right-3 z-[500] flex flex-col gap-2">
          {/* Compass — Reset north only (calibration removed) */}
          <button
            onClick={resetNorth}
            className="w-11 h-11 rounded-full flex items-center justify-center border shadow-lg transition-colors bg-slate-900/80 border-slate-700/60 active:scale-95"
            style={{ transform: `rotate(${-viewport.bearing}deg)`, transition: 'transform 0.1s' }}
            title="Reset orientasi ke Utara"
          >
            <Compass className="w-5 h-5 text-red-500"/>
          </button>
          
          {/* Re-center button */}
          <button onClick={recenterMap}
            className="w-11 h-11 rounded-full flex items-center justify-center border shadow-lg transition-colors bg-slate-900/80 border-slate-700/60 text-white"
            title="Kembali ke posisi saya">
            <Navigation2 className="w-4 h-4 text-indigo-500"/>
          </button>

          {/* Calibrate / Manual Location Button */}
          <button
            onClick={() => setIsCalibrating(!isCalibrating)}
            className={`w-11 h-11 rounded-full flex items-center justify-center border shadow-lg transition-all ${
              isCalibrating
                ? 'bg-nerv-orange border-nerv-orange text-black ring-2 ring-nerv-orange/50 shadow-[0_0_15px_rgba(255,87,34,0.6)]'
                : 'bg-slate-900/80 border-slate-700/60 text-nerv-cyan hover:text-white'
            }`}
            title="Kalibrasi Posisi / Geser Manual Pin"
          >
            <MapPin className="w-5 h-5"/>
          </button>

          {/* Tactical SOS SMS Button (100% Offline / Basarnas 115) */}
          <button
            onClick={() => setShowSmsModal(true)}
            className="w-11 h-11 rounded-full flex items-center justify-center border transition-all bg-red-600/90 border-red-500/80 text-white hover:bg-red-500 active:scale-95 shadow-[0_0_15px_rgba(239,68,68,0.5)]"
            title="Kirim Sinyal SOS Darurat via SMS 2G (Tanpa Internet / Basarnas 115)"
          >
            <Radio className="w-5 h-5 text-white animate-pulse" />
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
        <div className="absolute bottom-3 left-3 z-[500] px-2 py-1.5 rounded-xl border shadow-sm bg-slate-900/80 border-slate-700/60">
          <p className="text-[10px] font-black text-white">{Math.round(viewport.bearing)}°</p>
          <p className="text-[8px] text-slate-500 font-bold">BEARING</p>
        </div>

        {!effectivePos && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[500] px-3.5 py-1.5 rounded bg-nerv-card border border-nerv-orange shadow-2xl">
            <p className="text-[10px] font-mono font-bold text-nerv-orange tracking-wider">
              ⏳ MENYINKRONKAN TELEMETRI GPS...
            </p>
          </div>
        )}

        {/* BMKG OVERLAY — uses App.tsx dismiss state (persisted to localStorage) */}
        {gempa && !isGempaDismissed && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[500] bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-2xl p-4 shadow-2xl flex items-center gap-4 max-w-[90%] w-80">
            <button 
              onClick={() => onDismissGempa?.()}
              className="absolute top-2 right-2 p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${gempa.Potensi.toLowerCase().includes('tsunami') ? 'bg-red-500/20 text-red-500' : 'bg-orange-500/20 text-orange-400'}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <h3 className="text-[10px] font-black text-white uppercase tracking-wider">INFO GEMPA</h3>
                <span className="text-[9px] font-bold text-slate-400">{gempa.Jam.split(' ')[0]}</span>
              </div>
              <p className="text-[11px] text-slate-300 font-medium truncate">Mag {gempa.Magnitude} • Kd {gempa.Kedalaman}</p>
              <p className="text-[9px] text-slate-400 line-clamp-2 break-words leading-tight">{gempa.Wilayah}</p>
            </div>
          </div>
        )}
      </div>

      {/* Route panel (normal mode) */}
      {!emergency && showRoutePanel && activeRoutes.length > 0 && (
        <div className="shrink-0 border-t border-slate-800/50" style={{background:'#0a1020', maxHeight: 220, overflowY: 'auto'}}>
          <div className="flex items-center justify-between px-3 pt-2 pb-1 border-b border-slate-800/40">
            <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold font-mono">Daftar Titik Kumpul / Shelter Evakuasi</p>
            <button onClick={() => setShowRoutePanel(false)} className="text-[9px] text-slate-500 hover:text-white font-mono">✕ TUTUP</button>
          </div>
          {activeRoutes.slice(0, 10).map((r, i) => {
            const dKm  = r.totalDistance === Infinity ? '—' : `${r.totalDistance.toFixed(2)} km`
            const t    = r.totalDistance === Infinity ? '—' : `${r.walkingTime} mnt`
            const cap  = shelters.find(s => s.name === r.shelterName)?.capacity?.toLocaleString() ?? '—'
            const isAct = i === activeRouteIdx
            return (
              <button key={`${r.shelterId || r.shelterName}-${i}`} onClick={() => {
                setActiveRouteIdx(i);
                setIsRouteActive(true);
                onSelectRoute?.(i);
                if (effectivePos && r.coordinates && r.coordinates.length > 0) {
                  const dest = r.coordinates[r.coordinates.length - 1];
                  const destLngLat: [number, number] = [dest[1], dest[0]];
                  const routePts: [number, number][] = r.coordinates.map(c => [c[1], c[0]]);
                  fitRouteBounds(destLngLat, routePts);
                  fetchOsrmRoute(effectivePos[0], effectivePos[1], dest[1], dest[0])
                    .then(osrm => {
                      setOsrmRoutes(osrm);
                      if (osrm.length > 0 && osrm[0].coordinates.length > 1) {
                        fitRouteBounds(destLngLat, osrm[0].coordinates);
                      }
                    })
                    .catch(() => {});
                }
              }}
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
              <span className="text-2xl font-black text-red-300">{primaryNav.icon}</span>
            </div>
            <div className="text-left">
              <h1 className="text-xl font-black text-white leading-none">{primaryNav.label}</h1>
              <p className="text-xs text-slate-400">
                {distLabel} → {route.shelterName} {primaryNav.detail ? `(${primaryNav.detail})` : ''}
              </p>
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
                {secondaryNav ? `${secondaryNav.label} ${secondaryNav.detail ? `(${secondaryNav.detail})` : ''}` : 'Ikuti jalur evakuasi menuju shelter'}
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
              
              {adminPing.message && (
                <div className="w-full p-3 rounded-2xl bg-amber-950/40 border border-amber-800/40 mb-4 text-left">
                  <p className="text-[9px] text-amber-500 uppercase tracking-widest font-bold mb-1">Pesan Tambahan</p>
                  <p className="text-xs text-amber-100/90 leading-relaxed italic">"{adminPing.message}"</p>
                </div>
              )}
              
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

      {/* ─── HAZARD ZONE INFO PANEL ─── */}
      <AnimatePresence>
        {selectedZoneInfo && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 left-4 z-[2500] w-64 bg-[#0b1120] border border-slate-700/60 rounded-2xl p-4 shadow-[0_10px_40px_rgba(0,0,0,0.5)]"
          >
            <button
              onClick={() => setSelectedZoneInfo(null)}
              className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400">INFO ZONA</span>
              {(() => {
                const zrb = ZRB_REFERENCE[selectedZoneInfo.zrbLevel];
                if (!zrb) return null;
                const badges: Record<number, string> = {
                  1: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
                  2: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
                  3: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
                  4: 'bg-red-500/20 text-red-400 border-red-500/30',
                };
                return (
                  <div className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${badges[selectedZoneInfo.zrbLevel]}`}>
                    ZRB {selectedZoneInfo.zrbLevel}
                  </div>
                );
              })()}
            </div>
            
            <h3 className="text-lg font-black text-white mb-2 leading-tight">
              {selectedZoneInfo.name}
            </h3>
            
            {selectedZoneInfo.description ? (
              <p className="text-xs text-slate-300 leading-relaxed max-h-24 overflow-y-auto pr-1 custom-scrollbar">
                {selectedZoneInfo.description}
              </p>
            ) : (
              <p className="text-xs text-slate-500 italic">Tidak ada deskripsi tambahan.</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── SHELTER INFO POPUP (GAMBAR 2) ─── */}
      <AnimatePresence>
        {inspectingShelter && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            className="fixed bottom-20 left-4 right-4 md:left-auto md:right-6 md:w-96 z-[2500] bg-[#0d1929]/95 backdrop-blur-md border border-indigo-500/30 rounded-2xl shadow-[0_8px_40px_rgba(99,102,241,0.3)] overflow-hidden"
          >
            <div className="h-0.5 w-full bg-gradient-to-r from-indigo-700 via-indigo-400 to-indigo-700" />
            <div className="p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-xl shrink-0">
                    🏠
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] text-indigo-400 font-bold uppercase tracking-widest mb-0.5">
                      {inspectingShelter.id.startsWith('C') ? 'SHELTER KUSTOM' : 'SHELTER RESMI'}
                    </p>
                    <h3 className="text-white font-black text-sm leading-tight truncate">
                      {inspectingShelter.name}
                    </h3>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setInspectingShelter(null);
                    if (effectivePos) {
                      setViewport(v => ({ ...v, center: effectivePos, zoom: 16 }));
                      mapRef.current?.flyTo({ center: effectivePos, zoom: 16, duration: 1000, essential: true });
                    }
                  }}
                  className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {inspectingShelter.address && (
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800 mb-2.5">
                  <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold mb-0.5">ALAMAT</p>
                    <p className="text-xs text-slate-300 leading-snug">{inspectingShelter.address}</p>
                  </div>
                </div>
              )}

              {/* Stats - Kapasitas (Radius & Koordinat diabaikan sesuai instruksi) */}
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between mb-3">
                <div>
                  <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold mb-0.5">KAPASITAS DAYA TAMPUNG</p>
                  <p className="text-sm font-black text-white">{inspectingShelter.capacity.toLocaleString('id-ID')} <span className="text-xs text-slate-400 font-normal">orang</span></p>
                </div>
                <div className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[10px] font-bold">
                  ZONA AMAN
                </div>
              </div>

              <div className="flex gap-2">
                {isRouteActive && (activeRoutes[activeRouteIdx]?.shelterId === inspectingShelter.id || activeRoutes[activeRouteIdx]?.shelterName === inspectingShelter.name) && (
                  <button
                    onClick={handleCancelRoute}
                    className="px-3 py-2.5 bg-red-950/70 border border-red-500/50 hover:bg-red-900/60 text-red-400 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" /> Batalkan Rute
                  </button>
                )}
                <button
                  onClick={() => {
                    setIsRouteActive(true);
                    const rIdx = activeRoutes.findIndex(r => r.shelterId === inspectingShelter.id || r.shelterName === inspectingShelter.name);
                    if (rIdx !== -1) {
                      setActiveRouteIdx(rIdx);
                      onSelectRoute?.(rIdx);
                    } else {
                      const userLat = effectivePosRaw ? effectivePosRaw[0] : -0.8917;
                      const userLng = effectivePosRaw ? effectivePosRaw[1] : 119.8577;
                      const distKm = haversineM([userLat, userLng], [inspectingShelter.lat, inspectingShelter.lng]) / 1000;
                      const dynamicRoute: RouteResult = {
                        shelterId: inspectingShelter.id,
                        shelterName: inspectingShelter.name,
                        shelterCapacity: inspectingShelter.capacity,
                        haversineDistance: distKm,
                        dijkstraDistance: distKm,
                        totalDistance: distKm,
                        coordinates: [[userLat, userLng], [inspectingShelter.lat, inspectingShelter.lng]],
                        walkingTime: Math.max(1, Math.round((distKm / 4.5) * 60)),
                        runningTime: Math.max(1, Math.round((distKm / 9.0) * 60))
                      };
                      setCustomTargetRoute(dynamicRoute);
                      setActiveRouteIdx(0);
                      onSelectRoute?.(0);
                    }
                    if (effectivePos) {
                      const destLngLat: [number, number] = [inspectingShelter.lng, inspectingShelter.lat];
                      fitRouteBounds(destLngLat);
                      fetchOsrmRoute(effectivePos[0], effectivePos[1], inspectingShelter.lng, inspectingShelter.lat)
                        .then(r => {
                          setOsrmRoutes(r);
                          if (r.length > 0 && r[0].coordinates.length > 1) {
                            fitRouteBounds(destLngLat, r[0].coordinates);
                          }
                        })
                        .catch(() => {});
                    }
                    setInspectingShelter(null);
                  }}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-indigo-600/30"
                >
                  <Navigation2 className="w-3.5 h-3.5" /> Arahkan Rute ke Shelter Ini
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tactical Emergency SMS SOS Modal */}
        {showSmsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          >
            <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-red-500/60 p-5 shadow-[0_0_40px_rgba(239,68,68,0.35)] font-sans">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
                  <span className="text-xs font-mono font-black text-red-400 tracking-wider">
                    TRANSMISI SOS DARURAT // OFFLINE
                  </span>
                </div>
                <button
                  onClick={() => setShowSmsModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="my-4 space-y-3 text-xs">
                {/* Opsi 1: Hotline Resmi Panggilan Suara Basarnas 115 */}
                <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-red-400 text-[10px]">HOTLINE RESMI SAR</span>
                    <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 text-[9px] font-bold">BEBAS PULSA</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-snug">
                    Panggilan telepon darurat suara langsung ke Basarnas. Operator seluler hanya melayani telepon suara untuk nomor 115 (tanpa kuota internet).
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      callEmergency115();
                    }}
                    className="w-full py-2.5 rounded-lg bg-red-600 hover:bg-red-500 active:scale-95 text-white font-mono font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 transition-all"
                  >
                    <Phone className="w-4 h-4" /> PANGGIL BASARNAS (115)
                  </button>
                </div>

                {/* Opsi 2: SMS Darurat GSM ke Kontak Keluarga / Kerabat */}
                <div className="p-3 rounded-xl bg-black/60 border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-nerv-cyan text-[10px]">SMS SOS 2G (KELUARGA / RELAWAN)</span>
                    <span className="px-1.5 py-0.5 rounded bg-nerv-cyan/20 text-nerv-cyan text-[9px] font-bold">OFFLINE</span>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-mono">NOMOR HP TUJUAN (KELUARGA/KERABAT):</label>
                    <input
                      type="tel"
                      value={smsTargetPhone}
                      onChange={(e) => setSmsTargetPhone(e.target.value)}
                      placeholder="08xxxxxxxxxx"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:border-nerv-cyan focus:outline-none placeholder:text-slate-600"
                    />
                    <p className="text-[10px] text-slate-400 font-mono leading-tight">
                      *(Opsional) Kosongkan jika ingin memilih nomor tujuan langsung di aplikasi SMS HP.
                    </p>
                  </div>

                  <div className="p-2.5 rounded bg-slate-950/80 border border-slate-800 text-[10px] font-mono text-slate-400 space-y-1">
                    <div className="text-nerv-cyan break-words">📍 Pos: {effectivePosRaw ? `${effectivePosRaw[0].toFixed(5)}, ${effectivePosRaw[1].toFixed(5)}` : 'UNKNOWN'}</div>
                    <div className="text-white break-words">🏠 Shelter: {activeRoutes[activeRouteIdx]?.shelterName || 'Titik Aman'}</div>
                    <div className="text-emerald-400 break-words leading-tight">⏱️ Disertai nama, NIK, waktu detik & tautan Google Maps</div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const userName = localStorage.getItem('atlasUserName') || localStorage.getItem('aegis_username') || localStorage.getItem('aegisUserName') || 'KORBAN';
                      const userNik = localStorage.getItem('atlasUserNik') || localStorage.getItem('aegis_nik') || localStorage.getItem('aegisUserNik') || '';
                      const shelterName = activeRoutes[activeRouteIdx]?.shelterName || 'Shelter Evakuasi Terdekat';
                      sendEmergencySmsSos({
                        lat: effectivePosRaw ? effectivePosRaw[0] : undefined,
                        lng: effectivePosRaw ? effectivePosRaw[1] : undefined,
                        userName,
                        userNik,
                        shelterName,
                        targetPhone: smsTargetPhone
                      });
                      setShowSmsModal(false);
                    }}
                    className="w-full py-2.5 rounded-lg bg-nerv-cyan/20 hover:bg-nerv-cyan/30 border border-nerv-cyan/60 active:scale-95 text-nerv-cyan hover:text-white font-mono font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-nerv-cyan/20"
                  >
                    <Radio className="w-4 h-4 animate-pulse" /> KIRIM SMS SOS
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </motion.div>
  )
}
