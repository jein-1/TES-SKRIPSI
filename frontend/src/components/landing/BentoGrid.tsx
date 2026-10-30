import React from 'react'
import { motion } from 'motion/react'
import { 
  Navigation2, 
  Radio, 
  Users, 
  Satellite, 
  Compass, 
  Lock, 
  Smartphone,
  ShieldCheck,
  Activity
} from 'lucide-react'

export const BentoGrid: React.FC = () => {
  return (
    <div id="specs" className="w-full max-w-6xl mx-auto px-4 sm:px-6">
      {/* Section Eyebrow & Title */}
      <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/[0.06] border border-white/[0.1] backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
          <span className="text-xs font-mono font-bold tracking-widest text-orange-400 uppercase">
            Arsitektur Rekayasa Sistem A.T.L.A.S
          </span>
        </div>
        
        <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
          Dirancang untuk Ketepatan. <br />
          <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-cyan-400 bg-clip-text text-transparent">
            Di Detik Paling Menentukan.
          </span>
        </h2>
        
        <p className="text-neutral-400 text-sm sm:text-base leading-relaxed">
          Setiap subsistem A.T.L.A.S dibangun dengan arsitektur mandiri bertoleransi latensi nol, memastikan informasi keselamatan jiwa sampai kepada warga secara presisi tanpa hambatan.
        </p>
      </div>

      {/* Grid Container — 6 Dedicated Architecture Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        
        {/* CARD 1: Presisi Satelit Sharelock (2-column span) */}
        <motion.div 
          whileHover={{ y: -4 }}
          whileTap={{ scale: 0.99 }}
          transition={{ type: 'spring', damping: 26, stiffness: 280, bounce: 0 }}
          className="md:col-span-2 relative rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-neutral-900/90 via-black to-neutral-950 border border-white/[0.08] overflow-hidden group shadow-[0_10px_40px_rgba(0,0,0,0.5)]"
        >
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-cyan-500/15 transition-all duration-500" />
          
          <div className="relative z-10 flex flex-col justify-between h-full space-y-6">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                <Navigation2 className="w-6 h-6" />
              </div>
              
              {/* Satellite Orbit HUD Graphic */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[10px] font-mono text-cyan-300 font-bold">
                <Satellite className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '10s' }} />
                <span>DUAL-BAND L1/L5 GNSS • 0ms STALE</span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-mono font-bold text-cyan-400 tracking-wider uppercase">Sistem Lokasi Satelit Presisi</span>
              <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Mesin Pelacakan Lokasi Satelit Presisi Tinggi
              </h3>
              <p className="text-neutral-400 text-xs sm:text-sm leading-relaxed max-w-xl">
                Menghilangkan lonjakan koordinat palsu dengan algoritma peredam deviasi (*drift damping*). Posisi Anda diukur secara berwaktu nyata tanpa jeda *cache*, menyamai standar presisi *share-location* tingkat tertinggi.
              </p>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/[0.08]">
              <div>
                <span className="block text-2xl sm:text-3xl font-black font-mono text-white">±1.2m</span>
                <span className="text-[10px] font-mono text-neutral-500 uppercase">Akurasi Satelit</span>
              </div>
              <div>
                <span className="block text-2xl sm:text-3xl font-black font-mono text-cyan-400">0 ms</span>
                <span className="text-[10px] font-mono text-neutral-500 uppercase">Latensi Cache</span>
              </div>
              <div>
                <span className="block text-2xl sm:text-3xl font-black font-mono text-emerald-400">100%</span>
                <span className="text-[10px] font-mono text-neutral-500 uppercase">Realtime Stream</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* CARD 2: Mesin Algoritma Evakuasi Tercepat (1-column span) */}
        <motion.div 
          whileHover={{ y: -4 }}
          whileTap={{ scale: 0.99 }}
          transition={{ type: 'spring', damping: 26, stiffness: 280, bounce: 0 }}
          className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-neutral-900/90 via-black to-neutral-950 border border-white/[0.08] overflow-hidden group shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex flex-col justify-between"
        >
          <div className="absolute top-0 right-0 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-amber-500/15 transition-all duration-500" />
          
          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.25)]">
                <Compass className="w-6 h-6" />
              </div>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                DIJKSTRA + HAVERSINE
              </span>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-mono font-bold text-amber-400 tracking-wider uppercase">Algoritma Penyelamatan</span>
              <h3 className="text-xl font-bold text-white tracking-tight">
                Kalkulasi Jalur Shelter Tercepat
              </h3>
              <p className="text-neutral-400 text-xs leading-relaxed">
                Algoritma graf lokal cerdas yang secara instan menghitung jarak jalan raya nyata menuju titik kumpul dan shelter penampungan terdekat dengan elevasi paling aman.
              </p>
            </div>

            {/* Path Graphic Animation */}
            <div className="w-full h-14 rounded-xl bg-black/60 border border-white/[0.06] p-2 relative overflow-hidden flex items-center">
              <svg viewBox="0 0 200 40" className="w-full h-full">
                <circle cx="20" cy="20" r="5" fill="#f59e0b" />
                <motion.path 
                  d="M 20 20 Q 70 5 120 25 T 180 15" 
                  fill="none" 
                  stroke="#f59e0b" 
                  strokeWidth="2.5" 
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
                />
                <circle cx="180" cy="15" r="5" fill="#10b981" />
              </svg>
            </div>
          </div>

          <div className="relative z-10 pt-4 mt-4 border-t border-white/[0.08] flex items-center justify-between text-xs font-mono text-amber-300">
            <span>Filter Ketinggian Shelter</span>
            <span className="font-bold">ELEVASI TINGGI ✓</span>
          </div>
        </motion.div>

        {/* CARD 3: Informasi Gempa Bumi Cepat, Tepat & Akurat (1-column span) */}
        <motion.div 
          whileHover={{ y: -4 }}
          whileTap={{ scale: 0.99 }}
          transition={{ type: 'spring', damping: 26, stiffness: 280, bounce: 0 }}
          className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-neutral-900/90 via-black to-neutral-950 border border-white/[0.08] overflow-hidden group shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex flex-col justify-between"
        >
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-4 relative z-10">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.25)]">
                <Activity className="w-6 h-6 animate-pulse" />
              </div>
              <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono text-[9px] font-bold border border-rose-500/40">
                SENSOR SEISMIK REAL-TIME
              </span>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-mono font-bold text-rose-400 tracking-wider uppercase">Peringatan Dini Seismik</span>
              <h3 className="text-xl font-bold text-white tracking-tight">
                Informasi Gempa Tepat & Akurat
              </h3>
              <p className="text-neutral-400 text-xs leading-relaxed">
                Menerima data gempa seketika dari sensor seismik resmi. Menyajikan magnitudo presisi, kedalaman, episentrum, radius getaran, serta kalkulasi dini potensi tsunami tanpa jeda.
              </p>
            </div>

            {/* Live Seismogram Waveform Graphic */}
            <div className="p-2.5 rounded-xl bg-black/60 border border-white/[0.06] space-y-1">
              <div className="flex items-center justify-between text-[9px] font-mono text-neutral-400">
                <span>TELEMETRI SEISMIK</span>
                <span className="text-rose-400 font-bold">M 6.1 // TERVERIFIKASI</span>
              </div>
              <svg viewBox="0 0 200 30" className="w-full h-7 overflow-visible">
                <motion.path
                  d="M 0 15 L 40 15 L 45 8 L 52 22 L 58 5 L 66 25 L 74 10 L 82 20 L 90 15 L 140 15 L 145 11 L 150 19 L 155 15 L 200 15"
                  fill="none"
                  stroke="#f43f5e"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                />
              </svg>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-white/[0.08] flex items-center justify-between">
            <span className="text-2xl font-black font-mono text-rose-400">&lt; 3 DETIK</span>
            <span className="text-[10px] font-mono text-neutral-400 uppercase">Deteksi Peringatan Dini</span>
          </div>
        </motion.div>

        {/* CARD 4: Siaran Peringatan Dini Resmi Otoritas Kebencanaan */}
        <motion.div 
          whileHover={{ y: -4 }}
          whileTap={{ scale: 0.99 }}
          transition={{ type: 'spring', damping: 26, stiffness: 280, bounce: 0 }}
          className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-neutral-900/90 via-black to-neutral-950 border border-white/[0.08] overflow-hidden group shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex flex-col justify-between"
        >
          <div className="space-y-4 relative z-10">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.25)]">
                <Radio className="w-6 h-6" />
              </div>
              <span className="px-2 py-0.5 rounded bg-orange-500/20 text-orange-300 font-mono text-[9px] font-bold border border-orange-500/40">
                OTORITAS RESMI
              </span>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-mono font-bold text-orange-400 tracking-wider uppercase">Siaran Kedaruratan Resmi</span>
              <h3 className="text-xl font-bold text-white tracking-tight">
                Spanduk Arahan Siaga Darurat
              </h3>
              <p className="text-neutral-400 text-xs leading-relaxed">
                Pesan instruksi resmi dari otoritas kebencanaan (BPBD & SAR) berverifikasi khusus, otomatis membentangkan spanduk siaga di ponsel warga secara seketika dan tembus mode hening.
              </p>
            </div>
          </div>

          <div className="pt-4 mt-6 border-t border-white/[0.08] flex items-center justify-between text-xs font-mono text-orange-300">
            <span>Protokol Siaga Bencana</span>
            <span className="font-bold">PRIORITAS TINGGI</span>
          </div>
        </motion.div>

        {/* CARD 5: Radar Keselamatan Unit Keluarga (with 360 Radar Sweep) */}
        <motion.div 
          whileHover={{ y: -4 }}
          whileTap={{ scale: 0.99 }}
          transition={{ type: 'spring', damping: 26, stiffness: 280, bounce: 0 }}
          className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-neutral-900/90 via-black to-neutral-950 border border-white/[0.08] overflow-hidden group shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex flex-col justify-between"
        >
          <div className="space-y-4 relative z-10">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.25)]">
                <Users className="w-6 h-6" />
              </div>
              
              {/* Mini Sweeping Radar Dot */}
              <div className="w-8 h-8 rounded-full border border-emerald-500/30 relative flex items-center justify-center">
                <div 
                  className="absolute inset-0 rounded-full animate-spin pointer-events-none"
                  style={{
                    animationDuration: '3s',
                    background: 'conic-gradient(from 0deg, transparent 70%, rgba(16, 185, 129, 0.4) 100%)'
                  }}
                />
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-mono font-bold text-emerald-400 tracking-wider uppercase">Jaring Perlindungan Keluarga</span>
              <h3 className="text-xl font-bold text-white tracking-tight">
                Pemantau Keselamatan Keluarga
              </h3>
              <p className="text-neutral-400 text-xs leading-relaxed">
                Tautkan anggota keluarga cukup dengan memindai kode privat 6-digit. Pantau posisi anggota keluarga dan saling kirim status konfirmasi keselamatan dengan sekali sentuh.
              </p>
            </div>
          </div>

          <div className="pt-4 mt-6 border-t border-white/[0.08] flex items-center justify-between text-xs font-mono text-emerald-300">
            <span>Privasi Terenkripsi</span>
            <span className="font-bold">ZERO-TRACKING ✓</span>
          </div>
        </motion.div>

        {/* CARD 6: Kriptografi & Kedaulatan Data Lokal (1-column span) */}
        <motion.div 
          whileHover={{ y: -4 }}
          whileTap={{ scale: 0.99 }}
          transition={{ type: 'spring', damping: 26, stiffness: 280, bounce: 0 }}
          className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-neutral-900/90 via-black to-neutral-950 border border-white/[0.08] overflow-hidden group shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex flex-col justify-between"
        >
          <div className="space-y-4 relative z-10">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.25)]">
                <Lock className="w-6 h-6" />
              </div>
              <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono text-[9px] font-bold border border-indigo-500/40">
                AES-GCM 256-BIT
              </span>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-mono font-bold text-indigo-400 tracking-wider uppercase">Keamanan & Kedaulatan Data</span>
              <h3 className="text-xl font-bold text-white tracking-tight">
                Penyimpanan Lokal Terenkripsi
              </h3>
              <p className="text-neutral-400 text-xs leading-relaxed">
                Riwayat peringatan, titik shelter, dan rute tersimpan aman di ruang penyimpanan lokal perangkat Anda. Prinsip 1 Perangkat = 1 Identitas menjamin keabsahan data tanpa server pihak ketiga.
              </p>
            </div>
          </div>

          <div className="pt-4 mt-6 border-t border-white/[0.08] flex items-center justify-between text-xs font-mono text-indigo-300">
            <span>Standar Enkripsi</span>
            <span className="font-bold">1 PERANGKAT = 1 IDENTITAS</span>
          </div>
        </motion.div>

      </div>
    </div>
  )
}

export default BentoGrid
