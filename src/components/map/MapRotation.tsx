// ═══════════════════════════════════════════════════════════════
// MAP ROTATION — Reusable hook + compass widget
// Works on both Admin and User maps (mobile & desktop)
// ═══════════════════════════════════════════════════════════════
import { useEffect, useCallback, useState } from 'react'
import { useMap } from 'react-leaflet'
import 'leaflet-rotate'

// ── Enable rotation on map instance ──────────────────────────
export function useMapRotation(autoHeading?: number) {
  const map = useMap()
  const [bearing, setBearing] = useState(0)

  useEffect(() => {
    const m = map as L.Map
    // Enable two-finger touch rotation (mobile)
    if (m.touchRotate) {
      try { m.touchRotate.enable() } catch {}
    }
    // Track bearing changes
    const onRotate = () => {
      if (typeof m.getBearing === 'function') {
        setBearing(m.getBearing())
      }
    }
    map.on('rotate' as any, onRotate)
    return () => { map.off('rotate' as any, onRotate) }
  }, [map])

  // Auto-rotate to heading (for navigation mode)
  useEffect(() => {
    if (autoHeading !== undefined && typeof (map as any).setBearing === 'function') {
      ;(map as any).setBearing(autoHeading)
      setBearing(autoHeading)
    }
  }, [map, autoHeading])

  const resetNorth = useCallback(() => {
    if (typeof (map as any).setBearing === 'function') {
      ;(map as any).setBearing(0)
      setBearing(0)
    }
  }, [map])

  return { bearing, resetNorth }
}

// ── Compass Widget — shows bearing, tap to reset north ────────
interface CompassProps {
  bearing: number
  onReset: () => void
  className?: string
}

export function CompassWidget({ bearing, onReset, className = '' }: CompassProps) {
  return (
    <button
      onClick={onReset}
      title="Klik untuk reset ke utara"
      className={`w-11 h-11 rounded-full bg-slate-900/90 border border-slate-700/70 flex items-center justify-center shadow-lg backdrop-blur-sm hover:bg-slate-800 transition-colors ${className}`}
      style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.4)' }}
    >
      <svg viewBox="0 0 40 40" width="36" height="36"
        style={{ transform: `rotate(${-bearing}deg)`, transition: 'transform 0.3s ease' }}>
        {/* North arrow — red */}
        <polygon points="20,5 23,20 20,18 17,20" fill="#ef4444" />
        {/* South arrow — white */}
        <polygon points="20,35 23,20 20,22 17,20" fill="#94a3b8" />
        {/* Center dot */}
        <circle cx="20" cy="20" r="2.5" fill="#e2e8f0" />
        {/* N label */}
        <text x="20" y="12" textAnchor="middle" fontSize="5" fill="#ef4444" fontWeight="bold">N</text>
      </svg>
    </button>
  )
}

// ── EnableRotation child component ─────────────────────────────
// Place this inside <MapContainer> to enable rotation
export function EnableMapRotation({ heading }: { heading?: number }) {
  const { bearing, resetNorth } = useMapRotation(heading)
  return null // just a hook runner; use CompassWidget separately
}
