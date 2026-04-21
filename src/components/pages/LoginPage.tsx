// ═══════════════════════════════════════════════════════════════
// LOGIN PAGE — Role Selection (Admin / Public User)
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect } from 'react'
import { Shield, Eye, EyeOff, Lock, User, ChevronRight, AlertTriangle } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

export type UserRole = 'admin' | 'user'

interface Props {
  onLogin: (role: UserRole, name: string) => void
}

// ── Credential config (demo purposes for skripsi) ──────────────
const CREDENTIALS = {
  admin: { username: 'admin', password: 'aegis2024', label: 'Administrator', color: '#6366f1' },
  user:  { username: 'user',  password: 'aegis2024', label: 'Public User',   color: '#10b981' },
}

// ── Animated grid background ────────────────────────────────────
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

// ── Role selector card ──────────────────────────────────────────
interface RoleCardProps {
  role: UserRole
  selected: boolean
  onClick: () => void
}

function RoleCard({ role, selected, onClick }: RoleCardProps) {
  const isAdmin = role === 'admin'
  const config = isAdmin
    ? { icon: '🛡️', title: 'Administrator', desc: 'Akses penuh ke Tactical Dashboard, Sensor Array, dan konfigurasi sistem.', color: '#6366f1', badge: 'TACTICAL OPS' }
    : { icon: '👤', title: 'Pengguna Publik', desc: 'Navigasi evakuasi, status keluarga, dan panduan keselamatan.', color: '#10b981', badge: 'PUBLIC ACCESS' }

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`w-full p-4 rounded-2xl border text-left transition-all duration-200 ${
        selected
          ? `border-[${config.color}]/60 shadow-[0_0_24px_${config.color}22]`
          : 'border-slate-700/50 hover:border-slate-600'
      }`}
      style={{
        background: selected ? `${config.color}12` : '#0f1a2e',
        borderColor: selected ? `${config.color}60` : undefined,
      }}
    >
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl shrink-0"
          style={{ background: `${config.color}18`, border: `1px solid ${config.color}30` }}>
          {config.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-sm font-black text-white">{config.title}</p>
            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md"
              style={{ background: `${config.color}25`, color: config.color }}>
              {config.badge}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">{config.desc}</p>
        </div>
        <div className={`w-5 h-5 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
          selected ? 'border-transparent' : 'border-slate-600'
        }`} style={selected ? { background: config.color } : {}}>
          {selected && <div className="w-2 h-2 rounded-full bg-white" />}
        </div>
      </div>
    </motion.button>
  )
}

