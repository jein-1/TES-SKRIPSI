import { useState, useCallback, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, Polygon, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { shelters, hazardZones, findOptimalEvacuationRoutes, type RouteResult } from './lib/evacuation'
import { AlertTriangle, Shield, MapPin, Info, ChevronRight, X, Locate, Volume2, VolumeX, Menu, Radio, Satellite, Map as MapIcon, Settings, HelpCircle, Cpu, Plus, Minus, Crosshair, ArrowRight, History, Bell, Vibrate, SlidersHorizontal, RotateCcw, Trash2, CheckCircle, Navigation2 } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════
type ActivePage = 'map' | 'history' | 'settings'

interface EvacuationRecord {
  id: string
  timestamp: Date
  type: 'simulation' | 'real'
  routeName: string
  distance: number | null
  walkingTime: number | null
  algorithm: string
  userLat: number
  userLng: number
}

interface AppSettings {
  algorithm: 'dijkstra' | 'astar' | 'bfs'
  sensorSensitivity: 'low' | 'medium' | 'high'
  soundAlert: boolean
  vibrationAlert: boolean
  mapStyle: 'normal' | 'dark' | 'satellite'
  safeZoneRadius: number // km
  autoStartGPS: boolean
  showHazardZones: boolean
}

// Fix default Leaflet marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

const shelterIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: 'shelter-marker',
})

const userIcon = new L.DivIcon({
  html: `<div style="
    width: 20px; height: 20px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    border: 3px solid white;
    border-radius: 50%;
    box-shadow: 0 0 12px rgba(99,102,241,0.7), 0 0 24px rgba(99,102,241,0.3);
    animation: userPulse 2s infinite;
  "></div>
  <style>
    @keyframes userPulse {
      0%, 100% { box-shadow: 0 0 12px rgba(99,102,241,0.7); }
      50% { box-shadow: 0 0 24px rgba(99,102,241,1), 0 0 48px rgba(99,102,241,0.5); }
    }
  </style>`,
  className: '',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
})

const userIconAlert = new L.DivIcon({
  html: `<div style="
    width: 36px; height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    filter: drop-shadow(0 0 8px rgba(239, 68, 68, 0.8));
    animation: navPulse 1s infinite;
  ">
    <svg viewBox="0 0 24 24" width="32" height="32" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L22 21L12 17L2 21L12 2Z" fill="white" stroke="white" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M12 4L19.5 19.5L12 16.5L4.5 19.5L12 4Z" fill="#ef4444" />
    </svg>
  </div>
  <style>
    @keyframes navPulse {
      0%, 100% { transform: scale(1) translateY(0); filter: drop-shadow(0 0 8px rgba(239, 68, 68, 0.6)); }
      50% { transform: scale(1.1) translateY(-2px); filter: drop-shadow(0 0 20px rgba(239, 68, 68, 1)); }
    }
  </style>`,
  className: '',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
})

// Map tile URLs
const TILE_NORMAL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const TILE_DARK = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'

// Tsunami alarm sound using Web Audio API
function createAlarmSound(): { start: () => void; stop: () => void } {
  let audioCtx: AudioContext | null = null
  let oscillator1: OscillatorNode | null = null
  let oscillator2: OscillatorNode | null = null
  let gainNode: GainNode | null = null
  let lfoNode: OscillatorNode | null = null
  let lfoGain: GainNode | null = null

  return {
    start() {
      if (audioCtx) return
      audioCtx = new AudioContext()
      gainNode = audioCtx.createGain()
      gainNode.gain.value = 0.3
      gainNode.connect(audioCtx.destination)

      // Siren oscillator - sweeping between two frequencies
      oscillator1 = audioCtx.createOscillator()
      oscillator1.type = 'sawtooth'
      oscillator1.frequency.value = 440

      // LFO to modulate siren frequency
      lfoNode = audioCtx.createOscillator()
      lfoNode.type = 'sine'
      lfoNode.frequency.value = 1.5 // sweep speed
      lfoGain = audioCtx.createGain()
      lfoGain.gain.value = 200 // frequency sweep range
      lfoNode.connect(lfoGain)
      lfoGain.connect(oscillator1.frequency)

      oscillator1.connect(gainNode)
      oscillator1.start()
      lfoNode.start()

      // Second oscillator for richer sound
      oscillator2 = audioCtx.createOscillator()
      oscillator2.type = 'sine'
      oscillator2.frequency.value = 660
      const gain2 = audioCtx.createGain()
      gain2.gain.value = 0.15
      oscillator2.connect(gain2)
      gain2.connect(audioCtx.destination)

      const lfo2 = audioCtx.createOscillator()
      lfo2.type = 'sine'
      lfo2.frequency.value = 1.5
      const lfoGain2 = audioCtx.createGain()
      lfoGain2.gain.value = 300
      lfo2.connect(lfoGain2)
      lfoGain2.connect(oscillator2.frequency)

      oscillator2.start()
      lfo2.start()
    },
    stop() {
      try {
        oscillator1?.stop()
        oscillator2?.stop()
        lfoNode?.stop()
        audioCtx?.close()
      } catch (_) { /* already stopped */ }
      audioCtx = null
      oscillator1 = null
      oscillator2 = null
      gainNode = null
      lfoNode = null
      lfoGain = null
    }
  }
}




