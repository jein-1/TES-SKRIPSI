import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.dimsstsu.app",
  appName: "AEGIS RESPONSE",
  webDir: "dist",

  // ── MODE FINAL (PRODUCTION / OFFLINE) ──────────────
  // Blok server sengaja dimatikan agar aplikasi mandiri
  /*
  server: {
    url: 'http://192.168.x.x:5173',
    cleartext: true,
  },
  */

  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#080e1a",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
    },
    StatusBar: {
      style: "Dark",
      backgroundColor: "#0a1020",
      overlaysWebView: false, // Mencegah konten tertimpa ikon baterai/jam HP
    },
    Geolocation: {},
    Camera: {},
  },
  android: {
    allowMixedContent: false,
    webContentsDebuggingEnabled: false,
  },
};

export default config;
