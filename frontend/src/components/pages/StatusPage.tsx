// ═══════════════════════════════════════════════════════════════
// A.T.L.A.S // STATUS PAGE — A.T.L.A.S TACTICAL TELEMETRY
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect } from 'react'
import { Map, MapMarker, MarkerContent } from '@/components/ui/map'
import { MapPin, Users, BookOpen, ChevronRight, CheckCircle, Heart, Activity, ChevronLeft, Radio, AlertTriangle, Globe, Clock, Megaphone, ShieldAlert, Check, X } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { loadFamily } from './FamilyPage'
import { useLanguage } from '../../lib/i18n'
import type { GempaData } from '../../lib/useBMKG'
import { enqueueOfflineTelemetry } from '../../lib/offlineQueue'
import { sendEmergencySmsSos } from '../../lib/smsGateway'
import {
  getAdminBroadcasts,
  markBroadcastAsRead,
  isBroadcastRelevantForUser,
  type AdminBroadcast
} from '../../lib/broadcastStorage'

const PALU_CENTER: [number, number] = [-0.8917, 119.8577]

function formatFullDateTime(raw?: string | null): string {
  if (!raw) {
    const d = new Date()
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
    return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()} · ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')} WITA`
  }
  const d = new Date(raw)
  if (isNaN(d.getTime())) return raw
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()} · ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')} WITA`
}

function MiniMap({ userPosition }: { userPosition?: [number, number] | null }) {
  const { t } = useLanguage()
  const [pos, setPos] = useState<[number, number] | null>(() => {
    if (userPosition && !isNaN(userPosition[0]) && !isNaN(userPosition[1])) {
      return [userPosition[1], userPosition[0]] // [lng, lat]
    }
    try {
      const saved = localStorage.getItem('atlas_user_position')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length >= 2) {
          return [parsed[1], parsed[0]]
        }
      }
    } catch {}
    return [PALU_CENTER[1], PALU_CENTER[0]]
  })

  useEffect(() => {
    if (userPosition && !isNaN(userPosition[0]) && !isNaN(userPosition[1])) {
      setPos([userPosition[1], userPosition[0]])
    }
  }, [userPosition?.[0], userPosition?.[1]])

  // Sinkronisasi posisi peta mini dikendalikan terpusat oleh mesin telemetri App.tsx via userPosition prop


  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
      className="h-44 rounded-lg border border-nerv-border bg-nerv-card overflow-hidden relative">
      <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/85 border border-nerv-border backdrop-blur-sm shadow-md">
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-[9px] font-mono font-bold text-slate-200">{t('gpsTelemetryMesh')}</span>
      </div>
      <div className="absolute top-2 right-2 z-20 flex items-center gap-1 px-2 py-0.5 rounded bg-nerv-orange/15 border border-nerv-orange/40 text-nerv-orange text-[9px] font-mono font-bold">
        <span>LOKASI REAL-TIME</span>
      </div>
      <Map
        viewport={{
          center: pos ?? [PALU_CENTER[1], PALU_CENTER[0]],
          zoom: pos ? 16 : 14
        }}
        interactive={true}
      >
        {pos && (
          <MapMarker longitude={pos[0]} latitude={pos[1]}>
            <MarkerContent>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, pointerEvents:'none', position:'relative' }}>
                <div style={{ position:'relative', width:26, height:26, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <div style={{ position:'absolute', width:26, height:26, borderRadius:'50%', background:'rgba(255,87,34,0.35)', animation:'haloPulse 2s infinite' }}></div>
                  <div style={{ position:'relative', width:14, height:14, borderRadius:'50%', background:'#FF5722', border:'2.5px solid #ffffff', boxShadow:'0 0 14px rgba(255,87,34,1)', zIndex:1 }}></div>
                </div>
                <span className="font-mono text-[8px] font-black px-2 py-0.5 rounded bg-black/90 text-nerv-orange border border-nerv-orange/50 uppercase tracking-widest shadow-md">
                  {t('targetLock') || 'LOKASI ANDA'}
                </span>
              </div>
            </MarkerContent>
          </MapMarker>
        )}
      </Map>
      {!pos && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-nerv-bg/90 z-10 font-mono">
          <MapPin className="w-5 h-5 text-nerv-orange mb-1 animate-bounce"/>
          <p className="text-[10px] text-slate-400">{t('searchingSatelliteFix')}</p>
        </div>
      )}
    </motion.div>
  )
}

