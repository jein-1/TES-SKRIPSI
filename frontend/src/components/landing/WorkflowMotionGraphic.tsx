import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { 
  Radio, 
  Satellite, 
  Navigation, 
  Users, 
  ShieldAlert, 
  Clock, 
  MapPin, 
  AlertTriangle, 
  CheckCircle2, 
  Compass, 
  Volume2, 
  Check, 
  Play, 
  Pause, 
  ArrowRight,
  TrendingUp,
  Zap,
  Activity
} from 'lucide-react'

interface WorkflowStep {
  id: string
  number: string
  badge: string
  title: string
  shortDesc: string
  details: string[]
  accentColor: string
  accentBorder: string
  accentBg: string
}

const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    id: 'alert',
    number: '01',
    badge: 'SIARAN RESMI & SPANDUK EVAKUASI',
    title: 'Penerimaan Siaran Darurat Otoritas Resmi',
    shortDesc: 'A.T.L.A.S seketika memproses instruksi langsung dari Pusat Penanggulangan Bencana Resmi (BPBD / SAR) dan membentangkan spanduk siaga evakuasi di layar ponsel warga.',
    details: [
      'Lencana verifikasi otoritas tertinggi berkode emas',
      'Spanduk arahan evakuasi turun otomatis di layar warga',
      'Deteksi telemetri gempa & peringatan dini tsunami seketika'
    ],
    accentColor: '#f59e0b',
    accentBorder: 'rgba(245, 158, 11, 0.4)',
    accentBg: 'rgba(245, 158, 11, 0.12)'
  },
  {
    id: 'gps',
    number: '02',
    badge: 'PENGUNCIAN SATELIT PRESISI',
    title: 'Penguncian Sharelock Satelit Tanpa Jeda Waktu',
    shortDesc: 'Sensor GNSS dan GPS satelit mengunci posisi Anda secara seketika dengan filter peredam koordinat melompat hingga presisi tinggi ±1.2m.',
    details: [
      'Pembaruan koordinat 0 milidetik tanpa cache basi',
      'Peredaman multi-pantulan gedung bertingkat perkotaan',
      'Pengukuran akurasi real-time untuk keandalan rute'
    ],
    accentColor: '#06b6d4',
    accentBorder: 'rgba(6, 182, 212, 0.4)',
    accentBg: 'rgba(6, 182, 212, 0.12)'
  },
  {
    id: 'routing',
    number: '03',
    badge: 'JALUR OTONOM BEBAS HAMBATAN',
    title: 'Kalkulasi Rute Mandiri Menuju Titik Kumpul Aman',
    shortDesc: 'Algoritma otonom menghitung jalur jalan raya nyata, otomatis mengarahkan warga menuju shelter penampungan di dataran tinggi yang aman.',
    details: [
      'Panduan jalur tercepat menuju shelter evakuasi terdekat',
      'Navigasi mengikuti jalan raya nyata & jembatan kokoh',
      'Penentuan titik kumpul vertikal di dataran tinggi aman'
    ],
    accentColor: '#f97316',
    accentBorder: 'rgba(249, 115, 22, 0.4)',
    accentBg: 'rgba(249, 115, 22, 0.12)'
  },
  {
    id: 'family',
    number: '04',
    badge: 'RADAR KELUARGA & STATUS AMAN',
    title: 'Sinkronisasi Radar Unit Keluarga & Konfirmasi "SAYA AMAN ✓"',
    shortDesc: 'Saling memantau posisi anggota keluarga dalam satu radar keselamatan keluarga dan melapor status keselamatan dengan sekali ketukan.',
    details: [
      'Penautan unit keluarga aman via kode privat 6-digit',
      'Pantauan posisi timbal-balik anggota keluarga di peta',
      'Laporan kilat SAYA AMAN ✓ yang tersinkron instan'
    ],
    accentColor: '#10b981',
    accentBorder: 'rgba(16, 185, 129, 0.4)',
    accentBg: 'rgba(16, 185, 129, 0.12)'
  }
]

