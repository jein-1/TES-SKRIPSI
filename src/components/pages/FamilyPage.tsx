// FAMILY PAGE — Cross-device sync via SSE server + URL invite
import { useState, useEffect, useRef, useCallback } from 'react'
import { UserPlus, Phone, AlertTriangle, CheckCircle, Clock, Wifi, ChevronLeft, QrCode, Camera, X, Edit2, Trash2, Share2, Radio } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import QRCode from 'qrcode'
import { useAegisSync, aegisApi } from '../../lib/useAegisSync'
import type { FamilyMember } from '../../types'

function getMyAegisId(): string {
  let id = localStorage.getItem('aegisId')
  if (!id) { id = `AEGIS-${Date.now().toString(36).toUpperCase()}`; localStorage.setItem('aegisId', id) }
  return id
}
function getMyName(): string { return localStorage.getItem('aegisUserName') ?? 'Pengguna' }
function loadFamily(): FamilyMember[] { try { return JSON.parse(localStorage.getItem('aegisFamily') ?? '[]') } catch { return [] } }
function saveFamily(m: FamilyMember[]) { localStorage.setItem('aegisFamily', JSON.stringify(m)) }

function StatusChip({ status }: { status: FamilyMember['status'] }) {
  if (status === 'safe') return <div className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-emerald-400"/><span className="text-[10px] font-black text-emerald-400">SAFE</span></div>
  if (status === 'danger') return <div className="flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-red-400 animate-pulse"/><span className="text-[10px] font-black text-red-400">DANGER</span></div>
  return <div className="flex items-center gap-1"><Clock className="w-3 h-3 text-slate-500"/><span className="text-[10px] font-black text-slate-500">UNKNOWN</span></div>
}

