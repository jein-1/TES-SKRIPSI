// FAMILY PAGE — My Family group + member location map
import { useState, useEffect, useRef, useCallback } from 'react'
import { UserPlus, AlertTriangle, CheckCircle, Clock, ChevronLeft, QrCode, Camera, X, Trash2, Share2, Radio, MapPin, Navigation2 } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import QRCode from 'qrcode'
import { useAegisSync, aegisApi } from '../../lib/useAegisSync'
import type { FamilyMember } from '../../types'

// ── Storage helpers ────────────────────────────────────────────
export function getMyAegisId(): string {
  let id = localStorage.getItem('aegisId')
  if (!id) { id = `AEGIS-${Date.now().toString(36).toUpperCase()}`; localStorage.setItem('aegisId', id) }
  return id
}
export function getMyName(): string { return localStorage.getItem('aegisUserName') ?? 'Pengguna' }
export function loadFamily(): FamilyMember[] {
  try { return JSON.parse(localStorage.getItem('aegisFamily') ?? '[]') } catch { return [] }
}
export function saveFamily(m: FamilyMember[]) { localStorage.setItem('aegisFamily', JSON.stringify(m)) }

// Member locations: { [memberId]: { lat, lng, ts } }
function loadMemberLocs(): Record<string, { lat: number; lng: number; ts: number }> {
  try { return JSON.parse(localStorage.getItem('aegisMemberLocs') ?? '{}') } catch { return {} }
}
function saveMemberLoc(id: string, lat: number, lng: number) {
  const locs = loadMemberLocs()
  locs[id] = { lat, lng, ts: Date.now() }
  localStorage.setItem('aegisMemberLocs', JSON.stringify(locs))
}

// ── Status chip ───────────────────────────────────────────────
function StatusChip({ status }: { status: FamilyMember['status'] }) {
  if (status === 'safe') return <div className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-emerald-400"/><span className="text-[10px] font-black text-emerald-400">SAFE</span></div>
  if (status === 'danger') return <div className="flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-red-400 animate-pulse"/><span className="text-[10px] font-black text-red-400">DANGER</span></div>
  return <div className="flex items-center gap-1"><Clock className="w-3 h-3 text-slate-500"/><span className="text-[10px] font-black text-slate-500">UNKNOWN</span></div>
}

// ── Member Location Map Modal ─────────────────────────────────
const memberIcon = L.divIcon({
  className: '',
  html: `<div style="width:14px;height:14px;border-radius:50%;background:#6366f1;border:2.5px solid white;box-shadow:0 0 10px rgba(99,102,241,0.8)"></div>`,
  iconSize: [14, 14], iconAnchor: [7, 7],
})

