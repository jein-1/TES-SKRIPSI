// ═══════════════════════════════════════════════════════════════
// SENSORS PAGE — Telemetry Array Integration (Locked / Coming Soon)
// ═══════════════════════════════════════════════════════════════
import { Lock, Radio, ShieldAlert, Cpu, Activity, ChevronLeft, Signal } from 'lucide-react'
import { motion } from 'motion/react'

interface Props {
  onBack?: () => void
}

export default function SensorsPage({ onBack }: Props) {
  return (
    <div className="min-h-screen bg-[#07090E] text-slate-300 font-mono flex flex-col pb-24">
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/80 bg-[#0B0F19]/90 sticky top-0 z-20 backdrop-blur-md">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
              title="Kembali ke Peta"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-slate-400">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div>
              <h1 className="text-white font-black text-xs tracking-wider leading-none">
                ARRAY SENSOR TELEMETRI
              </h1>
              <span className="text-[8px] text-slate-500 font-bold uppercase">
                TAHAP INTEGRASI HARDWARE
              </span>
            </div>
          </div>
        </div>
        <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-800/80 border border-slate-700 text-slate-400 font-bold tracking-wider">
          SOON
        </span>
      </div>

      {/* Main Locked Hero */}
      <div className="p-4 max-w-lg mx-auto w-full flex-1 flex flex-col justify-center items-center text-center py-8">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative mb-6"
        >
          <div className="w-20 h-20 rounded-2xl bg-slate-900 border border-slate-700/80 flex items-center justify-center shadow-[0_0_40px_rgba(30,41,59,0.5)]">
            <Radio className="w-9 h-9 text-slate-500 animate-pulse" />
          </div>
          <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-slate-950 border border-slate-700 flex items-center justify-center">
            <Lock className="w-4 h-4 text-amber-500" />
          </div>
        </motion.div>

        <h2 className="text-sm font-black text-white uppercase tracking-wider mb-2">
          MODUL SENSOR IoT BELUM DIAKTIFKAN
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed mb-6 font-sans max-w-sm">
          Sistem pembacaan sensor fisik laut dan getaran tanah langsung di lapangan saat ini masih dalam tahap integrasi perangkat keras eksternal.
        </p>

        {/* Status Box */}
        <div className="w-full bg-[#0d1527] border border-slate-800 rounded-xl p-4 text-left space-y-3 mb-6">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-slate-500" />
              STATUS PROTOKOL
            </span>
            <span className="text-[9px] font-bold text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">
              TERKUNCI (LOCKED)
            </span>
          </div>

          <div className="space-y-2 text-[11px]">
            <div className="flex items-center justify-between py-1 border-b border-slate-800/40">
              <span className="text-slate-400 flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5 text-slate-500" />
                Node Pelampung Laut (Buoy)
              </span>
              <span className="text-slate-500 font-bold">Segera Rilis</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-800/40">
              <span className="text-slate-400 flex items-center gap-2">
                <Signal className="w-3.5 h-3.5 text-slate-500" />
                Seismometer Akselerasi Tanah
              </span>
              <span className="text-slate-500 font-bold">Segera Rilis</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-slate-400 flex items-center gap-2">
                <ShieldAlert className="w-3.5 h-3.5 text-slate-500" />
                Jaringan Sirene Evakuasi Pesisir
              </span>
              <span className="text-slate-500 font-bold">Segera Rilis</span>
            </div>
          </div>
        </div>

        {/* Security / Notice Badge */}
        <div className="w-full p-3 rounded-lg bg-slate-900/60 border border-slate-800/80 text-[10px] text-slate-400 font-sans leading-relaxed">
          Semua telemetri peringatan dini saat ini menggunakan satelit pelacakan real-time dan saluran siaran resmi Posko Komando.
        </div>
      </div>
    </div>
  )
}
