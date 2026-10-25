// ═══════════════════════════════════════════════════════════════
// FIRST VISIT MODAL — A.T.L.A.S Device Identification & Welcome
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Shield, Smartphone, Monitor, User, ArrowRight, Globe, CreditCard } from 'lucide-react'
import { useLanguage } from '../../lib/i18n'
import { fetchClientIp } from '../../lib/geocode'

interface Props {
  onComplete: (name: string, nik: string) => void
  onClose?: () => void
}

function detectDevice(): { device: string; mobile: boolean; browser: string } {
  const ua = navigator.userAgent
  let device = 'Desktop'
  const mobile = /Android|iPhone|iPad|iPod/i.test(ua)
  if (/Android/i.test(ua)) device = 'Android'
  else if (/iPhone/i.test(ua)) device = 'iPhone'
  else if (/iPad/i.test(ua)) device = 'iPad'
  else if (/Windows/i.test(ua)) device = 'Windows'
  else if (/Macintosh/i.test(ua)) device = 'macOS'
  else if (/Linux/i.test(ua)) device = 'Linux'

  let browser = 'Browser'
  if (/Edg\//i.test(ua)) browser = 'Edge'
  else if (/Chrome\//i.test(ua)) browser = 'Chrome'
  else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) browser = 'Safari'
  else if (/Firefox\//i.test(ua)) browser = 'Firefox'

  return { device, mobile, browser }
}

export default function FirstVisitModal({ onComplete }: Props) {
  const { lang, setLanguage, t } = useLanguage()
  const [name, setName] = useState('')
  const [nik, setNik] = useState('')
  const [error, setError] = useState('')
  const [{ device, mobile, browser }] = useState(detectDevice)
  const [clientIp, setClientIp] = useState<string>('Mendeteksi IP...')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let isMounted = true
    fetchClientIp().then((ip) => {
      if (isMounted) setClientIp(ip)
    })
    return () => {
      isMounted = false
    }
  }, [])

  const validateRealisticName = (rawName: string): string => {
    const trimmed = rawName.trim().replace(/\s+/g, ' ')

    // 1. Karakter harus murni huruf alfabet dan spasi
    if (!/^[a-zA-Z\s]+$/.test(trimmed)) {
      return lang === 'id'
        ? 'Nama hanya boleh berupa huruf alfabet dan spasi (tidak boleh angka / simbol)'
        : 'Name must contain only alphabetic letters and spaces';
    }

    // 2. Panjang nama
    if (trimmed.length < 3) {
      return lang === 'id' ? 'Nama minimal 3 karakter' : 'Name must be at least 3 characters';
    }
    if (trimmed.length > 35) {
      return lang === 'id' ? 'Nama maksimal 35 karakter' : 'Name cannot exceed 35 characters';
    }

    // 3. Deteksi huruf berulang 3 kali berurutan (misal: aaa, zzz, fff)
    if (/(.)\1{2,}/i.test(trimmed)) {
      return lang === 'id'
        ? 'Nama tidak boleh mengandung pengulangan huruf tidak wajar (cth: aaa)'
        : 'Name contains unnatural repeated characters';
    }

    // 4. Deteksi ketikan acak pola keyboard QWERTY
    const keyboardSpam = [
      'qwerty', 'wertyu', 'ertyui', 'rtyuio', 'tyuiop',
      'asdfgh', 'sdfghj', 'dfghjk', 'fghjkl',
      'zxcvbn', 'xcvbnm',
      'poiuyt', 'oiuytr', 'iuytre', 'uytrew', 'ytrewq',
      'lkjhgf', 'kjhgfd', 'jhgfds', 'hgfdsa',
      'asdf', 'qwer', 'zxcv', 'hjkl', 'ghjk', 'yuio', 'uiop'
    ];
    const lower = trimmed.toLowerCase();
    for (const seq of keyboardSpam) {
      if (lower.includes(seq)) {
        return lang === 'id'
          ? 'Nama terdeteksi sebagai ketikan keyboard acak'
          : 'Name detected as random keyboard sequence';
      }
    }

    // 5. Cek setiap kata individual
    const words = trimmed.split(' ').filter(Boolean);
    for (const w of words) {
      const word = w.toLowerCase();

      if (word.length < 2) {
        return lang === 'id'
          ? `Bagian kata "${w}" terlalu pendek (minimal 2 huruf)`
          : `Word "${w}" is too short`;
      }
      if (word.length > 18) {
        return lang === 'id'
          ? `Bagian kata "${w}" terlalu panjang tidak wajar`
          : `Word "${w}" is unnaturally long`;
      }

      // Setiap kata harus memiliki minimal satu huruf vokal
      if (!/[aeiouy]/.test(word)) {
        return lang === 'id'
          ? `Bagian kata "${w}" tidak memiliki huruf vokal (a, i, u, e, o)`
          : `Word "${w}" has no vowels`;
      }

      // Konsonan berurutan >= 4 yang tidak wajar
      const consonants4 = word.match(/[bcdfghjklmnpqrstvwxz]{4,}/g);
      if (consonants4) {
        for (const cluster of consonants4) {
          if (!/(str|skr|ndr|mpr|nkr|ngk|ngs|rch|sch)/.test(cluster)) {
            return lang === 'id'
              ? `Kombinasi huruf "${cluster}" pada "${w}" tidak wajar`
              : `Consonant cluster "${cluster}" in "${w}" is invalid`;
          }
        }
      }

      // Pola kombinasi huruf acak (impossible bigrams/trigrams pada nama resmi)
      if (/(gfy|yfr|rhf|urhf|rfh|q[^u]|[^a-z]q$|zx|xj|jx|vj|jv|fv|vf|wq|qw|qx)/.test(word)) {
        return lang === 'id'
          ? `Kombinasi huruf pada "${w}" tidak sesuai format nama asli`
          : `Letter combination in "${w}" is not a valid name`;
      }

      // Pola pengulangan suku kata acak (misal: urfurf, asdasd, lalala)
      if (/^([a-z]{2,4})\1+$/.test(word)) {
        return lang === 'id'
          ? `Kata "${w}" terdeteksi sebagai pengulangan acak`
          : `Word "${w}" detected as repeated syllable spam`;
      }
    }

    // 6. Rasio huruf vokal
    const lettersOnly = trimmed.replace(/\s+/g, '').toLowerCase();
    const vowelsCount = (lettersOnly.match(/[aeiou]/g) || []).length;
    const vowelRatio = vowelsCount / lettersOnly.length;

    if (vowelRatio < 0.20) {
      return lang === 'id'
        ? 'Susunan nama tidak wajar (huruf vokal terlalu sedikit)'
        : 'Name has too few vowels (detected as random typing)';
    }
    if (vowelRatio > 0.85 && lettersOnly.length >= 4) {
      return lang === 'id'
        ? 'Susunan nama tidak wajar (terlalu banyak vokal)'
        : 'Name has too many vowels';
    }

    return '';
  }

  const validate = (): string => {
    const nameError = validateRealisticName(name)
    if (nameError) return nameError

    const cleanNik = nik.trim()
    if (cleanNik.length !== 16 || !/^\d{16}$/.test(cleanNik)) {
      return lang === 'id' ? 'NIK KTP harus tepat 16 digit angka' : 'National ID (NIK) must be exactly 16 numeric digits'
    }
    return ''
  }

  const toTitleCase = (str: string) => {
    return str
      .trim()
      .split(/\s+/)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ')
  }

  const handleSubmit = () => {
    const err = validate()
    if (err) { setError(err); return }
    setSubmitting(true)
    setTimeout(() => {
      onComplete(toTitleCase(name), nik.trim())
    }, 400)
  }

  const charLeft = name.trim().length
  const nikDigits = nik.trim().length

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
            Adaptive Tracking, Location & Alert System
          </p>
        </div>

        {/* Device & Real-time IP badge */}
        <div className="flex flex-col items-center justify-center gap-1.5 mb-5 px-3 py-2 rounded bg-black/60 border border-nerv-border text-slate-400 font-mono text-[10px]">
          <div className="flex items-center gap-2">
            {mobile ? <Smartphone className="w-3.5 h-3.5 text-nerv-cyan shrink-0" /> : <Monitor className="w-3.5 h-3.5 text-nerv-cyan shrink-0" />}
            <span>
              {t('device')}: <span className="text-white font-bold">{device} · {mobile ? 'Mobile' : 'Desktop'} ({browser})</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[9px] text-nerv-cyan border-t border-slate-800/80 pt-1 w-full justify-center">
            <Globe className="w-3 h-3 text-nerv-cyan shrink-0" />
            <span>{t('currentIp')}: <span className="text-slate-200 font-bold">{clientIp}</span></span>
          </div>
        </div>

        {/* Form Container */}
        <div className="p-5 rounded-lg border border-nerv-border bg-nerv-card shadow-2xl">
          <h2 className="text-base font-mono font-bold text-white mb-1 uppercase">
            {t('welcome')}
          </h2>
          <p className="text-[11px] text-slate-400 mb-4 font-sans leading-relaxed">
            {t('welcomeSubtitle')}
          </p>

          <div className="mb-4 p-2.5 rounded bg-black/50 border border-nerv-orange/40 font-mono relative overflow-hidden">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] text-nerv-orange font-bold uppercase tracking-wider flex items-center gap-1">
                <span>⚠</span> {t('oneDeviceOneReg')}
              </p>
              <span className="text-[8px] px-1.5 py-0.5 rounded bg-nerv-orange/20 text-nerv-orange border border-nerv-orange/40">
                NERV-SEC-01
              </span>
            </div>
            <p className="text-[9px] text-slate-300 mt-0.5 font-sans leading-relaxed">
              {t('oneDeviceDesc')}
            </p>
          </div>

          {/* Input Nama Sesuai KTP */}
          <div className="mb-3.5">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] text-slate-300 font-mono uppercase tracking-widest font-bold flex items-center gap-1.5">
                <User className="w-3 h-3 text-nerv-orange" />
                {t('nameLabel')}
              </label>
              <span className="text-[9px] text-slate-400 font-mono">{t('nameHint')}</span>
            </div>
            <div className="relative">
              <input
                type="text"
                value={name}
                maxLength={35}
                onChange={e => {
                  const cleaned = e.target.value.replace(/[^a-zA-Z\s]/g, '').replace(/\s+/g, ' ');
                  setName(cleaned);
                  setError('');
                }}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                placeholder={t('namePlaceholder')}
                autoFocus
                className="w-full px-3 py-2.5 rounded bg-black/60 border border-nerv-border text-white placeholder-slate-600 font-mono text-sm focus:outline-none focus:border-nerv-orange focus:ring-1 focus:ring-nerv-orange/30 transition-all"
              />
              <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono ${charLeft < 3 ? 'text-nerv-red' : 'text-slate-400'}`}>
                {charLeft}/35
              </span>
            </div>
          </div>

          {/* Input NIK KTP 16 Digit */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] text-slate-300 font-mono uppercase tracking-widest font-bold flex items-center gap-1.5">
                <CreditCard className="w-3 h-3 text-nerv-cyan" />
                {t('nikLabel')}
              </label>
              <span className="text-[9px] text-nerv-cyan font-mono">{t('nikHint')}</span>
            </div>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                value={nik}
                maxLength={16}
                onChange={e => {
                  const cleaned = e.target.value.replace(/\D/g, '').slice(0, 16);
                  setNik(cleaned);
                  setError('');
                }}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                placeholder={t('nikPlaceholder')}
                className="w-full px-3 py-2.5 rounded bg-black/60 border border-nerv-border text-nerv-cyan placeholder-slate-600 font-mono text-sm tracking-wider focus:outline-none focus:border-nerv-cyan focus:ring-1 focus:ring-nerv-cyan/30 transition-all"
              />
              <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold ${nikDigits === 16 ? 'text-nerv-green' : 'text-nerv-orange'}`}>
                {nikDigits}/16
              </span>
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-2 rounded bg-nerv-red/20 border border-nerv-red/50 text-nerv-red font-mono text-[10px] mb-3 flex items-center gap-1.5"
              >
                <span>⚠</span>
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-2">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-3 rounded bg-nerv-orange hover:bg-orange-600 active:scale-[0.99] text-black font-mono font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,87,34,0.4)] transition-all"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{t('continue')}</span>
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