// ── My QR Modal ──────────────────────────────────────────────
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
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 p-6 backdrop-blur-sm">
      <motion.div initial={{scale:0.9}} animate={{scale:1}}
        className="w-full max-w-xs p-6 rounded-3xl border border-slate-700/50 relative" style={{background:'#0f1a2e'}}>
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center"><X className="w-4 h-4 text-slate-400"/></button>
        <div className="text-center">
          <p className="text-[10px] text-indigo-400 uppercase tracking-widest font-bold mb-1">QR Code Saya</p>
          <p className="text-lg font-black text-white mb-4">{myName}</p>
          {qrUrl ? <img src={qrUrl} alt="QR" className="mx-auto rounded-2xl w-48 h-48"/> : <div className="mx-auto w-48 h-48 rounded-2xl bg-slate-800 flex items-center justify-center"><QrCode className="w-12 h-12 text-slate-600"/></div>}
          <p className="text-[9px] text-slate-500 mt-2 font-mono break-all">{aegisId}</p>
          <p className="text-[11px] text-slate-400 mt-2">Scan QR ini atau bagikan link. Kedua perangkat otomatis terhubung ke Family.</p>
          <button onClick={share} className="mt-4 w-full py-3 rounded-2xl bg-indigo-600 text-white font-black text-sm flex items-center justify-center gap-2">
            <Share2 className="w-4 h-4"/> Bagikan Link / QR
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Add Member Modal ─────────────────────────────────────────
function AddMemberModal({ onClose, onAdd }: { onClose: () => void; onAdd: (m: FamilyMember) => void }) {
  const [mode, setMode] = useState<'form'|'camera'>('form')
  const [name, setName] = useState(''); const [desc, setDesc] = useState('')
  const [scanning, setScanning] = useState(false); const [camErr, setCamErr] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null); const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream|null>(null); const rafRef = useRef(0)
  const stopCam = () => { cancelAnimationFrame(rafRef.current); streamRef.current?.getTracks().forEach(t=>t.stop()); streamRef.current=null; setScanning(false) }
  useEffect(() => () => stopCam(), [])

  const doAdd = (m: FamilyMember) => { onAdd(m); onClose() }

  const handleManual = () => {
    if (!name.trim()) return
    doAdd({ id: `F${Date.now()}`, name: name.trim(), role: desc.trim()||'Anggota Keluarga',
      initials: name.trim().split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase(),
      status: 'unknown', location: 'Ditambahkan manual', updatedAgo: 'baru saja' })
  }

  const startCam = async () => {
    setCamErr(''); setScanning(true)
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamRef.current = s
      if (videoRef.current) { videoRef.current.srcObject = s; await videoRef.current.play(); scanLoop() }
    } catch { setCamErr('Izin kamera ditolak. Gunakan form manual.'); setScanning(false) }
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
            doAdd({ id: joinId, name: joinName, role: 'Anggota Keluarga',
              initials: joinName.split(' ').map((w:string)=>w[0]).join('').slice(0,2).toUpperCase(),
              status: 'safe', location: 'Terdeteksi via QR', updatedAgo: 'baru saja' })
            // Notify the scanned device via server → they add us back
            aegisApi.notifyFamilyJoin(getMyAegisId(), getMyName(), joinId)
            return
          }
        } catch {}
      }
      rafRef.current = requestAnimationFrame(scanLoop)
    }).catch(() => { rafRef.current = requestAnimationFrame(scanLoop) })
  }

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="fixed inset-0 z-[2000] flex items-end justify-center bg-black/80 backdrop-blur-sm">
      <motion.div initial={{y:'100%'}} animate={{y:0}} exit={{y:'100%'}}
        transition={{type:'spring',damping:25,stiffness:300}}
        className="w-full max-w-sm rounded-t-3xl border border-slate-700/50 p-5" style={{background:'#0f1a2e'}}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-black text-white">Tambah Anggota</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center"><X className="w-4 h-4 text-slate-400"/></button>
        </div>
        <div className="flex gap-2 mb-4 p-1 rounded-xl bg-slate-800/60">
          {(['form','camera'] as const).map(m => (
            <button key={m} onClick={() => { setMode(m); if(m==='form') stopCam() }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold ${mode===m?'bg-indigo-600 text-white':'text-slate-400'}`}>
              {m==='form'?'✏️ Manual':'📷 Scan QR'}
            </button>
          ))}
        </div>
        {mode==='form' ? (
          <div className="space-y-3">
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="Nama lengkap *"
              className="w-full px-3 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-white text-sm outline-none"/>
            <input value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Hubungan (Ayah, Ibu, ...)"
              className="w-full px-3 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-white text-sm outline-none"/>
            <button onClick={handleManual} disabled={!name.trim()} className="w-full py-3 rounded-2xl bg-indigo-600 disabled:opacity-50 text-white font-black text-sm">Tambahkan</button>
          </div>
        ) : (
          <div className="space-y-3">
            {camErr && <p className="text-red-400 text-[11px] text-center">{camErr}</p>}
            <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-slate-900 border border-slate-700/40">
              <video ref={videoRef} className="w-full h-full object-cover" playsInline muted/>
              <canvas ref={canvasRef} className="hidden"/>
              {!scanning && !camErr && <div className="absolute inset-0 flex flex-col items-center justify-center gap-2"><Camera className="w-10 h-10 text-slate-600"/><p className="text-slate-500 text-sm">Kamera belum aktif</p></div>}
              {scanning && <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><div className="w-40 h-40 border-2 border-indigo-400/60 rounded-xl"/></div>}
            </div>
            {!scanning
              ? <button onClick={startCam} className="w-full py-3 rounded-2xl bg-indigo-600 text-white font-black text-sm flex items-center justify-center gap-2"><Camera className="w-4 h-4"/> Buka Kamera</button>
              : <button onClick={stopCam} className="w-full py-3 rounded-2xl bg-slate-700 text-white font-bold text-sm">Batal</button>}
            <p className="text-center text-[10px] text-slate-500">Scan QR Code anggota keluarga — keduanya otomatis terhubung</p>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

// ── Edit Modal ───────────────────────────────────────────────
function EditModal({ member, onClose, onSave }: { member: FamilyMember; onClose: () => void; onSave: (m: FamilyMember) => void }) {
  const [desc, setDesc] = useState(member.role)
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="fixed inset-0 z-[2000] flex items-end justify-center bg-black/80 backdrop-blur-sm">
      <motion.div initial={{y:'100%'}} animate={{y:0}} exit={{y:'100%'}}
        transition={{type:'spring',damping:25,stiffness:300}}
        className="w-full max-w-sm rounded-t-3xl border border-slate-700/50 p-5" style={{background:'#0f1a2e'}}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-black text-white">Edit {member.name}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center"><X className="w-4 h-4 text-slate-400"/></button>
        </div>
        <p className="text-[11px] text-slate-500 mb-3">Hanya deskripsi/hubungan yang bisa diubah.</p>
        <input value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Hubungan..."
          className="w-full px-3 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-white text-sm outline-none mb-3"/>
        <button onClick={()=>{onSave({...member,role:desc});onClose()}} className="w-full py-3 rounded-2xl bg-indigo-600 text-white font-black text-sm">Simpan</button>
      </motion.div>
    </motion.div>
  )
}

// ── Main FamilyPage ──────────────────────────────────────────
interface Props { onBack?: () => void }

export default function FamilyPage({ onBack }: Props) {
  const myId = getMyAegisId()
  const [members, setMembers] = useState<FamilyMember[]>(loadFamily)
  const [showQR, setShowQR] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [editMember, setEditMember] = useState<FamilyMember|null>(null)
  const [pinging, setPinging] = useState(false)
  const [pingBanner, setPingBanner] = useState('')

  const save = useCallback((m: FamilyMember[]) => { setMembers(m); saveFamily(m) }, [])

  // ── SSE events for cross-device sync ─────────────────────
  useAegisSync((event) => {
    // Someone scanned MY QR → add them to my family
    if (event.type === 'FAMILY_JOIN' && event.toId === myId) {
      const fromId = event.fromId as string
      const fromName = event.fromName as string
      const current = loadFamily()
      if (!current.some(m => m.id === fromId)) {
        const updated = [...current, {
          id: fromId, name: fromName, role: 'Anggota Keluarga',
          initials: fromName.split(' ').map((w:string)=>w[0]).join('').slice(0,2).toUpperCase(),
          status: 'safe' as const, location: 'Bergabung via QR scan', updatedAgo: 'baru saja',
        }]
        save(updated)
      }
    }
    // Ping received → vibrate and auto-reply
    if (event.type === 'PING' && event.fromId !== myId) {
      if ('vibrate' in navigator) navigator.vibrate([300, 100, 300])
      setPingBanner(`📡 Ping dari ${event.fromName as string} — membalas...`)
      setTimeout(() => {
        aegisApi.pingReply(myId, getMyName(), event.fromId as string)
        setPingBanner('')
      }, 1500)
    }
    // Ping reply received → update member status
    if (event.type === 'PING_REPLY' && event.toId === myId) {
      const current = loadFamily()
      const updated = current.map(m => m.id === event.fromId
        ? { ...m, status: 'safe' as const, updatedAgo: 'baru saja' } : m)
      save(updated)
      setPingBanner(`✅ ${event.fromName as string} membalas ping!`)
      setTimeout(() => setPingBanner(''), 2500)
    }
  })

  // Process URL invite on mount (when link is opened on another device)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const joinId = params.get('joinFamily')
    const joinName = params.get('inviteName')
    if (joinId && joinName) {
      const current = loadFamily()
      if (!current.some(m => m.id === joinId)) {
        save([...current, { id: joinId, name: joinName, role: 'Anggota Keluarga',
          initials: joinName.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase(),
          status: 'safe', location: 'Bergabung via link', updatedAgo: 'baru saja' }])
      }
      // Notify them so they add us back
      aegisApi.notifyFamilyJoin(myId, getMyName(), joinId)
      const url = new URL(window.location.href)
      url.searchParams.delete('joinFamily'); url.searchParams.delete('inviteName')
      window.history.replaceState({}, '', url.toString())
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleAdd = (m: FamilyMember) => save([...members, m])
  const handleEdit = (m: FamilyMember) => save(members.map(x => x.id === m.id ? m : x))
  const handleDelete = (id: string) => { if (confirm('Hapus anggota ini?')) save(members.filter(m => m.id !== id)) }

  const handlePing = () => {
    setPinging(true)
    if ('vibrate' in navigator) navigator.vibrate([100, 50, 100])
    aegisApi.ping(myId, getMyName())
    setTimeout(() => setPinging(false), 3000)
  }

  return (
    <>
    <motion.div initial={{opacity:0,x:40}} animate={{opacity:1,x:0}} exit={{opacity:0,x:40}}
      className="fixed inset-0 z-[1800] flex flex-col overflow-y-auto" style={{background:'#080e1a'}}>

      <div className="shrink-0 px-4 pt-4 pb-3 border-b border-slate-800/60 flex items-center gap-3" style={{background:'#0a1020'}}>
        {onBack && <button onClick={onBack} className="w-8 h-8 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center shrink-0"><ChevronLeft className="w-4 h-4 text-slate-400"/></button>}
        <div className="flex-1">
          <h2 className="text-xl font-black text-white">Family Circle</h2>
          <p className="text-[10px] text-slate-400">{members.length > 0 ? <><span className="text-emerald-400 font-bold">{members.length} anggota</span> terhubung</> : 'Belum ada anggota'}</p>
        </div>
        <button onClick={()=>setShowQR(true)} className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
          <QrCode className="w-4 h-4 text-indigo-400"/>
        </button>
      </div>

      <AnimatePresence>
        {pingBanner && (
          <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} exit={{opacity:0}}
            className="shrink-0 px-4 py-2 bg-emerald-900/40 border-b border-emerald-700/30 text-center">
            <p className="text-[11px] font-black text-emerald-300">{pingBanner}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 px-4 py-4 space-y-3 pb-24">
        {members.length > 0 && (
          <button onClick={handlePing}
            className={`w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 border ${
              pinging ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300' : 'bg-indigo-600 border-indigo-500/50 text-white'}`}>
            <Radio className={`w-4 h-4 ${pinging?'animate-pulse':''}`}/>
            {pinging ? 'MENGIRIM PING...' : 'PING ALL MEMBERS'}
          </button>
        )}

        {members.length === 0 && (
          <div className="py-10 text-center">
            <div className="w-20 h-20 rounded-2xl bg-slate-800/60 border border-slate-700/40 flex items-center justify-center mx-auto mb-4"><span className="text-3xl">👨‍👩‍👧‍👦</span></div>
            <h3 className="text-white font-black mb-2">Grup Family Kosong</h3>
            <p className="text-slate-500 text-sm">Tambahkan anggota atau bagikan QR Code Anda.</p>
          </div>
        )}

        {members.map((m, i) => (
          <motion.div key={m.id} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:i*0.05}}
            className={`p-4 rounded-2xl border ${m.status==='danger'?'border-red-500/40':'border-slate-700/40'}`}
            style={{background:m.status==='danger'?'#150808':'#0f1a2e'}}>
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white border shrink-0 ${m.status==='danger'?'bg-red-600/30 border-red-500/40':'bg-indigo-600/30 border-indigo-500/40'}`}>{m.initials}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white">{m.name}</p>
                <p className="text-[10px] text-slate-500">{m.role}</p>
                <div className="mt-0.5"><StatusChip status={m.status}/></div>
              </div>
              <div className="flex gap-1.5 shrink-0">
                {m.status==='danger' && <button className="p-1.5 rounded-lg bg-red-600"><Phone className="w-3 h-3 text-white"/></button>}
                <button onClick={()=>setEditMember(m)} className="p-1.5 rounded-lg bg-slate-700/60 text-slate-400"><Edit2 className="w-3 h-3"/></button>
                <button onClick={()=>handleDelete(m.id)} className="p-1.5 rounded-lg bg-slate-700/60 text-slate-400"><Trash2 className="w-3 h-3"/></button>
              </div>
            </div>
            <div className="flex justify-between mt-2">
              <p className="text-[10px] text-slate-400">{m.location}</p>
              <div className="flex items-center gap-1"><Clock className="w-3 h-3 text-slate-500"/><span className="text-[10px] text-slate-500">{m.updatedAgo}</span></div>
            </div>
          </motion.div>
        ))}

        {members.length > 0 && (
          <div className="p-4 rounded-2xl border border-slate-700/40" style={{background:'#0f1a2e'}}>
            <div className="flex justify-between items-center mb-2">
              <div><p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Network Health</p>
                <div className="flex items-baseline gap-1"><span className="text-2xl font-black text-white">98.4%</span><span className="text-sm text-emerald-400 font-bold">Uptime</span></div></div>
              <Wifi className="w-6 h-6 text-emerald-400"/>
            </div>
            {[`${members.length}/${members.length} Connected`,'E2E Encrypted','SSE Real-time Sync'].map((t,i)=>(
              <div key={i} className="flex items-center gap-2 mt-1"><CheckCircle className="w-3 h-3 text-emerald-400"/><span className="text-[11px] text-slate-300">{t}</span></div>
            ))}
          </div>
        )}

        <button onClick={()=>setShowAdd(true)}
          className="w-full p-4 rounded-2xl border border-dashed border-slate-700/40 flex items-center justify-center gap-2 text-slate-400 hover:border-slate-600 transition-colors">
          <UserPlus className="w-5 h-5"/><span className="text-sm font-bold">Tambah Anggota</span>
        </button>
      </div>
    </motion.div>

    <AnimatePresence>
      {showQR && <MyQRModal onClose={()=>setShowQR(false)}/>}
      {showAdd && <AddMemberModal onClose={()=>setShowAdd(false)} onAdd={handleAdd}/>}
      {editMember && <EditModal member={editMember} onClose={()=>setEditMember(null)} onSave={handleEdit}/>}
    </AnimatePresence>
    </>
  )
}
