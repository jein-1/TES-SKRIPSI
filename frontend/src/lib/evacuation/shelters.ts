// ─────────────────────────────────────────────────────────────────────────────
// DATA SHELTER EVAKUASI RESMI (ADMIN A.T.L.A.S)
// Titik evakuasi disinkronkan langsung dari tabel custom_shelters Supabase.
// Tidak ada shelter buatan sendiri atau penarikan acak dari OpenStreetMap.
// ─────────────────────────────────────────────────────────────────────────────
import type { Shelter } from "./types";
import { supabase } from "../supabaseClient";

export const shelters: Shelter[] = [];

const CACHE_KEY = "atlas_cached_shelters";

// Default seed jika cache kosong dan sedang offline tanpa internet
const DEFAULT_PALU_SHELTERS: Shelter[] = [
  {
    id: "shelter-gov-01",
    name: "Kantor Gubernur Sulawesi Tengah",
    lat: -0.8985,
    lng: 119.8707,
    capacity: 2500,
    radiusMeters: 60,
    address: "Jl. Sam Ratulangi No.1, Besusu Barat, Palu"
  },
  {
    id: "shelter-dpr-02",
    name: "Kantor DPRD Provinsi Sulawesi Tengah",
    lat: -0.8962,
    lng: 119.8735,
    capacity: 1500,
    radiusMeters: 50,
    address: "Jl. Sam Ratulangi, Besusu Barat, Palu"
  },
  {
    id: "shelter-imanuel-03",
    name: "Lapangan Imanuel",
    lat: -0.9135,
    lng: 119.8912,
    capacity: 900,
    radiusMeters: 50,
    address: "Jalan Profesor Mohamad Yamin, Tanamodindi, Palu"
  },
  {
    id: "shelter-gor-04",
    name: "GOR Siranindi Palu",
    lat: -0.8932,
    lng: 119.8660,
    capacity: 3000,
    radiusMeters: 70,
    address: "Jl. Moh. Hatta, Lolu Utara, Palu"
  }
];

function saveToLocalStorage() {
  if (typeof window === "undefined") return;
  try {
    if (shelters.length > 0) {
      localStorage.setItem(CACHE_KEY, JSON.stringify(shelters));
    }
  } catch (_) {}
}

/**
 * Load shelters dari memori lokal (offline-first)
 */
export function loadShelters() {
  shelters.length = 0;
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          shelters.push(...parsed);
          return;
        }
      }
    } catch (_) {}
  }
  // Fallback seed resmi jika database belum sempat tersinkron
  shelters.push(...DEFAULT_PALU_SHELTERS);
  saveToLocalStorage();
}

/**
 * Tambah / update shelter ke array in-memory & simpan ke cache lokal
 */
export function addCustomShelter(shelter: Shelter) {
  const idx = shelters.findIndex((s) => s.id === shelter.id);
  if (idx !== -1) {
    shelters[idx] = shelter;
  } else {
    shelters.push(shelter);
  }
  saveToLocalStorage();
}

/**
 * Hapus shelter dari array in-memory & perbarui cache lokal
 */
export function removeCustomShelter(id: string) {
  const idx = shelters.findIndex((s) => s.id === id);
  if (idx !== -1) {
    shelters.splice(idx, 1);
    saveToLocalStorage();
  }
}

/**
 * Load custom shelters dari Supabase jika online, fallback ke cache jika offline
 */
export async function loadCustomSheltersFromSupabase(): Promise<Shelter[]> {
  try {
    const { data, error } = await supabase
      .from("custom_shelters")
      .select(
        "id, name, lat, lng, capacity, radius_meters, address, custom_message",
      )
      .order("created_at", { ascending: true });

    if (error || !data || data.length === 0) {
      console.warn("[Shelters] Offline / gagal ambil Supabase, menggunakan cache lokal:", error);
      if (shelters.length === 0) loadShelters();
      return [...shelters];
    }

    // Bersihkan dan perbarui dengan data resmi terbaru dari server
    shelters.length = 0;
    data.forEach((row: any) => {
      shelters.push({
        id: row.id,
        name: row.name,
        lat: Number(row.lat),
        lng: Number(row.lng),
        capacity: Number(row.capacity) || 500,
        radiusMeters: Number(row.radius_meters) || 50,
        address: row.address ?? undefined,
        customMessage: row.custom_message ?? undefined,
      });
    });

    saveToLocalStorage();
    return [...shelters];
  } catch (e) {
    console.warn("[Shelters] Offline mode, memuat dari penyimpanan lokal:", e);
    if (shelters.length === 0) loadShelters();
    return [...shelters];
  }
}

// Inisialisasi awal langsung dari cache lokal seketika
loadShelters();
loadCustomSheltersFromSupabase().catch(() => {});


