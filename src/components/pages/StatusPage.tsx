// ═══════════════════════════════════════════════════════════════
// STATUS PAGE — Public User Home "I AM SAFE"
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect } from 'react'
import { MapPin, Users, BookOpen, ChevronRight, CheckCircle, Heart, Activity, ChevronLeft, Locate } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

const FAMILY_PREVIEW = [
  { initials: 'AY', color: '#6366f1' },
  { initials: 'RD', color: '#10b981' },
  { initials: 'SJ', color: '#f59e0b' },
]

interface Props {
  onNavigate: (page: 'navigate' | 'family' | 'guides') => void
  userLocation: string
  onBack?: () => void
  userName?: string
  onRequestGps?: () => void
  gpsTracking?: boolean
}

export default function StatusPage({ onNavigate, userLocation, onBack, userName, onRequestGps, gpsTracking }: Props) {
  const [safePressed, setSafePressed] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [riskLevel] = useState<'low' | 'medium' | 'high'>('low')
  const [pulseKey, setPulseKey] = useState(0)

  // Animate the button ring
  useEffect(() => {
    const t = setInterval(() => setPulseKey(k => k + 1), 3000)
    return () => clearInterval(t)
  }, [])

  const handleSafe = () => {
    setSafePressed(true)
    const now = new Date()
    setLastUpdated(`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')} WIB`)
    if ('vibrate' in navigator) navigator.vibrate([100, 50, 200])
  }

  const riskConfig = {
    low: { label: 'LOW RISK', color: '#f59e0b', bg: 'bg-amber-500/10', border: 'border-amber-500/30', icon: '✓' },
    medium: { label: 'MEDIUM RISK', color: '#f59e0b', bg: 'bg-amber-500/10', border: 'border-amber-500/30', icon: '!' },
    high: { label: 'HIGH RISK', color: '#ef4444', bg: 'bg-red-500/10', border: 'border-red-500/30', icon: '!' },
  }[riskLevel]

  return (
    <motion.div
      initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.22 }}
      className="fixed inset-0 z-[1800] flex flex-col overflow-y-auto custom-scrollbar"
      style={{ background: '#080e1a' }}
    >
      {/* Header */}
      <div className="shrink-0 px-4 pt-4 pb-3 border-b border-slate-800/60 flex items-center gap-3" style={{ background: '#0a1020' }}>
        {onBack && (
          <button onClick={onBack}
            className="w-8 h-8 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center shrink-0 hover:bg-slate-700 transition-colors">
            <ChevronLeft className="w-4 h-4 text-slate-400" />
          </button>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-0.5">Current Location</p>
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <h2 className="text-lg font-black text-white leading-tight truncate">
              {userLocation || 'Palu, Sulawesi Tengah'}
            </h2>
          </div>
        </div>
        {userName && (
          <div className="shrink-0 w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
            <span className="text-xs font-black text-indigo-300">{userName.charAt(0).toUpperCase()}</span>
          </div>
        )}
      </div>

      {/* GPS Activation Banner — shown when GPS not active */}
      {!gpsTracking && onRequestGps && (
        <div className="shrink-0 px-4 py-3 flex items-center gap-3 border-b border-amber-800/30" style={{ background: '#1a1000' }}>
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
            <Locate className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-black text-amber-300">GPS Belum Aktif</p>
            <p className="text-[10px] text-amber-500/70">Aktifkan untuk navigasi evakuasi real-time</p>
          </div>
          <button onClick={onRequestGps}
            className="shrink-0 px-3 py-1.5 rounded-xl bg-amber-500 text-black font-black text-[11px] tracking-wide">
            AKTIFKAN
          </button>
        </div>
      )}

      <div className="flex-1 px-4 py-4 space-y-4">

        {/* System Status */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className={`p-4 rounded-2xl border ${riskConfig.bg} ${riskConfig.border}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">System Status</p>
              <p className="text-xl font-black" style={{ color: riskConfig.color }}>{riskConfig.label}</p>
            </div>
            <div className="w-10 h-10 rounded-full flex items-center justify-center border-2"
              style={{ borderColor: riskConfig.color, color: riskConfig.color }}>
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
        </motion.div>

        {/* I AM SAFE Button */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="p-5 rounded-2xl border border-slate-700/40 text-center"
          style={{ background: '#0f1a2e' }}
        >
          <h3 className="text-2xl font-black text-white mb-1">ARE YOU SAFE?</h3>
          <p className="text-xs text-slate-400 mb-5 leading-relaxed">
            Let your family and authorities know your<br />current status. Your location will be shared automatically.
          </p>

          {/* Big I AM SAFE button */}
          <div className="relative flex justify-center mb-4">
            {/* Animated pulse rings */}
            <AnimatePresence>
              {!safePressed && (
                <>
                  <motion.div
                    key={`ring1-${pulseKey}`}
                    initial={{ scale: 1, opacity: 0.4 }}
                    animate={{ scale: 1.6, opacity: 0 }}
                    transition={{ duration: 2.5, ease: 'easeOut' }}
                    className="absolute inset-0 rounded-2xl border-2 border-indigo-400"
                    style={{ margin: '0 auto', width: 140, height: 140 }}
                  />
                  <motion.div
                    key={`ring2-${pulseKey}`}
                    initial={{ scale: 1, opacity: 0.25 }}
                    animate={{ scale: 1.9, opacity: 0 }}
                    transition={{ duration: 2.5, delay: 0.4, ease: 'easeOut' }}
                    className="absolute inset-0 rounded-2xl border border-indigo-400"
                    style={{ margin: '0 auto', width: 140, height: 140 }}
                  />
                </>
              )}
            </AnimatePresence>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleSafe}
              className={`relative w-[140px] h-[140px] rounded-2xl flex flex-col items-center justify-center gap-2 font-black text-lg transition-all duration-300 ${
                safePressed
                  ? 'bg-emerald-500 text-white shadow-[0_8px_32px_rgba(34,197,94,0.4)]'
                  : 'bg-indigo-600 text-white shadow-[0_8px_32px_rgba(99,102,241,0.4)] hover:bg-indigo-500'
              }`}
            >
              {safePressed ? <CheckCircle className="w-10 h-10" /> : <span className="text-4xl">✋</span>}
              <span className="text-sm font-black tracking-wide">{safePressed ? 'CONFIRMED' : 'I AM SAFE'}</span>
            </motion.button>
          </div>

          {lastUpdated && (
            <motion.p
              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
              className="text-[11px] text-emerald-400 font-bold"
            >
              LAST UPDATED: {lastUpdated}
            </motion.p>
          )}
        </motion.div>

        {/* Family Status */}
        <motion.button
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          onClick={() => onNavigate('family')}
          className="w-full p-4 rounded-2xl border border-slate-700/40 text-left flex items-center justify-between"
          style={{ background: '#0f1a2e' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
              <Users className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-0.5">Family Status</p>
              <p className="text-sm font-bold text-white">Circle Protected</p>
              <div className="flex items-center gap-2 mt-1.5">
                <div className="flex -space-x-1">
                  {FAMILY_PREVIEW.map((m, i) => (
                    <div key={i} className="w-6 h-6 rounded-full border-2 border-[#0f1a2e] flex items-center justify-center text-[9px] font-black text-white"
                      style={{ background: m.color }}>
                      {m.initials[0]}
                    </div>
                  ))}
                </div>
                <span className="text-[10px] text-slate-400">+2</span>
              </div>
              <p className="text-[10px] text-emerald-400 mt-1">All 4 members have checked in safely.</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-600 shrink-0" />
        </motion.button>

        {/* Resources */}
        <motion.button
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          onClick={() => onNavigate('guides')}
          className="w-full p-4 rounded-2xl border border-slate-700/40 text-left flex items-center justify-between"
          style={{ background: '#0f1a2e' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-rose-400" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-0.5">Resources</p>
              <p className="text-sm font-bold text-white">First Aid Guides</p>
              <div className="flex items-center gap-2 mt-1.5">
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-700/50 border border-slate-600/40">
                  <Heart className="w-3 h-3 text-rose-400" />
                  <span className="text-[10px] text-slate-300 font-bold">Basic CPR</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-700/50 border border-slate-600/40">
                  <Activity className="w-3 h-3 text-amber-400" />
                  <span className="text-[10px] text-slate-300 font-bold">Trauma Kit</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Download offline-ready instructions.</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-600 shrink-0" />
        </motion.button>

        {/* Mini location map placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="h-32 rounded-2xl border border-slate-700/40 overflow-hidden relative"
          style={{ background: '#060d1a' }}
        >
          <svg width="100%" height="100%" viewBox="0 0 300 128" preserveAspectRatio="none" className="opacity-30">
            {[0,1,2,3].map(i => <line key={`h${i}`} x1="0" y1={i*40} x2="300" y2={i*40} stroke="#1e293b" strokeWidth="1"/>)}
            {[0,1,2,3,4,5].map(i => <line key={`v${i}`} x1={i*60} y1="0" x2={i*60} y2="128" stroke="#1e293b" strokeWidth="1"/>)}
            <path d="M0,80 C50,70 100,50 150,55 C200,60 250,45 300,40" stroke="#334155" strokeWidth="2" fill="none"/>
            <path d="M0,100 C60,95 120,85 180,80 C240,75 280,70 300,65" stroke="#334155" strokeWidth="1.5" fill="none"/>
          </svg>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-indigo-400 border-2 border-white shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
            <span className="text-[9px] bg-indigo-600/80 text-white px-2 py-0.5 rounded-full font-bold tracking-wide">YOU ARE HERE</span>
          </div>
          <div className="absolute bottom-2 right-2">
            <div className="w-7 h-7 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
            </div>
          </div>
        </motion.div>

        <div className="h-20" />
      </div>
    </motion.div>
  )
}
