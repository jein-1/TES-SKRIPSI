// ─────────────────────────────────────────────────────────────────────────────
// DATA SHELTER EVAKUASI
// Titik-titik evakuasi tsunami di Kota Palu berdasarkan lokasi resmi
// ─────────────────────────────────────────────────────────────────────────────
import type { Shelter } from "./types";

export const shelters: Shelter[] = [
  {
    id: "S1",
    name: "Taman GOR Palu",
    // Jl. Chairil Anwar, Besusu Tengah, Kec. Palu Tim. (Plus Code: 4V3C+MW9)
    lat: -0.89559,
    lng: 119.87235,
    capacity: 3000,
  },
  {
    id: "S2",
    name: "Kantor Gubernur Sulawesi Tengah",
    // Jl. Sam Ratulangi No.101, Besusu Bar., Kec. Palu Tim.
    lat: -0.8903,
    lng: 119.87088,
    capacity: 1500,
  },
  {
    id: "S3",
    name: "Hutan Kota Palu",
    // Jl. Jabal Nur, Talise, Kec. Palu Tim. (Plus Code: 4VHM+QGH)
    lat: -0.87031,
    lng: 119.87852,
    capacity: 2000,
  },
  {
    id: "S4",
    name: "Masjid Raya Baitul Khairaat",
    // Jl. Jaelangkara (samping Masjid Agung), Kec. Palu Bar.
    lat: -0.89358,
    lng: 119.85226,
    capacity: 1000,
  },
];
