# A.T.L.A.S — ROADMAP & ARSITEKTUR MASA DEPAN (BACKLOG)
*(Autonomous Threat Location & Alert System)*

Dokumen ini mencatat ide-ide arsitektur tingkat lanjut yang telah disepakati untuk disimpan dan akan diimplementasikan pada fase pengembangan berikutnya (setelah seluruh fitur inti operasional stabil).

---

## 1. High-Speed Telemetry Ingestion Worker (Golang / Go Ala NERV)
* **Status:** Disimpan dalam Backlog (Fase Skalabilitas Tinggi).
* **Konsep & Latar Belakang:**  
  Mengadopsi arsitektur backend berkecepatan tinggi yang digunakan oleh *Gehirn NERV App* di Jepang.
* **Rencana Penerapan:**
  * Membangun microservice independen berbasis **Go (Golang)** yang bertugas menyedot telemetri data gempa & tsunami langsung dari endpoint API/WebSocket BMKG (InaTEWS).
  * Memanfaatkan konkurensi *Goroutines* untuk menyiarkan sinyal bahaya ke ratusan ribu koneksi pengguna secara simultan dengan penggunaan RAM sangat minim (< 30 MB).
* **Kapan Diterapkan:** Saat sistem telah memasuki tahap peluncuran massal ke seluruh populasi warga Kota Palu.

---

## 2. Telemetri Sensor Pelampung Laut (Ocean Buoy Telemetry - Panel Admin)
* **Status:** Disimpan dalam Backlog (Menunggu Integrasi Sensor Fisik).
* **Konsep:**  
  Menambahkan modul visualisasi data ketinggian air laut dari sensor *buoy* di perairan Teluk Palu pada peta Komando Admin (misal: *Surge +X.X Meter*).
* **Kapan Diterapkan:** Begitu terdapat stasiun sensor pelampung fisik atau instrumen tide-gauge pasang surut air laut yang menyediakan API data terbuka.

---

## 3. Native Kotlin & Swift Foreground Service (Capacitor Bridge)
* **Status:** Disimpan dalam Backlog.
* **Konsep:**  
  Menyematkan plugin native berbasis **Kotlin** di folder `android/` dan **Swift** di `ios/` untuk:
  * Memastikan pelacakan GPS di latar belakang (*background service*) tidak dihentikan oleh penghemat daya baterai OS.
  * Memanfaatkan *Apple Critical Alerts* dan *Android High-Priority Channels* agar alarm sirine tetap berbunyi keras meski ponsel dalam mode hening (*Silent / Do Not Disturb*).

---
*Catatan: Dokumen ini dijaga sebagai referensi teknis resmi tim pengembang A.T.L.A.S.*
