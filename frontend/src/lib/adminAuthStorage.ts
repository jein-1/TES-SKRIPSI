// ═══════════════════════════════════════════════════════════════
// adminAuthStorage.ts — A.T.L.A.S Admin Role Authority & Zero-Trust Verification
// ═══════════════════════════════════════════════════════════════

export interface RegisteredAdmin {
  id: string
  role: string          // e.g. 'ARCHITECT', 'MAYOR-01', 'MAYOR-02', 'REGENT-01', 'REGENT-02', 'SAR-01', 'SAR'
  name: string          // Nama Lengkap Resmi
  nik: string           // NIK 16 Digit
  pin: string           // PIN / Password
  province?: string     // e.g. 'Sulawesi Tengah'
  city?: string         // e.g. 'Kota Palu'
  status: 'PENDING' | 'APPROVED' | 'SUSPENDED'
  createdAt: number
  approvedAt?: number
}

const STORAGE_KEY = 'atlas_registered_admins_v2'
const LOCKOUT_KEY = 'atlas_admin_lockout'
const FAILS_KEY = 'atlas_admin_fails'

// Default seed if no admins exist
const DEFAULT_SEED: RegisteredAdmin[] = [
  {
    id: 'adm-architect-root',
    role: 'ARCHITECT',
    name: 'Chief Systems Architect',
    nik: '7271000000000001',
    pin: 'atlas@2026',
    province: 'Sulawesi Tengah',
    city: 'SEMUA WILAYAH',
    status: 'APPROVED',
    createdAt: 1730000000000,
    approvedAt: 1730000000000
  },
  {
    id: 'adm-demo-admin',
    role: 'SAR-01',
    name: 'Komandan SAR Operasional',
    nik: '7271012345678901',
    pin: 'admin',
    province: 'Sulawesi Tengah',
    city: 'Kota Palu',
    status: 'APPROVED',
    createdAt: 1730000000000,
    approvedAt: 1730000000000
  }
]

export function getRegisteredAdmins(): RegisteredAdmin[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SEED))
      return DEFAULT_SEED
    }
    const list: RegisteredAdmin[] = JSON.parse(raw)
    return list
  } catch (e) {
    console.warn('[AdminAuthStorage] Read error:', e)
    return DEFAULT_SEED
  }
}

export function saveRegisteredAdmins(list: RegisteredAdmin[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
    window.dispatchEvent(new CustomEvent('atlas_admins_updated', { detail: list }))
  } catch (e) {
    console.warn('[AdminAuthStorage] Write error:', e)
  }
}

// Single-seat exclusive roles (Hanya boleh 1 akun aktif dalam satu waktu)
export const EXCLUSIVE_ROLES = ['MAYOR-01', 'MAYOR-02', 'REGENT-01', 'REGENT-02', 'SAR-01']

