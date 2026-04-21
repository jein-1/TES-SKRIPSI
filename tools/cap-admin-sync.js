/**
 * cap-admin-sync.js
 * Sync dist-admin ke android-admin secara manual (tanpa cap CLI)
 * karena Capacitor hanya kenal platform "android" / "ios".
 *
 * Yang dilakukan:
 *  1. Copy dist-admin/* ke android-admin/app/src/main/assets/public/
 *  2. Generate capacitor.config.json (dari capacitor.admin.config.ts) ke android-admin assets
 *  3. Copy node_modules plugin native sources jika diperlukan
 */
import { cpSync, existsSync, mkdirSync, writeFileSync, rmSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const distAdmin   = join(root, 'dist-admin')
const destAssets  = join(root, 'android-admin', 'app', 'src', 'main', 'assets', 'public')
const destCfgJson = join(root, 'android-admin', 'app', 'src', 'main', 'assets', 'capacitor.config.json')

// ── 1. Validasi dist-admin ada ────────────────────────────────
if (!existsSync(distAdmin)) {
  console.error('❌ dist-admin tidak ditemukan. Jalankan: npm run build:admin')
  process.exit(1)
}

// ── 2. Bersihkan lalu copy web assets ─────────────────────────
console.log('📦 Copying web assets dist-admin → android-admin...')
if (existsSync(destAssets)) rmSync(destAssets, { recursive: true })
mkdirSync(destAssets, { recursive: true })
cpSync(distAdmin, destAssets, { recursive: true })
console.log('✅ Web assets copied')

// ── 3. Generate capacitor.config.json untuk android-admin ─────
const capConfig = {
  appId:   'com.dimsstsu.admin',
  appName: 'AEGIS ADMIN',
  webDir:  'dist-admin',
  android: { path: 'android-admin' },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0a1020',
    },
    StatusBar: {
      style: 'Dark',
      backgroundColor: '#0a1020',
    },
  },
}
writeFileSync(destCfgJson, JSON.stringify(capConfig, null, 2), 'utf-8')
console.log('✅ capacitor.config.json generated')

// ── 4. Selesai ────────────────────────────────────────────────
console.log('')
console.log('🎉 android-admin siap!')
console.log('   Buka Android Studio: npm run cap:open:admin')
console.log('   Lalu: Build → Generate Signed APK → pilih release')
