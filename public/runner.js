// ═══════════════════════════════════════════════════════════════
// AEGIS RESPONSE — Background Runner Task
// Berjalan di background meskipun app DITUTUP TOTAL
// Cek status tsunami setiap interval & kirim notifikasi darurat
// ═══════════════════════════════════════════════════════════════

const RAILWAY_URL = 'https://tes-skripsi-production.up.railway.app'

addEventListener('aegisBackgroundCheck', async (resolve, reject, _args) => {
  try {
    // ── 1. Cek status tsunami dari server ──────────────────────
    const response = await fetch(`${RAILWAY_URL}/api/tsunami`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    })

    if (!response.ok) { resolve(); return }

    const data = await response.json()

    if (data.active) {
      // ── 2. Tampilkan notifikasi lokal darurat ────────────────
      await CapacitorNotifications.schedule([{
        id: 9001,
        title: '🚨 PERINGATAN TSUNAMI!',
        body: 'SEGERA EVAKUASI! Buka AEGIS Response untuk rute aman terdekat.',
        sound: 'default',
        smallIcon: 'ic_stat_icon_config_sample',
        iconColor: '#ef4444',
        attachments: null,
        actionTypeId: '',
        extra: null,
      }])

      // ── 3. Getar HP ──────────────────────────────────────────
      // (Vibration di background runner tidak selalu didukung semua device)
      // Sebaiknya andalkan notifikasi dengan suara

      console.log('[AegisRunner] 🚨 Tsunami AKTIF — notifikasi dikirim')
    } else {
      console.log('[AegisRunner] ✅ Tidak ada tsunami — sistem aman')
    }

    resolve()
  } catch (err) {
    console.error('[AegisRunner] Error:', err)
    reject(err)
  }
})
