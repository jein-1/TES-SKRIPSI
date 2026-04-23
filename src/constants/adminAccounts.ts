export interface AdminAccount {
  username: string;
  password: string; // Dalam produksi sebaiknya di-hash
  name: string;
  role: string;
}

export const ADMIN_ACCOUNTS: AdminAccount[] = [
  {
    username: "admin1",
    password: "password123",
    name: "Komandan Pusat",
    role: "Komando Utama",
  },
  {
    username: "sar1",
    password: "sarpassword",
    name: "Tim Penyelamat Alpha",
    role: "Tim Penyelamat (SAR)",
  },
  {
    username: "polisi1",
    password: "polpassword",
    name: "Petugas Kepolisian",
    role: "Kepolisian",
  }
];

// Master key untuk backend API
export const BACKEND_MASTER_KEY = "aegis2024";
