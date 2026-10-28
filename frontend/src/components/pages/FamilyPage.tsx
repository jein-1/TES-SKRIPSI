// ═══════════════════════════════════════════════════════════════
// FAMILY PAGE — A.T.L.A.S Tactical Personnel Directory & Location Telemetry
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect, useRef, useCallback } from 'react'
import {
  UserPlus, AlertTriangle, CheckCircle, Clock, ChevronLeft,
  QrCode, Camera, X, Trash2, Share2, Radio, MapPin, Navigation2, Shield
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { Map, MapMarker, MarkerContent } from '@/components/ui/map'
import QRCode from 'qrcode'
import { Geolocation } from '@capacitor/geolocation'
import { useAegisSync, aegisApi } from '../../lib/useAegisSync'
import { supabase } from '../../lib/supabaseClient'
import { useLanguage } from '../../lib/i18n'
import type { FamilyMember } from '../../types'

// ── Storage helpers ────────────────────────────────────────────
export function getMyAegisId(): string {
  const isNode01 = localStorage.getItem('atlas_is_node_01') === 'true'
  if (isNode01) return 'ARCHITECT 01'

  const isWna = localStorage.getItem('atlas_is_wna') === 'true'
  const terminalId = localStorage.getItem('atlasTerminalId') || localStorage.getItem('aegisTerminalId')
  if (terminalId) {
    if (terminalId === 'NODE-01' || terminalId.includes('ARCHITECT')) return 'ARCHITECT 01'
    if (terminalId.includes('COMMAND')) return terminalId
    if (terminalId === 'FOREIGN CITIZEN' || isWna) return 'FOREIGN CITIZEN'
    return 'CITIZEN'
  }

  let id = localStorage.getItem('atlasId') || localStorage.getItem('aegisId')
  if (id) {
    if (id === 'NODE-01' || id.includes('ARCHITECT')) return 'ARCHITECT 01'
    if (id.includes('COMMAND')) return id
    if (id === 'FOREIGN CITIZEN' || isWna) return 'FOREIGN CITIZEN'
    return 'CITIZEN'
  }
  return isWna ? 'FOREIGN CITIZEN' : 'CITIZEN'
}

export function getMyName(): string {
  return localStorage.getItem('atlasUserName') ?? localStorage.getItem('aegisUserName') ?? 'Personnel-01'
}

export function getMyNik(): string {
  return localStorage.getItem('atlasUserNik') ?? localStorage.getItem('aegisUserNik') ?? ''
}

export function formatLastSeen(m: FamilyMember, locTs?: number): string {
  if (m.status === 'danger') return 'DARURAT! BUTUH BANTUAN'
  if (m.status === 'waiting') return 'menunggu respon...'
  const ts = locTs || m.lastSeenTs
  if (!ts) return m.updatedAgo || 'baru saja'
  const diffSec = Math.floor((Date.now() - ts) / 1000)
  if (diffSec < 60) return 'baru saja'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin} mnt lalu`
  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) return `${diffHours} jam lalu`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays} hari lalu`
}

export function loadFamily(): FamilyMember[] {
  try {
    return JSON.parse(localStorage.getItem('aegisFamily') ?? '[]')
  } catch {
    return []
  }
}

export function saveFamily(m: FamilyMember[]) {
  localStorage.setItem('aegisFamily', JSON.stringify(m))
}

function loadMemberLocs(): Record<string, { lat: number; lng: number; ts: number }> {
  try {
    return JSON.parse(localStorage.getItem('aegisMemberLocs') ?? '{}')
  } catch {
    return {}
  }
}

function saveMemberLoc(id: string, lat: number, lng: number) {
  const locs = loadMemberLocs()
  locs[id] = { lat, lng, ts: Date.now() }
  localStorage.setItem('aegisMemberLocs', JSON.stringify(locs))
}

// ── A.T.L.A.S Status chip ───────────────────────────────────────────
function StatusChip({ status }: { status: FamilyMember['status'] }) {
  const { lang } = useLanguage()
  if (status === 'safe') {
    return (
      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-nerv-green/10 border border-nerv-green/30">
        <CheckCircle className="w-3 h-3 text-nerv-green" />
        <span className="text-[9px] font-mono font-bold tracking-wider text-nerv-green uppercase">
          {lang === 'id' ? 'SECURE // AMAN ✓' : 'SECURE // SAFE ✓'}
        </span>
      </div>
    )
  }
  if (status === 'danger') {
    return (
      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-nerv-red/10 border border-nerv-red/50 animate-pulse">
        <AlertTriangle className="w-3 h-3 text-nerv-red" />
        <span className="text-[9px] font-mono font-bold tracking-wider text-nerv-red uppercase">
          {lang === 'id' ? 'HAZARD // BUTUH BANTUAN ⚠️' : 'HAZARD // NEED ASSISTANCE ⚠️'}
        </span>
      </div>
    )
  }
  if (status === 'waiting') {
    return (
      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-yellow-500/10 border border-yellow-500/40 animate-pulse">
        <Radio className="w-3 h-3 text-yellow-400 animate-spin" />
        <span className="text-[9px] font-mono font-bold tracking-wider text-yellow-400 uppercase">
          {lang === 'id' ? 'WAITING // MENUNGGU RESPON...' : 'WAITING // AWAITING RESPONSE...'}
        </span>
      </div>
    )
  }
  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/40 border border-nerv-border">
      <Clock className="w-3 h-3 text-slate-500" />
      <span className="text-[9px] font-mono font-bold tracking-wider text-slate-400 uppercase">
        {lang === 'id' ? 'STANDBY // MENUNGGU' : 'STANDBY // IDLE'}
      </span>
    </div>
  )
}

