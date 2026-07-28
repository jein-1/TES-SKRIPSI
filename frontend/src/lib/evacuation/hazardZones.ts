// ─────────────────────────────────────────────────────────────────────────────
// ZONA BAHAYA TSUNAMI — Polygon area rawan di Kota Palu
// ─────────────────────────────────────────────────────────────────────────────

export interface HazardZone {
  id: string;
  name: string;
  coords: [number, number][]; // [lat, lng][]
  severity: 'tinggi' | 'sedang' | 'rendah';
  description?: string;
}

export const hazardZones: HazardZone[] = [];
