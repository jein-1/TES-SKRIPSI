// ═══════════════════════════════════════════════════════════════
// PROFILE MODAL — A.T.L.A.S Terminal Identity & Profile Settings
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Shield, Smartphone, Monitor, User, Globe, AlertOctagon,
  X, Check, Lock, RefreshCw, Cpu, CreditCard, Copy
} from 'lucide-react'
import { useLanguage } from '../../lib/i18n'
import { fetchClientIp } from '../../lib/geocode'

interface Props {
  isOpen: boolean
  onClose: () => void
  userName: string | null
  userNik?: string | null
  terminalId: string
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

export default function ProfileModal({ isOpen, onClose, userName, userNik, terminalId }: Props) {
  const { lang, setLanguage, t } = useLanguage()
  const [{ device, mobile, browser }] = useState(detectDevice)
  const [clientIp, setClientIp] = useState<string>('Mendeteksi IP...')
  const [showConfirmReset, setShowConfirmReset] = useState(false)
  const [copiedField, setCopiedField] = useState<'name' | 'nik' | null>(null)
  
  // Developer Node-01 Authentication State
  const [isNode01, setIsNode01] = useState(() => {
    return localStorage.getItem('atlas_is_node_01') === 'true' || 
           (terminalId && (terminalId.includes('01') || terminalId.toUpperCase().includes('NODE-01')))
  })
  const [showClaimPin, setShowClaimPin] = useState(false)
  const [claimPin, setClaimPin] = useState('')
  const [pinError, setPinError] = useState(false)

  const handleClaimNode01 = () => {
    const clean = claimPin.trim()
    if (clean === '0101' || clean === '7271' || clean === '1945') {
      localStorage.setItem('atlas_is_node_01', 'true')
      localStorage.setItem('atlasTerminalId', 'NODE-01')
      localStorage.setItem('aegisTerminalId', 'NODE-01')
      setIsNode01(true)
      setShowClaimPin(false)
      setPinError(false)
      window.location.reload()
    } else {
      setPinError(true)
    }
  }

  useEffect(() => {
    let active = true
    fetchClientIp().then((ip) => {
      if (active) setClientIp(ip)
    })
    return () => { active = false }
  }, [])

  const handleCopy = (text: string, field: 'name' | 'nik') => {
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => {
      setCopiedField((curr) => (curr === field ? null : curr))
    }, 2000)
  }

