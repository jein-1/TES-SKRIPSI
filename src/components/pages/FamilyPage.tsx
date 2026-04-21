// ═══════════════════════════════════════════════════════════════
// FAMILY PAGE — Family Circle with QR Code & Camera Scanner
// localStorage-based, empty initial state, full CRUD
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect, useRef, useCallback } from 'react'
import { Radio, UserPlus, Phone, AlertTriangle, CheckCircle, Clock, Wifi, ChevronLeft, QrCode, Camera, X, Edit2, Trash2, Share2 } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import QRCode from 'qrcode'
import type { FamilyMember } from '../../types'

// ── Get/create user's Aegis ID ────────────────────────────────
function getMyAegisId(): string {
  let id = localStorage.getItem('aegisId')
  if (!id) {
    id = `AEGIS-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`
    localStorage.setItem('aegisId', id)
  }
  return id
}

function getMyName(): string {
  return localStorage.getItem('aegisUserName') ?? 'Pengguna'
}

// ── Load/save family from localStorage ────────────────────────
function loadFamily(): FamilyMember[] {
  try { return JSON.parse(localStorage.getItem('aegisFamily') ?? '[]') } catch { return [] }
}
function saveFamily(members: FamilyMember[]) {
  localStorage.setItem('aegisFamily', JSON.stringify(members))
}

// ── Status chip ───────────────────────────────────────────────
function StatusChip({ status }: { status: FamilyMember['status'] }) {
  if (status === 'safe') return (
    <div className="flex items-center gap-1.5">
      <CheckCircle className="w-3.5 h-3.5 text-emerald-400"/>
      <span className="text-xs font-black text-emerald-400">STATUS: SAFE</span>
    </div>
  )
  if (status === 'danger') return (
    <div className="flex items-center gap-1.5">
      <AlertTriangle className="w-3.5 h-3.5 text-red-400 animate-pulse"/>
      <span className="text-xs font-black text-red-400">STATUS: IN DANGER</span>
    </div>
  )
  return (
    <div className="flex items-center gap-1.5">
      <Clock className="w-3.5 h-3.5 text-slate-400"/>
      <span className="text-xs font-black text-slate-400">STATUS: UNKNOWN</span>
    </div>
  )
}

