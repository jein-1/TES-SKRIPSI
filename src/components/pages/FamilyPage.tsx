// ═══════════════════════════════════════════════════════════════
// FAMILY PAGE — Family Circle Safety Monitoring
// ═══════════════════════════════════════════════════════════════
import { useState } from 'react'
import { Radio, UserPlus, Phone, AlertTriangle, CheckCircle, Clock, Wifi } from 'lucide-react'
import { motion } from 'motion/react'
import type { FamilyMember } from '../../types'

const MEMBERS: FamilyMember[] = [
  {
    id: 'F1', name: 'Ahmad Yusuf', role: 'Ayah',
    initials: 'AY', status: 'safe',
    location: 'Taman GOR Palu', updatedAgo: '2m ago',
  },
  {
    id: 'F2', name: 'Rina Dewi', role: 'Ibu',
    initials: 'RD', status: 'danger',
    location: 'Jl. Ahmad Yani Selatan', updatedAgo: '12s ago',
    alertLabel: 'ALERT: DISPLACEMENT ZONE — Sektor 4',
  },
  {
    id: 'F3', name: 'Siti Jamilah', role: 'Nenek',
    initials: 'SJ', status: 'safe',
    location: 'Masjid Raya Baitul Khairaat', updatedAgo: '15m ago',
  },
]

function MemberMiniMap({ status }: { status: 'safe' | 'danger' | 'unknown' }) {
  const dotColor = status === 'safe' ? '#22c55e' : status === 'danger' ? '#ef4444' : '#64748b'
  return (
    <div className="w-full h-20 rounded-xl overflow-hidden relative" style={{ background: '#060d1a' }}>
      <svg width="100%" height="100%" viewBox="0 0 280 80" preserveAspectRatio="none" className="opacity-50">
        {[0,1].map(i=><line key={`h${i}`} x1="0" y1={i*40} x2="280" y2={i*40} stroke="#1e293b" strokeWidth="1"/>)}
        {[0,1,2,3,4,5].map(i=><line key={`v${i}`} x1={i*56} y1="0" x2={i*56} y2="80" stroke="#1e293b" strokeWidth="1"/>)}
        <path d="M0,50 C60,45 120,35 180,30 C220,26 260,24 280,22" stroke="#334155" strokeWidth="3" fill="none"/>
        <path d="M0,65 C80,60 160,55 240,50" stroke="#334155" strokeWidth="2" fill="none"/>
      </svg>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="w-3 h-3 rounded-full border-2 border-[#060d1a]" style={{ background: dotColor, boxShadow: `0 0 8px ${dotColor}` }} />
      </div>
    </div>
  )
}

function StatusChip({ status }: { status: FamilyMember['status'] }) {
  if (status === 'safe') return (
    <div className="flex items-center gap-1.5">
      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
      <span className="text-xs font-black text-emerald-400 tracking-wider">STATUS: SAFE</span>
    </div>
  )
  if (status === 'danger') return (
    <div className="flex items-center gap-1.5">
      <AlertTriangle className="w-3.5 h-3.5 text-red-400 animate-pulse" />
      <span className="text-xs font-black text-red-400 tracking-wider">STATUS: IN DANGER</span>
    </div>
  )
  return (
    <div className="flex items-center gap-1.5">
      <Clock className="w-3.5 h-3.5 text-slate-400" />
      <span className="text-xs font-black text-slate-400 tracking-wider">STATUS: UNKNOWN</span>
    </div>
  )
}

