import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dimsstsu.app',
  appName: 'AEGIS RESPONSE',
  webDir: 'dist',
  // Server config: saat development bisa pakai livereload dari PC
  // Untuk production APK, hapus/comment blok server ini
  // server: {
  //   url: 'http://192.168.x.x:5173',
  //   cleartext: true,
  // },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#080e1a',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    StatusBar: {
      style: 'Dark',
      backgroundColor: '#0a1020',
    },
    Geolocation: {
      // Android: gunakan GPS hardware langsung
    },
    Camera: {
      // Untuk scan QR lewat kamera
    },
  },
  android: {
    // Izinkan koneksi ke Railway server (HTTPS) — aman
    allowMixedContent: false,
    // Hapus allowMixedContent di production
    // captureInput: true,
    webContentsDebuggingEnabled: false,
  },
};

export default config;