// ── QR Code Modal ─────────────────────────────────────────────
function MyQRModal({ onClose }: { onClose: () => void }) {
  const aegisId = getMyAegisId()
  const myName = getMyName()
  const [qrDataUrl, setQrDataUrl] = useState('')
  const qrPayload = JSON.stringify({ aegisId, name: myName, type: 'aegis-family-invite' })

  useEffect(() => {
    QRCode.toDataURL(qrPayload, {
      width: 220, margin: 2,
      color: { dark: '#ffffff', light: '#0f1a2e' }
    }).then(setQrDataUrl).catch(console.error)
  }, [qrPayload])

  const share = async () => {
    if (navigator.share) {
      await navigator.share({ title: 'Aegis Family Invite', text: `Tambahkan saya ke grup Family Aegis: ${aegisId}`, url: window.location.href })
    } else {
      await navigator.clipboard.writeText(qrPayload)
      alert('ID disalin ke clipboard!')
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 p-6 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-xs p-6 rounded-3xl border border-slate-700/50 relative"
        style={{ background: '#0f1a2e' }}>
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center">
          <X className="w-4 h-4 text-slate-400"/>
        </button>
        <div className="text-center">
          <p className="text-[10px] text-indigo-400 uppercase tracking-widest font-bold mb-1">QR Code Saya</p>
          <p className="text-lg font-black text-white mb-4">{myName}</p>
          {qrDataUrl
            ? <img src={qrDataUrl} alt="QR Code" className="mx-auto rounded-2xl w-48 h-48"/>
            : <div className="mx-auto w-48 h-48 rounded-2xl bg-slate-800 flex items-center justify-center"><QrCode className="w-12 h-12 text-slate-600"/></div>
          }
          <p className="text-[10px] text-slate-500 mt-3 font-mono break-all">{aegisId}</p>
          <p className="text-[11px] text-slate-400 mt-2">Minta anggota keluarga scan QR ini untuk bergabung ke grup Family Anda.</p>
          <button onClick={share}
            className="mt-4 w-full py-3 rounded-2xl bg-indigo-600 text-white font-black text-sm flex items-center justify-center gap-2">
            <Share2 className="w-4 h-4"/> Bagikan ID
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Add Member Modal (manual or camera scan) ──────────────────
function AddMemberModal({ onClose, onAdd }: { onClose: () => void; onAdd: (m: FamilyMember) => void }) {
  const [mode, setMode] = useState<'form' | 'camera'>('form')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [scanning, setScanning] = useState(false)
  const [camError, setCamError] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number>(0)

  const handleAdd = () => {
    if (!name.trim()) return
    const member: FamilyMember = {
      id: `F${Date.now()}`,
      name: name.trim(),
      role: description.trim() || 'Anggota',
      initials: name.trim().split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase(),
      status: 'unknown',
      location: 'Lokasi tidak diketahui',
      updatedAgo: 'baru saja',
    }
    onAdd(member)
    onClose()
  }

  const startCamera = async () => {
    setCamError('')
    setScanning(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        scanLoop()
      }
    } catch {
      setCamError('Izin kamera ditolak. Tambahkan anggota secara manual.')
      setScanning(false)
    }
  }

  const scanLoop = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(scanLoop); return
    }
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    ctx.drawImage(video, 0, 0)
    // Dynamic import jsQR if available
    import('jsqr').then(({ default: jsQR }) => {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const code = jsQR(imageData.data, imageData.width, imageData.height)
      if (code) {
        try {
          const data = JSON.parse(code.data)
          if (data.type === 'aegis-family-invite' && data.name && data.aegisId) {
            stopCamera()
            const member: FamilyMember = {
              id: data.aegisId,
              name: data.name,
              role: 'Anggota Keluarga',
              initials: data.name.split(' ').map((w: string) => w[0]).join('').slice(0,2).toUpperCase(),
              status: 'safe',
              location: 'Terdeteksi via QR',
              updatedAgo: 'baru saja',
            }
            onAdd(member)
            onClose()
            return
          }
        } catch {}
      }
      rafRef.current = requestAnimationFrame(scanLoop)
    }).catch(() => { rafRef.current = requestAnimationFrame(scanLoop) })
  }

  const stopCamera = () => {
    cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setScanning(false)
  }

  useEffect(() => () => { stopCamera() }, [])

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[2000] flex items-end justify-center bg-black/80 backdrop-blur-sm">
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full max-w-sm rounded-t-3xl border border-slate-700/50 p-5"
        style={{ background: '#0f1a2e' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-black text-white">Tambah Anggota</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center">
            <X className="w-4 h-4 text-slate-400"/>
          </button>
        </div>

        {/* Mode toggle */}
        <div className="flex gap-2 mb-4 p-1 rounded-xl bg-slate-800/60 border border-slate-700/40">
          {([['form','✏️ Manual'], ['camera','📷 Scan QR']] as const).map(([m, label]) => (
            <button key={m} onClick={() => { setMode(m); if (m === 'form') stopCamera() }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${mode === m ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>
              {label}
            </button>
          ))}
        </div>

        {mode === 'form' ? (
          <div className="space-y-3">
            <div>
              <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1 block">Nama Lengkap *</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Ahmad Yusuf"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-white text-sm outline-none focus:border-indigo-500"/>
            </div>
            <div>
              <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1 block">Deskripsi / Hubungan</label>
              <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Misal: Ayah, Ibu, Kakak..."
                className="w-full px-3 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-white text-sm outline-none focus:border-indigo-500"/>
            </div>
            <button onClick={handleAdd} disabled={!name.trim()}
              className="w-full py-3 rounded-2xl bg-indigo-600 disabled:opacity-50 text-white font-black text-sm">
              Tambahkan ke Family
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {camError && <p className="text-red-400 text-[11px] text-center">{camError}</p>}
            <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-slate-900 border border-slate-700/40">
              <video ref={videoRef} className="w-full h-full object-cover" playsInline muted/>
              <canvas ref={canvasRef} className="hidden"/>
              {!scanning && !camError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <Camera className="w-12 h-12 text-slate-600"/>
                  <p className="text-slate-400 text-sm">Kamera belum aktif</p>
                </div>
              )}
              {scanning && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-40 h-40 border-2 border-indigo-400/60 rounded-xl"/>
                  <div className="absolute w-40 border-t-2 border-indigo-400 animate-bounce"/>
                </div>
              )}
            </div>
            {!scanning
              ? <button onClick={startCamera} className="w-full py-3 rounded-2xl bg-indigo-600 text-white font-black text-sm flex items-center justify-center gap-2"><Camera className="w-4 h-4"/> Buka Kamera</button>
              : <button onClick={stopCamera} className="w-full py-3 rounded-2xl bg-slate-700 text-white font-bold text-sm">Batal Scan</button>
            }
            <p className="text-center text-[11px] text-slate-500">Arahkan kamera ke QR Code milik anggota keluarga</p>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

// ── Edit Member Modal ─────────────────────────────────────────
function EditMemberModal({ member, onClose, onSave }: {
  member: FamilyMember; onClose: () => void; onSave: (m: FamilyMember) => void
}) {
  const [description, setDescription] = useState(member.role)
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[2000] flex items-end justify-center bg-black/80 backdrop-blur-sm">
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full max-w-sm rounded-t-3xl border border-slate-700/50 p-5"
        style={{ background: '#0f1a2e' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-black text-white">Edit {member.name}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center">
            <X className="w-4 h-4 text-slate-400"/>
          </button>
        </div>
        <p className="text-[11px] text-slate-500 mb-3">Hanya deskripsi/hubungan yang bisa diubah. Nama ditentukan oleh pemilik akun.</p>
        <div className="mb-4">
          <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1 block">Deskripsi / Hubungan</label>
          <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Misal: Ayah, Ibu, Kakak..."
            className="w-full px-3 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-white text-sm outline-none focus:border-indigo-500"/>
        </div>
        <button onClick={() => { onSave({ ...member, role: description }); onClose() }}
          className="w-full py-3 rounded-2xl bg-indigo-600 text-white font-black text-sm">Simpan</button>
      </motion.div>
    </motion.div>
  )
}

// ── Main FamilyPage ──────────────────────────────────────────
interface Props { onBack?: () => void }

export default function FamilyPage({ onBack }: Props) {
  const [members, setMembers] = useState<FamilyMember[]>(loadFamily)
  const [pinging, setPinging] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [editMember, setEditMember] = useState<FamilyMember | null>(null)

  const save = useCallback((m: FamilyMember[]) => { setMembers(m); saveFamily(m) }, [])

  const handleAdd = (m: FamilyMember) => save([...members, m])
  const handleEdit = (updated: FamilyMember) => save(members.map(m => m.id === updated.id ? updated : m))
  const handleDelete = (id: string) => { if (confirm('Hapus anggota ini?')) save(members.filter(m => m.id !== id)) }

  const handlePingAll = () => {
    setPinging(true)
    if ('vibrate' in navigator) navigator.vibrate([100, 50, 100, 50, 100])
    setTimeout(() => setPinging(false), 2500)
  }

  return (
    <>
    <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }} transition={{ duration: 0.22 }}
      className="fixed inset-0 z-[1800] flex flex-col overflow-y-auto custom-scrollbar"
      style={{ background: '#080e1a' }}>

      {/* Header */}
      <div className="shrink-0 px-4 pt-4 pb-3 border-b border-slate-800/60 flex items-center gap-3" style={{ background: '#0a1020' }}>
        {onBack && (
          <button onClick={onBack} className="w-8 h-8 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center shrink-0">
            <ChevronLeft className="w-4 h-4 text-slate-400"/>
          </button>
        )}
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-black text-white leading-tight">Family Circle</h2>
          <p className="text-[10px] text-slate-400">
            {members.length > 0
              ? <><span className="text-emerald-400 font-bold">{members.length} anggota</span> terhubung</>
              : 'Belum ada anggota — tambahkan keluarga Anda'
            }
          </p>
        </div>
        {/* My QR button */}
        <button onClick={() => setShowQR(true)}
          className="shrink-0 w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
          <QrCode className="w-4 h-4 text-indigo-400"/>
        </button>
      </div>

      <div className="flex-1 px-4 py-4 space-y-4">

        {/* PING ALL */}
        {members.length > 0 && (
          <motion.button whileTap={{ scale: 0.97 }} onClick={handlePingAll}
            className={`w-full py-4 rounded-2xl font-black text-sm tracking-wide flex items-center justify-center gap-2 border ${
              pinging ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300' : 'bg-indigo-600 border-indigo-500/50 text-white shadow-[0_4px_20px_rgba(99,102,241,0.4)]'
            }`}>
            <Radio className={`w-4 h-4 ${pinging ? 'animate-pulse' : ''}`}/>
            {pinging ? 'MENGIRIM PING...' : 'PING ALL MEMBERS'}
          </motion.button>
        )}

        {/* Empty state */}
        {members.length === 0 && (
          <div className="py-12 text-center">
            <div className="w-20 h-20 rounded-2xl bg-slate-800/60 border border-slate-700/40 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">👨‍👩‍👧‍👦</span>
            </div>
            <h3 className="text-white font-black mb-2">Grup Family Kosong</h3>
            <p className="text-slate-500 text-sm">Tambahkan anggota keluarga agar Anda bisa memantau status keselamatan mereka secara real-time.</p>
          </div>
        )}

        {/* Member cards */}
        <div className="space-y-3">
          {members.map((member, idx) => {
            const isDanger = member.status === 'danger'
            return (
              <motion.div key={member.id}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.06 }}
                className={`p-4 rounded-2xl border ${isDanger ? 'border-red-500/40' : 'border-slate-700/40'}`}
                style={{ background: isDanger ? '#150808' : '#0f1a2e' }}>
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white text-base border shrink-0 ${
                    isDanger ? 'bg-red-600/30 border-red-500/50' : 'bg-indigo-600/30 border-indigo-500/40'}`}>
                    {member.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white leading-tight">{member.name}</p>
                    <p className="text-[10px] text-slate-500">{member.role}</p>
                    <div className="mt-1"><StatusChip status={member.status}/></div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {isDanger && <button className="p-1.5 rounded-lg bg-red-600 text-white"><Phone className="w-3 h-3"/></button>}
                    <button onClick={() => setEditMember(member)} className="p-1.5 rounded-lg bg-slate-700/60 text-slate-400 hover:text-white">
                      <Edit2 className="w-3 h-3"/>
                    </button>
                    <button onClick={() => handleDelete(member.id)} className="p-1.5 rounded-lg bg-slate-700/60 text-slate-400 hover:text-red-400">
                      <Trash2 className="w-3 h-3"/>
                    </button>
                  </div>
                </div>
                {member.alertLabel && (
                  <div className="mt-3 p-2 rounded-xl bg-red-900/30 border border-red-700/40">
                    <p className="text-[10px] text-red-400 font-bold">{member.alertLabel}</p>
                  </div>
                )}
                <div className="flex items-center justify-between mt-2.5">
                  <p className="text-[11px] text-slate-400">{member.location}</p>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-500"/>
                    <span className="text-[10px] text-slate-500">{member.updatedAgo}</span>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Network Health — show only if members exist */}
        {members.length > 0 && (
          <div className="p-4 rounded-2xl border border-slate-700/40" style={{ background: '#0f1a2e' }}>
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-0.5">Network Health</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-white">98.4%</span>
                  <span className="text-sm text-emerald-400 font-bold">Uptime</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                <Wifi className="w-5 h-5 text-emerald-400"/>
              </div>
            </div>
            <div className="space-y-1.5">
              {[`${members.length}/${members.length} Tags Connected`, 'All Devices > 60%', 'E2E Encryption Active'].map((t, i) => (
                <div key={i} className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0"/>
                  <span className="text-[11px] text-slate-300">{t}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add Member button */}
        <button onClick={() => setShowAdd(true)}
          className="w-full p-4 rounded-2xl border border-slate-700/40 border-dashed flex items-center justify-center gap-2 text-slate-400 hover:text-white hover:border-slate-600 transition-colors">
          <UserPlus className="w-5 h-5"/>
          <span className="text-sm font-bold">Tambah Anggota</span>
        </button>

        <div className="h-20"/>
      </div>
    </motion.div>

    {/* Modals */}
    <AnimatePresence>
      {showQR && <MyQRModal onClose={() => setShowQR(false)}/>}
      {showAdd && <AddMemberModal onClose={() => setShowAdd(false)} onAdd={handleAdd}/>}
      {editMember && <EditMemberModal member={editMember} onClose={() => setEditMember(null)} onSave={handleEdit}/>}
    </AnimatePresence>
    </>
  )
}
