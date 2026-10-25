// ─────────────────────────────────────────────────────────────────────────────
// DATA SHELTER EVAKUASI RESMI (ADMIN A.T.L.A.S)
// Titik evakuasi disinkronkan langsung dari tabel custom_shelters Supabase.
// Tidak ada shelter buatan sendiri atau penarikan acak dari OpenStreetMap.
// ─────────────────────────────────────────────────────────────────────────────
import type { Shelter } from "./types";
import { supabase } from "../supabaseClient";

export const shelters: Shelter[] = [];

/**
 * Reset array shelters in-memory.
 */
export function loadShelters() {
  shelters.length = 0;
}

/**
 * Tambah / update shelter ke array in-memory (immediate sync).
 */
export function addCustomShelter(shelter: Shelter) {
  const idx = shelters.findIndex((s) => s.id === shelter.id);
  if (idx !== -1) {
    shelters[idx] = shelter;
  } else {
    shelters.push(shelter);
  }
}

/**
 * Hapus shelter dari array in-memory.
 */
export function removeCustomShelter(id: string) {
  const idx = shelters.findIndex((s) => s.id === id);
  if (idx !== -1) {
    shelters.splice(idx, 1);
  }
}

/**
 * Load custom shelters dari Supabase (sumber kebenaran tunggal dari Admin).
 */
export async function loadCustomSheltersFromSupabase(): Promise<Shelter[]> {
  try {
    const { data, error } = await supabase
      .from("custom_shelters")
      .select(
        "id, name, lat, lng, capacity, radius_meters, address, custom_message",
      )
      .order("created_at", { ascending: true });

    if (error || !data) {
      console.warn("[Shelters] Gagal mengambil shelter dari Supabase:", error);
      return [...shelters];
    }

    // Bersihkan semua data shelter lama agar tidak ada shelter liar tersisa
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

    return [...shelters];
  } catch (e) {
    console.error("[Shelters] loadCustomSheltersFromSupabase failed:", e);
    return [...shelters];
  }
}

// Bersihkan cache usang OpenStreetMap dari localStorage agar tidak mengotori sesi pengguna
if (typeof window !== "undefined") {
  try {
    localStorage.removeItem("aegisOsmShelters");
    localStorage.removeItem("aegisOsmSheltersTime");
  } catch {}
}

// Load shelter resmi dari Supabase saat module diinisialisasi
loadShelters();
loadCustomSheltersFromSupabase().catch(() => {});

