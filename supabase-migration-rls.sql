-- MENGAKTIFKAN RLS DAN MEMBERIKAN AKSES BACA KE ANON/PUBLIC
-- Jalankan ini di Supabase SQL Editor jika Anda memutuskan untuk 
-- mengaktifkan RLS (Row Level Security) di tabel tsunami_state 
-- demi keamanan di production.

-- 1. Aktifkan kembali RLS di tabel tsunami_state
ALTER TABLE tsunami_state ENABLE ROW LEVEL SECURITY;

-- 2. Buat policy agar role 'anon' (pengguna aplikasi tanpa login)
--    dapat melakukan SELECT/membaca status tsunami.
--    Tanpa ini, getTsunami() akan mengembalikan error/akses ditolak
--    yang menyebabkan status evakuasi hilang saat halaman di-refresh.
CREATE POLICY "Allow public read access to tsunami state"
ON tsunami_state
FOR SELECT
TO anon
USING (true);

-- Catatan:
-- Karena RLS aktif, modifikasi (UPDATE/INSERT) dari client side (anon)
-- otomatis DITOLAK kecuali ada policy lain yang mengizinkan.
-- Fungsi Vercel (/api/tsunami) dapat melakukan bypass RLS karena menggunakan
-- fungsi backend (meskipun di API code saat ini menggunakan ANON_KEY, 
-- sebaiknya Vercel API menggunakan SERVICE_ROLE_KEY untuk keamanan maksimal
-- jika RLS sudah diaktifkan).