  const handleResetDevice = () => {
    try {
      localStorage.clear()
      sessionStorage.clear()
      window.location.reload()
    } catch {
      window.location.reload()
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[2500] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          className="w-full max-w-md rounded-xl border border-nerv-border bg-nerv-card shadow-2xl p-5 relative overflow-hidden"
        >
          {/* Top Decorative Header */}
          <div className="flex items-center justify-between pb-3 border-b border-nerv-border mb-4">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-nerv-cyan shadow-[0_0_8px_rgba(0,229,255,0.8)] animate-pulse" />
              <div>
                <span className="text-[9px] font-mono font-bold tracking-widest text-nerv-cyan uppercase block leading-none">
                  A.T.L.A.S // TERMINAL PROFILE
                </span>
                <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider mt-0.5">
                  {lang === 'id' ? 'PENGATURAN IDENTITAS TERMINAL' : 'TERMINAL IDENTITY SETTINGS'}
                </h3>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded bg-black/60 border border-nerv-border flex items-center justify-center hover:border-nerv-orange text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4 font-mono">
            {/* Terminal ID & Node Status */}
            <div className="p-3 rounded-lg bg-black/60 border border-nerv-border space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[9px] text-slate-500 uppercase block font-mono">
                    {lang === 'id' ? 'IDENTITAS NODE' : 'NODE IDENTITY'}
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-xs font-black tracking-wider ${
                      isNode01 ? 'text-amber-400 font-mono' : 'text-nerv-cyan font-mono'
                    }`}>
                      {isNode01 
                        ? (lang === 'id' ? 'NODE-01 // KOMANDO' : 'NODE-01 // COMMAND') 
                        : (lang === 'id' 
                            ? `NODE-P // WARGA #${terminalId ? (terminalId.startsWith('NODE-P') ? terminalId.replace('NODE-P', '') : terminalId.slice(-4).toUpperCase()) : '001'}` 
                            : `NODE-P // CITIZEN #${terminalId ? (terminalId.startsWith('NODE-P') ? terminalId.replace('NODE-P', '') : terminalId.slice(-4).toUpperCase()) : '001'}`)}
                    </span>
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase font-mono ${
                      isNode01 
                        ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300'
                        : 'bg-nerv-cyan/20 border border-nerv-cyan/40 text-nerv-cyan'
                    }`}>
                      {isNode01 
                        ? (lang === 'id' ? 'OPERATOR KOMANDO' : 'COMMAND OPERATOR')
                        : (lang === 'id' ? 'TERDAFTAR RESMI' : 'OFFICIALLY REGISTERED')}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[9px] text-slate-500 uppercase block">STATUS</span>
                  <span className="text-[10px] font-bold text-nerv-green inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-nerv-green animate-ping inline-block" />
                    AUTHENTICATED
                  </span>
                </div>
              </div>

              {/* Node-01 Verification (for command device setup) */}
              {!isNode01 && (
                <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[9px] text-slate-500">
                    {lang === 'id' ? 'Pindah perangkat dinas?' : 'Transferred command device?'}
                  </span>
                  {!showClaimPin ? (
                    <button
                      type="button"
                      onClick={() => setShowClaimPin(true)}
                      className="text-[9px] font-mono text-nerv-orange hover:underline font-bold"
                    >
                      {lang === 'id' ? '[ Verifikasi Node-01 ]' : '[ Verify Node-01 ]'}
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="password"
                        maxLength={6}
                        placeholder="PIN"
                        value={claimPin}
                        onChange={(e) => setClaimPin(e.target.value)}
                        className="w-16 px-1.5 py-0.5 text-xs bg-black border border-nerv-border rounded text-center text-white font-mono outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleClaimNode01}
                        className="px-2 py-0.5 text-[9px] bg-nerv-orange text-black font-bold rounded uppercase hover:brightness-110"
                      >
                        OK
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowClaimPin(false); setPinError(false); }}
                        className="px-1 text-[9px] text-slate-400"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              )}
              {pinError && (
                <p className="text-[9px] text-red-400 font-sans">
                  {lang === 'id' ? 'PIN Komando tidak valid.' : 'Invalid Command PIN.'}
                </p>
              )}
            </div>

            {/* Locked User Identity */}
            <div className="p-3 rounded-lg bg-black/40 border border-nerv-border relative">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[9px] text-slate-400 uppercase font-bold flex items-center gap-1 font-mono">
                  <User className="w-3 h-3 text-nerv-orange" />
                  {lang === 'id' ? 'NAMA LENGKAP TERDAFTAR' : 'REGISTERED FULL NAME'}
                </span>
                <div className="flex items-center gap-1.5">
                  {copiedField === 'name' && (
                    <span className="text-[8px] bg-nerv-green/20 border border-nerv-green/50 text-nerv-green px-1.5 py-0.5 rounded animate-pulse">
                      {lang === 'id' ? 'Tersalin!' : 'Copied!'}
                    </span>
                  )}
                  <span className="text-[8px] bg-nerv-orange/20 border border-nerv-orange/50 text-nerv-orange px-2 py-0.5 rounded flex items-center gap-1 font-mono">
                    <Lock className="w-2.5 h-2.5" />
                    TERKUNCI
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="text-base font-bold text-white tracking-wide truncate font-mono select-text cursor-text">
                  {userName || 'PERSONEL ATLAS'}
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(userName || 'PERSONEL ATLAS', 'name')}
                  title={lang === 'id' ? 'Salin Nama' : 'Copy Name'}
                  className="p-1.5 rounded bg-black/60 border border-nerv-border hover:border-nerv-orange text-slate-400 hover:text-white transition-colors shrink-0"
                >
                  {copiedField === 'name' ? (
                    <Check className="w-3.5 h-3.5 text-nerv-green" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Locked NIK / Passport ID */}
            <div className="p-3 rounded-lg bg-black/40 border border-nerv-border relative">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[9px] text-slate-400 uppercase font-bold flex items-center gap-1 font-mono">
                  <CreditCard className="w-3 h-3 text-nerv-cyan" />
                  {lang === 'id' ? 'NOMOR IDENTITAS RESMI (NIK / PASPOR)' : 'OFFICIAL IDENTITY NUMBER (ID / PASSPORT)'}
                </span>
                <div className="flex items-center gap-1.5">
                  {copiedField === 'nik' && (
                    <span className="text-[8px] bg-nerv-green/20 border border-nerv-green/50 text-nerv-green px-1.5 py-0.5 rounded animate-pulse">
                      {lang === 'id' ? 'Tersalin!' : 'Copied!'}
                    </span>
                  )}
                  <span className="text-[8px] bg-nerv-cyan/20 border border-nerv-cyan/50 text-nerv-cyan px-2 py-0.5 rounded flex items-center gap-1 font-mono">
                    VERIFIED
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-bold text-nerv-cyan tracking-widest font-mono select-text cursor-text">
                  {userNik || '72710XXXXXXXXXXX'}
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(userNik || '72710XXXXXXXXXXX', 'nik')}
                  title={lang === 'id' ? 'Salin Nomor Identitas' : 'Copy Identity Number'}
                  className="p-1.5 rounded bg-black/60 border border-nerv-border hover:border-nerv-cyan text-slate-400 hover:text-white transition-colors shrink-0"
                >
                  {copiedField === 'nik' ? (
                    <Check className="w-3.5 h-3.5 text-nerv-green" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
              <p className="text-[10px] text-slate-500 font-sans mt-1.5">
                {lang === 'id'
                  ? 'Identitas resmi terkunci permanen pada perangkat ini untuk validasi koordinasi evakuasi SAR.'
                  : 'Official ID is locked permanently to this device for SAR evacuation coordination.'}
              </p>
            </div>

            {/* Hardware & Network Telemetry */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-black/40 border border-nerv-border">
                <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                  {mobile ? <Smartphone className="w-3.5 h-3.5 text-nerv-cyan" /> : <Monitor className="w-3.5 h-3.5 text-nerv-cyan" />}
                  <span className="text-[8px] uppercase tracking-wider">PERANGKAT FISIK</span>
                </div>
                <div className="font-bold text-white text-[11px] truncate">
                  {device} · {browser}
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-black/40 border border-nerv-border">
                <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                  <Cpu className="w-3.5 h-3.5 text-nerv-green" />
                  <span className="text-[8px] uppercase tracking-wider">IP PUBLIK AKTIF</span>
                </div>
                <div className="font-bold text-nerv-green text-[11px] truncate font-mono">
                  {clientIp}
                </div>
              </div>
            </div>


            {/* Danger Zone: Reset Device */}
            <div className="pt-2 border-t border-nerv-border">
              {!showConfirmReset ? (
                <button
                  type="button"
                  onClick={() => setShowConfirmReset(true)}
                  className="w-full py-2.5 px-3 rounded-lg bg-nerv-red/10 border border-nerv-red/40 hover:bg-nerv-red/20 text-nerv-red text-[11px] font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <AlertOctagon className="w-3.5 h-3.5" />
                  {lang === 'id' ? 'RESET DATA PERANGKAT (UNINSTALL / GANTI IDENTITAS)' : 'RESET DEVICE (UNINSTALL / RE-REGISTER)'}
                </button>
              ) : (
                <div className="p-3 rounded-lg bg-nerv-red/20 border border-nerv-red text-center space-y-2">
                  <p className="text-[11px] text-nerv-red font-bold font-sans">
                    {lang === 'id'
                      ? 'PERINGATAN: Seluruh data sesi dan registrasi akan dihapus dari browser ini. Anda harus mendaftar ulang. Lanjutkan?'
                      : 'WARNING: All session and registration data will be erased. You will need to re-register. Continue?'}
                  </p>
                  <div className="flex items-center gap-2 justify-center">
                    <button
                      type="button"
                      onClick={handleResetDevice}
                      className="px-4 py-1.5 rounded bg-nerv-red text-black font-black text-xs uppercase tracking-wider hover:brightness-110"
                    >
                      {lang === 'id' ? 'YA, RESET TOTAL' : 'YES, HARD RESET'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowConfirmReset(false)}
                      className="px-3 py-1.5 rounded bg-black/60 border border-nerv-border text-slate-300 text-xs"
                    >
                      {lang === 'id' ? 'BATAL' : 'CANCEL'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