// Component to handle map click events
function LocationMarker({ onLocationSet }: { onLocationSet: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onLocationSet(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

// Component to fly map to position
function MapFlyTo({ position, zoom }: { position: [number, number]; zoom?: number }) {
  const map = useMap()
  useEffect(() => {
    map.flyTo(position, zoom || map.getZoom(), { duration: 1.5 })
  }, [position, zoom, map])
  return null
}

// Custom Map Controls (Zoom in, Zoom out, Locate My Position)
function CustomMapControls({ userPosition, onLocateClick }: { userPosition: [number, number] | null, onLocateClick: () => void }) {
  const map = useMap()
  return (
    <div className="absolute left-3 md:left-6 top-[140px] md:top-[180px] z-[1000] flex flex-col gap-2 pointer-events-auto">
       <button onClick={() => map.zoomIn()} title="Zoom In" className="w-9 h-9 bg-[#1e293b]/90 backdrop-blur-md hover:bg-slate-700 rounded-xl flex items-center justify-center text-slate-300 shadow-[0_4px_20px_rgba(0,0,0,0.5)] border border-slate-700 transition-colors">
          <Plus className="w-5 h-5" />
       </button>
       <button onClick={() => map.zoomOut()} title="Zoom Out" className="w-9 h-9 bg-[#1e293b]/90 backdrop-blur-md hover:bg-slate-700 rounded-xl flex items-center justify-center text-slate-300 shadow-[0_4px_20px_rgba(0,0,0,0.5)] border border-slate-700 transition-colors">
          <Minus className="w-5 h-5" />
       </button>
       <button onClick={() => {
          onLocateClick()
          if (userPosition) map.flyTo(userPosition, 14, { duration: 1.5 })
       }} title="Lokasi Saat Ini" className="w-9 h-9 mt-2 bg-[#1e293b]/90 backdrop-blur-md hover:bg-slate-700 rounded-xl flex items-center justify-center text-slate-300 shadow-[0_4px_20px_rgba(0,0,0,0.5)] border border-slate-700 transition-colors">
          <Crosshair className="w-5 h-5" />
       </button>
    </div>
  )
}

function App() {
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null)
  const [routes, setRoutes] = useState<RouteResult[]>([])
  const [selectedRoute, setSelectedRoute] = useState<number>(0)
  const [showPanel, setShowPanel] = useState(false)
  const [isCalculating, setIsCalculating] = useState(false)

  // GPS & Tsunami states
  const [gpsTracking, setGpsTracking] = useState(false)
  const [gpsError, setGpsError] = useState<string | null>(null)
  const [tsunamiAlert, setTsunamiAlert] = useState(false)
  const [alarmMuted, setAlarmMuted] = useState(false)
  const [showTsunamiConfirm, setShowTsunamiConfirm] = useState(false)
  const [showShelters, setShowShelters] = useState(false)
  const [showLeftSidebar, setShowLeftSidebar] = useState(true)
  const [flyToPos, setFlyToPos] = useState<[number, number] | null>(null)

  // PAGE NAVIGATION
  const [activePage, setActivePage] = useState<ActivePage>('map')

  // HISTORY
  const [evacuationHistory, setEvacuationHistory] = useState<EvacuationRecord[]>(() => {
    try {
      const stored = localStorage.getItem('evacuationHistory')
      if (stored) {
        const parsed = JSON.parse(stored)
        return parsed.map((r: any) => ({ ...r, timestamp: new Date(r.timestamp) }))
      }
    } catch (_) {}
    return []
  })

  // SETTINGS
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const stored = localStorage.getItem('appSettings')
      if (stored) return JSON.parse(stored)
    } catch (_) {}
    return {
      algorithm: 'dijkstra',
      sensorSensitivity: 'high',
      soundAlert: true,
      vibrationAlert: true,
      mapStyle: 'normal',
      safeZoneRadius: 2,
      autoStartGPS: true,
      showHazardZones: true,
    } as AppSettings
  })

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false)

  const alarmRef = useRef(createAlarmSound())
  const gpsWatchRef = useRef<number | null>(null)
  const gpsAutoStartedRef = useRef(false)

  // Persist settings
  useEffect(() => {
    localStorage.setItem('appSettings', JSON.stringify(settings))
  }, [settings])

  // Persist history
  useEffect(() => {
    localStorage.setItem('evacuationHistory', JSON.stringify(evacuationHistory))
  }, [evacuationHistory])

  // Helper to save a history record
  const saveHistoryRecord = useCallback((routeResults: RouteResult[], type: 'simulation' | 'real', pos: [number, number]) => {
    if (routeResults.length === 0) return
    const best = routeResults[0]
    const record: EvacuationRecord = {
      id: Date.now().toString(),
      timestamp: new Date(),
      type,
      routeName: best.shelterName,
      distance: best.totalDistance === Infinity ? null : best.totalDistance,
      walkingTime: best.totalDistance === Infinity ? null : best.walkingTime,
      algorithm: settings.algorithm.toUpperCase(),
      userLat: pos[0],
      userLng: pos[1],
    }
    setEvacuationHistory(prev => [record, ...prev].slice(0, 50)) // keep last 50
  }, [settings.algorithm])

  // Detect mobile screen
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Handle GPS real-time tracking
  const startGpsTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsError('GPS tidak didukung di browser ini')
      return
    }

    setGpsTracking(true)
    setGpsError(null)
    setIsCalculating(true) // Show calculating immediately

    // Watch for position changes (handles both initial and updates)
    gpsWatchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const newPos: [number, number] = [pos.coords.latitude, pos.coords.longitude]
        setUserPosition(newPos)
        setFlyToPos(newPos) // Follow user smoothly

        // Recalculate routes on position update
        const routeResults = findOptimalEvacuationRoutes(newPos[0], newPos[1])
        setRoutes(routeResults)
        setSelectedRoute(0)
        setShowPanel(true)
        setIsCalculating(false)
        saveHistoryRecord(routeResults, tsunamiAlert ? 'simulation' : 'real', newPos)
      },
      (err) => {
        setIsCalculating(false)
        setGpsError(err.code === 1 ? 'Izin lokasi ditolak. Aktifkan GPS di pengaturan browser.' : 'Sinyal GPS lemah atau timeout')
        setGpsTracking(false)
        if (gpsWatchRef.current !== null) {
          navigator.geolocation.clearWatch(gpsWatchRef.current)
          gpsWatchRef.current = null
        }
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 5000 }
    )
  }, [])

  const stopGpsTracking = useCallback(() => {
    if (gpsWatchRef.current !== null) {
      navigator.geolocation.clearWatch(gpsWatchRef.current)
      gpsWatchRef.current = null
    }
    setGpsTracking(false)
  }, [])

  // Auto-start GPS on mobile devices
  useEffect(() => {
    if (isMobile && !gpsAutoStartedRef.current) {
      gpsAutoStartedRef.current = true
      // Small delay to ensure page is fully loaded before requesting permission
      const timer = setTimeout(() => {
        startGpsTracking()
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [isMobile, startGpsTracking])

  // Handle tsunami alert activation
  const activateTsunamiAlert = useCallback(() => {
    setTsunamiAlert(true)
    setShowTsunamiConfirm(false)
    
    // Start alarm sound
    if (!alarmMuted) {
      alarmRef.current.start()
    }

    // Paksa menggunakan lokasi Real-Time GPS saat tsunami terjadi!
    startGpsTracking()
  }, [alarmMuted, startGpsTracking])

  const deactivateTsunamiAlert = useCallback(() => {
    setTsunamiAlert(false)
    alarmRef.current.stop()
  }, [])

  // Mute/unmute alarm
  useEffect(() => {
    if (tsunamiAlert) {
      if (alarmMuted) {
        alarmRef.current.stop()
      } else {
        alarmRef.current.start()
      }
    }
  }, [alarmMuted, tsunamiAlert])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      alarmRef.current.stop()
      if (gpsWatchRef.current !== null) {
        navigator.geolocation.clearWatch(gpsWatchRef.current)
      }
    }
  }, [])

  // Handle map click for location
  const handleLocationSet = useCallback((lat: number, lng: number) => {
    if (gpsTracking) return // Ignore clicks when GPS is active
    setUserPosition([lat, lng])
    setIsCalculating(true)

    setTimeout(() => {
      const routeResults = findOptimalEvacuationRoutes(lat, lng)
      setRoutes(routeResults)
      setSelectedRoute(0)
      setShowPanel(true)
      setIsCalculating(false)
      saveHistoryRecord(routeResults, 'real', [lat, lng])
    }, 300)
  }, [gpsTracking, saveHistoryRecord])

  const routeColors = tsunamiAlert
    ? ['#ef4444', '#f59e0b', '#22c55e']
    : ['#6366f1', '#f59e0b', '#10b981']

  const routeBadgeColors = ['bg-indigo-500', 'bg-amber-500', 'bg-emerald-500']

  return (
    <div className="w-full h-screen bg-[#0b1120] text-slate-300 font-sans overflow-hidden flex flex-col">

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* MOBILE HEADER                                                      */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <header className={`md:hidden shrink-0 px-4 py-3 z-50 relative rounded-b-2xl transition-colors duration-500 ${tsunamiAlert ? 'bg-red-950/95 border-b border-red-900/50' : 'bg-[#0f172a]/95 border-b border-slate-800/50'} backdrop-blur-md`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tsunamiAlert ? 'bg-red-500/20' : 'bg-indigo-500/20'}`}>
              <Shield className={`w-5 h-5 ${tsunamiAlert ? 'text-red-400' : 'text-indigo-400'}`} />
            </div>
            <div>
              <h1 className="text-white font-black text-base tracking-tight leading-tight">TES SKRIPSI</h1>
              <p className="text-[10px] text-slate-500 font-medium">Sistem Evakuasi Kota Palu</p>
            </div>
          </div>
          <button 
            onClick={() => tsunamiAlert ? deactivateTsunamiAlert() : setShowTsunamiConfirm(true)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${tsunamiAlert ? 'bg-red-500/30 text-red-200 border border-red-500/50' : 'bg-red-600 hover:bg-red-500 text-white'}`}
          >
            <div className={`w-2 h-2 rounded-full shrink-0 ${tsunamiAlert ? 'bg-red-400 animate-pulse' : 'bg-red-300'}`} />
            <span className="leading-tight text-center">SIMULASI<br/>TSUNAMI</span>
          </button>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* DESKTOP HEADER                                                     */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <header className={`hidden md:flex h-[60px] shrink-0 border-b items-center justify-between px-6 z-50 relative transition-colors duration-500 ${tsunamiAlert ? 'bg-red-950 border-red-900/50' : 'bg-[#0f172a] border-slate-800'}`}>
        <div className="flex items-center gap-3 w-[200px]">
          <button onClick={() => setShowLeftSidebar(!showLeftSidebar)} className="p-1 hover:bg-slate-800 rounded-md text-slate-400 hover:text-white transition-colors">
            <Menu className="w-5 h-5" />
          </button>
          <Shield className={`w-6 h-6 ${tsunamiAlert ? 'text-red-500' : 'text-indigo-500'}`} />
          <h1 className="text-white font-black text-xl tracking-tighter">TES SKRIPSI</h1>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-3 mr-2">
             {/* Sensor/Radio Indicator */}
             <div className="flex items-center gap-2 group" title="Konektivitas Sensor Tsunami (System Active)">
                <div className={`p-1.5 rounded-md transition-colors ${tsunamiAlert ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                   <Radio className={`w-4 h-4 ${tsunamiAlert ? 'animate-pulse' : ''}`} />
                </div>
                <div className="flex flex-col hidden lg:flex">
                   <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider leading-none mb-0.5">Sensor</span>
                   <span className={`text-[10px] font-bold uppercase tracking-widest leading-none ${tsunamiAlert ? 'text-red-400' : 'text-emerald-400'}`}>Active</span>
                </div>
             </div>

             <div className="w-px h-6 bg-slate-800 mx-1"></div>

             {/* GPS/Satellite Indicator */}
             <div className="flex items-center gap-2 group" title="Satelit GPS">
                <div className={`p-1.5 rounded-md transition-colors ${gpsTracking ? 'bg-indigo-500/20 text-indigo-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                   <Satellite className={`w-4 h-4 ${gpsTracking ? 'animate-pulse' : ''}`} />
                </div>
                <div className="flex flex-col hidden lg:flex">
                   <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider leading-none mb-0.5">Sat-Link</span>
                   <span className={`text-[10px] font-bold uppercase tracking-widest leading-none ${gpsTracking ? 'text-indigo-400' : 'text-emerald-400'}`}>
                     {gpsTracking ? 'Tracking' : 'Linked'}
                   </span>
                </div>
             </div>
          </div>
          <button 
            onClick={() => {
              if (tsunamiAlert) {
                deactivateTsunamiAlert()
              } else {
                setShowTsunamiConfirm(true)
              }
            }}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg font-bold text-sm transition-all ${tsunamiAlert ? 'bg-red-500/20 text-red-200 border border-red-500/50' : 'bg-red-600 hover:bg-red-500 text-white border border-transparent'}`}>
             <AlertTriangle className={`w-4 h-4 ${tsunamiAlert ? 'animate-pulse text-red-400' : ''}`} />
             {tsunamiAlert ? 'HENTIKAN SIMULASI' : 'SIMULASI TSUNAMI'}
          </button>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* MAIN CONTENT AREA                                                  */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Tsunami Alert Flashing Overlay */}
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
                  <button onClick={() => setActivePage('map')} className={`w-full flex items-center gap-3 px-6 py-3 transition-colors ${ activePage === 'map' ? 'bg-[#1e293b]/50 border-r-2 border-indigo-500 text-indigo-300' : 'text-slate-500 hover:text-slate-300' }`}>
                    <MapIcon className="w-5 h-5" />
                    <span className="font-semibold text-sm tracking-wide">MAP</span>
                  </button>
                  <button onClick={() => setActivePage('history')} className={`w-full flex items-center gap-3 px-6 py-3 transition-colors relative ${ activePage === 'history' ? 'bg-[#1e293b]/50 border-r-2 border-indigo-500 text-indigo-300' : 'text-slate-500 hover:text-slate-300' }`}>
                    <History className="w-5 h-5" />
                    <span className="font-semibold text-sm tracking-wide">HISTORY</span>
                    {evacuationHistory.length > 0 && <span className="ml-auto mr-1 text-[9px] bg-indigo-500 text-white rounded-full px-1.5 py-0.5 font-bold">{evacuationHistory.length}</span>}
                  </button>
                  <button onClick={() => setActivePage('settings')} className={`w-full flex items-center gap-3 px-6 py-3 transition-colors ${ activePage === 'settings' ? 'bg-[#1e293b]/50 border-r-2 border-indigo-500 text-indigo-300' : 'text-slate-500 hover:text-slate-300' }`}>
                    <Settings className="w-5 h-5" />
                    <span className="font-semibold text-sm tracking-wide">SETTINGS</span>
                  </button>
                </nav>
                <div className="p-6 mt-auto">
                  <button
                     onClick={() => setShowShelters(true)}
                     className="flex items-center gap-3 text-slate-500 hover:text-indigo-400 transition-colors"
                  >
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
          
          {/* ═══ MOBILE GPS STATUS BADGES ═══ */}
          <div className="md:hidden absolute top-3 left-0 right-0 flex justify-center gap-2 z-[1000]">
            <button 
              onClick={() => gpsTracking ? stopGpsTracking() : startGpsTracking()}
              className={`px-3 py-1.5 rounded-full flex items-center gap-2 border shadow-lg transition-colors text-xs font-bold tracking-wide ${gpsTracking ? 'bg-green-900/80 border-green-500/50 text-green-300' : 'bg-slate-900/80 border-slate-700 text-slate-400'}`}
            >
              <div className={`w-2 h-2 rounded-full ${gpsTracking ? 'bg-green-400 animate-pulse' : 'bg-slate-500'}`} />
              {gpsTracking ? 'GPS AKTIF' : 'ACTIVATE GPS'}
            </button>
            {gpsTracking && (
              <div className="px-3 py-1.5 rounded-full bg-indigo-900/60 border border-indigo-500/30 flex items-center gap-2 text-xs font-bold tracking-wide text-indigo-300 shadow-lg">
                <Locate className="w-3.5 h-3.5" /> TRACKING
              </div>
            )}
          </div>

          {/* ═══ DESKTOP GPS CONTROLS ═══ */}
          <div className="hidden md:flex absolute top-4 left-4 gap-2 z-[1000]">
            <button 
              onClick={() => gpsTracking ? stopGpsTracking() : startGpsTracking()}
              className={`px-3 py-1.5 rounded-full flex items-center gap-2 border shadow-lg transition-colors text-xs font-bold tracking-wide ${gpsTracking ? 'bg-green-900/60 border-green-500/50 text-green-300' : 'bg-slate-900/80 border-slate-700 hover:bg-slate-800 text-slate-400'}`}>
              <div className={`w-2 h-2 rounded-full ${gpsTracking ? 'bg-green-400 animate-pulse' : 'bg-slate-500'}`} />
              {gpsTracking ? 'GPS AKTIF' : 'ACTIVATE GPS'}
            </button>
            {gpsTracking && (
              <div className="px-3 py-1.5 rounded-full bg-indigo-900/40 border border-indigo-500/30 flex items-center gap-2 text-xs font-bold tracking-wide text-indigo-300">
                <Locate className="w-3.5 h-3.5" /> TRACKING
              </div>
            )}
          </div>

          <MapContainer
            center={[-0.8917, 119.8577]}
            zoom={14}
            className="w-full h-full"
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors & CARTO'
              url={tsunamiAlert ? TILE_DARK : TILE_NORMAL}
              key={tsunamiAlert ? 'dark' : 'normal'}
            />
            
            <CustomMapControls userPosition={userPosition} onLocateClick={() => {
               if (!gpsTracking) {
                  startGpsTracking()
               }
            }} />

            <LocationMarker onLocationSet={handleLocationSet} />
            {flyToPos && <MapFlyTo position={flyToPos} zoom={15} />}

            {/* Hazard zones */}
            {hazardZones.map((zone, i) => (
              <Polygon
                key={i}
                positions={zone.coords}
                pathOptions={{
                  color: tsunamiAlert ? '#ff0000' : '#ef4444',
                  fillColor: tsunamiAlert ? '#ff0000' : '#ef4444',
                  fillOpacity: tsunamiAlert ? 0.35 : 0.15,
                  weight: tsunamiAlert ? 3 : 1
                }}
              />
            ))}

            {/* Shelters */}
            {shelters.map((shelter) => (
              <Marker 
                key={shelter.id} 
                position={[shelter.lat, shelter.lng]}
                icon={shelterIcon}
              >
                <Popup className="shelter-popup">
                  <div className="font-bold text-slate-800">{shelter.name}</div>
                  <div className="text-sm text-slate-600">Kapasitas: {shelter.capacity} orang</div>
                  {!isCalculating && !tsunamiAlert && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        if (userPosition) {
                          setIsCalculating(true)
                          setTimeout(() => {
                            const routeResults = findOptimalEvacuationRoutes(userPosition[0], userPosition[1])
                            setRoutes(routeResults)
                            setSelectedRoute(0)
                            setShowPanel(true)
                            setIsCalculating(false)
                          }, 300)
                        } else {
                          alert('Klik peta terlebih dahulu untuk menentukan lokasi Anda!')
                        }
                      }}
                      className="mt-2 w-full px-3 py-1 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-700"
                    >
                      Evakuasi ke Sini
                    </button>
                  )}
                </Popup>
              </Marker>
            ))}

            {/* User Position */}
            {userPosition && (
              <Marker 
                position={userPosition} 
                icon={tsunamiAlert ? userIconAlert : userIcon}
                zIndexOffset={1000}
              >
                <Popup>
                  <strong>{gpsTracking ? 'Lokasi GPS Anda' : 'Lokasi Terpilih'}</strong>
                </Popup>
              </Marker>
            )}

            {/* Evacuation Routes */}
            {routes.map((route, i) => (
              <Polyline
                key={i}
                positions={route.coordinates}
                pathOptions={{
                  color: routeColors[i],
                  weight: i === selectedRoute ? 6 : 3,
                  opacity: i === selectedRoute ? 0.9 : 0.4,
                  dashArray: i === selectedRoute ? undefined : '10 6',
                }}
              />
            ))}
          </MapContainer>

          {/* ════════════════════════════════════════════════════════════════ */}
          {/* MOBILE BOTTOM SHEET PANEL                                       */}
          {/* ════════════════════════════════════════════════════════════════ */}
          <AnimatePresence>
            {showPanel && routes.length > 0 && isMobile && (
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="absolute bottom-0 left-0 right-0 z-[500] max-h-[65vh] flex flex-col bg-[#0f172a]/95 backdrop-blur-xl rounded-t-2xl border-t border-slate-700/50 shadow-[0_-10px_40px_rgba(0,0,0,0.6)]"
              >
                {/* Sheet Handle */}
                <div className="flex justify-center pt-2 pb-1">
                  <div className="w-10 h-1 rounded-full bg-slate-600" />
                </div>

                {/* Sheet Header */}
                <div className="px-4 pb-3 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                      <ArrowRight className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-white leading-tight">Rute Evakuasi</h2>
                      <p className="text-[11px] text-slate-400">
                        {routes.length} rute ditemukan • <span className="text-indigo-400 italic">Algoritma Dijkstra</span>
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setShowPanel(false)} className="p-1.5 text-slate-500 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Scrollable Route Cards */}
                <div className="flex-1 overflow-y-auto px-4 pb-2 space-y-2.5 custom-scrollbar">
                  {routes.map((route, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setSelectedRoute(i)
                        if (route.coordinates.length > 0) {
                          const endPoint = route.coordinates[route.coordinates.length - 1]
                          setFlyToPos([endPoint[0], endPoint[1]])
                        }
                      }}
                      className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-center gap-3 ${
                        selectedRoute === i
                          ? 'bg-[#1e293b]/80 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.1)]'
                          : 'bg-[#1e293b]/30 border-slate-800 active:bg-[#1e293b]/60'
                      }`}
                    >
                      {/* Number Badge */}
                      <div className={`w-10 h-10 rounded-xl ${routeBadgeColors[i] || 'bg-slate-600'} flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-md`}>
                        {i + 1}
                      </div>

                      {/* Route Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-white leading-snug truncate">
                          {route.shelterName}
                        </h3>
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

                      {/* Chevron */}
                      <ChevronRight className={`w-5 h-5 shrink-0 ${selectedRoute === i ? 'text-indigo-400' : 'text-slate-600'}`} />
                    </button>
                  ))}

                  {/* Algorithm Info Box */}
                  <div className="p-3.5 bg-indigo-950/40 border border-indigo-500/20 rounded-xl flex gap-3">
                    <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Rute dihitung menggunakan <span className="text-indigo-300 italic">Algoritma Dijkstra</span> berdasarkan jaringan jalan dan jarak <span className="text-indigo-300 italic">Haversine</span>. 
                      Estimasi waktu berdasarkan kecepatan berjalan rata-rata 5 km/jam. Lokasi diperbarui secara real-time via GPS.
                    </p>
                  </div>

                  {/* Close Panel Button */}
                  <button
                    onClick={() => setShowPanel(false)}
                    className="w-full py-3 bg-[#1e293b] hover:bg-slate-700 border border-slate-700 text-white rounded-xl text-sm font-bold tracking-wide transition-colors"
                  >
                    TUTUP PANEL
                  </button>

                  {/* Bottom spacing */}
                  <div className="h-2" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* ═══ DESKTOP RIGHT SIDEBAR (Route Panel) ═══ */}
        <AnimatePresence>
          {showPanel && routes.length > 0 && !isMobile && (
            <motion.aside
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full md:w-[320px] h-full absolute md:relative right-0 bg-[#0f172a] border-l border-slate-800 flex flex-col z-50 shrink-0 shadow-[-10px_0_30px_rgba(0,0,0,0.5)]"
            >
              
              {/* Header */}
              <div className="p-4 pb-3">
                <div className="flex justify-between items-start mb-1">
                  <h2 className="text-lg font-bold text-white tracking-tight">Rute Evakuasi</h2>
                  <button onClick={() => setShowPanel(false)} className="text-slate-500 hover:text-white">
                     <X className="w-5 h-5"/>
                  </button>
                </div>
                <p className="text-[10px] text-indigo-400 font-bold tracking-widest uppercase">
                  NEAREST SAFE ZONES
                </p>
              </div>

              {/* Rute List (Scrollable Area) */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 pt-0 flex flex-col gap-3">
                {routes.map((route, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setSelectedRoute(i)
                      if (route.coordinates.length > 0) {
                        const endPoint = route.coordinates[route.coordinates.length - 1]
                        setFlyToPos([endPoint[0], endPoint[1]])
                      }
                    }}
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-300 relative group ${
                      selectedRoute === i
                        ? 'bg-[#1e293b]/80 border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.15)]'
                        : 'bg-[#1e293b]/30 border-slate-800 hover:bg-[#1e293b]/50 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className={`text-[10px] font-bold tracking-wider px-2 py-1 rounded ${selectedRoute === i ? (i===0 ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-700/50 text-slate-300') : 'text-slate-500'}`}>
                        {i === 0 ? 'FASTEST' : 'ALTERNATIVE'}
                      </span>
                      <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400">
                        {i + 1}
                      </div>
                    </div>
                    
                    <h3 className="text-sm font-semibold text-white mb-3">
                      {route.shelterName}
                    </h3>
                    
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {route.totalDistance === Infinity ? 'N/A' : `${route.totalDistance.toFixed(2)} km`}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {route.totalDistance === Infinity ? 'N/A' : `~${route.walkingTime} min`}
                      </span>
                    </div>

                    {selectedRoute === i && (
                      <div className="mt-4 pt-4 border-t border-slate-700/50">
                        <div className="w-full py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg flex items-center justify-center gap-2 text-xs font-bold transition-colors">
                          Go to Point <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Bottom Pathfinding Logic Info */}
              <div className="p-4 border-t border-slate-800 bg-[#0b1120]/50">
                <h4 className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-3 flex items-center gap-2">
                  <Cpu className="w-3.5 h-3.5" /> PATHFINDING LOGIC
                </h4>
                <div className="flex flex-col gap-2">
                   <div className="flex justify-between items-center text-xs">
                     <span className="text-slate-500">Distance Algo</span>
                     <span className="text-slate-300 font-mono bg-slate-800 px-2 py-0.5 rounded">Haversine</span>
                   </div>
                   <div className="flex justify-between items-center text-xs">
                     <span className="text-slate-500">Route Optimization</span>
                     <span className="text-slate-300 font-mono bg-slate-800 px-2 py-0.5 rounded">Dijkstra</span>
                   </div>
                </div>
                {!gpsTracking && (
                  <button 
                    onClick={() => {
                      setUserPosition(null)
                      setRoutes([])
                      setShowPanel(false)
                    }}
                    className="w-full mt-6 py-2.5 border border-slate-700 hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-bold transition-colors"
                  >
                    RESET POSITION
                  </button>
                )}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* MOBILE BOTTOM NAVIGATION BAR                                       */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <nav className={`md:hidden shrink-0 flex items-center justify-around py-3 border-t z-[600] transition-colors duration-500 ${tsunamiAlert ? 'bg-red-950/95 border-red-900/50' : 'bg-[#0f172a]/95 border-slate-800/50'} backdrop-blur-md`}>
        <button onClick={() => setActivePage('map')} className={`flex flex-col items-center gap-1 transition-colors ${ activePage === 'map' ? 'text-indigo-400' : 'text-slate-600 active:text-slate-400' }`}>
          <MapIcon className="w-5 h-5" />
          <span className="text-[9px] font-bold tracking-wider">MAP</span>
        </button>
        <button onClick={() => setActivePage('history')} className={`flex flex-col items-center gap-1 transition-colors relative ${ activePage === 'history' ? 'text-indigo-400' : 'text-slate-600 active:text-slate-400' }`}>
          <div className="relative">
            <History className="w-5 h-5" />
            {evacuationHistory.length > 0 && <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-indigo-500 rounded-full text-[8px] font-bold flex items-center justify-center text-white">{evacuationHistory.length > 9 ? '9+' : evacuationHistory.length}</span>}
          </div>
          <span className="text-[9px] font-bold tracking-wider">HISTORY</span>
        </button>
        <button onClick={() => setActivePage('settings')} className={`flex flex-col items-center gap-1 transition-colors ${ activePage === 'settings' ? 'text-indigo-400' : 'text-slate-600 active:text-slate-400' }`}>
          <Settings className="w-5 h-5" />
          <span className="text-[9px] font-bold tracking-wider">SETTINGS</span>
        </button>
      </nav>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* FULLSCREEN OVERLAY MODALS                                          */}
      {/* ═══════════════════════════════════════════════════════════════════ */}

      {/* Tsunami confirmation */}
      <AnimatePresence>
        {showTsunamiConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl max-w-sm w-full text-center"
            >
              <div className="w-16 h-16 bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/30">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Simulasi Tsunami?</h2>
              <p className="text-sm text-slate-400 mb-8">
                Sistem akan membunyikan sirine peringatan dini dan menyiagakan rute evakuasi darurat.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={activateTsunamiAlert}
                  className="w-full py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold transition-colors"
                >
                  MULAI SIMULASI
                </button>
                <button
                  onClick={() => setShowTsunamiConfirm(false)}
                  className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition-colors"
                >
                  BATALKAN
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Shelter List Modal */}
      <AnimatePresence>
        {showShelters && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0f172a] border border-slate-800 p-6 rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] flex flex-col pointer-events-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-indigo-500" />
                  Daftar Lokasi Shelter
                </h2>
                <button
                  onClick={() => setShowShelters(false)}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-slate-400 mb-4">
                Pilih lokasi di bawah ini untuk melihat letak titik evakuasi aman secara manual di atas peta.
              </p>
              
              <div className="overflow-y-auto pr-2 space-y-3 custom-scrollbar flex-1">
                {shelters.map((s, idx) => (
                  <div key={idx} className="p-4 bg-slate-800/30 border border-slate-700/50 rounded-xl hover:bg-slate-800/60 transition-colors flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                        <MapPin className="w-4 h-4 text-indigo-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-200 text-sm">{s.name}</h3>
                        <p className="text-xs text-slate-500">{s.lat.toFixed(5)}, {s.lng.toFixed(5)}</p>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => {
                        setFlyToPos([s.lat, s.lng])
                        setShowShelters(false)
                      }}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors"
                    >
                      LIHAT DI PETA
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* GPS Error message */}
      <AnimatePresence>
        {gpsError && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed ${isMobile ? 'top-20 left-4 right-4' : 'top-20 right-4'} z-[2000]`}
          >
            <div className="pl-4 pr-2 py-3 rounded-xl bg-amber-600 border border-amber-500 shadow-xl shadow-amber-900/30 flex items-center gap-3">
              <AlertTriangle className="w-4 h-4 text-white shrink-0" />
              <span className="text-xs text-white font-bold tracking-wide flex-1">{gpsError}</span>
              <button onClick={() => {
                setGpsError(null)
                // On mobile, offer retry
                if (isMobile) {
                  setTimeout(() => startGpsTracking(), 500)
                }
              }} className="ml-1 px-2 py-1 bg-amber-500/50 hover:bg-amber-500 rounded-lg text-white text-xs font-bold transition-colors shrink-0">
                {isMobile ? 'COBA LAGI' : ''}
                {!isMobile && <X className="w-4 h-4" />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Calculating Overlay (Mobile) */}
      {isCalculating && isMobile && (
        <div className="fixed inset-0 z-[1500] flex items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-none">
          <div className="px-6 py-4 bg-slate-900/90 border border-slate-700 rounded-2xl flex items-center gap-3 shadow-2xl">
            <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-white font-bold">Menghitung rute...</span>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* HISTORY PAGE OVERLAY                                               */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {activePage === 'history' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-0 z-[1800] bg-[#0b1120] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-[#0f172a] shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center">
                  <History className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-white font-black text-lg tracking-tight leading-none">Riwayat Evakuasi</h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">Log taktis semua aktivitas evakuasi</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {evacuationHistory.length > 0 && (
                  <button
                    onClick={() => {
                      if (confirm('Hapus semua riwayat evakuasi?')) {
                        setEvacuationHistory([])
                        localStorage.removeItem('evacuationHistory')
                      }
                    }}
                    className="flex items-center gap-2 px-3 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded-xl text-xs font-bold transition-colors border border-red-900/50"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Hapus Semua
                  </button>
                )}
                <button
                  onClick={() => setActivePage('map')}
                  className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6">
              {evacuationHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-600">
                  <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center">
                    <History className="w-10 h-10" />
                  </div>
                  <div className="text-center">
                    <p className="text-slate-400 font-semibold">Belum ada riwayat</p>
                    <p className="text-xs text-slate-600 mt-1">Riwayat akan tersimpan otomatis saat Anda menjalankan simulasi atau navigasi evakuasi.</p>
                  </div>
                  <button
                    onClick={() => setActivePage('map')}
                    className="mt-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm transition-colors"
                  >
                    Buka Peta
                  </button>
                </div>
              ) : (
                <div className="max-w-2xl mx-auto space-y-3">
                  {/* Stats Summary */}
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 text-center">
                      <p className="text-2xl font-black text-indigo-400">{evacuationHistory.length}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">Total Log</p>
                    </div>
                    <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 text-center">
                      <p className="text-2xl font-black text-red-400">{evacuationHistory.filter(r => r.type === 'simulation').length}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">Simulasi</p>
                    </div>
                    <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 text-center">
                      <p className="text-2xl font-black text-emerald-400">{evacuationHistory.filter(r => r.type === 'real').length}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">Nyata</p>
                    </div>
                  </div>

                  {/* History Cards */}
                  {evacuationHistory.map((record) => (
                    <div
                      key={record.id}
                      className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${ record.type === 'simulation' ? 'bg-red-900/30 text-red-400' : 'bg-emerald-900/30 text-emerald-400' }`}>
                            {record.type === 'simulation' ? <AlertTriangle className="w-5 h-5" /> : <Navigation2 className="w-5 h-5" />}
                          </div>
                          <div>
                            <h3 className="font-bold text-white text-sm leading-tight">{record.routeName}</h3>
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${ record.type === 'simulation' ? 'text-red-400' : 'text-emerald-400' }`}>
                              {record.type === 'simulation' ? '🔴 Simulasi Tsunami' : '🟢 Evakuasi Nyata'}
                            </span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[11px] text-slate-400 font-medium">
                            {record.timestamp.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </p>
                          <p className="text-[10px] text-slate-600">
                            {record.timestamp.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-3 gap-2">
                        <div className="bg-slate-800/50 rounded-lg p-2.5 text-center">
                          <p className="text-xs font-bold text-slate-300">{record.distance != null ? `${record.distance.toFixed(2)} km` : 'N/A'}</p>
                          <p className="text-[9px] text-slate-600 uppercase tracking-wider mt-0.5">Jarak</p>
                        </div>
                        <div className="bg-slate-800/50 rounded-lg p-2.5 text-center">
                          <p className="text-xs font-bold text-slate-300">{record.walkingTime != null ? `~${record.walkingTime} min` : 'N/A'}</p>
                          <p className="text-[9px] text-slate-600 uppercase tracking-wider mt-0.5">Waktu Tempuh</p>
                        </div>
                        <div className="bg-slate-800/50 rounded-lg p-2.5 text-center">
                          <p className="text-xs font-bold text-indigo-300">{record.algorithm}</p>
                          <p className="text-[9px] text-slate-600 uppercase tracking-wider mt-0.5">Algoritma</p>
                        </div>
                      </div>

                      <div className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-600">
                        <MapPin className="w-3 h-3" />
                        <span>{record.userLat.toFixed(5)}, {record.userLng.toFixed(5)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* SETTINGS PAGE OVERLAY                                             */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {activePage === 'settings' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-0 z-[1800] bg-[#0b1120] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-[#0f172a] shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center">
                  <SlidersHorizontal className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-white font-black text-lg tracking-tight leading-none">Pengaturan Sistem</h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">Konfigurasi teknis aplikasi evakuasi</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (confirm('Reset semua pengaturan ke default?')) {
                      const def: AppSettings = {
                        algorithm: 'dijkstra', sensorSensitivity: 'high',
                        soundAlert: true, vibrationAlert: true, mapStyle: 'normal',
                        safeZoneRadius: 2, autoStartGPS: true, showHazardZones: true,
                      }
                      setSettings(def)
                    }
                  }}
                  className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl text-xs font-bold transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset
                </button>
                <button
                  onClick={() => setActivePage('map')}
                  className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6">
              <div className="max-w-xl mx-auto space-y-5">

                {/* ── ROUTING ALGORITMA ── */}
                <section className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <Cpu className="w-4 h-4 text-indigo-400" />
                    <div>
                      <h3 className="text-sm font-bold text-white">Algoritma Pencarian Rute</h3>
                      <p className="text-[10px] text-slate-500">Pilih metode kalkulasi jalur evakuasi optimal</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {(['dijkstra', 'astar', 'bfs'] as const).map(algo => (
                      <button
                        key={algo}
                        onClick={() => setSettings(s => ({ ...s, algorithm: algo }))}
                        className={`p-3 rounded-xl border text-center transition-all ${ settings.algorithm === algo ? 'bg-indigo-500/20 border-indigo-500/60 text-indigo-300' : 'bg-slate-800/50 border-slate-700/50 text-slate-500 hover:border-slate-600' }`}
                      >
                        <p className="text-xs font-black uppercase tracking-wider">{algo === 'astar' ? 'A*' : algo.toUpperCase()}</p>
                        <p className="text-[9px] mt-1 opacity-70">{algo === 'dijkstra' ? 'Terpendek' : algo === 'astar' ? 'Heuristik' : 'Lebar Pertama'}</p>
                        {settings.algorithm === algo && <CheckCircle className="w-3 h-3 mx-auto mt-1.5 text-indigo-400" />}
                      </button>
                    ))}
                  </div>
                  <p className="mt-3 text-[10px] text-slate-600 flex items-start gap-1.5">
                    <Info className="w-3 h-3 shrink-0 mt-0.5 text-slate-500" />
                    {settings.algorithm === 'dijkstra' && 'Dijkstra: Menjamin jalur terpendek secara matematis. Ideal untuk evakuasi darurat.'}
                    {settings.algorithm === 'astar' && 'A*: Seperti Dijkstra namun lebih cepat dengan heuristik jarak Euclidean.'}
                    {settings.algorithm === 'bfs' && 'BFS: Mencari jalur dengan hop minimum. Cocok untuk jaringan jalan yang seragam.'}
                  </p>
                </section>

                {/* ── SENSOR ── */}
                <section className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <Radio className="w-4 h-4 text-emerald-400" />
                    <div>
                      <h3 className="text-sm font-bold text-white">Sensitivitas Sensor</h3>
                      <p className="text-[10px] text-slate-500">Threshold deteksi aktivitas seismik/tsunami</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {(['low', 'medium', 'high'] as const).map(level => {
                      const labels = { low: 'Rendah', medium: 'Sedang', high: 'Tinggi' }
                      const colors = { low: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/60', medium: 'text-amber-400 bg-amber-500/20 border-amber-500/60', high: 'text-red-400 bg-red-500/20 border-red-500/60' }
                      return (
                        <button
                          key={level}
                          onClick={() => setSettings(s => ({ ...s, sensorSensitivity: level }))}
                          className={`p-3 rounded-xl border text-center transition-all ${ settings.sensorSensitivity === level ? colors[level] : 'bg-slate-800/50 border-slate-700/50 text-slate-500 hover:border-slate-600' }`}
                        >
                          <p className="text-xs font-black">{labels[level]}</p>
                          {settings.sensorSensitivity === level && <CheckCircle className="w-3 h-3 mx-auto mt-1.5" />}
                        </button>
                      )
                    })}
                  </div>
                </section>

                {/* ── PROTOKOL PERINGATAN ── */}
                <section className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <Bell className="w-4 h-4 text-amber-400" />
                    <div>
                      <h3 className="text-sm font-bold text-white">Protokol Peringatan</h3>
                      <p className="text-[10px] text-slate-500">Aktivasi peringatan saat peristiwa darurat</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {/* Sound */}
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-3">
                        {settings.soundAlert ? <Volume2 className="w-4 h-4 text-indigo-400" /> : <VolumeX className="w-4 h-4 text-slate-600" />}
                        <div>
                          <p className="text-sm text-slate-300">Sirine Darurat</p>
                          <p className="text-[10px] text-slate-600">Suara alarm tsunami saat simulasi aktif</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSettings(s => ({ ...s, soundAlert: !s.soundAlert }))
                          setAlarmMuted(prev => !prev)
                        }}
                        className={`relative w-12 h-6 rounded-full transition-colors ${ settings.soundAlert ? 'bg-indigo-600' : 'bg-slate-700' }`}
                      >
                        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${ settings.soundAlert ? 'left-6' : 'left-0.5' }`} />
                      </button>
                    </div>
                    <div className="h-px bg-slate-800" />
                    {/* Vibration */}
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-3">
                        <Vibrate className={`w-4 h-4 ${ settings.vibrationAlert ? 'text-indigo-400' : 'text-slate-600' }`} />
                        <div>
                          <p className="text-sm text-slate-300">Getaran Peringatan</p>
                          <p className="text-[10px] text-slate-600">Vibrasi perangkat saat peringatan darurat</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setSettings(s => ({ ...s, vibrationAlert: !s.vibrationAlert }))}
                        className={`relative w-12 h-6 rounded-full transition-colors ${ settings.vibrationAlert ? 'bg-indigo-600' : 'bg-slate-700' }`}
                      >
                        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${ settings.vibrationAlert ? 'left-6' : 'left-0.5' }`} />
                      </button>
                    </div>
                    <div className="h-px bg-slate-800" />
                    {/* GPS Auto-start */}
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-3">
                        <Satellite className={`w-4 h-4 ${ settings.autoStartGPS ? 'text-indigo-400' : 'text-slate-600' }`} />
                        <div>
                          <p className="text-sm text-slate-300">Auto-Start GPS</p>
                          <p className="text-[10px] text-slate-600">Aktifkan GPS otomatis saat buka aplikasi (mobile)</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setSettings(s => ({ ...s, autoStartGPS: !s.autoStartGPS }))}
                        className={`relative w-12 h-6 rounded-full transition-colors ${ settings.autoStartGPS ? 'bg-indigo-600' : 'bg-slate-700' }`}
                      >
                        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${ settings.autoStartGPS ? 'left-6' : 'left-0.5' }`} />
                      </button>
                    </div>
                    <div className="h-px bg-slate-800" />
                    {/* Show Hazard Zones */}
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className={`w-4 h-4 ${ settings.showHazardZones ? 'text-red-400' : 'text-slate-600' }`} />
                        <div>
                          <p className="text-sm text-slate-300">Tampilkan Zona Bahaya</p>
                          <p className="text-[10px] text-slate-600">Overlay area berisiko tinggi pada peta</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setSettings(s => ({ ...s, showHazardZones: !s.showHazardZones }))}
                        className={`relative w-12 h-6 rounded-full transition-colors ${ settings.showHazardZones ? 'bg-indigo-600' : 'bg-slate-700' }`}
                      >
                        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${ settings.showHazardZones ? 'left-6' : 'left-0.5' }`} />
                      </button>
                    </div>
                  </div>
                </section>

                {/* ── RADIUS ZONA AMAN ── */}
                <section className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <Shield className="w-4 h-4 text-indigo-400" />
                    <div>
                      <h3 className="text-sm font-bold text-white">Radius Zona Aman</h3>
                      <p className="text-[10px] text-slate-500">Jarak minimum dari garis pantai yang dianggap aman</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setSettings(s => ({ ...s, safeZoneRadius: Math.max(0.5, +(s.safeZoneRadius - 0.5).toFixed(1)) }))}
                      className="w-9 h-9 bg-slate-800 hover:bg-slate-700 rounded-xl flex items-center justify-center text-slate-300 transition-colors shrink-0"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <div className="flex-1 text-center">
                      <p className="text-3xl font-black text-white">{settings.safeZoneRadius.toFixed(1)}<span className="text-base text-slate-500 font-normal ml-1">km</span></p>
                    </div>
                    <button
                      onClick={() => setSettings(s => ({ ...s, safeZoneRadius: Math.min(10, +(s.safeZoneRadius + 0.5).toFixed(1)) }))}
                      className="w-9 h-9 bg-slate-800 hover:bg-slate-700 rounded-xl flex items-center justify-center text-slate-300 transition-colors shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <input
                    type="range" min="0.5" max="10" step="0.5" value={settings.safeZoneRadius}
                    onChange={e => setSettings(s => ({ ...s, safeZoneRadius: +e.target.value }))}
                    className="w-full mt-3 accent-indigo-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-600 mt-1">
                    <span>0.5 km</span><span>10 km</span>
                  </div>
                </section>

                {/* ── INFO SISTEM ── */}
                <section className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <Info className="w-4 h-4 text-slate-400" />
                    <h3 className="text-sm font-bold text-white">Info Sistem</h3>
                  </div>
                  <div className="space-y-2">
                    {[['Versi Aplikasi', 'v1.0.0 (Skripsi)'], ['Platform', 'React 18 + Vite + TypeScript'], ['Routing Engine', 'Leaflet.js + OpenStreetMap'], ['Jarak Hitung', 'Haversine Formula'], ['Algoritma Aktif', settings.algorithm === 'astar' ? 'A*' : settings.algorithm.charAt(0).toUpperCase() + settings.algorithm.slice(1)]].map(([label, value]) => (
                      <div key={label} className="flex justify-between items-center py-1.5">
                        <span className="text-xs text-slate-500">{label}</span>
                        <span className="text-xs text-slate-300 font-mono bg-slate-800 px-2 py-0.5 rounded">{value}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <div className="h-8" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}

export default App
