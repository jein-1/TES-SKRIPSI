// ═══════════════════════════════════════════════════════════════
// FIRST VISIT MODAL — Name prompt on first open (User mode)
// ═══════════════════════════════════════════════════════════════
import { useState } from 'react'
import { Shield, Smartphone, Monitor } from 'lucide-react'
import { motion } from 'motion/react'

interface Props {
  onComplete: (name: string) => void
}

function detectDevice(): string {
  const ua = navigator.userAgent
  if (/Android/i.test(ua)) return 'Android'
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS'
  if (/Windows/i.test(ua)) return 'Windows'
  if (/Mac/i.test(ua)) return 'macOS'
  return 'Unknown'
}

function isMobileDevice(): boolean {
  return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

export default function FirstVisitModal({ onComplete }: Props) {
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const device = detectDevice()
  const mobile = isMobileDevice()

  const handleSubmit = () => {
    const trimmed = name.trim()
    if (!trimmed) { setError('Nama tidak boleh kosong'); return }
    if (trimmed.length < 2) { setError('Nama minimal 2 karakter'); return }
    onComplete(trimmed)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[9000] flex flex-col items-center justify-center p-6"
      style={{ background: 'rgba(5,8,20,0.97)' }}
    >
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #6366f1, transparent 70%)' }} />
      </div>

      <motion.div
        initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="w-full max-w-sm relative z-10"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center mb-4"
            style={{ boxShadow: '0 0 30px rgba(99,102,241,0.3)' }}>
            <Shield className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-widest">AEGIS RESPONSE</h1>
          <p className="text-[11px] text-slate-500 mt-1 tracking-wider">Sistem Evakuasi Darurat · Kota Palu</p>
        </div>

        {/* Device info */}
        <div className="flex items-center justify-center gap-2 mb-6 px-4 py-2 rounded-xl bg-slate-800/60 border border-slate-700/40">
          {mobile
            ? <Smartphone className="w-4 h-4 text-indigo-400" />
            : <Monitor className="w-4 h-4 text-indigo-400" />
          }
          <span className="text-[11px] text-slate-400">
            Perangkat terdeteksi: <span className="text-white font-bold">{device} · {mobile ? 'Mobile' : 'Desktop'}</span>
          </span>
        </div>

        {/* Form */}
        <div className="p-6 rounded-3xl border border-slate-700/40" style={{ background: '#0f1a2e' }}>
          <h2 className="text-lg font-black text-white mb-1">Selamat Datang!</h2>
          <p className="text-[12px] text-slate-400 mb-5">
            Masukkan nama Anda agar keluarga dan tim SAR bisa mengidentifikasi Anda dalam keadaan darurat.
          </p>

          <label className="block mb-1.5">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Nama Lengkap</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={e => { setName(e.target.value); setError('') }}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder="Contoh: Ahmad Yusuf"
            autoFocus
            className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-white placeholder-slate-600 font-medium focus:outline-none focus:border-indigo-500/70 transition-colors mb-1"
          />
          {error && <p className="text-red-400 text-[11px] mb-3">{error}</p>}

          <button
            onClick={handleSubmit}
            className="w-full mt-4 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm tracking-wide transition-colors"
            style={{ boxShadow: '0 4px 20px rgba(99,102,241,0.4)' }}
          >
            MULAI AEGIS RESPONSE
          </button>
        </div>

        <p className="text-center text-[10px] text-slate-600 mt-4">
          Data tersimpan di perangkat Anda · Tidak dikirim ke server
        </p>
      </motion.div>
    </motion.div>
  )
}
