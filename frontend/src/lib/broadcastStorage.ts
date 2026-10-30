// ═══════════════════════════════════════════════════════════════
// broadcastStorage.ts — A.T.L.A.S Admin Emergency Broadcast System
// ═══════════════════════════════════════════════════════════════
import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'

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

export const BROADCAST_RETENTION_MS = 7 * 24 * 60 * 60 * 1000 // 7 hari

const STORAGE_KEY = 'atlas_admin_broadcasts'
const READ_KEY = 'atlas_read_broadcast_ids'

export function getAdminBroadcasts(): AdminBroadcast[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: AdminBroadcast[] = JSON.parse(raw)
    const now = Date.now()
    const readIds: string[] = JSON.parse(localStorage.getItem(READ_KEY) || '[]')
    // Simpan riwayat siaran darurat selama 7 hari penuh
    return parsed
      .filter(b => {
        const created = b.timestamp || now
        return (now - created) < BROADCAST_RETENTION_MS
      })
      .map(b => ({
        ...b,
        read: b.read || readIds.includes(b.id)
      }))
  } catch (err) {
    console.warn('[BroadcastStorage] Failed to read broadcasts:', err)
    return []
  }
}

// ── Android Status Bar Notification & App Icon Badge ──────────
export async function triggerBroadcastNotification(broadcast: AdminBroadcast): Promise<void> {
  try {
    const unreadCount = getUnreadBroadcastCount()

    // 1. Update App Icon Badge (seperti WhatsApp)
    if (typeof navigator !== 'undefined' && 'setAppBadge' in navigator) {
      // @ts-ignore
      navigator.setAppBadge(unreadCount).catch(() => {})
    }

    // 2. Trigger Android Status Bar Notification jika berjalan di native Capacitor
    if (Capacitor.isNativePlatform()) {
      let perm = await LocalNotifications.checkPermissions()
      if (perm.display !== 'granted') {
        perm = await LocalNotifications.requestPermissions()
      }
      if (perm.display === 'granted') {
        // Clean numeric ID from hash
        const notifId = Math.abs(broadcast.id.split('').reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0)) % 100000

        await LocalNotifications.schedule({
          notifications: [
            {
              id: notifId,
              title: `🚨 SIARAN RESMI · ${broadcast.region || 'DARURAT'}`,
              body: broadcast.message.slice(0, 140) + (broadcast.message.length > 140 ? '...' : ''),
              channelId: 'critical_alerts',
              sound: 'atlas_siren.wav',
              extra: { broadcastId: broadcast.id },
              smallIcon: 'ic_stat_atlas'
            }
          ]
        })
      }
    }
  } catch (err) {
    console.warn('[BroadcastStorage] Notification error:', err)
  }
}

export function saveAdminBroadcast(broadcast: AdminBroadcast, isIncoming = false): void {
  try {
    const list = getAdminBroadcasts()
    const index = list.findIndex(b => b.id === broadcast.id)
    const isNew = index < 0
    if (index >= 0) {
      list[index] = broadcast
    } else {
      list.unshift(broadcast)
    }
    // Limit to latest 30 broadcasts
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 30)))
    window.dispatchEvent(new CustomEvent('atlas_admin_broadcast_updated', { detail: broadcast }))

    // Trigger notifikasi jika pesan baru diterima
    if (isNew || isIncoming) {
      triggerBroadcastNotification(broadcast).catch(() => {})
    }
  } catch (err) {
    console.warn('[BroadcastStorage] Failed to save broadcast:', err)
  }
}

export function removeAdminBroadcast(id: string): void {
  try {
    const list = getAdminBroadcasts().filter(b => b.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
    window.dispatchEvent(new CustomEvent('atlas_admin_broadcast_updated', { detail: { id, deleted: true } }))
    updateAppBadge()
  } catch (err) {
    console.warn('[BroadcastStorage] Failed to delete broadcast:', err)
  }
}

export function markBroadcastAsRead(id: string): void {
  try {
    const readIds: string[] = JSON.parse(localStorage.getItem(READ_KEY) || '[]')
    if (!readIds.includes(id)) {
      readIds.push(id)
      localStorage.setItem(READ_KEY, JSON.stringify(readIds.slice(-100)))
      window.dispatchEvent(new CustomEvent('atlas_admin_broadcast_updated'))
      updateAppBadge()
    }
  } catch (err) {
    console.warn('[BroadcastStorage] Failed to mark as read:', err)
  }
}

export function markAllBroadcastsAsRead(): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const parsed: AdminBroadcast[] = JSON.parse(raw)
    const readIds: string[] = JSON.parse(localStorage.getItem(READ_KEY) || '[]')
    parsed.forEach(b => {
      if (!readIds.includes(b.id)) {
        readIds.push(b.id)
      }
    })
    localStorage.setItem(READ_KEY, JSON.stringify(readIds.slice(-100)))
    window.dispatchEvent(new CustomEvent('atlas_admin_broadcast_updated'))
    updateAppBadge()
  } catch (err) {
    console.warn('[BroadcastStorage] Failed to mark all as read:', err)
  }
}

export function updateAppBadge(): void {
  try {
    const unread = getUnreadBroadcastCount()
    if (typeof navigator !== 'undefined') {
      if (unread > 0 && 'setAppBadge' in navigator) {
        // @ts-ignore
        navigator.setAppBadge(unread).catch(() => {})
      } else if (unread === 0 && 'clearAppBadge' in navigator) {
        // @ts-ignore
        navigator.clearAppBadge().catch(() => {})
      }
    }
  } catch {}
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
  if (reg === 'SEMUA' || reg === 'SEMUA WILAYAH' || reg === 'ALL' || reg === 'GLOBAL' || reg === 'NASIONAL' || reg.includes('SEMUA')) {
    return true
  }

  // If user location is not yet detected, default to showing
  if (!userLocation || userLocation.includes('Mendeteksi') || userLocation.includes('Izin')) {
    return true
  }

  const uLoc = userLocation.toUpperCase()
  // Check if target region keywords match user location (e.g. "PALU", "DONGGALA", "SIGI", "PARIGI", "JAKARTA", "SURABAYA")
  const keywords = reg.split(/\s+/).filter(w => w.length > 3 && !['KOTA', 'KAB.', 'KABUPATEN', 'PROV.', 'PROVINSI', 'WILAYAH'].includes(w))
  if (keywords.length === 0) return true
  return keywords.some(k => uLoc.includes(k))
}
