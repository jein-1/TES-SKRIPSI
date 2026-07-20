# Panduan Migrasi AEGIS RESPONSE ke Supabase

Aplikasi ini sekarang menggunakan arsitektur **Vercel Serverless Functions + Supabase (Postgres & Realtime)**.
Ini membuatnya sangat handal (status persisten), real-time, dan tidak membutuhkan server Node.js khusus (seperti Railway) untuk berjalan 24 jam.

## 1. Buat Project Supabase
1. Buka [Supabase.com](https://supabase.com) dan daftar/login.
2. Klik **"New Project"**, beri nama (misal: `aegis-db`), set password database, lalu tunggu sampai selesai dibuat.

## 2. Setup Database (SQL)
1. Di dashboard Supabase, pilih menu **SQL Editor** di panel sebelah kiri.
2. Buat "New query".
3. Copy-paste seluruh isi file `supabase-schema.sql` yang ada di folder root ke dalam SQL Editor tersebut.
4. Klik tombol **Run**. 
   *(Ini akan otomatis membuat tabel `tsunami_state`, `push_subscriptions`, dan `location_updates`, serta mengaktifkan fitur Realtime).*

## 3. Dapatkan Kredensial Supabase
1. Di dashboard Supabase, masuk ke **Project Settings** (ikon gerigi) -> **API**.
2. Salin (copy) dua nilai berikut:
   - **Project URL** (ini akan menjadi `VITE_SUPABASE_URL` / `SUPABASE_URL`)
   - **Project API Keys (anon / public)** (ini akan menjadi `VITE_SUPABASE_ANON_KEY` / `SUPABASE_ANON_KEY`)

## 4. Konfigurasi Environment Variables di Vercel
1. Buka dashboard Vercel Anda, masuk ke project **TES-SKRIPSI**, lalu buka **Settings** -> **Environment Variables**.
2. Tambahkan _key-value_ berikut (jangan lupa simpan):
   - `VITE_SUPABASE_URL` = (isi dengan Project URL Supabase)
   - `VITE_SUPABASE_ANON_KEY` = (isi dengan Anon Key Supabase)
   - `SUPABASE_URL` = (isi dengan Project URL Supabase - sama seperti VITE_)
   - `SUPABASE_ANON_KEY` = (isi dengan Anon Key Supabase - sama seperti VITE_)
   - `VAPID_PUBLIC_KEY` = (isi dengan Vapid Public Key - atau pakai bawaan)
   - `VAPID_PRIVATE_KEY` = (isi dengan Vapid Private Key - atau pakai bawaan)
   - `ADMIN_KEY` = `aegis2024`

## 5. Deploy Ulang (Redeploy)
Karena Anda baru saja mengatur kredensial dan melakukan perubahan kode:
1. Pastikan semua file di-commit dan di-push ke GitHub.
2. Masuk ke tab **Deployments** di Vercel.
3. Klik tombol tiga titik (`...`) di commit terbaru dan pilih **Redeploy**.

Selesai! Sekarang aplikasi Anda 100% menggunakan arsitektur serverless modern dengan sinkronisasi Realtime via Supabase.
