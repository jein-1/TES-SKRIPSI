// ═══════════════════════════════════════════════════════════════
// broadcastStorage.ts — A.T.L.A.S Admin Emergency Broadcast System
// ═══════════════════════════════════════════════════════════════

export interface AdminBroadcast {
  id: string
  title: string
  message: string
  sender: string
  role: string
  level: 'CRITICAL' | 'WARNING' | 'INFO'
  region: string // 'SEMUA WILAYAH' | 'Kota Palu' | 'Kab. Donggala' | 'Kab. Sigi' | 'Kab. Parigi Moutong' | string
  timestamp: number
  expiresAt: number
  read?: boolean
}

const STORAGE_KEY = 'atlas_admin_broadcasts'
const READ_KEY = 'atlas_read_broadcast_ids'

export function getAdminBroadcasts(): AdminBroadcast[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: AdminBroadcast[] = JSON.parse(raw)
    const now = Date.now()
    // Filter out expired messages (older than 48 hours)
    return parsed.filter(b => !b.expiresAt || b.expiresAt > now)
  } catch (err) {
    console.warn('[BroadcastStorage] Failed to read broadcasts:', err)
    return []
  }
}

export function saveAdminBroadcast(broadcast: AdminBroadcast): void {
  try {
    const list = getAdminBroadcasts()
    const index = list.findIndex(b => b.id === broadcast.id)
    if (index >= 0) {
      list[index] = broadcast
    } else {
      list.unshift(broadcast)
    }
    // Limit to latest 30 broadcasts
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 30)))
    window.dispatchEvent(new CustomEvent('atlas_admin_broadcast_updated', { detail: broadcast }))
  } catch (err) {
    console.warn('[BroadcastStorage] Failed to save broadcast:', err)
  }
}

export function removeAdminBroadcast(id: string): void {
  try {
    const list = getAdminBroadcasts().filter(b => b.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
    window.dispatchEvent(new CustomEvent('atlas_admin_broadcast_updated', { detail: { id, deleted: true } }))
  } catch (err) {
    console.warn('[BroadcastStorage] Failed to delete broadcast:', err)
  }
}

export function markBroadcastAsRead(id: string): void {
  try {
    const readIds: string[] = JSON.parse(localStorage.getItem(READ_KEY) || '[]')
    if (!readIds.includes(id)) {
      readIds.push(id)
      localStorage.setItem(READ_KEY, JSON.stringify(readIds.slice(-50)))
      window.dispatchEvent(new CustomEvent('atlas_admin_broadcast_updated'))
    }
  } catch (err) {
    console.warn('[BroadcastStorage] Failed to mark as read:', err)
  }
}

export function isBroadcastRead(id: string): boolean {
  try {
    const readIds: string[] = JSON.parse(localStorage.getItem(READ_KEY) || '[]')
    return readIds.includes(id)
  } catch {
    return false
  }
}

export function getUnreadBroadcastCount(userLocation?: string): number {
  const broadcasts = getAdminBroadcasts().filter(b => isBroadcastRelevantForUser(b, userLocation))
  return broadcasts.filter(b => !isBroadcastRead(b.id)).length
}

export function isBroadcastRelevantForUser(broadcast: AdminBroadcast, userLocation?: string): boolean {
  if (!broadcast.region) return true
  const reg = broadcast.region.trim().toUpperCase()
  if (reg === 'SEMUA' || reg === 'SEMUA WILAYAH' || reg === 'ALL' || reg === 'GLOBAL' || reg === 'NASIONAL') {
    return true
  }

  // If user location is not yet detected, default to showing Palu and surrounding
  if (!userLocation || userLocation.includes('Mendeteksi') || userLocation.includes('Izin')) {
    return true
  }

  const uLoc = userLocation.toUpperCase()
  // Check if target region keywords match user location (e.g. "PALU", "DONGGALA", "SIGI", "PARIGI")
  const keywords = reg.split(/\s+/).filter(w => w.length > 3 && !['KOTA', 'KAB.', 'KABUPATEN', 'PROV.', 'PROVINSI'].includes(w))
  if (keywords.length === 0) return true
  return keywords.some(k => uLoc.includes(k))
}
