-- A.T.L.A.S - NIK (Nomor Induk Kependudukan) Integration Migration
-- Menambahkan kolom nik ke tabel location_updates untuk identitas kependudukan terverifikasi
-- -------------------------------------------------------------

ALTER TABLE location_updates ADD COLUMN IF NOT EXISTS nik TEXT;
CREATE INDEX IF NOT EXISTS idx_location_updates_nik ON location_updates(nik);
