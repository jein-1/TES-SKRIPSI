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
    fullName: 'Adaptive Tracking, Location & Alert System',
    systemTelemetry: 'A.T.L.A.S // SISTEM TELEMETRI OTOMONOM',
    detectingLocation: 'Mendeteksi lokasi Anda...',
    locationPermissionRequired: 'Izin Lokasi Diperlukan (Aktifkan GPS)',
    welcome: 'Selamat Datang!',
    welcomeSubtitle: 'Masukkan nama Anda agar keluarga dan sistem dapat mengidentifikasi Anda.',
    nameLabel: 'Nama Lengkap (Sesuai KTP)',
    nameHint: '(min 3 huruf, sesuai identitas resmi)',
    namePlaceholder: 'cth. Arya Pratama',
    nikLabel: 'Nomor Induk Kependudukan (NIK KTP)',
    nikHint: '(wajib 16 digit angka)',
    nikPlaceholder: 'cth. 7271012345670001',
    nikInvalid: 'NIK harus berupa 16 digit angka',
    oneDeviceOneReg: '1 Perangkat = 1 Registrasi KTP',
    oneDeviceDesc: 'Nama & NIK tersimpan permanen di perangkat ini (tidak dapat diubah kecuali install ulang).',
    device: 'Perangkat',
    continue: 'Lanjutkan',
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
    tacticalMap: 'PETA TAKTIS',
    defconStatus: 'STATUS DEFCON',
    defconNormal: 'LEVEL 1 // STANDBY NORMAL',
    allSensorsNominal: 'SEMUA SENSOR NOMINAL',
    reportSafetyStatus: 'LAPOR STATUS KESELAMATAN',
    reportSafetyDesc: 'Konfirmasikan kondisi keselamatan Anda ke Pusat Komando A.T.L.A.S dan grup keluarga.',
    iAmSafe: 'SAYA AMAN',
    confirmed: 'TERKONFIRMASI',
    signalTransmitted: 'SINYAL TERKIRIM:',
    membersVerifiedSafe: 'ANGGOTA TERVERIFIKASI AMAN',
    members: 'Anggota',
    tacticalProtocol: 'PROTOKOL TAKTIS',
    tsunamiProtocol: 'Protokol Evakuasi Tsunami',
    tsunamiProtocolDesc: 'Standar Operasional Darurat & Titik Kumpul Aman',
    gpsTelemetryMesh: 'JARINGAN TELEMETRI GPS',
    searchingSatelliteFix: 'MENCARI SINYAL SATELIT...',
    targetLock: 'TARGET TERKUNCI',
    liveSeismicFeed: 'SIARAN SEISMIK LANGSUNG',
    quakeDetected: 'Gempa Terdeteksi di Wilayah Indonesia',
    navStatus: 'STATUS',
    navNavigate: 'NAVIGASI',
    navSensors: 'SENSOR',
    navUnits: 'UNIT',
    currentIp: 'IP Publik',
    ipAddress: 'Alamat IP'
  },
  en: {
    fullName: 'Adaptive Tracking, Location & Alert System',
    systemTelemetry: 'A.T.L.A.S // SYSTEM TELEMETRY',
    detectingLocation: 'Detecting your location...',
    locationPermissionRequired: 'Location Permission Required (Enable GPS)',
    welcome: 'Welcome!',
    welcomeSubtitle: 'Enter your name so family members and rescue systems can identify you.',
    nameLabel: 'Full Name (as per ID card)',
    nameHint: '(min 3 characters, official identity)',
    namePlaceholder: 'e.g. John Doe',
    nikLabel: 'National Identity Number (NIK)',
    nikHint: '(mandatory 16 numeric digits)',
    nikPlaceholder: 'e.g. 7271012345670001',
    nikInvalid: 'NIK must be exactly 16 numeric digits',
    oneDeviceOneReg: '1 Device = 1 ID Registration',
    oneDeviceDesc: 'Name & NIK are permanently bound to this device (requires reinstall to reset).',
    device: 'Device',
    continue: 'Continue',
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
    tacticalMap: 'TACTICAL MAP',
    defconStatus: 'DEFCON STATUS',
    defconNormal: 'LEVEL 1 // STANDBY NORMAL',
    allSensorsNominal: 'ALL SENSORS NOMINAL',
    reportSafetyStatus: 'REPORT SAFETY STATUS',
    reportSafetyDesc: 'Confirm your safety status to A.T.L.A.S Command Center and family units.',
    iAmSafe: 'I AM SAFE',
    confirmed: 'CONFIRMED',
    signalTransmitted: 'SIGNAL TRANSMITTED:',
    membersVerifiedSafe: 'MEMBERS VERIFIED SAFE',
    members: 'Members',
    tacticalProtocol: 'TACTICAL PROTOCOL',
    tsunamiProtocol: 'Tsunami Evacuation Protocol',
    tsunamiProtocolDesc: 'Emergency Standard Procedures & Safe Assembly Points',
    gpsTelemetryMesh: 'GPS TELEMETRY MESH',
    searchingSatelliteFix: 'SEARCHING SATELLITE FIX...',
    targetLock: 'TARGET LOCK',
    liveSeismicFeed: 'LIVE SEISMIC FEED',
    quakeDetected: 'Earthquake Detected in Indonesian Territory',
    navStatus: 'STATUS',
    navNavigate: 'NAVIGATE',
    navSensors: 'SENSORS',
    navUnits: 'UNITS',
    currentIp: 'Public IP',
    ipAddress: 'IP Address'
  }
}
