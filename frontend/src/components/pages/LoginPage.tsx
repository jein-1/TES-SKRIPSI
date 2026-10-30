// ═══════════════════════════════════════════════════════════════
// ADMIN LOGIN & REGISTRATION PAGE — Tactical Access Control
// (Zero-Trust Role Authority with Approval Gate)
// ═══════════════════════════════════════════════════════════════
import { useState, useMemo } from 'react'
import { Shield, Eye, EyeOff, Lock, User, AlertTriangle, CheckCircle2, UserPlus, LogIn, CreditCard } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import {
  verifyAdminLogin,
  registerNewAdmin,
  getLockoutStatus
} from '../../lib/adminAuthStorage'

export type UserRole = 'admin' | 'user'

interface Props {
  onLogin: (role: UserRole, name: string, specificRole?: string) => void
}

function TacticalGrid() {
  return (
    <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#6366f1" strokeWidth="0.5"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
  )
}

// Password Strength Evaluator
function evaluatePasswordStrength(pwd: string): {
  score: number
  label: string
  color: string
  barWidth: string
} {
  if (!pwd) return { score: 0, label: 'KOSONG', color: 'bg-slate-700', barWidth: '0%' }
  
  const isPurePin = /^\d{6,8}$/.test(pwd)
  if (isPurePin) {
    return { score: 1, label: 'PIN Standar (Cukup)', color: 'bg-amber-500', barWidth: '35%' }
  }

  let score = 0
  if (pwd.length >= 6) score += 1
  if (pwd.length >= 8) score += 1
  if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score += 1
  if (/\d/.test(pwd)) score += 1
  if (/[^a-zA-Z0-9]/.test(pwd)) score += 1

  if (score <= 2) {
    return { score: 1, label: 'Cukup', color: 'bg-amber-500', barWidth: '40%' }
  }
  if (score <= 4) {
    return { score: 2, label: 'Sedang / Baik', color: 'bg-blue-500', barWidth: '70%' }
  }
  return { score: 3, label: 'Sangat Kuat / Maksimal', color: 'bg-emerald-500', barWidth: '100%' }
}

