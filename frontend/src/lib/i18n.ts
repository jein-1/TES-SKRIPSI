// ═══════════════════════════════════════════════════════════════
// A.T.L.A.S — Internationalization (i18n) Store & Dictionary
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect } from 'react'

export type Language = 'id' | 'en'

const listeners = new Set<(lang: Language) => void>()

let currentLang: Language = (() => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('atlasLanguage') as Language
    if (saved === 'id' || saved === 'en') return saved
  }
  return 'id'
})()

export function setLanguage(lang: Language) {
  currentLang = lang
  if (typeof window !== 'undefined') {
    localStorage.setItem('atlasLanguage', lang)
  }
  listeners.forEach((l) => l(lang))
}

export function getLanguage(): Language {
  return currentLang
}

export function useLanguage() {
  const [lang, setLangState] = useState<Language>(currentLang)

  useEffect(() => {
    const handler = (newLang: Language) => setLangState(newLang)
    listeners.add(handler)
    return () => {
      listeners.delete(handler)
    }
  }, [])

  return {
    lang,
    setLanguage,
    t: (key: keyof typeof translations['id']) => {
      return translations[lang][key] || translations['id'][key] || key
    }
  }
}

export const translations = {
  id: {
    fullName: 'Autonomous Threat Location & Alert System',
    systemTelemetry: 'A.T.L.A.S // SISTEM TELEMETRI OTOMONOM',
    detectingLocation: 'Mendeteksi lokasi Anda...',
    locationPermissionRequired: 'Izin Lokasi Diperlukan (Aktifkan GPS)',
    welcome: 'Selamat Datang!',
    welcomeSubtitle: 'Masukkan nama Anda agar keluarga dan sistem dapat mengidentifikasi Anda.',
    editProfile: 'Ubah Profil',
    editSubtitle: 'Ubah nama tampilan Anda. Nama ini digunakan di jaringan darurat.',
    nameLabel: 'Nama Lengkap',
    nameHint: '(min 5 huruf, hanya huruf & spasi)',
    namePlaceholder: 'cth. Arya Pratama',
    oneDeviceOneReg: '1 Perangkat = 1 Registrasi',
    oneDeviceDesc: 'Nama yang dimasukkan tersimpan permanen di perangkat ini.',
    device: 'Perangkat',
    continue: 'Lanjutkan',
    saveProfile: 'Simpan Profil',
    allSecure: 'SEMUA INDIKATOR AMAN',
    safeDesc: 'Tidak ada anomali gelombang tsunami atau aktivitas seismik kritis terdeteksi.',
    confirmSafe: 'SAYA DALAM KONDISI AMAN',
    confirmDanger: 'DARURAT // SAYA BUTUH PERTOLONGAN',
    statusSafeNotif: 'STATUS ANDA BERHASIL DIKONFIRMASI: AMAN',
    statusDangerNotif: 'SINYAL DARURAT DIKIRIM KE TIM SAR',
    linkedPersonnel: 'UNIT PERSONEL TERTAUT',
    familyUnit: 'Unit Keluarga',
    evacGuides: 'PROTOKOL TAKTIS',
    evacGuidesTitle: 'Protokol Evakuasi Tsunami',
    evacGuidesDesc: 'Standar Operasional Darurat & Titik Kumpul Aman',
    tacticalArchive: 'ARSIP TELEMETRI EVAKUASI',
    avgResponse: 'Rata-rata Waktu Respons',
    allLogs: 'SEMUA LOG',
    realAlerts: 'PERINGATAN RIIL',
    simulation: 'SIMULASI',
    noLogs: 'Belum ada riwayat evakuasi',
    emergencyCockpit: 'KOKPIT EVAKUASI DARURAT',
    tacticalMap: 'PETA TAKTIS'
  },
  en: {
    fullName: 'Autonomous Threat Location & Alert System',
    systemTelemetry: 'A.T.L.A.S // SYSTEM TELEMETRY',
    detectingLocation: 'Detecting your location...',
    locationPermissionRequired: 'Location Permission Required (Enable GPS)',
    welcome: 'Welcome!',
    welcomeSubtitle: 'Enter your name so family members and rescue systems can identify you.',
    editProfile: 'Edit Profile',
    editSubtitle: 'Change your display name. Used within the emergency response unit.',
    nameLabel: 'Full Name',
    nameHint: '(min 5 characters, letters & spaces only)',
    namePlaceholder: 'e.g. John Doe',
    oneDeviceOneReg: '1 Device = 1 Registration',
    oneDeviceDesc: 'Your identifier is securely registered to this device.',
    device: 'Device',
    continue: 'Continue',
    saveProfile: 'Save Profile',
    allSecure: 'ALL SYSTEMS SECURE',
    safeDesc: 'No tsunami wave anomalies or critical seismic activity detected in your sector.',
    confirmSafe: 'I AM CURRENTLY SAFE',
    confirmDanger: 'EMERGENCY // NEED ASSISTANCE',
    statusSafeNotif: 'STATUS VERIFIED: SAFE',
    statusDangerNotif: 'EMERGENCY SIGNAL TRANSMITTED TO RESCUE UNIT',
    linkedPersonnel: 'LINKED PERSONNEL',
    familyUnit: 'Family Unit',
    evacGuides: 'TACTICAL PROTOCOL',
    evacGuidesTitle: 'Tsunami Evacuation Manual',
    evacGuidesDesc: 'Standard Operating Procedures & Safe Rally Points',
    tacticalArchive: 'EVACUATION TELEMETRY ARCHIVE',
    avgResponse: 'Avg. Response Time',
    allLogs: 'ALL LOGS',
    realAlerts: 'REAL ALERTS',
    simulation: 'SIMULATION',
    noLogs: 'No evacuation logs recorded yet',
    emergencyCockpit: 'EMERGENCY EVAC COCKPIT',
    tacticalMap: 'TACTICAL MAP'
  }
}
