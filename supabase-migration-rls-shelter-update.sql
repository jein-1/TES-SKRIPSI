-- =====================================================================
-- MIGRATION: RLS Policy untuk custom_shelters
--
-- Tujuan: Memastikan client (anon key) tidak bisa langsung UPDATE
-- ke tabel custom_shelters. Semua update HARUS lewat endpoint
-- /api/shelters/update yang menggunakan SUPABASE_SERVICE_ROLE_KEY
-- (service_role selalu bypass RLS).
--
-- Jalankan di Supabase SQL Editor.
-- =====================================================================

-- 1. Aktifkan Row Level Security pada tabel custom_shelters
--    (sebelumnya DISABLE untuk kemudahan — sekarang kita enforce update policy)
ALTER TABLE public.custom_shelters ENABLE ROW LEVEL SECURITY;

-- 2. Policy: semua orang boleh membaca (SELECT) daftar shelter
--    Diperlukan agar app user & admin bisa fetch shelter dari client-side anon key
CREATE POLICY "allow_select_all"
  ON public.custom_shelters
  FOR SELECT
  USING (true);

-- 3. Policy: blokir UPDATE langsung dari client (anon / authenticated)
--    Service Role Key (dipakai endpoint /api/shelters/update) selalu bypass RLS
--    sehingga endpoint tetap bisa UPDATE meski policy ini ada.
CREATE POLICY "allow_update"
  ON public.custom_shelters
  FOR UPDATE
  USING (false);    -- tidak ada kondisi yang mengizinkan client update langsung

-- 4. Policy: blokir DELETE langsung dari client (opsional, best practice)
CREATE POLICY "block_delete"
  ON public.custom_shelters
  FOR DELETE
  USING (false);

-- 5. INSERT tetap dilakukan via /api/shelters/add (service_role),
--    sehingga kita block INSERT dari anon juga
CREATE POLICY "block_insert_anon"
  ON public.custom_shelters
  FOR INSERT
  WITH CHECK (false);

-- =====================================================================
-- Catatan: Setelah migration ini dijalankan:
--  - Client (anon key) hanya bisa SELECT
--  - INSERT, UPDATE, DELETE wajib lewat endpoint API (service_role)
--  - Ini adalah security best practice untuk produksi
-- =====================================================================
