// ═══════════════════════════════════════════════════════════════
// useAegisSync — Real-time sync hook via Server-Sent Events
// Connects to /api/events and provides helper functions
// Works cross-device on Railway deployment
// ═══════════════════════════════════════════════════════════════
import { useEffect, useRef } from 'react'
import { Capacitor } from '@capacitor/core'

// Detect API base URL:
// - Native APK (Capacitor): gunakan Railway URL dari env var
// - Web (Railway/browser): relative path '' (same origin)
const IS_NATIVE = Capacitor.isNativePlatform()
const API_BASE: string = IS_NATIVE
  ? (import.meta.env.VITE_API_URL ?? '')   // Set VITE_API_URL di .env.admin / .env.production
  : ''                                       // Web: same-origin (Railway serve frontend+backend)

export type SyncEventHandler = (event: AegisSyncEvent) => void

export interface AegisSyncEvent {
  type: 'INIT' | 'TSUNAMI' | 'FAMILY_JOIN' | 'PING' | 'PING_REPLY' | 'LOCATION_UPDATE'
  [key: string]: unknown
}

// ── API helpers ───────────────────────────────────────────────
async function apiPost(path: string, body: object, isAdmin = false) {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (isAdmin) {
      // Admin key disimpan di sessionStorage setelah login
      const key = sessionStorage.getItem('aegisAdminKey') ?? 'aegis2024'
      headers['X-Admin-Key'] = key
    }
    await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })
  } catch (err) {
    console.warn('[AegisSync] POST failed:', path, err)
  }
}

export const aegisApi = {
  /** Admin: activate or deactivate tsunami alert */
  setTsunami: (active: boolean) => apiPost('/api/tsunami', { active }, true),

  /** When A scans B's QR, notify B so it adds A */
  notifyFamilyJoin: (fromId: string, fromName: string, toId: string) =>
    apiPost('/api/family/join', { fromId, fromName, toId }),

  /** Ping all connected devices */
  ping: (fromId: string, fromName: string) =>
    apiPost('/api/ping', { fromId, fromName }),

  /** Reply to a ping */
  pingReply: (fromId: string, fromName: string, toId: string) =>
    apiPost('/api/ping/reply', { fromId, fromName, toId }),

  /** Get current tsunami state on mount */
  getTsunami: async (): Promise<{ active: boolean; ts: number }> => {
    try {
      const r = await fetch(`${API_BASE}/api/tsunami`)
      return await r.json()
    } catch { return { active: false, ts: 0 } }
  },
}

// ── Main hook ─────────────────────────────────────────────────
export function useAegisSync(onEvent: SyncEventHandler) {
  const esRef = useRef<EventSource | null>(null)
  const handlerRef = useRef(onEvent)
  handlerRef.current = onEvent

  useEffect(() => {
    let retryTimer: ReturnType<typeof setTimeout>

    function connect() {
      const es = new EventSource(`${API_BASE}/api/events`)
      esRef.current = es

      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data) as AegisSyncEvent
          handlerRef.current(data)
        } catch {}
      }

      es.onerror = () => {
        es.close()
        // Retry after 3s
        retryTimer = setTimeout(connect, 3000)
      }
    }

    connect()

    return () => {
      esRef.current?.close()
      clearTimeout(retryTimer)
    }
  }, [])
}
