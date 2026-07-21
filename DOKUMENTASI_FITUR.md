# Dokumentasi Fitur dan Fungsi Proyek "Aegis Response" (Sistem Evakuasi Bencana)

Proyek ini adalah aplikasi mitigasi bencana dan navigasi evakuasi tsunami *real-time* berbasis web dan *mobile hybrid* (Capacitor). Sistem ini dibagi menjadi dua *role* utama, yaitu **Public User (Masyarakat)** dan **Admin (Pusat Komando)**.

Teknologi Utama yang Digunakan:
- **Frontend**: React.js (Vite), TypeScript, Tailwind CSS, Framer Motion (untuk animasi antarmuka).
- **Peta & Routing**: MapLibre GL JS / MapCN (via `react-map-gl`), OSRM, algoritma *Pathfinding* (Dijkstra & Haversine) kustom.
- **Backend & Realtime**: Supabase (Database Postgres, Realtime Broadcast) dan Vercel Serverless Functions (untuk *Push Notification*).
- **Mobile Integration**: Capacitor (Geolocation, Haptics/Getaran, App State).

Berikut adalah rincian lengkap dari setiap fitur dan fungsi di dalam kode:

---

## 1. Fitur Publik (Masyarakat / User)
Akses default untuk masyarakat umum (tanpa perlu login). Pengguna baru akan diminta memasukkan Nama di awal (tersimpan di `localStorage` & *Cookie*).

### A. Halaman Status (Dashboard Utama - `StatusPage.tsx`)
- **Indikator Real-Time**: Menampilkan status Sensor Seismik (aktif/alert) dan status koneksi GPS Satelit (akurasi dalam meter).
- **Notifikasi BMKG (Overlay)**: Terhubung ke fungsi `useBMKG` yang melakukan *fetching* secara berkala ke data `autogempa.xml` BMKG. Jika ada gempa terbaru, akan muncul *overlay* informasi (Magnitudo, Kedalaman, Wilayah, Potensi Tsunami). Pengguna bisa menutupnya, dan status "ditutup" akan disimpan secara aman di `localStorage`.
- **Tombol Pintas**: Akses cepat ke Riwayat Evakuasi (Log) dan Peta Navigasi.

### B. Mode Navigasi Evakuasi (`NavigatePage.tsx` & `App.tsx`)
Mode ini otomatis terbuka paksa jika Pusat Komando mengaktifkan peringatan Tsunami (Simulasi/Darurat).
- **Auto-Start GPS**: Otomatis melacak lokasi pengguna berakurasi tinggi (`Geolocation.watchPosition`).
- **Kalkulasi Rute Cerdas**: Menghitung rute tercepat dari koordinat *user* saat ini menuju lokasi *Shelter* (Titik Kumpul Aman) terdekat.
- **Deteksi Ketibaan (Arrival Detection)**: Sistem menghitung jarak antara pengguna dengan shelter tujuan (menggunakan rumus *Haversine*). Jika jarak pengguna berada di bawah radius shelter (default: 50 meter), navigasi akan berhenti otomatis, membunyikan getaran sukses, dan menampilkan *Arrival Modal* (Ringkasan jarak tempuh & waktu).
- **Alarm & Getaran Darurat**: Memutar suara sirine (menggunakan *Web Audio API Oscillator*) dan mengaktifkan getaran konstan di HP saat mode peringatan menyala.
- **Live Broadcasting**: Secara pasif mengirim (mem-*broadcast*) titik kordinat GPS pengguna dan level baterai HP ke server Supabase agar dapat dipantau oleh Admin (hanya terjadi saat mode evakuasi menyala).

### C. Sistem Keluarga (Family Link - `FamilyPage.tsx`)
- **Pairing via QR Code**: Menghasilkan QR Code unik untuk tiap HP. Anggota keluarga bisa saling *scan* untuk menambahkan anggota baru (menggunakan *jsQR* / sistem broadcast "FAMILY_JOIN").
- **Kirim Ping Darurat**: Pengguna bisa menekan tombol ping yang akan memberikan perintah getaran paksa (`Haptics.vibrate`) ke perangkat anggota keluarganya, memberitahukan bahwa mereka sedang dalam kondisi darurat atau mencari posisi mereka.

### D. Histori Evakuasi (Tactical Archive)
- **Log Evakuasi**: Mencatat setiap aktivitas navigasi ke dalam *history* yang berisi tanggal, rute/shelter yang dituju, waktu tempuh (menit), dan jarak (kilometer).
- **Visualisasi Peta Mini**: Membuat ilustrasi rute SVG kecil (*MiniRouteMap*) untuk riwayat.
- **Performance KPI (Key Performance Indicator)**: Menghitung rata-rata waktu respons / kecepatan evakuasi (misal target ≤ 30 menit) dan menampilkan tren secara visual dalam diagram balok berwarna hijau/kuning/merah.

### E. Panduan Siaga (Guides - `GuidesPage.tsx`)
- Modul informasi mitigasi bencana statis yang memberikan panduan langkah-langkah sebelum, saat, dan sesudah bencana.

