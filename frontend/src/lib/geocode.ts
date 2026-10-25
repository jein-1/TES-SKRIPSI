// ═══════════════════════════════════════════════════════════════
// A.T.L.A.S — Reverse Geocoding Utility
// ═══════════════════════════════════════════════════════════════

const cache = new Map<string, string>()

export async function fetchLocationName(lat: number, lng: number): Promise<string> {
  const cacheKey = `${lat.toFixed(3)},${lng.toFixed(3)}`
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey)!
  }

  // 1. Try internal backend API first
  try {
    const res = await fetch(`/api/geocode/reverse?lat=${lat}&lng=${lng}`, {
      headers: { Accept: 'application/json' }
    })
    if (res.ok) {
      const data = await res.json()
      const city = data.city || data.suburb || data.town || data.road || ''
      const state = data.state || ''
      if (city || state) {
        const result = `${city || 'Kawasan'}${state ? ` // ${state}` : ''}`.toUpperCase()
        cache.set(cacheKey, result)
        return result
      }
      if (data.displayName) {
        const parts = data.displayName.split(',').map((s: string) => s.trim())
        const clean = parts.slice(0, 2).join(' // ').toUpperCase()
        cache.set(cacheKey, clean)
        return clean
      }
    }
  } catch (err) {
    console.warn('[Geocode] Local API failed, trying external fallback...', err)
  }

  // 2. Direct client-side fallback (BigDataCloud reverse geocode)
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=id`
    )
    if (res.ok) {
      const data = await res.json()
      const city = data.city || data.locality || data.principalSubdivision || ''
      const province = data.principalSubdivision || data.countryName || ''
      if (city) {
        const result = `${city}${province && province !== city ? ` // ${province}` : ''}`.toUpperCase()
        cache.set(cacheKey, result)
        return result
      }
    }
  } catch (err) {
    console.warn('[Geocode] BigDataCloud fallback failed...', err)
  }

  // 3. Fallback to readable coordinates
  const fallback = `LAT: ${lat.toFixed(4)}, LNG: ${lng.toFixed(4)}`
  return fallback
}
