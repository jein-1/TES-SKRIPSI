import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dimsstsu.admin',          // App ID berbeda dari user APK
  appName: 'AEGIS ADMIN',              // Nama berbeda di launcher HP
  webDir: 'dist-admin',                 // Build output admin terpisah
  android: {
    path: 'android-admin',              // Folder android terpisah
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
    },
    Geolocation: {},
    Camera: {},
  },
};

export default config;
