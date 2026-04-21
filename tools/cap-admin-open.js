/**
 * cap-admin-open.js — Buka Android Studio untuk project android-admin
 */
import { execSync } from 'child_process'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

console.log('🚀 Opening android-admin in Android Studio...')
execSync('npx cap open android-admin', { cwd: root, stdio: 'inherit' })
