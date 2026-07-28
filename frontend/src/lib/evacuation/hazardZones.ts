// ─────────────────────────────────────────────────────────────────────────────
// ZONA BAHAYA TSUNAMI — Polygon area rawan di Kota Palu
// ─────────────────────────────────────────────────────────────────────────────

import { ZRBLevel } from "./zrbReference";

export interface HazardZone {
  id: string;
  name: string;
  coords: [number, number][]; // [lat, lng][]
  zrbLevel: ZRBLevel;
  description?: string;
}

export const hazardZones: HazardZone[] = [];
