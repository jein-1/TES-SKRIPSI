import { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

export function useEmergencyNotification(tsunamiAlert: boolean) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const triggerNotification = async () => {
      // Minta izin notifikasi jika belum
      let permStatus = await LocalNotifications.checkPermissions();
      if (permStatus.display !== 'granted') {
        permStatus = await LocalNotifications.requestPermissions();
      }
      if (permStatus.display !== 'granted') return;

      // Jadwalkan notifikasi menggunakan opsi sesuai instruksi
      await LocalNotifications.schedule({
        notifications: [
          {
            title: "🚨 DARURAT TSUNAMI AKTIF",
            body: "Segera evakuasi ke titik kumpul terdekat!",
            id: 999, // Fixed ID agar menimpa notifikasi sebelumnya
            schedule: { every: 'second' },
            ongoing: true,
          }
        ]
      });
      
      // Capacitor v6 LocalNotifications tak punya field vibrate di schedule options secara bawaan,
      // tapi dengan channel atau dengan trigger tambahan haptics bisa jalan.
      // Kita panggil Haptics via JS juga jika diperlukan (meski notifikasi native bisa bergetar).
      // Prompt bilang: "pola getar panjang (vibrate pattern minimal 800ms)".
      if (Capacitor.isPluginAvailable('Haptics')) {
        import('@capacitor/haptics').then(({ Haptics }) => {
          Haptics.vibrate({ duration: 800 }).catch(() => {});
        });
      }
    };

    if (tsunamiAlert) {
      triggerNotification();
      // Ulangi tiap 15 detik sesuai instruksi
      intervalRef.current = setInterval(() => {
        triggerNotification();
      }, 15000);
    } else {
      // Hentikan interval dan batalkan notifikasi saat darurat dicabut
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      LocalNotifications.cancel({ notifications: [{ id: 999 }] }).catch(() => {});
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [tsunamiAlert]);
}
