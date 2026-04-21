// ═══════════════════════════════════════════════════════════════
// FIRST VISIT MODAL — Name prompt on first open (User mode)
// Rules:
//   • 1 device = 1 registration (aegisRegistered flag in localStorage)
//   • Name: 5–30 chars, letters & spaces only, no numbers/symbols
//   • Cancel only shown when re-editing profile (not first time)
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect } from 'react'
import { Shield, Smartphone, Monitor, User, CheckCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

interface Props {
  onComplete: (name: string) => void
  onCancel?: () => void          // supplied when editing profile (not first visit)
  isEditing?: boolean            // true = profile edit mode
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

/** Validate name: 5–30 chars, letters & spaces only */
function validateName(raw: string): string {
  const v = raw.trim()
  if (!v) return 'Nama tidak boleh kosong'
  if (!/^[a-zA-ZÀ-ÖØ-öø-ÿ\s]+$/.test(v)) return 'Nama hanya boleh berisi huruf dan spasi'
  if (v.length < 5) return `Nama minimal 5 huruf (sekarang ${v.length})`
  if (v.length > 30) return 'Nama maksimal 30 huruf'
  return ''
}

export default function FirstVisitModal({ onComplete, onCancel, isEditing = false }: Props) {
  const [name, setName] = useState(() => isEditing ? (localStorage.getItem('aegisUserName') ?? '') : '')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const device = detectDevice()
  const mobile = isMobileDevice()
  const charLeft = 30 - name.trim().length

  // If device already registered (not editing), show lock screen instead
  const isLocked = !isEditing && !!localStorage.getItem('aegisRegistered')

  useEffect(() => {
    if (isLocked) {
      // Auto-complete with existing name — shouldn't reach here normally
      const existing = localStorage.getItem('aegisUserName')
      if (existing) setTimeout(() => onComplete(existing), 100)
    }
  }, [isLocked, onComplete])

  const handleSubmit = () => {
    const err = validateName(name)
    if (err) { setError(err); return }
    setDone(true)
    setTimeout(() => {
      // Mark device as registered (1-device-1-registration)
      localStorage.setItem('aegisRegistered', '1')
      onComplete(name.trim())
    }, 700)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
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
            Perangkat: <span className="text-white font-bold">{device} · {mobile ? 'Mobile' : 'Desktop'}</span>
          </span>
        </div>

        {/* Form */}
        <div className="p-6 rounded-3xl border border-slate-700/40" style={{ background: '#0f1a2e' }}>
          <h2 className="text-lg font-black text-white mb-1">
            {isEditing ? 'Edit Profil' : 'Selamat Datang!'}
          </h2>
          <p className="text-[12px] text-slate-400 mb-5">
            {isEditing
              ? 'Ubah nama tampilan Anda. Nama ini digunakan di Family grup.'
              : 'Masukkan nama Anda agar keluarga dapat mengidentifikasi Anda.'}
          </p>

          {!isEditing && (
            <div className="mb-4 px-3 py-2 rounded-xl bg-amber-900/20 border border-amber-700/30">
              <p className="text-[10px] text-amber-400 font-bold">⚠ 1 Perangkat = 1 Registrasi</p>
              <p className="text-[10px] text-amber-500/70">Nama yang dimasukkan tidak dapat diubah kecuali melalui menu Profil.</p>
            </div>
          )}

          <label className="block mb-1.5">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Nama</span>
            <span className="text-[10px] text-slate-600 ml-2">(min 5 huruf, hanya huruf & spasi)</span>
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
            <input
              type="text"
              value={name}
              maxLength={30}
              onChange={e => { setName(e.target.value); setError('') }}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="Contoh: Ahmad"
              autoFocus
              className="w-full pl-9 pr-12 py-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-white placeholder-slate-600 font-medium focus:outline-none focus:border-indigo-500/70 transition-colors"
            />
            <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono ${charLeft < 5 ? 'text-amber-400' : 'text-slate-600'}`}>
              {name.trim().length}/30
            </span>
          </div>

          <AnimatePresence>
            {error && (
              <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="text-red-400 text-[11px] mt-2">
                ⚠ {error}
              </motion.p>
            )}
          </AnimatePresence>

          <div className={`flex gap-3 mt-4 ${isEditing ? 'flex-row' : 'flex-col'}`}>
            {isEditing && onCancel && (
              <button onClick={onCancel}
                className="flex-1 py-3 rounded-xl bg-slate-700/60 border border-slate-600/40 text-slate-300 font-bold text-sm transition-colors hover:bg-slate-700">
                Batal
              </button>
            )}
            <button
              onClick={handleSubmit}
              disabled={done}
              className={`${isEditing ? 'flex-1' : 'w-full'} py-3.5 rounded-xl font-black text-sm tracking-wide transition-all flex items-center justify-center gap-2 disabled:opacity-70`}
              style={{ background: done ? '#10b981' : 'linear-gradient(135deg, #6366f1, #4f46e5)', boxShadow: '0 4px 20px rgba(99,102,241,0.4)' }}
            >
              {done
                ? <><CheckCircle className="w-4 h-4" /> Tersimpan!</>
                : isEditing ? 'SIMPAN PERUBAHAN' : 'MULAI AEGIS RESPONSE'
              }
            </button>
          </div>
        </div>

        {!isEditing && (
          <p className="text-center text-[10px] text-slate-600 mt-4">
            Data tersimpan di perangkat Anda · Tidak dikirim ke server
          </p>
        )}
      </motion.div>
    </motion.div>
  )
}
