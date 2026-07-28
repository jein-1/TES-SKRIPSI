# Implementasi CRUD Zona Bahaya (Hazard Zones)

Fitur ini akan menambahkan kapabilitas penuh bagi admin untuk menggambar, menyimpan, mengedit, dan menghapus Zona Bahaya (Polygon) secara langsung dari peta.

## User Review Required

> [!IMPORTANT]
> Mohon tinjau rencana berikut. Ada beberapa perubahan cukup besar pada UI peta dan logika sinkronisasi realtime. Pastikan fitur ini selaras dengan kebutuhan *dashboard* Anda.

## Open Questions

1. **Polygon Format**: Tabel `hazard_zones` akan menyimpan `coordinates` sebagai JSON `[[lat, lng], [lat, lng], ...]`. Apakah Anda setuju format sederhana ini (bukan spesifikasi GeoJSON murni di kolom `coordinates`) untuk mempermudah manipulasi *array* pada React State sebelum dirender menjadi GeoJSON di komponen Peta?
2. **Tombol "Tambah Zona Bahaya"**: Saya akan meletakkannya di *sidebar* bawah (di sebelah tombol "Tambah Shelter"). Apakah lokasi ini sudah pas?

## Proposed Changes

---

### Backend (Serverless API)

Akan dibuat 3 file baru di direktori `api/hazard-zones/`:

#### [NEW] `api/hazard-zones/add.js`
Endpoint `POST` untuk validasi JWT dan menambahkan poligon zona bahaya baru menggunakan `SUPABASE_SERVICE_ROLE_KEY`. Jika sukses, *trigger broadcast* `HAZARD_ZONE_ADDED`.

#### [NEW] `api/hazard-zones/update.js`
Endpoint `PATCH` untuk mengubah detail zona (nama, deskripsi, *severity*) atau bentuk koordinat. *Trigger broadcast* `HAZARD_ZONE_UPDATED`.

#### [NEW] `api/hazard-zones/delete.js`
Endpoint `DELETE` untuk menghapus zona secara permanen dari Supabase. *Trigger broadcast* `HAZARD_ZONE_DELETED`.

---

### Library Frontend & Sync

#### [MODIFY] `frontend/src/lib/evacuation.ts` & `hazardZones.ts`
Menghapus data statis pada `hazardZones.ts` dan mengubahnya menjadi penampung *array* kosong `export const hazardZones = [];`. Saya akan menyisipkan tipe data `HazardZone` dengan properti `{ id, name, coords, severity, description }`.

#### [MODIFY] `frontend/src/lib/useAegisSync.ts`
- Menambahkan fungsi API `aegisApi.addHazardZone`, `updateHazardZone`, `deleteHazardZone`, dan `fetchHazardZones`.
- Memasukkan *event listener* `HAZARD_ZONE_ADDED`, `HAZARD_ZONE_UPDATED`, dan `HAZARD_ZONE_DELETED` ke dalam siklus *broadcast* Realtime Supabase.

---

### Aplikasi Utama (UI Peta & Kontrol Admin)

#### [MODIFY] `frontend/src/App.tsx`
- **State Drawing**: Menambahkan *state* `drawingZoneMode` dan `drawingZoneCoords` (untuk menyimpan setiap klik admin pada peta).
- **UI Peta (Klik Koordinat)**: Jika `drawingZoneMode` aktif, aksi klik pada komponen `Map` tidak memindahkan titik *Fokus*, melainkan menambahkan koordinat baru ke *array* sementara. Poligon sementara dirender secara *live* via `MapGeoJSON` menggunakan *state* `drawingZoneCoords`.
- **Form Selesai/Batal**: Menyediakan menu khusus mengambang (saat `drawingZoneMode` aktif) yang berisi tombol "Batal" dan "Selesai". Tombol "Selesai" mengunci gambar dan memunculkan modal kustom pengisian data (Nama, *Severity*, dan Deskripsi Opsional).
- **Interaksi Poligon Terdaftar**: Menambahkan argumen `onClick` pada `MapGeoJSON` milik `hazardZones`. Jika zona diklik, akan muncul Panel Info Zona Bahaya kustom (serupa dengan info *Shelter*) dengan opsi **Edit** dan **Hapus**.

## Verification Plan

### Automated Tests
* Tidak ada pengujian otomatis yang didefinisikan saat ini. Validasi kompilasi akan dilakukan melalui `npm run build`.

### Manual Verification
* **Menggambar Zona**: Masuk sebagai admin, klik "Tambah Zona Bahaya", pastikan klik pada peta berhasil menggambar poligon secara riil.
* **Simpan ke Supabase**: Memastikan penyimpanan memanggil endpoint `/api/hazard-zones/add` dan seketika tersebar (*sync*) ke perangkat lain.
* **Interaksi Edit/Hapus**: Mengeklik zona akan memunculkan *panel detail*, di mana tindakan **Hapus** akan memanggil endpoint `/delete` dan seketika menyingkirkan zona dari layar peta, begitupun ketika diedit.
