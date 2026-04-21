// ═══════════════════════════════════════════════════════════════
// NAVIGATE PAGE — Emergency Navigation (Turn-by-Turn)
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect } from 'react'
import { AlertTriangle, ArrowUp, ArrowRight, Navigation2, Plus, Minus, Crosshair, Phone } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import type { RouteResult } from '../../lib/evacuation'

interface Props {
  routes: RouteResult[]
  selectedRoute: number
  tsunamiAlert: boolean
  userPosition: [number, number] | null
}

// ── Turn instruction data (computed from beeline bearing) ──────
function getBearing(from: [number, number], to: [number, number]): number {
  const toRad = (d: number) => d * Math.PI / 180
  const dLng = toRad(to[1] - from[1])
  const lat1 = toRad(from[0]); const lat2 = toRad(to[0])
  const y = Math.sin(dLng) * Math.cos(lat2)
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng)
  const brng = Math.atan2(y, x) * 180 / Math.PI
  return (brng + 360) % 360
}

function bearingToLabel(b: number): string {
  if (b < 22.5 || b >= 337.5) return 'Terus Lurus'
  if (b < 67.5)  return 'Belok Kanan'
  if (b < 112.5) return 'Belok Kanan'
  if (b < 157.5) return 'Belok Kanan Jauh'
  if (b < 202.5) return 'Putar Balik'
  if (b < 247.5) return 'Belok Kiri Jauh'
  if (b < 292.5) return 'Belok Kiri'
  return 'Belok Kiri'
}

function haversineMeters(a: [number, number], b: [number, number]): number {
  const R = 6371000
  const toRad = (d: number) => d * Math.PI / 180
  const dLat = toRad(b[0] - a[0])
  const dLng = toRad(b[1] - a[1])
  const x = Math.sin(dLat/2)**2 + Math.cos(toRad(a[0]))*Math.cos(toRad(b[0]))*Math.sin(dLng/2)**2
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1-x))
}

// ── Direction Arrow (rotates based on bearing) ─────────────────
function DirectionArrow({ bearing }: { bearing: number }) {
  return (
    <motion.div
      animate={{ rotate: bearing }}
      transition={{ type: 'spring', damping: 15, stiffness: 100 }}
      className="flex items-center justify-center"
    >
      <ArrowUp className="w-24 h-24 text-slate-300 opacity-30" strokeWidth={1.5} />
    </motion.div>
  )
}