---

## 2. Fitur Admin (Pusat Komando)
Akses didapatkan melalui URL khusus (misal: `?admin`) dan mengharuskan login menggunakan Kredensial Admin (`adminAccounts.ts`).

### A. Peta Komando Taktis (Tactical Map Dashboard)
- **Pemantauan Relatif Pengguna (Live Tracking)**: Marker khusus berwarna oranye akan muncul di peta secara *real-time* untuk setiap pengguna masyarakat yang sedang berada dalam proses evakuasi.
- **Informasi Perangkat User**: Admin dapat melihat informasi nama user, model/merek HP, serta persentase baterainya di sistem.
- **Admin Ping**: Admin dapat menekan marker pengguna di peta dan mengirimkan sinyal "Ping" untuk membunyikan notifikasi/getaran di HP pengguna bersangkutan.
- **Pemetaan Zona Bahaya & Shelter**: Menampilkan poligon peringatan merah (Hazard Zones) dan titik-titik shelter resmi (beserta kapasitas tampungnya). Jika ada info gempa BMKG, peta juga akan memunculkan poligon *epicenter* gempa dengan animasi *ping* merah.
- **Mode Rotasi**: Kompas interaktif di pojok kanan atas yang bisa mereset putaran/bearing peta ke arah Utara asli.

### B. Trigger Simulasi / Darurat Tsunami (`aegisApi.setTsunami`)
- Tombol sentral "SIMULASI TSUNAMI". Saat ditekan:
  1. Mengirim event *broadcast* Realtime via Supabase (langsung diterima seluruh user dalam milidetik).
  2. Menyimpan state aktif secara paten ke database tabel `tsunami_state`.
  3. Memanggil Endpoint Vercel Serverless `/api/tsunami`.

### C. Manajemen Pengaturan & Sistem (Settings)
- **Tema Peta**: Mengubah visualisasi peta antara terang, gelap (Tactical Dark), atau citra satelit (Satellite HUD).
- **Algoritma Pathfinding**: Mengganti mesin penghitung jarak antara metode *Haversine* dasar atau algoritma routing graf yang lebih kompleks (*Dijkstra*).
- **Auto-Start GPS & Notifikasi**: Pengaturan *switch* manual on/off fitur-fitur teknis aplikasi.

---

## 3. Modul Core Teknis (Library / Helpers)

### A. Modul Sinkronisasi State (`useAegisSync.ts`)
Fungsi vital yang mengurus komunikasi soket *Realtime*. 
- Berlangganan ke perubahan database (`postgres_changes`) dan Broadcast Channels (`aegis-events`). 
- Menangani tipe event: `TSUNAMI` (status aktif/tidak), `PING`, `LOCATION_UPDATE`, dan `FAMILY_JOIN`.
- Fungsi `aegisApi` mengeksekusi semua komunikasi API maupun Supabase langsung.

### B. Sistem Push Notification Web (`/api/tsunami.js` & `subscribe.js`)
Backend kecil berbasis NodeJS Serverless yang bertugas:
- Menerima langganan token Web Push (VAPID) dari browser user (fitur `registerWebPush` di `usePushNotification.ts`).
- Jika tombol Tsunami Admin ditekan, backend ini akan mengirim notifikasi Push Massal (*Pushing*) secara *background* langsung ke sistem operasi Android pengguna meskipun aplikasinya sedang ditutup/di-minimize.

### C. Logika Algoritma Evakuasi (`lib/evacuation/`)
- `roadNetwork.ts`: Representasi data spasial graf jalan raya dalam bentuk *edges* dan kordinat.
- `dijkstra.ts`: File implementasi murni struktur data *Priority Queue* dan Algoritma Dijkstra untuk mencari rute graf (nodes) terpendek menyusuri jalan.
- `haversine.ts`: Rumus standar menghitung jarak udara/lurus (dalam satuan bumi bulat) menggunakan koordinat Lintang dan Bujur.
- `routing.ts`: Modul utama `findOptimalEvacuationRoutes(lat, lng)`. Sistem akan menarik radius, mencari shelter yang paling masuk akal, dan menggunakan salah satu algoritma untuk menghasilkan urutan titik-titik koordinat jalan yang harus ditempuh *(Polyline)*.

### D. Integrasi BMKG (`useBMKG.ts`)
Mengunduh XML terbaru dari BMKG (`autogempa.xml`). Mem-parsing *(DOMParser)* elemen `DateTime`, `Coordinates`, dll. Ada logika notifikasi browser lokal (`new Notification()`) jika terjadi gempa yang melewati batas ambang (Magnitude >= 4.0).

---

File ini menyajikan penjelasan terperinci mengenai sistem yang Anda buat. Aplikasi ini sudah dikonfigurasi sebagai PWA (Progressive Web App) dengan arsitektur modern sehingga bisa dibuild (melalui Capacitor) menjadi `.apk` native untuk Android sekaligus bisa diakses melalui Web URL biasa.
