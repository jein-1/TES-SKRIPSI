// ═══════════════════════════════════════════════════════════════
// FAMILY PAGE — NERV Tactical Personnel Directory & Location Telemetry
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
import type { FamilyMember } from '../../types'

// ── Storage helpers ────────────────────────────────────────────
export function getMyAegisId(): string {
  let id = localStorage.getItem('atlasId') || localStorage.getItem('aegisId')
  if (id) {
    id = id.replace(/^(AEGIS|ATLAS)-?/i, 'A.T.L.A.S-')
  } else {
    id = `A.T.L.A.S-${Date.now().toString(36).toUpperCase()}`
  }
  localStorage.setItem('atlasId', id)
  localStorage.setItem('aegisId', id)
  return id
}

export function getMyName(): string {
  return localStorage.getItem('aegisUserName') ?? 'Personnel-01'
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

// ── NERV Status chip ───────────────────────────────────────────
function StatusChip({ status }: { status: FamilyMember['status'] }) {
  if (status === 'safe') {
    return (
      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-nerv-green/10 border border-nerv-green/30">
        <CheckCircle className="w-3 h-3 text-nerv-green" />
        <span className="text-[9px] font-mono font-bold tracking-wider text-nerv-green uppercase">
          SECURE // AMAN
        </span>
      </div>
    )
  }
  if (status === 'danger') {
    return (
      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-nerv-red/10 border border-nerv-red/50 animate-pulse">
        <AlertTriangle className="w-3 h-3 text-nerv-red" />
        <span className="text-[9px] font-mono font-bold tracking-wider text-nerv-red uppercase">
          HAZARD // BAHAYA
        </span>
      </div>
    )
  }
  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/40 border border-nerv-border">
      <Clock className="w-3 h-3 text-slate-500" />
      <span className="text-[9px] font-mono font-bold tracking-wider text-slate-400 uppercase">
        STANDBY // MENUNGGU
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

  const baseOrigin = (typeof window !== 'undefined' && !window.location.origin.includes('localhost') && !window.location.origin.includes('127.0.0.1'))
    ? window.location.origin
    : (import.meta.env.VITE_PUBLIC_URL || 'https://tsunami-dimss.vercel.app');
  const inviteUrl = `${baseOrigin}/?joinFamily=${encodeURIComponent(atlasId)}&inviteName=${encodeURIComponent(myName)}&code=${verifyCode}`

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
            {atlasId}
          </p>

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

// ── Add Member Modal (QR scan + Gallery upload + 2-Way Code Verification) ──
function AddMemberModal({ onClose, onAdd }: { onClose: () => void; onAdd: (m: FamilyMember) => void }) {
  const [scanning, setScanning] = useState(false)
  const [camErr, setCamErr] = useState('')
  const [galleryErr, setGalleryErr] = useState('')
  const [galleryLoading, setGalleryLoading] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef(0)

  // Verification Challenge State
  const [pendingMember, setPendingMember] = useState<{
    id: string
    name: string
    expectedCode: string
  } | null>(null)
  const [enteredCode, setEnteredCode] = useState('')
  const [verifyErr, setVerifyErr] = useState('')
  const [verifySuccess, setVerifySuccess] = useState(false)

  const stopCam = () => {
    cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setScanning(false)
  }

  useEffect(() => () => stopCam(), [])

  const processQRData = (data: string): boolean => {
    try {
      const url = new URL(data)
      const joinId = url.searchParams.get('joinFamily')
      const joinName = url.searchParams.get('inviteName')
      const code = url.searchParams.get('code') || url.searchParams.get('verifyCode') || ''
      if (joinId && joinName) {
        stopCam()
        setPendingMember({
          id: joinId,
          name: joinName,
          expectedCode: code.trim(),
        })
        setEnteredCode('')
        setVerifyErr('')
        return true
      }
    } catch { }
    return false
  }

  const handleVerifyAndLink = () => {
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

    // Match success!
    setVerifySuccess(true)
    setTimeout(() => {
      const newMember: FamilyMember = {
        id: pendingMember.id,
        name: pendingMember.name,
        role: 'Unit Personel',
        initials: pendingMember.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase(),
        status: 'safe',
        location: 'Terverifikasi via QR',
        updatedAgo: 'baru saja',
      }
      onAdd(newMember)
      aegisApi.notifyFamilyJoin(getMyAegisId(), getMyName(), pendingMember.id)
      onClose()
    }, 1000)
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

        {/* STEP 2: VERIFICATION CHALLENGE */}
        {pendingMember ? (
          <div className="font-mono space-y-3">
            <div className="p-3 rounded-lg bg-black/60 border border-nerv-cyan/50 text-center">
              <span className="text-[9px] text-slate-400 uppercase block">TARGET UNIT TERDETEKSI</span>
              <span className="text-sm font-bold text-nerv-cyan block truncate">{pendingMember.name}</span>
              <span className="text-[9px] text-slate-500 block">ID: #{pendingMember.id.slice(0, 10)}</span>
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
                ✓ KODE COCOK! UNIT BERHASIL DITAUTKAN...
              </p>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleVerifyAndLink}
                disabled={verifySuccess || enteredCode.length < 6}
                className="flex-1 py-2.5 rounded bg-nerv-cyan hover:bg-cyan-400 disabled:opacity-40 text-black font-mono font-bold text-xs uppercase tracking-wider transition-colors shadow-[0_0_12px_rgba(0,229,255,0.4)]"
              >
                VERIFIKASI & TAUTKAN
              </button>
              <button
                type="button"
                onClick={() => {
                  setPendingMember(null)
                  setEnteredCode('')
                  setVerifyErr('')
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

            <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black border border-nerv-border mb-3">
              <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
              <canvas ref={canvasRef} className="hidden" />

              {!scanning && !camErr && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                  <Camera className="w-8 h-8 text-slate-600" />
                  <button
                    onClick={startCam}
                    className="px-3 py-1.5 rounded bg-nerv-cyan/20 border border-nerv-cyan text-nerv-cyan font-mono font-bold text-xs hover:bg-nerv-cyan/30 transition-colors"
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

// ── Main FamilyPage ───────────────────────────────────────────
interface Props {
  onBack: () => void
  onPingClear?: () => void
}

export default function FamilyPage({ onBack, onPingClear }: Props) {
  const myId = getMyAegisId()
  const [members, setMembers] = useState<FamilyMember[]>(loadFamily)
  const [showQR, setShowQR] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [viewMember, setViewMember] = useState<FamilyMember | null>(null)
  const [pinging, setPinging] = useState(false)
  const [pingBanner, setPingBanner] = useState('')
  const [incomingPing, setIncomingPing] = useState<{ fromId: string; fromName: string } | null>(null)
  const alarmRef = useRef<HTMLAudioElement | null>(null)
  const familyPingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    onPingClear?.()
    alarmRef.current = new Audio("/alarm.mp3")
    alarmRef.current.loop = true
    return () => alarmRef.current?.pause()
  }, [onPingClear])

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
              aegisApi.broadcastLocation(myId, getMyName(), deviceInfo, lat, lng, 100).catch(() => {})
            },
            () => {},
            { enableHighAccuracy: false, timeout: 6000 }
          )
        }
        watchId = await Geolocation.watchPosition({ enableHighAccuracy: true }, (pos, err) => {
          if (err || !pos) return
          const { latitude: lat, longitude: lng } = pos.coords
          saveMemberLoc(myId, lat, lng)
          const deviceInfo = (window as any).__DEVICE_MODEL__ || navigator.userAgent
          aegisApi.broadcastLocation(myId, getMyName(), deviceInfo, lat, lng, 100).catch(() => {})
        })
      } catch (e) {
        console.warn("Family GPS error", e)
      }
    }
    startWatch()
    return () => {
      if (watchId) Geolocation.clearWatch({ id: watchId }).catch(() => {})
    }
  }, [myId])

  // Real-time synchronization events
  useAegisSync((event) => {
    if (event.type === 'FAMILY_JOIN' && event.toId === myId) {
      const fromId = event.fromId as string
      const fromName = event.fromName as string
      const current = loadFamily()
      if (!current.some(m => m.id === fromId)) {
        const updated = [...current, {
          id: fromId,
          name: fromName,
          role: 'Unit Personel',
          initials: fromName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase(),
          status: 'safe' as const,
          location: 'Bergabung via QR scan',
          updatedAgo: 'baru saja',
        }]
        save(updated)
      }
    }
    if (event.type === 'LOCATION_UPDATE') {
      const id = event.id as string
      const lat = event.lat as number
      const lng = event.lng as number
      if (id && lat && lng) saveMemberLoc(id, lat, lng)
    }
    if (event.type === 'PING' && event.fromId !== myId) {
      if (!event.role) {
        setIncomingPing({ fromId: event.fromId as string, fromName: event.fromName as string })
      }
    }
    if (event.type === 'PING_REPLY' && event.toId === myId) {
      const current = loadFamily()
      save(current.map(m => m.id === event.fromId ? { ...m, status: 'safe' as const, updatedAgo: 'baru saja' } : m))
      setPingBanner(`${event.fromName} merespons: SAYA AMAN ✓`)
      setTimeout(() => setPingBanner(''), 4000)
    }
  })

  const handleAdd = (m: FamilyMember) => {
    const updated = [...members.filter(x => x.id !== m.id), m]
    save(updated)
  }

  const handleDelete = (id: string) => {
    if (!confirm('Hapus personel ini dari grup unit?')) return
    save(members.filter(m => m.id !== id))
  }

  const handlePing = () => {
    setPinging(true)
    if ('vibrate' in navigator) navigator.vibrate([100, 50, 100])
    aegisApi.ping(myId, getMyName())
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
        {/* NERV Telemetry Header */}
        <div className="shrink-0 px-4 pt-4 pb-3 border-b border-nerv-border bg-[#0B0F19] flex items-center justify-between">
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
                LINKED FAMILY UNITS [{members.length}]
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowQR(true)}
              className="px-2.5 py-1.5 rounded bg-black/60 border border-nerv-border hover:border-nerv-cyan flex items-center gap-1.5 font-mono text-xs text-nerv-cyan transition-colors"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold">MY QR</span>
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
              {pinging ? 'TRANSMITTING SIGNAL TO ALL UNITS...' : 'BROADCAST PING TO ALL UNITS'}
            </button>
          )}

          {/* Empty state */}
          {members.length === 0 && (
            <div className="py-12 text-center border border-dashed border-nerv-border rounded-lg bg-nerv-card/50 p-6">
              <div className="w-16 h-16 rounded-lg bg-black/60 border border-nerv-border flex items-center justify-center mx-auto mb-3">
                <Shield className="w-8 h-8 text-nerv-cyan/60" />
              </div>
              <h3 className="text-white font-mono font-bold text-sm mb-1 uppercase tracking-wider">
                TIDAK ADA PERSONEL TERTAUT
              </h3>
              <p className="text-slate-400 text-xs font-sans max-w-xs mx-auto mb-4">
                Hubungkan anggota keluarga ke jaringan darurat A.T.L.A.S dengan memindai kode QR.
              </p>
              <button
                onClick={() => setShowAdd(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded bg-nerv-cyan/20 border border-nerv-cyan text-nerv-cyan font-mono text-xs font-bold hover:bg-nerv-cyan/30 transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" /> TAUTKAN ANGGOTA SEKARANG
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
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-mono font-bold text-white truncate">{m.name}</p>
                      <span className="text-[8px] font-mono text-slate-500 uppercase px-1 rounded bg-black/40 border border-nerv-border">
                        {m.role || 'PERSONNEL'}
                      </span>
                    </div>
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
                      onClick={() => handleDelete(m.id)}
                      className="p-2 rounded border border-nerv-border bg-black/40 text-slate-500 hover:text-nerv-red hover:border-nerv-red/50 transition-colors"
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
                  <div className="flex items-center gap-1 text-slate-500 text-[9px]">
                    <Clock className="w-3 h-3" />
                    <span>{m.updatedAgo}</span>
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
                <div className="w-14 h-14 bg-nerv-orange/20 rounded-full flex items-center justify-center mb-3 border border-nerv-orange">
                  <Radio className="w-7 h-7 text-nerv-orange animate-ping" />
                </div>
                <p className="text-[10px] text-nerv-orange font-bold uppercase tracking-widest mb-1">
                  TACTICAL EMERGENCY PING
                </p>
                <h2 className="text-base font-bold text-white mb-2">PANGGILAN DARI UNIT</h2>
                <p className="text-xs text-slate-300 mb-5 font-sans leading-relaxed">
                  <b className="text-white font-mono">{incomingPing.fromName}</b> mengirimkan sinyal darurat. Segera
                  kirimkan konfirmasi keselamatan Anda.
                </p>
                <button
                  onClick={() => {
                    aegisApi.pingReply(myId, getMyName(), incomingPing.fromId)
                    setIncomingPing(null)
                  }}
                  className="w-full py-3.5 bg-nerv-orange hover:bg-orange-600 text-black rounded font-mono font-bold text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(255,87,34,0.5)] transition-all"
                >
                  KONFIRMASI: SAYA AMAN ✓
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showQR && <MyQRModal onClose={() => setShowQR(false)} />}
        {showAdd && <AddMemberModal onClose={() => setShowAdd(false)} onAdd={handleAdd} />}
        {viewMember && <MemberMapModal member={viewMember} onClose={() => setViewMember(null)} />}
      </AnimatePresence>
    </>
  )
}
