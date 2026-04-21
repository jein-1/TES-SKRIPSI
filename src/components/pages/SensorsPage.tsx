// ═══════════════════════════════════════════════════════════════
// SENSORS PAGE — System Diagnostics & Sensor Array Status
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { Wifi, WifiOff, Activity, AlertTriangle, CheckCircle, RefreshCw, Radio, ChevronLeft } from 'lucide-react'
import { motion } from 'motion/react'
import type { SensorNode, SensorStatus } from '../../types'
import { TILE_DARK } from '../../constants/mapConfig'

// ── Static sensor data (Kota Palu) ────────────────────────────
const SENSOR_NODES: SensorNode[] = [
  {
    id: 'SLB-A-01', name: 'Sea Level Buoy Alpha', nodeId: 'SLB-A-01',
    type: 'buoy', status: 'online',
    signalStrength: 98, latencyMs: 12, uptimePct: 99.9,
    lat: -0.840, lng: 119.820,
    bars: [70, 80, 90, 85, 95, 92, 98, 98],
  },
  {
    id: 'SEIS-07', name: 'Seismograph 07', nodeId: 'SEIS-07',
    type: 'seismograph', status: 'degraded',
    signalStrength: 42, latencyMs: 145, uptimePct: 94.2,
    lat: -0.920, lng: 119.870,
    bars: [80, 75, 60, 45, 30, 42, 38, 42],
  },
  {
    id: 'SLB-B-03', name: 'Sea Level Buoy Beta', nodeId: 'SLB-B-03',
    type: 'buoy', status: 'online',
    signalStrength: 87, latencyMs: 24, uptimePct: 98.1,
    lat: -0.810, lng: 119.845,
    bars: [80, 83, 88, 85, 87, 90, 87, 87],
  },
  {
    id: 'SEIS-02', name: 'Seismograph 02', nodeId: 'SEIS-02',
    type: 'seismograph', status: 'offline',
    signalStrength: 0, latencyMs: 0, uptimePct: 71.3,
    lat: -0.960, lng: 119.900,
    bars: [60, 40, 20, 5, 0, 0, 0, 0],
  },
]

