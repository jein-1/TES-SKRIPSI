// ═══════════════════════════════════════════════════════════════
// AEGIS RESPONSE — Service Worker
// Menangani Web Push Notification saat aplikasi DITUTUP
// ═══════════════════════════════════════════════════════════════

const CACHE_NAME = 'aegis-v1'

// Install
self.addEventListener('install', (event) => {
  self.skipWaiting()
})

// Activate
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

// ── Terima Push dari server (saat app DITUTUP) ─────────────────
self.addEventListener('push', (event) => {
  let data = {}
  try { data = event.data?.json() ?? {} } catch {}

  const title   = data.title ?? '🚨 AEGIS RESPONSE'
  const options = {
    body:               data.body ?? 'Peringatan darurat!',
    icon:               '/icon-192.png',
    badge:              '/icon-192.png',
    vibrate:            data.vibrate ?? [500, 200, 500, 200, 500, 200, 1000],
    requireInteraction: data.requireInteraction ?? true,  // tidak hilang otomatis
    tag:                data.tag ?? 'aegis-alert',
    renotify:           true,
    silent:             false,
    data: {
      url: data.url ?? '/',
      timestamp: Date.now(),
    },
    // Tombol aksi di notifikasi
    actions: [
      { action: 'open', title: '🗺️ Lihat Rute Evakuasi' },
      { action: 'dismiss', title: 'Tutup' },
    ],
  }

  event.waitUntil(
    self.registration.showNotification(title, options)
  )
})

// ── Klik notifikasi → buka/fokus app ──────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'dismiss') return

  const targetUrl = event.notification.data?.url ?? '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Kalau ada tab yang sudah buka → fokus ke sana
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus()
          }
        }
        // Kalau tidak ada → buka tab baru
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl)
        }
      })
  )
})

// ── Sync di background (opsional) ─────────────────────────────
self.addEventListener('sync', (event) => {
  // Background sync jika perlu di masa depan
})