export default function FamilyPage() {
  const [pinging, setPinging] = useState(false)
  const [addMember, setAddMember] = useState(false)

  const handlePingAll = () => {
    setPinging(true)
    if ('vibrate' in navigator) navigator.vibrate([100, 50, 100, 50, 100])
    setTimeout(() => setPinging(false), 2500)
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }} transition={{ duration: 0.22 }}
      className="fixed inset-0 z-[1800] flex flex-col overflow-y-auto custom-scrollbar"
      style={{ background: '#080e1a' }}
    >
      {/* Header */}
      <div className="shrink-0 px-5 pt-5 pb-4 border-b border-slate-800/60" style={{ background: '#0a1020' }}>
        <h2 className="text-2xl font-black text-white mb-1">Family Circle</h2>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Real-time status monitoring for your primary response group.<br />
          <span className="text-emerald-400 font-bold">5 active connections established.</span>
        </p>
      </div>

      <div className="flex-1 px-4 py-4 space-y-4">

        {/* PING ALL button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handlePingAll}
          className={`w-full py-4 rounded-2xl font-black text-sm tracking-wide transition-all flex items-center justify-center gap-2 border ${
            pinging
              ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
              : 'bg-indigo-600 border-indigo-500/50 text-white shadow-[0_4px_20px_rgba(99,102,241,0.4)]'
          }`}
        >
          <Radio className={`w-4 h-4 ${pinging ? 'animate-pulse' : ''}`} />
          {pinging ? 'MENGIRIM PING...' : 'PING ALL MEMBERS'}
        </motion.button>

        {/* Member cards */}
        <div className="space-y-3">
          {MEMBERS.map((member, idx) => {
            const isDanger = member.status === 'danger'
            const borderColor = isDanger ? 'border-red-500/40' : 'border-slate-700/40'
            const bgColor = isDanger ? '#150808' : '#0f1a2e'

            return (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
                className={`p-4 rounded-2xl border ${borderColor}`}
                style={{ background: bgColor }}
              >
                {/* Top row */}
                <div className="flex items-center gap-3 mb-3">
                  {/* Avatar */}
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white text-base border shrink-0 ${
                    isDanger ? 'bg-red-600/30 border-red-500/50' : 'bg-indigo-600/30 border-indigo-500/40'
                  }`}>
                    {member.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-white leading-tight">{member.name}</p>
                        <p className="text-[10px] text-slate-500">{member.role}</p>
                      </div>
                      {isDanger && (
                        <button className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 text-white text-[10px] font-black">
                          <Phone className="w-3 h-3" /> CALL NOW
                        </button>
                      )}
                    </div>
                    <div className="mt-1.5">
                      <StatusChip status={member.status} />
                    </div>
                  </div>
                </div>

                {/* Alert label */}
                {member.alertLabel && (
                  <div className="mb-3 p-2 rounded-xl bg-red-900/30 border border-red-700/40">
                    <p className="text-[10px] text-red-400 font-bold">{member.alertLabel}</p>
                  </div>
                )}

                {/* Mini map */}
                <MemberMiniMap status={member.status} />

                {/* Footer */}
                <div className="flex items-center justify-between mt-2.5">
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">
                      {isDanger ? 'Last Known Location' : 'Last Known Location'}
                    </p>
                    <p className="text-[11px] text-slate-300 font-semibold">{member.location}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span className={`text-[10px] font-bold ${isDanger ? 'text-red-400' : 'text-slate-500'}`}>
                      {isDanger ? `Critical ${member.updatedAgo}` : `Update ${member.updatedAgo}`}
                    </span>
                    {!isDanger && (
                      <button className="ml-2 px-2 py-0.5 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-[10px] text-indigo-400 font-bold">
                        PING
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Network Health */}
        <div className="p-4 rounded-2xl border border-slate-700/40" style={{ background: '#0f1a2e' }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-0.5">Network Health</p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-white">98.4%</span>
                <span className="text-sm text-emerald-400 font-bold">Uptime</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <Wifi className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mb-3">
            Satellite relay active. All family bio-tags are transmitting data correctly via Aegis Mesh.
          </p>
          <div className="space-y-2">
            {[
              { icon: '📡', label: '5/5 Tags Connected', ok: true },
              { icon: '🔋', label: 'All Devices > 60%', ok: true },
              { icon: '🔒', label: 'E2E Encryption Active', ok: true },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-sm">{item.icon}</span>
                <span className="text-[11px] text-slate-300 font-semibold">{item.label}</span>
                {item.ok && <CheckCircle className="w-3 h-3 text-emerald-400 ml-auto" />}
              </div>
            ))}
          </div>
        </div>

        {/* Add New Member */}
        <button
          onClick={() => setAddMember(!addMember)}
          className="w-full p-4 rounded-2xl border border-slate-700/40 border-dashed flex items-center justify-center gap-2 text-slate-400 hover:text-white hover:border-slate-600 transition-colors"
          style={{ background: 'transparent' }}
        >
          <UserPlus className="w-5 h-5" />
          <span className="text-sm font-bold">Add New Member</span>
        </button>
        {addMember && (
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl border border-indigo-500/30 text-center"
            style={{ background: '#0f1a2e' }}
          >
            <p className="text-2xl mb-2">📷</p>
            <p className="text-sm font-bold text-white mb-1">Scan QR or invite via Aegis ID</p>
            <p className="text-[11px] text-slate-400">Minta anggota keluarga membuka app Aegis dan tampilkan QR Code mereka.</p>
          </motion.div>
        )}

        <div className="h-4" />
      </div>
    </motion.div>
  )
}
