// ═══════════════════════════════════════════════════════════════
// A.T.L.A.S // STATUS PAGE — NERV TACTICAL TELEMETRY
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect } from 'react'
import { Map, MapMarker, MarkerContent } from '@/components/ui/map'
import { MapPin, Users, BookOpen, ChevronRight, CheckCircle, Heart, Activity, ChevronLeft, Radio, AlertTriangle, Globe } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { loadFamily } from './FamilyPage'
import { useLanguage } from '../../lib/i18n'

const PALU_CENTER: [number, number] = [-0.8917, 119.8577]

function MiniMap() {
  const { t } = useLanguage()
  const [pos, setPos] = useState<[number, number] | null>(null)

  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      p => setPos([p.coords.longitude, p.coords.latitude]),
      () => {},
      { enableHighAccuracy: false, timeout: 6000 }
    )
    const w = navigator.geolocation.watchPosition(
      p => setPos([p.coords.longitude, p.coords.latitude]),
      () => {},
      { enableHighAccuracy: false }
    )
    return () => navigator.geolocation.clearWatch(w)
  }, [])

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
      className="h-36 rounded-lg border border-nerv-border bg-nerv-card overflow-hidden relative pointer-events-none">
      <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/80 border border-nerv-border">
        <div className="w-1.5 h-1.5 rounded-full bg-nerv-green animate-pulse" />
        <span className="text-[9px] font-mono font-bold text-slate-300">{t('gpsTelemetryMesh')}</span>
      </div>
      <Map
        viewport={{
          center: pos ?? [PALU_CENTER[1], PALU_CENTER[0]],
          zoom: pos ? 16 : 13
        }}
        interactive={false}
      >
        {pos && (
          <MapMarker longitude={pos[0]} latitude={pos[1]}>
            <MarkerContent>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2, pointerEvents:'none', position:'relative' }}>
                <div style={{ position:'relative', width:20, height:20, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <div style={{ position:'absolute', width:20, height:20, borderRadius:'50%', background:'rgba(255,87,34,0.3)', animation:'haloPulse 2s infinite' }}></div>
                  <div style={{ position:'relative', width:12, height:12, borderRadius:'50%', background:'#FF5722', border:'2px solid white', boxShadow:'0 0 10px rgba(255,87,34,0.9)', zIndex:1 }}></div>
                </div>
                <span className="font-mono text-[8px] font-black px-1.5 py-0.5 rounded bg-black/90 text-nerv-orange border border-nerv-orange/40 uppercase tracking-widest mt-0.5">
                  {t('targetLock')}
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
  onNavigate: (page: 'navigate' | 'family' | 'guides') => void
  userLocation: string
  onBack?: () => void
  userName?: string
  onRequestGps?: () => void
  gpsTracking?: boolean
  tsunamiAlert?: boolean
  onOpenProfile?: () => void
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

export default function StatusPage({ onNavigate, userLocation, onBack, userName, onRequestGps, gpsTracking, tsunamiAlert, onOpenProfile }: Props) {
  const { lang, setLanguage, t } = useLanguage()
  const [safePressed, setSafePressed] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [pulseKey, setPulseKey] = useState(0)
  const [latestQuake, setLatestQuake] = useState<DisasterEvent | null>(null)

  // Fetch live disaster telemetry from integrated backend
  useEffect(() => {
    fetch('/api/disaster/home')
      .then(r => r.json())
      .then(d => {
        if (d?.informations && d.informations.length > 0) {
          const quake = d.informations.find((i: any) => i.type === 'earthquake')
          if (quake) setLatestQuake(quake)
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const t = setInterval(() => setPulseKey(k => k + 1), 3000)
    return () => clearInterval(t)
  }, [])

  const handleSafe = () => {
    setSafePressed(true)
    const now = new Date()
    setLastUpdated(`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')} WIB`)
    if ('vibrate' in navigator) navigator.vibrate([100, 50, 200])
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.22 }}
      className="fixed inset-0 z-[1800] flex flex-col overflow-y-auto custom-scrollbar bg-nerv-bg text-slate-200"
    >
      {/* NERV Telemetry Header */}
      <div className="shrink-0 px-4 pt-4 pb-3 border-b border-nerv-border bg-[#0B0F19] flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          {onBack && (
            <button onClick={onBack}
              className="w-8 h-8 rounded bg-nerv-card border border-nerv-border flex items-center justify-center shrink-0 hover:border-nerv-orange transition-colors">
              <ChevronLeft className="w-4 h-4 text-slate-300" />
            </button>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-2 h-2 rounded-full bg-nerv-orange animate-ping" />
              <p className="text-[8px] sm:text-[9px] font-mono font-bold tracking-wider text-nerv-orange uppercase truncate">
                A.T.L.A.S // AUTONOMOUS THREAT LOCATION & ALERT SYSTEM
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-nerv-cyan shrink-0" />
              <h2 className="text-xs sm:text-sm font-mono font-bold text-white truncate">
                {userLocation || t('detectingLocation')}
              </h2>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setLanguage(lang === 'id' ? 'en' : 'id')}
            className="flex items-center gap-1 px-2 py-1 rounded bg-black/60 border border-nerv-border hover:border-nerv-orange text-[10px] font-mono font-bold text-slate-300 transition-colors"
            title="Switch Language (ID/EN)"
          >
            <Globe className="w-3 h-3 text-nerv-cyan" />
            <span className={lang === 'id' ? 'text-nerv-orange' : 'text-slate-500'}>ID</span>
            <span className="text-slate-600">/</span>
            <span className={lang === 'en' ? 'text-nerv-orange' : 'text-slate-500'}>EN</span>
          </button>
          <button
            onClick={onOpenProfile}
            className="px-2.5 py-1 rounded bg-black/60 border border-nerv-border hover:border-nerv-cyan text-right font-mono transition-colors"
            title="Pengaturan Profil"
          >
            <span className="text-[8px] text-slate-500 block uppercase leading-none">NODE</span>
            <span className="text-xs font-bold text-nerv-cyan">#{userName ? userName.slice(0, 4).toUpperCase() : 'CIV-01'}</span>
          </button>
        </div>
      </div>

      <div className="flex-1 px-4 py-4 space-y-3 font-sans">

        {/* NERV Live Disaster Broadcast Card */}
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
        <MiniMap />

        <div className="h-16" />
      </div>
    </motion.div>
  )
}
