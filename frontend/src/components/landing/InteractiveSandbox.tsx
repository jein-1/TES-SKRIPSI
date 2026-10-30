import React, { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { 
  Satellite, 
  Compass, 
  Navigation, 
  MapPin, 
  ShieldAlert, 
  ShieldCheck, 
  Users, 
  Radio, 
  Clock, 
  ArrowRight, 
  Lock, 
  Wifi, 
  WifiOff, 
  CheckCircle2, 
  Activity,
  Layers,
  Sparkles,
  AlertTriangle
} from 'lucide-react'

interface FeatureTab {
  id: string
  name: string
  shortLabel: string
  accentColor: string
  accentBg: string
  accentBorder: string
}

const FEATURE_TABS: FeatureTab[] = [
  {
    id: 'sharelock',
    name: 'Pelacakan Satelit Sharelock',
    shortLabel: 'SHARELOCK SATELIT',
    accentColor: '#06b6d4',
    accentBg: 'rgba(6, 182, 212, 0.12)',
    accentBorder: 'rgba(6, 182, 212, 0.35)'
  },
  {
    id: 'routing',
    name: 'Navigasi Menuju Shelter Terdekat',
    shortLabel: 'RUTE SHELTER',
    accentColor: '#f97316',
    accentBg: 'rgba(249, 115, 22, 0.12)',
    accentBorder: 'rgba(249, 115, 22, 0.35)'
  },
  {
    id: 'earthquake',
    name: 'Informasi Gempa Tepat & Akurat',
    shortLabel: 'INFORMASI GEMPA',
    accentColor: '#f43f5e',
    accentBg: 'rgba(244, 63, 94, 0.12)',
    accentBorder: 'rgba(244, 63, 94, 0.35)'
  },
  {
    id: 'family',
    name: 'Radar Unit Keluarga',
    shortLabel: 'RADAR KELUARGA',
    accentColor: '#10b981',
    accentBg: 'rgba(16, 185, 129, 0.12)',
    accentBorder: 'rgba(16, 185, 129, 0.35)'
  },
  {
    id: 'sensors',
    name: 'Kompas Azimuth & Elevasi',
    shortLabel: 'KOMPAS ELEVASI',
    accentColor: '#eab308',
    accentBg: 'rgba(234, 179, 8, 0.12)',
    accentBorder: 'rgba(234, 179, 8, 0.35)'
  }
]

export const InteractiveSandbox: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('sharelock')

  // Feature 1 State: Satelit Sharelock
  const [driftDampingActive, setDriftDampingActive] = useState<boolean>(true)

  // Feature 2 State: Rute Evakuasi Shelter
  const [selectedShelterIndex, setSelectedShelterIndex] = useState<number>(0)
  const shelters = [
    { name: 'Shelter Balai Kota Palu', elevation: '+42m mdpl', distance: '1.4 KM', time: '14 Menit', dPath: 'M 90 190 Q 140 160 190 130 T 280 80 T 330 50' },
    { name: 'Shelter Lapangan Vatulemo', elevation: '+20m mdpl', distance: '0.8 KM', time: '9 Menit', dPath: 'M 90 190 Q 150 170 210 140 T 260 110' },
    { name: 'Shelter Hutan Kota Kaombona', elevation: '+65m mdpl', distance: '2.7 KM', time: '26 Menit', dPath: 'M 90 190 Q 130 140 200 110 T 310 60 T 360 30' }
  ]

  // Feature 3 State: Informasi Gempa Tepat & Akurat
  const [selectedQuakePreset, setSelectedQuakePreset] = useState<number>(0)
  const [isQuakeSimulating, setIsQuakeSimulating] = useState<boolean>(false)
  const earthquakePresets = [
    {
      id: 'palukoro',
      magnitude: '6.1',
      scale: 'VI MMI (Kuat)',
      location: 'Sesar Palu-Koro (Palu Timur)',
      coordinates: '0.89° LS - 119.87° BT',
      depth: '10 KM (Dangkal)',
      distance: '4.2 KM',
      timeToArrival: '1.8 Detik',
      tsunamiRisk: 'TIDAK BERPOTENSI TSUNAMI',
      tsunamiRiskColor: 'text-emerald-400',
      action: 'Berlindung di bawah meja kokoh, jauhi kaca dan dinding bata.'
    },
    {
      id: 'telukpalu',
      magnitude: '7.4',
      scale: 'VIII MMI (Sangat Kuat)',
      location: 'Teluk Palu / Selat Makassar',
      coordinates: '0.22° LS - 119.78° BT',
      depth: '11 KM (Dangkal)',
      distance: '28.5 KM',
      timeToArrival: '5.4 Detik',
      tsunamiRisk: 'PERINGATAN DINI TSUNAMI (SIAGA)',
      tsunamiRiskColor: 'text-rose-400',
      action: 'Segera evakuasi mandiri ke tempat tinggi (> +30m mdpl), jauhi bibir pantai.'
    },
    {
      id: 'lindu',
      magnitude: '4.5',
      scale: 'III MMI (Ringan)',
      location: 'Danau Lindu / Sigi',
      coordinates: '1.31° LS - 120.08° BT',
      depth: '15 KM',
      distance: '52.0 KM',
      timeToArrival: '12.0 Detik',
      tsunamiRisk: 'TIDAK BERPOTENSI TSUNAMI',
      tsunamiRiskColor: 'text-emerald-400',
      action: 'Tetap tenang, pastikan barang mudah jatuh telah diamankan.'
    }
  ]

  // Feature 4 State: Radar Unit Keluarga
  const [familyStatusSent, setFamilyStatusSent] = useState<boolean>(false)

  // Feature 5 State: Kompas Azimuth
  const [compassHeading, setCompassHeading] = useState<number>(45)

  const currentTab = FEATURE_TABS.find(t => t.id === activeTab) || FEATURE_TABS[0]

  const getHeadingText = (deg: number) => {
    if (deg >= 337.5 || deg < 22.5) return 'U (Utara)'
    if (deg >= 22.5 && deg < 67.5) return 'TL (Timur Laut)'
    if (deg >= 67.5 && deg < 112.5) return 'T (Timur)'
    if (deg >= 112.5 && deg < 157.5) return 'TG (Tenggara)'
    if (deg >= 157.5 && deg < 202.5) return 'S (Selatan)'
    if (deg >= 202.5 && deg < 247.5) return 'BD (Barat Daya)'
    if (deg >= 247.5 && deg < 292.5) return 'B (Barat)'
    return 'BL (Barat Laut)'
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6">
      
      {/* ── TOP SEGMENTED CONTROL / FEATURE SELECTOR ───────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-8 scrollbar-none">
        {FEATURE_TABS.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <motion.button
              whileTap={{ scale: 0.96 }}
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex-1 min-w-[170px] sm:min-w-0 px-4 py-3 rounded-2xl border text-center transition-all cursor-pointer min-h-[50px] ${
                isActive
                  ? 'bg-neutral-900 border-white/20 shadow-[0_4px_25px_rgba(0,0,0,0.6)] text-white'
                  : 'bg-neutral-950/40 border-white/[0.06] text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/40'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeFeatureTabGlow"
                  className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/[0.06] to-transparent pointer-events-none"
                  transition={{ type: 'spring', damping: 26, stiffness: 280, bounce: 0 }}
                />
              )}
              <span className="block text-[10px] font-mono font-bold tracking-wider uppercase mb-0.5 opacity-70">
                {tab.shortLabel}
              </span>
              <span className="block text-xs sm:text-sm font-bold truncate">
                {tab.name}
              </span>
              {isActive && (
                <div 
                  className="mt-2 mx-auto w-8 h-1 rounded-full"
                  style={{ backgroundColor: tab.accentColor }}
                />
              )}
            </motion.button>
          )
        })}
      </div>

      {/* ── INTERACTIVE CANVAS CONTAINER (Apple Dark Keynote Style) ──── */}
      <div className="relative rounded-3xl p-6 sm:p-10 bg-gradient-to-br from-[#07090E] via-[#0B0F19] to-black border border-white/[0.12] shadow-[0_20px_80px_rgba(0,0,0,0.8)] overflow-hidden">
        
        {/* Dynamic Ambient Glow Behind Graphic */}
        <div 
          className="absolute -top-32 -right-32 w-96 h-96 rounded-full blur-[130px] pointer-events-none transition-colors duration-700 opacity-30"
          style={{ backgroundColor: currentTab.accentColor }}
        />
        <div 
          className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full blur-[130px] pointer-events-none transition-colors duration-700 opacity-20"
          style={{ backgroundColor: currentTab.accentColor }}
        />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* LEFT: Feature Controls & Real-world Explanations (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* FEATURE 1: SHARELOCK SATELIT */}
            {activeTab === 'sharelock' && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                    <Satellite className="w-3.5 h-3.5 text-cyan-400" />
                    <span>PRESISI SATELIT TINGGI (±1.2m)</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    Mesin Lokasi Satelit Sharelock
                  </h3>
                  <p className="text-sm text-neutral-300 leading-relaxed font-normal">
                    Memanfaatkan sensor GNSS tanpa ketergantungan cache lawas (<strong className="text-cyan-400">0ms stale cache</strong>). Dilengkapi algoritma peredam lonjakan koordinat untuk mencegah titik GPS melompat saat warga berada di dekat gedung tinggi.
                  </p>
                </div>

                {/* Interactive Drift Damping Switch */}
                <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] space-y-3">
                  <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest block">
                    KENDALI SIMULASI SENSOR LOKASI:
                  </span>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-white">Algoritma Peredam Drift Koordinat</p>
                      <p className="text-[10px] text-neutral-400">
                        {driftDampingActive ? 'Aktif: Presisi terkunci ±1.2m tanpa jitter' : 'Non-Aktif: Simulasi lonjakan GPS mentah'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setDriftDampingActive(!driftDampingActive)}
                      className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer min-h-[24px] ${
                        driftDampingActive ? 'bg-cyan-500' : 'bg-neutral-800'
                      }`}
                    >
                      <motion.div
                        animate={{ x: driftDampingActive ? 24 : 3 }}
                        transition={{ type: 'spring', damping: 24, stiffness: 300 }}
                        className="w-4 h-4 rounded-full bg-white shadow-md top-1 absolute"
                      />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <span className="block text-[9px] text-neutral-500 uppercase">Akurasi Posisi</span>
                    <span className="text-lg font-black text-cyan-400">
                      {driftDampingActive ? '±1.2 Meter' : '±24.8 Meter'}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <span className="block text-[9px] text-neutral-500 uppercase">Jeda Cache</span>
                    <span className="text-lg font-black text-white">0 milidetik</span>
                  </div>
                </div>
              </div>
            )}

            {/* FEATURE 2: ROUTING SHELTER AMAN */}
            {activeTab === 'routing' && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-orange-500/10 text-orange-300 border border-orange-500/30">
                    <Compass className="w-3.5 h-3.5 text-orange-400" />
                    <span>NAVIGASI SHELTER AMAN (DIJKSTRA)</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    Kalkulasi Rute Menuju Shelter Terdekat
                  </h3>
                  <p className="text-sm text-neutral-300 leading-relaxed font-normal">
                    Algoritma rute A.T.L.A.S secara cerdas menghitung jalan raya nyata, otomatis mengarahkan warga menuju shelter evakuasi dan titik kumpul terdekat dengan elevasi dataran tinggi yang aman.
                  </p>
                </div>

                {/* Shelter Selector Pills */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest block">
                    PILIH TITIK SHELTER TUJUAN EVAKUASI:
                  </span>
                  
                  <div className="space-y-2">
                    {shelters.map((sh, idx) => (
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        key={idx}
                        onClick={() => setSelectedShelterIndex(idx)}
                        className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer min-h-[48px] ${
                          selectedShelterIndex === idx
                            ? 'bg-orange-500/15 border-orange-500/50 text-white shadow-md'
                            : 'bg-white/[0.03] border-white/[0.06] text-neutral-400 hover:bg-white/[0.06]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <MapPin className={`w-4 h-4 ${selectedShelterIndex === idx ? 'text-orange-400' : 'text-neutral-500'}`} />
                          <div>
                            <span className="text-xs font-bold block text-white">{sh.name}</span>
                            <span className="text-[10px] text-neutral-400 font-mono">Elevasi: {sh.elevation}</span>
                          </div>
                        </div>
                        <span className="text-xs font-mono font-bold text-orange-400">{sh.distance}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* FEATURE 3: INFORMASI GEMPA TEPAT & AKURAT */}
            {activeTab === 'earthquake' && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-rose-500/10 text-rose-300 border border-rose-500/30">
                    <Activity className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                    <span>TELEMETRI SEISMIK REAL-TIME</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    Informasi Gempa Tepat & Akurat
                  </h3>
                  <p className="text-sm text-neutral-300 leading-relaxed font-normal">
                    Menerima peringatan gempa bumi secara presisi dan seketika. Menghitung magnitudo, episentrum, radius getaran (MMI), serta estimasi tiba gelombang destruktif sebelum terjadi kerusakan.
                  </p>
                </div>

                {/* Scenario Selector */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest block">
                    PILIH SKENARIO TELEMETRI GEMPA:
                  </span>
                  <div className="grid grid-cols-1 gap-2">
                    {earthquakePresets.map((preset, idx) => {
                      const isSelected = selectedQuakePreset === idx
                      return (
                        <motion.button
                          key={preset.id}
                          whileTap={{ scale: 0.98 }}
                          type="button"
                          onClick={() => {
                            setSelectedQuakePreset(idx)
                            setIsQuakeSimulating(true)
                            setTimeout(() => setIsQuakeSimulating(false), 3000)
                          }}
                          className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer min-h-[48px] flex items-center justify-between ${
                            isSelected 
                              ? 'bg-rose-500/15 border-rose-500/50 shadow-lg shadow-rose-950/40' 
                              : 'bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.06]'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono font-black text-xs ${
                              isSelected ? 'bg-rose-500 text-white' : 'bg-white/10 text-neutral-300'
                            }`}>
                              M{preset.magnitude}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-white leading-tight">{preset.location}</p>
                              <p className="text-[10px] text-neutral-400 font-mono mt-0.5">{preset.scale} • Kedalaman {preset.depth}</p>
                            </div>
                          </div>
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                            isSelected ? 'bg-rose-500/30 text-rose-200' : 'text-neutral-500'
                          }`}>
                            {isSelected ? 'AKTIF' : 'UJI'}
                          </span>
                        </motion.button>
                      )
                    })}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/30 text-xs font-mono text-rose-200 flex items-center justify-between">
                  <span>SUMBER TELEMETRI:</span>
                  <span className="font-bold text-rose-300">SENSOR BMKG & POSKO RESMI ✓</span>
                </div>
              </div>
            )}

            {/* FEATURE 4: RADAR KELUARGA */}
            {activeTab === 'family' && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                    <Users className="w-3.5 h-3.5 text-emerald-400" />
                    <span>JARINGAN MESH TIMBAL-BALIK</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    Pemantau Keselamatan Keluarga
                  </h3>
                  <p className="text-sm text-neutral-300 leading-relaxed font-normal">
                    Tautkan perangkat keluarga cukup dengan memindai kode privat 6-digit. Pantau posisi anggota keluarga di layar radar dan konfirmasi kondisi keselamatan seketika dengan satu ketukan.
                  </p>
                </div>

                {/* Instant "SAYA AMAN" Action Button */}
                <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] space-y-3">
                  <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest block">
                    AKSI CEPAT SATU KETUKAN:
                  </span>

                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    type="button"
                    onClick={() => {
                      setFamilyStatusSent(true)
                      setTimeout(() => setFamilyStatusSent(false), 2500)
                    }}
                    className="w-full py-3.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs font-mono flex items-center justify-center gap-2 transition-all shadow-[0_0_25px_rgba(16,185,129,0.4)] cursor-pointer min-h-[48px]"
                  >
                    <CheckCircle2 className="w-4 h-4 text-black" />
                    <span>{familyStatusSent ? 'STATUS TERKIRIM: SAYA AMAN ✓' : 'KIRIM STATUS: SAYA AMAN ✓'}</span>
                  </motion.button>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <span className="block text-[9px] text-neutral-500 uppercase">Unit Terhubung</span>
                    <span className="text-lg font-black text-emerald-400">3 Anggota</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <span className="block text-[9px] text-neutral-500 uppercase">Enkripsi Sesi</span>
                    <span className="text-lg font-black text-white">Privat 6-Digit</span>
                  </div>
                </div>
              </div>
            )}

            {/* FEATURE 5: SENSOR KOMPAS AZIMUTH & ELEVASI */}
            {activeTab === 'sensors' && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-amber-500/10 text-amber-300 border border-amber-500/30">
                    <Compass className="w-3.5 h-3.5 text-amber-400" />
                    <span>TELEMETRI HARDWARE ASLI</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    Kompas Azimuth & Altimeter Elevasi
                  </h3>
                  <p className="text-sm text-neutral-300 leading-relaxed font-normal">
                    Membaca magnetometer dan altimeter perangkat keras ponsel secara real-time. Memandu Anda menentukan arah mata angin vertikal menuju dataran tinggi aman di atas ambang batas bahaya air.
                  </p>
                </div>

                {/* Compass Heading Slider */}
                <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-[10px] text-neutral-400 uppercase tracking-widest font-bold">
                      SIMULASI ORIENTASI ARAH (AZIMUTH):
                    </span>
                    <span className="text-amber-400 font-black text-sm">
                      {compassHeading}° • {getHeadingText(compassHeading)}
                    </span>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="360"
                    step="5"
                    value={compassHeading}
                    onChange={(e) => setCompassHeading(parseInt(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer h-2 bg-neutral-800 rounded-lg appearance-none"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-neutral-500">
                    <span>0° (U)</span>
                    <span>90° (T)</span>
                    <span>180° (S)</span>
                    <span>270° (B)</span>
                    <span>360° (U)</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <span className="block text-[9px] text-neutral-500 uppercase">Elevasi Warga</span>
                    <span className="text-lg font-black text-amber-400">+42 Meter</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <span className="block text-[9px] text-neutral-500 uppercase">Status Elevasi</span>
                    <span className="text-lg font-black text-emerald-400">AMAN ✓</span>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* RIGHT: High-Aesthetic Motion Graphic Stage (7 cols) */}
          <div className="lg:col-span-7">
            <div className="relative w-full aspect-[4/3] sm:aspect-[16/11] rounded-2xl bg-black/90 border border-white/[0.12] p-4 sm:p-6 overflow-hidden shadow-2xl flex flex-col justify-between">
              
              {/* Top HUD Telemetry Bar */}
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 text-[10px] font-mono text-neutral-400">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: currentTab.accentColor }} />
                  <span className="text-white font-bold tracking-wider">A.T.L.A.S TELEMETRY ENGINE</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-neutral-500">KOTA PALU // SULTENG</span>
                  <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-neutral-300">
                    LIVE SIM
                  </span>
                </div>
              </div>

              {/* ── CANVAS PER ACTIVE FEATURE TAB ───────────────────────── */}
              <div className="relative flex-1 my-4 flex items-center justify-center overflow-hidden">
                <AnimatePresence mode="wait">
                  
                  {/* CANVAS 1: SATELIT SHARELOCK */}
                  {activeTab === 'sharelock' && (
                    <motion.div
                      key="canvas-sharelock"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
                      className="w-full h-full flex flex-col items-center justify-center relative"
                    >
                      {/* Rotating satellite orbit ring */}
                      <div className="absolute w-56 h-56 rounded-full border border-dashed border-cyan-500/30 animate-spin" style={{ animationDuration: '16s' }}>
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-400 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.8)]">
                          <Satellite className="w-3.5 h-3.5 text-cyan-300" />
                        </div>
                      </div>

                      {/* Radar sweep crosshairs */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
                        <div className="w-full h-[1px] bg-cyan-400" />
                        <div className="absolute h-full w-[1px] bg-cyan-400" />
                      </div>

                      {/* User Node with simulated jitter vs damped precision */}
                      <motion.div
                        animate={driftDampingActive ? {
                          x: 0,
                          y: 0,
                          scale: [1, 1.08, 1]
                        } : {
                          x: [0, 16, -14, 18, -12, 0],
                          y: [0, -14, 16, -10, 14, 0],
                          scale: [1, 1.25, 0.9, 1.2, 1]
                        }}
                        transition={driftDampingActive ? {
                          repeat: Infinity,
                          duration: 2
                        } : {
                          repeat: Infinity,
                          duration: 1.2,
                          ease: 'easeInOut'
                        }}
                        className={`w-12 h-12 rounded-full border flex items-center justify-center relative z-10 ${
                          driftDampingActive
                            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_30px_rgba(6,182,212,0.6)]'
                            : 'bg-red-500/20 border-red-400 text-red-300 shadow-[0_0_30px_rgba(239,68,68,0.6)]'
                        }`}
                      >
                        <Navigation className="w-6 h-6 transform -rotate-45" />
                      </motion.div>

                      {/* High-accuracy HUD Badge */}
                      <div className="mt-3 p-3 rounded-2xl bg-neutral-900/90 border border-cyan-500/40 backdrop-blur-xl shadow-xl text-center space-y-1 relative z-10">
                        <div className="flex items-center justify-center gap-1.5 text-xs font-mono font-bold text-white">
                          <Compass className="w-3.5 h-3.5 text-cyan-400" />
                          <span>SHARELOCK GNSS // {driftDampingActive ? 'TERKUNCI STABIL' : 'DRIFT TERDETEKSI'}</span>
                        </div>
                        
                        <p className={`text-[11px] font-mono font-bold ${driftDampingActive ? 'text-cyan-300' : 'text-red-400'}`}>
                          {driftDampingActive ? 'AKURASI MAKSIMAL: ±1.2 METER (0ms CACHE)' : 'LONJAKAN KOORDINAT: ±24.8 METER'}
                        </p>

                        <div className="flex items-center justify-center gap-3 text-[10px] font-mono text-neutral-400 pt-1 border-t border-white/10">
                          <span>14 SATELIT</span>
                          <span>•</span>
                          <span>LATENSI 0ms</span>
                          <span>•</span>
                          <span>SULTENG</span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* CANVAS 2: ROUTE SHELTER */}
                  {activeTab === 'routing' && (
                    <motion.div
                      key="canvas-routing"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
                      className="w-full h-full flex items-center justify-center relative"
                    >
                      <svg viewBox="0 0 400 240" className="w-full h-full">
                        <defs>
                          <pattern id="sandboxHazardPattern" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                            <line x1="0" y1="0" x2="0" y2="10" stroke="#ef4444" strokeWidth="2" opacity="0.3" />
                          </pattern>
                          <linearGradient id="sandboxRouteGlow" x1="0%" y1="100%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#06b6d4" />
                            <stop offset="60%" stopColor="#f97316" />
                            <stop offset="100%" stopColor="#10b981" />
                          </linearGradient>
                        </defs>

                        {/* Coastal Hazard Zone on Left Shore */}
                        <path 
                          d="M 10 20 Q 70 80 50 140 T 30 220 L 0 220 L 0 20 Z" 
                          fill="url(#sandboxHazardPattern)"
                          stroke="#ef4444"
                          strokeWidth="1.5"
                          strokeDasharray="4 2"
                        />
                        <text x="14" y="110" fill="#f87171" fontSize="9" fontFamily="monospace" fontWeight="bold" transform="rotate(-70 14 110)">
                          GARIS PANTAI PESISIR
                        </text>

                        {/* Road Network */}
                        <path d="M 60 200 L 140 180 L 220 120 L 320 60" stroke="#334155" strokeWidth="6" fill="none" strokeLinecap="round" />
                        <path d="M 140 180 L 130 90 L 220 120" stroke="#334155" strokeWidth="4" fill="none" strokeLinecap="round" />
                        <path d="M 220 120 L 290 190 L 370 160" stroke="#334155" strokeWidth="4" fill="none" strokeLinecap="round" />

                        {/* Animated Bypass Route to Selected Shelter */}
                        <motion.path 
                          key={selectedShelterIndex}
                          d={shelters[selectedShelterIndex].dPath}
                          fill="none"
                          stroke="url(#sandboxRouteGlow)"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                        />

                        {/* User Starting Node */}
                        <circle cx="90" cy="190" r="7" fill="#06b6d4" />
                        <circle cx="90" cy="190" r="14" fill="none" stroke="#06b6d4" opacity="0.4" />
                        <text x="90" y="214" fill="#e2e8f0" fontSize="10" fontFamily="sans-serif" fontWeight="bold" textAnchor="middle">
                          Posisi Anda
                        </text>

                        {/* Destination Safe Haven Shelter */}
                        <circle cx="330" cy="50" r="9" fill="#10b981" />
                        <circle cx="330" cy="50" r="18" fill="none" stroke="#10b981" opacity="0.4" />
                        <text x="330" y="34" fill="#4ade80" fontSize="10" fontFamily="sans-serif" fontWeight="bold" textAnchor="middle">
                          {shelters[selectedShelterIndex].name}
                        </text>
                      </svg>

                      {/* Navigation Instruction Overlay */}
                      <div className="absolute bottom-2 left-2 p-3 rounded-xl bg-neutral-900/95 border border-orange-500/40 backdrop-blur-xl text-xs font-mono space-y-1">
                        <div className="flex items-center gap-1.5 text-orange-400 font-bold">
                          <ArrowRight className="w-3.5 h-3.5 transform -rotate-45" />
                          <span>HINDARI PESISIR // BELOK KANAN MENUJU ELEVASI TINGGI</span>
                        </div>
                        <p className="text-[10px] text-neutral-400">
                          Jarak: {shelters[selectedShelterIndex].distance} • Waktu: {shelters[selectedShelterIndex].time} • Jalur Aman Terverifikasi ✓
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {/* CANVAS 3: INFORMASI GEMPA TEPAT & AKURAT */}
                  {activeTab === 'earthquake' && (
                    <motion.div
                      key="canvas-earthquake"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
                      className="w-full h-full flex flex-col items-center justify-between p-2 relative"
                    >
                      {/* Epicenter Radar & Seismograph Visual */}
                      <div className="relative w-full h-44 sm:h-52 flex items-center justify-center overflow-hidden rounded-2xl bg-black/40 border border-white/[0.06]">
                        {/* Radar grid rings */}
                        <div className="absolute w-44 h-44 rounded-full border border-rose-500/20" />
                        <div className="absolute w-28 h-28 rounded-full border border-rose-500/25" />
                        <div className="absolute w-12 h-12 rounded-full border border-rose-500/30" />

                        {/* Animated expanding seismic waves from epicenter */}
                        <motion.div
                          animate={{ scale: [1, 2.8], opacity: [0.8, 0] }}
                          transition={{ repeat: Infinity, duration: 2, ease: 'easeOut' }}
                          className="absolute w-16 h-16 rounded-full border-2 border-rose-500 pointer-events-none"
                        />
                        <motion.div
                          animate={{ scale: [1, 3.8], opacity: [0.6, 0] }}
                          transition={{ repeat: Infinity, duration: 2, delay: 0.5, ease: 'easeOut' }}
                          className="absolute w-16 h-16 rounded-full border border-amber-500 pointer-events-none"
                        />

                        {/* Center Epicenter Blip */}
                        <div className="relative z-10 flex flex-col items-center">
                          <div className="w-10 h-10 rounded-full bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center shadow-[0_0_25px_rgba(244,63,94,0.6)] animate-pulse">
                            <Activity className="w-5 h-5 text-rose-300" />
                          </div>
                          <span className="text-[9px] font-mono font-bold text-rose-300 bg-black/80 px-2 py-0.5 rounded-full border border-rose-500/40 mt-1 shadow-lg">
                            EPISENTRUM M{earthquakePresets[selectedQuakePreset].magnitude}
                          </span>
                        </div>

                        {/* Live Seismogram Wave at bottom of canvas */}
                        <div className="absolute bottom-1 left-2 right-2 pointer-events-none">
                          <svg viewBox="0 0 240 24" className="w-full h-6 opacity-70">
                            <motion.path
                              d="M 0 12 L 40 12 L 45 4 L 52 20 L 58 2 L 66 22 L 74 6 L 82 18 L 90 12 L 150 12 L 155 8 L 160 16 L 165 12 L 240 12"
                              fill="none"
                              stroke="#f43f5e"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              initial={{ pathLength: 0 }}
                              animate={{ pathLength: 1 }}
                              transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                            />
                          </svg>
                        </div>
                      </div>

                      {/* Earthquake Alert Information Card */}
                      <div className="w-full p-3.5 rounded-2xl bg-neutral-900/95 border border-rose-500/40 backdrop-blur-xl shadow-xl space-y-2 mt-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                            <span className="text-[11px] font-mono font-bold text-white uppercase">
                              PERINGATAN DINI GEMPA BUMI
                            </span>
                          </div>
                          <span className="text-[9px] font-mono text-neutral-400">
                            EST. TIBA: <strong className="text-white">{earthquakePresets[selectedQuakePreset].timeToArrival}</strong>
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/10 text-[10px] font-mono">
                          <div>
                            <span className="text-neutral-400 block text-[9px]">LOKASI EPISENTRUM:</span>
                            <span className="text-white font-bold">{earthquakePresets[selectedQuakePreset].location}</span>
                          </div>
                          <div>
                            <span className="text-neutral-400 block text-[9px]">KEDALAMAN & JARAK:</span>
                            <span className="text-white font-bold">{earthquakePresets[selectedQuakePreset].depth} • {earthquakePresets[selectedQuakePreset].distance}</span>
                          </div>
                        </div>

                        <div className="p-2 rounded-xl bg-black/50 border border-white/10 flex items-center justify-between text-[10px] font-mono">
                          <span className="text-neutral-400">STATUS ANCAMAN TSUNAMI:</span>
                          <span className={`font-bold ${earthquakePresets[selectedQuakePreset].tsunamiRiskColor}`}>
                            {earthquakePresets[selectedQuakePreset].tsunamiRisk}
                          </span>
                        </div>

                        <p className="text-[10px] text-neutral-300 italic pt-0.5">
                          💡 Panduan: {earthquakePresets[selectedQuakePreset].action}
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {/* CANVAS 4: RADAR UNIT KELUARGA */}
                  {activeTab === 'family' && (
                    <motion.div
                      key="canvas-family"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
                      className="w-full h-full flex items-center justify-center relative"
                    >
                      <div className="relative w-64 h-64 rounded-full border border-emerald-500/20 flex items-center justify-center">
                        <div className="absolute w-44 h-44 rounded-full border border-emerald-500/20" />
                        <div className="absolute w-24 h-24 rounded-full border border-emerald-500/25" />
                        
                        {/* 360-degree radar beam */}
                        <div 
                          className="absolute inset-0 rounded-full animate-spin pointer-events-none"
                          style={{
                            animationDuration: '4s',
                            background: 'conic-gradient(from 0deg, transparent 70%, rgba(16, 185, 129, 0.25) 100%)'
                          }}
                        />

                        {/* Center: User */}
                        <div className="relative z-10 flex flex-col items-center">
                          <div className="w-10 h-10 rounded-full bg-emerald-500/30 border-2 border-emerald-400 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.6)]">
                            <Users className="w-5 h-5 text-emerald-300" />
                          </div>
                          <span className="text-[10px] font-mono font-bold text-white mt-1">Anda</span>
                        </div>

                        {/* Node 1: Family Member (Ayah) */}
                        <div className="absolute top-6 right-8 flex flex-col items-center">
                          <div className="w-8 h-8 rounded-full bg-emerald-600/30 border border-emerald-400 flex items-center justify-center">
                            <span className="text-xs font-bold text-emerald-300">A</span>
                          </div>
                          <span className="text-[9px] font-mono text-emerald-400 font-bold mt-0.5">Ayah • AMAN ✓</span>
                        </div>

                        {/* Node 2: Family Member (Ibu/Kakak) */}
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

                        {/* Ping Shockwave when user triggers status */}
                        {familyStatusSent && (
                          <motion.div 
                            initial={{ scale: 0.5, opacity: 1 }}
                            animate={{ scale: 2.5, opacity: 0 }}
                            transition={{ duration: 1.2, ease: 'easeOut' }}
                            className="absolute w-32 h-32 rounded-full border-2 border-emerald-400 pointer-events-none"
                          />
                        )}
                      </div>

                      {/* Confirmation Badge */}
                      <div className="absolute bottom-2 right-2 p-2.5 rounded-xl bg-neutral-900/90 border border-emerald-500/40 backdrop-blur-xl text-xs font-mono">
                        <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>JARING MESH KELUARGA TERENKRIPSI</span>
                        </span>
                      </div>
                    </motion.div>
                  )}

                  {/* CANVAS 5: SENSOR KOMPAS AZIMUTH & ELEVASI */}
                  {activeTab === 'sensors' && (
                    <motion.div
                      key="canvas-sensors"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
                      className="w-full h-full flex flex-col items-center justify-center relative space-y-4"
                    >
                      {/* Rotating Digital Compass Dial */}
                      <div className="relative w-48 h-48 rounded-full border-2 border-amber-500/30 flex items-center justify-center">
                        {/* Graduations */}
                        <div className="absolute inset-2 rounded-full border border-dashed border-amber-500/20" />
                        
                        {/* Cardinal markers */}
                        <span className="absolute top-1 font-mono font-black text-xs text-amber-400">U</span>
                        <span className="absolute right-2 font-mono font-bold text-[10px] text-neutral-500">T</span>
                        <span className="absolute bottom-1 font-mono font-bold text-[10px] text-neutral-500">S</span>
                        <span className="absolute left-2 font-mono font-bold text-[10px] text-neutral-500">B</span>

                        {/* Rotating Needle */}
                        <motion.div
                          animate={{ rotate: compassHeading }}
                          transition={{ type: 'spring', stiffness: 220, damping: 20 }}
                          className="w-full h-full flex items-center justify-center pointer-events-none"
                        >
                          <div className="w-1.5 h-20 bg-gradient-to-t from-transparent via-amber-400 to-amber-300 rounded-full shadow-[0_0_15px_rgba(234,179,8,0.8)]" />
                        </motion.div>

                        {/* Center Heading readout */}
                        <div className="absolute w-14 h-14 rounded-full bg-neutral-900 border border-amber-500/40 flex flex-col items-center justify-center shadow-lg">
                          <span className="text-xs font-mono font-black text-amber-300">{compassHeading}°</span>
                          <span className="text-[8px] font-mono text-neutral-400">AZIMUTH</span>
                        </div>
                      </div>

                      {/* Elevation Bar Sensor */}
                      <div className="w-full max-w-sm p-3 rounded-xl bg-neutral-900/90 border border-amber-500/30 backdrop-blur-xl flex items-center justify-between text-xs font-mono">
                        <div className="flex items-center gap-2">
                          <Layers className="w-4 h-4 text-amber-400" />
                          <span className="text-neutral-300">ALTIMETER HARDWARE:</span>
                        </div>
                        <span className="text-amber-400 font-black">+42 METER (ELEVASI AMAN MDPL)</span>
                      </div>
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>

              {/* Bottom HUD Stage Footer */}
              <div className="flex items-center justify-between border-t border-white/[0.08] pt-3 text-[10px] font-mono text-neutral-400">
                <div className="flex items-center gap-2">
                  <span className="text-neutral-500">KEDAULATAN PERTAHANAN SIPIL</span>
                  <span className="text-neutral-600">•</span>
                  <span className="text-neutral-300">100% BEBAS DARI SERVER ASING</span>
                </div>
                <div className="flex items-center gap-2 text-neutral-400">
                  <Activity className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
                  <span>SIMULASI OTONOM</span>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>

    </div>
  )
}

export default InteractiveSandbox
