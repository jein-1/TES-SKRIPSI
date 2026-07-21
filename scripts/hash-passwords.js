import bcrypt from 'bcryptjs';

const ADMIN_ACCOUNTS = [
  { username: "admin1", password: "password123", name: "Komandan Pusat", role: "Komando Utama" },
  { username: "admin2", password: "aegis2025", name: "Wakil Komandan", role: "Komando Utama" },
  { username: "sar1", password: "sarpassword", name: "Tim Penyelamat Alpha", role: "Tim Penyelamat (SAR)" },
  { username: "sar2", password: "sarbeta2025", name: "Tim Penyelamat Beta", role: "Tim Penyelamat (SAR)" },
  { username: "polisi1", password: "polpassword", name: "Petugas Kepolisian", role: "Kepolisian" },
  { username: "polisi2", password: "pol2palu25", name: "Brigadir Pengamanan", role: "Kepolisian" },
  { username: "medis1", password: "medis2025", name: "Tim Medis Lapangan", role: "Tim Medis" },
  { username: "bpbd1", password: "bpbd2025", name: "Petugas BPBD", role: "BPBD (Badan Penanggulangan Bencana)" },
  { username: "tni1", password: "tni2025", name: "Sersan TNI", role: "TNI (Tentara Nasional Indonesia)" }
];

async function generate() {
  const result = [];
  for (const acc of ADMIN_ACCOUNTS) {
    const hash = await bcrypt.hash(acc.password, 10);
    result.push({
      username: acc.username,
      passwordHash: hash,
      name: acc.name,
      role: acc.role
    });
  }
  console.log(JSON.stringify(result));
}

generate();