export const WorkflowMotionGraphic: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [progress, setProgress] = useState(0)
  const [advisoryUrgentActive, setAdvisoryUrgentActive] = useState(true)
  const [userAccuracySettled, setUserAccuracySettled] = useState(false)
  const [routeAvoidanceActive, setRouteAvoidanceActive] = useState(true)
  const [familyPingSent, setFamilyPingSent] = useState(false)

  const stepDuration = 6000 // 6 seconds per stage
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const progressInterval = 50

  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setActiveStep((s) => (s + 1) % WORKFLOW_STEPS.length)
          return 0
        }
        return prev + (progressInterval / stepDuration) * 100
      })
    }, progressInterval)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isPlaying, activeStep])

  const selectStep = (index: number) => {
    setActiveStep(index)
    setProgress(0)
  }

  const togglePlay = () => {
    setIsPlaying(!isPlaying)
  }

  const current = WORKFLOW_STEPS[activeStep]

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6">
      
      {/* ── SECTION HEADER (Apple Keynote Style) ────────────────────── */}
      <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 space-y-4">
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 backdrop-blur-xl shadow-inner"
        >
          <Zap className="w-3.5 h-3.5 text-orange-400" />
          <span className="text-[11px] font-mono font-bold tracking-widest text-orange-300 uppercase">
            ALUR OPERASIONAL PENYELAMATAN NYATA
          </span>
        </motion.div>

        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-[-0.035em] text-white leading-[1.08]">
          Bagaimana A.T.L.A.S Bergerak <br className="hidden sm:block" />
          <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-cyan-400 bg-clip-text text-transparent">
            Di Detik Pertama Bencana.
          </span>
        </h2>

        <p className="text-neutral-400 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto font-normal">
          Dari siaran darurat otoritas resmi diterima hingga Anda dan keluarga selamat di tempat perlindungan tertinggi. Saksikan orkestrasi teknologi pertahanan sipil mandiri yang bekerja secara otonom.
        </p>
      </div>

      {/* ── APPLE SEGMENTED CONTROL / STAGE SELECTOR PILLS ───────────── */}
      <div className="relative mb-8 sm:mb-12">
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2 scrollbar-none">
          {WORKFLOW_STEPS.map((step, idx) => {
            const isActive = activeStep === idx
            return (
              <button
                key={step.id}
                onClick={() => selectStep(idx)}
                className={`relative flex-1 min-w-[210px] sm:min-w-0 p-3 sm:p-4 rounded-2xl border text-left transition-all duration-300 group cursor-pointer ${
                  isActive 
                    ? 'bg-neutral-900/90 border-white/20 shadow-[0_8px_30px_rgba(0,0,0,0.6)]' 
                    : 'bg-neutral-950/40 border-white/[0.06] hover:bg-neutral-900/40 hover:border-white/10'
                }`}
              >
                {/* Active Apple Background Glow */}
                {isActive && (
                  <motion.div 
                    layoutId="activeStepGlow"
                    className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/[0.06] to-transparent pointer-events-none"
                    transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
                  />
                )}

                <div className="relative z-10 flex items-center justify-between mb-2">
                  <span className={`font-mono text-xs font-black px-2 py-0.5 rounded-lg border ${
                    isActive 
                      ? 'bg-white/10 text-white border-white/20' 
                      : 'bg-neutral-800/60 text-neutral-500 border-neutral-700/50'
                  }`}>
                    {step.number}
                  </span>
                  
                  <span className="text-[10px] font-mono tracking-wider text-neutral-400 uppercase hidden lg:block">
                    {step.badge.split(' ')[0]}
                  </span>
                </div>

                <p className={`text-xs sm:text-sm font-bold line-clamp-1 transition-colors ${
                  isActive ? 'text-white' : 'text-neutral-400 group-hover:text-neutral-200'
                }`}>
                  {step.title.split('&')[0]}
                </p>

                {/* Progress bar line for active step */}
                <div className="mt-3 w-full h-1 bg-white/[0.06] rounded-full overflow-hidden">
                  {isActive && (
                    <motion.div 
                      className="h-full rounded-full"
                      style={{ 
                        width: `${progress}%`,
                        backgroundColor: step.accentColor,
                        boxShadow: `0 0 10px ${step.accentColor}`
                      }}
                    />
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* Play / Pause indicator */}
        <div className="flex items-center justify-end gap-3 pt-3 text-[11px] font-mono text-neutral-400">
          <button 
            onClick={togglePlay}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.05] hover:bg-white/10 border border-white/10 text-neutral-300 hover:text-white transition-all cursor-pointer"
          >
            {isPlaying ? (
              <>
                <Pause className="w-3 h-3 text-orange-400" />
                <span>Otomatis Berjalan</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 text-cyan-400" />
                <span>Putar Otomatis</span>
              </>
            )}
          </button>
          <span className="text-neutral-600">•</span>
          <span>Fase {activeStep + 1} dari 4</span>
        </div>
      </div>

      {/* ── MOTION GRAPHIC HERO THEATER (CANVAS CONTAINER) ───────────── */}
      <div className="relative rounded-3xl p-6 sm:p-10 lg:p-12 bg-gradient-to-br from-[#07090E] via-[#0B0F19] to-black border border-white/[0.1] shadow-[0_20px_80px_rgba(0,0,0,0.8)] overflow-hidden">
        
        {/* Dynamic Ambient Glow Behind Graphic */}
        <div 
          className="absolute -top-32 -right-32 w-96 h-96 rounded-full blur-[120px] pointer-events-none transition-colors duration-700 opacity-40"
          style={{ backgroundColor: current.accentColor }}
        />
        <div 
          className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full blur-[120px] pointer-events-none transition-colors duration-700 opacity-20"
          style={{ backgroundColor: current.accentColor }}
        />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* LEFT: Stage Information & Real-world details (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            <div className="space-y-2">
              <div 
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider"
                style={{ 
                  backgroundColor: current.accentBg, 
                  color: current.accentColor,
                  border: `1px solid ${current.accentBorder}`
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full animate-ping" style={{ backgroundColor: current.accentColor }} />
                <span>FASE {current.number} // {current.badge}</span>
              </div>

              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
                {current.title}
              </h3>
            </div>

            <p className="text-sm sm:text-base text-neutral-300 leading-relaxed font-normal">
              {current.shortDesc}
            </p>

            {/* Checklist Points */}
            <div className="space-y-3 pt-2">
              {current.details.map((point, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.3 }}
                  className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]"
                >
                  <div 
                    className="w-5 h-5 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                    style={{ backgroundColor: current.accentBg, color: current.accentColor }}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                  <span className="text-xs sm:text-sm text-neutral-200 leading-snug">
                    {point}
                  </span>
                </motion.div>
              ))}
            </div>

            {/* Interactive Control for the specific stage */}
            <div className="pt-2">
              {activeStep === 0 && (
                <button
                  onClick={() => setAdvisoryUrgentActive(!advisoryUrgentActive)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold transition-all cursor-pointer active:scale-95"
                >
                  <Radio className={`w-4 h-4 ${advisoryUrgentActive ? 'animate-pulse text-amber-400' : ''}`} />
                  <span>{advisoryUrgentActive ? 'Status: Instruksi Evakuasi Aktif' : 'Simulasi: Siaga Standby'}</span>
                </button>
              )}

              {activeStep === 1 && (
                <button
                  onClick={() => setUserAccuracySettled(!userAccuracySettled)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold transition-all cursor-pointer active:scale-95"
                >
                  <Satellite className="w-4 h-4 text-cyan-400" />
                  <span>{userAccuracySettled ? 'Kunci GNSS Presisi (±1.2m)' : 'Simulasi Drift Satelit'}</span>
                </button>
              )}

              {activeStep === 2 && (
                <button
                  onClick={() => setRouteAvoidanceActive(!routeAvoidanceActive)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500/15 hover:bg-orange-500/25 border border-orange-500/30 text-orange-300 text-xs font-mono font-bold transition-all cursor-pointer active:scale-95"
                >
                  <ShieldAlert className="w-4 h-4 text-orange-400" />
                  <span>{routeAvoidanceActive ? 'Status: Jalur Aman Aktif' : 'Mode Jalur Langsung'}</span>
                </button>
              )}

              {activeStep === 3 && (
                <button
                  onClick={() => {
                    setFamilyPingSent(true)
                    setTimeout(() => setFamilyPingSent(false), 2500)
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold transition-all cursor-pointer active:scale-95"
                >
                  <CheckCircle2 className={`w-4 h-4 ${familyPingSent ? 'animate-bounce text-emerald-400' : ''}`} />
                  <span>{familyPingSent ? 'Status Terkirim: SAYA AMAN ✓' : 'Kirim Sinyal Status Aman'}</span>
                </button>
              )}
            </div>

          </div>

          {/* RIGHT: Motion Graphics Interactive Visual Stage (7 cols) */}
          <div className="lg:col-span-7">
            <div className="relative w-full aspect-[4/3] sm:aspect-[16/11] rounded-2xl bg-black/90 border border-white/[0.12] p-4 sm:p-6 overflow-hidden shadow-2xl flex flex-col justify-between">
              
              {/* Top HUD Telemetry Bar */}
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 text-[10px] font-mono text-neutral-400">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: current.accentColor }} />
                  <span className="text-white font-bold tracking-wider">A.T.L.A.S TELEMETRY ENGINE</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-neutral-500">KOTA PALU // 0.89° S</span>
                  <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-neutral-300">
                    LIVE SIM
                  </span>
                </div>
              </div>

              {/* ── CANVAS ANIMATION BODY PER STEP ───────────────────────── */}
              <div className="relative flex-1 my-4 flex items-center justify-center overflow-hidden">
                <AnimatePresence mode="wait">
                  
                  {/* ───────────────────────────────────────────────────────────
                      GRAPHIC 1: OFFICIAL COMMAND ADVISORY & TRANSMISSION WAVES
                  ──────────────────────────────────────────────────────────── */}
                  {activeStep === 0 && (
                    <motion.div
                      key="step-0-alert"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
                      className="w-full h-full flex flex-col items-center justify-center relative"
                    >
                      {/* Expanding radio telemetry broadcast shockwaves */}
                      <motion.div 
                        animate={{ scale: [1, 2.2], opacity: [0.6, 0] }}
                        transition={{ repeat: Infinity, duration: 2.2, ease: 'easeOut' }}
                        className="absolute w-36 h-36 rounded-full border border-amber-500/60 pointer-events-none"
                      />
                      <motion.div 
                        animate={{ scale: [1, 3], opacity: [0.4, 0] }}
                        transition={{ repeat: Infinity, duration: 2.2, delay: 0.6, ease: 'easeOut' }}
                        className="absolute w-36 h-36 rounded-full border border-orange-500/40 pointer-events-none"
                      />

                      {/* Drop-in Official Command Advisory Card */}
                      <motion.div 
                        initial={{ y: -40, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
                        className="w-full max-w-md p-4 rounded-2xl bg-gradient-to-br from-neutral-900/95 via-black to-neutral-900 border border-amber-500/60 backdrop-blur-2xl shadow-[0_10px_40px_rgba(245,158,11,0.25)] space-y-3 z-10"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                            <span className="text-[10px] font-mono font-black text-amber-300 uppercase tracking-widest flex items-center gap-1.5">
                              <Radio className="w-3 h-3 text-amber-400" />
                              PUSAT PENANGGULANGAN BENCANA // RESMI
                            </span>
                          </div>
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono text-[9px] font-black">
                            SIARAN RESMI TERVERIFIKASI
                          </span>
                        </div>

                        <div className="space-y-1">
                          <h4 className="text-sm font-black text-white tracking-tight">
                            {advisoryUrgentActive 
                              ? 'INSTRUKSI EVAKUASI SEGERA // SEKTOR PESISIR TELUK PALU' 
                              : 'STATUS SIAGA PANTAU // WILAYAH AMAN'}
                          </h4>
                          <p className="text-[11px] text-neutral-300 leading-relaxed">
                            {advisoryUrgentActive
                              ? 'Warga pesisir segera bergerak ke titik kumpul vertikal shelter di atas elevasi +35m.'
                              : 'Tetap waspada, pantau panduan mandiri dan pastikan unit keluarga terhubung.'}
                          </p>
                        </div>

                        {/* Telemetry handshake information */}
                        <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.04] border border-amber-500/30 text-xs font-mono">
                          <span className="text-neutral-400 text-[10px]">PROTOKOL TELEMETRI:</span>
                          <span className="text-amber-300 font-bold text-[10px]">
                            TELEMETRI SEISMIK & SIARAN AKTIF ✓
                          </span>
                        </div>
                      </motion.div>

                      {/* Live Telemetry Frequency Spectrum Visualizer Bars */}
                      <div className="w-full max-w-sm mt-4 flex flex-col items-center gap-1.5">
                        <div className="w-full flex items-end justify-center gap-1.5 h-10 px-2">
                          {[35, 65, 45, 80, 55, 75, 95, 80, 60, 90, 50, 75, 40, 85, 65, 55, 90, 75, 60, 40].map((val, idx) => (
                            <motion.div
                              key={idx}
                              animate={advisoryUrgentActive ? {
                                height: [`${val * 0.35}%`, `${val}%`, `${val * 0.45}%`],
                              } : { height: '18%' }}
                              transition={{
                                repeat: Infinity,
                                duration: 0.6 + (idx % 4) * 0.15,
                                ease: 'easeInOut'
                              }}
                              className="flex-1 rounded-full bg-gradient-to-t from-amber-500 via-orange-400 to-cyan-300"
                            />
                          ))}
                        </div>
                        <span className="text-[9px] font-mono text-neutral-500 tracking-wider">
                          SPEKTRUM FREKUENSI TELEMETRI DARURAT
                        </span>
                      </div>

                    </motion.div>
                  )}

                  {/* ───────────────────────────────────────────────────────────
                      GRAPHIC 2: SATELLITE SHARELOCK HUD
                  ──────────────────────────────────────────────────────────── */}
                  {activeStep === 1 && (
                    <motion.div
                      key="step-1-gps"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
                      className="w-full h-full flex flex-col items-center justify-center relative"
                    >
                      {/* Rotating satellite orbit ring */}
                      <div className="absolute w-56 h-56 rounded-full border border-dashed border-cyan-500/30 animate-spin" style={{ animationDuration: '18s' }}>
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-400 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.8)]">
                          <Satellite className="w-3.5 h-3.5 text-cyan-300" />
                        </div>
                      </div>

                      {/* Radar sweep crosshairs */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
                        <div className="w-full h-[1px] bg-cyan-400" />
                        <div className="absolute h-full w-[1px] bg-cyan-400" />
                      </div>

                      {/* Target Locked User Node */}
                      <div className="relative z-10 flex flex-col items-center">
                        <motion.div 
                          animate={userAccuracySettled ? { scale: [1, 1.1, 1] } : { scale: [1, 1.3, 1] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                          className={`w-12 h-12 rounded-full border flex items-center justify-center ${
                            userAccuracySettled 
                              ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_30px_rgba(16,185,129,0.5)]' 
                              : 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_30px_rgba(6,182,212,0.5)]'
                          }`}
                        >
                          <Navigation className="w-6 h-6 transform -rotate-45" />
                        </motion.div>

                        {/* High-accuracy HUD Badge */}
                        <div className="mt-3 p-3 rounded-2xl bg-neutral-900/90 border border-cyan-500/40 backdrop-blur-xl shadow-xl text-center space-y-1">
                          <div className="flex items-center justify-center gap-1.5 text-xs font-mono font-bold text-white">
                            <Compass className="w-3.5 h-3.5 text-cyan-400" />
                            <span>SHARELOCK SAT-HUD // TERKUNCI</span>
                          </div>
                          
                          <p className="text-[11px] font-mono text-cyan-300 font-bold">
                            {userAccuracySettled ? 'AKURASI MAKSIMAL: ±1.2 METER (GNSS FIX)' : 'AKURASI DINAMIS: ±3.4 METER (STABIL)'}
                          </p>

                          <div className="flex items-center justify-center gap-3 text-[10px] font-mono text-neutral-400 pt-1 border-t border-white/10">
                            <span>14 SATELIT</span>
                            <span>•</span>
                            <span>JEDA CACHE: 0ms</span>
                            <span>•</span>
                            <span>SULTENG</span>
                          </div>
                        </div>
                      </div>

                    </motion.div>
                  )}

                  {/* ───────────────────────────────────────────────────────────
                      GRAPHIC 3: HAZARD-ZONE BYPASS & ROUTING
                  ──────────────────────────────────────────────────────────── */}
                  {activeStep === 2 && (
                    <motion.div
                      key="step-2-routing"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
                      className="w-full h-full flex items-center justify-center relative"
                    >
                      {/* SVG Vector Map Canvas */}
                      <svg viewBox="0 0 400 240" className="w-full h-full">
                        <defs>
                          {/* Striped Danger Pattern for Coastal Red Zone */}
                          <pattern id="hazardPattern" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                            <line x1="0" y1="0" x2="0" y2="10" stroke="#ef4444" strokeWidth="2" opacity="0.3" />
                          </pattern>
                          <linearGradient id="routeGlow" x1="0%" y1="100%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#06b6d4" />
                            <stop offset="60%" stopColor="#f97316" />
                            <stop offset="100%" stopColor="#10b981" />
                          </linearGradient>
                        </defs>

                        {/* Coastal Hazard Zone on Left Shore */}
                        <path 
                          d="M 10 20 Q 70 80 50 140 T 30 220 L 0 220 L 0 20 Z" 
                          fill="url(#hazardPattern)"
                          stroke="#ef4444"
                          strokeWidth="1.5"
                          strokeDasharray="4 2"
                        />

                        {/* Hazard Coastline Text */}
                        <text x="14" y="110" fill="#f87171" fontSize="9" fontFamily="monospace" fontWeight="bold" transform="rotate(-70 14 110)">
                          GARIS PANTAI PESISIR (POTENSI BAHAYA)
                        </text>

                        {/* Safe Inland Road Network */}
                        <path d="M 60 200 L 140 180 L 220 120 L 320 60" stroke="#334155" strokeWidth="6" fill="none" strokeLinecap="round" />
                        <path d="M 140 180 L 130 90 L 220 120" stroke="#334155" strokeWidth="4" fill="none" strokeLinecap="round" />
                        <path d="M 220 120 L 290 190 L 370 160" stroke="#334155" strokeWidth="4" fill="none" strokeLinecap="round" />

                        {/* Blocked Coastal Road Warning Icon */}
                        <circle cx="50" cy="140" r="12" fill="rgba(239,68,68,0.2)" stroke="#ef4444" strokeWidth="1.5" />
                        <line x1="43" y1="133" x2="57" y2="147" stroke="#ef4444" strokeWidth="2" />
                        <line x1="57" y1="133" x2="43" y2="147" stroke="#ef4444" strokeWidth="2" />

                        {/* Animated Bypass Route (Springs around coast towards elevation) */}
                        <motion.path 
                          d={routeAvoidanceActive 
                            ? "M 100 200 Q 140 175 180 145 T 260 100 T 330 55"
                            : "M 100 200 L 40 140 L 330 55"
                          }
                          fill="none"
                          stroke="url(#routeGlow)"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                        />

                        {/* User Starting Node */}
                        <circle cx="100" cy="200" r="7" fill="#06b6d4" />
                        <circle cx="100" cy="200" r="14" fill="none" stroke="#06b6d4" opacity="0.4" />
                        <text x="100" y="222" fill="#e2e8f0" fontSize="10" fontFamily="sans-serif" fontWeight="bold" textAnchor="middle">
                          Posisi Anda
                        </text>

                        {/* Destination Safe Haven Shelter */}
                        <circle cx="330" cy="55" r="9" fill="#10b981" />
                        <circle cx="330" cy="55" r="18" fill="none" stroke="#10b981" opacity="0.4" />
                        <text x="330" y="38" fill="#4ade80" fontSize="10" fontFamily="sans-serif" fontWeight="bold" textAnchor="middle">
                          SHELTER AMAN (+48m)
                        </text>
                      </svg>

                      {/* Turn Navigation Card Overlay */}
                      <div className="absolute bottom-2 left-2 p-3 rounded-xl bg-neutral-900/90 border border-orange-500/40 backdrop-blur-xl text-xs font-mono space-y-1">
                        <div className="flex items-center gap-1.5 text-orange-400 font-bold">
                          <ArrowRight className="w-3.5 h-3.5 transform -rotate-45" />
                          <span>HINDARI PANTAI // BELOK KANAN KE DATARAN TINGGI</span>
                        </div>
                        <p className="text-[10px] text-neutral-400">
                          Jarak: 850m • Waktu: 11 Menit • Jalur Aman Terverifikasi ✓
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {/* ───────────────────────────────────────────────────────────
                      GRAPHIC 4: FAMILY RADAR & "SAYA AMAN ✓"
                  ──────────────────────────────────────────────────────────── */}
                  {activeStep === 3 && (
                    <motion.div
                      key="step-3-family"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
                      className="w-full h-full flex items-center justify-center relative"
                    >
                      {/* 360-degree radar sweep circle */}
                      <div className="relative w-64 h-64 rounded-full border border-emerald-500/20 flex items-center justify-center">
                        {/* Concentric radar rings */}
                        <div className="absolute w-44 h-44 rounded-full border border-emerald-500/20" />
                        <div className="absolute w-24 h-24 rounded-full border border-emerald-500/25" />
                        
                        {/* Continuous radar beam */}
                        <div 
                          className="absolute inset-0 rounded-full animate-spin pointer-events-none"
                          style={{
                            animationDuration: '4s',
                            background: 'conic-gradient(from 0deg, transparent 70%, rgba(16, 185, 129, 0.25) 100%)'
                          }}
                        />

                        {/* Connected Family Nodes */}
                        {/* Center: User */}
                        <div className="relative z-10 flex flex-col items-center">
                          <div className="w-10 h-10 rounded-full bg-emerald-500/30 border-2 border-emerald-400 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.6)]">
                            <Users className="w-5 h-5 text-emerald-300" />
                          </div>
                          <span className="text-[10px] font-mono font-bold text-white mt-1">Anda (Palu Barat)</span>
                        </div>

                        {/* Node 1: Family Member (Ayah) */}
                        <div className="absolute top-6 right-8 flex flex-col items-center">
                          <div className="w-8 h-8 rounded-full bg-emerald-600/30 border border-emerald-400 flex items-center justify-center">
                            <span className="text-xs font-bold text-emerald-300">P</span>
                          </div>
                          <span className="text-[9px] font-mono text-emerald-400 font-bold mt-0.5">Ayah • AMAN ✓</span>
                        </div>

                        {/* Node 2: Family Member (Anak) */}
                        <div className="absolute bottom-6 left-10 flex flex-col items-center">
                          <div className="w-8 h-8 rounded-full bg-emerald-600/30 border border-emerald-400 flex items-center justify-center">
                            <span className="text-xs font-bold text-emerald-300">K</span>
                          </div>
                          <span className="text-[9px] font-mono text-emerald-400 font-bold mt-0.5">Kakak • AMAN ✓</span>
                        </div>

                        {/* Linking mesh dashed lines */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none">
                          <line x1="128" y1="128" x2="200" y2="44" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
                          <line x1="128" y1="128" x2="65" y2="200" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
                        </svg>

                        {/* Ping Shockwave when ping triggered */}
                        {familyPingSent && (
                          <motion.div 
                            initial={{ scale: 0.5, opacity: 1 }}
                            animate={{ scale: 2.5, opacity: 0 }}
                            transition={{ duration: 1.2, ease: 'easeOut' }}
                            className="absolute w-32 h-32 rounded-full border-2 border-emerald-400 pointer-events-none"
                          />
                        )}
                      </div>

                      {/* Status Confirmation Banner */}
                      <div className="absolute bottom-2 right-2 p-3 rounded-2xl bg-neutral-900/95 border border-emerald-500/50 backdrop-blur-xl text-xs font-mono space-y-1">
                        <div className="flex items-center gap-1.5 text-emerald-400 font-black">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>STATUS: SELURUH ANGGOTA TERHUBUNG</span>
                        </div>
                        <p className="text-[10px] text-neutral-400">
                          Sinkronisasi 2-Arah Tanpa Kuota • Enkripsi Sesi
                        </p>
                      </div>

                    </motion.div>
                  )}

                </AnimatePresence>
              </div>

              {/* Bottom HUD Stage Footer */}
              <div className="flex items-center justify-between border-t border-white/[0.08] pt-3 text-[10px] font-mono text-neutral-400">
                <div className="flex items-center gap-2">
                  <span className="text-neutral-500">ARSITEKTUR MANDIRI</span>
                  <span className="text-neutral-600">•</span>
                  <span className="text-neutral-300">OTONOM TANPA SERVER ASING</span>
                </div>
                <div className="flex items-center gap-2 text-neutral-400">
                  <Activity className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
                  <span>RESPON SEKETIKA</span>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>

    </div>
  )
}

export default WorkflowMotionGraphic
