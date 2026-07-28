// ─────────────────────────────────────────────────────────────────────────────
// DATA SHELTER EVAKUASI
// Titik-titik evakuasi tsunami di Kota Palu berdasarkan lokasi resmi
// ─────────────────────────────────────────────────────────────────────────────
import type { Shelter } from "./types";
import { supabase } from "../supabaseClient";

const defaultShelters: Shelter[] = [];

export const shelters: Shelter[] = [];

export function loadShelters() {
  shelters.length = 0;
  shelters.push(...defaultShelters);
}

/**
 * Tambah shelter ke array in-memory (immediate, tanpa perlu refetch).
 * Penyimpanan ke Supabase dilakukan via aegisApi.addCustomShelter() di App.tsx.
 */
export function addCustomShelter(shelter: Shelter) {
  // Cegah duplikat jika sudah ada (misal dari Postgres realtime + broadcast)
  if (!shelters.find((s) => s.id === shelter.id)) {
    shelters.push(shelter);
  }
}

/**
 * Load custom shelters dari Supabase saat aplikasi pertama kali dibuka.
 * Dipanggil sekali di App.tsx useEffect, hasilnya di-push ke array shelters.
 */
export async function loadCustomSheltersFromSupabase(): Promise<void> {
  try {
    const { data, error } = await supabase
      .from("custom_shelters")
      .select(
        "id, name, lat, lng, capacity, radius_meters, address, custom_message",
      )
      .order("created_at", { ascending: true });
    if (error || !data) return;
    data.forEach((row: any) => {
      const s: Shelter = {
        id: row.id,
        name: row.name,
        lat: row.lat,
        lng: row.lng,
        capacity: row.capacity,
        radiusMeters: row.radius_meters,
        address: row.address ?? undefined,
        customMessage: row.custom_message ?? undefined,
      };
      if (!shelters.find((existing) => existing.id === s.id)) {
        shelters.push(s);
      }
    });
  } catch (e) {
    console.error("[Shelters] loadCustomSheltersFromSupabase failed:", e);
  }
}

export async function fetchOsmShelters() {
  const CACHE_KEY = "aegisOsmShelters";
  const CACHE_TIME_KEY = "aegisOsmSheltersTime";
  const ONE_DAY = 24 * 60 * 60 * 1000;

  try {
    const cachedTime = localStorage.getItem(CACHE_TIME_KEY);
    const cachedData = localStorage.getItem(CACHE_KEY);

    if (
      cachedTime &&
      cachedData &&
      Date.now() - parseInt(cachedTime) < ONE_DAY
    ) {
      const parsed = JSON.parse(cachedData);
      // add them if not already added
      const existingIds = new Set(shelters.map((s) => s.id));
      parsed.forEach((s: Shelter) => {
        if (!existingIds.has(s.id)) shelters.push(s);
      });
      return;
    }

    // Fetch from Overpass API (Bounding Box around Palu)
    const query = `[out:json];(node["amenity"="hospital"](-0.98,119.80,-0.82,119.95);node["amenity"="school"](-0.98,119.80,-0.82,119.95);node["amenity"="place_of_worship"](-0.98,119.80,-0.82,119.95););out body;`;
    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: query,
    });
    const data = await res.json();

    const newShelters: Shelter[] = [];
    data.elements.forEach((el: any) => {
      if (el.lat && el.lon) {
        newShelters.push({
          id: "OSM_" + el.id,
          name:
            el.tags.name ||
            (el.tags.amenity === "hospital"
              ? "Rumah Sakit"
              : el.tags.amenity === "school"
                ? "Sekolah"
                : "Tempat Ibadah"),
          lat: el.lat,
          lng: el.lon,
          capacity: el.tags.amenity === "hospital" ? 1000 : 500,
          radiusMeters: 50,
        });
      }
    });

    localStorage.setItem(CACHE_KEY, JSON.stringify(newShelters));
    localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());

    const existingIds = new Set(shelters.map((s) => s.id));
    newShelters.forEach((s) => {
      if (!existingIds.has(s.id)) shelters.push(s);
    });
  } catch (e) {
    console.error("Failed to fetch OSM shelters:", e);
  }
}

// Load on initialization (default shelters only; custom shelters loaded async via Supabase in App.tsx)
loadShelters();
fetchOsmShelters();
