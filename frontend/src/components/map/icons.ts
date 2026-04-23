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
  html: `<div style="position:relative;width:22px;height:22px;">
    <div style="position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(59,130,246,0.3);border-radius:50%;animation:haloPulse 2s infinite;"></div>
    <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:16px;height:16px;background:#3b82f6;border:2.5px solid white;border-radius:50%;box-shadow:0 0 4px rgba(0,0,0,0.3);"></div>
  </div>
  <style>@keyframes haloPulse{0%{transform:scale(1);opacity:0.8;}100%{transform:scale(2.5);opacity:0;}}</style>`,
  className: '', iconSize: [22, 22], iconAnchor: [11, 11],
})

// ── User Position (Tsunami Alert) ────────────────────────────────
export const userIconAlert = new L.DivIcon({
  html: `<div style="position:relative;width:24px;height:24px;">
    <div style="position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(239,68,68,0.4);border-radius:50%;animation:haloPulseFast 1s infinite;"></div>
    <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:18px;height:18px;background:#ef4444;border:3px solid white;border-radius:50%;box-shadow:0 0 6px rgba(239,68,68,0.6);"></div>
  </div>
  <style>@keyframes haloPulseFast{0%{transform:scale(1);opacity:1;}100%{transform:scale(3);opacity:0;}}</style>`,
  className: '', iconSize: [24, 24], iconAnchor: [12, 12],
})
