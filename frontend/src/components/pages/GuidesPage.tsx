// ═══════════════════════════════════════════════════════════════
// GUIDES PAGE — A.T.L.A.S Tactical Emergency Directives & First Aid Manual
// Comprehensive 6 Disaster Directives + First Aid Protocols
// ═══════════════════════════════════════════════════════════════
import { useState } from 'react'
import {
  ChevronDown, ChevronUp, ArrowRight, ChevronLeft,
  Waves, Activity, Droplets, Wind, Flame, ShieldAlert,
  Heart, AlertTriangle, CheckCircle2, Shield,
  BookOpen, Radio, Phone, MapPin, Compass, Users, Target, Cpu, Layers, Zap, Search, SlidersHorizontal
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { useLanguage } from '../../lib/i18n'

interface DirectiveItem {
  id: string
  code: string
  title: string
  subtitle: string
  icon: any
  color: string
  borderColor: string
  badge: string
  goldenRule: string
  steps: { num: string; label: string; desc: string }[]
  precautions: string[]
}

const DISASTER_DIRECTIVES: DirectiveItem[] = [
  {
    id: 'tsunami',
    code: 'DIRECTIVE 01 // TSUNAMI HAZARD',
    title: 'Tsunami & Gelombang Laut Raksasa',
    subtitle: 'Golden Rule Evakuasi Mandiri Pesisir Pantai',
    icon: Waves,
    color: '#FF1744',
    borderColor: 'border-nerv-red',
    badge: 'DEFCON 1',
    goldenRule: 'SEGERA MENJAUH DARI GARIS PANTAI // BERGERAK MENUJU ELEVASI TINGGI (MINIMAL ≥ 20 METER ATAU SHELTER VERTIKAL TES).',
    steps: [
      { num: '01', label: 'KENALI TANDA ALAM', desc: 'Air laut surut drastis secara tiba-tiba, tercium bau belerang kuat, atau terdengar suara gemuruh dentuman dari arah laut lepas.' },
      { num: '02', label: 'EVAKUASI JALAN KAKI', desc: 'Evakuasi wajib berjalan atau berlari kaki. Jangan menggunakan mobil/motor yang pasti memicu kemacetan total di persimpangan jalan.' },
      { num: '03', label: 'BERTAHAN DI KETINGGIAN', desc: 'Tetap berada di titik elevasi aman (TES) minimal 2 jam setelah gelombang pertama, karena gelombang susulan biasanya jauh lebih destruktif.' }
    ],
    precautions: [
      'Jangan menunggu sirene atau pengumuman jika gempa dirasakan kuat > 20 detik.',
      'Jauhi muara dan bantaran sungai karena tsunami menerobos masuk ke daratan melalui lorong sungai.',
      'Jangan pernah kembali ke pantai untuk menonton gelombang atau memungut ikan yang terdampar.'
    ]
  },
  {
    id: 'earthquake',
    code: 'DIRECTIVE 02 // SEISMIC IMPACT',
    title: 'Gempa Bumi Tektonik & Reruntuhan',
    subtitle: 'Protokol Perlindungan Diri Terhadap Guncangan Hebat',
    icon: Activity,
    color: '#FF5722',
    borderColor: 'border-nerv-orange',
    badge: 'SEISMIC ALPHA',
    goldenRule: 'JATUHKAN TUBUH (DROP), LINDUNGI KEPALA (COVER), BERTAHAN KUAT (HOLD ON) DI BAWAH STRUKTUR KOKOH HINGGA GUNCANGAN REDA.',
    steps: [
      { num: '01', label: 'DROP // MERENDAH', desc: 'Jatuhkan tubuh dan bertumpu pada tangan serta lutut sebelum percepatan seismik menjatuhkan Anda secara paksa.' },
      { num: '02', label: 'COVER // LINDUNGI', desc: 'Lindungi kepala, tengkuk, dan leher di bawah kolong meja kokoh atau tutupi dengan tas/bantal jika berada di tempat tidur.' },
      { num: '03', label: 'HOLD ON // BERTAHAN', desc: 'Pegang erat kaki meja penopang dan bersiap bergerak bersama meja hingga guncangan seismik sepenuhnya terhenti.' }
    ],
    precautions: [
      'Jika di dalam gedung bertingkat, DILARANG KERAS menggunakan lift/elevator. Gunakan tangga darurat setelah guncangan berhenti.',
      'Jauhi jendela kaca, cermin, lemari gantung, dan dinding bata yang rentan roboh keluar.',
      'Jika berada di luar ruangan, segera cari tanah lapang terbuka, jauhi tiang listrik, baliho, dan lereng curam rawan likuefaksi/longsor.'
    ]
  },
  {
    id: 'flood',
    code: 'DIRECTIVE 03 // INUNDATION HAZARD',
    title: 'Banjir Genangan & Luapan Air',
    subtitle: 'Protokol Mitigasi Luapan Sungai dan Drainase Kota',
    icon: Droplets,
    color: '#00E5FF',
    borderColor: 'border-nerv-cyan',
    badge: 'HYDRO LEVEL-3',
    goldenRule: 'PUTUSKAN SUMBER ENERGI LISTRIK & GAS UTAMA // AMANKAN LOGISTIK DAN DOKUMEN KE LANTAI ATAS ATAU PUSAT EVAKUASI.',
    steps: [
      { num: '01', label: 'PEMUTUSAN DAYA TOTAL', desc: 'Segera matikan MCB meteran listrik rumah dan lepas regulator tabung gas sebelum air merendam stopkontak.' },
      { num: '02', label: 'DOKUMEN & LOGISTIK', desc: 'Bungkus berkas identitas, obat esensial, dan senter dalam kantong plastik kedap air, letakkan di posisi tertinggi.' },
      { num: '03', label: 'JALUR EVAKUASI AMAN', desc: 'Berpindahlah ke posko penampungan resmi sebelum genangan air melampaui batas lutut atau menutup akses jalan.' }
    ],
    precautions: [
      'Dilarang berjalan atau berkendara menembus arus air banjir (arus setinggi 15 cm sudah mampu merobohkan orang dewasa).',
      'Waspadai sengatan arus bocor listrik dan ancaman hewan berbisa (ular/kalajengking) yang mencari tempat kering.',
      'Jangan biarkan anak-anak bermain atau berenang di air genangan banjir yang terkontaminasi limbah biologis.'
    ]
  },
  {
    id: 'flashflood',
    code: 'DIRECTIVE 04 // FLASH FLOOD SURGE',
    title: 'Banjir Bandang & Arus Deras Gunung',
    subtitle: 'Protokol Evakuasi Kecepatan Tinggi Aliran Lumpur & Material',
    icon: Waves,
    color: '#FF9100',
    borderColor: 'border-amber-500',
    badge: 'FLASH IMPACT',
    goldenRule: 'EVAKUASI TEGAK LURUS MENJAUHI ALUR LEMBAH // NAIK KE TEBING TINGGI SEGERA KETIKA AIR SUNGAI MENDADAK KERUH ATAU GEMURUH.',
    steps: [
      { num: '01', label: 'DETEKSI ANOMALI HULU', desc: 'Air sungai mendadak berubah warna menjadi cokelat pekat bercampur ranting kayu atau penurunan debit secara ganjil adalah tanda tanggul hulu jebol.' },
      { num: '02', label: 'LARI TEGAK LURUS', desc: 'Evakuasi bukan searah aliran sungai, melainkan tegak lurus mendaki lereng tebing atau punggung bukit yang kokoh.' },
      { num: '03', label: 'JAUHI JEMBATAN', desc: 'Jangan melintasi atau berada di atas jembatan sungai, karena jembatan rentan hancur terhantam gelondongan kayu dan batu raksasa.' }
    ],
    precautions: [
      'Banjir bandang bergerak dengan kecepatan sangat tinggi (> 30 km/jam) membawa daya hancur luar biasa.',
      'Jika mendengar suara gemuruh berat menyerupai kereta api dari arah pegunungan, langsung lari ke tempat tinggi tanpa mengambil barang.',
      'Jangan pernah berlindung di tepi tebing tanah gembur yang rawan longsor tersapu arus air.'
    ]
  },
  {
    id: 'cyclone',
    code: 'DIRECTIVE 05 // CYCLONIC STORM',
    title: 'Angin Topan, Puting Beliung & Badai',
    subtitle: 'Protokol Perlindungan Terhadap Turbulensi Atmosfer Ekstrem',
    icon: Wind,
    color: '#E040FB',
    borderColor: 'border-fuchsia-500',
    badge: 'VORTEX CRITICAL',
    goldenRule: 'BERLINDUNG DI RUANGAN PALING TENGAH GEDUNG // JAUHI SELURUH JENDELA, ATAP SENG, DAN PINTU KACA.',
    steps: [
      { num: '01', label: 'KUNCI CELAH UDARA', desc: 'Tutup rapat seluruh ventilasi, jendela, dan pintu. Perkuat pengait agar tekanan angin pusaran tidak menerbangkan struktur atap.' },
      { num: '02', label: 'INNER SANCTUARY', desc: 'Posisikan diri di ruangan terdalam tanpa jendela (seperti kamar mandi, lorong tengah, atau di bawah tangga beton).' },
      { num: '03', label: 'PERLINDUNGAN KEPALA', desc: 'Meringkuk di lantai dan tutupi kepala serta leher dengan kasur, selimut tebal, atau helm untuk menahan serpihan proyektil puing.' }
    ],
    precautions: [
      'Dilarang berlindung di bawah pohon besar, tiang reklame, kabel listrik tegangan tinggi, atau jembatan penyeberangan.',
      'Jika terjebak di ruang terbuka saat pusaran angin mendekat, segera tiarap di saluran parit dangkal dan lindungi kepala.',
      'Cabut seluruh peralatan elektronik dari colokan untuk mengantisipasi induksi petir dan lonjakan daya kabel putus.'
    ]
  },
  {
    id: 'volcano',
    code: 'DIRECTIVE 06 // VOLCANIC ERUPTION',
    title: 'Gunung Meletus & Hujan Abu Vulkanik',
    subtitle: 'Protokol Penyelamatan Diri Erupsi & Awan Panas',
    icon: Flame,
    color: '#FF3D00',
    borderColor: 'border-red-600',
    badge: 'MAGMA HAZARD',
    goldenRule: 'PAKAI MASKER BASAH & KACAMATA GOGGLE // SEGERA TINGGALKAN RADIUS KAWASAN RAWAN BENCANA (KRB) MENUJU KORIDOR AMAN.',
    steps: [
      { num: '01', label: 'PROTEKSI PERNAPASAN', desc: 'Gunakan masker N95 atau kain basah untuk menutup hidung dan mulut dari partikel silika tajam abu vulkanik.' },
      { num: '02', label: 'LINDUNGI PENGLIHATAN', desc: 'Pakai kacamata tertutup (goggle) dan pakaian lengan panjang. Lepaskan lensa kontak segera untuk mencegah goresan kornea.' },
      { num: '03', label: 'JAUHI LEMBAH LAHAR', desc: 'Jauhi lembah sungai yang berhulu di puncak gunung untuk menghindari sapuan awan panas (wedhus gembel) dan banjir lahar dingin.' }
    ],
    precautions: [
      'Bersihkan tumpukan abu vulkanik dari atap rumah secara berkala agar struktur atap tidak ambruk akibat beban berat abu basah.',
      'Tutup seluruh penampungan air bersih dan makanan agar tidak terkontaminasi abu asam dan logam berat.',
      'Patuhi batas radius bahaya (KRB) yang ditetapkan otoritas PVMBG/ESDM, jangan pernah melintasi garis batas larangan.'
    ]
  }
]

const FIRST_AID_PROTOCOLS = [
  {
    id: 'cpr',
    directive: 'MED-01 // CARDIAC ARREST',
    title: 'Resusitasi Jantung Paru (CPR / RJP)',
    icon: '🫀',
    steps: [
      { label: 'CEK RESPON & NADI', desc: 'Tepuk bahu korban dengan tegas, periksa pergerakan dada dan denyut nadi karotis leher selama maksimal 10 detik.' },
      { label: 'KOMPRESI DADA CEPAT', desc: 'Letakkan tumit tangan di tengah tulang dada, tekan sedalam 5-6 cm dengan ritme 100-120 kali per menit (ritme lagu Stayin Alive).' },
      { label: 'MINIMALISIR INTERUPSI', desc: 'Lakukan kompresi terus-menerus tanpa henti hingga korban merespons atau tenaga medis paramedis tiba.' }
    ]
  },
  {
    id: 'bleeding',
    directive: 'MED-02 // ACUTE TRAUMA',
    title: 'Perdarahan Arteri & Vena Terbuka',
    icon: '🩸',
    steps: [
      { label: 'TEKAN LANGSUNG (DIRECT PRESSURE)', desc: 'Gunakan kasa steril atau kain bersih, tekan langsung titik robekan pembuluh darah dengan kedua telapak tangan sekuat tenaga.' },
      { label: 'PEMBALUTAN TEKAN', desc: 'Balut luka rapat-rapat dengan perban elastis. Jangan mencabut kain pertama yang sudah jenuh darah, tapi tambahkan lapisan di atasnya.' },
      { label: 'TOURNIQUET DARURAT', desc: 'Untuk perdarahan semprot anggota gerak yang mengancam nyawa, pasang torniket 5-7 cm di atas luka hingga perdarahan terhenti.' }
    ]
  },
  {
    id: 'fracture',
    directive: 'MED-03 // SKELETAL FRACTURE',
    title: 'Patah Tulang & Cedera Muskuloskeletal',
    icon: '🦴',
    steps: [
      { label: 'IMOBILISASI TOTAL', desc: 'Dilarang meluruskan atau memanipulasi posisi tulang yang bengkok secara paksa. Pertahankan posisi saat ditemukan.' },
      { label: 'PEMASANGAN BIDAI (SPLINT)', desc: 'Pasang bilah papan atau karton kaku melewati dua sendi (sendi di atas dan di bawah tulang yang patah), ikat dengan kain.' },
      { label: 'CEK PERFUSI UJUNG JARI', desc: 'Pastikan ikatan tidak terlalu ketat dengan mengecek sensasi rasa dan kehangatan jari-jari tangan/kaki korban.' }
    ]
  },
  {
    id: 'choking',
    directive: 'MED-04 // AIRWAY OBSTRUCTION',
    title: 'Sumbatan Saluran Napas (Heimlich Maneuver)',
    icon: '🗣️',
    steps: [
      { label: 'POSISI PENOLONG', desc: 'Berdiri di belakang korban sadar yang tersedak, lingkarkan kedua lengan Anda mengelilingi perut korban di atas pusar.' },
      { label: 'HENTAKAN SUB-DIAFRAGMA', desc: 'Genggam tangan erat-erat, berikan dorongan kuat dan cepat ke arah dalam dan ke atas untuk mendesak keluar benda asing.' }
    ]
  },
  {
    id: 'burns',
    directive: 'MED-05 // THERMAL INJURY',
    title: 'Luka Bakar Api & Termal',
    icon: '🔥',
    steps: [
      { label: 'IRIGASI AIR BERSUHU RUANG', desc: 'Alirkan air bersih mengalir selama minimal 20 menit pada area terpapar. DILARANG menggunakan air es/es batu.' },
      { label: 'TUTUP DENGAN KAIN STERIL', desc: 'Tutup longgar area luka dengan plastik wrap atau kain steril non-lengket untuk mencegah paparan udara terbuka.' }
    ]
  }
]

export interface GlossaryTerm {
  term: string
  code: string
  badge: string
  badgeColor: string
  summary: string
  detail: string
  examples?: string[]
}

export const GLOSSARY_TERMS: GlossaryTerm[] = [
  {
    term: 'DEFCON (Defense Readiness Condition)',
    code: 'SYSTEM STATE // ALERT MATRIX',
    badge: 'DARURAT & SIAGA',
    badgeColor: 'bg-red-500/20 text-red-400 border-red-500/40',
    summary: 'Tingkat kesiapsiagaan taktis pertahanan hidup-mati sistem A.T.L.A.S.',
    detail: 'DEFCON adalah protokol standar kesiapsiagaan operasional darurat. Pada sistem A.T.L.A.S:\n\n• DEFCON 1 (Merah Alert): Status bahaya maksimal saat gempa signifikan atau ancaman tsunami terdeteksi. Seluruh antarmuka beralih menjadi Cockpit Taktis Darurat, layar HP dipaksa tetap menyala (wake-lock), sirine melolong, kompas mengunci arah shelter terdekat, dan jalur evakuasi menyala merah dengan panduan belokan demi belokan.\n\n• DEFCON 5 (Cyan Normal): Status damai/normal. Warga dapat mengeksplorasi peta, simulasi rute mandiri, memantau telemetri sensor, dan mengecek keselamatan unit keluarga.',
    examples: ['DEFCON 1: Tsunami hazard active / Evakuasi seketika', 'DEFCON 5: Monitoring telemetri damai']
  },
  {
    term: 'TERMINAL (ARCHITECT 01 / COMMAND-01 / CITIZEN)',
    code: 'DISTRIBUTED ARCHITECTURE',
    badge: 'IDENTITAS RESMI',
    badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40',
    summary: 'Pengenal taktis resmi perangkat dalam jaringan telemetri terdesentralisasi A.T.L.A.S.',
    detail: 'Setiap instalasi aplikasi terikat secara kriptografis pada 1 perangkat fisik (1 HP = 1 Registrasi Resmi):\n\n• ARCHITECT 01: Master Terminal Pengembang Sentral / Arsitek Sistem A.T.L.A.S.\n\n• COMMAND-01: Terminal Petugas Administrator / Pusat Komando Evakuasi BPBD. Memiliki wewenang untuk mengelola shelter, menyiarkan peringatan darurat massal (ping broadcast), dan memantau status sensor daerah.\n\n• CITIZEN: Terminal Personel Warga Terdaftar. Berfungsi sebagai terminal evakuasi dan suar telemetri keselamatan keluarga.',
    examples: ['ARCHITECT 01: Arsitek & Pengembang', 'COMMAND-01: Kepala Operasi / Admin Komando', 'CITIZEN: Terminal Personel Warga']
  },
  {
    term: 'ZRB (Zona Rawan Bencana Kota Palu)',
    code: 'GEOLOGICAL RISK ZONING',
    badge: 'TATA RUANG MITIGASI',
    badgeColor: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
    summary: 'Klasifikasi peta bahaya geologi pasca-bencana Palu 2018 oleh Badan Geologi & BMKG.',
    detail: 'Peta Kota Palu dibagi menjadi 4 zona kerentanan tanah:\n\n• ZRB 4 (Zona Terlarang - Merah Tua): Wilayah bahaya sangat tinggi meliputi jalur aktif Sesar Palu Koro, zona likuefaksi masif (Petobo & Balaroa), dan sempadan pantai tsunami. Dilarang mendirikan bangunan hunian. Algoritma A.T.L.A.S memberikan penalti berat agar rute evakuasi membelokkan warga menjauhi zona ini.\n\n• ZRB 3 (Zona Terbatas - Oranye): Area rentan genangan tsunami dan longsoran lereng perbukitan.\n\n• ZRB 2 (Zona Bersyarat - Kuning): Area bahaya sedang dengan syarat konstruksi bangunan tahan gempa.\n\n• ZRB 1 (Zona Pengembangan - Hijau): Wilayah stabil yang ditunjuk sebagai lokasi shelter dan titik kumpul evakuasi aman.',
    examples: ['ZRB 4: Petobo, Balaroa, Garis Pantai Sesar', 'ZRB 1: Pusat Elevasi Aman']
  },
  {
    term: 'Sharelock Grade & Dual-Layer GNSS',
    code: 'TELEMETRY ACCURACY',
    badge: 'PRESISI SHARELOCK',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    summary: 'Sistem pelacakan posisi real-time tanpa cache basi (maximumAge: 0) sekelas WhatsApp & Google Maps.',
    detail: 'Menggunakan arsitektur penentuan posisi multi-sensor paralel:\n\n• Layer 1 (BTS Jaringan Seluler): Mengunci koordinat secara instan saat pengguna berada di dalam gedung bertingkat, rumah tebal, atau basement sebelum satelit GPS terlihat.\n\n• Layer 2 (Satelit GNSS High-Accuracy): Menangkap multi-konstelasi satelit (GPS, GLONASS, Galileo, BeiDou) saat di luar ruangan.\n\n• Filter Kalman Adaptif: Menstabilkan pergerakan koordinat agar tidak melompat-lompat (jitter-free) saat pengguna berjalan atau berlari.',
    examples: ['Presisi: Akurasi hingga < 10 meter', 'Realtime: Stale cache 0 ms']
  },
  {
    term: 'Sentinel Latar Belakang (24/7 Service)',
    code: 'FOREGROUND DAEMON',
    badge: 'SIAGA OTOMATIS',
    badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
    summary: 'Layanan Android permanen berdaya baterai rendah yang terus siaga mendengarkan sinyal bencana.',
    detail: 'Aplikasi A.T.L.A.S dilengkapi layanan latar belakang permanen (Android Foreground Service). Meskipun aplikasi ditutup atau layar ponsel mati terkunci di kantong celana, Sentinel tetap mendengarkan siaran gempa BMKG dan siaran darurat Administrator. Jika ada ancaman gempa signifikan, HP akan otomatis bergetar keras dan membunyikan sirine evakuasi seketika.',
    examples: ['Bekerja saat layar mati', 'Konsumsi baterai sangat minim']
  },
  {
    term: 'Algoritma Dijkstra vs Haversine',
    code: 'NAVIGATION ENGINE',
    badge: 'LOGIKA RUTE EVAKUASI',
    badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
    summary: 'Dua mesin komputasi pemilihan rute jalan evakuasi di dalam aplikasi.',
    detail: '• Dijkstra (Evakuasi Jalan Nyata): Menghitung lintasan jalan raya, gang, dan lorong kota Palu yang nyata dengan memperhitungkan rintangan zona bahaya ZRB 4. Bekerja 100% offline tanpa kuota internet.\n\n• Haversine (Garis Lurus Geodetik): Menghitung jarak lurus melengkung bumi (as the crow flies) untuk penentuan cepat shelter terdekat secara instan.',
    examples: ['Dijkstra: Pilihan default rute aman', 'Haversine: Estimasi jarak fisik terdekat']
  },
  {
    term: 'SOS Dual-Channel (Offline 2G vs Voice 115)',
    code: 'EMERGENCY TRANSMISSION',
    badge: 'KOMUNIKASI KRITIS',
    badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
    summary: 'Dua kanal transmisi darurat saat jaringan internet data 4G/5G padam.',
    detail: '• Panggilan Suara 115: Panggilan darurat resmi ke Basarnas yang 100% BEBAS PULSA dan langsung diangkat oleh operator SAR (nomor 3-digit di Indonesia hanya melayani suara, bukan SMS).\n\n• SMS 2G GSM: Transmisi pesan teks darurat ke kontak keluarga/kerabat yang memuat nama, NIK, koordinat presisi detik, shelter tujuan, dan tautan langsung Google Maps untuk navigasi penjemputan.',
    examples: ['115: Hotline Telepon Bebas Pulsa', 'SMS: Broadcast ke Nomor HP Keluarga']
  }
]

export interface FeatureGuide {
  title: string
  tag: string
  color: string
  desc: string
  steps: { step: string; instruction: string }[]
}

export const FEATURE_GUIDES: FeatureGuide[] = [
  {
    title: 'PETA TAKTIS & EVAKUASI CERDAS (NAVIGASI)',
    tag: 'TACTICAL MAP',
    color: '#00E5FF',
    desc: 'Panduan navigasi rute evakuasi menuju shelter terdekat baik di situasi normal (simulasi) maupun saat darurat bencana.',
    steps: [
      { step: '01', instruction: 'Buka menu NAVIGASI. Titik biru menunjukkan posisi presisi Anda saat ini.' },
      { step: '02', instruction: 'Pilih shelter tujuan dari panel bawah (seperti Kantor DPR atau Lapangan Imanuel). Kamera peta akan otomatis zoom out (Auto-Fit Bounds Google Maps) memperlihatkan posisi Anda, seluruh kelokan rute, dan shelter tujuan.' },
      { step: '03', instruction: 'Garis rute berwarna Cyan A.T.L.A.S di mode normal, dan otomatis berubah menjadi Merah Menyala saat darurat bencana (DEFCON 1).' },
      { step: '04', instruction: 'Jika berada di basement atau gedung tebal, gunakan tombol Kalibrasi Manual (Pin Oranye) untuk menggeser titik koordinat secara manual.' },
      { step: '05', instruction: 'Jika sinyal internet mati dan butuh bantuan, tekan tombol Radio SOS Merah untuk menelepon Basarnas 115 (bebas pulsa) atau mengirim SMS berkoordinat presisi ke keluarga.' }
    ]
  },
  {
    title: 'TELEMETRI SENSOR & PERINGATAN DINI (STATUS)',
    tag: 'SEISMIC INTEL',
    color: '#FF5722',
    desc: 'Pusat intelijen gempa bumi BMKG dan pemantauan sensor real-time se-Teluk Palu.',
    steps: [
      { step: '01', instruction: 'Periksa kartu gempa terkini di bagian atas (Magnitudo, Kedalaman, Jam, dan Potensi Tsunami).' },
      { step: '02', instruction: 'Pantau status radar sensor: Buoy Tsunami laut Teluk Palu, Stasiun Seismograf Sesar Palu Koro, dan sensor getaran tanah.' },
      { step: '03', instruction: 'Gunakan tombol SIMULASI EVAKUASI untuk menguji kesiapan sirine dan antarmuka komando darurat secara mandiri.' },
      { step: '04', instruction: 'Tekan tombol LAPOR STATUS DARURAT jika Anda membutuhkan evakuasi cepat dari tim penyelamat.' }
    ]
  },
  {
    title: 'DIREKTORI & KESELAMATAN KELUARGA (UNIT)',
    tag: 'PERSONNEL DIRECTORY',
    color: '#22c55e',
    desc: 'Sistem pelacakan dan konfirmasi status aman anggota keluarga terdaftar.',
    steps: [
      { step: '01', instruction: 'Tekan tombol Tambah Anggota Unit untuk menghubungkan keluarga.' },
      { step: '02', instruction: 'Pindai QR Code perangkat keluarga Anda atau masukkan kode verifikasi 6-digit untuk otentikasi aman.' },
      { step: '03', instruction: 'Pantau status seluruh anggota keluarga: Hijau (Aman / Secure) atau Merah (Butuh Bantuan / Danger).' },
      { step: '04', instruction: 'Lihat titik lokasi terakhir keluarga Anda yang ditampilkan langsung di peta terpadu.' }
    ]
  },
  {
    title: 'PROFIL PERSONEL & PENGATURAN SISTEM',
    tag: 'SYSTEM CONFIG',
    color: '#a855f7',
    desc: 'Pengaturan identitas resmi perangkat, bahasa antarmuka, dan algoritma routing.',
    steps: [
      { step: '01', instruction: 'Lengkapi Nama Lengkap dan NIK 16-digit resmi pada profil Anda agar data identitas terverifikasi saat berada di posko evakuasi.' },
      { step: '02', instruction: 'Buka menu Pengaturan untuk memilih bahasa antarmuka (Bahasa Indonesia atau English).' },
      { step: '03', instruction: 'Pilih algoritma rute: Dijkstra (rekomendasi rute jalan nyata aman) atau Haversine (jarak lurus geodetik).' },
      { step: '04', instruction: 'Periksa riwayat evakuasi dan catatan rilis pembaruan sistem pada menu Warta & Log.' }
    ]
  }
]

export default function GuidesPage({ onNavigateMap, onBack }: { onNavigateMap: () => void; onBack?: () => void }) {
  const { lang, t } = useLanguage()
  const [activeTab, setActiveTab] = useState<'disaster' | 'medical'>('disaster')
  const [expandedId, setExpandedId] = useState<string>('tsunami')

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 30 }}
      transition={{ duration: 0.22 }}
      className="fixed inset-0 z-[1800] flex flex-col overflow-y-auto custom-scrollbar bg-nerv-bg text-slate-200"
    >
      {/* A.T.L.A.S Header */}
      <div className="shrink-0 px-4 pt-[max(env(safe-area-inset-top,0px),1rem)] pb-3 border-b border-nerv-border bg-[#0B0F19] flex items-center justify-between sticky top-0 z-30 backdrop-blur-md">
        <div className="flex items-center gap-3 min-w-0">
          {onBack && (
            <button
              onClick={onBack}
              className="w-8 h-8 rounded bg-nerv-card border border-nerv-border flex items-center justify-center shrink-0 hover:border-nerv-orange transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-slate-300" />
            </button>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-2 h-2 rounded-full bg-nerv-orange animate-ping" />
              <p className="text-[10px] font-mono font-bold tracking-widest text-nerv-orange uppercase">
                A.T.L.A.S // TACTICAL PROTOCOLS
              </p>
            </div>
            <h2 className="text-sm font-mono font-bold text-white truncate uppercase">
              {lang === 'id' ? 'PROTOKOL MITIGASI & MEDIS P3K' : 'TACTICAL PROTOCOLS & FIRST AID'}
            </h2>
          </div>
        </div>

        <div className="px-2 py-1 rounded bg-black/60 border border-nerv-border font-mono text-[9px] text-nerv-cyan shrink-0">
          OFFLINE CACHED
        </div>
      </div>

      <div className="flex-1 px-4 py-4 space-y-4 pb-28 font-sans max-w-2xl mx-auto w-full">
        {/* Category Switcher Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-lg bg-black/60 border border-nerv-border font-mono text-xs">
          <button
            onClick={() => setActiveTab('disaster')}
            className={`py-2 px-2 rounded font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'disaster'
                ? 'bg-nerv-orange text-black shadow-[0_0_12px_rgba(255,87,34,0.4)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{lang === 'id' ? 'PROTOKOL BENCANA' : 'DISASTER PROTOCOLS'}</span>
          </button>

          <button
            onClick={() => setActiveTab('medical')}
            className={`py-2 px-2 rounded font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'medical'
                ? 'bg-rose-500 text-white shadow-[0_0_12px_rgba(244,63,94,0.4)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Heart className="w-4 h-4 shrink-0" />
            <span>{lang === 'id' ? 'MEDIS & P3K' : 'FIRST AID'}</span>
          </button>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            TAB 1: 6 BENCANA BESAR (FULL TACTICAL DIRECTIVES)
           ═══════════════════════════════════════════════════════════════ */}
        {activeTab === 'disaster' && (
          <div className="space-y-3 font-mono">
            {DISASTER_DIRECTIVES.map((d) => {
              const isOpen = expandedId === d.id
              const IconComp = d.icon
              return (
                <div
                  key={d.id}
                  className={`rounded-lg border overflow-hidden transition-all bg-[#0d121c] ${
                    isOpen ? `${d.borderColor} shadow-lg` : 'border-nerv-border/70 hover:border-slate-700'
                  }`}
                >
                  <button
                    onClick={() => setExpandedId(isOpen ? '' : d.id)}
                    className="w-full flex items-center justify-between p-3.5 hover:bg-white/[0.02] transition-colors text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border"
                        style={{ backgroundColor: `${d.color}15`, borderColor: `${d.color}40` }}
                      >
                        <IconComp className="w-5 h-5" style={{ color: d.color }} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[9px] font-bold tracking-wider uppercase" style={{ color: d.color }}>
                            {d.code}
                          </span>
                          <span className="text-[8px] px-1.5 py-0.2 rounded bg-black/70 border border-slate-700 text-slate-300">
                            {d.badge}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-white truncate">{d.title}</h3>
                      </div>
                    </div>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 shrink-0 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 shrink-0 text-slate-400" />
                    )}
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden border-t border-nerv-border/60"
                      >
                        <div className="p-4 space-y-3 font-sans">
                          {/* Golden Rule Banner */}
                          <div
                            className="p-3 rounded border font-mono font-bold text-xs leading-relaxed"
                            style={{
                              backgroundColor: `${d.color}10`,
                              borderColor: `${d.color}50`,
                              color: d.color
                            }}
                          >
                            <span className="text-[9px] block text-slate-400 uppercase tracking-widest mb-0.5">
                              GOLDEN DIRECTIVE:
                            </span>
                            {d.goldenRule}
                          </div>

                          {/* Tactical 3 Steps */}
                          <div className="space-y-2">
                            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block font-bold">
                              LANGKAH PENYELAMATAN TAKTIS:
                            </span>
                            {d.steps.map((st) => (
                              <div
                                key={st.num}
                                className="flex items-start gap-3 p-2.5 rounded bg-black/50 border border-nerv-border/60"
                              >
                                <span className="w-6 h-6 rounded bg-[#172033] border border-nerv-border flex items-center justify-center shrink-0 font-mono text-xs font-bold text-nerv-cyan">
                                  {st.num}
                                </span>
                                <div>
                                  <p className="text-xs font-mono font-bold text-white uppercase">{st.label}</p>
                                  <p className="text-xs text-slate-300 leading-relaxed font-sans mt-0.5">{st.desc}</p>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Precaution checklist */}
                          <div className="p-3 rounded bg-black/40 border border-slate-800 text-xs text-slate-300 space-y-1.5 font-sans">
                            <span className="text-[10px] font-mono text-nerv-yellow uppercase tracking-wider block font-bold mb-1">
                              LARANGAN KRITIS &amp; KEWASPADAAN:
                            </span>
                            {d.precautions.map((p, idx) => (
                              <p key={idx} className="flex items-start gap-2">
                                <span className="text-nerv-orange font-bold font-mono">▸</span>
                                <span>{p}</span>
                              </p>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            TAB 2: PROTOKOL MEDIS PERTAMA (FIRST AID / P3K)
           ═══════════════════════════════════════════════════════════════ */}
        {activeTab === 'medical' && (
          <div className="space-y-3 font-mono">
            {FIRST_AID_PROTOCOLS.map((fa) => (
              <div key={fa.id} className="p-4 rounded-lg border border-nerv-border bg-nerv-card shadow-sm">
                <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-nerv-border/60">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{fa.icon}</span>
                    <div>
                      <span className="text-[8px] font-mono font-bold text-nerv-cyan uppercase tracking-widest block">
                        {fa.directive}
                      </span>
                      <h4 className="text-xs font-mono font-bold text-white uppercase">{fa.title}</h4>
                    </div>
                  </div>
                  <Heart className="w-4 h-4 text-nerv-cyan" />
                </div>

                <div className="space-y-2">
                  {fa.steps.map((step, i) => (
                    <div key={i} className="flex items-start gap-2.5 p-2 rounded bg-black/40 border border-nerv-border/40">
                      <div className="w-5 h-5 rounded bg-[#131926] border border-nerv-border flex items-center justify-center shrink-0 font-mono text-[10px] font-bold text-nerv-cyan">
                        {i + 1}
                      </div>
                      <div>
                        <p className="text-[10px] font-mono font-bold text-nerv-cyan uppercase">{step.label}</p>
                        <p className="text-xs text-slate-300 leading-relaxed font-sans mt-0.5">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Action Button: Open Evacuation Map */}
        <button
          onClick={onNavigateMap}
          className="w-full py-3.5 rounded-lg bg-nerv-orange hover:bg-orange-600 text-black font-mono font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,87,34,0.35)] transition-all"
        >
          <ArrowRight className="w-4 h-4" />
          {lang === 'id' ? 'BUKA KOKPIT PETA RUTE EVAKUASI' : 'OPEN EVACUATION MAP COCKPIT'}
        </button>

        {/* Offline Cache Assurance */}
        <div className="flex items-center justify-center gap-2 pt-1 font-mono text-[10px] text-slate-500">
          <div className="w-1.5 h-1.5 rounded-full bg-nerv-green animate-pulse" />
          <span>
            {lang === 'id' 
              ? 'OFFLINE LOCAL CACHE VERIFIED // SELURUH DOKUMEN AKTIF TANPA INTERNET'
              : 'OFFLINE LOCAL CACHE VERIFIED // ALL DIRECTIVES OFFLINE READY'}
          </span>
        </div>
      </div>
    </motion.div>
  )
}
