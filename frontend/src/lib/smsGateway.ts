// ═══════════════════════════════════════════════════════════════
// A.T.L.A.S TACTICAL SOS & SMS GATEWAY
// (Autonomous Threat Location & Alert System)
// Mengirimkan koordinat darurat, NIK, dan waktu via sinyal 2G GSM / SMS standar
// saat paket data internet dan menara 4G/5G tumbang akibat bencana.
// ═══════════════════════════════════════════════════════════════

export interface SmsSosParams {
  lat?: number;
  lng?: number;
  userName?: string;
  userNik?: string;
  batteryPct?: number | null;
  shelterName?: string;
  targetPhone?: string; // Nomor darurat keluarga / kerabat / relawan
}

export function formatEmergencyTimestamp(date: Date = new Date()): string {
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const dayName = days[date.getDay()];
  
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  
  return `${dayName}, ${dd}/${mm}/${yyyy} ${hh}:${min}:${ss} WITA`;
}

export function generateSmsSosBody(params: SmsSosParams): string {
  const waktuStr = formatEmergencyTimestamp();
  const latStr = params.lat != null ? params.lat.toFixed(5) : 'UNKNOWN';
  const lngStr = params.lng != null ? params.lng.toFixed(5) : 'UNKNOWN';
  const nameStr = params.userName && params.userName.trim() ? params.userName : 'KORBAN';
  const nikStr = params.userNik && params.userNik.trim() ? params.userNik : '-';
  const shelterStr = params.shelterName || 'Shelter Evakuasi Terdekat';

  return `🚨 SOS DARURAT - A.T.L.A.S 🚨\nWaktu: ${waktuStr}\nNama: ${nameStr}\nNIK: ${nikStr}\nStatus: MEMBUTUHKAN BANTUAN EVAKUASI!\n\n📍 Titik Koordinat:\n${latStr}, ${lngStr}\n\n🏠 Evakuasi Menuju:\n${shelterStr}\n\n🗺️ Buka Lokasi di Google Maps:\nhttps://maps.google.com/?q=${latStr},${lngStr}`;
}

export function sendEmergencySmsSos(params: SmsSosParams) {
  const body = generateSmsSosBody(params);
  const phone = params.targetPhone?.trim() || '';
  // Jika phone ada, gunakan sms:PHONE?body=..., jika kosong buka sms:?body=... agar user dapat memilih nomor tujuan di HP
  const smsUri = phone ? `sms:${phone}?body=${encodeURIComponent(body)}` : `sms:?body=${encodeURIComponent(body)}`;

  if (typeof window !== 'undefined') {
    window.location.href = smsUri;
  }
}

export function callEmergency115() {
  if (typeof window !== 'undefined') {
    window.location.href = 'tel:115';
  }
}

