// ═══════════════════════════════════════════════════════════════
// AdminProfilePage.tsx — Profil Pengendali & Pengaturan Akun Admin
// ═══════════════════════════════════════════════════════════════
import { useState } from 'react'
import { User, Shield, MapPin, Key, LogOut, CheckCircle, AlertCircle, ChevronLeft } from 'lucide-react'
import { motion } from 'motion/react'
import { updateAdminPin, getRegisteredAdmins } from '../../lib/adminAuthStorage'

interface Props {
  adminName: string
  adminRole: string
  adminProvince: string
  adminCity: string
  onLogout: () => void
  onOpenArchitectRoles?: () => void
  onBack?: () => void
}

export default function AdminProfilePage({
  adminName,
  adminRole,
  adminProvince,
  adminCity,
  onLogout,
  onOpenArchitectRoles,
  onBack
}: Props) {
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [pinMsg, setPinMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isChangingPin, setIsChangingPin] = useState(false)

  const handleSavePin = () => {
    if (!newPin.trim() || newPin.trim().length < 6) {
      setPinMsg({ type: 'error', text: 'PIN baru minimal 6 digit/karakter.' })
      return
    }
    if (newPin !== confirmPin) {
      setPinMsg({ type: 'error', text: 'Konfirmasi PIN tidak cocok.' })
      return
    }

    const admins = getRegisteredAdmins()
    const currentAdmin = admins.find(a => a.role === adminRole)
    if (!currentAdmin) {
      setPinMsg({ type: 'error', text: 'Akun admin tidak ditemukan di penyimpanan lokal.' })
      return
    }

    const success = updateAdminPin(currentAdmin.id, newPin.trim())
    if (success) {
      setPinMsg({ type: 'success', text: 'Password / PIN berhasil diperbarui.' })
      setNewPin('')
      setConfirmPin('')
      setIsChangingPin(false)
    } else {
      setPinMsg({ type: 'error', text: 'Gagal memperbarui PIN.' })
    }
  }

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-300 font-mono flex flex-col pb-24">
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-[#0B0F19]/90 sticky top-0 z-20 backdrop-blur-md">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
              title="Kembali ke Peta"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-white font-black text-xs tracking-wider leading-none">
                PROFIL PENGENDALI
              </h1>
              <span className="text-[8px] text-nerv-orange font-bold uppercase">
                OTORITAS KOMANDO A.T.L.A.S
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 max-w-lg mx-auto w-full space-y-4 pt-4">
        {/* Identitas Box */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0B101D] border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3"
        >
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block mb-0.5">
                NAMA OPERATOR RESMI
              </span>
              <h2 className="text-base font-black text-white">{adminName || 'Pengendali Komando'}</h2>
            </div>
            <div className="px-2.5 py-1 rounded-lg bg-indigo-500/15 border border-indigo-500/40 text-indigo-300 text-xs font-black">
              {adminRole}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[9px] text-slate-500 block mb-0.5 uppercase tracking-wider">
                Yurisdiksi Provinsi
              </span>
              <span className="text-white font-bold flex items-center gap-1">
                <MapPin className="w-3 h-3 text-nerv-orange" />
                {adminProvince || 'Sulawesi Tengah'}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[9px] text-slate-500 block mb-0.5 uppercase tracking-wider">
                Kota / Kabupaten
              </span>
              <span className="text-white font-bold flex items-center gap-1">
                <MapPin className="w-3 h-3 text-emerald-400" />
                {adminCity || 'Kota Palu'}
              </span>
            </div>
          </div>

          <p className="text-[10px] text-slate-400 font-sans leading-snug pt-1">
            Yurisdiksi ini mengunci target siaran resmi darurat agar hanya tertuju ke warga di wilayah wewenang Anda, meskipun perangkat Anda berada di luar daerah.
          </p>
        </motion.div>


        {/* Ganti Password / PIN Akses */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#0B101D] border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-slate-500" />
              KREDENSIAL AKSES ADMIN
            </span>
            <button
              onClick={() => {
                setIsChangingPin(!isChangingPin)
                setPinMsg(null)
              }}
              className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold"
            >
              {isChangingPin ? 'BATAL' : 'UBAH PIN'}
            </button>
          </div>

          {pinMsg && (
            <div className={`p-2 rounded-lg text-xs flex items-center gap-2 ${
              pinMsg.type === 'success' ? 'bg-emerald-950/50 border border-emerald-500/50 text-emerald-300' : 'bg-red-950/50 border border-red-500/50 text-red-300'
            }`}>
              {pinMsg.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{pinMsg.text}</span>
            </div>
          )}

          {isChangingPin ? (
            <div className="space-y-2 pt-1">
              <div>
                <label className="text-[9px] text-slate-500 block mb-1">PIN / Password Baru:</label>
                <input
                  type="password"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="Minimal 4 karakter"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-[9px] text-slate-500 block mb-1">Konfirmasi PIN Baru:</label>
                <input
                  type="password"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                  placeholder="Ulangi PIN baru"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white outline-none focus:border-indigo-500"
                />
              </div>
              <button
                onClick={handleSavePin}
                className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white text-xs font-bold transition-all mt-1"
              >
                SIMPAN KREDENSIAL BARU
              </button>
            </div>
          ) : (
            <p className="text-[10px] text-slate-500 font-sans leading-relaxed">
              Kredensial disimpan terenkripsi di terminal ini. Pastikan tidak memberitahukan kode PIN Anda kepada pihak yang tidak berkepentingan.
            </p>
          )}
        </motion.div>

        {/* Tombol Logout Sekali Tekan */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="pt-2"
        >
          <button
            onClick={onLogout}
            className="w-full py-3.5 px-4 rounded-2xl bg-red-600 hover:bg-red-500 active:scale-[0.98] text-white text-xs font-black tracking-wider transition-all shadow-[0_4px_20px_rgba(239,68,68,0.25)] flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>KELUAR DARI KONSOL KOMANDO (LOGOUT)</span>
          </button>
          <p className="text-[9px] text-slate-500 text-center mt-2 font-sans">
            Satu kali tekan tombol merah di atas akan langsung mengakhiri sesi komando seketika.
          </p>
        </motion.div>
      </div>
    </div>
  )
}