// ── Main LoginPage ───────────────────────────────────────────────
export default function LoginPage({ onLogin }: Props) {
  const [selectedRole, setSelectedRole] = useState<UserRole>('user')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'role' | 'credentials'>('role')

  // Pre-fill hint credentials on role change
  useEffect(() => {
    setUsername(CREDENTIALS[selectedRole].username)
    setPassword(CREDENTIALS[selectedRole].password)
    setError('')
  }, [selectedRole])

  const handleContinue = () => {
    if (step === 'role') {
      setStep('credentials')
      return
    }
    // Validate credentials
    const cred = CREDENTIALS[selectedRole]
    if (username === cred.username && password === cred.password) {
      setLoading(true)
      setTimeout(() => onLogin(selectedRole, username), 900)
    } else {
      setError('Username atau password salah.')
    }
  }

  const accentColor = selectedRole === 'admin' ? '#6366f1' : '#10b981'

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
      style={{ background: '#060d1a' }}>
      <TacticalGrid />

      {/* Glow blob */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-64 opacity-20 blur-3xl rounded-full pointer-events-none transition-all duration-700"
        style={{ background: accentColor }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-sm mx-auto px-5"
      >
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="w-20 h-20 rounded-3xl mx-auto mb-4 flex items-center justify-center border border-indigo-500/30 shadow-[0_0_40px_rgba(99,102,241,0.25)]"
            style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)' }}
          >
            <Shield className="w-10 h-10 text-indigo-400" />
          </motion.div>
          <h1 className="text-2xl font-black text-white tracking-tight">AEGIS RESPONSE</h1>
          <p className="text-[11px] text-slate-500 mt-1 font-medium tracking-widest uppercase">
            Sistem Evakuasi Cerdas · Kota Palu
          </p>
        </div>

        {/* Card */}
        <div className="p-5 rounded-3xl border border-slate-700/50 shadow-[0_8px_48px_rgba(0,0,0,0.6)]"
          style={{ background: 'rgba(10,16,32,0.96)', backdropFilter: 'blur(16px)' }}>

          <AnimatePresence mode="wait">
            {step === 'role' ? (
              <motion.div
                key="role-step"
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}
              >
                <h2 className="text-base font-black text-white mb-1">Pilih Tipe Akun</h2>
                <p className="text-[11px] text-slate-500 mb-4">Masuk sebagai Administrator atau Pengguna Publik.</p>

                <div className="space-y-3 mb-5">
                  <RoleCard role="user"  selected={selectedRole === 'user'}  onClick={() => setSelectedRole('user')} />
                  <RoleCard role="admin" selected={selectedRole === 'admin'} onClick={() => setSelectedRole('admin')} />
                </div>

                <button
                  onClick={handleContinue}
                  className="w-full py-3.5 rounded-2xl font-black text-sm tracking-wide text-white flex items-center justify-center gap-2 transition-all shadow-lg"
                  style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}bb)`, boxShadow: `0 4px 24px ${accentColor}44` }}
                >
                  Lanjutkan <ChevronRight className="w-4 h-4" />
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="credentials-step"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}
              >
                {/* Back + role label */}
                <div className="flex items-center gap-2 mb-4">
                  <button onClick={() => { setStep('role'); setError('') }}
                    className="text-slate-500 hover:text-white transition-colors text-sm">
                    ← Kembali
                  </button>
                  <span className="text-slate-700">|</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">{selectedRole === 'admin' ? '🛡️' : '👤'}</span>
                    <span className="text-xs font-bold" style={{ color: accentColor }}>
                      {CREDENTIALS[selectedRole].label}
                    </span>
                  </div>
                </div>

                <h2 className="text-base font-black text-white mb-4">Masuk ke Sistem</h2>

                {/* Username */}
                <div className="mb-3">
                  <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1.5 block">
                    Username
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                    <input
                      type="text"
                      value={username}
                      onChange={e => { setUsername(e.target.value); setError('') }}
                      className="w-full pl-9 pr-3 py-3 rounded-xl border text-sm text-white font-medium outline-none transition-all"
                      style={{
                        background: '#060d1a',
                        borderColor: error ? '#ef4444' : '#1e293b',
                      }}
                      placeholder="Masukkan username"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="mb-4">
                  <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1.5 block">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={password}
                      onChange={e => { setPassword(e.target.value); setError('') }}
                      onKeyDown={e => e.key === 'Enter' && handleContinue()}
                      className="w-full pl-9 pr-10 py-3 rounded-xl border text-sm text-white font-medium outline-none transition-all"
                      style={{
                        background: '#060d1a',
                        borderColor: error ? '#ef4444' : '#1e293b',
                      }}
                      placeholder="Masukkan password"
                    />
                    <button onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400">
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="flex items-center gap-2 mb-3 p-2.5 rounded-xl bg-red-950/50 border border-red-700/40"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                      <span className="text-[11px] text-red-400 font-semibold">{error}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Login button */}
                <button
                  onClick={handleContinue}
                  disabled={loading}
                  className="w-full py-3.5 rounded-2xl font-black text-sm tracking-wide text-white flex items-center justify-center gap-2 transition-all disabled:opacity-70"
                  style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}bb)`, boxShadow: `0 4px 24px ${accentColor}44` }}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Memverifikasi...
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4" />
                      MASUK KE SISTEM
                    </>
                  )}
                </button>

                {/* Demo hint */}
                <div className="mt-4 p-3 rounded-xl bg-slate-800/40 border border-slate-700/40">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Demo Credentials</p>
                  <p className="text-[11px] text-slate-400 font-mono">
                    {selectedRole === 'admin' ? 'admin' : 'user'} / aegis2024
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-slate-700 mt-5 font-medium">
          AEGIS RESPONSE · Sistem Evakuasi Tsunami Kota Palu · v1.0.0
        </p>
      </motion.div>
    </div>
  )
}
