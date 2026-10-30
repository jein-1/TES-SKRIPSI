import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { 
  Shield, 
  MapPin, 
  AlertTriangle, 
  Users, 
  CheckCircle2, 
  Radio, 
  Navigation, 
  Battery, 
  Wifi, 
  Signal, 
  Clock,
  Compass,
  ArrowUpRight,
  Activity
} from 'lucide-react'

export type MockupMode = 'map' | 'broadcast' | 'family'

interface DeviceMockupProps {
  activeMode?: MockupMode
  onModeChange?: (mode: MockupMode) => void
  interactive?: boolean
}

export const DeviceMockup: React.FC<DeviceMockupProps> = ({
  activeMode = 'map',
  onModeChange,
  interactive = true
}) => {
  const [internalMode, setInternalMode] = useState<MockupMode>(activeMode)
  const [countdownSec, setCountdownSec] = useState(39658) // 11:00:58
  const [isIslandExpanded, setIsIslandExpanded] = useState(false)

  useEffect(() => {
    setInternalMode(activeMode)
  }, [activeMode])

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdownSec((prev) => (prev > 0 ? prev - 1 : 39600))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const currentMode = interactive ? internalMode : activeMode

  const handleTabClick = (mode: MockupMode) => {
    setInternalMode(mode)
    if (onModeChange) onModeChange(mode)
  }

  // Format countdown
  const hours = Math.floor(countdownSec / 3600)
  const minutes = Math.floor((countdownSec % 3600) / 60)
  const seconds = countdownSec % 60
  const timeFormatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  return (
    <div className="relative mx-auto flex flex-col items-center">
      {/* Mode Selector Tabs (Apple Pill Segmented Control) */}
      <div className="mb-6 flex items-center gap-1.5 p-1 rounded-full bg-white/[0.06] backdrop-blur-xl border border-white/[0.1] shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        {[
          { key: 'map', label: 'Peta Satelit', icon: Navigation },
          { key: 'broadcast', label: 'Siaran Resmi', icon: Radio },
          { key: 'family', label: 'Radar Keluarga', icon: Users },
        ].map((tab) => {
          const Icon = tab.icon
          const isActive = currentMode === tab.key
          return (
            <motion.button
              whileTap={{ scale: 0.95 }}
              key={tab.key}
              type="button"
              onClick={() => handleTabClick(tab.key as MockupMode)}
              className={`relative px-4 py-2 rounded-full text-xs font-medium transition-all flex items-center gap-2 cursor-pointer min-h-[40px] ${
                isActive ? 'text-white font-semibold' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="mockupTabPill"
                  className="absolute inset-0 rounded-full bg-white/[0.15] border border-white/[0.2] shadow-sm"
                  transition={{ type: 'spring', damping: 26, stiffness: 280, bounce: 0 }}
                />
              )}
              <Icon className="w-3.5 h-3.5 relative z-10" />
              <span className="relative z-10">{tab.label}</span>
            </motion.button>
          )
        })}
      </div>

      {/* Ambient Radar Wave Rings Behind Device */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none w-full h-full flex items-center justify-center -z-10">
        <motion.div 
          animate={{ scale: [1, 1.25, 1], opacity: [0.25, 0.08, 0.25] }}
          transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut" }}
          className="absolute w-[360px] sm:w-[410px] h-[700px] sm:h-[750px] rounded-[64px] border border-orange-500/20 shadow-[0_0_50px_rgba(255,87,34,0.15)]"
        />
        <motion.div 
          animate={{ scale: [1, 1.45, 1], opacity: [0.15, 0.03, 0.15] }}
          transition={{ repeat: Infinity, duration: 6, ease: "easeInOut", delay: 1 }}
          className="absolute w-[420px] sm:w-[480px] h-[760px] sm:h-[820px] rounded-[72px] border border-cyan-500/15"
        />
      </div>

      {/* Titanium Device Frame with Apple Fluid Float */}
      <motion.div 
        animate={{ y: [-6, 6, -6] }}
        transition={{ repeat: Infinity, duration: 5.5, ease: "easeInOut" }}
        className="relative w-[320px] sm:w-[350px] h-[660px] sm:h-[700px] rounded-[52px] p-3.5 bg-gradient-to-b from-neutral-700 via-neutral-900 to-black shadow-[0_25px_80px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.15),inset_0_0_2px_1px_rgba(255,255,255,0.2)]"
      >
        {/* Antenna bands */}
        <div className="absolute -left-[2px] top-28 w-[3px] h-8 bg-neutral-800 rounded-l" />
        <div className="absolute -left-[2px] top-40 w-[3px] h-12 bg-neutral-800 rounded-l" />
        <div className="absolute -left-[2px] top-56 w-[3px] h-12 bg-neutral-800 rounded-l" />
        <div className="absolute -right-[2px] top-36 w-[3px] h-16 bg-neutral-800 rounded-r" />

        {/* Inner OLED Display Bezel */}
        <div className="relative w-full h-full rounded-[44px] overflow-hidden bg-[#07090e] border border-neutral-950 flex flex-col shadow-inner select-none">
          {/* Dynamic Island & Status Bar */}
          <div className="pt-3 px-5 pb-2 flex items-center justify-between z-30 bg-gradient-to-b from-black/80 to-transparent">
            {/* Time */}
            <span className="text-[11px] font-semibold text-white tracking-tight">09:41</span>

            {/* Apple Fluid Dynamic Island */}
            <motion.div 
              onClick={() => setIsIslandExpanded(!isIslandExpanded)}
              animate={{ 
                width: isIslandExpanded ? 180 : 96,
                height: isIslandExpanded ? 34 : 24,
                borderRadius: isIslandExpanded ? 20 : 9999
              }}
              transition={{ type: 'spring', bounce: 0.15, duration: 0.35 }}
              className="bg-black flex items-center justify-between px-2.5 border border-white/[0.12] shadow-[0_4px_16px_rgba(0,0,0,0.8)] cursor-pointer"
              title="Ketuk untuk melihat status Dynamic Island"
            >
              {isIslandExpanded ? (
                <div className="flex items-center justify-between w-full px-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[9px] font-mono font-bold text-white">TELEMETRI HUD</span>
                  </div>
                  <span className="text-[8px] font-mono text-cyan-300 font-bold bg-white/10 px-1 py-0.5 rounded">±1.2m</span>
                </div>
              ) : (
                <div className="flex items-center justify-between w-full">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[9px] font-mono text-neutral-300 font-bold tracking-wider">A.T.L.A.S</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                </div>
              )}
            </motion.div>

            {/* Status Icons */}
            <div className="flex items-center gap-1.5 text-white">
              <Signal className="w-3 h-3 text-white" />
              <Wifi className="w-3 h-3 text-white" />
              <Battery className="w-3.5 h-3.5 text-white" />
            </div>
          </div>

          {/* Screen Content Container */}
          <div className="relative flex-1 flex flex-col overflow-hidden bg-gradient-to-b from-[#07090E] via-[#0B0F19] to-[#07090E]">
            <AnimatePresence mode="wait">
              {currentMode === 'map' && (
                <motion.div
                  key="screen-map"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.25 }}
                  className="flex-1 flex flex-col p-3 relative"
                >
                  {/* Map Visual Background */}
                  <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]" />
                  
                  {/* Decorative contour lines */}
                  <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M-20,100 C100,80 200,200 350,150 C450,120 400,300 500,280" fill="none" stroke="#FF5722" strokeWidth="1.5" strokeDasharray="4 4" />
                    <path d="M-20,250 C120,220 180,350 320,310 C400,280 420,450 500,420" fill="none" stroke="#00E5FF" strokeWidth="1" />
                    <circle cx="160" cy="280" r="60" fill="rgba(255, 87, 34, 0.08)" stroke="#FF5722" strokeWidth="1" />
                  </svg>

                  {/* Top Bar inside app */}
                  <div className="relative z-10 flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-orange-500/20 border border-orange-500/40 flex items-center justify-center">
                        <img src="/atlas-logo-user.png" alt="A.T.L.A.S" className="w-5 h-5 object-contain" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-bold text-white tracking-wider">A.T.L.A.S //</span>
                          <span className="text-[8px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-mono font-bold">GPS AKTIF</span>
                        </div>
                        <p className="text-[9px] text-neutral-400">Kota Palu · Sektor Teluk</p>
                      </div>
                    </div>
                    <div className="w-7 h-7 rounded-full bg-white/[0.08] flex items-center justify-center text-neutral-300">
                      <Compass className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  {/* Satellite Accuracy Pill */}
                  <div className="relative z-10 mx-auto mb-auto px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center gap-2 shadow-lg">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                    <span className="text-[10px] font-mono text-cyan-300">Sharelock Presisi: ± 1.2 m</span>
                  </div>

                  {/* Map Pin Mockup Center */}
                  <div className="relative z-10 my-auto flex flex-col items-center">
                    <motion.div
                      animate={{ y: [0, -4, 0] }}
                      transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                      className="relative flex flex-col items-center"
                    >
                      <div className="px-2.5 py-1 rounded-lg bg-orange-600 text-white font-mono text-[9px] font-bold shadow-[0_0_20px_rgba(255,87,34,0.6)] flex items-center gap-1 mb-1">
                        <MapPin className="w-3 h-3" />
                        <span>SHELTER BALAI KOTA (ELEVASI 42M)</span>
                      </div>
                      <div className="w-3.5 h-3.5 rounded-full bg-orange-500 border-2 border-white shadow-md animate-pulse" />
                    </motion.div>
                  </div>

                  {/* Bottom Route Card */}
                  <div className="relative z-10 p-3 rounded-2xl bg-neutral-900/90 backdrop-blur-xl border border-white/[0.12] shadow-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                          <Navigation className="w-3 h-3" />
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-white">Jalur Evakuasi Bebas Bahaya</p>
                          <p className="text-[9px] text-neutral-400">Menghindari Zona Sesar & Pesisir</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-emerald-400">AMAN</span>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 pt-1 text-center font-mono">
                      <div className="p-1.5 rounded-lg bg-white/[0.04] border border-white/[0.05]">
                        <span className="block text-[8px] text-neutral-400 uppercase">Jarak</span>
                        <span className="text-[11px] font-bold text-white">1.4 KM</span>
                      </div>
                      <div className="p-1.5 rounded-lg bg-white/[0.04] border border-white/[0.05]">
                        <span className="block text-[8px] text-neutral-400 uppercase">Waktu</span>
                        <span className="text-[11px] font-bold text-cyan-300">14 Mnt</span>
                      </div>
                      <div className="p-1.5 rounded-lg bg-white/[0.04] border border-white/[0.05]">
                        <span className="block text-[8px] text-neutral-400 uppercase">Ketinggian</span>
                        <span className="text-[11px] font-bold text-orange-400">+42 M</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {currentMode === 'broadcast' && (
                <motion.div
                  key="screen-broadcast"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.25 }}
                  className="flex-1 flex flex-col p-3 relative space-y-3"
                >
                  {/* Header Title */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-orange-400 font-bold tracking-widest uppercase">Pusat Siaran Darurat</span>
                      <h3 className="text-xs font-black text-white">INSTRUKSI POSKO SIAGA</h3>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-red-500/20 text-red-400 border border-red-500/40 text-[9px] font-mono font-bold">
                      SIAGA TINGGI
                    </span>
                  </div>

                  {/* Golden Broadcast Card (Sesuai Gambar 3 & Update ATLAS) */}
                  <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-950/40 via-neutral-900/90 to-black border border-amber-500/50 shadow-[0_0_25px_rgba(245,158,11,0.2)] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        SIARAN RESMI
                      </span>
                      {/* Apple-style Golden Capsule SISA: JJ:MM:DD */}
                      <div className="flex items-center gap-1.5 text-[9px] font-mono text-amber-300 bg-amber-950/80 border border-amber-500/60 px-2.5 py-0.5 rounded-full shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                        <span className="font-bold">SISA: {timeFormatted}</span>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-black text-white tracking-tight">
                        EVAKUASI SEGERA KE TEMPAT TINGGI
                      </h4>
                      <p className="text-[10px] text-neutral-300 leading-relaxed mt-1 font-sans">
                        Instruksi evakuasi darurat. Warga di sekitar pesisir Teluk Palu segera menuju titik kumpul shelter di atas elevasi 30 meter.
                      </p>
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t border-white/[0.08]">
                      <span className="text-[9px] font-mono text-neutral-400">Dari: Posko Siaga Pusat</span>
                      <button
                        type="button"
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[9px] font-mono font-bold flex items-center gap-1 active:scale-95"
                      >
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" /> SAYA MEMATUHI
                      </button>
                    </div>
                  </div>

                  {/* Live Earthquake Info Notice Card */}
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center gap-2.5">
                    <Activity className="w-4 h-4 text-rose-400 shrink-0 animate-pulse" />
                    <div>
                      <p className="text-[10px] font-bold text-white">Informasi Gempa Tepat & Akurat</p>
                      <p className="text-[8px] text-neutral-400 leading-tight">
                        Peringatan magnitudo, kedalaman, dan kalkulasi dini ancaman tsunami real-time.
                      </p>
                    </div>
                  </div>

                  {/* Emergency Siren Preview */}
                  <div className="mt-auto p-2.5 rounded-xl bg-orange-950/20 border border-orange-500/30 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-orange-400 animate-ping" />
                      <span className="text-[9px] font-mono text-orange-300 font-bold">Sirine Peringatan Khas</span>
                    </div>
                    <span className="text-[8px] text-neutral-400 font-mono">Tembus Mode Hening</span>
                  </div>
                </motion.div>
              )}

              {currentMode === 'family' && (
                <motion.div
                  key="screen-family"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.25 }}
                  className="flex-1 flex flex-col p-3 relative space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-cyan-400 font-bold tracking-widest uppercase">Radar Keluarga</span>
                      <h3 className="text-xs font-black text-white">UNIT TERKONEKSI (3)</h3>
                    </div>
                    <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                      SEMUA AMAN ✓
                    </span>
                  </div>

                  {/* Family Member 1 */}
                  <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                        IB
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-white">Ibu (Rumah)</p>
                        <p className="text-[9px] text-neutral-400">Jarak: 800 meter · Baterai 88%</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                      AMAN ✓
                    </span>
                  </div>

                  {/* Family Member 2 */}
                  <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs">
                        AY
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-white">Ayah (Kantor)</p>
                        <p className="text-[9px] text-neutral-400">Jarak: 2.1 KM · Baterai 74%</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                      AMAN ✓
                    </span>
                  </div>

                  {/* Quick Action Button in Mockup */}
                  <div className="mt-auto pt-2 space-y-2">
                    <button
                      type="button"
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] tracking-wide flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-900/30 active:scale-[0.98] transition-all"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      KIRIM STATUS: SAYA AMAN ✓
                    </button>
                    <p className="text-[8px] text-neutral-500 text-center font-mono">
                      Sinkronisasi timbal balik otomatis via QR Code & Enkripsi Lokal
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bottom Home Indicator Line (iPhone style) */}
            <div className="py-2 flex justify-center z-30">
              <div className="w-32 h-1 bg-white/30 rounded-full" />
            </div>
          </div>
        </div>

        {/* Ambient Display Glow Behind Chassis */}
        <div className="absolute -inset-4 rounded-[60px] bg-gradient-to-b from-orange-500/10 via-cyan-500/5 to-transparent blur-2xl -z-10 pointer-events-none" />
      </motion.div>
    </div>
  )
}
export default DeviceMockup
