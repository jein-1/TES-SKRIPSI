/**
 * cap-admin-sync.js
 * Swap capacitor.config.ts ↔ capacitor.admin.config.ts sementara,
 * jalankan "cap sync android-admin", lalu kembalikan config semula.
 * Juga salin dist-admin ke android-admin assets.
 */
import { execSync } from 'child_process'
import { copyFileSync, cpSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const mainCfg   = join(root, 'capacitor.config.ts')
const adminCfg  = join(root, 'capacitor.admin.config.ts')
const backupCfg = join(root, 'capacitor.config.ts.bak')

console.log('🔄 Swapping capacitor config to admin...')
copyFileSync(mainCfg, backupCfg)       // backup main config
copyFileSync(adminCfg, mainCfg)        // replace with admin config

try {
  // Copy dist-admin web assets to android-admin
  const destAssets = join(root, 'android-admin', 'app', 'src', 'main', 'assets', 'public')
  if (!existsSync(destAssets)) mkdirSync(destAssets, { recursive: true })
  cpSync(join(root, 'dist-admin'), destAssets, { recursive: true })
  console.log('✅ Copied dist-admin → android-admin assets')

  // Also copy capacitor.config.json
  const capJson = join(root, 'android-admin', 'app', 'src', 'main', 'assets', 'capacitor.config.json')
  execSync('npx cap sync android-admin', { cwd: root, stdio: 'inherit' })
  console.log('✅ cap sync android-admin done')
} catch (e) {
  console.error('❌ Sync failed:', e.message)
} finally {
  // Always restore main config
  copyFileSync(backupCfg, mainCfg)
  console.log('✅ Restored main capacitor config')
}