interface Props {
  onNavigate: (page: 'navigate' | 'family' | 'guides' | 'menu') => void
  userLocation: string
  onBack?: () => void
  userName?: string
  onRequestGps?: () => void
  gpsTracking?: boolean
  tsunamiAlert?: boolean
  onOpenProfile?: () => void
  userPosition?: [number, number] | null
  terminalId?: string
  gempa?: GempaData | null
}

interface DisasterEvent {
  source: string
  type: string
  magnitude?: number | string
  depth?: string
  location?: string
  potensi?: string
  report_datetime?: string
}

export default function StatusPage({ onNavigate, userLocation, onBack, userName, onRequestGps, gpsTracking, tsunamiAlert, onOpenProfile, userPosition, terminalId, gempa }: Props) {
  const { lang, setLanguage, t } = useLanguage()
  const [safePressed, setSafePressed] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [pulseKey, setPulseKey] = useState(0)

  // Admin Emergency Broadcast State
  const [broadcasts, setBroadcasts] = useState<AdminBroadcast[]>([])
  const [dismissedBroadcastIds, setDismissedBroadcastIds] = useState<string[]>([])
  const [showBroadcastHistory, setShowBroadcastHistory] = useState(false)
  const [nowTs, setNowTs] = useState(() => Date.now())

  useEffect(() => {
    const timer = setInterval(() => setNowTs(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  const reloadBroadcasts = () => {
    setBroadcasts(getAdminBroadcasts())
  }

  useEffect(() => {
    reloadBroadcasts()
    const handleUpdate = () => reloadBroadcasts()
    window.addEventListener('atlas_admin_broadcast_updated', handleUpdate)
    return () => window.removeEventListener('atlas_admin_broadcast_updated', handleUpdate)
  }, [])

  const relevantBroadcasts = broadcasts.filter(b => isBroadcastRelevantForUser(b, userLocation))
  const activeBroadcast = relevantBroadcasts.length > 0 ? relevantBroadcasts[0] : null
  const [latestQuake, setLatestQuake] = useState<DisasterEvent | null>(() => {
    try {
      const historyKey = 'atlas_earthquake_news_history'
      const existing = JSON.parse(localStorage.getItem(historyKey) || '[]')
      if (existing.length > 0) {
        const item = existing[0]
        return {
          source: item.source || 'BMKG',
          type: 'earthquake',
          magnitude: item.magnitude,
          depth: item.depth,
          location: item.location,
          potensi: item.potensi,
          report_datetime: item.eventTime
        }
      }
    } catch {}
    return null
  })

  // Sinkronisasi data gempa langsung dari useBMKG (mobile & web identik)
  useEffect(() => {
    if (gempa) {
      setLatestQuake({
        source: 'SIARAN SEISMIK LANGSUNG • BMKG // PUSAT GEMPA',
        type: 'earthquake',
        magnitude: gempa.Magnitude,
        depth: gempa.Kedalaman,
        location: gempa.Wilayah,
        potensi: gempa.Potensi,
        report_datetime: `${gempa.Tanggal} • ${gempa.Jam}`
      })
      try {
        const historyKey = 'atlas_earthquake_news_history'
        const existing = JSON.parse(localStorage.getItem(historyKey) || '[]')
        const quakeId = `${gempa.DateTime || (gempa.Tanggal + '_' + gempa.Jam)}_${gempa.Magnitude}_${gempa.Wilayah}`
        const cleaned = existing.filter((item: any) => item.id !== 'eq-palu-01' && item.id !== 'eq-donggala-02')
        if (!cleaned.some((item: any) => item.id === quakeId)) {
          const newItem = {
            id: quakeId,
            source: 'SIARAN SEISMIK LANGSUNG • BMKG // PUSAT GEMPA',
            location: gempa.Wilayah,
            magnitude: gempa.Magnitude,
            depth: gempa.Kedalaman,
            eventTime: `${gempa.Tanggal} • ${gempa.Jam}`,
            receivedAt: Date.now(),
            potensi: gempa.Potensi || gempa.Dirasakan || 'Tidak berpotensi tsunami'
          }
          const updated = [newItem, ...cleaned].slice(0, 30)
          localStorage.setItem(historyKey, JSON.stringify(updated))
          localStorage.setItem('atlas_has_unread_earthquake_news', 'true')
          window.dispatchEvent(new CustomEvent('atlas_earthquake_news_updated'))
        } else if (cleaned.length !== existing.length) {
          localStorage.setItem(historyKey, JSON.stringify(cleaned))
        }
      } catch {}
      return
    }

    // Backend fallback
    const isLocal = typeof window !== 'undefined' && (window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1'))
    const baseUrl = isLocal ? (import.meta.env.VITE_API_URL || 'https://tsunami-dimss.vercel.app') : ''
    fetch(`${baseUrl}/api/disaster/home`)
      .then(r => r.json())
      .then(d => {
        if (d?.informations && d.informations.length > 0) {
          const quake = d.informations.find((i: any) => i.type === 'earthquake')
          if (quake) {
            setLatestQuake(quake)
            try {
              const historyKey = 'atlas_earthquake_news_history'
              const existing = JSON.parse(localStorage.getItem(historyKey) || '[]')
              const quakeId = `${quake.report_datetime || ''}_${quake.magnitude || ''}_${quake.location || ''}`
              const cleaned = existing.filter((item: any) => item.id !== 'eq-palu-01' && item.id !== 'eq-donggala-02')
              if (!cleaned.some((item: any) => item.id === quakeId)) {
                const newItem = {
                  id: quakeId,
                  source: 'SIARAN SEISMIK LANGSUNG • BMKG // PUSAT GEMPA',
                  location: quake.location || 'Pusat Gempa Terdeteksi',
                  magnitude: quake.magnitude || '5.0',
                  depth: quake.depth || '10 km',
                  eventTime: quake.report_datetime || new Date().toLocaleString('id-ID'),
                  receivedAt: Date.now(),
                  potensi: quake.potensi || 'Tidak berpotensi tsunami'
                }
                const updated = [newItem, ...cleaned].slice(0, 30)
                localStorage.setItem(historyKey, JSON.stringify(updated))
                localStorage.setItem('atlas_has_unread_earthquake_news', 'true')
                window.dispatchEvent(new CustomEvent('atlas_earthquake_news_updated'))
              } else if (cleaned.length !== existing.length) {
                localStorage.setItem(historyKey, JSON.stringify(cleaned))
              }
            } catch {}
          }
        }
      })
      .catch(() => {})
  }, [gempa])

  useEffect(() => {
    const t = setInterval(() => setPulseKey(k => k + 1), 3000)
    return () => clearInterval(t)
  }, [])

  const handleSafe = () => {
    setSafePressed(true)
    const now = new Date()
    setLastUpdated(`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')} WIB`)
    if ('vibrate' in navigator) navigator.vibrate([100, 50, 200])

    enqueueOfflineTelemetry('safe_report', {
      terminalId,
      userPosition,
      timestamp: Date.now()
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.22 }}
      className="fixed inset-0 z-[1800] flex flex-col overflow-y-auto custom-scrollbar bg-nerv-bg text-slate-200"
    >
      {/* A.T.L.A.S Telemetry Header */}
      <div className="shrink-0 px-4 pt-[max(env(safe-area-inset-top,0px),1rem)] pb-3 border-b border-nerv-border bg-[#0B0F19] flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          {onBack && (
            <button onClick={onBack}
              className="w-8 h-8 rounded bg-nerv-card border border-nerv-border flex items-center justify-center shrink-0 hover:border-nerv-orange transition-colors">
              <ChevronLeft className="w-4 h-4 text-slate-300" />
            </button>
          )}
          <img
            src="/atlas-logo-user.png"
            alt="A.T.L.A.S"
            className="w-9 h-9 object-contain shrink-0 filter drop-shadow-[0_0_8px_rgba(255,87,34,0.4)]"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-nerv-orange animate-ping shrink-0" />
              <h1 className="text-xs sm:text-sm font-mono font-black tracking-widest text-nerv-orange uppercase">
                A.T.L.A.S //
              </h1>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-nerv-cyan shrink-0" />
              <h2 className="text-[11px] sm:text-xs font-mono font-bold text-white truncate">
                {userLocation || t('detectingLocation')}
              </h2>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenProfile}
            className="px-2.5 py-1 rounded bg-black/60 border border-nerv-border hover:border-nerv-cyan text-right font-mono transition-colors"
            title={lang === 'id' ? 'Pengaturan Profil' : 'Profile Settings'}
          >
            <span className="text-[8px] text-slate-500 block uppercase leading-none">UNIT</span>
            <span className={`text-xs font-bold ${
              terminalId === 'ARCHITECT 01' || terminalId === 'NODE-01'
                ? 'text-amber-400'
                : (terminalId && terminalId.startsWith('COMMAND') ? 'text-nerv-orange' : (terminalId === 'FOREIGN CITIZEN' ? 'text-purple-300' : 'text-nerv-cyan'))
            }`}>
              {terminalId === 'ARCHITECT 01' || terminalId === 'NODE-01'
                ? 'ARCHITECT 01'
                : (terminalId && terminalId.startsWith('COMMAND') ? terminalId : (terminalId === 'FOREIGN CITIZEN' ? 'FOREIGN CITIZEN' : 'CITIZEN'))}
            </span>
          </button>
        </div>
      </div>

      <div className="flex-1 px-4 py-4 space-y-3 font-sans">

        {/* A.T.L.A.S Official Command Broadcast Banner (Pesan Siaran Darurat Admin Komando) */}
        {activeBroadcast && !dismissedBroadcastIds.includes(activeBroadcast.id) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`p-3.5 rounded-xl border relative overflow-hidden shadow-lg ${
              activeBroadcast.level === 'CRITICAL'
                ? 'bg-red-950/70 border-red-500/80 shadow-red-500/20 border-l-4 border-l-red-500'
                : activeBroadcast.level === 'WARNING'
                ? 'bg-amber-950/70 border-amber-500/80 shadow-amber-500/20 border-l-4 border-l-amber-500'
                : 'bg-cyan-950/70 border-cyan-500/80 shadow-cyan-500/20 border-l-4 border-l-cyan-500'
            }`}
          >
            <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2 mb-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <ShieldAlert className={`w-4 h-4 shrink-0 ${
                  activeBroadcast.level === 'CRITICAL' ? 'text-red-400 animate-pulse' : activeBroadcast.level === 'WARNING' ? 'text-amber-400' : 'text-cyan-400'
                }`} />
                <span className="font-mono text-[9px] font-black tracking-wider text-white uppercase truncate">
                  SIARAN RESMI
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase ${
                  activeBroadcast.level === 'CRITICAL'
                    ? 'bg-red-500/30 text-red-300 border border-red-500/50'
                    : activeBroadcast.level === 'WARNING'
                    ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50'
                    : 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50'
                }`}>
                  {activeBroadcast.level === 'CRITICAL' ? 'DEFCON 1' : activeBroadcast.level === 'WARNING' ? 'DEFCON 2' : 'INFORMASI'}
                </span>
                <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-black/60 border border-white/15 text-slate-300">
                  {activeBroadcast.region || 'SEMUA WILAYAH'}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-[9px] font-mono text-slate-400">
                {/ARCHITECT/i.test(activeBroadcast.sender || '') || /ARCHITECT/i.test(activeBroadcast.role || '') ? (
                  <span className="text-amber-400 font-mono font-black tracking-wider bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                    {activeBroadcast.sender || 'ARCHITECT'}
                  </span>
                ) : (
                  <span className="text-white font-bold">{activeBroadcast.sender || 'POSKO BENCANA'}</span>
                )}
                <span>{new Date(activeBroadcast.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WITA</span>
              </div>
              <h3 className="text-xs font-bold text-white tracking-wide">
                {activeBroadcast.title}
              </h3>
              <div className="bg-black/40 p-2.5 rounded-lg border border-white/5 space-y-1.5">
                <p className="text-[11px] text-slate-200 leading-relaxed font-sans break-words">
                  {activeBroadcast.message.length > 130
                    ? `${activeBroadcast.message.slice(0, 130)}...`
                    : activeBroadcast.message}
                </p>
                {activeBroadcast.message.length > 130 && (
                  <button
                    type="button"
                    onClick={() => {
                      sessionStorage.setItem('atlas_menu_initial_view', 'broadcasts')
                      onNavigate('menu')
                    }}
                    className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-amber-400 hover:text-amber-300 underline underline-offset-2 active:scale-95 transition-all pt-0.5"
                  >
                    <span>BACA SELENGKAPNYA →</span>
                  </button>
                )}
              </div>
            </div>

            <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                {activeBroadcast.expiresAt && activeBroadcast.expiresAt > nowTs && (() => {
                  const remaining = Math.max(0, activeBroadcast.expiresAt - nowTs)
                  const h = Math.floor(remaining / 3600000)
                  const m = Math.floor((remaining % 3600000) / 60000)
                  const s = Math.floor((remaining % 60000) / 1000)
                  return (
                    <div className="flex items-center gap-1 text-[9px] font-mono text-amber-300 bg-amber-950/60 border border-amber-500/40 px-2 py-0.5 rounded">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                      <span>SISA: {String(h).padStart(2, '0')}:{String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}</span>
                    </div>
                  )
                })()}
                <button
                  type="button"
                  onClick={() => setShowBroadcastHistory(true)}
                  className="text-[10px] font-mono text-slate-400 hover:text-white underline underline-offset-2 transition-colors flex items-center gap-1.5"
                >
                  <span>Riwayat ({relevantBroadcasts.length})</span>
                </button>
              </div>
              <div className="flex items-center gap-1 text-[9px] font-mono text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/40 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>INSTRUKSI AKTIF</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Quick access to broadcast history if banner is dismissed */}
        {relevantBroadcasts.length > 0 && (!activeBroadcast || dismissedBroadcastIds.includes(activeBroadcast.id)) && (
          <button
            type="button"
            onClick={() => setShowBroadcastHistory(true)}
            className="w-full py-2 px-3 rounded-lg bg-black/60 border border-nerv-cyan/40 hover:border-nerv-cyan text-nerv-cyan text-[10px] font-mono font-bold flex items-center justify-between transition-colors shadow-sm"
          >
            <div className="flex items-center gap-2">
              <Megaphone className="w-3.5 h-3.5 animate-pulse" />
              <span>SIARAN RESMI ({relevantBroadcasts.length} PESAN)</span>
            </div>
            <span className="text-white text-[9px] bg-nerv-cyan/20 px-1.5 py-0.5 rounded">
              BUKA INSTRUKSI
            </span>
          </button>
        )}

        {/* A.T.L.A.S Live Disaster Broadcast Card */}
        {latestQuake && (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="p-3.5 rounded-lg border border-nerv-border bg-nerv-card border-l-4 border-l-nerv-orange relative overflow-hidden"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <Radio className="w-3.5 h-3.5 text-nerv-orange animate-pulse" />
                  <span className="text-[9px] font-mono font-black text-nerv-orange tracking-widest uppercase">
                    {t('liveSeismicFeed')} · {latestQuake.source}
                  </span>
                </div>
                <p className="text-sm font-bold text-white leading-snug line-clamp-2">
                  {latestQuake.location || t('quakeDetected')}
                </p>
                <div className="flex items-center gap-1.5 text-[9px] font-mono text-slate-400 mt-1">
                  <Clock className="w-3 h-3 text-nerv-cyan shrink-0" />
                  <span className="text-slate-300 font-bold">{formatFullDateTime(latestQuake.report_datetime)}</span>
                </div>
                {latestQuake.potensi && (
                  <p className="text-[10px] font-mono text-nerv-yellow mt-1 font-semibold">
                    {latestQuake.potensi}
                  </p>
                )}
              </div>

              {latestQuake.magnitude && (
                <div className="shrink-0 text-center px-2.5 py-1.5 rounded bg-black/70 border border-nerv-orange/40 font-mono">
                  <span className="text-[8px] text-slate-400 block tracking-wider uppercase">MAG</span>
                  <span className="text-lg font-black text-nerv-orange leading-none">{latestQuake.magnitude}</span>
                  <span className="text-[8px] text-slate-500 block mt-0.5">{latestQuake.depth || '10 km'}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Tactical Readiness Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="p-3 rounded-lg border border-nerv-border bg-nerv-card flex items-center justify-between font-mono"
        >
          <div>
            <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">{t('defconStatus')}</p>
            <p className="text-base font-black text-nerv-green">{t('defconNormal')}</p>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-nerv-green/10 border border-nerv-green/30 text-nerv-green text-[10px] font-bold">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>{t('allSensorsNominal')}</span>
          </div>
        </motion.div>

        {/* Personnel Status (I AM SAFE) Card — ONLY APPEARS DURING DISASTER OR SIMULATION */}
        {tsunamiAlert && (
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="p-5 rounded-lg border border-nerv-border bg-nerv-card text-center relative overflow-hidden"
          >
            {/* Top Bar Label */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-black/60 border border-nerv-border mb-3 font-mono">
              <div className="w-1.5 h-1.5 rounded-full bg-nerv-orange" />
              <span className="text-[9px] font-bold tracking-widest text-slate-300 uppercase">
                PERSONNEL REPORT // BEACON ACTIVE
              </span>
            </div>

            <h3 className="text-xl font-black text-white tracking-wide font-mono mb-1">
              {t('reportSafetyStatus')}
            </h3>
            <p className="text-xs text-slate-400 mb-5 leading-relaxed font-sans">
              {t('reportSafetyDesc')}
            </p>

            {/* Big Tactical Button */}
            <div className="relative flex justify-center mb-4">
              <AnimatePresence>
                {!safePressed && (
                  <>
                    <motion.div
                      key={`ring1-${pulseKey}`}
                      initial={{ scale: 1, opacity: 0.4 }}
                      animate={{ scale: 1.5, opacity: 0 }}
                      transition={{ duration: 2.2, ease: 'easeOut' }}
                      className="absolute inset-0 rounded-lg border border-nerv-orange"
                      style={{ margin: '0 auto', width: 140, height: 140 }}
                    />
                  </>
                )}
              </AnimatePresence>
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={handleSafe}
                className={`relative w-[140px] h-[140px] rounded-lg flex flex-col items-center justify-center gap-2 font-mono font-black transition-all duration-300 border ${
                  safePressed
                    ? 'bg-nerv-green/20 border-nerv-green text-nerv-green shadow-[0_0_30px_rgba(16,185,129,0.3)]'
                    : 'bg-nerv-orange text-black border-nerv-orange shadow-[0_0_30px_rgba(255,87,34,0.3)] hover:brightness-110'
                }`}
              >
                {safePressed ? (
                  <CheckCircle className="w-10 h-10" />
                ) : (
                  <div className="w-10 h-10 rounded-full border-2 border-black flex items-center justify-center font-mono font-black text-lg">
                    !
                  </div>
                )}
                <span className="text-xs tracking-wider uppercase">
                  {safePressed ? t('confirmed') : t('iAmSafe')}
                </span>
              </motion.button>
            </div>

            {lastUpdated && (
              <motion.p
                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                className="text-[11px] font-mono text-nerv-green font-bold"
              >
                {t('signalTransmitted')} {lastUpdated}
              </motion.p>
            )}

            {/* Transmisi Darurat via SMS 2G / GSM (Zero Internet Required) */}
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex justify-center">
              <button
                type="button"
                onClick={() => {
                  const savedNik = localStorage.getItem('aegis_nik') || ''
                  sendEmergencySmsSos({
                    lat: userPosition?.[0],
                    lng: userPosition?.[1],
                    userName,
                    userNik: savedNik,
                    targetPhone: '115'
                  })
                }}
                className="px-3.5 py-2 rounded-lg bg-red-600/20 border border-red-500/40 text-red-400 hover:bg-red-600 hover:text-white transition-all text-[10px] font-mono font-bold flex items-center gap-1.5 shadow-[0_0_15px_rgba(239,68,68,0.2)] active:scale-95"
              >
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                TRANSMISI SOS DARURAT VIA SMS (115)
              </button>
            </div>
          </motion.div>
        )}

        {/* Family Status Tactical Card */}
        {(() => {
          const fam = loadFamily()
          if (fam.length === 0) return null
          const safeCount = fam.filter(m => m.status === 'safe').length
          return (
            <motion.button
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              onClick={() => onNavigate('family')}
              className="w-full p-3.5 rounded-lg border border-nerv-border bg-nerv-card hover:border-nerv-borderActive transition-colors text-left flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded bg-black/60 border border-nerv-border flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4 text-nerv-cyan" />
                </div>
                <div>
                  <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-bold">{t('linkedPersonnel')}</p>
                  <p className="text-sm font-bold text-white">{t('familyUnit')} · {fam.length} {t('members')}</p>
                  <p className="text-[10px] font-mono text-nerv-green mt-0.5">{safeCount}/{fam.length} {t('membersVerifiedSafe')}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
            </motion.button>
          )
        })()}

        {/* Evacuation Guides Tactical Card */}
        <motion.button
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          onClick={() => onNavigate('guides')}
          className="w-full p-3.5 rounded-lg border border-nerv-border bg-nerv-card hover:border-nerv-borderActive transition-colors text-left flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-black/60 border border-nerv-border flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4 text-nerv-orange" />
            </div>
            <div>
              <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-bold">{t('tacticalProtocol')}</p>
              <p className="text-sm font-bold text-white">{t('tsunamiProtocol')}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{t('tsunamiProtocolDesc')}</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
        </motion.button>

        {/* Tactical Map */}
        <MiniMap userPosition={userPosition} />

        <div className="h-16" />
      </div>

      {/* Modal Riwayat Siaran Darurat Admin Komando */}
      <AnimatePresence>
        {showBroadcastHistory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2100] bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          >
            <div className="w-full max-w-sm max-h-[85vh] rounded-2xl bg-slate-900 border border-nerv-cyan/60 p-5 shadow-[0_0_40px_rgba(6,182,212,0.25)] flex flex-col font-sans">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
                <div className="flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-nerv-cyan animate-pulse" />
                  <span className="text-xs font-mono font-black text-nerv-cyan tracking-wider">
                    SIARAN RESMI
                  </span>
                </div>
                <button
                  onClick={() => setShowBroadcastHistory(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-3 space-y-3 custom-scrollbar text-xs">
                {relevantBroadcasts.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 font-mono text-xs">
                    Belum ada siaran darurat aktif dari Posko Komando untuk wilayah Anda saat ini.
                  </div>
                ) : (
                  relevantBroadcasts.map((b) => (
                    <div
                      key={b.id}
                      className={`p-3 rounded-xl border space-y-1.5 ${
                        b.level === 'CRITICAL'
                          ? 'bg-red-950/40 border-red-500/40'
                          : b.level === 'WARNING'
                          ? 'bg-amber-950/40 border-amber-500/40'
                          : 'bg-black/60 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[9px] font-mono">
                        {/ARCHITECT/i.test(b.sender || '') || /ARCHITECT/i.test(b.role || '') ? (
                          <span className="text-amber-400 font-mono font-black tracking-wider bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 rounded shadow-[0_0_8px_rgba(245,158,11,0.2)]">
                            {b.sender || 'ARCHITECT'}
                          </span>
                        ) : (
                          <span className="text-nerv-cyan font-bold">{b.sender || 'POSKO PUSAT'}</span>
                        )}
                        <span className="text-slate-400">{new Date(b.timestamp).toLocaleString('id-ID')} WITA</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`px-1.5 py-0.2 rounded text-[8px] font-mono font-bold uppercase ${
                          b.level === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : b.level === 'WARNING' ? 'bg-amber-500/20 text-amber-400' : 'bg-cyan-500/20 text-cyan-400'
                        }`}>
                          {b.level}
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[8px] font-mono font-bold bg-slate-800 text-slate-300">
                          {b.region}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-white leading-snug">{b.title}</h4>
                      <p className="text-[11px] text-slate-300 leading-relaxed font-sans break-words bg-slate-950/60 p-2 rounded border border-slate-800/80">
                        {b.message}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-3 border-t border-slate-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowBroadcastHistory(false)}
                  className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs font-bold transition-colors"
                >
                  TUTUP
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
