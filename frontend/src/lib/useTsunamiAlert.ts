// ═══════════════════════════════════════════════════════════════
// useTsunamiAlert.ts — Tsunami alert with local notification
// Ketika SSE TSUNAMI event diterima:
// 1. Tampilkan LocalNotification (muncul di hp bahkan saat bg)
// 2. Trigger vibration + alarm sound
// 3. Jika app di background, notifikasi full-screen muncul otomatis
// ═══════════════════════════════════════════════════════════════
import { useEffect, useRef } from 'react'
import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'

let notifPermGranted = false

/** Request notif permission saat app pertama buka */
export async function requestNotifPermission() {
  if (!Capacitor.isNativePlatform()) return
  try {
    const { display } = await LocalNotifications.requestPermissions()
    notifPermGranted = display === 'granted'
    // Buat notification channel high-priority untuk Android
    await LocalNotifications.createChannel?.({
      id: 'tsunami-alert',
      name: 'PERINGATAN TSUNAMI',
      description: 'Notifikasi darurat tsunami',
      importance: 5,        // IMPORTANCE_HIGH
      visibility: 1,        // VISIBILITY_PUBLIC — tampil di lock screen
      sound: 'default',
      vibration: true,
      lights: true,
      lightColor: '#FF0000',
    })
  } catch (e) {
    console.warn('[Notif] Permission request failed:', e)
  }
}

/** Kirim notifikasi tsunami full-screen ke HP user */
export async function sendTsunamiNotification(active: boolean) {
  if (!Capacitor.isNativePlatform()) return
  if (!notifPermGranted) await requestNotifPermission()
  try {
    if (active) {
      await LocalNotifications.schedule({
        notifications: [{
          id: 9001,
          title: '🚨 PERINGATAN TSUNAMI!',
          body: 'Segera lakukan evakuasi. Buka aplikasi untuk rute aman.',
          channelId: 'tsunami-alert',
          sound: 'default',
          actionTypeId: 'OPEN_APP',
          extra: { action: 'TSUNAMI_ALERT' },
          // Full screen intent — tampil otomatis di lock screen
          ongoing: true,           // tidak bisa di-swipe hapus
          autoCancel: false,
          largeIcon: 'ic_launcher',
          smallIcon: 'ic_launcher',
          // Waktu: sekarang
          schedule: { at: new Date(Date.now() + 100) },
        }],
      })
    } else {
      // Batalkan notifikasi saat alert dinonaktifkan
      await LocalNotifications.cancel({ notifications: [{ id: 9001 }] })
    }
  } catch (e) {
    console.warn('[Notif] Schedule failed:', e)
  }
}
