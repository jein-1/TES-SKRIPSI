// ─────────────────────────────────────────────────────────────────────────────
// TIPE DATA — Semua interface untuk modul evakuasi
// ─────────────────────────────────────────────────────────────────────────────

export interface Point {
  lat: number;
  lng: number;
}

export interface Shelter extends Point {
  id: string;
  name: string;
  capacity: number;
  radiusMeters?: number; // Custom radius kedatangan untuk masing-masing shelter
}

export interface RoadNode extends Point {
  id: string;
}

export interface RoadEdge {
  from: string;
  to: string;
  distance: number; // Jarak dalam km (Haversine)
}

export interface RouteResult {
  shelterName: string;
  shelterId: string;
  shelterCapacity: number;
  haversineDistance: number;  // Jarak lurus (km)
  dijkstraDistance: number;   // Jarak via jalan (km)
  totalDistance: number;      // Total jarak realistis (km)
  coordinates: [number, number][];
  walkingTime: number;        // Estimasi waktu jalan kaki (menit)
  runningTime: number;        // Estimasi waktu berlari (menit)
}

export interface DijkstraResult {
  distance: number;
  path: string[];
  coordinates: [number, number][];
}
