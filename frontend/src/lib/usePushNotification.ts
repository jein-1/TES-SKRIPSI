// ═══════════════════════════════════════════════════════════════
// usePushNotification.ts
// Mendaftarkan browser/APK ke Web Push server agar dapat notif
// bahkan saat aplikasi DITUTUP TOTAL
// ═══════════════════════════════════════════════════════════════
import { Capacitor } from '@capacitor/core'

const IS_NATIVE = Capacitor.isNativePlatform()

// Base URL Railway untuk APK
const API_BASE: string = IS_NATIVE
  ? (import.meta.env.VITE_API_URL ?? '')
  : ''

/** Daftarkan browser ke Web Push server */
export async function registerWebPush(): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.log('[Push] Web Push tidak didukung di browser ini')
    return false
  }
  try {
    // 1. Ambil VAPID public key dari server
    const res = await fetch(`${API_BASE}/api/push/vapid-key`)
    const { publicKey } = await res.json()

    // 2. Register service worker
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
    await navigator.serviceWorker.ready

    // 3. Minta izin notifikasi
    const perm = await Notification.requestPermission()
    if (perm !== 'granted') {
      console.log('[Push] Izin notifikasi ditolak')
      return false
    }

    // 4. Cek apakah sudah subscribe
    let sub = await reg.pushManager.getSubscription()
    if (!sub) {
      // Subscribe baru
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as unknown as BufferSource,
      })
    }

    // 5. Kirim subscription ke server
    await fetch(`${API_BASE}/api/push/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sub),
    })

    console.log('[Push] ✅ Web Push terdaftar')
    return true
  } catch (e) {
    console.warn('[Push] Gagal register:', e)
    return false
  }
}

/** Unsubscribe dari Web Push */
export async function unregisterWebPush(): Promise<void> {
  try {
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    if (sub) {
      await fetch(`${API_BASE}/api/push/unsubscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      })
      await sub.unsubscribe()
    }
  } catch (e) {
    console.warn('[Push] Gagal unsubscribe:', e)
  }
}

/** Konversi VAPID public key base64 → Uint8Array */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
