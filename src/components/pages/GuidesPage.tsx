// ═══════════════════════════════════════════════════════════════
// GUIDES PAGE — Panduan Prosedur & P3K (Survival Guides)
// ═══════════════════════════════════════════════════════════════
import { useState } from 'react'
import { ChevronDown, ChevronUp, BookOpen, ArrowRight, ChevronLeft } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

interface GuideSection {
  id: string
  title: string
  emoji: string
  color: string
  borderColor: string
  bgColor: string
  content: React.ReactNode
}

function Accordion({ id, title, emoji, color, borderColor, bgColor, content }: GuideSection) {
  const [open, setOpen] = useState(true)
  return (
    <div className={`rounded-2xl border overflow-hidden ${borderColor}`} style={{ background: bgColor }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{emoji}</span>
          <span className="text-sm font-black text-white">{title}</span>
        </div>
        {open
          ? <ChevronUp className="w-4 h-4 shrink-0" style={{ color }} />
          : <ChevronDown className="w-4 h-4 shrink-0" style={{ color }} />
        }
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">{content}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const EARTHQUAKE_STEPS = [
  { num: 1, icon: '🫳', label: 'DROP', desc: 'Berlututlah dan jatuhkan diri ke lantai sebelum gempa menjatuhkan Anda.' },
  { num: 2, icon: '🛡️', label: 'COVER', desc: 'Lindungi kepala dan leher di bawah meja yang kokoh.' },
  { num: 3, icon: '✋', label: 'HOLD ON', desc: 'Tetap di tempat hingga guncangan benar-benar berhenti.' },
]

const FIRST_AID = [
  {
    id: 'bleeding', emoji: '🩸', title: 'P3K Dasar: Perdarahan',
    steps: [
      { icon: '🤜', label: 'Tekanan Langsung', desc: 'Tekan luka dengan kain bersih atau perban dengan kuat.' },
      { icon: '⬆️', label: 'Tinggikan Luka', desc: 'Angkat bagian tubuh yang luka di atas level jantung jika memungkinkan.' },
    ]
  },
  {
    id: 'choking', emoji: '🫁', title: 'Tersedak (Heimlich)',
    steps: [
      { icon: '🫂', label: 'Posisi Belakang', desc: 'Berdiri di belakang korban, lingkarkan tangan di pinggang.' },
      { icon: '👊', label: 'Tekanan Perut', desc: 'Tekankan kepalan dengan gerakan ke atas-dalam. Ulangi hingga benda keluar.' },
    ]
  },
  {
    id: 'burns', emoji: '🔥', title: 'Luka Bakar',
    steps: [
      { icon: '💧', label: 'Siram Air Dingin', desc: 'Siram dengan air mengalir (suhu ruang) minimum 20 menit.' },
      { icon: '🚫', label: 'JANGAN', desc: 'Jangan gunakan es, pasta gigi, atau minyak mentega.' },
    ]
  },
]

export default function GuidesPage({ onNavigateMap, onBack }: { onNavigateMap: () => void; onBack?: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }} transition={{ duration: 0.22 }}
      className="fixed inset-0 z-[1800] flex flex-col overflow-y-auto custom-scrollbar"
      style={{ background: '#080e1a' }}
    >
      {/* Header */}
      <div className="shrink-0 px-4 pt-4 pb-3 border-b border-slate-800/60" style={{ background: '#0a1020' }}>
        <div className="flex items-center gap-3 mb-1">
          {onBack && (
            <button onClick={onBack}
              className="w-8 h-8 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center shrink-0 hover:bg-slate-700 transition-colors">
              <ChevronLeft className="w-4 h-4 text-slate-400" />
            </button>
          )}
          <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0">
            <BookOpen className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <p className="text-[10px] text-blue-400 uppercase tracking-widest font-bold">Informasi kritis</p>
            <h2 className="text-xl font-black text-white leading-tight">Panduan Prosedur & P3K</h2>
          </div>
        </div>
        <p className="text-[11px] text-slate-400 mt-1">
          Informasi kritis untuk pengambilan keputusan cepat di bawah tekanan. Fokus pada instruksi visual dan langkah operasional.
        </p>
      </div>

      <div className="flex-1 px-4 py-4 space-y-4">

        {/* Earthquake Procedure */}
        <Accordion
          id="earthquake"
          title="Apa yang dilakukan saat gempa?"
          emoji="🌍"
          color="#6366f1"
          borderColor="border-indigo-500/30"
          bgColor="#0f1220"
          content={
            <div className="space-y-3">
              {EARTHQUAKE_STEPS.map(step => (
                <div key={step.num} className="flex items-start gap-3 p-3 rounded-xl bg-indigo-950/40 border border-indigo-800/30">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
                    <span className="text-sm font-black text-white">{step.num}</span>
                  </div>
                  <div>
                    <p className="text-[11px] font-black text-indigo-300 uppercase tracking-wider mb-0.5">
                      {step.icon} {step.label}
                    </p>
                    <p className="text-[12px] text-slate-300 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          }
        />

        {/* Tsunami Procedure */}
        <div className="rounded-2xl overflow-hidden border border-red-500/40">
          <div className="p-4" style={{ background: '#1a0505' }}>
            <div className="flex items-start gap-3 mb-4">
              <span className="text-3xl">🌊</span>
              <div>
                <p className="text-xs font-black text-red-400 uppercase tracking-widest mb-0.5">PROSEDUR TSUNAMI</p>
                <div className="inline-block px-2 py-0.5 rounded-lg bg-red-600/30 border border-red-500/40">
                  <span className="text-[10px] font-black text-red-300">GOLDEN RULE</span>
                </div>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-red-900/30 border border-red-700/40 mb-3">
              <p className="text-sm font-black text-red-200 leading-snug">
                SEGERA MENJAUH DARI PANTAI.<br />
                CARI TEMPAT TINGGI (MINIMAL 20M).
              </p>
            </div>
            <div className="space-y-1.5 text-[11px] text-slate-400">
              <p>• Jangan menunggu peringatan resmi — ambil tindakan langsung.</p>
              <p>• Jika di pantai dan air tiba-tiba surut drastis — <span className="text-red-400 font-bold">LARI SEKARANG</span></p>
              <p>• Jangan kembali sebelum aman dinyatakan oleh otoritas.</p>
              <p className="text-slate-500 text-[10px] mt-2">⏱ Jaga guncangan terus selama 20 detik.</p>
            </div>
          </div>
        </div>

        {/* First Aid sections */}
        {FIRST_AID.map(fa => (
          <div key={fa.id} className="p-4 rounded-2xl border border-slate-700/40" style={{ background: '#0f1a2e' }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">{fa.emoji}</span>
              <h3 className="text-sm font-black text-white">{fa.title}</h3>
            </div>
            {fa.steps.map((step, i) => (
              <div key={i} className={`flex items-start gap-3 py-3 ${i < fa.steps.length - 1 ? 'border-b border-slate-700/40' : ''}`}>
                <div className="w-9 h-9 rounded-xl bg-slate-700/50 border border-slate-600/40 flex items-center justify-center shrink-0 text-lg">
                  {step.icon}
                </div>
                <div>
                  <p className="text-[11px] font-black text-slate-200 mb-0.5">{step.label}</p>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        ))}

        {/* Video placeholder for Heimlich */}
        <div className="p-4 rounded-2xl border border-slate-700/40 relative overflow-hidden" style={{ background: '#0f1a2e' }}>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-2">Video Tutorial</p>
          <div className="w-full h-28 rounded-xl bg-slate-900/60 border border-slate-700/40 flex items-center justify-center relative">
            <div className="absolute inset-0 rounded-xl overflow-hidden opacity-20">
              <div className="w-full h-full" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' }} />
            </div>
            <div className="relative w-12 h-12 rounded-full bg-white/10 border-2 border-white/30 flex items-center justify-center cursor-pointer hover:bg-white/20 transition-colors">
              <span className="text-white text-xl ml-1">▶</span>
            </div>
            <div className="absolute bottom-2 left-3 right-3 flex items-center gap-2">
              <div className="flex-1 h-1 bg-slate-700 rounded-full overflow-hidden">
                <div className="w-1/3 h-full bg-indigo-500 rounded-full" />
              </div>
              <span className="text-[10px] text-slate-400">0:45</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Animasi Heimlich Maneuver — tersedia offline</p>
        </div>

        {/* Panduan Lengkap button */}
        <div className="p-4 rounded-2xl border border-slate-700/40" style={{ background: '#0f1a2e' }}>
          <p className="text-sm font-black text-white mb-1">Luka Bakar?</p>
          <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
            Siram dengan air mengalir (suhu ruang) minimal 20 menit. JANGAN gunakan es, pasta gigi, atau minyak mentega.
          </p>
          <button className="flex items-center gap-2 text-indigo-400 text-[11px] font-bold hover:text-indigo-300 transition-colors">
            Panduan Lengkap <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Lihat Rute Evakuasi */}
        <button
          onClick={onNavigateMap}
          className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm tracking-wide transition-colors flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(99,102,241,0.4)]"
        >
          <ArrowRight className="w-4 h-4" />
          Lihat Rute Evakuasi
        </button>

        {/* Offline note */}
        <div className="flex items-center justify-center gap-2 pb-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <p className="text-[10px] text-slate-500">Seluruh konten tersimpan untuk akses offline</p>
        </div>
        {/* Bottom spacer */}
        <div className="h-20" />
      </div>
    </motion.div>
  )
}
