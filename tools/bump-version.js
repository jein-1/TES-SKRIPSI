// ═══════════════════════════════════════════════════════════════
// AEGIS RESPONSE — Auto Version Bump (CI/CD)
// Otomatis increment versionCode + versionName setiap cap:sync
// Tidak perlu sentuh build.gradle manual lagi!
// ═══════════════════════════════════════════════════════════════
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

function bumpGradle(gradlePath, label) {
  if (!existsSync(gradlePath)) {
    console.log(`⚠️  [${label}] build.gradle tidak ditemukan: ${gradlePath}`)
    return
  }

  let content = readFileSync(gradlePath, 'utf8')

  // ── Bump versionCode (integer) ───────────────────────────────
  const codeMatch = content.match(/versionCode\s+(\d+)/)
  if (!codeMatch) {
    console.log(`⚠️  [${label}] versionCode tidak ditemukan`)
    return
  }
  const oldCode = parseInt(codeMatch[1])
  const newCode = oldCode + 1
  content = content.replace(/versionCode\s+\d+/, `versionCode ${newCode}`)

  // ── Bump versionName patch (e.g. "1.0.5" → "1.0.6") ─────────
  const nameMatch = content.match(/versionName\s+"(\d+)\.(\d+)\.(\d+)"/)
  let oldName = '—', newName = '—'
  if (nameMatch) {
    const [, major, minor, patch] = nameMatch
    oldName = `${major}.${minor}.${patch}`
    newName = `${major}.${minor}.${parseInt(patch) + 1}`
    content = content.replace(
      /versionName\s+"\d+\.\d+\.\d+"/,
      `versionName "${newName}"`
    )
  }

  writeFileSync(gradlePath, content)
  console.log(`✅ [${label}] versionCode ${oldCode} → ${newCode}  |  versionName ${oldName} → ${newName}`)
}

// ── Header ───────────────────────────────────────────────────────
console.log('\n🚀 ════════════════════════════════════════════')
console.log('   AEGIS CI/CD — Auto Version Bump')
console.log('════════════════════════════════════════════\n')

bumpGradle(join(ROOT, 'android',       'app', 'build.gradle'), 'USER  APK')
bumpGradle(join(ROOT, 'android-admin', 'app', 'build.gradle'), 'ADMIN APK')

console.log('\n✅ Version bump selesai! Build dimulai...\n')
