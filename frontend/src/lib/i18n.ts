// ═══════════════════════════════════════════════════════════════
// A.T.L.A.S — Internationalization (i18n) Store & Dictionary
// Comprehensive Bilingual Translation (ID & EN)
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
    fullNameSub: 'Sistem Otonom Pemetaan Ancaman Bahaya dan Peringatan Darurat',
    systemTelemetry: 'A.T.L.A.S // SISTEM TELEMETRI OTONOM',
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
    allSensorsNominal: 'SEMUA SENSOR NORMAL',
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
    ipAddress: 'Alamat IP',

    // Family Page
    familyHeader: 'DIREKTORI UNIT KELUARGA',
    familySub: 'Pantauan Lokasi & Status Keselamatan Personel',
    addMemberBtn: 'Tambah Anggota',
    scanQrBtn: 'Pindai QR',
    myQrBtn: 'QR Saya',
    noFamilyYet: 'Belum Ada Anggota Keluarga',
    noFamilyDesc: 'Tambahkan anggota keluarga dengan memindai kode QR perangkat mereka atau bagikan QR Anda.',
    statusSafeText: 'AMAN',
    statusEvacText: 'EVAKUASI',
    statusDangerText: 'DARURAT',
    lastSync: 'Sinkronisasi Terakhir',
    memberDeleted: 'Anggota berhasil dihapus',
    confirmDeleteMember: 'Hapus anggota ini dari unit keluarga?',

    // Guides Page
    guidesHeader: 'PANDUAN OPERASIONAL DARURAT',
    guidesSubtitle: 'Direktif Taktis Bencana & Pertolongan Pertama (First Aid)',
    goldenRuleLabel: 'ATURAN EMAS KESELAMATAN',
    keyStepsLabel: 'LANGKAH TINDAKAN UTAMA',
    precautionsLabel: 'PERINGATAN & TINDAKAN PREVENTIF',
    firstAidHeader: 'PROTOKOL PERTOLONGAN PERTAMA (FIRST AID)',
    firstAidSub: 'Pedoman Penyelamatan Darurat Medis Lapangan',

    // Menu & Settings
    menuTitle: 'Pusat Kontrol & Pengaturan',
    menuSubtitle: 'Konfigurasi Sistem Taktis A.T.L.A.S',
    sectionAppearance: 'TAMPILAN & AKSESIBILITAS',
    sectionNotifications: 'SISTEM NOTIFIKASI DARURAT',
    sectionInformation: 'INFORMASI & DOKUMENTASI',
    appearanceTitle: 'Tampilan',
    appearanceSub: 'Tema Taktis, Aksesibilitas, dan Tata Letak',
    notificationsTitle: 'Notifikasi',
    notificationsSub: 'Kanal Peringatan Suara, DND & Uji Sirene',
    wartaTitle: 'News & Log Pembaruan',
    wartaSub: 'Catatan Rilis & Log Pembaruan Sistem',
    newsTitle: 'News & Log Pembaruan',
    newsSub: 'Catatan Rilis & Log Pembaruan Sistem',
    aboutTitle: 'Tentang A.T.L.A.S',
    aboutSub: 'Spesifikasi Sistem & Otonomi Pertahanan',

    // Appearance Subpage
    themeOptions: 'PILIHAN TEMA TAMPILAN',
    themeDarkTactical: 'DARK (TAKTIKAL)',
    themeLight: 'LIGHT',
    accessibleThemes: 'TEMA AKSESIBILITAS',
    contrastLabel: 'Tingkat Kontras',
    contrastStandard: 'Standard',
    contrastHigh: 'High',
    colourVisionLabel: 'Penglihatan Warna',
    fontSizeLabel: 'Ukuran Font',
    fontSizeDevice: 'Pengaturan Perangkat',
    fontSizeSmall: 'Kecil',
    fontSizeMedium: 'Sedang',
    fontSizeLarge: 'Besar',
    fontThicknessLabel: 'Ketebalan Huruf',
    fontThicknessDevice: 'Pengaturan Perangkat',
    fontThicknessRegular: 'Biasa',
    fontThicknessBold: 'Tebal',
    screenReaderSection: 'PEMBACA LAYAR (TALKBACK)',
    screenReaderDefault: 'Standar (Default)',
    screenReaderDefaultDesc: 'Tampilkan antarmuka dalam tata letak visual taktis standar.',
    screenReaderTalkBack: 'Kompatibel Pembaca Layar',
    screenReaderTalkBackDesc: 'Sesuaikan tata letak untuk kemudahan navigasi perangkat lunak pembaca layar (TalkBack).',

    // DND & Notif Subpages
    dndAccessTitle: 'Akses "Jangan Ganggu" (DND)',
    dndAccessSub: 'Pengaturan Bypass Suara Sistem Android',
    localNotifTitle: 'Pengaturan Notifikasi Lokal',
    localNotifSub: 'Kanal Sistem & Prioritas Audio Hardware',
    testAlertsTitle: 'Uji Peringatan (Test Notification)',
    testAlertsSub: 'Verifikasi Kesiapan Sirine & Getaran Haptic',
    swipeToDismiss: 'Geser ke atas untuk menghapus notifikasi',

    // Profile & Node Identity
    terminalIdentity: 'IDENTITAS TERMINAL',
    nodeIdentity: 'IDENTITAS NODE',
    nodePublic: 'NODE-P // WARGA',
    nodeCommand: 'NODE-01 // KOMANDO',
    authenticatedStatus: 'TERAUTENTIKASI RESMI',
    fullNameLabel: 'NAMA LENGKAP TERDAFTAR',
    nikRegisteredLabel: 'NIK KTP TERVERIFIKASI',
    regionalTelemetryNode: 'Node Telemetri Regional',
    reclaimNodeTitle: 'Verifikasi Hak Akses Komando (Node-01)',
    reclaimNodeDesc: 'Masukkan PIN Kredensial Komando untuk menetapkan perangkat ini sebagai NODE-01.',
    enterPin: 'Masukkan PIN Komando',
    verifyPin: 'Verifikasi',
    invalidPin: 'PIN Komando tidak valid'
  },
  en: {
    fullName: 'Autonomous Threat Location & Alert System',
    fullNameSub: 'Autonomous Hazard Mapping and Emergency Alert System',
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
    allSensorsNominal: 'ALL SENSORS NORMAL',
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
    ipAddress: 'IP Address',

    // Family Page
    familyHeader: 'FAMILY PERSONNEL DIRECTORY',
    familySub: 'Personnel Location Tracking & Safety Verification',
    addMemberBtn: 'Add Member',
    scanQrBtn: 'Scan QR',
    myQrBtn: 'My QR',
    noFamilyYet: 'No Family Members Linked',
    noFamilyDesc: 'Add family personnel by scanning their terminal QR code or sharing your own.',
    statusSafeText: 'SAFE',
    statusEvacText: 'EVACUATING',
    statusDangerText: 'EMERGENCY',
    lastSync: 'Last Synchronized',
    memberDeleted: 'Member successfully removed',
    confirmDeleteMember: 'Remove this personnel from your family unit?',

    // Guides Page
    guidesHeader: 'EMERGENCY OPERATING DIRECTIVES',
    guidesSubtitle: 'Tactical Disaster Protocols & Field First Aid Procedures',
    goldenRuleLabel: 'GOLDEN SAFETY DIRECTIVE',
    keyStepsLabel: 'PRIMARY ACTION STEPS',
    precautionsLabel: 'PRECAUTIONARY MEASURES',
    firstAidHeader: 'FIRST AID MEDICAL PROTOCOLS',
    firstAidSub: 'Field Emergency Trauma Care & Stabilization',

    // Menu & Settings
    menuTitle: 'Control Center & Settings',
    menuSubtitle: 'A.T.L.A.S Tactical System Configuration',
    sectionAppearance: 'APPEARANCE & ACCESSIBILITY',
    sectionNotifications: 'EMERGENCY NOTIFICATION SYSTEM',
    sectionInformation: 'INFORMATION & DOCUMENTATION',
    appearanceTitle: 'Appearance',
    appearanceSub: 'Tactical Theme, Accessibility & Display Layout',
    notificationsTitle: 'Notifications',
    notificationsSub: 'Audio Alarm Channels, DND & Siren Testing',
    wartaTitle: 'News & Changelog',
    wartaSub: 'Release Notes & System Telemetry Changelog',
    newsTitle: 'News & Changelog',
    newsSub: 'Release Notes & System Telemetry Changelog',
    aboutTitle: 'About A.T.L.A.S',
    aboutSub: 'System Architecture & Telemetry Specifications',

    // Appearance Subpage
    themeOptions: 'DISPLAY THEME PREFERENCE',
    themeDarkTactical: 'DARK (TACTICAL)',
    themeLight: 'LIGHT',
    accessibleThemes: 'ACCESSIBILITY THEMES',
    contrastLabel: 'Contrast',
    contrastStandard: 'Standard',
    contrastHigh: 'High',
    colourVisionLabel: 'Colour vision',
    fontSizeLabel: 'Font size',
    fontSizeDevice: 'Device setting',
    fontSizeSmall: 'Small',
    fontSizeMedium: 'Medium',
    fontSizeLarge: 'Large',
    fontThicknessLabel: 'Font thickness',
    fontThicknessDevice: 'Device setting',
    fontThicknessRegular: 'Regular',
    fontThicknessBold: 'Bold',
    screenReaderSection: 'SCREEN READER (TALKBACK)',
    screenReaderDefault: 'Default',
    screenReaderDefaultDesc: 'Display in the default layout.',
    screenReaderTalkBack: 'Screen reader compatible',
    screenReaderTalkBackDesc: 'Adjust the layout to make it easier for screen readers to read.',

    // DND & Notif Subpages
    dndAccessTitle: 'Do Not Disturb Access',
    dndAccessSub: 'Android System Volume Bypass Configuration',
    localNotifTitle: 'Local Notification Settings',
    localNotifSub: 'Hardware Audio Channels & Priority Alerting',
    testAlertsTitle: 'Test Notifications',
    testAlertsSub: 'Sirens, Haptics & Visual Heads-Up Verification',
    swipeToDismiss: 'Swipe up to dismiss notification',

    // Profile & Node Identity
    terminalIdentity: 'TERMINAL IDENTITY',
    nodeIdentity: 'NODE IDENTITY',
    nodePublic: 'NODE-P // CITIZEN',
    nodeCommand: 'NODE-01 // COMMAND',
    authenticatedStatus: 'OFFICIALLY AUTHENTICATED',
    fullNameLabel: 'REGISTERED FULL NAME',
    nikRegisteredLabel: 'VERIFIED NATIONAL ID (NIK)',
    regionalTelemetryNode: 'Regional Telemetry Node',
    reclaimNodeTitle: 'Verify Command Node (Node-01)',
    reclaimNodeDesc: 'Enter Command Credential PIN to designate this device as NODE-01.',
    enterPin: 'Enter Command PIN',
    verifyPin: 'Verify',
    invalidPin: 'Invalid Command PIN'
  }
}