// ── Custom sensor marker icons ──────────────────────────────────
function makeSensorIcon(status: SensorStatus) {
  const color = status === 'online' ? '#22c55e' : status === 'degraded' ? '#f59e0b' : '#ef4444'
  return L.divIcon({
    className: '',
    html: `<div style="
      width:14px;height:14px;border-radius:50%;
      background:${color};border:2px solid #0f172a;
      box-shadow:0 0 8px ${color}88;
    "></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  })
}

// ── Sparkline bars component ────────────────────────────────────
function Sparkline({ bars, status }: { bars: number[]; status: SensorStatus }) {
  const color = status === 'online' ? '#22c55e' : status === 'degraded' ? '#f59e0b' : '#ef4444'
  const max = Math.max(...bars, 1)
  return (
    <div className="flex items-end gap-0.5 h-8">
      {bars.map((v, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm transition-all duration-300"
          style={{
            height: `${(v / max) * 100}%`,
            minHeight: 2,
            background: color,
            opacity: 0.5 + (i / bars.length) * 0.5,
          }}
        />
      ))}
    </div>
  )
}

// ── Status badge ────────────────────────────────────────────────
function StatusBadge({ status }: { status: SensorStatus }) {
  if (status === 'online') return (
    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
      ONLINE
    </span>
  )
  if (status === 'degraded') return (
    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-[10px] font-bold">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
      DEGRADED
    </span>
  )
  return (
    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 text-[10px] font-bold">
      <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
      OFFLINE
    </span>
  )
}

// ── Node type icon ──────────────────────────────────────────────
function NodeIcon({ type }: { type: SensorNode['type'] }) {
  if (type === 'buoy') return <span className="text-lg">🌊</span>
  if (type === 'seismograph') return <span className="text-lg">📡</span>
  return <span className="text-lg">📷</span>
}

// ── Map fit bounds helper ───────────────────────────────────────
function FitBounds() {
  const map = useMap()
  useEffect(() => {
    const bounds = L.latLngBounds(SENSOR_NODES.map(n => [n.lat, n.lng]))
    map.fitBounds(bounds, { padding: [30, 30] })
  }, [map])
  return null
}

// ── Main SensorsPage ─────────────────────────────────────────────
export default function SensorsPage({ onBack }: { onBack?: () => void }) {
  const [lastSync] = useState(() => {
    const now = new Date()
    return `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')} UTC`
  })
  const [refreshing, setRefreshing] = useState(false)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)

  const onlineCount = SENSOR_NODES.filter(n => n.status === 'online').length
  const degradedCount = SENSOR_NODES.filter(n => n.status === 'degraded').length
  const overallOk = degradedCount === 0 && onlineCount === SENSOR_NODES.length

  const handleRefresh = () => {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 1500)
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }} transition={{ duration: 0.22 }}
      className="fixed inset-0 z-[1800] flex flex-col overflow-y-auto custom-scrollbar"
      style={{ background: '#080e1a' }}
    >
      {/* Header */}
      <div className="shrink-0 px-5 pt-5 pb-4 border-b border-slate-800/60" style={{ background: '#0a1020' }}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            {onBack && (
              <button onClick={onBack}
                className="w-8 h-8 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center hover:bg-slate-700 transition-colors">
                <ChevronLeft className="w-4 h-4 text-slate-400" />
              </button>
            )}
            <div>
              <p className="text-[10px] font-bold text-indigo-400 tracking-[0.2em] uppercase">System Diagnostics</p>
              <h2 className="text-xl font-black text-white tracking-tight">SENSOR ARRAY STATUS</h2>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            className="p-2 bg-slate-800/60 hover:bg-slate-700 border border-slate-700/40 rounded-xl text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <p className="text-[11px] text-slate-500">Monitoring global tactical sensor nodes in real-time.</p>
      </div>

      <div className="flex-1 px-4 py-4 space-y-4">

        {/* Global System Health */}
        <div className="p-4 rounded-2xl border border-slate-700/40" style={{ background: '#0f1a2e' }}>
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border ${
              overallOk ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-amber-500/10 border-amber-500/30'
            }`}>
              {overallOk
                ? <CheckCircle className="w-7 h-7 text-emerald-400" />
                : <AlertTriangle className="w-7 h-7 text-amber-400" />
              }
            </div>
            <div className="flex-1">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-0.5">Global System Health</p>
              <p className={`text-lg font-black ${overallOk ? 'text-emerald-400' : 'text-amber-400'}`}>
                {overallOk ? 'OPERATIONAL' : 'DEGRADED'}
              </p>
              <p className="text-[11px] text-slate-500">Last Sync: {lastSync}</p>
            </div>
          </div>
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            {[
              { label: 'Online', value: onlineCount, color: 'text-emerald-400' },
              { label: 'Degraded', value: degradedCount, color: 'text-amber-400' },
              { label: 'Offline', value: SENSOR_NODES.filter(n => n.status === 'offline').length, color: 'text-red-400' },
            ].map(s => (
              <div key={s.label} className="text-center p-2 rounded-xl bg-slate-900/50 border border-slate-800/40">
                <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Active Nodes */}
        <div>
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-indigo-400" /> Active Nodes
          </h3>
          <div className="space-y-3">
            {SENSOR_NODES.map((node, idx) => {
              const borderColor = node.status === 'online' ? 'border-emerald-500/30' :
                node.status === 'degraded' ? 'border-amber-500/30' : 'border-red-500/20'
              const sigColor = node.status === 'online' ? 'text-emerald-400' :
                node.status === 'degraded' ? 'text-amber-400' : 'text-red-400'
              return (
                <motion.div
                  key={node.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.07 }}
                  onClick={() => setSelectedNode(selectedNode === node.id ? null : node.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${borderColor}`}
                  style={{ background: '#0f1a2e' }}
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-800/60 flex items-center justify-center shrink-0">
                        <NodeIcon type={node.type} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white leading-tight">{node.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono">NODE-ID: {node.nodeId}</p>
                      </div>
                    </div>
                    <StatusBadge status={node.status} />
                  </div>

                  {/* Metrics row */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div>
                      <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold mb-0.5">Signal Strength</p>
                      <p className={`text-base font-black ${sigColor}`}>
                        {node.status === 'offline' ? '—' : `${node.signalStrength}%`}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold mb-0.5">Latency</p>
                      <p className="text-base font-black text-white">
                        {node.status === 'offline' ? '—' : `${node.latencyMs}ms`}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold mb-0.5">Uptime</p>
                      <p className="text-base font-black text-white">{node.uptimePct}%</p>
                    </div>
                  </div>

                  {/* Sparkline */}
                  <Sparkline bars={node.bars} status={node.status} />

                  {/* Signal bar */}
                  {node.status !== 'offline' && (
                    <div className="mt-2 w-full h-1 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${node.signalStrength}%`,
                          background: node.status === 'online' ? '#22c55e' : '#f59e0b',
                        }}
                      />
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Node Deployment Map */}
        <div>
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-indigo-400" /> Node Deployment
          </h3>
          <div className="rounded-2xl overflow-hidden border border-slate-700/40" style={{ height: 220 }}>
            <MapContainer
              center={[-0.8917, 119.8577]}
              zoom={11}
              className="w-full h-full"
              zoomControl={true}
              attributionControl={false}
            >
              <TileLayer url={TILE_DARK} maxNativeZoom={20} maxZoom={20} />
              <FitBounds />
              {SENSOR_NODES.map(node => (
                <Marker
                  key={node.id}
                  position={[node.lat, node.lng]}
                  icon={makeSensorIcon(node.status)}
                >
                  <Popup>
                    <div className="text-xs font-bold">{node.name}</div>
                    <div className="text-xs text-slate-500">{node.nodeId}</div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
          {/* Legend */}
          <div className="flex items-center gap-4 mt-2 px-1">
            {[
              { color: '#22c55e', label: 'Online' },
              { color: '#f59e0b', label: 'Degraded' },
              { color: '#ef4444', label: 'Offline' },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: l.color }} />
                <span className="text-[10px] text-slate-400">{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom spacer */}
        <div className="h-4" />
      </div>
    </motion.div>
  )
}
