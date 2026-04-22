import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dimsstsu.app',
  appName: 'AEGIS RESPONSE',
  webDir: 'dist',

  // ── KUNCI: Koneksi langsung ke Railway server ──────────────
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
      overlaysWebView: false,
    },
    Geolocation: {},
    Camera: {},
    // ── Background Runner: cek tsunami tiap 15 menit meski app ditutup ──
    BackgroundRunner: {
      label: 'aegis.background.check',     // identifier unik
      src: 'runner.js',                     // file di public/runner.js
      event: 'aegisBackgroundCheck',        // nama event di runner.js
      repeat: true,                         // ulangi terus
      interval: 15,                         // setiap 15 menit (iOS/Android minimum)
      autoStart: true,                      // mulai otomatis setelah install
    },
  },
  android: {
    allowMixedContent: false,
    webContentsDebuggingEnabled: false,
  },
};

export default config;