export default function LoginPage({ onLogin }: Props) {
  const [tab, setTab] = useState<'login' | 'register'>('login')

  // Login State
  const [roleCode, setRoleCode] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Register State
  const [regNik, setRegNik] = useState('')
  const [regName, setRegName] = useState('')
  const [regRole, setRegRole] = useState('')
  const [regProvince, setRegProvince] = useState('Sulawesi Tengah')
  const [regCity, setRegCity] = useState('Kota Palu')
  const [regPassword, setRegPassword] = useState('')
  const [regShowPw, setRegShowPw] = useState(false)
  const [regSuccessMsg, setRegSuccessMsg] = useState('')

  const pwdStrength = useMemo(() => evaluatePasswordStrength(regPassword), [regPassword])

  // Handle Login
  const handleLogin = async () => {
    if (!roleCode.trim() || !password.trim()) {
      setError('Kode Peran dan Password / PIN harus diisi.')
      return
    }

    const normalizedRole = roleCode.trim().toUpperCase()
    const lockout = getLockoutStatus()
    if (lockout.locked && normalizedRole !== 'ARCHITECT') {
      setError(`Akses dibekukan sementara demi keamanan. Tunggu ${Math.ceil(lockout.remainingSec / 60)} menit lagi.`)
      return
    }

    setLoading(true)
    setError('')

    try {
      const normalizedRole = roleCode.trim().toUpperCase()
      const verification = verifyAdminLogin(normalizedRole, password.trim())

      if (verification.success && verification.admin) {
        // Simpan nama operator dan yurisdiksi resmi
        localStorage.setItem('atlasAdminOperatorName', verification.admin.name)
        localStorage.setItem('atlasAdminRole', verification.admin.role)
        localStorage.setItem('atlasAdminProvince', verification.admin.province || 'Sulawesi Tengah')
        localStorage.setItem('atlasAdminCity', verification.admin.city || 'Kota Palu')
        sessionStorage.setItem('aegisRole', 'admin')
        sessionStorage.setItem('aegisUser', verification.admin.name)
        onLogin('admin', verification.admin.name, verification.admin.role)
        return
      }

      // Jika verifikasi lokal tidak berhasil (password salah, ditangguhkan, dll)
      setError(verification.error || 'Katasandi salah')
      return
    } catch {
      setError('Katasandi salah')
    } finally {
      setLoading(false)
    }
  }

  // Handle Register
  const handleRegister = () => {
    if (!regNik.trim() || regNik.trim().length !== 16) {
      setError('NIK KTP harus tepat 16 digit angka.')
      return
    }
    if (!regName.trim() || regName.trim().length < 3) {
      setError('Nama Lengkap resmi minimal 3 karakter alfabet.')
      return
    }
    const finalRole = regRole.trim().toUpperCase()
    if (!finalRole) {
      setError('Masukkan Kode Peran Otoritas yang diajukan.')
      return
    }
    if (!regPassword.trim() || regPassword.trim().length < 6) {
      setError('Password / PIN minimal 6 digit/karakter.')
      return
    }

    setError('')
    const res = registerNewAdmin({
      role: finalRole,
      name: regName.trim(),
      nik: regNik.trim(),
      pin: regPassword.trim(),
      province: regProvince.trim(),
      city: regCity.trim()
    })

    if (!res.success) {
      setError(res.error || 'Pendaftaran gagal.')
      return
    }

    setRegSuccessMsg('Pendaftaran Terkirim. Menunggu Verifikasi & Persetujuan.')
    setRegNik('')
    setRegName('')
    setRegRole('')
    setRegPassword('')

    setTimeout(() => {
      setRegSuccessMsg('')
      setTab('login')
      setRoleCode(finalRole)
    }, 3000)
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-y-auto py-8"
      style={{ background: '#060d1a' }}
    >
      <TacticalGrid />

      {/* Glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-64 opacity-20 blur-3xl rounded-full pointer-events-none"
        style={{ background: '#6366f1' }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative w-full max-w-sm mx-auto px-5"
      >
        {/* Brand */}
        <div className="text-center mb-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="w-20 h-20 mx-auto mb-3 flex items-center justify-center"
          >
            <img
              src="/atlas-logo-admin.png"
              alt="// A.T.L.A.S"
              className="w-full h-full object-contain drop-shadow-[0_0_25px_rgba(99,102,241,0.6)]"
            />
          </motion.div>
          <h1 className="text-xl font-black text-white tracking-widest font-mono">A.T.L.A.S</h1>
          <p className="text-[10px] text-nerv-orange mt-0.5 font-mono tracking-widest uppercase">
            Portal Otoritas & Komando
          </p>
        </div>

        {/* Card */}
        <div
          className="p-5 rounded-2xl border border-slate-700/60 shadow-[0_8px_48px_rgba(0,0,0,0.6)]"
          style={{ background: 'rgba(10,16,32,0.96)', backdropFilter: 'blur(16px)' }}
        >
          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1 mb-5 rounded-xl bg-slate-900 border border-slate-800 font-mono text-[11px] font-bold">
            <button
              type="button"
              onClick={() => { setTab('login'); setError('') }}
              className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                tab === 'login'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>MASUK</span>
            </button>
            <button
              type="button"
              onClick={() => { setTab('register'); setError('') }}
              className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                tab === 'register'
                  ? 'bg-nerv-orange text-black font-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>DAFTAR BARU</span>
            </button>
          </div>

          {/* TAB 1: LOGIN FORM */}
          {tab === 'login' && (
            <div className="space-y-4">
              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1.5 block font-mono">
                  Kode Peran Otoritas (Huruf Besar)
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={roleCode}
                    onChange={(e) => {
                      setRoleCode(e.target.value.toUpperCase())
                      setError('')
                    }}
                    placeholder=""
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border text-xs font-mono font-bold text-white uppercase outline-none transition-all placeholder:text-slate-600 focus:border-indigo-500"
                    style={{ background: '#060d1a', borderColor: error ? '#ef4444' : '#1e293b' }}
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1.5 block font-mono">
                  Password / PIN Akses
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError('') }}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl border text-xs text-white font-mono font-medium outline-none transition-all placeholder:text-slate-600 focus:border-indigo-500"
                    style={{ background: '#060d1a', borderColor: error ? '#ef4444' : '#1e293b' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-start gap-2 p-2.5 rounded-xl bg-red-950/60 border border-red-700/50 text-[11px] text-red-300 font-mono"
                  >
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit Login */}
              <button
                type="button"
                onClick={handleLogin}
                disabled={loading}
                className="w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-white flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
              >
                {loading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>MEMVERIFIKASI OTORITAS...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-3.5 h-3.5" />
                    <span>MASUK KE SISTEM</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* TAB 2: REGISTRATION FORM */}
          {tab === 'register' && (
            <div className="space-y-3.5">
              {/* NIK Field */}
              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1 font-mono flex items-center justify-between">
                  <span>Nomor Induk Kependudukan (NIK)</span>
                  <span className="text-[9px] text-nerv-cyan">{regNik.length}/16</span>
                </label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={16}
                    value={regNik}
                    onChange={(e) => {
                      setRegNik(e.target.value.replace(/\D/g, '').slice(0, 16))
                      setError('')
                    }}
                    placeholder="16 Digit NIK KTP Resmi"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border text-xs font-mono text-nerv-cyan outline-none transition-all placeholder:text-slate-600 focus:border-nerv-orange"
                    style={{ background: '#060d1a', borderColor: '#1e293b' }}
                  />
                </div>
              </div>

              {/* Nama Lengkap Field */}
              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1 block font-mono">
                  Nama Lengkap Resmi Penanggung Jawab
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => {
                      setRegName(e.target.value.replace(/[^a-zA-Z\s]/g, ''))
                      setError('')
                    }}
                    placeholder="Sesuai KTP Dinas"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border text-xs text-white outline-none transition-all placeholder:text-slate-600 focus:border-nerv-orange font-sans"
                    style={{ background: '#060d1a', borderColor: '#1e293b' }}
                  />
                </div>
              </div>

              {/* Kode Peran Input (Input Manual Otomatis Huruf Besar) */}
              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1 block font-mono">
                  Kode Peran Otoritas (Huruf Besar)
                </label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={regRole}
                    onChange={(e) => {
                      setRegRole(e.target.value.toUpperCase())
                      setError('')
                    }}
                    placeholder=""
                    className="w-full pl-9 pr-3 py-2 rounded-xl border text-xs font-mono font-bold text-white uppercase outline-none transition-all placeholder:text-slate-600 focus:border-nerv-orange"
                    style={{ background: '#060d1a', borderColor: '#1e293b' }}
                  />
                </div>
              </div>

              {/* Yurisdiksi Provinsi & Kota/Kabupaten */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1 block font-mono">
                    Provinsi
                  </label>
                  <input
                    type="text"
                    value={regProvince}
                    onChange={(e) => { setRegProvince(e.target.value); setError('') }}
                    placeholder="Sulawesi Tengah"
                    className="w-full px-3 py-2 rounded-xl border text-xs font-mono text-white outline-none focus:border-nerv-orange"
                    style={{ background: '#060d1a', borderColor: '#1e293b' }}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1 block font-mono">
                    Kota / Kabupaten
                  </label>
                  <input
                    type="text"
                    value={regCity}
                    onChange={(e) => { setRegCity(e.target.value); setError('') }}
                    placeholder="Kota Palu"
                    className="w-full px-3 py-2 rounded-xl border text-xs font-mono text-white outline-none focus:border-nerv-orange"
                    style={{ background: '#060d1a', borderColor: '#1e293b' }}
                  />
                </div>
              </div>

              {/* Password / PIN Field */}
              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1 block font-mono">
                  Password / PIN Akses Baru
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type={regShowPw ? 'text' : 'password'}
                    value={regPassword}
                    onChange={(e) => { setRegPassword(e.target.value); setError('') }}
                    placeholder="Minimal 6 digit / karakter"
                    className="w-full pl-9 pr-10 py-2 rounded-xl border text-xs text-white font-mono outline-none transition-all placeholder:text-slate-600 focus:border-nerv-orange"
                    style={{ background: '#060d1a', borderColor: '#1e293b' }}
                  />
                  <button
                    type="button"
                    onClick={() => setRegShowPw(!regShowPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {regShowPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Indicator Bar */}
                {regPassword.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${pwdStrength.color}`}
                        style={{ width: pwdStrength.barWidth }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[9px] font-mono">
                      <span className="text-slate-500">Kekuatan Kredensial:</span>
                      <span className="font-bold text-slate-300">{pwdStrength.label}</span>
                    </div>
                  </div>
                )}

                {/* Helper Note */}
                <p className="text-[9px] text-slate-400 font-sans mt-1.5 leading-snug">
                  💡 Disarankan kombinasi huruf, angka, dan simbol untuk keamanan maksimal (PIN angka minimal 6 digit tetap didukung).
                </p>
              </div>

              {/* Status & Error Messages */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-start gap-2 p-2.5 rounded-xl bg-red-950/60 border border-red-700/50 text-[11px] text-red-300 font-mono"
                  >
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </motion.div>
                )}
                {regSuccessMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/60 text-emerald-300 font-mono text-[11px] text-center space-y-1 shadow-lg"
                  >
                    <div className="flex items-center justify-center gap-1.5 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>{regSuccessMsg}</span>
                    </div>
                    <p className="text-[9px] text-emerald-400/80">
                      Mengalihkan otomatis ke layar login...
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit Register */}
              <button
                type="button"
                onClick={handleRegister}
                disabled={!!regSuccessMsg}
                className="w-full py-3 rounded-xl font-black text-xs uppercase tracking-wider text-black flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #FF5722, #F59E0B)' }}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>KIRIM PENDAFTARAN RESMI</span>
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-[10px] text-slate-600 mt-4 font-mono">
          A.T.L.A.S · Sistem Otonom Pemetaan & Tanggap Bencana
        </p>
      </motion.div>
    </div>
  )
}
