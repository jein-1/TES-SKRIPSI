import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dimsstsu.app',
  appName: 'AEGIS RESPONSE',
  webDir: 'dist',

  // ── KUNCI: Koneksi langsung ke Railway server ──────────────
  // APK akan load web content DARI Railway, bukan dari assets lokal
  // Ini memastikan APK selalu sync dengan server secara real-time
  server: {
    url: 'https://tes-skripsi-production.up.railway.app',
    cleartext: false,
    androidScheme: 'https',
  },

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
      overlaysWebView: false,   // FIX: jangan tumpang tindih dengan konten app
    },
    Geolocation: {},
    Camera: {},
  },
  android: {
    allowMixedContent: false,
    webContentsDebuggingEnabled: false,
    // backgroundColor: '#0a1020', // warna background native
  },
};

export default config;
