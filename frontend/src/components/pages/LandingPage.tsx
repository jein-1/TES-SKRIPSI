import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { 
  Shield, 
  ArrowRight, 
  CheckCircle2, 
  Lock, 
  Smartphone, 
  Sparkles, 
  Radio, 
  Layers, 
  Activity, 
  ChevronRight, 
  ExternalLink, 
  Globe, 
  Cpu, 
  Clock, 
  Compass, 
  MapPin, 
  AlertTriangle,
  Apple,
  Share2,
  Check,
  SlidersHorizontal,
  ShieldCheck,
  X,
  Satellite
} from 'lucide-react'
import { DeviceMockup } from '../landing/DeviceMockup'
import { BentoGrid } from '../landing/BentoGrid'
import { InteractiveSandbox } from '../landing/InteractiveSandbox'
import { WorkflowMotionGraphic } from '../landing/WorkflowMotionGraphic'

interface LandingPageProps {
  onEnterApp?: () => void
}

export const LandingPage: React.FC<LandingPageProps> = () => {
  const [scrolled, setScrolled] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [showSpecsSheet, setShowSpecsSheet] = useState(false)

  // Ensure document, body, and root allow natural vertical scrolling
  useEffect(() => {
    const rootEl = document.getElementById('root');
    if (rootEl) {
      rootEl.style.height = 'auto';
      rootEl.style.minHeight = '100%';
      rootEl.style.overflow = 'visible';
    }
    document.body.style.overflowY = 'auto';
    document.body.style.height = 'auto';
    document.documentElement.style.overflowY = 'auto';
    document.documentElement.style.height = 'auto';

    return () => {
      // Cleanup on unmount if returning to app
      if (rootEl) {
        rootEl.style.height = '';
        rootEl.style.minHeight = '';
        rootEl.style.overflow = '';
      }
      document.body.style.overflowY = '';
      document.body.style.height = '';
      document.documentElement.style.overflowY = '';
      document.documentElement.style.height = '';
    };
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'A.T.L.A.S // Sistem Keselamatan & Peringatan Bencana',
        text: 'Sistem otonom pemetaan ancaman bahaya dan peringatan darurat bagi masyarakat.',
        url: window.location.href,
      }).catch(() => {})
    } else {
      navigator.clipboard?.writeText(window.location.href)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    }
  }

  return (
    <div className="relative w-full min-h-screen bg-[#000000] text-slate-100 font-sans selection:bg-orange-500/30 selection:text-orange-200 antialiased overflow-x-hidden" style={{ minHeight: '100vh', overflowY: 'visible' }}>
      
      {/* ── AMBIENT BACKGROUND GLOWS ───────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Top Radial Glow Cyan */}
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-b from-cyan-500/10 via-orange-500/5 to-transparent rounded-full blur-[120px] opacity-70" />
        {/* Subtle Side Glow Orange */}
        <div className="absolute top-[800px] -left-40 w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-[140px] opacity-50" />
        {/* Deep Bottom Glow */}
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-cyan-600/5 rounded-full blur-[150px] opacity-40" />
      </div>

      {/* ── FLOATING GLASS NAVIGATION BAR ─────────────────────────── */}
      <header className={`sticky top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-black/85 backdrop-blur-2xl border-b border-white/[0.08] shadow-[0_4px_30px_rgba(0,0,0,0.8)] py-2.5' 
          : 'bg-black/50 backdrop-blur-xl border-b border-white/[0.05] py-3'
      }`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          
          {/* Logo & Brand Identity */}
          <div 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="relative w-9 h-9 rounded-xl overflow-hidden bg-white/5 border border-white/10 p-1 group-hover:border-orange-500/40 transition-colors shadow-lg shadow-black/50">
              <img 
                src="/atlas-logo-user.png" 
                alt="A.T.L.A.S" 
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-black text-sm tracking-widest text-white">
                  A.T.L.A.S
                </span>
                <span className="text-orange-500 font-mono font-bold text-xs tracking-tighter">
                  //
                </span>
              </div>
              <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-wider hidden sm:block">
                Sistem Keselamatan Mandiri
              </span>
            </div>
          </div>

          {/* Desktop Center Links (Apple Minimalist Pills) */}
          <nav className="hidden md:flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl">
            <button 
              onClick={() => scrollToSection('workflow')} 
              className="px-3.5 py-1 rounded-full text-xs font-medium text-neutral-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            >
              Alur Penyelamatan
            </button>
            <button 
              onClick={() => scrollToSection('specs')} 
              className="px-3.5 py-1 rounded-full text-xs font-medium text-neutral-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            >
              Arsitektur Sistem
            </button>
            <button 
              onClick={() => scrollToSection('simulation')} 
              className="px-3.5 py-1 rounded-full text-xs font-medium text-neutral-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            >
              Simulasi Langsung
            </button>
            <button 
              onClick={() => scrollToSection('security')} 
              className="px-3.5 py-1 rounded-full text-xs font-medium text-neutral-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            >
              Privasi & Kedaulatan
            </button>
          </nav>

          {/* Right Action Buttons (NO DOWNLOAD BUTTONS) */}
          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={() => scrollToSection('specs')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-neutral-200 text-xs font-mono font-medium transition-all cursor-pointer min-h-[44px]"
              title="Lihat Spesifikasi & Arsitektur Sistem"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-orange-400" />
              <span className="hidden sm:inline">SPESIFIKASI</span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={handleShare}
              className="p-2.5 rounded-xl bg-white/[0.05] hover:bg-white/10 border border-white/10 text-neutral-300 hover:text-white transition-all text-xs cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
              title="Bagikan Tautan"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            </motion.button>
          </div>

        </div>
      </header>

      {/* ── HERO SECTION: TITANIUM STAGE ───────────────────────────── */}
      <section className="relative z-10 pt-12 sm:pt-20 pb-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          
          {/* Eyebrow Pill */}
          <motion.div 
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 280, bounce: 0 }}
            className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.1] backdrop-blur-md shadow-inner"
          >
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            <span className="text-[11px] font-mono font-bold tracking-widest text-orange-400 uppercase">
              A.T.L.A.S // SISTEM KESELAMATAN & PERINGATAN BENCANA MANDIRI
            </span>
          </motion.div>

          {/* Master Headline (Apple-Grade Negative Tracking) */}
          <motion.h1 
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 280, bounce: 0 }}
            className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-[-0.035em] text-white leading-[1.05]"
          >
            Waspada Seketika.<br />
            <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-cyan-400 bg-clip-text text-transparent">
              Evakuasi Presisi.
            </span><br />
            Di Setiap Detik Krusial.
          </motion.h1>

          {/* Subheadline (Zero military words) */}
          <motion.p 
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 280, bounce: 0 }}
            className="max-w-2xl mx-auto text-neutral-300 text-base sm:text-lg md:text-xl font-normal leading-relaxed"
          >
            Sistem pemetaan ancaman bahaya dan rute evakuasi mandiri berstandar rekayasa modern. Mengunci koordinat satelit presisi tingkat tinggi, menyajikan telemetri gempa seketika, dan mengarahkan warga ke shelter penampungan terdekat yang aman.
          </motion.p>

          {/* Hero Action Buttons (NO DOWNLOAD BUTTONS) */}
          <motion.div 
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 280, bounce: 0 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4"
          >
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => scrollToSection('specs')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-400 hover:to-amber-400 text-black font-mono font-black text-sm shadow-[0_10px_35px_rgba(249,115,22,0.35)] transition-all cursor-pointer min-h-[44px]"
            >
              <SlidersHorizontal className="w-4 h-4 text-black" />
              <span>ARSITEKTUR & SPESIFIKASI SISTEM</span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => scrollToSection('workflow')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.15] text-white font-medium text-sm backdrop-blur-xl transition-all cursor-pointer min-h-[44px]"
            >
              <span>Alur Penyelamatan</span>
              <ChevronRight className="w-4 h-4 text-neutral-400" />
            </motion.button>
          </motion.div>

          {/* Metadata Credential Bar */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="pt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-mono text-neutral-400"
          >
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>AKURASI SATELIT TINGGI (±1.2m)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>100% BEBAS IKLAN & PELACAK</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-rose-400" />
              <span>INFORMASI GEMPA REAL-TIME</span>
            </div>
          </motion.div>

        </div>

        {/* ── INTERACTIVE TITANIUM DEVICE SHOWCASE ───────────────────── */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', damping: 26, stiffness: 280, bounce: 0 }}
          className="mt-14 sm:mt-20 relative max-w-4xl mx-auto"
        >
          {/* Floor Specular Light Reflection */}
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-gradient-to-t from-orange-500/10 via-cyan-500/10 to-transparent blur-3xl pointer-events-none" />
          
          <DeviceMockup />
        </motion.div>
      </section>

      {/* ── ARSITEKTUR & SPESIFIKASI SISTEM (BENTO GRID) ────────────── */}
      <section className="relative z-10 py-20 sm:py-28 border-t border-white/[0.06]">
        <BentoGrid />
      </section>

      {/* ── 4-PHASE OPERATIONAL RESCUE WORKFLOW ───────────────────────── */}
      <section id="workflow" className="relative z-10 py-20 sm:py-28 border-t border-white/[0.06]">
        <WorkflowMotionGraphic />
      </section>

      {/* ── INTERACTIVE SIMULATION SANDBOX ──────────────────────────── */}
      <section id="simulation" className="relative z-10 py-20 sm:py-28 border-t border-white/[0.06]">
        <InteractiveSandbox />
      </section>

      {/* ── ZERO-TRACKING PRIVACY & ARCHITECTURE INTEGRITY ─────────── */}
      <section id="security" className="relative z-10 py-20 sm:py-28 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 backdrop-blur-md">
              <Lock className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-xs font-mono font-bold tracking-widest text-indigo-300 uppercase">
                Kedaulatan & Keamanan Data Lokal
              </span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              Kedaulatan Anda. <br />
              <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-cyan-400 bg-clip-text text-transparent">
                Privasi Tanpa Kompromi.
              </span>
            </h2>

            <p className="text-neutral-400 text-sm sm:text-base leading-relaxed">
              Di saat bencana, data Anda adalah milik Anda. A.T.L.A.S dirancang dengan prinsip kedaulatan data mutlak: seluruh informasi disimpan secara lokal terenkripsi di ponsel Anda.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="rounded-3xl p-7 bg-neutral-900/60 border border-white/[0.08] backdrop-blur-xl relative overflow-hidden group hover:border-indigo-500/30 transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-6">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Enkripsi Tingkat Tinggi AES-256</h3>
              <p className="text-sm text-neutral-400 leading-relaxed">
                Penyimpanan lokal perangkat diproteksi secara kuat. Data identitas dan koordinat darurat tidak pernah dikirimkan ke pihak ketiga tanpa izin eksplisit Anda.
              </p>
            </div>

            <div className="rounded-3xl p-7 bg-neutral-900/60 border border-white/[0.08] backdrop-blur-xl relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-6">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Zero-Tracker & Nir-Komersial</h3>
              <p className="text-sm text-neutral-400 leading-relaxed">
                Murni instrumen keselamatan masyarakat umum. Bebas total dari skrip analitik komersial, periklanan, dan algoritma pelacakan pihak ketiga.
              </p>
            </div>

            <div className="rounded-3xl p-7 bg-neutral-900/60 border border-white/[0.08] backdrop-blur-xl relative overflow-hidden group hover:border-rose-500/30 transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-6">
                <Activity className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Informasi Gempa Tepat & Akurat</h3>
              <p className="text-sm text-neutral-400 leading-relaxed">
                Menerima data sensor seismik secara seketika. Menghitung magnitudo, episentrum, dan kalkulasi dini potensi ancaman tsunami tanpa jeda.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ── STATUS KESIAPSIAGAAN SISTEM (NO DOWNLOAD BUTTONS) ──────── */}
      <section className="relative z-10 py-24 sm:py-32 border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 backdrop-blur-md">
              <Smartphone className="w-3.5 h-3.5 text-orange-400" />
              <span className="text-xs font-mono font-bold tracking-widest text-orange-300 uppercase">
                Status Kesiapsiagaan Sistem
              </span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              Tahap Rekayasa & <br />
              <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-cyan-400 bg-clip-text text-transparent">
                Kesiapsiagaan Peluncuran Publik.
              </span>
            </h2>

            <p className="text-neutral-400 text-sm sm:text-base">
              Aplikasi resmi A.T.L.A.S saat ini sedang melalui tahapan uji ketahanan telemetri satelit dan validasi lapangan sebelum didistribusikan secara resmi kepada masyarakat.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            
            {/* ANDROID RELEASE CARD */}
            <div className="rounded-3xl p-8 bg-gradient-to-br from-neutral-900/90 to-black border border-orange-500/30 relative overflow-hidden flex flex-col justify-between shadow-[0_10px_40px_rgba(249,115,22,0.15)]">
              <div className="absolute top-0 right-0 w-60 h-60 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 p-1 flex items-center justify-center">
                      <img src="/atlas-logo-user.png" alt="A.T.L.A.S //" className="w-full h-full object-contain" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <span>A.T.L.A.S //</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 font-mono font-bold">
                          v1.0.0
                        </span>
                      </h3>
                      <p className="text-xs font-mono text-neutral-400">id.atlas.app • Edisi Perdana Resmi</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-mono font-bold animate-pulse">
                    SEGERA HADIR
                  </span>
                </div>

                <ul className="space-y-2.5 text-xs text-neutral-300 font-sans">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-orange-400 shrink-0" />
                    <span>Kompatibilitas: Android 7.0 (Nougat) atau yang lebih baru (Mendukung Android 15, 16+ & Semua Versi Terbaru)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-orange-400 shrink-0" />
                    <span>Ukuran Ringan: Dioptimalkan untuk performa cepat</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-orange-400 shrink-0" />
                    <span>Izin Minimum: Presisi Lokasi GPS & Notifikasi Sirene</span>
                  </li>
                </ul>
              </div>

              <div className="relative z-10 pt-8 space-y-3">
                <div className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange-500/15 via-neutral-900 to-amber-500/15 border border-orange-500/30 text-center text-sm font-mono font-bold text-orange-300 flex items-center justify-center gap-2.5 shadow-lg shadow-black/50">
                  <Clock className="w-4 h-4 text-orange-400 animate-spin" style={{ animationDuration: '5s' }} />
                  <span>STATUS: TAHAP VALIDASI AKHIR</span>
                </div>

                <p className="text-center text-[10px] font-mono text-neutral-500">
                  Paket aplikasi sedang diselaraskan untuk peluncuran resmi kepada warga
                </p>
              </div>

            </div>

            {/* APPLE IOS ECOSYSTEM CARD */}
            <div className="rounded-3xl p-8 bg-gradient-to-br from-neutral-900/60 to-black border border-white/[0.1] relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-60 h-60 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white">
                      <Apple className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <span>Apple iOS</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 font-mono font-bold">
                          Riset Swift
                        </span>
                      </h3>
                      <p className="text-xs font-mono text-neutral-400">iPhone & Apple Watch</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-mono font-bold">
                    SEGERA HADIR
                  </span>
                </div>

                <p className="text-xs text-neutral-300 leading-relaxed">
                  Dalam tahap riset dan perencanaan arsitektur ekosistem Apple. Menyiapkan integrasi antarmuka ramah pengguna yang selaras dengan standar keamanan privasi iOS.
                </p>

                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-2">
                  <div className="flex items-center gap-2 text-xs font-mono text-cyan-300">
                    <Sparkles className="w-4 h-4" />
                    <span>Rencana Roadmap Ekosistem Apple:</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    • Eksplorasi aksesibilitas Web App Safari & notifikasi darurat<br />
                    • Riset integrasi telemetri perangkat Apple Watch & iOS<br />
                    • Pengujian kepatuhan privasi data lokal tanpa pelacak
                  </p>
                </div>
              </div>

              <div className="relative z-10 pt-8 space-y-3">
                <div className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500/15 via-neutral-900 to-blue-500/15 border border-cyan-500/30 text-center text-sm font-mono font-bold text-cyan-300 flex items-center justify-center gap-2.5 shadow-lg shadow-black/50">
                  <Apple className="w-4 h-4 text-cyan-400" />
                  <span>STATUS: SEGERA HADIR DI APP STORE</span>
                </div>
                <p className="text-center text-[10px] font-mono text-neutral-500">
                  Riset dan perencanaan arsitektur keselamatan ekosistem Apple
                </p>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* ── CLOSING CALL-TO-ACTION (NO DOWNLOAD BUTTONS) ───────────── */}
      <section className="relative z-10 py-20 sm:py-28 border-t border-white/[0.08] overflow-hidden bg-gradient-to-b from-black via-neutral-950 to-[#07090E]">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-gradient-to-r from-orange-500/15 via-amber-500/10 to-cyan-500/15 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="rounded-3xl p-8 sm:p-14 lg:p-16 bg-gradient-to-br from-neutral-900/90 via-black to-neutral-950 border border-white/[0.12] shadow-[0_20px_80px_rgba(0,0,0,0.9)] text-center space-y-8 relative overflow-hidden">
            
            {/* Top decorative pill */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 backdrop-blur-xl">
              <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
              <span className="text-[11px] font-mono font-bold tracking-widest text-orange-300 uppercase">
                SIAP SIAGA MANDIRI SEBELUM TERLAMBAT
              </span>
            </div>

            {/* Master Headline */}
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-[-0.035em] text-white leading-[1.1] max-w-4xl mx-auto">
              Jangan Sampai Menyesal Saat Bencana Datang.<br />
              <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-cyan-400 bg-clip-text text-transparent">
                Keselamatan Keluarga Tidak Bisa Menunggu.
              </span>
            </h2>

            {/* Paragraph */}
            <p className="max-w-2xl mx-auto text-neutral-300 text-sm sm:text-base md:text-lg leading-relaxed font-normal">
              Ketika detik-detik emas evakuasi berjalan, kepanikan dan ketidaksiapan adalah musuh terbesar. Pahami alur penyelamatan dan kenali rute darurat menuju shelter sejak dini agar orang-orang terkasih selalu saling terpantau aman.
            </p>

            {/* Action buttons (NO DOWNLOAD BUTTONS) */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => scrollToSection('workflow')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-400 hover:to-amber-400 text-black font-mono font-black text-sm shadow-[0_10px_40px_rgba(249,115,22,0.35)] transition-all cursor-pointer group"
              >
                <span>LIHAT ALUR PENYELAMATAN</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={handleShare}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.15] text-white text-sm font-medium backdrop-blur-xl transition-all cursor-pointer"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                <span>{copiedLink ? 'Tautan Tersalin ✓' : 'Bagikan ke Keluarga & Kerabat'}</span>
              </motion.button>
            </div>

            {/* Trust badges */}
            <div className="pt-6 border-t border-white/[0.08] flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-[11px] font-mono text-neutral-400">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>100% BEBAS BIAYA</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>PRIVASI TERENKRIPSI LOKAL</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-rose-400" />
                <span>INFORMASI GEMPA REAL-TIME</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── APPLE MINIMALIST FOOTER ───────────────────────────────── */}
      <footer className="relative z-10 border-t border-white/[0.08] bg-black py-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-neutral-500 font-mono">
          
          <div className="flex items-center gap-3">
            <img src="/atlas-logo-user.png" alt="A.T.L.A.S" className="w-6 h-6 object-contain opacity-70" />
            <div>
              <span className="text-neutral-300 font-bold">A.T.L.A.S //</span>
              <span className="mx-2 text-neutral-700">|</span>
              <span>Sistem Otonom Pemetaan Ancaman Bahaya dan Peringatan Darurat</span>
            </div>
          </div>

          <div className="text-[11px] text-neutral-400 font-mono text-center md:text-right">
            <span>Edisi Resmi v1.0.0 • Siaga Mandiri Menghadapi Bencana</span>
          </div>

        </div>

        <div className="max-w-6xl mx-auto mt-8 pt-6 border-t border-white/[0.04] text-center text-[10px] font-mono text-neutral-600">
          Hak Cipta Terpelihara © {new Date().getFullYear()} A.T.L.A.S. Dibangun demi keselamatan warga dan ketahanan mandiri menghadapi bencana alam.
        </div>
      </footer>

      {/* ── APPLE-HIG SPECS SHEET (GESTURE-DRIVEN & VELOCITY-AWARE, NO DOWNLOAD BUTTONS) ── */}
      <AnimatePresence>
        {showSpecsSheet && (
          <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-auto">
            {/* Backdrop Dimmer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setShowSpecsSheet(false)}
              className="absolute inset-0 bg-black/75 backdrop-blur-md cursor-pointer"
            />

            {/* Interactive Sheet Container */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300, bounce: 0 }}
              drag="y"
              dragConstraints={{ top: 0 }}
              dragElastic={0.08}
              onDragEnd={(_, info) => {
                if (info.offset.y > 100 || info.velocity.y > 400) {
                  setShowSpecsSheet(false)
                }
              }}
              className="relative w-full max-w-2xl bg-neutral-950/95 border-t border-x border-white/[0.12] rounded-t-[32px] shadow-[0_-15px_60px_rgba(0,0,0,0.9)] max-h-[85vh] flex flex-col overflow-hidden backdrop-blur-2xl"
            >
              {/* Grab Handle */}
              <div className="w-full flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing">
                <div className="w-10 h-1.5 rounded-full bg-white/20" />
              </div>

              {/* Sheet Header */}
              <div className="px-6 py-3 border-b border-white/[0.08] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400">
                    <SlidersHorizontal className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white tracking-tight">
                      Spesifikasi & Arsitektur Keselamatan
                    </h3>
                    <p className="text-xs font-mono text-neutral-400">
                      A.T.L.A.S Engine Architecture
                    </p>
                  </div>
                </div>

                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={() => setShowSpecsSheet(false)}
                  className="w-9 h-9 rounded-full bg-white/[0.08] hover:bg-white/[0.15] border border-white/[0.1] flex items-center justify-center text-neutral-300 hover:text-white transition-colors cursor-pointer min-h-[44px] min-w-[44px]"
                  title="Tutup Lembar"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>

              {/* Scrollable Body */}
              <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
                
                {/* Group 1: Telemetri & Presisi */}
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 px-1 mb-2 block font-bold">
                    Telemetri Satelit & Sensorik
                  </span>
                  <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] divide-y divide-white/[0.06] overflow-hidden">
                    <div className="p-4 flex items-center justify-between min-h-[54px]">
                      <div className="flex items-center gap-3">
                        <Satellite className="w-4 h-4 text-cyan-400" />
                        <div>
                          <p className="text-sm font-semibold text-white">Standar GPS Satelit</p>
                          <p className="text-xs text-neutral-400">Dual-band L1/L5 high-accuracy filter</p>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-500/10 px-2.5 py-1 rounded-full border border-cyan-500/20">
                        ±1.2m PRESISI
                      </span>
                    </div>

                    <div className="p-4 flex items-center justify-between min-h-[54px]">
                      <div className="flex items-center gap-3">
                        <Radio className="w-4 h-4 text-orange-400" />
                        <div>
                          <p className="text-sm font-semibold text-white">Pembaruan Telemetri</p>
                          <p className="text-xs text-neutral-400">Interval pelacakan posisi darurat</p>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold text-orange-300 bg-orange-500/10 px-2.5 py-1 rounded-full border border-orange-500/20">
                        REAL-TIME (0s Stale)
                      </span>
                    </div>

                    <div className="p-4 flex items-center justify-between min-h-[54px]">
                      <div className="flex items-center gap-3">
                        <Activity className="w-4 h-4 text-rose-400" />
                        <div>
                          <p className="text-sm font-semibold text-white">Telemetri Gempa Real-Time</p>
                          <p className="text-xs text-neutral-400">Sensor seismik & deteksi tsunami</p>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold text-rose-300 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20">
                        &lt; 3 DETIK
                      </span>
                    </div>
                  </div>
                </div>

                {/* Group 2: Algoritma & Navigasi */}
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 px-1 mb-2 block font-bold">
                    Logika Perutean Darurat
                  </span>
                  <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] divide-y divide-white/[0.06] overflow-hidden">
                    <div className="p-4 flex items-center justify-between min-h-[54px]">
                      <div className="flex items-center gap-3">
                        <Compass className="w-4 h-4 text-emerald-400" />
                        <div>
                          <p className="text-sm font-semibold text-white">Mesin Algoritma</p>
                          <p className="text-xs text-neutral-400">Penentuan rute tercepat bebas halangan</p>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold text-emerald-300 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                        DIJKSTRA + HAVERSINE
                      </span>
                    </div>

                    <div className="p-4 flex items-center justify-between min-h-[54px]">
                      <div className="flex items-center gap-3">
                        <ShieldCheck className="w-4 h-4 text-amber-400" />
                        <div>
                          <p className="text-sm font-semibold text-white">Prioritas Shelter Ketinggian</p>
                          <p className="text-xs text-neutral-400">Penentuan titik kumpul dataran tinggi aman</p>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                        ELEVASI AMAN MDPL
                      </span>
                    </div>
                  </div>
                </div>

                {/* Group 3: Kedaulatan & Identitas */}
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 px-1 mb-2 block font-bold">
                    Kedaulatan & Perlindungan Data
                  </span>
                  <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] divide-y divide-white/[0.06] overflow-hidden">
                    <div className="p-4 flex items-center justify-between min-h-[54px]">
                      <div className="flex items-center gap-3">
                        <Lock className="w-4 h-4 text-indigo-400" />
                        <div>
                          <p className="text-sm font-semibold text-white">Kriptografi Perangkat</p>
                          <p className="text-xs text-neutral-400">Penyimpanan terenkripsi pada terminal</p>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold text-indigo-300 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
                        AES-GCM 256-BIT
                      </span>
                    </div>

                    <div className="p-4 flex items-center justify-between min-h-[54px]">
                      <div className="flex items-center gap-3">
                        <Smartphone className="w-4 h-4 text-neutral-300" />
                        <div>
                          <p className="text-sm font-semibold text-white">Aturan Kepemilikan</p>
                          <p className="text-xs text-neutral-400">Integritas data daftar penyelamatan</p>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold text-neutral-300 bg-white/10 px-2.5 py-1 rounded-full border border-white/20">
                        1 PERANGKAT = 1 IDENTITAS
                      </span>
                    </div>
                  </div>
                </div>

                {/* Close Button Only (NO DOWNLOAD BUTTONS) */}
                <div className="pt-2 pb-4">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setShowSpecsSheet(false)}
                    className="w-full py-3.5 rounded-2xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.12] text-white font-medium text-sm backdrop-blur-xl flex items-center justify-center gap-2 cursor-pointer transition-all min-h-[44px]"
                  >
                    <span>Tutup Panel Spesifikasi</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}

export default LandingPage