export default function NavigatePage({ routes, selectedRoute, tsunamiAlert, userPosition }: Props) {
  const [showMedical, setShowMedical] = useState(false)
  const route = routes[selectedRoute]
  const shelterPos = route?.coordinates[route.coordinates.length - 1]

  // Compute bearing and distance
  const bearing = (userPosition && shelterPos)
    ? getBearing(userPosition, shelterPos)
    : 0

  const distanceM = (userPosition && shelterPos)
    ? haversineMeters(userPosition, shelterPos)
    : (route?.totalDistance ? route.totalDistance * 1000 : 0)

  const distanceLabel = distanceM < 1000
    ? `${Math.round(distanceM)}m`
    : `${(distanceM / 1000).toFixed(1)} KM`

  const etaMin = Math.max(1, Math.ceil(distanceM / 1000 / 5 * 60))
  const mainInstruction = bearingToLabel(bearing)
  const nextInstruction = bearing < 180 ? 'Belok Kanan di Persimpangan' : 'Belok Kiri di Persimpangan'

  // ── Medical request modal ─────────────────────────────────────
  if (showMedical) {
    return (
      <div className="fixed inset-0 z-[1800] flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm p-6">
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-sm p-6 rounded-3xl border border-red-500/40 bg-[#150808] text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
            <Phone className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-xl font-black text-white mb-2">Bantuan Medis</h3>
          <p className="text-sm text-slate-400 mb-6">Tim SAR akan dikirimkan ke koordinat GPS Anda saat ini.</p>
          <div className="space-y-3">
            <button className="w-full py-3.5 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black text-sm">
              KIRIM PERMINTAAN BANTUAN
            </button>
            <button
              onClick={() => setShowMedical(false)}
              className="w-full py-3 bg-slate-800 text-slate-300 rounded-2xl font-bold text-sm"
            >
              Batal
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  if (!route) {
    return (
      <div className="fixed inset-0 z-[1800] flex items-center justify-center" style={{ background: '#080e1a' }}>
        <div className="text-center p-8">
          <Navigation2 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <p className="text-white font-bold mb-2">Tidak ada rute aktif</p>
          <p className="text-slate-500 text-sm">Aktifkan GPS dan mulai simulasi dari halaman Map.</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[1800] flex flex-col"
      style={{ background: '#080e1a' }}
    >
      {/* Emergency Header */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-red-900/40"
        style={{ background: '#150505' }}>
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-400 animate-pulse" />
          <span className="text-sm font-black text-white tracking-widest">AEGIS RESPONSE</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-600 border border-red-500/50">
          <div className="w-1.5 h-1.5 rounded-full bg-red-200 animate-pulse" />
          <span className="text-xs font-black text-white tracking-wider">EMERGENCY ACTIVE</span>
        </div>
      </div>

      {/* Destination Card */}
      <div className="shrink-0 px-4 pt-4 pb-2">
        <div className="p-4 rounded-2xl border border-slate-700/40" style={{ background: '#0f1a2e' }}>
          <div className="flex items-start gap-3">
            <div className="w-1 h-16 rounded-full bg-indigo-500 shrink-0" />
            <div className="flex-1">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-0.5">Tujuan Evakuasi</p>
              <h2 className="text-2xl font-black text-white leading-tight">
                Lari ke {route.shelterName}
              </h2>
              <div className="flex items-center gap-6 mt-3">
                <div>
                  <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Jarak</p>
                  <p className="text-2xl font-black text-white">{distanceLabel}</p>
                </div>
                <div>
                  <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Waktu Tiba</p>
                  <p className="text-2xl font-black text-white">{etaMin} Menit</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main direction area */}
      <div className="flex-1 relative flex flex-col items-center justify-center">
        {/* Subtle map bg overlay */}
        <div className="absolute inset-0 opacity-10 overflow-hidden">
          <svg width="100%" height="100%" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
            {[0,1,2,3,4].map(i=><line key={`h${i}`} x1="0" y1={i*75} x2="400" y2={i*75} stroke="#334155" strokeWidth="1"/>)}
            {[0,1,2,3,4,5,6].map(i=><line key={`v${i}`} x1={i*65} y1="0" x2={i*65} y2="300" stroke="#334155" strokeWidth="1"/>)}
            <path d="M0,150 C80,130 160,110 240,100 C320,90 360,80 400,75" stroke="#475569" strokeWidth="6" fill="none" strokeLinecap="round"/>
            <path d="M0,200 C100,190 200,180 300,160 C360,148 390,140 400,138" stroke="#475569" strokeWidth="3" fill="none"/>
          </svg>
        </div>

        {/* Direction arrow */}
        <DirectionArrow bearing={bearing} />

        {/* Zoom controls (decorative) */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2">
          {[Plus, Minus, Crosshair].map((Icon, i) => (
            <div key={i} className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/50 flex items-center justify-center">
              <Icon className="w-4 h-4 text-slate-400" />
            </div>
          ))}
        </div>
      </div>

      {/* Main instruction */}
      <div className="shrink-0 px-4 pb-2 text-center">
        <h1 className="text-4xl font-black text-white mb-1">{mainInstruction}</h1>
        {distanceM < 1000 && (
          <p className="text-slate-400 text-sm">
            Lanjutkan sejauh {Math.round(distanceM * 0.5)}m menuju {route.shelterName}
          </p>
        )}
      </div>

      {/* Next step card */}
      <div className="shrink-0 px-4 pb-3">
        <div className="p-3 rounded-2xl border border-slate-700/40 flex items-center gap-3" style={{ background: '#0f1a2e' }}>
          <div className="w-9 h-9 rounded-xl bg-indigo-500/20 flex items-center justify-center shrink-0">
            <ArrowRight className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <p className="text-[10px] text-indigo-400 uppercase tracking-widest font-bold mb-0.5">Langkah Berikutnya</p>
            <p className="text-sm font-bold text-white">{nextInstruction}</p>
          </div>
        </div>
      </div>

      {/* Medical button */}
      <div className="shrink-0 px-4 pb-6">
        <button
          onClick={() => setShowMedical(true)}
          className="w-full py-4 rounded-2xl bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-black text-base tracking-wide transition-colors flex items-center justify-center gap-2 shadow-[0_4px_24px_rgba(239,68,68,0.4)]"
        >
          <span className="text-xl">🏥</span>
          BANTUAN MEDIS
        </button>
      </div>
    </motion.div>
  )
}
