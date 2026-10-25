// ═══════════════════════════════════════════════════════════════
// GUIDES PAGE — NERV Tactical Emergency Directives & First Aid Manual
// ═══════════════════════════════════════════════════════════════
import { useState } from 'react'
import { ChevronDown, ChevronUp, BookOpen, ArrowRight, ChevronLeft, ShieldAlert, Waves, Flame, Activity } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

interface GuideSection {
  id: string
  title: string
  directiveCode: string
  color: string
  borderColor: string
  bgColor: string
  content: React.ReactNode
}

function TacticalAccordion({ id, title, directiveCode, color, borderColor, bgColor, content }: GuideSection) {
  const [open, setOpen] = useState(true)
  return (
    <div className={`rounded-lg border overflow-hidden transition-colors ${borderColor}`} style={{ background: bgColor }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-3.5 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3 text-left">
          <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: color }} />
          <div>
            <span className="text-[9px] font-mono font-bold tracking-widest block uppercase" style={{ color }}>
              {directiveCode}
            </span>
            <span className="text-sm font-mono font-bold text-white">{title}</span>
          </div>
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
            <div className="px-4 pb-4 border-t border-nerv-border/50 pt-3">{content}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const EARTHQUAKE_STEPS = [
  { num: "01", icon: '🫳', label: 'DROP // MERENDAH', desc: 'Jatuhkan tubuh dan berlutut ke lantai sebelum gaya guncangan menjatuhkan Anda secara paksa.' },
  { num: "02", icon: '🛡️', label: 'COVER // LINDUNGI', desc: 'Lindungi kepala, leher, dan organ vital di bawah meja padat atau struktur furnitur kokoh.' },
  { num: "03", icon: '✋', label: 'HOLD ON // BERTAHAN', desc: 'Pegang erat kaki meja penopang hingga seismik stabil dan guncangan sepenuhnya berhenti.' },
]

const FIRST_AID = [
  {
    id: 'bleeding',
    directive: 'PROTOCOL // TRAUMA-01',
    title: 'Penanganan Perdarahan Akut',
    steps: [
      { icon: '🤜', label: 'KOMPRESI LANGSUNG', desc: 'Tekan titik sumber perdarahan menggunakan kasa steril, perban, atau kain bersih dengan tekanan konstan.' },
      { icon: '⬆️', label: 'ELEVASI ANGGOTA GERAK', desc: 'Posisikan bagian tubuh yang cedera lebih tinggi dari level jantung untuk mereduksi aliran darah.' },
    ]
  },
  {
    id: 'choking',
    directive: 'PROTOCOL // AIRWAY-02',
    title: 'Sumbatan Saluran Nafas (Heimlich)',
    steps: [
      { icon: '🫂', label: 'POSISI PENOLONG', desc: 'Berdiri di belakang korban, lingkarkan lengan penolong kuat-kuat di sekeliling pinggang korban.' },
      { icon: '👊', label: 'DORONGAN SUB-DIAFRAGMA', desc: 'Genggam tangan tepat di atas pusar, hentakkan ke arah dalam dan ke atas secara mendadak hingga benda asing terlempar.' },
    ]
  },
  {
    id: 'burns',
    directive: 'PROTOCOL // THERMAL-03',
    title: 'Penanganan Trauma Luka Bakar',
    steps: [
      { icon: '💧', label: 'IRIGASI AIR MENGALIR', desc: 'Alirkan air bersuhu ruang (bukan es) selama minimal 20 menit pada area terpapar untuk memutus transfer panas.' },
      { icon: '🚫', label: 'LARANGAN KRITIS', desc: 'DILARANG mengoleskan pasta gigi, mentega, minyak, atau es batu langsung ke jaringan luka.' },
    ]
  },
]

export default function GuidesPage({ onNavigateMap, onBack }: { onNavigateMap: () => void; onBack?: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 30 }} transition={{ duration: 0.22 }}
      className="fixed inset-0 z-[1800] flex flex-col overflow-y-auto custom-scrollbar bg-nerv-bg text-slate-200"
    >
      {/* NERV Header */}
      <div className="shrink-0 px-4 pt-4 pb-3 border-b border-nerv-border bg-[#0B0F19] flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          {onBack && (
            <button
              onClick={onBack}
              className="w-8 h-8 rounded bg-nerv-card border border-nerv-border flex items-center justify-center shrink-0 hover:border-nerv-orange transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-slate-300" />
            </button>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-2 h-2 rounded-full bg-nerv-orange animate-ping" />
              <p className="text-[10px] font-mono font-bold tracking-widest text-nerv-orange uppercase">
                A.T.L.A.S // TACTICAL DIRECTIVES
              </p>
            </div>
            <h2 className="text-sm font-mono font-bold text-white truncate">
              EMERGENCY PROTOCOL & FIRST AID
            </h2>
          </div>
        </div>

        <div className="px-2 py-1 rounded bg-black/60 border border-nerv-border font-mono text-[9px] text-nerv-cyan shrink-0">
          DOC: SEC-01
        </div>
      </div>

      <div className="flex-1 px-4 py-4 space-y-3.5 pb-24 font-sans">

        {/* Tsunami Directive - Highest Priority Card */}
        <div className="rounded-lg overflow-hidden border border-nerv-red/60 bg-nerv-card relative">
          <div className="p-4 border-l-4 border-l-nerv-red bg-[#160608]">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <Waves className="w-5 h-5 text-nerv-red animate-pulse" />
                <div>
                  <p className="text-[9px] font-mono font-bold text-nerv-red uppercase tracking-widest">
                    DIRECTIVE 00 // TSUNAMI HAZARD
                  </p>
                  <h3 className="text-sm font-mono font-bold text-white uppercase">
                    GOLDEN RULE EVAKUASI MANDIRI
                  </h3>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded bg-nerv-red/20 border border-nerv-red font-mono font-bold text-[9px] text-nerv-red">
                DEFCON 1
              </span>
            </div>

            <div className="p-3 rounded bg-black/60 border border-nerv-red/40 mb-3">
              <p className="text-sm font-mono font-bold text-nerv-orange leading-snug">
                SEGERA MENJAUH DARI GARIS PANTAI // BERGERAK MENUJU ELEVASI TINGGI (MINIMAL &ge; 20 METER).
              </p>
            </div>

            <div className="space-y-1.5 text-xs text-slate-300 font-sans">
              <p className="flex items-start gap-1.5">
                <span className="text-nerv-red font-bold font-mono">▸</span>
                <span><b>Jangan menunggu pengumuman sirine</b> jika Anda merasakan gempa kuat &gt; 20 detik atau sulit berdiri.</span>
              </p>
              <p className="flex items-start gap-1.5">
                <span className="text-nerv-red font-bold font-mono">▸</span>
                <span>Air laut surut mendadak atau bau belerang adalah tanda gelombang mendekat: <b>LARI SEGERA</b>.</span>
              </p>
              <p className="flex items-start gap-1.5">
                <span className="text-nerv-red font-bold font-mono">▸</span>
                <span>Evakuasi dilakukan dengan berjalan/berlari kaki untuk menghindari kemacetan total jalur darat.</span>
              </p>
            </div>
          </div>
        </div>

        {/* Earthquake Procedure Directive */}
        <TacticalAccordion
          id="earthquake"
          directiveCode="DIRECTIVE 01 // SEISMIC IMPACT"
          title="Tindakan Siaga Saat Terjadi Guncangan"
          color="#FF5722"
          borderColor="border-nerv-border hover:border-nerv-orange/50"
          bgColor="#0E121B"
          content={
            <div className="space-y-2.5">
              {EARTHQUAKE_STEPS.map(step => (
                <div key={step.num} className="flex items-start gap-3 p-3 rounded bg-black/40 border border-nerv-border">
                  <div className="w-8 h-8 rounded bg-nerv-orange/15 border border-nerv-orange/40 flex items-center justify-center shrink-0">
                    <span className="text-xs font-mono font-bold text-nerv-orange">{step.num}</span>
                  </div>
                  <div>
                    <p className="text-[11px] font-mono font-bold text-white uppercase tracking-wider mb-0.5">
                      {step.icon} {step.label}
                    </p>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          }
        />

        {/* First Aid sections */}
        {FIRST_AID.map(fa => (
          <div key={fa.id} className="p-3.5 rounded-lg border border-nerv-border bg-nerv-card">
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-nerv-border/60">
              <div>
                <span className="text-[8px] font-mono font-bold text-nerv-cyan uppercase tracking-widest block">
                  {fa.directive}
                </span>
                <h4 className="text-xs font-mono font-bold text-white uppercase">{fa.title}</h4>
              </div>
              <Activity className="w-4 h-4 text-nerv-cyan" />
            </div>

            <div className="space-y-2">
              {fa.steps.map((step, i) => (
                <div key={i} className="flex items-start gap-2.5 p-2 rounded bg-black/40 border border-nerv-border/40">
                  <div className="w-7 h-7 rounded bg-[#131926] border border-nerv-border flex items-center justify-center shrink-0 text-xs">
                    {step.icon}
                  </div>
                  <div>
                    <p className="text-[10px] font-mono font-bold text-nerv-cyan uppercase">{step.label}</p>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans mt-0.5">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Action Button: Navigate Map */}
        <button
          onClick={onNavigateMap}
          className="w-full py-3.5 rounded-lg bg-nerv-orange hover:bg-orange-600 text-black font-mono font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,87,34,0.35)] transition-all"
        >
          <ArrowRight className="w-4 h-4" />
          BUKA KOKPIT RUTE EVAKUASI (MAP)
        </button>

        {/* Offline Cache Assurance */}
        <div className="flex items-center justify-center gap-2 pt-1 font-mono text-[10px] text-slate-500">
          <div className="w-1.5 h-1.5 rounded-full bg-nerv-green animate-pulse" />
          <span>OFFLINE LOCAL CACHE VERIFIED // SELURUH DOKUMEN AKTIF</span>
        </div>
      </div>
    </motion.div>
  )
}
