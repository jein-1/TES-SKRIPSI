// ═══════════════════════════════════════════════════════════════
// FIRST VISIT MODAL — A.T.L.A.S Device Identification & Welcome
// Multi-step Onboarding:
// Step 1: Emergency Protocol Agreement & EULA (ID / EN)
// Step 2: Official Personnel Registration (WNI vs WNA)
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Shield, Smartphone, Monitor, User, ArrowRight, ArrowLeft,
  Globe, CreditCard, FileText, CheckCircle2, AlertOctagon, Lock
} from 'lucide-react'
import { useLanguage } from '../../lib/i18n'
import { fetchClientIp } from '../../lib/geocode'
import { supabase } from '../../lib/supabaseClient'

interface Props {
  onComplete: (name: string, nik: string) => void
  onClose?: () => void
}

type CitizenshipType = 'WNI' | 'WNA'

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
  const [step, setStep] = useState<1 | 2>(1)
  const [citizenship, setCitizenship] = useState<CitizenshipType>('WNI')
  const [name, setName] = useState('')
  const [idNumber, setIdNumber] = useState('')
  const [error, setError] = useState('')
  const [declineWarning, setDeclineWarning] = useState(false)
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
        : 'Name must contain only alphabetic letters and spaces'
    }

    // 2. Panjang nama
    if (trimmed.length < 3) {
      return lang === 'id' ? 'Nama minimal 3 karakter' : 'Name must be at least 3 characters'
    }
    if (trimmed.length > 35) {
      return lang === 'id' ? 'Nama maksimal 35 karakter' : 'Name cannot exceed 35 characters'
    }

    // 3. Deteksi huruf berulang 3 kali berurutan
    if (/(.)\1{2,}/i.test(trimmed)) {
      return lang === 'id'
        ? 'Nama tidak boleh mengandung pengulangan huruf tidak wajar (cth: aaa)'
        : 'Name contains unnatural repeated characters'
    }

    // 4. Deteksi ketikan acak pola keyboard QWERTY
    const keyboardSpam = [
      'qwerty', 'wertyu', 'ertyui', 'rtyuio', 'tyuiop',
      'asdfgh', 'sdfghj', 'dfghjk', 'fghjkl',
      'zxcvbn', 'xcvbnm',
      'poiuyt', 'oiuytr', 'iuytre', 'uytrew', 'ytrewq',
      'lkjhgf', 'kjhgfd', 'jhgfds', 'hgfdsa',
      'asdf', 'qwer', 'zxcv', 'hjkl', 'ghjk', 'yuio', 'uiop'
    ]
    const lower = trimmed.toLowerCase()
    for (const seq of keyboardSpam) {
      if (lower.includes(seq)) {
        return lang === 'id'
          ? 'Nama terdeteksi sebagai ketikan keyboard acak'
          : 'Name detected as random keyboard sequence'
      }
    }

    // 5. Cek setiap kata individual
    const words = trimmed.split(' ').filter(Boolean)
    for (const w of words) {
      const word = w.toLowerCase()

      if (word.length < 2) {
        return lang === 'id'
          ? `Bagian kata "${w}" terlalu pendek (minimal 2 huruf)`
          : `Word "${w}" is too short`
      }
      if (word.length > 18) {
        return lang === 'id'
          ? `Bagian kata "${w}" terlalu panjang tidak wajar`
          : `Word "${w}" is unnaturally long`
      }

      if (!/[aeiouy]/.test(word)) {
        return lang === 'id'
          ? `Bagian kata "${w}" tidak memiliki huruf vokal (a, i, u, e, o)`
          : `Word "${w}" has no vowels`
      }

      const consonants4 = word.match(/[bcdfghjklmnpqrstvwxz]{4,}/g)
      if (consonants4) {
        for (const cluster of consonants4) {
          if (!/(str|skr|ndr|mpr|nkr|ngk|ngs|rch|sch)/.test(cluster)) {
            return lang === 'id'
              ? `Kombinasi huruf "${cluster}" pada "${w}" tidak wajar`
              : `Consonant cluster "${cluster}" in "${w}" is invalid`
          }
        }
      }

      if (/(gfy|yfr|rhf|urhf|rfh|q[^u]|[^a-z]q$|zx|xj|jx|vj|jv|fv|vf|wq|qw|qx)/.test(word)) {
        return lang === 'id'
          ? `Kombinasi huruf pada "${w}" tidak sesuai format nama asli`
          : `Letter combination in "${w}" is not a valid name`
      }

      if (/^([a-z]{2,4})\1+$/.test(word)) {
        return lang === 'id'
          ? `Kata "${w}" terdeteksi sebagai pengulangan acak`
          : `Word "${w}" detected as repeated syllable spam`
      }
    }

    // 6. Rasio huruf vokal
    const lettersOnly = trimmed.replace(/\s+/g, '').toLowerCase()
    const vowelsCount = (lettersOnly.match(/[aeiou]/g) || []).length
    const vowelRatio = vowelsCount / lettersOnly.length

    if (vowelRatio < 0.20) {
      return lang === 'id'
        ? 'Susunan nama tidak wajar (huruf vokal terlalu sedikit)'
        : 'Name has too few vowels (detected as random typing)'
    }
    if (vowelRatio > 0.85 && lettersOnly.length >= 4) {
      return lang === 'id'
        ? 'Susunan nama tidak wajar (terlalu banyak vokal)'
        : 'Name has too many vowels'
    }

    return ''
  }

  const validate = (): string => {
    const nameError = validateRealisticName(name)
    if (nameError) return nameError

    const cleanId = idNumber.trim()
    if (citizenship === 'WNI') {
      if (cleanId.length !== 16 || !/^\d{16}$/.test(cleanId)) {
        return lang === 'id'
          ? 'NIK KTP harus tepat 16 digit angka'
          : 'National ID (NIK) must be exactly 16 numeric digits'
      }
    } else {
      // WNA: Passport number validation (6 to 15 alphanumeric characters)
      if (cleanId.length < 6 || cleanId.length > 15 || !/^[a-zA-Z0-9]+$/.test(cleanId)) {
        return lang === 'id'
          ? 'Nomor Paspor harus 6-15 karakter alfanumerik (huruf/angka)'
          : 'Passport Number must be 6-15 alphanumeric characters'
      }
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

  const handleSubmit = async () => {
    const err = validate()
    if (err) { setError(err); return }
    setSubmitting(true)
    setError('')

    const cleanId = idNumber.trim()
    const myTerminalId = localStorage.getItem("atlasTerminalId") || localStorage.getItem("aegisTerminalId") || ""

    try {
      // Validasi NIK unik di server/database Supabase
      const { data: existingUsers } = await supabase
        .from('location_updates')
        .select('id, name, nik')
        .eq('nik', cleanId)
        .limit(1)

      if (existingUsers && existingUsers.length > 0) {
        const existing = existingUsers[0]
        const inputCleanName = name.trim().toLowerCase()
        const registeredName = (existing.name || '').trim().toLowerCase()

        // Pemulihan sesi terminal: Jika nama cocok, izinkan registrasi ulang setelah Clear Data / Reset
        if (registeredName && registeredName === inputCleanName) {
          if (existing.id && (existing.id.toUpperCase().includes('NODE-01') || existing.id === 'NODE-01')) {
            localStorage.setItem('atlas_is_node_01', 'true')
            localStorage.setItem('atlasTerminalId', 'NODE-01')
            localStorage.setItem('aegisTerminalId', 'NODE-01')
          }
          if (myTerminalId && existing.id !== myTerminalId) {
            try {
              await supabase
                .from('location_updates')
                .update({ id: myTerminalId, updated_at: new Date().toISOString() })
                .eq('nik', cleanId)
            } catch (upErr) {
              console.warn("Reclaim NIK update notice:", upErr)
            }
          }
        } else if (myTerminalId && existing.id !== myTerminalId) {
          setError(
            lang === 'id'
              ? `NIK [${cleanId}] sudah terdaftar atas nama pengguna lain (${existing.name}). Pastikan ejaan nama lengkap sesuai e-KTP.`
              : `NIK [${cleanId}] is already registered under another name (${existing.name}). Verification rejected.`
          )
          setSubmitting(false)
          return
        }
      }
    } catch (e) {
      console.warn("NIK uniqueness check warning:", e)
    }

    setTimeout(() => {
      onComplete(toTitleCase(name), cleanId)
    }, 400)
  }

  const charLeft = name.trim().length
  const idLength = idNumber.trim().length

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9000] flex flex-col items-center justify-center p-4 sm:p-6 bg-[#07090E]/98 backdrop-blur-xl overflow-y-auto"
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
        className="w-full max-w-md relative z-10 my-auto"
      >
        {/* Language switch button */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold text-nerv-cyan uppercase tracking-widest">
              STEP {step} OF 2 // {step === 1 ? 'EULA & PROTOCOL' : 'IDENTITY VERIFICATION'}
            </span>
          </div>

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

        {/* Brand Header */}
        <div className="flex flex-col items-center mb-4 text-center">
          <div
            className="w-12 h-12 rounded-xl bg-nerv-card border border-nerv-orange/40 flex items-center justify-center mb-2 shadow-[0_0_20px_rgba(255,87,34,0.3)]"
          >
            <Shield className="w-6 h-6 text-nerv-orange" />
          </div>
          <h1 className="text-xl font-black text-nerv-orange tracking-widest font-mono drop-shadow-[0_0_10px_rgba(255,87,34,0.5)]">
            A.T.L.A.S
          </h1>
          <p className="text-[10px] text-slate-300 tracking-wider font-mono uppercase font-bold">
            Autonomous Threat Location & Alert System
          </p>
          <p className="text-[8.5px] text-slate-400 tracking-wide font-mono mt-0.5">
            Sistem Otonom Pemetaan Ancaman Bahaya dan Peringatan Darurat
          </p>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            STEP 1: TERMS OF SERVICE & EMERGENCY EVACUATION EULA
           ═══════════════════════════════════════════════════════════════ */}
        {step === 1 && (
          <motion.div
            key="step-1"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="p-5 rounded-lg border border-nerv-border bg-nerv-card shadow-2xl font-mono"
          >
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-nerv-border">
              <FileText className="w-4 h-4 text-nerv-orange" />
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                {lang === 'id' ? 'PROTOKOL PERSETUJUAN LAYANAN EVAKUASI DARURAT' : 'EMERGENCY EVACUATION SERVICE PROTOCOL & EULA'}
              </h2>
            </div>

            <p className="text-[11px] text-slate-300 font-sans leading-relaxed mb-3">
              {lang === 'id'
                ? 'Sebelum mengaktifkan terminal A.T.L.A.S, Anda wajib memahami dan menyetujui protokol perlindungan sipil berikut:'
                : 'Prior to activating the A.T.L.A.S terminal, you must review and accept the civil protection protocol below:'}
            </p>

            {/* Scrollable EULA Tactical Directives */}
            <div className="p-3 rounded bg-black/60 border border-nerv-border text-[10px] space-y-2.5 max-h-56 overflow-y-auto font-sans leading-relaxed text-slate-300 mb-4 select-text">
              <div className="flex items-start gap-2">
                <span className="text-nerv-cyan font-mono font-bold shrink-0">01.</span>
                <div>
                  <strong className="text-white block font-mono">
                    {lang === 'id' ? 'Akses Sensor & Telemetri Satelit:' : 'Sensor Access & Satellite Telemetry:'}
                  </strong>
                  {lang === 'id'
                    ? 'A.T.L.A.S membutuhkan izin GPS presisi tinggi untuk memandu evakuasi mandiri ke titik kumpul aman (Assembly Point / TES) saat bencana terjadi.'
                    : 'A.T.L.A.S requires high-precision GPS to guide autonomous self-evacuation to designated safe assembly shelters (TES) during critical events.'}
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="text-nerv-orange font-mono font-bold shrink-0">02.</span>
                <div>
                  <strong className="text-white block font-mono">
                    {lang === 'id' ? 'Kerahasiaan & Privasi Koordinat:' : 'Coordinate Privacy & Encryption:'}
                  </strong>
                  {lang === 'id'
                    ? 'Dalam kondisi siaga normal, koordinat pengguna tidak ditampilkan ke publik atau admin umum. Posisi hanya dienkripsi untuk pencarian SAR ketika status darurat aktif atau saat pengguna dicari secara resmi.'
                    : 'Under normal conditions, user locations are private. Coordinates are encrypted and only accessible to rescue dispatchers during active disaster operations or targeted searches.'}
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="text-nerv-green font-mono font-bold shrink-0">03.</span>
                <div>
                  <strong className="text-white block font-mono">
                    {lang === 'id' ? 'Integritas 1 Perangkat = 1 Identitas:' : 'Integrity: 1 Physical Device = 1 Official ID:'}
                  </strong>
                  {lang === 'id'
                    ? 'Satu perangkat fisik didaftarkan secara permanen untuk 1 identitas resmi warga (NIK KTP untuk WNI, atau Paspor untuk WNA) guna mencegah duplikasi data manifest evakuasi.'
                    : 'Each physical terminal registers 1 official identity (National ID for citizens or Passport for foreign nationals) to ensure authentic rescue rosters.'}
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="text-nerv-cyan font-mono font-bold shrink-0">04.</span>
                <div>
                  <strong className="text-white block font-mono">
                    {lang === 'id' ? 'Kemandirian Jaringan Offline:' : 'Offline Network Independence:'}
                  </strong>
                  {lang === 'id'
                    ? 'Sistem dilengkapi graf jalan dan algoritma rute evakuasi lokal mandiri di dalam perangkat, tetap berfungsi bahkan saat internet/BTS seluler lumpuh total.'
                    : 'The system bundles onboard road networks and local routing algorithms, operating autonomously even during complete cellular infrastructure blackouts.'}
                </div>
              </div>
            </div>

            {/* Decline Warning Alert */}
            <AnimatePresence>
              {declineWarning && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="p-2.5 rounded bg-nerv-red/20 border border-nerv-red/50 text-nerv-red text-[10px] mb-3 flex items-start gap-2 font-mono"
                >
                  <AlertOctagon className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    {lang === 'id'
                      ? 'Persetujuan protokol keselamatan darurat diperlukan untuk mengakses sistem A.T.L.A.S (Sistem Otonom Pemetaan Ancaman Bahaya dan Peringatan Darurat).'
                      : 'Acceptance of the emergency safety protocol is required to access the A.T.L.A.S network (Autonomous Threat Location & Alert System).'}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action Buttons: Agree vs Decline */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setDeclineWarning(true)}
                className="py-2.5 px-3 rounded bg-black/60 border border-nerv-border hover:border-nerv-red text-slate-400 hover:text-nerv-red text-[11px] font-bold uppercase tracking-wider transition-colors"
              >
                {lang === 'id' ? 'TIDAK SETUJU' : 'DECLINE'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setDeclineWarning(false)
                  setStep(2)
                }}
                className="py-2.5 px-3 rounded bg-nerv-orange hover:bg-orange-600 text-black text-[11px] font-bold uppercase tracking-widest flex items-center justify-center gap-1.5 shadow-[0_0_16px_rgba(255,87,34,0.4)] transition-all"
              >
                <span>{lang === 'id' ? 'SETUJU & LANJUT' : 'AGREE & PROCEED'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            STEP 2: CITIZENSHIP SELECTION (WNI vs WNA) & IDENTITY
           ═══════════════════════════════════════════════════════════════ */}
        {step === 2 && (
          <motion.div
            key="step-2"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="p-5 rounded-lg border border-nerv-border bg-nerv-card shadow-2xl font-mono"
          >
            {/* Header with Back Button */}
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-nerv-border">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>{lang === 'id' ? 'KEMBALI KE PROTOKOL' : 'BACK TO PROTOCOL'}</span>
              </button>

              <div className="text-[9px] text-nerv-cyan font-bold uppercase">
                {citizenship} VERIFICATION
              </div>
            </div>

            {/* Citizenship Toggle (WNI vs WNA) */}
            <div className="mb-4">
              <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1.5 font-bold">
                {lang === 'id' ? 'STATUS KEWARGANEGARAAN PERSONEL:' : 'CITIZENSHIP CLASSIFICATION:'}
              </label>
              <div className="grid grid-cols-2 gap-2 p-1 rounded-lg bg-black/60 border border-nerv-border">
                <button
                  type="button"
                  onClick={() => {
                    setCitizenship('WNI')
                    setError('')
                  }}
                  className={`py-2 px-3 rounded text-[11px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                    citizenship === 'WNI'
                      ? 'bg-nerv-orange text-black shadow-[0_0_12px_rgba(255,87,34,0.4)]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>WNI (INDONESIA)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCitizenship('WNA')
                    setError('')
                  }}
                  className={`py-2 px-3 rounded text-[11px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                    citizenship === 'WNA'
                      ? 'bg-nerv-cyan text-black shadow-[0_0_12px_rgba(0,229,255,0.4)]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>WNA (FOREIGNER)</span>
                </button>
              </div>
            </div>

            {/* Hardware & IP telemetry pill */}
            <div className="flex items-center justify-between mb-4 px-2.5 py-1.5 rounded bg-black/50 border border-slate-800 text-[9px] text-slate-400">
              <span className="flex items-center gap-1">
                {mobile ? <Smartphone className="w-3 h-3 text-nerv-cyan" /> : <Monitor className="w-3 h-3 text-nerv-cyan" />}
                <span className="text-white">{device}</span>
              </span>
              <span className="text-nerv-green font-mono">
                IP: {clientIp}
              </span>
            </div>

            {/* Input Nama Lengkap */}
            <div className="mb-3.5">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] text-slate-300 font-mono uppercase tracking-widest font-bold flex items-center gap-1.5">
                  <User className="w-3 h-3 text-nerv-orange" />
                  {citizenship === 'WNI'
                    ? (lang === 'id' ? 'Nama Lengkap (Sesuai KTP)' : 'Full Name (As in ID)')
                    : (lang === 'id' ? 'Nama Lengkap (Sesuai Paspor)' : 'Full Name (As in Passport)')}
                </label>
                <span className="text-[9px] text-slate-400 font-mono">{charLeft}/35</span>
              </div>
              <input
                type="text"
                value={name}
                maxLength={35}
                onChange={e => {
                  const cleaned = e.target.value.replace(/[^a-zA-Z\s]/g, '').replace(/\s+/g, ' ')
                  setName(cleaned)
                  setError('')
                }}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                placeholder={citizenship === 'WNI' ? 'Cth: Mohammad Hatta' : 'E.g., Johnathan Miller'}
                autoFocus
                className="w-full px-3 py-2.5 rounded bg-black/60 border border-nerv-border text-white placeholder-slate-600 font-mono text-sm focus:outline-none focus:border-nerv-orange focus:ring-1 focus:ring-nerv-orange/30 transition-all"
              />
            </div>

            {/* Input Nomor Identitas (NIK 16 Digit vs Paspor) */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] text-slate-300 font-mono uppercase tracking-widest font-bold flex items-center gap-1.5">
                  <CreditCard className="w-3 h-3 text-nerv-cyan" />
                  {citizenship === 'WNI'
                    ? (lang === 'id' ? 'Nomor Induk Kependudukan (NIK)' : 'National ID (NIK 16-Digit)')
                    : (lang === 'id' ? 'Nomor Paspor / ID Resmi' : 'Passport / Official ID Number')}
                </label>
                <span className="text-[9px] text-nerv-cyan font-mono">
                  {citizenship === 'WNI' ? `${idLength}/16 Digit` : `${idLength}/15 Chars`}
                </span>
              </div>

              <input
                type="text"
                inputMode={citizenship === 'WNI' ? 'numeric' : 'text'}
                value={idNumber}
                maxLength={citizenship === 'WNI' ? 16 : 15}
                onChange={e => {
                  let cleaned = ''
                  if (citizenship === 'WNI') {
                    cleaned = e.target.value.replace(/\D/g, '').slice(0, 16)
                  } else {
                    cleaned = e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 15).toUpperCase()
                  }
                  setIdNumber(cleaned)
                  setError('')
                }}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                placeholder={citizenship === 'WNI' ? '727101XXXXXXXXXX' : 'A12345678'}
                className="w-full px-3 py-2.5 rounded bg-black/60 border border-nerv-border text-nerv-cyan placeholder-slate-600 font-mono text-sm tracking-wider focus:outline-none focus:border-nerv-cyan focus:ring-1 focus:ring-nerv-cyan/30 transition-all"
              />
              <p className="text-[9px] text-slate-400 font-sans mt-1">
                {citizenship === 'WNI'
                  ? (lang === 'id' ? 'Wajib tepat 16 digit angka KTP resmi Indonesia.' : 'Must be exactly 16 numeric digits of Indonesian ID.')
                  : (lang === 'id' ? 'Nomor paspor resmi turis atau ekspatriat (6-15 karakter alfanumerik).' : 'Official passport number for foreign nationals (6-15 chars).')}
              </p>
            </div>

            {/* Error Message */}
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

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-3 rounded bg-nerv-orange hover:bg-orange-600 active:scale-[0.99] text-black font-mono font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,87,34,0.4)] transition-all"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>{lang === 'id' ? 'KUNCI IDENTITAS RESMI' : 'REGISTER & LOCK IDENTITY'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  )
}