// ── Member Location Map Modal ─────────────────────────────────
function MemberMapModal({ member, onClose }: { member: FamilyMember; onClose: () => void }) {
  const locs = loadMemberLocs()
  const loc = locs[member.id]
  const PALU: [number, number] = [-0.8917, 119.8577]
  const center: [number, number] = loc ? [loc.lat, loc.lng] : PALU

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.95, y: 15 }} animate={{ scale: 1, y: 0 }}
        className="w-full max-w-sm rounded-lg border border-nerv-border overflow-hidden bg-nerv-card shadow-2xl"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-nerv-border bg-[#0B0F19]">
          <div>
            <p className="text-[9px] font-mono font-bold text-nerv-cyan uppercase tracking-widest">
              A.T.L.A.S // MEMBER TELEMETRY
            </p>
            <p className="text-sm font-mono font-bold text-white truncate">{member.name}</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded bg-black/60 border border-nerv-border flex items-center justify-center hover:border-nerv-orange transition-colors"
          >
            <X className="w-4 h-4 text-slate-300" />
          </button>
        </div>

        <div className="h-64 relative bg-[#07090E]">
          <Map
            viewport={{
              center: [center[1], center[0]],
              zoom: loc ? 15 : 12
            }}
            interactive={true}
          >
            {loc && (
              <MapMarker longitude={loc.lng} latitude={loc.lat}>
                <MarkerContent>
                  <div className="flex flex-col items-center gap-1 pointer-events-none">
                    <div className="w-3.5 h-3.5 rounded-full bg-nerv-cyan border-2 border-white shadow-[0_0_12px_rgba(0,229,255,0.9)] animate-pulse" />
                    <span className="bg-[#07090E] border border-nerv-border text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded whitespace-nowrap shadow-md">
                      {member.name}
                    </span>
                  </div>
                </MarkerContent>
              </MapMarker>
            )}
          </Map>

          {!loc && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#07090E]/90 pointer-events-none z-10 px-4 text-center">
              <MapPin className="w-7 h-7 text-slate-500 mb-2 animate-bounce" />
              <p className="text-white text-xs font-mono font-bold">TELEMETRI LOKASI BELUM TERSEDIA</p>
              <p className="text-slate-500 text-[10px] font-mono mt-1">Personel belum mengirim koordinat GPS</p>
            </div>
          )}
        </div>

        {loc && (
          <div className="px-4 py-3 border-t border-nerv-border bg-[#0B0F19] flex items-center justify-between font-mono text-[10px]">
            <div>
              <span className="text-slate-500 block uppercase text-[8px]">COORDINATES</span>
              <span className="text-nerv-cyan font-bold">{loc.lat.toFixed(5)}, {loc.lng.toFixed(5)}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 block uppercase text-[8px]">CACHE UPDATE</span>
              <span className="text-nerv-green font-bold">
                {new Date(loc.ts).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
              </span>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

// ── My QR Modal ───────────────────────────────────────────────
function MyQRModal({ onClose }: { onClose: () => void }) {
  const atlasId = getMyAegisId()
  const myName = getMyName()
  const [qrUrl, setQrUrl] = useState('')
  const [verifyCode, setVerifyCode] = useState(() => {
    const existing = sessionStorage.getItem('atlas_qr_verify_code')
    if (existing && existing.length === 6) return existing
    const gen = Math.floor(100000 + Math.random() * 900000).toString()
    sessionStorage.setItem('atlas_qr_verify_code', gen)
    return gen
  })

  const refreshCode = () => {
    const gen = Math.floor(100000 + Math.random() * 900000).toString()
    sessionStorage.setItem('atlas_qr_verify_code', gen)
    setVerifyCode(gen)
  }

  const myNik = getMyNik()
  const baseOrigin = (typeof window !== 'undefined' && !window.location.origin.includes('localhost') && !window.location.origin.includes('127.0.0.1'))
    ? window.location.origin
    : (import.meta.env.VITE_PUBLIC_URL || 'https://tsunami-dimss.vercel.app');
  const inviteUrl = `${baseOrigin}/?joinFamily=${encodeURIComponent(atlasId)}&inviteName=${encodeURIComponent(myName)}&code=${verifyCode}${myNik ? `&nik=${encodeURIComponent(myNik)}` : ''}`

  useEffect(() => {
    QRCode.toDataURL(inviteUrl, {
      width: 220,
      margin: 2,
      color: { dark: '#000000', light: '#FFFFFF' }
    }).then(setQrUrl)
  }, [inviteUrl])

  const share = async () => {
    if (navigator.share) {
      await navigator.share({ title: 'A.T.L.A.S Personnel Link Invite', url: inviteUrl })
    } else {
      await navigator.clipboard.writeText(inviteUrl)
      alert(`Tautan berhasil disalin!\nKode Verifikasi: ${verifyCode}`)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.95 }} animate={{ scale: 1 }}
        className="w-full max-w-xs p-5 rounded-xl border border-nerv-border bg-nerv-card relative shadow-2xl"
      >
        {/* Modal Header with Close Button */}
        <div className="flex items-start justify-between gap-2 mb-3 pb-2 border-b border-nerv-border/60">
          <div className="text-left font-mono">
            <span className="text-[9px] text-nerv-orange uppercase tracking-wider font-bold block">
              A.T.L.A.S // PERSONNEL ID QR
            </span>
            <span className="text-[10px] text-nerv-cyan font-bold block">
              SECURITY KEY &amp; PAIRING
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 shrink-0 rounded bg-black/60 border border-nerv-border flex items-center justify-center hover:border-nerv-orange transition-colors text-slate-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="text-center font-mono">
          <p className="text-base font-bold text-white mb-2 truncate">{myName}</p>

          <div className="p-3 bg-white rounded-lg inline-block shadow-inner mx-auto">
            {qrUrl ? (
              <img src={qrUrl} alt="Personnel QR" className="w-44 h-44 rounded" />
            ) : (
              <div className="w-44 h-44 bg-slate-200 flex items-center justify-center">
                <QrCode className="w-12 h-12 text-slate-400 animate-pulse" />
              </div>
            )}
          </div>

          <p className="text-[10px] text-slate-400 mt-2 font-mono break-all px-2 bg-black/50 py-1 rounded border border-nerv-border">
            ID: #{atlasId}
          </p>

          {myNik && (
            <p className="text-[10px] text-nerv-cyan mt-1 font-mono break-all px-2 bg-nerv-cyan/10 py-1 rounded border border-nerv-cyan/30">
              NIK: {myNik}
            </p>
          )}

          {/* Verification Code Box */}
          <div className="mt-3 p-3 rounded-lg bg-black/70 border border-nerv-cyan/50 text-center">
            <div className="flex items-center justify-between text-nerv-cyan text-[10px] font-bold tracking-widest uppercase mb-1">
              <span className="flex items-center gap-1">
                <Shield className="w-3 h-3" />
                KODE VERIFIKASI KEAMANAN
              </span>
              <button
                type="button"
                onClick={refreshCode}
                className="text-[9px] text-slate-400 hover:text-nerv-cyan underline"
                title="Ganti kode acak baru"
              >
                Ganti
              </button>
            </div>
            <div className="text-2xl font-black font-mono tracking-[0.3em] text-white py-0.5">
              {verifyCode.slice(0, 3)} {verifyCode.slice(3)}
            </div>
            <p className="text-[9px] text-slate-400 font-sans leading-tight mt-1">
              Kedua user harus mencocokkan kode ini saat menautkan keluarga.
            </p>
          </div>

          <button
            onClick={share}
            className="mt-3 w-full py-2.5 rounded bg-nerv-orange hover:bg-orange-600 text-black font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shadow-[0_0_15px_rgba(255,87,34,0.4)]"
          >
            <Share2 className="w-3.5 h-3.5" /> Bagikan Link Unit
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Add Member Modal (QR scan + Gallery upload + 2-Way Code Verification + Role Setup) ──
function AddMemberModal({ onClose, onAdd }: { onClose: () => void; onAdd: (m: FamilyMember) => void }) {
  const [step, setStep] = useState<'scan' | 'verify' | 'role'>('scan')
  const [scanning, setScanning] = useState(false)
  const [camErr, setCamErr] = useState('')
  const [galleryErr, setGalleryErr] = useState('')
  const [galleryLoading, setGalleryLoading] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef(0)

  // Verification & Role State
  const [pendingMember, setPendingMember] = useState<{
    id: string
    name: string
    expectedCode: string
    nik?: string
  } | null>(null)
  const [enteredCode, setEnteredCode] = useState('')
  const [verifyErr, setVerifyErr] = useState('')
  const [verifySuccess, setVerifySuccess] = useState(false)
  const [customRole, setCustomRole] = useState('')
  const [roleErr, setRoleErr] = useState('')

  const stopCam = () => {
    cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setScanning(false)
  }

  useEffect(() => {
    const handleFill = (e: any) => {
      if (e?.detail?.joinId && e?.detail?.joinName) {
        stopCam()
        setPendingMember({
          id: e.detail.joinId,
          name: e.detail.joinName,
          expectedCode: (e.detail.code || '').trim(),
          nik: (e.detail.nik || '').trim() || undefined
        })
        setEnteredCode('')
        setVerifyErr('')
        setCustomRole('')
        setRoleErr('')
        setStep('verify')
      }
    }
    window.addEventListener('atlas_modal_fill_join', handleFill)
    return () => {
      stopCam()
      window.removeEventListener('atlas_modal_fill_join', handleFill)
    }
  }, [])

  const processQRData = (data: string): boolean => {
    try {
      const url = new URL(data)
      const joinId = url.searchParams.get('joinFamily')
      const joinName = url.searchParams.get('inviteName')
      const code = url.searchParams.get('code') || url.searchParams.get('verifyCode') || ''
      const nik = url.searchParams.get('nik') || ''
      if (joinId && joinName) {
        stopCam()
        setPendingMember({
          id: joinId,
          name: joinName,
          expectedCode: code.trim(),
          nik: nik.trim() || undefined
        })
        setEnteredCode('')
        setVerifyErr('')
        setCustomRole('')
        setRoleErr('')
        setStep('verify')
        return true
      }
    } catch { }
    return false
  }

  const handleVerifyAndProceed = () => {
    if (!pendingMember) return
    const cleanEntered = enteredCode.replace(/\s+/g, '')

    if (cleanEntered.length !== 6) {
      setVerifyErr('Masukkan 6 digit angka kode verifikasi.')
      return
    }

    if (pendingMember.expectedCode && cleanEntered !== pendingMember.expectedCode) {
      setVerifyErr('KODE VERIFIKASI TIDAK COCOK! Penautan gagal demi keamanan.')
      return
    }

    // Match success! Move to Step 3: Role Assignment
    setVerifySuccess(true)
    setTimeout(() => {
      setVerifySuccess(false)
      setStep('role')
    }, 500)
  }

  const handleFinishLinking = () => {
    if (!pendingMember) return
    const roleClean = customRole.trim()
    if (roleClean.length < 3) {
      setRoleErr('Peran minimal 3 karakter.')
      return
    }
    if (roleClean.length > 20) {
      setRoleErr('Peran maksimal 20 karakter.')
      return
    }

    const newMember: FamilyMember = {
      id: pendingMember.id,
      name: pendingMember.name,
      role: roleClean,
      initials: pendingMember.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase(),
      status: 'unknown',
      location: 'Terverifikasi via QR',
      updatedAgo: 'baru saja',
      nik: pendingMember.nik,
      lastSeenTs: Date.now()
    }
    onAdd(newMember)
    aegisApi.notifyFamilyJoin(getMyAegisId(), getMyName(), pendingMember.id)
    onClose()
  }

  const startCam = async () => {
    setCamErr('')
    setGalleryErr('')
    setScanning(true)
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamRef.current = s
      if (videoRef.current) {
        videoRef.current.srcObject = s
        await videoRef.current.play()
        scanLoop()
      }
    } catch {
      setCamErr('Izin sensor kamera ditolak. Silakan gunakan opsi upload foto QR.')
      setScanning(false)
    }
  }

  const scanLoop = () => {
    const v = videoRef.current
    const c = canvasRef.current
    if (!v || !c || v.readyState < 2) {
      rafRef.current = requestAnimationFrame(scanLoop)
      return
    }
    c.width = v.videoWidth
    c.height = v.videoHeight
    c.getContext('2d')?.drawImage(v, 0, 0)
    import('jsqr').then(({ default: jsQR }) => {
      const id = c.getContext('2d')?.getImageData(0, 0, c.width, c.height)
      if (!id) {
        rafRef.current = requestAnimationFrame(scanLoop)
        return
      }
      const code = jsQR(id.data, id.width, id.height)
      if (code?.data) {
        if (!processQRData(code.data)) {
          setCamErr('QR tidak valid. Pastikan scan QR dari A.T.L.A.S.')
        }
        return
      }
      rafRef.current = requestAnimationFrame(scanLoop)
    }).catch(() => {
      rafRef.current = requestAnimationFrame(scanLoop)
    })
  }

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setGalleryErr('')
    setGalleryLoading(true)
    stopCam()
    try {
      const img = new window.Image()
      img.onload = async () => {
        const c = canvasRef.current!
        c.width = img.width
        c.height = img.height
        c.getContext('2d')!.drawImage(img, 0, 0)
        const { default: jsQR } = await import('jsqr')
        const id = c.getContext('2d')!.getImageData(0, 0, c.width, c.height)
        const code = jsQR(id.data, id.width, id.height)
        setGalleryLoading(false)
        if (code?.data) {
          if (!processQRData(code.data)) setGalleryErr('QR ditemukan tetapi bukan ID A.T.L.A.S yang valid.')
        } else {
          setGalleryErr('QR tidak terdeteksi pada gambar. Coba ambil gambar lebih jelas.')
        }
      }
      img.onerror = () => {
        setGalleryLoading(false)
        setGalleryErr('Gagal memproses file gambar.')
      }
      img.src = URL.createObjectURL(file)
    } catch {
      setGalleryLoading(false)
      setGalleryErr('Gagal mengekstrak QR code.')
    }
    e.target.value = ''
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[2000] flex items-start justify-center pt-6 sm:pt-14 px-4 bg-black/85 backdrop-blur-md overflow-y-auto"
    >
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.96 }}
        className="w-full max-w-sm rounded-xl border border-nerv-border p-5 bg-nerv-card shadow-2xl my-2"
      >
        <div className="flex items-center justify-between mb-3 border-b border-nerv-border pb-2">
          <div>
            <p className="text-[9px] font-mono font-bold text-nerv-cyan uppercase tracking-widest">
              A.T.L.A.S // LINK PERSONNEL
            </p>
            <h3 className="text-sm font-mono font-bold text-white uppercase">TAUTKAN ANGGOTA KELUARGA</h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded bg-black/60 border border-nerv-border flex items-center justify-center hover:border-nerv-orange transition-colors"
          >
            <X className="w-4 h-4 text-slate-300" />
          </button>
        </div>

        {/* STEP 3: ROLE ASSIGNMENT */}
        {step === 'role' && pendingMember ? (
          <div className="font-mono space-y-3">
            <div className="p-3 rounded-lg bg-black/60 border border-nerv-cyan/50 text-center">
              <span className="text-[9px] text-slate-400 uppercase block">TARGET UNIT TERVERIFIKASI</span>
              <span className="text-sm font-bold text-nerv-cyan block truncate">{pendingMember.name}</span>
              <span className="text-[9px] text-slate-500 block">ID: #{pendingMember.id}</span>
              {pendingMember.nik && (
                <span className="text-[9px] text-nerv-cyan/80 block mt-0.5">NIK: {pendingMember.nik}</span>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-200 block font-bold uppercase tracking-wider">
                TENTUKAN PERAN UNIT INI:
              </label>
              <p className="text-[10px] text-slate-400 font-sans leading-tight">
                Minimal 3 karakter, maksimal 20 karakter. Hanya boleh ada huruf dan angka.
              </p>
              <input
                type="text"
                maxLength={20}
                value={customRole}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^a-zA-Z0-9 ]/g, '').slice(0, 20)
                  setCustomRole(val)
                  setRoleErr('')
                }}
                placeholder="Contoh: Ayah / Ibu"
                className="w-full mt-2 px-3 py-2.5 rounded bg-black/80 border border-nerv-border focus:border-nerv-cyan text-sm font-bold text-white placeholder:text-slate-500 focus:outline-none"
              />
              <div className="flex justify-between items-center text-[9px] text-slate-500 font-mono">
                <span>{customRole.trim().length} / 20 Karakter</span>
                {customRole.trim().length >= 3 && <span className="text-nerv-green">✓ Valid</span>}
              </div>
            </div>

            {roleErr && (
              <p className="text-nerv-red font-mono text-[11px] text-center font-bold bg-nerv-red/10 p-2 rounded border border-nerv-red/30">
                {roleErr}
              </p>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleFinishLinking}
                disabled={customRole.trim().length < 3 || customRole.trim().length > 20}
                className="flex-1 py-2.5 rounded bg-nerv-cyan hover:bg-cyan-400 disabled:opacity-40 text-black font-mono font-bold text-xs uppercase tracking-wider transition-colors shadow-[0_0_12px_rgba(0,229,255,0.4)]"
              >
                SIMPAN &amp; SELESAIKAN
              </button>
              <button
                type="button"
                onClick={() => setStep('verify')}
                className="px-3 py-2.5 rounded bg-black/60 border border-nerv-border text-slate-400 hover:text-white text-xs font-mono"
              >
                KEMBALI
              </button>
            </div>
          </div>
        ) : step === 'verify' && pendingMember ? (
          /* STEP 2: VERIFICATION CHALLENGE */
          <div className="font-mono space-y-3">
            <div className="p-3 rounded-lg bg-black/60 border border-nerv-cyan/50 text-center">
              <span className="text-[9px] text-slate-400 uppercase block">TARGET UNIT TERDETEKSI</span>
              <span className="text-sm font-bold text-nerv-cyan block truncate">{pendingMember.name}</span>
              <span className="text-[9px] text-slate-500 block">ID: #{pendingMember.id}</span>
              {pendingMember.nik && (
                <span className="text-[9px] text-nerv-cyan/80 block mt-0.5">NIK: {pendingMember.nik}</span>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-300 block font-bold uppercase">
                MASUKKAN 6 DIGIT KODE VERIFIKASI:
              </label>
              <p className="text-[10px] text-slate-400 font-sans leading-tight">
                Lihat kode 6-digit yang tertera pada layar perangkat {pendingMember.name}. Jika cocok maka akan tertaut, jika tidak cocok maka akan gagal.
              </p>
              <input
                type="text"
                maxLength={6}
                value={enteredCode}
                onChange={(e) => {
                  setEnteredCode(e.target.value.replace(/[^0-9]/g, ''))
                  setVerifyErr('')
                }}
                placeholder="Contoh: 742905"
                className="w-full mt-2 px-3 py-2.5 rounded bg-black/80 border border-nerv-border focus:border-nerv-cyan text-center text-xl font-black tracking-[0.4em] text-white focus:outline-none"
              />
            </div>

            {verifyErr && (
              <p className="text-nerv-red font-mono text-[11px] text-center font-bold bg-nerv-red/10 p-2 rounded border border-nerv-red/30">
                {verifyErr}
              </p>
            )}

            {verifySuccess && (
              <p className="text-nerv-green font-mono text-[11px] text-center font-bold bg-nerv-green/10 p-2 rounded border border-nerv-green/30 animate-pulse">
                ✓ KODE COCOK! MELANJUTKAN KE PENGATURAN PERAN...
              </p>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleVerifyAndProceed}
                disabled={verifySuccess || enteredCode.length < 6}
                className="flex-1 py-2.5 rounded bg-nerv-cyan hover:bg-cyan-400 disabled:opacity-40 text-black font-mono font-bold text-xs uppercase tracking-wider transition-colors shadow-[0_0_12px_rgba(0,229,255,0.4)]"
              >
                VERIFIKASI KODE
              </button>
              <button
                type="button"
                onClick={() => {
                  setPendingMember(null)
                  setEnteredCode('')
                  setVerifyErr('')
                  setStep('scan')
                }}
                className="px-3 py-2.5 rounded bg-black/60 border border-nerv-border text-slate-400 hover:text-white text-xs font-mono"
              >
                BATAL
              </button>
            </div>
          </div>
        ) : (
          /* STEP 1: SCAN OR UPLOAD QR */
          <div>
            <p className="text-[11px] text-slate-400 mb-3 font-sans">
              Pindai kamera atau unggah tangkapan layar QR Code anggota untuk menghubungkan saluran darurat.
            </p>

            {camErr && <p className="text-nerv-red font-mono text-[10px] text-center mb-2">{camErr}</p>}
            {galleryErr && <p className="text-nerv-yellow font-mono text-[10px] text-center mb-2">{galleryErr}</p>}
            {galleryLoading && (
              <p className="text-nerv-cyan font-mono text-[10px] text-center mb-2 animate-pulse">
                MEMPROSES TANGKAPAN QR...
              </p>
            )}

            <div className="relative w-full aspect-square max-h-72 rounded-lg overflow-hidden bg-black border border-nerv-border mb-3">
              <video
                ref={videoRef}
                className={`w-full h-full object-cover ${scanning ? 'block' : 'hidden'}`}
                playsInline
                autoPlay
                muted
                controls={false}
                style={{ pointerEvents: 'none' }}
              />
              <canvas ref={canvasRef} className="hidden" />

              {!scanning && !camErr && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#0a0f1d] p-4 text-center">
                  <div className="w-14 h-14 rounded-full bg-nerv-cyan/10 border border-nerv-cyan/40 flex items-center justify-center">
                    <Camera className="w-7 h-7 text-nerv-cyan animate-pulse" />
                  </div>
                  <p className="text-[11px] font-mono text-slate-300">
                    Kamera belum aktif. Tekan tombol di bawah untuk memindai QR code.
                  </p>
                  <button
                    onClick={startCam}
                    className="px-4 py-2 rounded bg-nerv-cyan hover:bg-cyan-400 text-black font-mono font-bold text-xs uppercase tracking-wider transition-colors shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                  >
                    AKTIFKAN SCANNER KAMERA
                  </button>
                </div>
              )}

              {scanning && (
                <div className="absolute inset-0 pointer-events-none border-2 border-nerv-orange/50 m-6 rounded flex items-center justify-center">
                  <div className="w-full h-0.5 bg-nerv-orange shadow-[0_0_8px_rgba(255,87,34,1)] animate-bounce" />
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <label className="flex-1 py-2.5 rounded bg-black/60 border border-nerv-border hover:border-nerv-orange text-slate-300 font-mono text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors">
                <UserPlus className="w-3.5 h-3.5 text-nerv-cyan" />
                UPLOAD FOTO QR
                <input type="file" accept="image/*" onChange={handleGalleryUpload} className="hidden" />
              </label>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

// ── Reciprocal Role Assignment Modal (Two-Way Mutual Pairing) ──
function ReciprocalRoleModal({
  prompt,
  onConfirm,
  onCancel
}: {
  prompt: { fromId: string; fromName: string; nik?: string };
  onConfirm: (role: string) => void;
  onCancel: () => void;
}) {
  const [selectedRole, setSelectedRole] = useState('Keluarga')
  const [customRole, setCustomRole] = useState('')
  const PRESET_ROLES = ['Ayah', 'Ibu', 'Suami', 'Istri', 'Anak', 'Kakak', 'Adik', 'Keluarga', 'Kerabat']

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[3100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.92, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.92, y: 20 }}
        className="w-full max-w-sm rounded-2xl border-2 border-nerv-cyan/80 bg-[#0c121e] p-5 shadow-[0_0_50px_rgba(0,229,255,0.35)] relative font-sans text-slate-200"
      >
        <div className="flex items-center gap-3 mb-3 pb-3 border-b border-nerv-border">
          <div className="w-12 h-12 rounded-xl bg-nerv-green/20 border border-nerv-green/60 flex items-center justify-center text-nerv-green shrink-0 shadow-[0_0_15px_rgba(34,197,94,0.4)]">
            <CheckCircle className="w-6 h-6 animate-pulse" />
          </div>
          <div className="min-w-0">
            <span className="text-[9px] font-mono font-bold text-nerv-cyan tracking-widest uppercase block">
              AUTONOMOUS PAIRING DETECTED
            </span>
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wide truncate">
              PERANGKAT BERHASIL TERTAUT!
            </h3>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-black/60 border border-slate-800 space-y-1 mb-3 font-mono">
          <p className="text-[11px] text-slate-300">
            <b className="text-white text-xs">{prompt.fromName}</b> baru saja memindai QR Code Anda dan menautkan Anda ke unitnya.
          </p>
          {prompt.nik && (
            <p className="text-[10px] text-nerv-cyan font-bold">NIK: {prompt.nik}</p>
          )}
        </div>

        <div className="space-y-2 mb-4">
          <label className="text-[10px] text-slate-400 font-mono font-bold uppercase block tracking-wider">
            APA HUBUNGAN / PERAN BELIAU BAGI ANDA?
          </label>
          <div className="grid grid-cols-3 gap-1.5 font-mono text-[11px]">
            {PRESET_ROLES.map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => {
                  setSelectedRole(role)
                  setCustomRole('')
                }}
                className={`py-1.5 px-2 rounded-lg font-bold border transition-all text-center truncate ${
                  selectedRole === role && !customRole
                    ? 'bg-nerv-cyan text-black border-nerv-cyan shadow-[0_0_10px_rgba(0,229,255,0.4)]'
                    : 'bg-black/50 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                {role}
              </button>
            ))}
          </div>

          <div className="pt-1">
            <input
              type="text"
              value={customRole}
              onChange={(e) => {
                setCustomRole(e.target.value)
                setSelectedRole(e.target.value)
              }}
              placeholder="Atau ketik peran khusus lainnya..."
              className="w-full px-3 py-2 rounded-lg bg-black/60 border border-slate-800 text-xs text-white placeholder:text-slate-600 focus:border-nerv-cyan focus:outline-none font-mono"
            />
          </div>
        </div>

        <div className="flex gap-2 pt-1 font-mono">
          <button
            type="button"
            onClick={() => onConfirm(customRole.trim() || selectedRole)}
            className="flex-1 py-3 rounded-xl bg-nerv-cyan hover:bg-cyan-400 text-black font-bold text-xs uppercase tracking-wider transition-colors shadow-[0_0_15px_rgba(0,229,255,0.4)] cursor-pointer"
          >
            SIMPAN KE DAFTAR SAYA ✓
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Main FamilyPage ───────────────────────────────────────────
interface Props {
  onBack: () => void
  onPingClear?: () => void
}

export default function FamilyPage({ onBack, onPingClear }: Props) {
  const { lang, t } = useLanguage()
  const myId = getMyAegisId()
  const myName = getMyName()
  const myNik = getMyNik()

  const [members, setMembers] = useState<FamilyMember[]>(loadFamily)
  const [showQR, setShowQR] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [viewMember, setViewMember] = useState<FamilyMember | null>(null)
  const [deleteConfirmMember, setDeleteConfirmMember] = useState<FamilyMember | null>(null)
  const [pinging, setPinging] = useState(false)
  const [pingBanner, setPingBanner] = useState('')
  const [, setTicker] = useState(0)
  const [reciprocalPrompt, setReciprocalPrompt] = useState<{ fromId: string; fromName: string; nik?: string } | null>(null)
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const [incomingPing, setIncomingPing] = useState<{ fromId: string; fromName: string; nik?: string; role?: string } | null>(() => {
    try {
      const raw = localStorage.getItem('atlas_pending_family_ping')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed?.ts && Date.now() - parsed.ts < 300000) {
          return parsed
        }
      }
    } catch {}
    return null
  })

  const alarmRef = useRef<HTMLAudioElement | null>(null)
  const familyPingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    onPingClear?.()
    alarmRef.current = new Audio("/alarm.mp3")
    alarmRef.current.loop = true
    return () => alarmRef.current?.pause()
  }, [onPingClear])

  // Dynamic relative time ticker (updates every 30s)
  useEffect(() => {
    const t = setInterval(() => setTicker(k => k + 1), 30000)
    return () => clearInterval(t)
  }, [])

  // Deep Link Receiver for Unit Join Link
  useEffect(() => {
    const handleDeepLink = (e?: any) => {
      const joinId = e?.detail?.joinFamily || localStorage.getItem('atlas_pending_join_family')
      const joinName = e?.detail?.inviteName || localStorage.getItem('atlas_pending_join_name') || 'Personel Unit'
      const code = e?.detail?.code || localStorage.getItem('atlas_pending_join_code') || ''
      const nik = e?.detail?.nik || localStorage.getItem('atlas_pending_join_nik') || ''
      if (joinId) {
        localStorage.removeItem('atlas_pending_join_family')
        localStorage.removeItem('atlas_pending_join_name')
        localStorage.removeItem('atlas_pending_join_code')
        localStorage.removeItem('atlas_pending_join_nik')
        setShowAdd(true)
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('atlas_modal_fill_join', { detail: { joinId, joinName, code, nik } }))
        }, 150)
      }
    }
    handleDeepLink()
    window.addEventListener('atlas_deep_link_join', handleDeepLink)
    return () => window.removeEventListener('atlas_deep_link_join', handleDeepLink)
  }, [])

  useEffect(() => {
    if (incomingPing) {
      const doVibrate = () => {
        if ("vibrate" in navigator) navigator.vibrate([300, 100, 300])
        alarmRef.current?.play?.().catch(() => {})
      }
      doVibrate()
      familyPingIntervalRef.current = setInterval(doVibrate, 1500)
      return () => {
        if (familyPingIntervalRef.current) clearInterval(familyPingIntervalRef.current)
        alarmRef.current?.pause?.()
      }
    }
  }, [incomingPing])

  const save = useCallback((m: FamilyMember[]) => {
    setMembers(m)
    saveFamily(m)
  }, [])

  const handleConfirmReciprocalRole = (role: string) => {
    if (!reciprocalPrompt) return
    const { fromId, fromName, nik } = reciprocalPrompt
    const current = loadFamily()
    const existingIdx = current.findIndex(m => m.id === fromId || (nik && m.nik === nik))
    const newEntry: FamilyMember = {
      id: fromId,
      name: fromName,
      role: role.trim() || 'Keluarga',
      nik: nik || undefined,
      initials: fromName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase(),
      status: 'unknown' as const,
      location: 'Tertaut via QR scan timbal-balik',
      updatedAgo: 'baru saja',
      lastSeenTs: Date.now()
    }
    let updated: FamilyMember[]
    if (existingIdx !== -1) {
      updated = [...current]
      updated[existingIdx] = { ...updated[existingIdx], role: newEntry.role, nik: newEntry.nik || updated[existingIdx].nik }
    } else {
      updated = [...current, newEntry]
    }
    save(updated)
    setReciprocalPrompt(null)
  }

  // Sync latest location of all family members from database on mount
  useEffect(() => {
    const fetchMemberLocations = async () => {
      const current = loadFamily()
      const ids = current.map(m => m.id).filter(Boolean)
      if (ids.length === 0) return
      try {
        const { data } = await supabase
          .from('location_updates')
          .select('id, lat, lng, updated_at')
          .in('id', ids)
        if (data && data.length > 0) {
          const locs = loadMemberLocs()
          data.forEach((r: any) => {
            if (r.lat && r.lng) {
              locs[r.id] = { lat: r.lat, lng: r.lng, ts: new Date(r.updated_at).getTime() }
            }
          })
          localStorage.setItem('aegisMemberLocs', JSON.stringify(locs))
          setTicker(k => k + 1)
        }
      } catch {}
    }
    fetchMemberLocations()
  }, [])

  // Broadcast my location to all linked members
  useEffect(() => {
    let watchId: string | null = null
    const startWatch = async () => {
      try {
        if (typeof navigator !== 'undefined' && navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const { latitude: lat, longitude: lng } = pos.coords
              saveMemberLoc(myId, lat, lng)
              const deviceInfo = (window as any).__DEVICE_MODEL__ || navigator.userAgent
              aegisApi.broadcastLocation(myId, myName, deviceInfo, lat, lng, 100, myNik).catch(() => {})
            },
            () => {},
            { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
          )
        }
        watchId = await Geolocation.watchPosition({ enableHighAccuracy: true, maximumAge: 0 }, (pos, err) => {
          if (err || !pos) return
          const { latitude: lat, longitude: lng } = pos.coords
          saveMemberLoc(myId, lat, lng)
          const deviceInfo = (window as any).__DEVICE_MODEL__ || navigator.userAgent
          aegisApi.broadcastLocation(myId, myName, deviceInfo, lat, lng, 100, myNik).catch(() => {})
        })
      } catch (e) {
        console.warn("Family GPS error", e)
      }
    }
    startWatch()
    return () => {
      if (watchId) Geolocation.clearWatch({ id: watchId }).catch(() => {})
    }
  }, [myId, myName, myNik])

  // Real-time synchronization events
  useAegisSync((event) => {
    if (event.type === 'FAMILY_JOIN' && event.toId === myId) {
      const fromId = event.fromId as string
      const fromName = event.fromName as string
      const fromNik = (event as any).nik || ''
      setShowQR(false)
      setReciprocalPrompt({
        fromId,
        fromName,
        nik: fromNik
      })
      try {
        if ('vibrate' in navigator) navigator.vibrate([150, 80, 150])
      } catch {}
    }
    if (event.type === 'LOCATION_UPDATE') {
      const id = event.id as string
      const lat = event.lat as number
      const lng = event.lng as number
      if (id && lat && lng) {
        saveMemberLoc(id, lat, lng)
        setTicker(k => k + 1)
      }
    }
    if (event.type === 'PING' && event.fromId !== myId) {
      const fromId = event.fromId as string
      const role = (event as any).role || (fromId?.includes('ARCHITECT') ? 'ARCHITECT 01' : (fromId?.startsWith('COMMAND') ? fromId : undefined))
      setIncomingPing({ 
        fromId, 
        fromName: event.fromName as string, 
        nik: event.nik,
        role
      })
    }
    if (event.type === 'PING_REPLY' && event.toId === myId) {
      const current = loadFamily()
      save(current.map(m => m.id === event.fromId ? { ...m, status: 'safe' as const, updatedAgo: 'baru saja', lastSeenTs: Date.now() } : m))
      setPingBanner(`${event.fromName} merespons: SAYA AMAN ✓`)
      setTimeout(() => setPingBanner(''), 4000)
    }
    if (event.type === 'PING_HELP' && event.toId === myId) {
      const current = loadFamily()
      save(current.map(m => m.id === event.fromId ? { ...m, status: 'danger' as const, updatedAgo: 'DARURAT! BUTUH BANTUAN', lastSeenTs: Date.now() } : m))
      setPingBanner(`⚠️ ${event.fromName} MEMERLUKAN BANTUAN DARURAT!`)
      if ('vibrate' in navigator) navigator.vibrate([300, 100, 300, 100, 300])
      setTimeout(() => setPingBanner(''), 8000)
    }
  })

  const handleAdd = (m: FamilyMember) => {
    const updated = [...members.filter(x => x.id !== m.id), m]
    save(updated)
  }

  const handleDelete = (member: FamilyMember) => {
    setDeleteConfirmMember(member)
  }

  const handlePing = () => {
    setPinging(true)
    if ('vibrate' in navigator) navigator.vibrate([100, 50, 100])
    const current = loadFamily()
    save(current.map(m => ({ ...m, status: 'waiting' as const, updatedAgo: 'menunggu respon...' })))
    aegisApi.ping(myId, myName)
    setTimeout(() => setPinging(false), 3000)
  }

  const locs = loadMemberLocs()

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }}
        transition={{ duration: 0.22 }}
        className="fixed inset-0 z-[1800] flex flex-col overflow-y-auto custom-scrollbar bg-nerv-bg text-slate-200"
      >
        {/* A.T.L.A.S Telemetry Header */}
        <div className="shrink-0 px-4 pt-[max(env(safe-area-inset-top,0px),1rem)] pb-3 border-b border-nerv-border bg-[#0B0F19] flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            {onBack && (
              <button
                onClick={onBack}
                className="w-8 h-8 rounded bg-nerv-card border border-nerv-border flex items-center justify-center shrink-0 hover:border-nerv-orange transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-slate-300" />
              </button>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <div className="w-2 h-2 rounded-full bg-nerv-cyan animate-ping" />
                <p className="text-[10px] font-mono font-bold tracking-widest text-nerv-cyan uppercase">
                  A.T.L.A.S // PERSONNEL DIRECTORY
                </p>
              </div>
              <h2 className="text-sm font-mono font-bold text-white truncate">
                {lang === 'id' ? `UNIT KELUARGA TERTAUT [${members.length}]` : `LINKED FAMILY UNITS [${members.length}]`}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowQR(true)}
              className="px-2.5 py-1.5 rounded bg-black/60 border border-nerv-border hover:border-nerv-cyan flex items-center gap-1.5 font-mono text-xs text-nerv-cyan transition-colors"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold">{lang === 'id' ? 'QR SAYA' : 'MY QR'}</span>
            </button>
          </div>
        </div>

        {/* Tactical Ping Reply Banner */}
        <AnimatePresence>
          {pingBanner && (
            <motion.div
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="shrink-0 px-4 py-2 bg-nerv-green/10 border-b border-nerv-green/40 text-center font-mono"
            >
              <p className="text-[11px] font-bold text-nerv-green">{pingBanner}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 px-4 py-4 space-y-3 pb-24">
          {/* USER'S OWN UNIT IDENTITY CARD (TOP OF DIRECTORY) */}
          <div className="p-3.5 rounded-lg border border-nerv-cyan/40 bg-nerv-card/90 border-l-4 border-l-nerv-cyan relative overflow-hidden shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-nerv-cyan/15 border border-nerv-cyan/50 flex items-center justify-center font-mono font-bold text-sm text-nerv-cyan shrink-0">
                {myName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="text-sm font-mono font-bold text-white break-words">{myName} (Anda)</p>
                  <span className={`text-[8px] font-mono uppercase px-1.5 py-0.5 rounded border shrink-0 font-bold ${
                    myId === 'ARCHITECT 01'
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
                      : myId.startsWith('COMMAND')
                      ? 'bg-nerv-orange/10 border-nerv-orange/40 text-nerv-orange'
                      : myId === 'FOREIGN CITIZEN'
                      ? 'bg-purple-500/10 border-purple-500/40 text-purple-400'
                      : 'bg-nerv-cyan/10 border-nerv-cyan/30 text-nerv-cyan'
                  }`}>
                    {myId === 'ARCHITECT 01'
                      ? 'ARCHITECT 01 // PENGEMBANG'
                      : myId.startsWith('COMMAND')
                      ? `${myId} // KOMANDO`
                      : myId === 'FOREIGN CITIZEN'
                      ? 'FOREIGN CITIZEN // UNIT INI'
                      : 'CITIZEN // UNIT INI'}
                  </span>
                </div>
                <p className="text-[10px] font-mono text-slate-400 mt-1 select-all">
                  {myNik ? (myId === 'FOREIGN CITIZEN' ? `PASPOR: ${myNik}` : `NIK: ${myNik}`) : `STATUS: ${myId}`}
                </p>
              </div>
              <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded border shrink-0 ${
                isOnline
                  ? 'bg-nerv-green/10 border-nerv-green/30'
                  : 'bg-amber-500/10 border-amber-500/30'
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full ${
                  isOnline ? 'bg-nerv-green animate-pulse' : 'bg-amber-500'
                }`} />
                <span className={`text-[9px] font-mono font-bold uppercase ${
                  isOnline ? 'text-nerv-green' : 'text-amber-400'
                }`}>
                  {isOnline ? 'ONLINE' : 'OFFLINE'}
                </span>
              </div>
            </div>
          </div>

          {/* Tactical Ping Broadcast Button */}
          {members.length > 0 && (
            <button
              onClick={handlePing}
              disabled={pinging}
              className={`w-full py-3.5 rounded-lg font-mono font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 border transition-all ${
                pinging
                  ? 'bg-nerv-orange/20 border-nerv-orange text-nerv-orange animate-pulse'
                  : 'bg-nerv-orange hover:bg-orange-600 border-orange-400 text-black shadow-[0_0_15px_rgba(255,87,34,0.35)]'
              }`}
            >
              <Radio className={`w-4 h-4 ${pinging ? 'animate-spin' : ''}`} />
              {pinging 
                ? (lang === 'id' ? 'MENTRANSMISIKAN SINYAL KE SEMUA UNIT...' : 'TRANSMITTING SIGNAL TO ALL UNITS...')
                : (lang === 'id' ? 'SIARKAN PING KE SEMUA UNIT' : 'BROADCAST PING TO ALL UNITS')}
            </button>
          )}

          {/* Empty state */}
          {members.length === 0 && (
            <div className="py-12 text-center border border-dashed border-nerv-border rounded-lg bg-nerv-card/50 p-6">
              <div className="w-16 h-16 rounded-lg bg-black/60 border border-nerv-border flex items-center justify-center mx-auto mb-3">
                <Shield className="w-8 h-8 text-nerv-cyan/60" />
              </div>
              <h3 className="text-white font-mono font-bold text-sm mb-1 uppercase tracking-wider">
                {lang === 'id' ? 'TIDAK ADA PERSONEL TERTAUT' : 'NO LINKED PERSONNEL'}
              </h3>
              <p className="text-slate-400 text-xs font-sans max-w-xs mx-auto mb-4">
                {lang === 'id' 
                  ? 'Hubungkan anggota keluarga ke jaringan darurat A.T.L.A.S dengan memindai kode QR.'
                  : 'Connect family members to A.T.L.A.S emergency network by scanning QR code.'}
              </p>
              <button
                onClick={() => setShowAdd(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded bg-nerv-cyan/20 border border-nerv-cyan text-nerv-cyan font-mono text-xs font-bold hover:bg-nerv-cyan/30 transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" /> {lang === 'id' ? 'TAUTKAN ANGGOTA SEKARANG' : 'LINK MEMBERS NOW'}
              </button>
            </div>
          )}

          {/* Member cards */}
          {members.map((m, i) => {
            const hasLoc = !!locs[m.id]
            const memberLoc = locs[m.id]
            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className={`p-3.5 rounded-lg border bg-nerv-card relative overflow-hidden transition-colors ${
                  m.status === 'danger'
                    ? 'border-nerv-red/60 border-l-4 border-l-nerv-red'
                    : 'border-nerv-border hover:border-nerv-borderActive border-l-4 border-l-nerv-cyan'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-black/60 border border-nerv-border flex items-center justify-center font-mono font-bold text-sm text-nerv-cyan shrink-0">
                    {m.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="text-sm font-mono font-bold text-white break-words">{m.name}</p>
                      <span className="text-[9px] font-mono text-nerv-cyan font-bold uppercase px-1.5 py-0.5 rounded bg-nerv-cyan/10 border border-nerv-cyan/30 shrink-0">
                        {m.role || 'UNIT PERSONEL'}
                      </span>
                    </div>
                    {/* FULL NIK DISPLAY UNDER NAME */}
                    <p className="text-[10px] font-mono text-slate-400 mt-0.5 select-all font-semibold">
                      {m.nik ? `NIK: ${m.nik}` : `ID: #${m.id}`}
                    </p>
                    <div className="mt-1">
                      <StatusChip status={m.status} />
                    </div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() => setViewMember(m)}
                      className={`p-2 rounded border transition-colors ${
                        hasLoc
                          ? 'bg-nerv-cyan/15 border-nerv-cyan/50 text-nerv-cyan hover:bg-nerv-cyan/30'
                          : 'bg-black/40 border-nerv-border text-slate-500'
                      }`}
                      title={hasLoc ? 'Lihat telemetri lokasi' : 'Lokasi belum tersedia'}
                    >
                      <Navigation2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(m)}
                      className="p-2 rounded border border-nerv-border bg-black/40 text-slate-500 hover:text-nerv-red hover:border-nerv-red/50 transition-colors"
                      title="Hapus unit"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-nerv-border/60 text-[10px] font-mono">
                  <div className="text-slate-400">
                    {hasLoc ? (
                      <span className="text-nerv-green">
                        ● GPS: {memberLoc.lat.toFixed(4)}, {memberLoc.lng.toFixed(4)}
                      </span>
                    ) : (
                      <span className="text-slate-500">○ Sinyal koordinat standby</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-slate-400 text-[9px]">
                    <Clock className="w-3 h-3 text-nerv-cyan shrink-0" />
                    <span>{formatLastSeen(m, memberLoc?.ts)}</span>
                  </div>
                </div>
              </motion.div>
            )
          })}

          {/* Add member button */}
          {members.length > 0 && (
            <button
              onClick={() => setShowAdd(true)}
              className="w-full p-3 rounded-lg border border-dashed border-nerv-border hover:border-nerv-cyan bg-black/40 flex items-center justify-center gap-2 text-slate-400 hover:text-nerv-cyan font-mono text-xs font-bold transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ TAUTKAN UNIT BARU</span>
            </button>
          )}

          {/* Info Card */}
          <div className="p-3.5 rounded-lg border border-nerv-border bg-[#0B0F19] font-mono">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-nerv-cyan" />
              <p className="text-[10px] text-nerv-cyan font-bold uppercase tracking-widest">
                [DATA TELEMETRI // OFFLINE CACHE]
              </p>
            </div>
            <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
              Posisi personel disimpan secara lokal di perangkat. Saat terhubung sinyal seluler/WiFi, koordinat
              diperbarui otomatis secara real-time. Jika jaringan putus, titik terakhir tetap dapat diakses di peta.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Incoming Ping Alarm Modal */}
      <AnimatePresence>
        {incomingPing && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 15 }}
              className="w-full max-w-xs bg-nerv-card border-2 border-nerv-orange rounded-lg p-5 shadow-[0_0_40px_rgba(255,87,34,0.4)] relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-nerv-orange/5 animate-pulse pointer-events-none" />
              <div className="relative z-10 flex flex-col items-center text-center font-mono">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 border ${
                  incomingPing.role === 'ARCHITECT 01'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                    : incomingPing.role?.startsWith('COMMAND')
                    ? 'bg-nerv-orange/20 border-nerv-orange text-nerv-orange'
                    : 'bg-nerv-cyan/20 border-nerv-cyan text-nerv-cyan'
                }`}>
                  <Radio className="w-7 h-7 animate-ping" />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1 text-nerv-orange">
                  TACTICAL EMERGENCY PING
                </p>
                <h2 className="text-base font-bold text-white mb-2">
                  {incomingPing.role === 'ARCHITECT 01'
                    ? 'SINYAL OTORITAS PENGEMBANG'
                    : incomingPing.role?.startsWith('COMMAND')
                    ? 'PANGGILAN POSKO KOMANDO'
                    : 'PANGGILAN DARI UNIT'}
                </h2>

                {/* Sinyal Authority Badge */}
                {incomingPing.role === 'ARCHITECT 01' ? (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500/15 border border-amber-500/50 mb-3">
                    <span className="text-[11px] font-bold text-amber-400 font-mono">
                      [ARCHITECT 01] // {incomingPing.fromName}
                    </span>
                  </div>
                ) : incomingPing.role?.startsWith('COMMAND') ? (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-nerv-orange/15 border border-nerv-orange/50 mb-3">
                    <span className="text-[11px] font-bold text-nerv-orange font-mono">
                      [{incomingPing.role}] • {incomingPing.fromName}
                    </span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-nerv-cyan/15 border border-nerv-cyan/40 mb-3">
                    <span className="text-[11px] font-bold text-white font-mono">
                      {incomingPing.fromName}
                    </span>
                  </div>
                )}

                <p className="text-xs text-slate-300 mb-1 font-sans leading-relaxed">
                  <b className="text-white font-mono">{incomingPing.fromName}</b> mengirimkan sinyal darurat. Segera
                  kirimkan konfirmasi keselamatan Anda.
                </p>
                {incomingPing.nik && (
                  <p className="text-[9px] text-nerv-cyan font-mono mb-4">
                    {incomingPing.role === 'FOREIGN CITIZEN' ? `PASPOR: ${incomingPing.nik}` : `NIK: ${incomingPing.nik}`}
                  </p>
                )}
                <div className="w-full space-y-2.5">
                  <button
                    onClick={() => {
                      const targetId = incomingPing.fromId
                      setIncomingPing(null)
                      localStorage.removeItem('atlas_pending_family_ping')
                      if (familyPingIntervalRef.current) {
                        clearInterval(familyPingIntervalRef.current)
                        familyPingIntervalRef.current = null
                      }
                      alarmRef.current?.pause?.()
                      aegisApi.pingReply(myId, myName, targetId, myNik)
                      setPingBanner('KONFIRMASI TERKIRIM: SAYA AMAN ✓')
                      setTimeout(() => setPingBanner(''), 4000)
                    }}
                    className="w-full py-3.5 bg-nerv-green hover:bg-emerald-600 text-black rounded font-mono font-bold text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(34,197,94,0.4)] transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>KONFIRMASI: SAYA AMAN ✓</span>
                  </button>
                  <button
                    onClick={() => {
                      const targetId = incomingPing.fromId
                      const targetName = incomingPing.fromName
                      // Instant response: dismiss modal & stop alarm immediately!
                      setIncomingPing(null)
                      localStorage.removeItem('atlas_pending_family_ping')
                      if (familyPingIntervalRef.current) {
                        clearInterval(familyPingIntervalRef.current)
                        familyPingIntervalRef.current = null
                      }
                      alarmRef.current?.pause?.()
                      setPingBanner(`⚠️ SINYAL MEMERLUKAN BANTUAN DIKIRIM KE ${targetName}!`)
                      if ('vibrate' in navigator) navigator.vibrate([200, 100, 200])
                      setTimeout(() => setPingBanner(''), 6000)

                      // Dispatch in background with fallback coordinates
                      ;(async () => {
                        let lat: number | undefined
                        let lng: number | undefined
                        try {
                          const savedPos = localStorage.getItem('atlas_user_position')
                          if (savedPos) {
                            const parsed = JSON.parse(savedPos)
                            if (Array.isArray(parsed) && parsed.length >= 2) {
                              lat = parsed[0]
                              lng = parsed[1]
                            }
                          }
                          const pos = await Geolocation.getCurrentPosition({ timeout: 4000 }).catch(() => null)
                          if (pos?.coords) {
                            lat = pos.coords.latitude
                            lng = pos.coords.longitude
                          }
                        } catch {}
                        aegisApi.pingHelp(myId, myName, targetId, lat, lng, myNik)
                      })()
                    }}
                    className="w-full py-3.5 bg-nerv-red hover:bg-red-700 text-white rounded font-mono font-bold text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(239,68,68,0.5)] transition-all flex items-center justify-center gap-2 animate-pulse"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span>⚠️ MEMERLUKAN BANTUAN DARURAT</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmMember && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="w-full max-w-xs bg-nerv-card border border-nerv-red/60 rounded-lg p-5 shadow-2xl font-mono text-center"
            >
              <div className="w-12 h-12 rounded-full bg-nerv-red/20 border border-nerv-red flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-6 h-6 text-nerv-red" />
              </div>
              <h3 className="text-sm font-bold text-white uppercase mb-1">HAPUS UNIT DARI DAFTAR?</h3>
              <p className="text-xs text-slate-300 font-sans mb-1">
                Apakah Anda yakin ingin memutuskan tautan dengan <b className="text-white font-mono">{deleteConfirmMember.name}</b>?
              </p>
              {deleteConfirmMember.nik && (
                <p className="text-[10px] text-nerv-cyan font-mono mb-4">
                  NIK: {deleteConfirmMember.nik}
                </p>
              )}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    save(members.filter(m => m.id !== deleteConfirmMember.id))
                    setDeleteConfirmMember(null)
                  }}
                  className="flex-1 py-2.5 rounded bg-nerv-red hover:bg-red-600 text-white font-bold text-xs uppercase tracking-wider transition-colors"
                >
                  HAPUS UNIT
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteConfirmMember(null)}
                  className="px-4 py-2.5 rounded bg-black/60 border border-nerv-border text-slate-300 hover:text-white text-xs"
                >
                  BATAL
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {reciprocalPrompt && (
          <ReciprocalRoleModal
            prompt={reciprocalPrompt}
            onConfirm={handleConfirmReciprocalRole}
            onCancel={() => setReciprocalPrompt(null)}
          />
        )}
        {showQR && <MyQRModal onClose={() => setShowQR(false)} />}
        {showAdd && <AddMemberModal onClose={() => setShowAdd(false)} onAdd={handleAdd} />}
        {viewMember && <MemberMapModal member={viewMember} onClose={() => setViewMember(null)} />}
      </AnimatePresence>
    </>
  )
}
