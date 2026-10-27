import { registerPlugin } from '@capacitor/core'

export interface NativeSettingsPlugin {
  openAppDetails(): Promise<void>
  openDndAccess(): Promise<void>
  openChannelSettings(options: { channelId: string }): Promise<void>
  openNotificationSettings(): Promise<void>
  openBatteryOptimization(): Promise<void>
  startSentinel(): Promise<{ success: boolean; running: boolean }>
  stopSentinel(): Promise<{ success: boolean; running: boolean }>
  isSentinelRunning(): Promise<{ running: boolean }>
}

export const NativeSettings = registerPlugin<NativeSettingsPlugin>('NativeSettings', {
  web: {
    openAppDetails: async () => {
      alert('Mode Web: Silakan buka Pengaturan HP > Aplikasi > A.T.L.A.S > Izin Lokasi dan pilih "Izinkan Sepanjang Waktu".')
    },
    openDndAccess: async () => {
      alert('Mode Web: Buka Pengaturan HP > Suara & Getar > Jangan Ganggu (DND) > Akses Pengecualian.')
    },
    openChannelSettings: async (options: { channelId: string }) => {
      alert(`Mode Web: Buka Pengaturan HP > Notifikasi > A.T.L.A.S > Saluran ${options.channelId}.`)
    },
    openNotificationSettings: async () => {
      alert('Mode Web: Buka Pengaturan HP > Notifikasi > A.T.L.A.S.')
    },
    openBatteryOptimization: async () => {
      alert('Mode Web: Buka Pengaturan HP > Baterai > Penghemat Baterai > Pilih A.T.L.A.S > Tanpa Batasan (Unrestricted).')
    },
    startSentinel: async () => {
      console.log('[NativeSettings Web] Sentinel service active')
      return { success: true, running: true }
    },
    stopSentinel: async () => {
      console.log('[NativeSettings Web] Sentinel service stopped')
      return { success: true, running: false }
    },
    isSentinelRunning: async () => {
      return { running: true }
    }
  }
})
