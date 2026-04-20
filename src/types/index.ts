// ═══════════════════════════════════════════════════════════════
// GLOBAL TYPES — Semua tipe data yang digunakan di seluruh app
// ═══════════════════════════════════════════════════════════════

export type ActivePage = 'map' | 'history' | 'settings'
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
