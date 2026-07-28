# Rencana Implementasi Proteksi Brute-Force (Login)

Fitur ini akan mengamankan endpoint `api/auth/login.js` dari serangan tebak *password* (brute-force) dan *credential stuffing* dengan melacak percobaan gagal berbasis *Username* dan *IP Address*.

## User Review Required

> [!IMPORTANT]
> Mohon tinjau rencana perlindungan *brute-force* di bawah ini. Pastikan batas *rate-limit* yang ditetapkan sudah sesuai dengan kebijakan keamanan aplikasi Anda.

## Open Questions

1. **Retensi Data Historis**: Rencana saat ini akan menyimpan log *success=true* sebagai *audit trail*, dan membersihkan log *success=false* untuk *username* tersebut setiap kali ia berhasil *login*. Apakah Anda setuju dengan pendekatan pembersihan otomatis (*auto-cleanup*) ini untuk menghemat ruang tabel?
2. **Pembacaan IP**: Kita akan membaca IP dari `req.headers['x-forwarded-for']`. Di lingkungan *Vercel/serverless* ini lazim digunakan. Apabila absen, kita gunakan *fallback* ke `req.socket.remoteAddress` atau string statis jika keduanya tidak tersedia. Apakah ini disetujui?

## Proposed Changes

---

### Basis Data Supabase

#### [NEW] `supabase-migration-login-attempts.sql`
Skrip SQL untuk dijalankan di Supabase guna membuat tabel pencatat upaya masuk (*login*):
- Membuat tabel `login_attempts` dengan kolom: `id` (BIGSERIAL), `username` (TEXT), `ip` (TEXT), `success` (BOOLEAN), `created_at` (TIMESTAMPTZ).
- Mengaktifkan *Row Level Security* (RLS) tanpa memberikan kebijakan publik (`SELECT`, `INSERT`, dll). Data ini mutlak hanya boleh dibaca dan ditulis oleh *backend* menggunakan *Service Role Key*.

---

### Backend (Serverless API)

#### [MODIFY] `api/auth/login.js`
Akan diubah secara substansial untuk menyuntikkan 2 lapisan *rate limiting* dengan Supabase:
1. **Inisialisasi Supabase**: Mengimpor dan membuat *instance* klien Supabase dengan `SUPABASE_SERVICE_ROLE_KEY` (bersama dengan *error handling* jika *key* absen).
2. **Pendeteksi IP**: Mengambil IP klien dari *header* `x-forwarded-for`.
3. **Pengecekan Rate Limit (Sebelum Cek Password)**:
   - **Berdasarkan IP**: Melakukan *query* ke `login_attempts` untuk mengecek total kegagalan dari IP tersebut dalam 15 menit terakhir. Jika `>= 20`, akan langsung dikembalikan status `429 Too Many Requests`.
   - **Berdasarkan Username**: Melakukan *query* untuk mengecek total kegagalan dengan nama pengguna tersebut dalam 15 menit terakhir. Jika `>= 5`, kembalikan `429 Too Many Requests`.
4. **Pencatatan Kegagalan (Log Failure)**: Jika pengguna tidak ditemukan di `ADMIN_ACCOUNTS_JSON` atau *password* salah, sebuah rekaman gagal (`success: false`) akan di-*insert* ke dalam Supabase sebelum memberikan respon `401 Unauthorized`.
5. **Pencatatan Keberhasilan (Log Success) & Reset**: Jika *login* berhasil:
   - Akan ditambahkan *record* ke Supabase (`success: true`) sebagai jejak audit.
   - Akan dilakukan perintah `DELETE` terhadap semua *record* yang gagal milik nama pengguna tersebut untuk mereset *counter*.

## Verification Plan

### Automated Tests
* Menggunakan `npm run build` untuk memverifikasi sintaksis tidak mengalami kerusakan.

### Manual Verification
* Mencoba *login* dengan nama pengguna yang ada, memasukkan sandi acak lebih dari 5 kali, dan memverifikasi akan terkunci (*rate-limited*) dengan *error 429*.
* Menguji dengan nama pengguna yang tidak ada berulang kali (20 kali percobaan gagal untuk berbagai macam akun) guna memvalidasi pemblokiran berbasis IP.
* Memastikan berhasil masuk (jika masih dalam *limit* wajar) membersihkan rekaman kegagalan di tabel `login_attempts` (dapat dipantau di Dasbor Supabase).
