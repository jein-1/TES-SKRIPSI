// ═══════════════════════════════════════════════════════════════
// GLOBAL TYPES — Semua tipe data yang digunakan di seluruh app
// ═══════════════════════════════════════════════════════════════

export type ActivePage = 'map' | 'history' | 'settings' | 'sensors' | 'status' | 'navigate' | 'family' | 'guides'
export type UserRole = 'admin' | 'user'
export type AppUserRole = UserRole | null
export type HistoryFilter = 'all' | 'real' | 'simulation'

export interface EvacuationRecord {
  id: string
  timestamp: Date
  type: 'simulation' | 'real'
  eventName: string
  routeName: string
  distance: number | null
  walkingTime: number | null
  algorithm: string
  userLat: number
  userLng: number
}

export interface AppSettings {
  algorithm: 'dijkstra' | 'haversine'
  sensorSensitivity: number       // 0–100
  soundAlert: boolean
  vibrationAlert: boolean
  pushAlerts: boolean
  cartographyTheme: 'standard' | 'tactical-dark' | 'satellite-hud'
  safeZoneRadius: number          // km
  autoStartGPS: boolean
  showHazardZones: boolean
}

export const DEFAULT_SETTINGS: AppSettings = {
  algorithm: 'dijkstra',
  sensorSensitivity: 75,
  soundAlert: true,
  vibrationAlert: false,
  pushAlerts: true,
  cartographyTheme: 'standard',
  safeZoneRadius: 2.5,
  autoStartGPS: true,
  showHazardZones: true,
}

// ── Public User Types ──────────────────────────────────────────
export type FamilyMemberStatus = 'safe' | 'danger' | 'unknown'

export interface FamilyMember {
  id: string
  name: string
  role: string
  initials: string
  status: FamilyMemberStatus
  location: string
  updatedAgo: string
  alertLabel?: string
}

export type SensorStatus = 'online' | 'degraded' | 'offline'

export interface SensorNode {
  id: string
  name: string
  nodeId: string
  type: 'buoy' | 'seismograph' | 'camera'
  status: SensorStatus
  signalStrength: number  // 0–100
  latencyMs: number
  uptimePct: number
  lat: number
  lng: number
  bars: number[]          // mini sparkline (8 values)
}
