export const ZRB_REFERENCE = {
  4: {
    label: 'ZRB 4',
    tipologi: 'ZONA TERLARANG',
    color: '#dc2626',
    kriteria: [
      '4 L : Zona likuifaksi masif pasca gempa (seperti Kws Petobo, Balaroa, Jono Oge, Lolu, dan Sibalaya)',
      '4 T : Zona sempadan patahan rawan tsunami minimal 100–200 meter dari titik pasang tertinggi (sempadan 100 m untuk Teluk Palu, kecuali di Kel. Lere, Besusu Barat, dan Talise, ditetapkan 200 m)',
      '4 S : Zona Sempadan Patahan Aktif Palu-Koro 0-10 meter (Zona Bahaya Deformasi Sesar Aktif)',
      '4 G : Zona Rawan Gerakan Tanah Tinggi Pasca Gempabumi',
    ],
    catatanUmum: 'Zona Rawan Gempabumi Tinggi',
    arahanSpasial: [
      'Dilarang pembangunan kembali dan pembangunan baru. Unit hunian pada zona ini direkomendasikan untuk direlokasi.',
      'Diprioritaskan pemanfaatan ruang untuk fungsi kawasan lindung, RTH, dan monumen.',
    ],
  },
  3: {
    label: 'ZRB 3',
    tipologi: 'ZONA TERBATAS',
    color: '#f97316',
    kriteria: [
      '3 S : Zona Sempadan Patahan Aktif Palu Koro pada 10-50 meter',
      '3 L : Zona Rawan Likuifaksi Sangat Tinggi',
      '3 T : Zona Rawan Tsunami Tinggi (KRB III) di luar sempadan pantai',
      '3 G : Zona Rawan Gerakan Tanah Tinggi',
    ],
    catatanUmum: 'Zona Rawan Gempabumi Tinggi',
    arahanSpasial: [
      'Dilarang pembangunan baru fungsi hunian serta fasilitas penting dan berisiko tinggi (sesuai SNI 1726), antara lain rumah sakit, sekolah, gedung pertemuan, stadion, pusat energi, pusat telekomunikasi.',
      'Pembangunan kembali fungsi hunian diperuntukkan sesuai standar yang berlaku (SNI 1726).',
      'Pada kawasan yang belum terbangun dan berada pada zona rawan likuifaksi sangat tinggi maupun rawan gerakan tanah tinggi, diprioritaskan kawasan lindung atau budidaya non-terbangun (pertanian, perkebunan, kehutanan).',
    ],
  },
  2: {
    label: 'ZRB 2',
    tipologi: 'ZONA BERSYARAT',
    color: '#eab308',
    kriteria: [
      '2 L : Zona Rawan Likuifaksi Tinggi',
      '2 T : Zona Rawan Tsunami Menengah (KRB II)',
      '2 G : Zona Rawan Gerakan Tanah Menengah',
      '2 B : Zona Rawan Banjir Tinggi',
    ],
    catatanUmum: 'Zona Rawan Gempabumi Tinggi',
    arahanSpasial: [
      'Pembangunan baru harus mengikuti standar yang berlaku (SNI 1726).',
      'Pada zona rawan tsunami dan rawan banjir, bangunan hunian disesuaikan dengan tingkat kerawanan bencananya.',
      'Intensitas pemanfaatan ruang rendah.',
    ],
  },
  1: {
    label: 'ZRB 1',
    tipologi: 'ZONA PENGEMBANGAN',
    color: '#fef9c3',
    kriteria: [
      '1 L : Zona Rawan Likuifaksi Sedang',
      '1 T : Zona Rawan Tsunami Rendah (KRB I)',
      '1 G : Zona Rawan Gerakan Tanah Sangat Rendah dan Rendah',
      '1 B : Zona Rawan Banjir Menengah dan Rendah',
    ],
    catatanUmum: null,
    arahanSpasial: [
      'Intensitas pemanfaatan ruang rendah-sedang.',
    ],
  },
} as const;

export type ZRBLevel = keyof typeof ZRB_REFERENCE;
