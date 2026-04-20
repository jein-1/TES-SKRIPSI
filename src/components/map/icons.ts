// ═══════════════════════════════════════════════════════════════
// LEAFLET ICONS — Semua ikon kustom untuk marker peta
// ═══════════════════════════════════════════════════════════════

import L from 'leaflet'

// ── Fix Leaflet default icon path (Vite bundler issue) ──────────
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// ── Shelter Marker ──────────────────────────────────────────────
export const shelterIcon = new L.Icon({
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
  className: 'shelter-marker',
})

// ── User Position (Normal) ──────────────────────────────────────
export const userIcon = new L.DivIcon({
  html: `<div style="width:20px;height:20px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border:3px solid white;border-radius:50%;box-shadow:0 0 12px rgba(99,102,241,0.7),0 0 24px rgba(99,102,241,0.3);animation:userPulse 2s infinite;"></div>
  <style>@keyframes userPulse{0%,100%{box-shadow:0 0 12px rgba(99,102,241,0.7);}50%{box-shadow:0 0 24px rgba(99,102,241,1),0 0 48px rgba(99,102,241,0.5);}}</style>`,
  className: '', iconSize: [20, 20], iconAnchor: [10, 10],
})

// ── User Position (Tsunami Alert — panah merah berkedip) ─────────
export const userIconAlert = new L.DivIcon({
  html: `<div style="width:36px;height:36px;display:flex;align-items:center;justify-content:center;filter:drop-shadow(0 0 8px rgba(239,68,68,0.8));animation:navPulse 1s infinite;">
    <svg viewBox="0 0 24 24" width="32" height="32" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" fill="#ef4444"/>
    </svg>
  </div>
  <style>@keyframes navPulse{0%,100%{opacity:1;transform:scale(1);}50%{opacity:0.7;transform:scale(1.2);}}</style>`,
  className: '', iconSize: [36, 36], iconAnchor: [18, 18],
})
