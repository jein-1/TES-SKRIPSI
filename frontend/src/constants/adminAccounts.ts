// ═══════════════════════════════════════════════════════════════
// AEGIS ADMIN ACCOUNTS — Tambahkan akun baru di sini
// Format: { username, password, name, role }
// role ditampilkan di popup ping yang diterima user
// ═══════════════════════════════════════════════════════════════

export interface AdminAccount {
  username: string;
  password: string; // Dalam produksi sebaiknya di-hash
  name: string;
  role: string;     // Ditampilkan di popup ping user
}

export const ADMIN_ACCOUNTS: AdminAccount[] = [
  // ── KOMANDO ──────────────────────────────────────────────────
  {
    username: "admin1",
    password: "password123",
    name: "Komandan Pusat",
    role: "Komando Utama",
  },
  {
    username: "admin2",
    password: "aegis2025",
    name: "Wakil Komandan",
    role: "Komando Utama",
  },

  // ── TIM PENYELAMAT (SAR) ──────────────────────────────────────
  {
    username: "sar1",
    password: "sarpassword",
    name: "Tim Penyelamat Alpha",
    role: "Tim Penyelamat (SAR)",
  },
  {
    username: "sar2",
    password: "sarbeta2025",
    name: "Tim Penyelamat Beta",
    role: "Tim Penyelamat (SAR)",
  },

  // ── KEPOLISIAN ────────────────────────────────────────────────
  {
    username: "polisi1",
    password: "polpassword",
    name: "Petugas Kepolisian",
    role: "Kepolisian",
  },
  {
    username: "polisi2",
    password: "pol2palu25",
    name: "Brigadir Pengamanan",
    role: "Kepolisian",
  },

  // ── MEDIS ─────────────────────────────────────────────────────
  {
    username: "medis1",
    password: "medis2025",
    name: "Tim Medis Lapangan",
    role: "Tim Medis",
  },

  // ── BPBD ─────────────────────────────────────────────────────
  {
    username: "bpbd1",
    password: "bpbd2025",
    name: "Petugas BPBD",
    role: "BPBD (Badan Penanggulangan Bencana)",
  },

  // ── TNI / TENTARA ─────────────────────────────────────────────
  {
    username: "tni1",
    password: "tni2025",
    name: "Sersan TNI",
    role: "TNI (Tentara Nasional Indonesia)",
  },
];

// Master key untuk backend API (JANGAN diubah sembarangan)
export const BACKEND_MASTER_KEY = "aegis2024";
