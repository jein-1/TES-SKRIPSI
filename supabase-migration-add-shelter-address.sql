-- =====================================================================
-- MIGRATION: Tambah kolom 'address' ke tabel custom_shelters
-- Jalankan di Supabase SQL Editor
-- =====================================================================

-- Pastikan tabel custom_shelters sudah ada (dibuat di setup awal)
-- Tambah kolom address (nullable TEXT, default NULL)
ALTER TABLE custom_shelters
  ADD COLUMN IF NOT EXISTS address TEXT DEFAULT NULL;

-- Aktifkan Realtime untuk custom_shelters (jika belum)
ALTER PUBLICATION supabase_realtime ADD TABLE custom_shelters;

-- Nonaktifkan RLS untuk kemudahan skripsi (sesuai konvensi project ini)
ALTER TABLE custom_shelters DISABLE ROW LEVEL SECURITY;
