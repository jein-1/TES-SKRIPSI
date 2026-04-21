// ═══════════════════════════════════════════════════════════════
// ADMIN LOGIN PAGE — Tactical access only (URL-gated)
// Regular users access directly without login
// ═══════════════════════════════════════════════════════════════
import { useState } from 'react'
import { Shield, Eye, EyeOff, Lock, User, AlertTriangle } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

export type UserRole = 'admin' | 'user'

interface Props {
  onLogin: (role: UserRole, name: string) => void
}

const ADMIN_CREDENTIALS = { username: 'admin', password: 'aegis2024' }

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

export default function LoginPage({ onLogin }: Props) {
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('aegis2024')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = () => {
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
      setLoading(true)
      setTimeout(() => onLogin('admin', username), 900)
    } else {
      setError('Username atau password tidak valid.')
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
      style={{ background: '#060d1a' }}>
      <TacticalGrid />

      {/* Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-64 opacity-20 blur-3xl rounded-full pointer-events-none"
        style={{ background: '#6366f1' }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-sm mx-auto px-5"
      >
        {/* Brand */}
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
            Admin · Tactical Dashboard
          </p>
          <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            <span className="text-[10px] text-indigo-400 font-bold tracking-wider">RESTRICTED ACCESS</span>
          </div>
        </div>

        {/* Card */}
        <div className="p-5 rounded-3xl border border-slate-700/50 shadow-[0_8px_48px_rgba(0,0,0,0.6)]"
          style={{ background: 'rgba(10,16,32,0.96)', backdropFilter: 'blur(16px)' }}>

          <h2 className="text-base font-black text-white mb-1">Akses Administrator</h2>
          <p className="text-[11px] text-slate-500 mb-5">
            Masukkan kredensial admin untuk mengakses Tactical Dashboard.
          </p>

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
                style={{ background: '#060d1a', borderColor: error ? '#ef4444' : '#1e293b' }}
                placeholder="admin"
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
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                className="w-full pl-9 pr-10 py-3 rounded-xl border text-sm text-white font-medium outline-none transition-all"
                style={{ background: '#060d1a', borderColor: error ? '#ef4444' : '#1e293b' }}
                placeholder="••••••••"
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

          {/* Submit */}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full py-3.5 rounded-2xl font-black text-sm tracking-wide text-white flex items-center justify-center gap-2 transition-all disabled:opacity-70"
            style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', boxShadow: '0 4px 24px rgba(99,102,241,0.4)' }}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Memverifikasi...
              </>
            ) : (
              <>
                <Shield className="w-4 h-4" />
                MASUK KE TACTICAL DASHBOARD
              </>
            )}
          </button>

          {/* Demo hint */}
          <div className="mt-4 p-3 rounded-xl bg-slate-800/40 border border-slate-700/40">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Demo Credentials</p>
            <p className="text-[11px] text-slate-400 font-mono">admin / aegis2024</p>
          </div>
        </div>

        <p className="text-center text-[10px] text-slate-700 mt-5 font-medium">
          AEGIS RESPONSE · Admin Portal · Akses Terbatas
        </p>
      </motion.div>
    </div>
  )
}
