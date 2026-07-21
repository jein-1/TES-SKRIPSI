// ─────────────────────────────────────────────────────────────────────────────
// DATA SHELTER EVAKUASI
// Titik-titik evakuasi tsunami di Kota Palu berdasarkan lokasi resmi
// ─────────────────────────────────────────────────────────────────────────────
import type { Shelter } from "./types";
import { supabase } from "../supabaseClient";

const defaultShelters: Shelter[] = [
  {
    id: "S1",
    name: "Taman GOR Palu",
    // Jl. Chairil Anwar, Besusu Tengah, Kec. Palu Tim. (Plus Code: 4V3C+MW9)
    lat: -0.89559,
    lng: 119.87235,
    capacity: 3000,
    radiusMeters: 50,
  },
  {
    id: "S2",
    name: "Kantor Gubernur Sulawesi Tengah",
    // Jl. Sam Ratulangi No.101, Besusu Bar., Kec. Palu Tim.
    lat: -0.8903,
    lng: 119.87088,
    capacity: 1500,
    radiusMeters: 50,
  },
  {
    id: "S3",
    name: "Hutan Kota Palu",
    // Jl. Jabal Nur, Talise, Kec. Palu Tim. (Plus Code: 4VHM+QGH)
    lat: -0.87031,
    lng: 119.87852,
    capacity: 2000,
    radiusMeters: 50,
  },
  {
    id: "S4",
    name: "Masjid Raya Baitul Khairaat",
    // Jl. Jaelangkara (samping Masjid Agung), Kec. Palu Bar.
    lat: -0.89358,
    lng: 119.85226,
    capacity: 1000,
    radiusMeters: 50,
  },
  {
    id: "S5",
    name: "Lapangan imanuel palu",
    // Jl. Balai Kota Sel. No.8, Tanamodindi, Kec. Palu Sel., Kota Palu, Sulawesi Tengah 94111
    lat: -0.90394,
    lng: 119.88947,
    capacity: 2000,
    radiusMeters: 50,
  },
  {
    id: "S6",
    name: "Lapangan Vatulemo",
    // Lapangan Vatulomo, Jl. Balai Kota Timur Tanamodindi Mantikulore, Lolu Utara, Kec. Palu Sel., Kota Palu, Sulawesi Tengah 94111
    lat: -0.900281,
    lng: 119.889075,
    capacity: 5000,
    radiusMeters: 50,
  },
  {
    id: "S7",
    name: "Kantor Walikota Palu",
    // Jl. Balai Kota Timur No.1, Tanamodindi, Kec. Mantikulore, Kota Palu, Sulawesi Tengah 94234
    lat: -0.90015,
    lng: 119.89056,
    capacity: 500,
    radiusMeters: 50,
  },
];

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
  if (!shelters.find(s => s.id === shelter.id)) {
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
      .select("id, name, lat, lng, capacity, radius_meters")
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
      };
      if (!shelters.find(existing => existing.id === s.id)) {
        shelters.push(s);
      }
    });
  } catch (e) {
    console.error("[Shelters] loadCustomSheltersFromSupabase failed:", e);
  }
}

export async function fetchOsmShelters() {
  const CACHE_KEY = 'aegisOsmShelters';
  const CACHE_TIME_KEY = 'aegisOsmSheltersTime';
  const ONE_DAY = 24 * 60 * 60 * 1000;

  try {
    const cachedTime = localStorage.getItem(CACHE_TIME_KEY);
    const cachedData = localStorage.getItem(CACHE_KEY);

    if (cachedTime && cachedData && Date.now() - parseInt(cachedTime) < ONE_DAY) {
      const parsed = JSON.parse(cachedData);
      // add them if not already added
      const existingIds = new Set(shelters.map(s => s.id));
      parsed.forEach((s: Shelter) => {
        if (!existingIds.has(s.id)) shelters.push(s);
      });
      return;
    }

    // Fetch from Overpass API (Bounding Box around Palu)
    const query = `[out:json];(node["amenity"="hospital"](-0.98,119.80,-0.82,119.95);node["amenity"="school"](-0.98,119.80,-0.82,119.95);node["amenity"="place_of_worship"](-0.98,119.80,-0.82,119.95););out body;`;
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: query
    });
    const data = await res.json();
    
    const newShelters: Shelter[] = [];
    data.elements.forEach((el: any) => {
      if (el.lat && el.lon) {
        newShelters.push({
          id: 'OSM_' + el.id,
          name: el.tags.name || (el.tags.amenity === 'hospital' ? 'Rumah Sakit' : (el.tags.amenity === 'school' ? 'Sekolah' : 'Tempat Ibadah')),
          lat: el.lat,
          lng: el.lon,
          capacity: el.tags.amenity === 'hospital' ? 1000 : 500,
          radiusMeters: 50
        });
      }
    });

    localStorage.setItem(CACHE_KEY, JSON.stringify(newShelters));
    localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());

    const existingIds = new Set(shelters.map(s => s.id));
    newShelters.forEach(s => {
      if (!existingIds.has(s.id)) shelters.push(s);
    });
  } catch (e) {
    console.error('Failed to fetch OSM shelters:', e);
  }
}

// Load on initialization (default shelters only; custom shelters loaded async via Supabase in App.tsx)
loadShelters();
fetchOsmShelters();
