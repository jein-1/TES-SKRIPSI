// ═══════════════════════════════════════════════════════════════
// FIRST VISIT MODAL — A.T.L.A.S Device Identification & Welcome
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Shield, Smartphone, Monitor, User, ArrowRight, Check, Globe } from 'lucide-react'
import { useLanguage } from '../../lib/i18n'

interface Props {
  onComplete: (name: string) => void
  isEditing?: boolean
  initialName?: string
  onClose?: () => void
  onCancel?: () => void
}

function detectDevice(): { device: string; mobile: boolean } {
  const ua = navigator.userAgent
  let device = 'Desktop'
  const mobile = /Android|iPhone|iPad|iPod/i.test(ua)
  if (/Android/i.test(ua)) device = 'Android'
  else if (/iPhone/i.test(ua)) device = 'iPhone'
  else if (/iPad/i.test(ua)) device = 'iPad'
  else if (/Windows/i.test(ua)) device = 'Windows'
  else if (/Macintosh/i.test(ua)) device = 'Mac'
  else if (/Linux/i.test(ua)) device = 'Linux'
  return { device, mobile }
}

export default function FirstVisitModal({ onComplete, isEditing = false, initialName = '', onClose, onCancel }: Props) {
  const { lang, setLanguage, t } = useLanguage()
  const [name, setName] = useState(initialName || localStorage.getItem('aegisUserName') || '')
  const [error, setError] = useState('')
  const [{ device, mobile }] = useState(detectDevice)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (initialName) setName(initialName)
  }, [initialName])

  const validate = (val: string): string => {
    const trimmed = val.trim()
    if (trimmed.length < 3) return lang === 'id' ? 'Nama minimal 3 karakter' : 'Name must be at least 3 characters'
    if (trimmed.length > 30) return lang === 'id' ? 'Nama maksimal 30 karakter' : 'Name cannot exceed 30 characters'
    if (!/^[a-zA-Z\s]+$/.test(trimmed)) return lang === 'id' ? 'Hanya huruf dan spasi diperbolehkan' : 'Only letters and spaces allowed'
    return ''
  }

  const handleSubmit = () => {
    const err = validate(name)
    if (err) { setError(err); return }
    setSubmitting(true)
    setTimeout(() => {
      onComplete(name.trim())
    }, 400)
  }

  const charLeft = name.trim().length

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9000] flex flex-col items-center justify-center p-6 bg-[#07090E]/98 backdrop-blur-xl"
    >
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #FF5722, transparent 70%)' }}
        />
      </div>

      <motion.div
        initial={{ y: 25, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="w-full max-w-sm relative z-10"
      >
        {/* Language switch button */}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setLanguage(lang === 'id' ? 'en' : 'id')}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 border border-nerv-border hover:border-nerv-orange text-xs font-mono font-bold text-slate-300 transition-colors"
          >
            <Globe className="w-3.5 h-3.5 text-nerv-cyan" />
            <span className={lang === 'id' ? 'text-nerv-orange' : 'text-slate-500'}>ID</span>
            <span className="text-slate-600">/</span>
            <span className={lang === 'en' ? 'text-nerv-orange' : 'text-slate-500'}>EN</span>
          </button>
        </div>

        {/* Logo */}
        <div className="flex flex-col items-center mb-6 text-center">
          <div
            className="w-14 h-14 rounded-xl bg-nerv-card border border-nerv-orange/40 flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(255,87,34,0.3)]"
          >
            <Shield className="w-7 h-7 text-nerv-orange" />
          </div>
          <h1 className="text-2xl font-black text-nerv-orange tracking-widest font-mono drop-shadow-[0_0_10px_rgba(255,87,34,0.5)]">
            A.T.L.A.S
          </h1>
          <p className="text-[11px] text-slate-300 mt-1 tracking-wider font-mono uppercase font-bold">
            Autonomous Threat Location & Alert System
          </p>
        </div>

        {/* Device info */}
        <div className="flex items-center justify-center gap-2 mb-5 px-3 py-1.5 rounded bg-black/60 border border-nerv-border text-slate-400 font-mono text-[10px]">
          {mobile ? <Smartphone className="w-3.5 h-3.5 text-nerv-cyan" /> : <Monitor className="w-3.5 h-3.5 text-nerv-cyan" />}
          <span>
            {t('device')}: <span className="text-white font-bold">{device} · {mobile ? 'Mobile' : 'Desktop'}</span>
          </span>
        </div>

        {/* Form Container */}
        <div className="p-5 rounded-lg border border-nerv-border bg-nerv-card shadow-2xl">
          <h2 className="text-base font-mono font-bold text-white mb-1 uppercase">
            {isEditing ? t('editProfile') : t('welcome')}
          </h2>
          <p className="text-[11px] text-slate-400 mb-4 font-sans leading-relaxed">
            {isEditing ? t('editSubtitle') : t('welcomeSubtitle')}
          </p>

          {!isEditing && (
            <div className="mb-4 p-2.5 rounded bg-black/40 border border-nerv-orange/30 font-mono">
              <p className="text-[10px] text-nerv-orange font-bold uppercase">⚠ {t('oneDeviceOneReg')}</p>
              <p className="text-[9px] text-slate-400 mt-0.5 font-sans leading-relaxed">
                {t('oneDeviceDesc')}
              </p>
            </div>
          )}

          <label className="block mb-1.5">
            <span className="text-[10px] text-slate-400 font-mono uppercase tracking-widest font-bold">
              {t('nameLabel')}
            </span>
            <span className="text-[9px] text-slate-500 font-mono ml-2">{t('nameHint')}</span>
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={name}
              maxLength={30}
              onChange={e => { setName(e.target.value); setError('') }}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder={t('namePlaceholder')}
              autoFocus
              className="w-full pl-9 pr-12 py-2.5 rounded bg-black/60 border border-nerv-border text-white placeholder-slate-600 font-mono text-sm focus:outline-none focus:border-nerv-orange transition-colors"
            />
            <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono ${charLeft < 3 ? 'text-nerv-red' : 'text-slate-500'}`}>
              {name.trim().length}/30
            </span>
          </div>

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-nerv-red font-mono text-[10px] mt-2"
              >
                ⚠ {error}
              </motion.p>
            )}
          </AnimatePresence>

          <div className="flex gap-2 mt-5">
            {isEditing && (onClose || onCancel) && (
              <button
                onClick={() => (onClose || onCancel)?.()}
                className="flex-1 py-2.5 rounded bg-black/60 border border-nerv-border hover:border-slate-500 text-slate-400 font-mono text-xs font-bold uppercase tracking-wider transition-colors"
              >
                Batal
              </button>
            )}
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 py-3 rounded bg-nerv-orange hover:bg-orange-600 text-black font-mono font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(255,87,34,0.4)] transition-all"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{isEditing ? t('saveProfile') : t('continue')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