export function registerNewAdmin(params: {
  role: string
  name: string
  nik: string
  pin: string
  province?: string
  city?: string
}): { success: boolean; error?: string } {
  const list = getRegisteredAdmins()
  const normalizedRole = params.role.trim().toUpperCase()

  // 1. Role collision checker untuk jabatan tunggal
  if (EXCLUSIVE_ROLES.includes(normalizedRole)) {
    const existing = list.find(a => a.role === normalizedRole && a.status === 'APPROVED')
    if (existing) {
      return {
        success: false,
        error: `Kode Peran ${normalizedRole} sudah aktif terdaftar pada unit lain. Pendaftaran ganda ditolak demi integritas komando.`
      }
    }
  }

  // 2. Cek apakah ada yang pending dengan role dan NIK yang sama
  const duplicatePending = list.find(a => a.role === normalizedRole && a.nik === params.nik.trim() && a.status === 'PENDING')
  if (duplicatePending) {
    return {
      success: false,
      error: `Pendaftaran dengan Kode Peran ${normalizedRole} dan NIK Anda sedang menunggu persetujuan.`
    }
  }

  const newAdmin: RegisteredAdmin = {
    id: `adm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    role: normalizedRole,
    name: params.name.trim(),
    nik: params.nik.trim(),
    pin: params.pin.trim(),
    province: params.province?.trim() || 'Sulawesi Tengah',
    city: params.city?.trim() || 'Kota Palu',
    status: normalizedRole === 'ARCHITECT' ? 'APPROVED' : 'PENDING',
    createdAt: Date.now()
  }

  list.push(newAdmin)
  saveRegisteredAdmins(list)
  return { success: true }
}

export function updateAdminPin(id: string, newPin: string): boolean {
  try {
    const list = getRegisteredAdmins()
    const target = list.find(a => a.id === id)
    if (!target) return false
    target.pin = newPin.trim()
    saveRegisteredAdmins(list)
    return true
  } catch {
    return false
  }
}

// Anti-bruteforce Lockout Helper
export function getLockoutStatus(): { locked: boolean; remainingSec: number } {
  try {
    const lockoutUntil = parseInt(localStorage.getItem(LOCKOUT_KEY) || '0', 10)
    const now = Date.now()
    if (lockoutUntil > now) {
      return { locked: true, remainingSec: Math.ceil((lockoutUntil - now) / 1000) }
    }
    return { locked: false, remainingSec: 0 }
  } catch {
    return { locked: false, remainingSec: 0 }
  }
}

export function recordFailedLogin(): { locked: boolean; remainingSec: number; fails: number } {
  try {
    const fails = parseInt(localStorage.getItem(FAILS_KEY) || '0', 10) + 1
    localStorage.setItem(FAILS_KEY, fails.toString())

    if (fails >= 3) {
      const lockoutDurationMs = 15 * 60 * 1000 // 15 menit
      const lockoutUntil = Date.now() + lockoutDurationMs
      localStorage.setItem(LOCKOUT_KEY, lockoutUntil.toString())
      localStorage.setItem(FAILS_KEY, '0')
      return { locked: true, remainingSec: 15 * 60, fails }
    }
    return { locked: false, remainingSec: 0, fails }
  } catch {
    return { locked: false, remainingSec: 0, fails: 1 }
  }
}

export function resetFailedLogins(): void {
  try {
    localStorage.removeItem(FAILS_KEY)
    localStorage.removeItem(LOCKOUT_KEY)
    window.dispatchEvent(new CustomEvent('atlas_admins_updated'))
  } catch {}
}

export function unfreezeAdminAccount(id: string): boolean {
  try {
    const list = getRegisteredAdmins()
    const target = list.find(a => a.id === id)
    if (target) {
      target.status = 'APPROVED'
      saveRegisteredAdmins(list)
    }
    resetFailedLogins()
    return true
  } catch {
    return false
  }
}

export function getPendingAndLockedCount(): number {
  try {
    const list = getRegisteredAdmins()
    const pending = list.filter(a => a.status === 'PENDING').length
    const suspended = list.filter(a => a.status === 'SUSPENDED').length
    const lockout = getLockoutStatus()
    return pending + suspended + (lockout.locked && suspended === 0 ? 1 : 0)
  } catch {
    return 0
  }
}

export function verifyAdminLogin(role: string, pin: string): {
  success: boolean
  admin?: RegisteredAdmin
  error?: string
} {
  const normalizedRole = role.trim().toUpperCase()
  const trimmedPin = pin.trim()
  const list = getRegisteredAdmins()

  // Master ARCHITECT recovery override: kredensial ARCHITECT master yang valid langsung membuka dan me-reset pembekuan terminal
  const architectAccount = list.find(a => a.role === 'ARCHITECT' && a.pin === trimmedPin)
  if (normalizedRole === 'ARCHITECT' && architectAccount) {
    resetFailedLogins()
    return { success: true, admin: architectAccount }
  }

  const lockout = getLockoutStatus()
  if (lockout.locked) {
    return {
      success: false,
      error: `Akses dibekukan sementara demi keamanan. Tunggu ${Math.ceil(lockout.remainingSec / 60)} menit lagi.`
    }
  }

  const match = list.find(a => a.role === normalizedRole && a.pin === trimmedPin)
  if (!match) {
    const res = recordFailedLogin()
    if (res.locked) {
      return {
        success: false,
        error: `Gagal 3 kali berturut-turut! Terminal dibekukan selama 15 menit demi keamanan.`
      }
    }
    return {
      success: false,
      error: 'Katasandi salah'
    }
  }

  if (match.status === 'PENDING') {
    return {
      success: false,
      error: 'Akun Anda sedang dalam proses verifikasi & persetujuan otoritas pusat.'
    }
  }

  if (match.status === 'SUSPENDED') {
    return {
      success: false,
      error: 'Akses peran ini telah dinonaktifkan oleh otoritas sistem.'
    }
  }

  resetFailedLogins()
  return { success: true, admin: match }
}

export function updateAdminStatus(id: string, status: 'APPROVED' | 'SUSPENDED'): void {
  const list = getRegisteredAdmins()
  const target = list.find(a => a.id === id)
  if (target) {
    target.status = status
    if (status === 'APPROVED') target.approvedAt = Date.now()
    saveRegisteredAdmins(list)
  }
}

export function deleteRegisteredAdmin(id: string): void {
  const list = getRegisteredAdmins().filter(a => a.id !== id)
  saveRegisteredAdmins(list)
}
