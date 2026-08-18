{/* Drawing Zone Live Rendering — active only while drawing.
    Fill: SATU ring polygon (depan + belakang dibalik), lalu self-union via
    polygon-clipping untuk otomatis membersihkan self-intersection jadi
    bagian-bagian valid — jauh lebih simpel & lebih tahan banting daripada
    pendekatan "banyak quad kecil" yang rawan menumpuk gelap di tikungan tajam.
    Outline: dua LineString terpisah (depan & belakang). */}
{drawingZoneMode && (() => {
  const safeLen = Math.min(drawingZoneCoords.length, drawingZoneBackCoords.length);
  if (safeLen < 2) return null;
  const front = drawingZoneCoords.slice(0, safeLen);
  const back  = drawingZoneBackCoords.slice(0, safeLen);
  const color = ZRB_REFERENCE[newHazardZone.zrbLevel].color;

  // Bangun SATU ring utuh: titik depan urut, lalu titik belakang dibalik, lalu tutup ring.
  const ring: [number, number][] = [
    ...front.map(c => [c[1], c[0]] as [number, number]),
    ...[...back].reverse().map(c => [c[1], c[0]] as [number, number]),
  ];
  ring.push(ring[0]); // tutup ring (titik terakhir = titik pertama)

  // Self-union: polygon-clipping otomatis memecah ring yang self-intersect
  // jadi beberapa polygon valid terpisah, tanpa numpuk opacity berkali-kali.
  let fillCoords: any[] = [];
  try {
    fillCoords = polygonClipping.union([ring] as any);
  } catch (unionError) {
    console.error('[ZonePreview] polygon-clipping union gagal:', unionError, 'ring:', ring);
    fillCoords = [[ring]]; // fallback: tetap 1 polygon utuh, bukan quad-quad kecil
  }

  return (
    <>
      {fillCoords.length > 0 && (
        <MapGeoJSON
          key="zone-preview-fill"
          id="zone-preview-fill"
          data={{ type: 'Feature', properties: {}, geometry: { type: 'MultiPolygon', coordinates: fillCoords } } as any}
          fillPaint={{ 'fill-color': color, 'fill-opacity': 0.3 }}
        />
      )}
      <MapGeoJSON
        key="zone-preview-front-line"
        id="zone-preview-front-line"
        data={{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: front.map(c => [c[1], c[0]]) } } as any}
        linePaint={{ 'line-color': zoneLineSelfCrossing ? '#f97316' : color, 'line-width': zoneLineSelfCrossing ? 3 : 2.5, 'line-opacity': 0.95 }}
      />
      <MapGeoJSON
        key="zone-preview-back-line"
        id="zone-preview-back-line"
        data={{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: back.map(c => [c[1], c[0]]) } } as any}
        linePaint={{ 'line-color': color, 'line-width': 1.5, 'line-dasharray': [5, 4], 'line-opacity': 0.8 }}
      />
    </>
  );
})()}
