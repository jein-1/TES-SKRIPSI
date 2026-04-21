/**
 * cap-admin-open.js — Buka android-admin di Android Studio
 * Menggunakan 'start' Windows / 'open' Mac untuk membuka folder project
 */
import { execSync } from 'child_process'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { existsSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const adminAndroidPath = join(root, 'android-admin')

if (!existsSync(adminAndroidPath)) {
  console.error('❌ Folder android-admin tidak ditemukan.')
  process.exit(1)
}

console.log('🚀 Membuka android-admin di Android Studio...')
console.log(`   Path: ${adminAndroidPath}`)

const platform = process.platform
try {
  if (platform === 'win32') {
    // Windows: buka dengan Android Studio via studio64.exe atau lewat file association
    execSync(`explorer.exe "${adminAndroidPath}"`, { stdio: 'inherit' })
    console.log('✅ Folder android-admin dibuka di Explorer.')
    console.log('   Drag folder ini ke Android Studio, atau buka via: File → Open')
  } else if (platform === 'darwin') {
    execSync(`open -a "Android Studio" "${adminAndroidPath}"`, { stdio: 'inherit' })
  } else {
    execSync(`studio.sh "${adminAndroidPath}"`, { stdio: 'inherit' })
  }
} catch {
  console.log(`\n📂 Buka folder ini manual di Android Studio:\n   ${adminAndroidPath}`)
}
