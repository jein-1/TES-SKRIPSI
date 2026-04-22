import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dimsstsu.admin',
  appName: 'APLIKASI (ADMIN) UJICOBA EVAKUASI TSUNAMI OLEH DIMAS DIVAT MANDA',
  webDir: 'dist-admin',

  // ── Koneksi ke Railway server (admin mode) ─────────────────
  // APK admin load dari Railway dengan key admin otomatis
  server: {
    url: 'https://tes-skripsi-production.up.railway.app/?key=aegis2024',
    cleartext: false,
    androidScheme: 'https',
  },

  android: {
    path: 'android-admin',
    allowMixedContent: false,
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0a1020',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    StatusBar: {
      style: 'Dark',
      backgroundColor: '#0a1020',
      overlaysWebView: false,   // FIX: tidak tumpang tindih status bar
    },
    Geolocation: {},
    Camera: {},
  },
};

export default config;
