import { useState, useCallback, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, Polygon, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { shelters, hazardZones, findOptimalEvacuationRoutes, type RouteResult } from './lib/evacuation'
import {
  AlertTriangle, Shield, MapPin, Info, ChevronRight, X, Locate,
  Volume2, Menu, Radio, Satellite, Map as MapIcon, HelpCircle, Cpu,
  Plus, Minus, Crosshair, ArrowRight, History, Bell, Vibrate,
  SlidersHorizontal, Trash2, Navigation2, Lock, RefreshCw, Activity, Clock
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════
type ActivePage = 'map' | 'history' | 'settings'
type HistoryFilter = 'all' | 'real' | 'simulation'

interface EvacuationRecord {
  id: string
  timestamp: Date
  type: 'simulation' | 'real'
  eventName: string
  routeName: string
  distance: number | null
  walkingTime: number | null
  algorithm: string
  userLat: number
  userLng: number
}

interface AppSettings {
  algorithm: 'dijkstra' | 'haversine'
  sensorSensitivity: number       // 0–100
  soundAlert: boolean
  vibrationAlert: boolean
  pushAlerts: boolean
  cartographyTheme: 'standard' | 'tactical-dark' | 'satellite-hud'
  safeZoneRadius: number          // km
  autoStartGPS: boolean
  showHazardZones: boolean
}

const DEFAULT_SETTINGS: AppSettings = {
  algorithm: 'dijkstra',
  sensorSensitivity: 75,
  soundAlert: true,
  vibrationAlert: false,
  pushAlerts: true,
  cartographyTheme: 'standard',
  safeZoneRadius: 2.5,
  autoStartGPS: true,
  showHazardZones: true,
}

// ═══════════════════════════════════════════════════════════════
// MAP TILE URLS
// ═══════════════════════════════════════════════════════════════
const TILE_NORMAL    = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const TILE_DARK      = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
const TILE_SATELLITE = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'

// ═══════════════════════════════════════════════════════════════
// LEAFLET ICON SETUP
// ═══════════════════════════════════════════════════════════════
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

const shelterIcon = new L.Icon({
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
  className: 'shelter-marker',
})

const userIcon = new L.DivIcon({
  html: `<div style="width:20px;height:20px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border:3px solid white;border-radius:50%;box-shadow:0 0 12px rgba(99,102,241,0.7),0 0 24px rgba(99,102,241,0.3);animation:userPulse 2s infinite;"></div>
  <style>@keyframes userPulse{0%,100%{box-shadow:0 0 12px rgba(99,102,241,0.7);}50%{box-shadow:0 0 24px rgba(99,102,241,1),0 0 48px rgba(99,102,241,0.5);}}</style>`,
  className: '', iconSize: [20, 20], iconAnchor: [10, 10],
})

const userIconAlert = new L.DivIcon({
  html: `<div style="width:36px;height:36px;display:flex;align-items:center;justify-content:center;filter:drop-shadow(0 0 8px rgba(239,68,68,0.8));animation:navPulse 1s infinite;">
    <svg viewBox="0 0 24 24" width="32" height="32" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L22 21L12 17L2 21L12 2Z" fill="white" stroke="white" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M12 4L19.5 19.5L12 16.5L4.5 19.5L12 4Z" fill="#ef4444"/>
    </svg>
  </div>
  <style>@keyframes navPulse{0%,100%{transform:scale(1) translateY(0);filter:drop-shadow(0 0 8px rgba(239,68,68,0.6));}50%{transform:scale(1.1) translateY(-2px);filter:drop-shadow(0 0 20px rgba(239,68,68,1));}}</style>`,
  className: '', iconSize: [36, 36], iconAnchor: [18, 18],
})

// ═══════════════════════════════════════════════════════════════
// ALARM SOUND
// ═══════════════════════════════════════════════════════════════
function createAlarmSound(): { start: () => void; stop: () => void } {
  let audioCtx: AudioContext | null = null
  let osc1: OscillatorNode | null = null
  let osc2: OscillatorNode | null = null
  let lfoNode: OscillatorNode | null = null

  return {
    start() {
      if (audioCtx) return
      audioCtx = new AudioContext()
      const gain = audioCtx.createGain(); gain.gain.value = 0.3; gain.connect(audioCtx.destination)
      osc1 = audioCtx.createOscillator(); osc1.type = 'sawtooth'; osc1.frequency.value = 440
      lfoNode = audioCtx.createOscillator(); lfoNode.type = 'sine'; lfoNode.frequency.value = 1.5
      const lfoGain = audioCtx.createGain(); lfoGain.gain.value = 200
      lfoNode.connect(lfoGain); lfoGain.connect(osc1.frequency)
      osc1.connect(gain); osc1.start(); lfoNode.start()
      osc2 = audioCtx.createOscillator(); osc2.type = 'sine'; osc2.frequency.value = 660
      const gain2 = audioCtx.createGain(); gain2.gain.value = 0.15; osc2.connect(gain2); gain2.connect(audioCtx.destination)
      const lfo2 = audioCtx.createOscillator(); lfo2.type = 'sine'; lfo2.frequency.value = 1.5
      const lfoGain2 = audioCtx.createGain(); lfoGain2.gain.value = 300; lfo2.connect(lfoGain2); lfoGain2.connect(osc2.frequency)
      osc2.start(); lfo2.start()
    },
    stop() {
      try { osc1?.stop(); osc2?.stop(); lfoNode?.stop(); audioCtx?.close() } catch (_) {}
      audioCtx = null; osc1 = null; osc2 = null; lfoNode = null
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// MAP CHILD COMPONENTS
// ═══════════════════════════════════════════════════════════════
function LocationMarker({ onLocationSet }: { onLocationSet: (lat: number, lng: number) => void }) {
  useMapEvents({ click(e) { onLocationSet(e.latlng.lat, e.latlng.lng) } })
  return null
}

// FIX: only flies on mount (key prop forces remount per unique position)
// onComplete resets flyToPos to null so it doesn't re-fly
function MapFlyTo({ position, zoom, onComplete }: {
  position: [number, number]; zoom?: number; onComplete: () => void
}) {
  const map = useMap()
  useEffect(() => {
    map.flyTo(position, zoom ?? 15, { duration: 1.2 })
    onComplete()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // intentionally empty — new key prop forces fresh mount
  return null
}

function CustomMapControls({ userPosition, onLocateClick }: {
  userPosition: [number, number] | null; onLocateClick: () => void
}) {
  const map = useMap()
  return (
    <div className="absolute left-3 md:left-6 top-[140px] md:top-[180px] z-[1000] flex flex-col gap-2 pointer-events-auto">
      <button onClick={() => map.zoomIn()} title="Zoom In"
        className="w-9 h-9 bg-[#1e293b]/90 backdrop-blur-md hover:bg-slate-700 rounded-xl flex items-center justify-center text-slate-300 shadow-[0_4px_20px_rgba(0,0,0,0.5)] border border-slate-700 transition-colors">
        <Plus className="w-5 h-5" />
      </button>
      <button onClick={() => map.zoomOut()} title="Zoom Out"
        className="w-9 h-9 bg-[#1e293b]/90 backdrop-blur-md hover:bg-slate-700 rounded-xl flex items-center justify-center text-slate-300 shadow-[0_4px_20px_rgba(0,0,0,0.5)] border border-slate-700 transition-colors">
        <Minus className="w-5 h-5" />
      </button>
      <button onClick={() => { onLocateClick(); if (userPosition) map.flyTo(userPosition, 14, { duration: 1.5 }) }}
        title="My Location"
        className="w-9 h-9 mt-2 bg-[#1e293b]/90 backdrop-blur-md hover:bg-slate-700 rounded-xl flex items-center justify-center text-slate-300 shadow-[0_4px_20px_rgba(0,0,0,0.5)] border border-slate-700 transition-colors">
        <Crosshair className="w-5 h-5" />
      </button>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// MINI ROUTE MAP — decorative SVG for history log cards
// ═══════════════════════════════════════════════════════════════
function MiniRouteMap({ type, seed }: { type: 'real' | 'simulation'; seed?: number }) {
  const col  = type === 'simulation' ? '#6366f1' : '#ef4444'
  const glow = type === 'simulation' ? 'rgba(99,102,241,0.25)' : 'rgba(239,68,68,0.25)'
  // slight variation by seed so cards look different
  const mid  = seed ? 28 + (seed % 10) * 2 : 32
  const id   = `mg-${type}-${seed ?? 0}`
  return (
    <div className="w-full h-[68px] rounded-xl overflow-hidden" style={{ background: '#060d1a' }}>
      <svg width="100%" height="68" viewBox="0 0 280 68" preserveAspectRatio="none">
        <defs>
          <filter id={id}>
            <feGaussianBlur stdDeviation="2.5" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        {/* grid */}
        {[0,1,2,3].map(i => <line key={`h${i}`} x1="0" y1={17*i} x2="280" y2={17*i} stroke="#0d1e3a" strokeWidth="1"/>)}
        {[0,1,2,3,4,5,6].map(i => <line key={`v${i}`} x1={40*i} y1="0" x2={40*i} y2="68" stroke="#0d1e3a" strokeWidth="1"/>)}
        {/* glow path */}
        <path d={`M14,56 C55,56 55,${mid} 100,${mid-4} C145,${mid-8} 160,42 205,18 C230,8 256,14 268,10`}
          stroke={glow} strokeWidth="5" fill="none" filter={`url(#${id})`}/>
        {/* route line */}
        <path d={`M14,56 C55,56 55,${mid} 100,${mid-4} C145,${mid-8} 160,42 205,18 C230,8 256,14 268,10`}
          stroke={col} strokeWidth="1.8" fill="none" strokeDasharray="5 3"/>
        {/* origin */}
        <circle cx="14" cy="56" r="4" fill={col}/>
        {/* waypoints */}
        <circle cx="100" cy={mid-4} r="2.5" fill={col} opacity="0.55"/>
        <circle cx="205" cy="18" r="2.5" fill={col} opacity="0.55"/>
        {/* destination */}
        <circle cx="268" cy="10" r="9" fill="#22c55e" opacity="0.18"/>
        <circle cx="268" cy="10" r="5"  fill="#22c55e"/>
      </svg>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════
function fmtDate(d: Date) {
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
    + ' • '
    + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

// ═══════════════════════════════════════════════════════════════
// APP
// ═══════════════════════════════════════════════════════════════
function App() {
  // ── Map state ──────────────────────────────────────────────
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null)
  const [routes, setRoutes] = useState<RouteResult[]>([])
  const [selectedRoute, setSelectedRoute] = useState(0)
  const [showPanel, setShowPanel] = useState(false)
  const [isCalculating, setIsCalculating] = useState(false)
  const [flyToPos, setFlyToPos] = useState<[number, number] | null>(null)

  // ── GPS & Alert state ──────────────────────────────────────
  const [gpsTracking, setGpsTracking] = useState(false)
  const [gpsError, setGpsError] = useState<string | null>(null)
  const [tsunamiAlert, setTsunamiAlert] = useState(false)
  const [alarmMuted, setAlarmMuted] = useState(false)
  const [showTsunamiConfirm, setShowTsunamiConfirm] = useState(false)
  const [showShelters, setShowShelters] = useState(false)
  const [showLeftSidebar, setShowLeftSidebar] = useState(true)

  // ── Navigation ─────────────────────────────────────────────
  const [activePage, setActivePage] = useState<ActivePage>('map')
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>('all')

  // ── Persistent Terminal ID ─────────────────────────────────
  const [terminalId] = useState(() => {
    const s = localStorage.getItem('aegisTerminalId')
    if (s) return s
    const id = `AEGIS-${Math.floor(Math.random() * 900 + 100)}`
    localStorage.setItem('aegisTerminalId', id)
    return id
  })

  // ── History ────────────────────────────────────────────────
  const [evacuationHistory, setEvacuationHistory] = useState<EvacuationRecord[]>(() => {
    try {
      const s = localStorage.getItem('evacuationHistory')
      if (s) return JSON.parse(s).map((r: any) => ({
        ...r,
        timestamp: new Date(r.timestamp),
        eventName: r.eventName ?? r.routeName ?? 'Unknown Event',
      }))
    } catch (_) {}
    return []
  })

  // ── Settings ───────────────────────────────────────────────
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const s = localStorage.getItem('appSettings')
      if (s) return { ...DEFAULT_SETTINGS, ...JSON.parse(s) }
    } catch (_) {}
    return DEFAULT_SETTINGS
  })

  // ── Misc ───────────────────────────────────────────────────
  const [isMobile, setIsMobile] = useState(false)
  const alarmRef = useRef(createAlarmSound())
  const gpsWatchRef = useRef<number | null>(null)
  const gpsAutoStartedRef = useRef(false)

  // Persist
  useEffect(() => { localStorage.setItem('appSettings', JSON.stringify(settings)) }, [settings])
  useEffect(() => { localStorage.setItem('evacuationHistory', JSON.stringify(evacuationHistory)) }, [evacuationHistory])

  // Mobile detection
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check(); window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // ── Save history record ────────────────────────────────────
  const saveHistoryRecord = useCallback((
    routeResults: RouteResult[], type: 'simulation' | 'real', pos: [number, number]
  ) => {
    if (routeResults.length === 0) return
    const best = routeResults[0]
    const sector = Math.abs(Math.floor(pos[0] * 17 + pos[1] * 13)) % 12 + 1
    const eventName = type === 'simulation'
      ? `Coastal Surge: Sector ${sector} Evacuation`
      : `Live Navigation: Route Alpha`
    const record: EvacuationRecord = {
      id: Date.now().toString(),
      timestamp: new Date(),
      type,
      eventName,
      routeName: best.shelterName,
      distance:    best.totalDistance === Infinity ? null : best.totalDistance,
      walkingTime: best.totalDistance === Infinity ? null : best.walkingTime,
      algorithm: settings.algorithm === 'haversine' ? 'HAVERSINE' : 'DIJKSTRA',
      userLat: pos[0],
      userLng: pos[1],
    }
    setEvacuationHistory(prev => [record, ...prev].slice(0, 50))
  }, [settings.algorithm])

  // ── GPS ────────────────────────────────────────────────────
  const startGpsTracking = useCallback(() => {
    if (!navigator.geolocation) { setGpsError('GPS tidak didukung di browser ini'); return }
    // Clear any existing watch first to prevent duplicate watchers
    if (gpsWatchRef.current !== null) {
      navigator.geolocation.clearWatch(gpsWatchRef.current)
      gpsWatchRef.current = null
    }
    setGpsTracking(true); setGpsError(null); setIsCalculating(true)
    gpsWatchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const newPos: [number, number] = [pos.coords.latitude, pos.coords.longitude]
        setUserPosition(newPos)
        setFlyToPos(newPos)
        const routeResults = findOptimalEvacuationRoutes(newPos[0], newPos[1])
        setRoutes(routeResults); setSelectedRoute(0); setShowPanel(true); setIsCalculating(false)
        saveHistoryRecord(routeResults, tsunamiAlert ? 'simulation' : 'real', newPos)
      },
      (err) => {
        setIsCalculating(false)
        setGpsError(err.code === 1 ? 'Izin lokasi ditolak. Aktifkan GPS di pengaturan browser.' : 'Sinyal GPS lemah atau timeout')
        setGpsTracking(false)
        if (gpsWatchRef.current !== null) { navigator.geolocation.clearWatch(gpsWatchRef.current); gpsWatchRef.current = null }
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 5000 }
    )
  }, [saveHistoryRecord, tsunamiAlert])

  const stopGpsTracking = useCallback(() => {
    if (gpsWatchRef.current !== null) { navigator.geolocation.clearWatch(gpsWatchRef.current); gpsWatchRef.current = null }
    setGpsTracking(false)
  }, [])

  // Auto-start GPS on mobile
  useEffect(() => {
    if (isMobile && settings.autoStartGPS && !gpsAutoStartedRef.current) {
      gpsAutoStartedRef.current = true
      const t = setTimeout(() => startGpsTracking(), 1000)
      return () => clearTimeout(t)
    }
  }, [isMobile, settings.autoStartGPS, startGpsTracking])

  // ── Tsunami ────────────────────────────────────────────────
  const activateTsunamiAlert = useCallback(() => {
    setTsunamiAlert(true); setShowTsunamiConfirm(false)
    if (!alarmMuted && settings.soundAlert) alarmRef.current.start()
    if (settings.vibrationAlert && 'vibrate' in navigator) navigator.vibrate([500, 200, 500, 200, 500])
    startGpsTracking()
  }, [alarmMuted, settings.soundAlert, settings.vibrationAlert, startGpsTracking])

  const deactivateTsunamiAlert = useCallback(() => {
    setTsunamiAlert(false); alarmRef.current.stop()
  }, [])

  useEffect(() => {
    if (tsunamiAlert) {
      if (alarmMuted || !settings.soundAlert) alarmRef.current.stop()
      else alarmRef.current.start()
    }
  }, [alarmMuted, tsunamiAlert, settings.soundAlert])

  useEffect(() => () => {
    alarmRef.current.stop()
    if (gpsWatchRef.current !== null) navigator.geolocation.clearWatch(gpsWatchRef.current)
  }, [])

  // ── Map click ──────────────────────────────────────────────
  const handleLocationSet = useCallback((lat: number, lng: number) => {
    if (gpsTracking) return
    setUserPosition([lat, lng]); setIsCalculating(true)
    setTimeout(() => {
      const routeResults = findOptimalEvacuationRoutes(lat, lng)
      setRoutes(routeResults); setSelectedRoute(0); setShowPanel(true); setIsCalculating(false)
      saveHistoryRecord(routeResults, 'real', [lat, lng])
    }, 300)
  }, [gpsTracking, saveHistoryRecord])

  // ── Derived ────────────────────────────────────────────────
  const mapTileUrl = tsunamiAlert
    ? TILE_DARK
    : settings.cartographyTheme === 'satellite-hud' ? TILE_SATELLITE
    : settings.cartographyTheme === 'tactical-dark'  ? TILE_DARK
    : TILE_NORMAL

  const mapTileKey = tsunamiAlert ? 'tsunami-dark' : settings.cartographyTheme

  const routeColors = tsunamiAlert ? ['#ef4444', '#f59e0b', '#22c55e'] : ['#6366f1', '#f59e0b', '#10b981']
  const routeBadgeColors = ['bg-indigo-500', 'bg-amber-500', 'bg-emerald-500']

  const avgResponse = evacuationHistory.length > 0
    ? (evacuationHistory.reduce((s, r) => s + (r.walkingTime ?? 0), 0) / evacuationHistory.length).toFixed(1)
    : null

  const filteredHistory = historyFilter === 'all'
    ? evacuationHistory
    : evacuationHistory.filter(r => r.type === (historyFilter === 'real' ? 'real' : 'simulation'))

  // ════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════
  return (
    <div className="w-full h-screen bg-[#0b1120] text-slate-300 font-sans overflow-hidden flex flex-col">

      {/* ═══ MOBILE HEADER ═══ */}
      <header className={`md:hidden shrink-0 px-4 py-3 z-50 relative transition-colors duration-500 backdrop-blur-md
        ${tsunamiAlert ? 'bg-red-950/95 border-b border-red-900/50' : 'bg-[#0a1020]/95 border-b border-slate-800/60'}`}>
        <div className="flex items-center justify-between gap-2">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${tsunamiAlert ? 'bg-red-500/20 border border-red-500/30' : 'bg-indigo-500/20 border border-indigo-500/30'}`}>
              <Shield className={`w-4 h-4 ${tsunamiAlert ? 'text-red-400' : 'text-indigo-400'}`} />
            </div>
            <div>
              <h1 className="text-white font-black text-sm tracking-widest leading-none">AEGIS RESPONSE</h1>
              <p className="text-[9px] text-slate-600 font-mono mt-0.5">Sistem Evakuasi · {terminalId}</p>
            </div>
          </div>
          {/* Status indicators */}
          <div className="flex items-center gap-1.5 mx-auto">
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-bold border ${tsunamiAlert ? 'bg-red-900/50 border-red-700/50 text-red-300' : 'bg-emerald-900/30 border-emerald-700/30 text-emerald-400'}`}>
              <Radio className={`w-2.5 h-2.5 ${tsunamiAlert ? 'animate-pulse' : ''}`}/>
              <span>SENSOR</span>
            </div>
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-bold border ${gpsTracking ? 'bg-indigo-900/50 border-indigo-700/50 text-indigo-300' : 'bg-slate-800/50 border-slate-700/50 text-slate-500'}`}>
              <Satellite className={`w-2.5 h-2.5 ${gpsTracking ? 'animate-pulse' : ''}`}/>
              <span>{gpsTracking ? 'GPS' : 'OFFLINE'}</span>
            </div>
          </div>
          {/* Avatar + Tsunami btn */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => tsunamiAlert ? deactivateTsunamiAlert() : setShowTsunamiConfirm(true)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-[10px] transition-all
                ${tsunamiAlert ? 'bg-red-500/30 text-red-200 border border-red-500/50' : 'bg-red-600 hover:bg-red-500 text-white'}`}>
              <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${tsunamiAlert ? 'bg-red-400 animate-pulse' : 'bg-red-300'}`} />
              <span className="leading-tight text-center">{tsunamiAlert ? 'STOP' : 'SIMULASI'}</span>
            </button>
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4 text-indigo-400"/>
            </div>
          </div>
        </div>
      </header>

      {/* ═══ DESKTOP HEADER ═══ */}
      <header className={`hidden md:flex h-[60px] shrink-0 border-b items-center justify-between px-6 z-50 relative transition-colors duration-500
        ${tsunamiAlert ? 'bg-red-950 border-red-900/50' : 'bg-[#0a1020] border-slate-800/60'}`}>
        {/* Left: brand */}
        <div className="flex items-center gap-3">
          <button onClick={() => setShowLeftSidebar(!showLeftSidebar)} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-white transition-colors">
            <Menu className="w-4 h-4" />
          </button>
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${tsunamiAlert ? 'bg-red-500/20 border border-red-500/30' : 'bg-indigo-500/20 border border-indigo-500/30'}`}>
            <Shield className={`w-4 h-4 ${tsunamiAlert ? 'text-red-400' : 'text-indigo-400'}`} />
          </div>
          <div>
            <h1 className="text-white font-black text-sm tracking-widest leading-none">AEGIS RESPONSE</h1>
            <p className="text-[9px] text-slate-600 font-mono">TES SKRIPSI · Kota Palu</p>
          </div>
        </div>
        {/* Center: status indicators */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2" title="Sensor Seismik">
            <div className={`p-1.5 rounded-lg ${tsunamiAlert ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
              <Radio className={`w-3.5 h-3.5 ${tsunamiAlert ? 'animate-pulse' : ''}`} />
            </div>
            <div className="hidden lg:flex flex-col">
              <span className="text-[8px] text-slate-600 font-bold uppercase tracking-wider leading-none mb-0.5">Sensor</span>
              <span className={`text-[9px] font-bold uppercase leading-none ${tsunamiAlert ? 'text-red-400' : 'text-emerald-400'}`}>{tsunamiAlert ? 'ALERT' : 'Active'}</span>
            </div>
          </div>
          <div className="w-px h-5 bg-slate-800"/>
          <div className="flex items-center gap-2" title="GPS Satelit">
            <div className={`p-1.5 rounded-lg ${gpsTracking ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800 text-slate-500'}`}>
              <Satellite className={`w-3.5 h-3.5 ${gpsTracking ? 'animate-pulse' : ''}`} />
            </div>
            <div className="hidden lg:flex flex-col">
              <span className="text-[8px] text-slate-600 font-bold uppercase tracking-wider leading-none mb-0.5">Sat-Link</span>
              <span className={`text-[9px] font-bold uppercase leading-none ${gpsTracking ? 'text-indigo-400' : 'text-slate-500'}`}>{gpsTracking ? 'Tracking' : 'Standby'}</span>
            </div>
          </div>
          <div className="w-px h-5 bg-slate-800"/>
          {/* Terminal ID chip */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/60 border border-slate-700/40">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"/>
            <span className="text-[9px] font-mono text-slate-400 font-bold">{terminalId}</span>
          </div>
        </div>
        {/* Right: actions + avatar */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => tsunamiAlert ? deactivateTsunamiAlert() : setShowTsunamiConfirm(true)}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg font-bold text-sm transition-all
              ${tsunamiAlert ? 'bg-red-500/20 text-red-200 border border-red-500/50' : 'bg-red-600 hover:bg-red-500 text-white border border-transparent'}`}>
            <AlertTriangle className={`w-4 h-4 ${tsunamiAlert ? 'animate-pulse text-red-400' : ''}`} />
            {tsunamiAlert ? 'HENTIKAN SIMULASI' : 'SIMULASI TSUNAMI'}
          </button>
          <div className="w-9 h-9 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center shrink-0" title="User Profile">
            <Shield className="w-4 h-4 text-indigo-400"/>
          </div>
        </div>
      </header>

      {/* ═══ MAIN CONTENT ═══ */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* Tsunami overlay */}
        <div className={`absolute inset-0 z-[400] pointer-events-none transition-opacity duration-1000 ${tsunamiAlert ? 'bg-red-900/20' : 'opacity-0'}`} />
        <div className={`absolute inset-0 z-[400] pointer-events-none border-4 transition-colors duration-500 ${tsunamiAlert ? 'border-red-500/50 animate-[borderFlash_2s_infinite]' : 'border-transparent'}`} />

        {/* ═══ DESKTOP LEFT SIDEBAR ═══ */}
        <AnimatePresence initial={false}>
          {showLeftSidebar && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 220, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="bg-[#0b1120] border-r border-slate-800 flex flex-col z-40 relative hidden lg:flex shrink-0 overflow-hidden whitespace-nowrap"
            >
              <div className="w-[220px]">
                <div className="p-6 pb-2">
                  <h3 className="text-[10px] font-bold text-indigo-400 tracking-widest uppercase mb-1">Navigation</h3>
                  <p className="text-[9px] text-slate-600 uppercase tracking-widest">System Active</p>
                </div>
                <nav className="flex-1 mt-4">
                  {([
                    { page: 'map'      as ActivePage, Icon: MapIcon,          label: 'MAP'      },
                    { page: 'history'  as ActivePage, Icon: History,           label: 'HISTORY'  },
                    { page: 'settings' as ActivePage, Icon: SlidersHorizontal, label: 'SETTINGS' },
                  ]).map(({ page, Icon, label }) => (
                    <button key={page} onClick={() => setActivePage(page)}
                      className={`w-full flex items-center gap-3 px-6 py-3 transition-colors relative
                        ${activePage === page ? 'bg-[#1e293b]/50 border-r-2 border-indigo-500 text-indigo-300' : 'text-slate-500 hover:text-slate-300'}`}>
                      <Icon className="w-5 h-5" />
                      <span className="font-semibold text-sm tracking-wide">{label}</span>
                      {page === 'history' && evacuationHistory.length > 0 && (
                        <span className="ml-auto mr-1 text-[9px] bg-indigo-500 text-white rounded-full px-1.5 py-0.5 font-bold">
                          {evacuationHistory.length}
                        </span>
                      )}
                    </button>
                  ))}
                </nav>
                <div className="p-6 mt-auto">
                  <button onClick={() => setShowShelters(true)} className="flex items-center gap-3 text-slate-500 hover:text-indigo-400 transition-colors">
                    <HelpCircle className="w-5 h-5" />
                    <span className="font-semibold text-sm tracking-wide">SUPPORT / INFO</span>
                  </button>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* ═══ CENTER MAP ═══ */}
        <main className="flex-1 relative z-0 bg-[#0b1120]">

          {/* Mobile GPS badges */}
          <div className="md:hidden absolute top-3 left-0 right-0 flex justify-center gap-2 z-[1000]">
            <button onClick={() => gpsTracking ? stopGpsTracking() : startGpsTracking()}
              className={`px-3 py-1.5 rounded-full flex items-center gap-2 border shadow-lg transition-colors text-xs font-bold tracking-wide
                ${gpsTracking ? 'bg-green-900/80 border-green-500/50 text-green-300' : 'bg-slate-900/80 border-slate-700 text-slate-400'}`}>
              <div className={`w-2 h-2 rounded-full ${gpsTracking ? 'bg-green-400 animate-pulse' : 'bg-slate-500'}`} />
              {gpsTracking ? 'GPS AKTIF' : 'ACTIVATE GPS'}
            </button>
            {gpsTracking && (
              <div className="px-3 py-1.5 rounded-full bg-indigo-900/60 border border-indigo-500/30 flex items-center gap-2 text-xs font-bold tracking-wide text-indigo-300 shadow-lg">
                <Locate className="w-3.5 h-3.5" /> TRACKING
              </div>
            )}
          </div>

          {/* Desktop GPS controls */}
          <div className="hidden md:flex absolute top-4 left-4 gap-2 z-[1000]">
            <button onClick={() => gpsTracking ? stopGpsTracking() : startGpsTracking()}
              className={`px-3 py-1.5 rounded-full flex items-center gap-2 border shadow-lg transition-colors text-xs font-bold tracking-wide
                ${gpsTracking ? 'bg-green-900/60 border-green-500/50 text-green-300' : 'bg-slate-900/80 border-slate-700 hover:bg-slate-800 text-slate-400'}`}>
              <div className={`w-2 h-2 rounded-full ${gpsTracking ? 'bg-green-400 animate-pulse' : 'bg-slate-500'}`} />
              {gpsTracking ? 'GPS AKTIF' : 'ACTIVATE GPS'}
            </button>
            {gpsTracking && (
              <div className="px-3 py-1.5 rounded-full bg-indigo-900/40 border border-indigo-500/30 flex items-center gap-2 text-xs font-bold tracking-wide text-indigo-300">
                <Locate className="w-3.5 h-3.5" /> TRACKING
              </div>
            )}
          </div>

          {/* Map */}
          <MapContainer center={[-0.8917, 119.8577]} zoom={14} minZoom={10} maxZoom={20} className="w-full h-full" zoomControl={false}>
            <TileLayer url={mapTileUrl} key={mapTileKey}
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <CustomMapControls userPosition={userPosition} onLocateClick={() => { if (!gpsTracking) startGpsTracking() }} />
            <LocationMarker onLocationSet={handleLocationSet} />

            {/* FIX: key forces fresh mount per unique position; onComplete resets flyToPos */}
            {flyToPos && (
              <MapFlyTo
                key={`${flyToPos[0].toFixed(5)}-${flyToPos[1].toFixed(5)}`}
                position={flyToPos}
                zoom={15}
                onComplete={() => setFlyToPos(null)}
              />
            )}

            {/* Hazard zones */}
            {settings.showHazardZones && hazardZones.map((zone, i) => (
              <Polygon key={i} positions={zone.coords} pathOptions={{
                color: tsunamiAlert ? '#ff0000' : '#ef4444',
                fillColor: tsunamiAlert ? '#ff0000' : '#ef4444',
                fillOpacity: tsunamiAlert ? 0.35 : 0.15,
                weight: tsunamiAlert ? 3 : 1,
              }} />
            ))}

            {/* Shelters */}
            {shelters.map(shelter => (
              <Marker key={shelter.id} position={[shelter.lat, shelter.lng]} icon={shelterIcon}>
                <Popup className="shelter-popup">
                  <div className="font-bold text-slate-800">{shelter.name}</div>
                  <div className="text-sm text-slate-600">Kapasitas: {shelter.capacity} orang</div>
                  {!isCalculating && !tsunamiAlert && (
                    <button onClick={(e) => {
                      e.stopPropagation()
                      if (userPosition) {
                        setIsCalculating(true)
                        setTimeout(() => {
                          const r = findOptimalEvacuationRoutes(userPosition[0], userPosition[1])
                          setRoutes(r); setSelectedRoute(0); setShowPanel(true); setIsCalculating(false)
                        }, 300)
                      } else alert('Klik peta terlebih dahulu untuk menentukan lokasi Anda!')
                    }} className="mt-2 w-full px-3 py-1 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-700">
                      Evakuasi ke Sini
                    </button>
                  )}
                </Popup>
              </Marker>
            ))}

            {/* User position */}
            {userPosition && (
              <Marker position={userPosition} icon={tsunamiAlert ? userIconAlert : userIcon} zIndexOffset={1000}>
                <Popup><strong>{gpsTracking ? 'Lokasi GPS Anda' : 'Lokasi Terpilih'}</strong></Popup>
              </Marker>
            )}

            {/* Routes */}
            {routes.map((route, i) => (
              <Polyline key={i} positions={route.coordinates} pathOptions={{
                color: routeColors[i],
                weight: i === selectedRoute ? 6 : 3,
                opacity: i === selectedRoute ? 0.9 : 0.4,
                dashArray: i === selectedRoute ? undefined : '10 6',
              }} />
            ))}
          </MapContainer>

          {/* ═══ MOBILE BOTTOM SHEET ═══ */}
          <AnimatePresence>
            {showPanel && routes.length > 0 && isMobile && (
              <motion.div
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="absolute bottom-0 left-0 right-0 z-[500] max-h-[65vh] flex flex-col bg-[#0f172a]/98 backdrop-blur-xl rounded-t-2xl border-t border-slate-700/50 shadow-[0_-10px_40px_rgba(0,0,0,0.7)]"
              >
                <div className="flex justify-center pt-2 pb-1">
                  <div className="w-10 h-1 rounded-full bg-slate-700" />
                </div>
                <div className="px-4 pb-3 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                      <ArrowRight className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-white leading-tight">Rute Evakuasi</h2>
                      <p className="text-[11px] text-slate-400">
                        {routes.length} rute • <span className="text-indigo-400 italic">{settings.algorithm.toUpperCase()}</span>
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setShowPanel(false)} className="p-1.5 text-slate-500 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto px-4 pb-2 space-y-2.5 custom-scrollbar">
                  {routes.map((route, i) => (
                    <button key={i}
                      onClick={() => {
                        setSelectedRoute(i)
                        if (route.coordinates.length > 0) {
                          const ep = route.coordinates[route.coordinates.length - 1]
                          setFlyToPos([ep[0], ep[1]])
                        }
                      }}
                      className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-center gap-3
                        ${selectedRoute === i
                          ? 'bg-[#1e293b]/80 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.1)]'
                          : 'bg-[#1e293b]/30 border-slate-800 active:bg-[#1e293b]/60'}`}
                    >
                      <div className={`w-10 h-10 rounded-xl ${routeBadgeColors[i] ?? 'bg-slate-600'} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-white leading-snug truncate">{route.shelterName}</h3>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {route.totalDistance === Infinity ? 'N/A' : `${route.totalDistance.toFixed(2)} km`}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {route.totalDistance === Infinity ? 'N/A' : `~${route.walkingTime} menit`}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className={`w-5 h-5 shrink-0 ${selectedRoute === i ? 'text-indigo-400' : 'text-slate-600'}`} />
                    </button>
                  ))}
                  <div className="p-3.5 bg-indigo-950/40 border border-indigo-500/20 rounded-xl flex gap-3">
                    <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Rute dihitung menggunakan <span className="text-indigo-300 italic">Algoritma {settings.algorithm.charAt(0).toUpperCase() + settings.algorithm.slice(1)}</span> berdasarkan jaringan jalan dan jarak <span className="text-indigo-300 italic">Haversine</span>.
                    </p>
                  </div>
                  <button onClick={() => setShowPanel(false)}
                    className="w-full py-3 bg-[#1e293b] hover:bg-slate-700 border border-slate-700 text-white rounded-xl text-sm font-bold tracking-wide transition-colors">
                    TUTUP PANEL
                  </button>
                  <div className="h-2" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* ═══ DESKTOP RIGHT SIDEBAR (Routes) ═══ */}
        <AnimatePresence>
          {showPanel && routes.length > 0 && !isMobile && (
            <motion.aside
              initial={{ x: 400, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 400, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full md:w-[320px] h-full absolute md:relative right-0 bg-[#0f172a] border-l border-slate-800 flex flex-col z-50 shrink-0 shadow-[-10px_0_30px_rgba(0,0,0,0.5)]"
            >
              <div className="p-4 pb-3">
                <div className="flex justify-between items-start mb-1">
                  <h2 className="text-lg font-bold text-white tracking-tight">Rute Evakuasi</h2>
                  <button onClick={() => setShowPanel(false)} className="text-slate-500 hover:text-white">
                    <X className="w-5 h-5"/>
                  </button>
                </div>
                <p className="text-[10px] text-indigo-400 font-bold tracking-widest uppercase">NEAREST SAFE ZONES</p>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 pt-0 flex flex-col gap-3">
                {routes.map((route, i) => (
                  <button key={i}
                    onClick={() => {
                      setSelectedRoute(i)
                      if (route.coordinates.length > 0) {
                        const ep = route.coordinates[route.coordinates.length - 1]
                        setFlyToPos([ep[0], ep[1]])
                      }
                    }}
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-300 relative group
                      ${selectedRoute === i
                        ? 'bg-[#1e293b]/80 border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.15)]'
                        : 'bg-[#1e293b]/30 border-slate-800 hover:bg-[#1e293b]/50 hover:border-slate-700'}`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className={`text-[10px] font-bold tracking-wider px-2 py-1 rounded
                        ${selectedRoute === i ? (i === 0 ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-700/50 text-slate-300') : 'text-slate-500'}`}>
                        {i === 0 ? 'FASTEST' : 'ALTERNATIVE'}
                      </span>
                      <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400">{i + 1}</div>
                    </div>
                    <h3 className="text-sm font-semibold text-white mb-3">{route.shelterName}</h3>
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5"/>{route.totalDistance === Infinity ? 'N/A' : `${route.totalDistance.toFixed(2)} km`}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5"/>{route.totalDistance === Infinity ? 'N/A' : `~${route.walkingTime} min`}</span>
                    </div>
                    {selectedRoute === i && (
                      <div className="mt-4 pt-4 border-t border-slate-700/50">
                        <div className="w-full py-2 bg-indigo-500 text-white rounded-lg flex items-center justify-center gap-2 text-xs font-bold">
                          Go to Point <ChevronRight className="w-4 h-4"/>
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <div className="p-4 border-t border-slate-800 bg-[#0b1120]/50">
                <h4 className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-3 flex items-center gap-2">
                  <Cpu className="w-3.5 h-3.5"/> PATHFINDING LOGIC
                </h4>
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Distance Algo</span>
                    <span className="text-slate-300 font-mono bg-slate-800 px-2 py-0.5 rounded">Haversine</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Route Optimization</span>
                    <span className="text-slate-300 font-mono bg-slate-800 px-2 py-0.5 rounded">
                      {settings.algorithm.charAt(0).toUpperCase() + settings.algorithm.slice(1)}
                    </span>
                  </div>
                </div>
                {!gpsTracking && (
                  <button onClick={() => { setUserPosition(null); setRoutes([]); setShowPanel(false) }}
                    className="w-full mt-6 py-2.5 border border-slate-700 hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-bold transition-colors">
                    RESET POSITION
                  </button>
                )}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* ═══ MOBILE BOTTOM NAV ═══ */}
      <nav className={`md:hidden shrink-0 flex items-center justify-around py-3 border-t z-[600] transition-colors duration-500 backdrop-blur-md
        ${tsunamiAlert ? 'bg-red-950/95 border-red-900/50' : 'bg-[#0f172a]/95 border-slate-800/50'}`}>
        {([
          { page: 'map'      as ActivePage, Icon: MapIcon,          label: 'MAP'      },
          { page: 'history'  as ActivePage, Icon: History,           label: 'HISTORY'  },
          { page: 'settings' as ActivePage, Icon: SlidersHorizontal, label: 'SETTINGS' },
        ]).map(({ page, Icon, label }) => (
          <button key={page} onClick={() => setActivePage(page)}
            className={`flex flex-col items-center gap-1 transition-colors ${activePage === page ? 'text-indigo-400' : 'text-slate-600 active:text-slate-400'}`}>
            <div className="relative">
              <Icon className="w-5 h-5"/>
              {page === 'history' && evacuationHistory.length > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-indigo-500 rounded-full text-[8px] font-bold flex items-center justify-center text-white">
                  {evacuationHistory.length > 9 ? '9+' : evacuationHistory.length}
                </span>
              )}
            </div>
            <span className="text-[9px] font-bold tracking-wider">{label}</span>
          </button>
        ))}
      </nav>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* MODALS                                                    */}
      {/* ══════════════════════════════════════════════════════════ */}

      {/* Tsunami confirm */}
      <AnimatePresence>
        {showTsunamiConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl max-w-sm w-full text-center">
              <div className="w-16 h-16 bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/30">
                <AlertTriangle className="w-8 h-8 text-red-500"/>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Simulasi Tsunami?</h2>
              <p className="text-sm text-slate-400 mb-8">Sistem akan membunyikan sirine peringatan dini dan menyiagakan rute evakuasi darurat.</p>
              <div className="flex flex-col gap-3">
                <button onClick={activateTsunamiAlert} className="w-full py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold transition-colors">MULAI SIMULASI</button>
                <button onClick={() => setShowTsunamiConfirm(false)} className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition-colors">BATALKAN</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Shelter list */}
      <AnimatePresence>
        {showShelters && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0f172a] border border-slate-800 p-6 rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-indigo-500"/> Daftar Shelter
                </h2>
                <button onClick={() => setShowShelters(false)} className="p-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors">
                  <X className="w-5 h-5"/>
                </button>
              </div>
              <p className="text-sm text-slate-400 mb-4">Pilih lokasi untuk melihat titik evakuasi aman di peta.</p>
              <div className="overflow-y-auto pr-2 space-y-3 custom-scrollbar flex-1">
                {shelters.map((s, idx) => (
                  <div key={idx} className="p-4 bg-slate-800/30 border border-slate-700/50 rounded-xl flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                        <MapPin className="w-4 h-4 text-indigo-400"/>
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-200 text-sm">{s.name}</h3>
                        <p className="text-xs text-slate-500">{s.lat.toFixed(5)}, {s.lng.toFixed(5)}</p>
                      </div>
                    </div>
                    <button onClick={() => { setFlyToPos([s.lat, s.lng]); setShowShelters(false) }}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors">
                      LIHAT DI PETA
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* GPS Error */}
      <AnimatePresence>
        {gpsError && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className={`fixed ${isMobile ? 'top-20 left-4 right-4' : 'top-20 right-4'} z-[2000]`}>
            <div className="pl-4 pr-2 py-3 rounded-xl bg-amber-600 border border-amber-500 shadow-xl flex items-center gap-3">
              <AlertTriangle className="w-4 h-4 text-white shrink-0"/>
              <span className="text-xs text-white font-bold flex-1">{gpsError}</span>
              <button onClick={() => { setGpsError(null); if (isMobile) setTimeout(() => startGpsTracking(), 500) }}
                className="ml-1 px-2 py-1 bg-amber-500/50 hover:bg-amber-500 rounded-lg text-white text-xs font-bold shrink-0 transition-colors">
                {isMobile ? 'COBA LAGI' : <X className="w-4 h-4"/>}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Calculating overlay */}
      {isCalculating && isMobile && (
        <div className="fixed inset-0 z-[1500] flex items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-none">
          <div className="px-6 py-4 bg-slate-900/90 border border-slate-700 rounded-2xl flex items-center gap-3 shadow-2xl">
            <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"/>
            <span className="text-sm text-white font-bold">Menghitung rute...</span>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* HISTORY PAGE — "TACTICAL ARCHIVE"                        */}
      {/* ══════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {activePage === 'history' && (
          <motion.div
            initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }} transition={{ duration: 0.22 }}
            className="fixed inset-0 z-[1800] flex flex-col" style={{ background: '#080e1a' }}
          >
            {/* AEGIS top bar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/60 shrink-0" style={{ background: '#0a1020' }}>
              <button onClick={() => setActivePage('map')} className="p-2 text-slate-500 hover:text-white transition-colors">
                <Menu className="w-5 h-5"/>
              </button>
              <span className="text-sm font-black text-white tracking-widest">AEGIS RESPONSE</span>
              <div className="w-9 h-9 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                <Shield className="w-4 h-4 text-indigo-400"/>
              </div>
            </div>

            {/* Title */}
            <div className="px-5 pt-5 pb-3 shrink-0">
              <p className="text-[10px] font-bold text-indigo-400 tracking-widest uppercase mb-1">Tactical Archive</p>
              <h2 className="text-3xl font-black text-white tracking-tight leading-none">EVACUATION<br/>HISTORY</h2>
            </div>

            {/* Avg Response card + Visual Gauge */}
            <div className="px-5 pb-4 shrink-0">
              <div className="p-4 rounded-2xl border border-slate-700/40" style={{ background: '#0f1a2e' }}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Avg. Response Time</p>
                    {avgResponse
                      ? <p className="text-4xl font-black text-white">{avgResponse}<span className="text-xl text-slate-400 font-bold ml-1">m</span></p>
                      : <p className="text-xl font-black text-slate-600">— m</p>
                    }
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/20 flex items-center justify-center">
                    <Activity className="w-6 h-6 text-indigo-400"/>
                  </div>
                </div>
                {/* Visual Gauge - KPI performance bar */}
                {avgResponse && (() => {
                  const val = parseFloat(avgResponse)
                  const target = 30 // 30 menit = target ideal
                  const pct = Math.min(val / target * 100, 100)
                  const color = val <= 20 ? '#22c55e' : val <= 35 ? '#f59e0b' : '#ef4444'
                  const label = val <= 20 ? 'EXCELLENT' : val <= 35 ? 'GOOD' : 'NEEDS IMPROVEMENT'
                  return (
                    <div>
                      <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest mb-1.5">
                        <span className="text-slate-600">Performance KPI</span>
                        <span style={{ color }}>{label}</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }}/>
                      </div>
                      <div className="flex justify-between text-[8px] text-slate-600 mt-1">
                        <span>0m</span>
                        <span className="text-slate-500">Target ≤ {target}m</span>
                        <span>{target}m+</span>
                      </div>
                      {/* Trend bars — last 5 logs */}
                      {evacuationHistory.length > 1 && (
                        <div className="mt-3 pt-3 border-t border-slate-800/60">
                          <p className="text-[8px] text-slate-600 uppercase tracking-widest mb-1.5 font-bold">Last {Math.min(evacuationHistory.length, 6)} Sessions</p>
                          <div className="flex items-end gap-1 h-8">
                            {evacuationHistory.slice(0, 6).reverse().map((r, i) => {
                              const t = r.walkingTime ?? 0
                              const h = Math.max(Math.min(t / 60 * 100, 100), 10)
                              const c = t <= 20 ? '#22c55e' : t <= 35 ? '#f59e0b' : '#ef4444'
                              return (
                                <div key={i} className="flex-1 rounded-sm transition-all" style={{ height: `${h}%`, background: c, opacity: 0.7 }}/>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })()}
                {!avgResponse && (
                  <p className="text-[10px] text-slate-600">Jalankan simulasi untuk melihat statistik performa.</p>
                )}
              </div>
            </div>

            {/* Filter tabs */}
            <div className="px-5 pb-3 flex gap-2 shrink-0 overflow-x-auto">
              {([
                { id: 'all'        as HistoryFilter, label: '∞ ALL LOGS'    },
                { id: 'real'       as HistoryFilter, label: '▲ REAL ALERTS' },
                { id: 'simulation' as HistoryFilter, label: '◈ SIMULATION'  },
              ]).map(tab => (
                <button key={tab.id} onClick={() => setHistoryFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all
                    ${historyFilter === tab.id ? 'bg-indigo-600 text-white' : 'bg-slate-800/60 text-slate-500 hover:text-slate-300'}`}>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Log list */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-4">
              {evacuationHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <div className="w-20 h-20 rounded-full bg-slate-800/40 flex items-center justify-center">
                    <History className="w-10 h-10 text-slate-600"/>
                  </div>
                  <div className="text-center">
                    <p className="text-slate-400 font-semibold">Tidak ada log</p>
                    <p className="text-xs text-slate-600 mt-1 max-w-[240px]">Jalankan simulasi atau klik peta untuk mencatat riwayat evakuasi.</p>
                  </div>
                  <button onClick={() => setActivePage('map')}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm transition-colors">
                    Buka Peta
                  </button>
                </div>
              ) : filteredHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 gap-2">
                  <p className="text-slate-500 text-sm">Tidak ada log untuk filter ini</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredHistory.map((record, idx) => (
                    <div key={record.id} className="rounded-2xl border border-slate-800/60 overflow-hidden" style={{ background: '#0c1525' }}>
                      {/* Card header */}
                      <div className="px-4 pt-4 pb-3">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider shrink-0
                            ${record.type === 'real'
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'}`}>
                            {record.type === 'real' ? 'Real Alert' : 'Simulation'}
                          </span>
                          <span className="text-[10px] text-slate-600 text-right">{fmtDate(record.timestamp)}</span>
                        </div>
                        <h3 className="text-sm font-black text-white leading-tight mb-1">{record.eventName}</h3>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <Navigation2 className="w-3 h-3 shrink-0"/>
                          To {record.routeName} (Primary Shelter)
                        </p>
                      </div>

                      {/* Stats + status */}
                      <div className="px-4 pb-3 flex items-center justify-between">
                        <span className={`text-[10px] font-bold uppercase tracking-widest
                          ${record.type === 'simulation' ? 'text-indigo-500/50' : 'text-red-500/60'}`}>
                          {record.type === 'simulation' ? 'Simulation Complete' : 'Alert Dismissed'}
                        </span>
                        <div className="flex items-center gap-5">
                          <div className="text-right">
                            <p className="text-xs font-black text-white">{record.walkingTime != null ? `${record.walkingTime}m` : '—'}</p>
                            <p className="text-[9px] text-slate-600 uppercase tracking-wider">TIME</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-black text-white">{record.distance != null ? `${record.distance.toFixed(1)}km` : '—'}</p>
                            <p className="text-[9px] text-slate-600 uppercase tracking-wider">DIST</p>
                          </div>
                        </div>
                      </div>

                      {/* Mini route map */}
                      <div className="px-4 pb-4">
                        <MiniRouteMap type={record.type} seed={idx}/>
                      </div>
                    </div>
                  ))}

                  {/* Clear all */}
                  <button
                    onClick={() => { if (confirm('Hapus semua riwayat evakuasi?')) { setEvacuationHistory([]); localStorage.removeItem('evacuationHistory') } }}
                    className="w-full py-3 border border-red-900/40 text-red-500/60 rounded-xl text-xs font-bold hover:bg-red-900/20 transition-colors flex items-center justify-center gap-2">
                    <Trash2 className="w-3.5 h-3.5"/> Hapus Semua Riwayat
                  </button>
                  <div className="h-4"/>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* SETTINGS PAGE — "SYSTEM CONFIGURATION"                   */}
      {/* ══════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {activePage === 'settings' && (
          <motion.div
            initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }} transition={{ duration: 0.22 }}
            className="fixed inset-0 z-[1800] flex flex-col" style={{ background: '#080e1a' }}
          >
            {/* AEGIS top bar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/60 shrink-0" style={{ background: '#0a1020' }}>
              <button onClick={() => setActivePage('map')} className="p-2 text-slate-500 hover:text-white transition-colors">
                <Menu className="w-5 h-5"/>
              </button>
              <span className="text-sm font-black text-white tracking-widest">AEGIS RESPONSE</span>
              <div className="w-9 h-9 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                <Shield className="w-4 h-4 text-indigo-400"/>
              </div>
            </div>

            {/* Title */}
            <div className="px-5 pt-5 pb-1 shrink-0">
              <h2 className="text-2xl font-black text-white tracking-tight leading-tight">SYSTEM<br/>CONFIGURATION</h2>
              <p className="text-[11px] text-slate-500 mt-1.5 font-mono">
                Operational Unit: {terminalId} | STATUS:{' '}
                <span className="text-emerald-400 font-bold">ONLINE</span>
              </p>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-6 space-y-4 pt-4">

              {/* ─── CORE PROCESSING ─── */}
              <section className="rounded-2xl border border-slate-800/50 p-4" style={{ background: '#0c1525' }}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-slate-700/50 flex items-center justify-center">
                    <Cpu className="w-3.5 h-3.5 text-slate-400"/>
                  </div>
                  <h3 className="text-[11px] font-black text-white uppercase tracking-widest">Core Processing</h3>
                </div>

                {/* Routing Algorithm */}
                <p className="text-[9px] text-slate-600 uppercase tracking-widest font-bold mb-2">Routing Algorithm</p>
                <div className="grid grid-cols-2 gap-2 mb-5">
                  {([
                    { id: 'dijkstra'  as const, label: 'DIJKSTRA',  sub: 'Shortest Path First' },
                    { id: 'haversine' as const, label: 'HAVERSINE', sub: 'Spherical Geometry'  },
                  ]).map(algo => (
                    <button key={algo.id} onClick={() => setSettings(s => ({ ...s, algorithm: algo.id }))}
                      className={`p-3 rounded-xl border text-left transition-all
                        ${settings.algorithm === algo.id
                          ? 'bg-indigo-600/30 border-indigo-500/60 text-white'
                          : 'bg-slate-800/40 border-slate-700/40 text-slate-500 hover:border-slate-600'}`}>
                      <p className="text-xs font-black tracking-wide">{algo.label}</p>
                      <p className="text-[10px] mt-0.5 opacity-60">{algo.sub}</p>
                    </button>
                  ))}
                </div>

                {/* Sensor Sensitivity */}
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[9px] text-slate-600 uppercase tracking-widest font-bold">Sensor Sensitivity</p>
                  <p className="text-xs font-black text-white">{settings.sensorSensitivity}%</p>
                </div>
                <input type="range" min="0" max="100" value={settings.sensorSensitivity}
                  onChange={e => setSettings(s => ({ ...s, sensorSensitivity: +e.target.value }))}
                  className="w-full accent-indigo-500 mb-1.5"/>
                <div className="flex justify-between text-[9px] text-slate-600 font-bold uppercase tracking-wider">
                  <span>Low Precision</span><span>Tactical Grid</span><span>High Fidelity</span>
                </div>
              </section>

              {/* ─── DEVICE IDENTITY ─── */}
              <section className="rounded-2xl border border-slate-800/50 p-4" style={{ background: '#0c1525' }}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-slate-700/50 flex items-center justify-center">
                    <Lock className="w-3.5 h-3.5 text-slate-400"/>
                  </div>
                  <h3 className="text-[11px] font-black text-white uppercase tracking-widest">Device Identity</h3>
                </div>

                <div className="rounded-xl p-4 mb-3 border border-slate-700/30" style={{ background: '#070d1a' }}>
                  <p className="text-[9px] text-slate-600 uppercase tracking-widest font-bold mb-2">Terminal ID</p>
                  <p className="text-2xl font-black text-white font-mono tracking-widest">{terminalId}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"/>
                    <span className="text-[11px] text-emerald-400 font-bold">Encrypted Link Active</span>
                  </div>
                </div>

                <button className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black tracking-widest flex items-center justify-center gap-2 transition-colors">
                  <RefreshCw className="w-3.5 h-3.5"/> UPDATE CREDENTIALS
                </button>
              </section>

              {/* ─── ALERT PROTOCOLS ─── */}
              <section className="rounded-2xl border border-slate-800/50 p-4" style={{ background: '#0c1525' }}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-red-500/20 flex items-center justify-center">
                    <Bell className="w-3.5 h-3.5 text-red-400"/>
                  </div>
                  <h3 className="text-[11px] font-black text-white uppercase tracking-widest">Alert Protocols</h3>
                </div>

                {([
                  { key: 'pushAlerts'      as const, label: 'Push Alerts',        sub: 'Real-time threat notifications',    Icon: Bell     },
                  { key: 'soundAlert'      as const, label: 'Emergency Sound',    sub: 'Bypass silent mode for hazards',    Icon: Volume2  },
                  { key: 'vibrationAlert'  as const, label: 'Tactile Vibration',  sub: 'Haptic feedback for proximity',     Icon: Vibrate  },
                ]).map((item, idx, arr) => (
                  <div key={item.key}>
                    <div className="flex items-center justify-between py-2.5">
                      <div className="flex items-center gap-3">
                        <item.Icon className="w-4 h-4 text-slate-500"/>
                        <div>
                          <p className="text-sm text-slate-200 font-semibold">{item.label}</p>
                          <p className="text-[10px] text-slate-600">{item.sub}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSettings(s => ({ ...s, [item.key]: !s[item.key] }))
                          if (item.key === 'soundAlert') setAlarmMuted(prev => !prev)
                        }}
                        className={`relative w-12 h-6 rounded-full transition-colors ${settings[item.key] ? 'bg-indigo-600' : 'bg-slate-700'}`}>
                        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${settings[item.key] ? 'left-6' : 'left-0.5'}`}/>
                      </button>
                    </div>
                    {idx < arr.length - 1 && <div className="h-px bg-slate-800/60"/>}
                  </div>
                ))}
              </section>

              {/* ─── VISUAL INTERFACE ─── */}
              <section className="rounded-2xl border border-slate-800/50 p-4" style={{ background: '#0c1525' }}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-slate-700/50 flex items-center justify-center">
                    <MapIcon className="w-3.5 h-3.5 text-slate-400"/>
                  </div>
                  <h3 className="text-[11px] font-black text-white uppercase tracking-widest">Visual Interface</h3>
                </div>

                {/* Cartography Theme */}
                <p className="text-[9px] text-slate-600 uppercase tracking-widest font-bold mb-2">Cartography Theme</p>
                <div className="grid grid-cols-3 gap-2 mb-5">
                  {([
                    { id: 'standard'      as const, label: 'Standard',      bg: '#1a3358', Icon: MapIcon    },
                    { id: 'tactical-dark' as const, label: 'Tactical Dark', bg: '#070d1a', Icon: MapIcon    },
                    { id: 'satellite-hud' as const, label: 'Satellite HUD', bg: '#0d1a0d', Icon: Satellite  },
                  ]).map(theme => (
                    <button key={theme.id} onClick={() => setSettings(s => ({ ...s, cartographyTheme: theme.id }))}
                      className={`rounded-xl overflow-hidden border-2 transition-all
                        ${settings.cartographyTheme === theme.id ? 'border-indigo-500' : 'border-slate-700/40 hover:border-slate-600'}`}>
                      <div className="h-12 flex items-center justify-center" style={{ background: theme.bg }}>
                        <theme.Icon className={`w-5 h-5 ${
                          theme.id === 'satellite-hud' ? 'text-emerald-400'
                          : theme.id === 'tactical-dark' ? 'text-slate-300'
                          : 'text-blue-400'
                        }`}/>
                      </div>
                      <div className="py-1.5 text-center" style={{ background: '#0a0f1a' }}>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wide leading-tight px-1">{theme.label}</p>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Safe Zone Radius */}
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[9px] text-slate-600 uppercase tracking-widest font-bold">Safe Zone Radius</p>
                  <p className="text-xs font-black text-indigo-300">{settings.safeZoneRadius.toFixed(1)} KM</p>
                </div>
                <input type="range" min="0.5" max="10" step="0.5" value={settings.safeZoneRadius}
                  onChange={e => setSettings(s => ({ ...s, safeZoneRadius: +e.target.value }))}
                  className="w-full accent-indigo-500 mb-2"/>
                <p className="text-[10px] text-slate-600 leading-relaxed">
                  Defines the proximity alert threshold for designated evacuation shelters and secure perimeter points.
                </p>

                <div className="mt-4 pt-4 border-t border-slate-800/60 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className={`w-4 h-4 ${settings.showHazardZones ? 'text-red-400' : 'text-slate-600'}`}/>
                    <div>
                      <p className="text-sm text-slate-200 font-semibold">Tampilkan Zona Bahaya</p>
                      <p className="text-[10px] text-slate-600">Overlay area berisiko tinggi pada peta</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSettings(s => ({ ...s, showHazardZones: !s.showHazardZones }))}
                    className={`relative w-12 h-6 rounded-full transition-colors ${settings.showHazardZones ? 'bg-indigo-600' : 'bg-slate-700'}`}>
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${settings.showHazardZones ? 'left-6' : 'left-0.5'}`}/>
                  </button>
                </div>
              </section>

              {/* Info Sistem */}
              <section className="rounded-2xl border border-slate-800/50 p-4" style={{ background: '#0c1525' }}>
                <div className="flex items-center gap-2 mb-3">
                  <Info className="w-4 h-4 text-slate-500"/>
                  <h3 className="text-[11px] font-black text-white uppercase tracking-widest">Info Sistem</h3>
                </div>
                <div className="space-y-2">
                  {[
                    ['Versi Aplikasi', 'v1.0.0 (Skripsi)'],
                    ['Platform', 'React 18 + Vite'],
                    ['Routing Engine', 'Leaflet + OSM'],
                    ['Jarak Hitung', 'Haversine Formula'],
                    ['Algoritma Aktif', settings.algorithm === 'haversine' ? 'Haversine' : 'Dijkstra'],
                    ['Terminal ID', terminalId],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between items-center py-1">
                      <span className="text-xs text-slate-500">{label}</span>
                      <span className="text-xs text-slate-300 font-mono bg-slate-800/60 px-2 py-0.5 rounded">{value}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Reset */}
              <button
                onClick={() => { if (confirm('Reset semua pengaturan ke default?')) setSettings(DEFAULT_SETTINGS) }}
                className="w-full py-3 border border-slate-700/40 text-slate-500 rounded-xl text-xs font-bold hover:bg-slate-800/30 transition-colors flex items-center justify-center gap-2">
                <RefreshCw className="w-3.5 h-3.5"/> Reset to Default
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}

export default App