function MemberMapModal({ member, onClose }: { member: FamilyMember; onClose: () => void }) {
  const locs = loadMemberLocs()
  const loc = locs[member.id]
  const PALU: [number, number] = [-0.8917, 119.8577]
  const center: [number, number] = loc ? [loc.lat, loc.lng] : PALU

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
        className="w-full max-w-sm rounded-3xl border border-slate-700/50 overflow-hidden" style={{ background: '#0f1a2e' }}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/40">
          <div>
            <p className="text-[10px] text-indigo-400 uppercase tracking-widest font-bold">Lokasi Anggota</p>
            <p className="text-base font-black text-white">{member.name}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center">
            <X className="w-4 h-4 text-slate-400"/>
          </button>
        </div>
        <div className="h-64 relative">
          <MapContainer center={center} zoom={loc ? 15 : 12} zoomControl={false} attributionControl={false}
            className="w-full h-full">
            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" maxNativeZoom={20} maxZoom={20}/>
            {loc && (
              <Marker position={[loc.lat, loc.lng]} icon={memberIcon}>
                <Popup><span className="text-xs font-bold">{member.name}</span></Popup>
              </Marker>
            )}
          </MapContainer>
          {!loc && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#060d1a]/80 pointer-events-none">
              <MapPin className="w-8 h-8 text-slate-500 mb-2"/>
              <p className="text-slate-400 text-sm font-bold">Lokasi belum tersedia</p>
              <p className="text-slate-600 text-[11px] mt-1">Anggota belum membagikan lokasi</p>
            </div>
          )}
        </div>
        {loc && (
          <div className="px-4 py-3 border-t border-slate-700/40">
            <p className="text-[10px] text-slate-500">Koordinat: <span className="text-slate-300 font-mono">{loc.lat.toFixed(5)}, {loc.lng.toFixed(5)}</span></p>
            <p className="text-[10px] text-slate-600 mt-0.5">
              Diperbarui: {new Date(loc.ts).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              {' · '}<span className="text-emerald-500">Tersimpan offline</span>
            </p>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

// ── My QR Modal ───────────────────────────────────────────────
function MyQRModal({ onClose }: { onClose: () => void }) {
  const aegisId = getMyAegisId(); const myName = getMyName()
  const [qrUrl, setQrUrl] = useState('')
  const inviteUrl = `${window.location.origin}${window.location.pathname}?joinFamily=${encodeURIComponent(aegisId)}&inviteName=${encodeURIComponent(myName)}`
  useEffect(() => {
    QRCode.toDataURL(inviteUrl, { width: 220, margin: 2, color: { dark: '#ffffff', light: '#0f1a2e' } }).then(setQrUrl)
  }, [inviteUrl])
  const share = async () => {
    if (navigator.share) await navigator.share({ title: 'Aegis Family Invite', url: inviteUrl })
    else { await navigator.clipboard.writeText(inviteUrl); alert('Link disalin!') }
  }
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 p-6 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
        className="w-full max-w-xs p-6 rounded-3xl border border-slate-700/50 relative" style={{ background: '#0f1a2e' }}>
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center"><X className="w-4 h-4 text-slate-400"/></button>
        <div className="text-center">
          <p className="text-[10px] text-indigo-400 uppercase tracking-widest font-bold mb-1">QR Code Saya</p>
          <p className="text-lg font-black text-white mb-4">{myName}</p>
          {qrUrl ? <img src={qrUrl} alt="QR" className="mx-auto rounded-2xl w-48 h-48"/> : <div className="mx-auto w-48 h-48 rounded-2xl bg-slate-800 flex items-center justify-center"><QrCode className="w-12 h-12 text-slate-600"/></div>}
          <p className="text-[9px] text-slate-500 mt-2 font-mono break-all">{aegisId}</p>
          <p className="text-[11px] text-slate-400 mt-2">Scan QR ini untuk bergabung ke Family.</p>
          <button onClick={share} className="mt-4 w-full py-3 rounded-2xl bg-indigo-600 text-white font-black text-sm flex items-center justify-center gap-2">
            <Share2 className="w-4 h-4"/> Bagikan Link / QR
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Add Member Modal (QR scan) ────────────────────────────────
function AddMemberModal({ onClose, onAdd }: { onClose: () => void; onAdd: (m: FamilyMember) => void }) {
  const [scanning, setScanning] = useState(false)
  const [camErr, setCamErr] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef(0)

  const stopCam = () => {
    cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setScanning(false)
  }
  useEffect(() => () => stopCam(), [])

  const startCam = async () => {
    setCamErr(''); setScanning(true)
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamRef.current = s
      if (videoRef.current) { videoRef.current.srcObject = s; await videoRef.current.play(); scanLoop() }
    } catch { setCamErr('Izin kamera ditolak.'); setScanning(false) }
  }

  const scanLoop = () => {
    const v = videoRef.current; const c = canvasRef.current
    if (!v || !c || v.readyState < 2) { rafRef.current = requestAnimationFrame(scanLoop); return }
    c.width = v.videoWidth; c.height = v.videoHeight
    c.getContext('2d')?.drawImage(v, 0, 0)
    import('jsqr').then(({ default: jsQR }) => {
      const id = c.getContext('2d')?.getImageData(0, 0, c.width, c.height)
      if (!id) { rafRef.current = requestAnimationFrame(scanLoop); return }
      const code = jsQR(id.data, id.width, id.height)
      if (code?.data) {
        try {
          const url = new URL(code.data)
          const joinId = url.searchParams.get('joinFamily')
          const joinName = url.searchParams.get('inviteName')
          if (joinId && joinName) {
            stopCam()
            const newMember: FamilyMember = {
              id: joinId, name: joinName, role: 'Anggota Keluarga',
              initials: joinName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase(),
              status: 'safe', location: 'Terdeteksi via QR', updatedAgo: 'baru saja',
            }
            onAdd(newMember)
            aegisApi.notifyFamilyJoin(getMyAegisId(), getMyName(), joinId)
            onClose()
            return
          }
        } catch { }
      }
      rafRef.current = requestAnimationFrame(scanLoop)
    }).catch(() => { rafRef.current = requestAnimationFrame(scanLoop) })
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[2000] flex items-end justify-center bg-black/80 backdrop-blur-sm">
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full max-w-sm rounded-t-3xl border border-slate-700/50 p-5" style={{ background: '#0f1a2e' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-black text-white">Tambah via Scan QR</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center"><X className="w-4 h-4 text-slate-400"/></button>
        </div>
        <p className="text-[11px] text-slate-400 mb-3">Scan QR Code milik anggota keluarga untuk menambahkannya ke grup <span className="text-white font-bold">My Family</span>.</p>
        {camErr && <p className="text-red-400 text-[11px] text-center mb-2">{camErr}</p>}
        <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-slate-900 border border-slate-700/40">
          <video ref={videoRef} className="w-full h-full object-cover" playsInline muted/>
          <canvas ref={canvasRef} className="hidden"/>
          {!scanning && !camErr && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <Camera className="w-10 h-10 text-slate-600"/>
              <p className="text-slate-500 text-sm">Kamera belum aktif</p>
            </div>
          )}
          {scanning && <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><div className="w-40 h-40 border-2 border-indigo-400/60 rounded-xl"/></div>}
        </div>
        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="flex-1 py-3 rounded-2xl bg-slate-700/60 text-slate-300 font-bold text-sm">Batal</button>
          {!scanning
            ? <button onClick={startCam} className="flex-1 py-3 rounded-2xl bg-indigo-600 text-white font-black text-sm flex items-center justify-center gap-2"><Camera className="w-4 h-4"/> Buka Kamera</button>
            : <button onClick={stopCam} className="flex-1 py-3 rounded-2xl bg-slate-700 text-white font-bold text-sm">Stop Kamera</button>
          }
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Main FamilyPage ───────────────────────────────────────────
interface Props { onBack?: () => void }

export default function FamilyPage({ onBack }: Props) {
  const myId = getMyAegisId()
  const [members, setMembers] = useState<FamilyMember[]>(loadFamily)
  const [showQR, setShowQR] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [viewMember, setViewMember] = useState<FamilyMember | null>(null)
  const [pinging, setPinging] = useState(false)
  const [pingBanner, setPingBanner] = useState('')

  const save = useCallback((m: FamilyMember[]) => { setMembers(m); saveFamily(m) }, [])

  // Broadcast my location to all members
  useEffect(() => {
    if (!navigator.geolocation) return
    const w = navigator.geolocation.watchPosition(pos => {
      const { latitude: lat, longitude: lng } = pos.coords
      // Save own location tagged as self (for others to see me when I join their family)
      saveMemberLoc(myId, lat, lng)
      // Broadcast via server if online
      fetch('/api/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: myId, name: getMyName(), lat, lng }),
      }).catch(() => { /* offline — already saved to localStorage */ })
    }, () => {}, { enableHighAccuracy: true })
    return () => navigator.geolocation.clearWatch(w)
  }, [myId])

  // SSE events
  useAegisSync((event) => {
    if (event.type === 'FAMILY_JOIN' && event.toId === myId) {
      const fromId = event.fromId as string
      const fromName = event.fromName as string
      const current = loadFamily()
      if (!current.some(m => m.id === fromId)) {
        const updated = [...current, {
          id: fromId, name: fromName, role: 'Anggota Keluarga',
          initials: fromName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase(),
          status: 'safe' as const, location: 'Bergabung via QR scan', updatedAgo: 'baru saja',
        }]
        save(updated)
      }
    }
    if (event.type === 'LOCATION_UPDATE') {
      const { id, lat, lng } = event as { id: string; lat: number; lng: number }
      if (id && lat && lng) saveMemberLoc(id, lat, lng)
    }
    if (event.type === 'PING' && event.fromId !== myId) {
      if ('vibrate' in navigator) navigator.vibrate([300, 100, 300])
      setPingBanner(`📡 Ping dari ${event.fromName as string}`)
      setTimeout(() => { aegisApi.pingReply(myId, getMyName(), event.fromId as string); setPingBanner('') }, 1500)
    }
    if (event.type === 'PING_REPLY' && event.toId === myId) {
      const current = loadFamily()
      save(current.map(m => m.id === event.fromId ? { ...m, status: 'safe' as const, updatedAgo: 'baru saja' } : m))
      setPingBanner(`✅ ${event.fromName as string} membalas ping!`)
      setTimeout(() => setPingBanner(''), 2500)
    }
  })

  // URL invite on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const joinId = params.get('joinFamily'); const joinName = params.get('inviteName')
    if (joinId && joinName) {
      const current = loadFamily()
      if (!current.some(m => m.id === joinId)) {
        save([...current, { id: joinId, name: joinName, role: 'Anggota Keluarga',
          initials: joinName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
          status: 'safe', location: 'Bergabung via link', updatedAgo: 'baru saja' }])
      }
      aegisApi.notifyFamilyJoin(myId, getMyName(), joinId)
      const url = new URL(window.location.href)
      url.searchParams.delete('joinFamily'); url.searchParams.delete('inviteName')
      window.history.replaceState({}, '', url.toString())
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleAdd = (m: FamilyMember) => save([...members, m])
  const handleDelete = (id: string) => { if (confirm(`Hapus anggota ini dari My Family?`)) save(members.filter(m => m.id !== id)) }

  const handlePing = () => {
    setPinging(true)
    if ('vibrate' in navigator) navigator.vibrate([100, 50, 100])
    aegisApi.ping(myId, getMyName())
    setTimeout(() => setPinging(false), 3000)
  }

  const locs = loadMemberLocs()

  return (
    <>
    <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }}
      className="fixed inset-0 z-[1800] flex flex-col overflow-y-auto" style={{ background: '#080e1a' }}>

      {/* Header */}
      <div className="shrink-0 px-4 pt-4 pb-3 border-b border-slate-800/60 flex items-center gap-3" style={{ background: '#0a1020' }}>
        {onBack && <button onClick={onBack} className="w-8 h-8 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center shrink-0"><ChevronLeft className="w-4 h-4 text-slate-400"/></button>}
        <div className="flex-1">
          {/* Fixed group name — cannot be renamed */}
          <h2 className="text-xl font-black text-white">My Family</h2>
          <p className="text-[10px] text-slate-400">
            {members.length > 0 ? <><span className="text-emerald-400 font-bold">{members.length} anggota</span> dalam grup</> : 'Grup kosong'}
          </p>
        </div>
        <button onClick={() => setShowQR(true)} className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
          <QrCode className="w-4 h-4 text-indigo-400"/>
        </button>
      </div>

      {/* Ping banner */}
      <AnimatePresence>
        {pingBanner && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="shrink-0 px-4 py-2 bg-emerald-900/40 border-b border-emerald-700/30 text-center">
            <p className="text-[11px] font-black text-emerald-300">{pingBanner}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 px-4 py-4 space-y-3 pb-24">
        {/* Ping button */}
        {members.length > 0 && (
          <button onClick={handlePing}
            className={`w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 border ${pinging ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300' : 'bg-indigo-600 border-indigo-500/50 text-white'}`}>
            <Radio className={`w-4 h-4 ${pinging ? 'animate-pulse' : ''}`}/>
            {pinging ? 'MENGIRIM PING...' : 'PING ALL MEMBERS'}
          </button>
        )}

        {/* Empty state */}
        {members.length === 0 && (
          <div className="py-10 text-center">
            <div className="w-20 h-20 rounded-2xl bg-slate-800/60 border border-slate-700/40 flex items-center justify-center mx-auto mb-4"><span className="text-3xl">👨‍👩‍👧‍👦</span></div>
            <h3 className="text-white font-black mb-2">My Family Kosong</h3>
            <p className="text-slate-500 text-sm">Tambahkan anggota keluarga dengan scan QR mereka.</p>
          </div>
        )}

        {/* Member cards */}
        {members.map((m, i) => {
          const hasLoc = !!locs[m.id]
          return (
            <motion.div key={m.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className={`p-4 rounded-2xl border ${m.status === 'danger' ? 'border-red-500/40' : 'border-slate-700/40'}`}
              style={{ background: m.status === 'danger' ? '#150808' : '#0f1a2e' }}>
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white border shrink-0 ${m.status === 'danger' ? 'bg-red-600/30 border-red-500/40' : 'bg-indigo-600/30 border-indigo-500/40'}`}>
                  {m.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white">{m.name}</p>
                  <p className="text-[10px] text-slate-500">{m.role}</p>
                  <div className="mt-0.5"><StatusChip status={m.status}/></div>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  {/* View location button */}
                  <button onClick={() => setViewMember(m)}
                    className={`p-1.5 rounded-lg flex items-center gap-1 ${hasLoc ? 'bg-emerald-600/20 border border-emerald-600/30' : 'bg-slate-700/60'}`}
                    title={hasLoc ? 'Lihat lokasi' : 'Lokasi belum tersedia'}>
                    <Navigation2 className={`w-3.5 h-3.5 ${hasLoc ? 'text-emerald-400' : 'text-slate-500'}`}/>
                  </button>
                  <button onClick={() => handleDelete(m.id)} className="p-1.5 rounded-lg bg-slate-700/60 text-slate-400"><Trash2 className="w-3 h-3"/></button>
                </div>
              </div>
              <div className="flex justify-between mt-2">
                <p className="text-[10px] text-slate-400">
                  {hasLoc ? <span className="text-emerald-500">📍 Lokasi tersedia (offline)</span> : '📍 Lokasi belum dibagikan'}
                </p>
                <div className="flex items-center gap-1"><Clock className="w-3 h-3 text-slate-500"/><span className="text-[10px] text-slate-500">{m.updatedAgo}</span></div>
              </div>
            </motion.div>
          )
        })}

        {/* Add member button */}
        <button onClick={() => setShowAdd(true)}
          className="w-full p-4 rounded-2xl border border-dashed border-slate-700/40 flex items-center justify-center gap-2 text-slate-400 hover:border-slate-600 transition-colors">
          <UserPlus className="w-5 h-5"/><span className="text-sm font-bold">Tambah Anggota</span>
        </button>

        {/* Info card */}
        <div className="p-4 rounded-2xl border border-slate-700/30" style={{ background: '#0a1020' }}>
          <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mb-1">ℹ️ Tentang Lokasi Offline</p>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Lokasi anggota disimpan di perangkat Anda. Saat online, lokasi diperbarui otomatis via SSE.
            Saat offline, lokasi terakhir yang tersimpan tetap bisa dilihat di peta.
          </p>
        </div>
      </div>
    </motion.div>

    <AnimatePresence>
      {showQR && <MyQRModal onClose={() => setShowQR(false)}/>}
      {showAdd && <AddMemberModal onClose={() => setShowAdd(false)} onAdd={handleAdd}/>}
      {viewMember && <MemberMapModal member={viewMember} onClose={() => setViewMember(null)}/>}
    </AnimatePresence>
    </>
  )
}
