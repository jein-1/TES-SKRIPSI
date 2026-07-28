-- =====================================================================
-- MIGRATION: Tambah kolom 'custom_message' ke tabel custom_shelters
-- Jalankan di Supabase SQL Editor
-- =====================================================================

-- Kolom pesan khusus dari admin untuk user yang tiba di shelter ini.
-- Nilai NULL berarti tidak ada pesan khusus (tidak ditampilkan di Arrival Modal).
ALTER TABLE public.custom_shelters
  ADD COLUMN IF NOT EXISTS custom_message TEXT DEFAULT NULL;
