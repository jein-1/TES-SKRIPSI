# Rencana Implementasi Klasifikasi Zona Rawan Bencana (ZRB)

Pembaruan ini akan mengubah sistem klasifikasi zona bahaya sederhana yang sebelumnya menggunakan *severity* ('tinggi', 'sedang', 'rendah') menjadi standar formal tata ruang Zona Rawan Bencana (ZRB 1-4).

## User Review Required

> [!IMPORTANT]
> Mohon tinjau rencana migrasi basis data dan struktur frontend.
> Perubahan ini memerlukan **migrasi tabel Supabase** (`hazard_zones`), di mana kolom `severity` yang lama akan dihapus dan digantikan oleh `zrb_level`. Data poligon lama yang masih menggunakan format *severity* mungkin akan terpengaruh jika tidak ditangani dengan migrasi konversi. 
> Namun, karena kita akan langsung memberikan *script* SQL untuk migrasi, pastikan tidak ada data kritis di database *production* Anda yang terhapus secara tidak sengaja.

## Open Questions

1. **Migrasi Data Lama**: Apakah Anda ingin *script* SQL yang mengubah nilai *severity* ('tinggi' => 4, 'sedang' => 3, 'rendah' => 1) agar zona yang telanjur digambar di peta sebelumnya tidak hilang, atau boleh dikosongkan/di-*drop* saja kolom lamanya? Di dalam rencana ini saya asumsikan akan **memigrasi** data 'tinggi' menjadi ZRB 4, dst., sebelum menghapus kolom lama.

## Proposed Changes

---

### Basis Data Supabase

#### [NEW] `supabase-migration-zrb.sql`
Skrip SQL untuk:
- Menambahkan kolom `zrb_level INT CHECK (zrb_level BETWEEN 1 AND 4)`.
- Mengisi nilai awal `zrb_level` berdasarkan kolom `severity` lama untuk data yang sudah ada.
- Menghapus kolom `severity`.

---

### Backend Serverless API

#### [MODIFY] `api/hazard-zones/add.js`
- Mengganti parameter masukan dari `severity` menjadi `zrbLevel` (di-*mapping* ke `zrb_level` di Supabase).

#### [MODIFY] `api/hazard-zones/update.js`
- Mengganti penerimaan parameter `severity` menjadi `zrbLevel`.

---

### Frontend (Data Layer & Type)

#### [NEW] `frontend/src/lib/evacuation/zrbReference.ts`
- Menyimpan konstanta `ZRB_REFERENCE` persis seperti spesifikasi yang diberikan, sebagai sumber kebenaran tunggal (*Single Source of Truth*) untuk label, warna, kriteria, dan arahan spasial.

#### [MODIFY] `frontend/src/lib/evacuation/hazardZones.ts`
- Mengubah *interface* `HazardZone`: mengganti tipe properti `severity: 'tinggi'|'sedang'|'rendah'` menjadi `zrbLevel: 1 | 2 | 3 | 4`.

#### [MODIFY] `frontend/src/lib/useAegisSync.ts`
- Di `fetchHazardZones`, *mapping* kolom `row.zrb_level` dari *database* menjadi `zrbLevel` di aplikasi.

---

### Frontend (UI Admin Dashboard)

#### [MODIFY] `frontend/src/App.tsx`
- **MapGeoJSON Renderer**: Pewarnaan *fill* dan *stroke* poligon akan ditarik dinamis dari properti `color` pada `ZRB_REFERENCE[zone.zrbLevel]`.
- **Formulir Tambah/Edit Zona**: Mengganti *dropdown* (*select*) tinggi/sedang/rendah menjadi level **ZRB 1 hingga 4**.
- **Panel Detail Zona**: Menampilkan seluruh data klasifikasi resmi secara terstruktur (Label, Tipologi, Kriteria, Catatan, dan Arahan Spasial) saat poligon di-klik di Peta Admin.

## Verification Plan

### Automated Tests
- Menjalankan `npm run build` untuk memverifikasi seluruh komponen TypeScript tidak memiliki galat tipe data (`zrbLevel` versus `severity`).

### Manual Verification
- Eksekusi SQL di Supabase Dasbor.
- Menambahkan ZRB 4 melalui UI.
- Membuka informasi zona di UI untuk memverifikasi teks kriteria & warna yang muncul.
