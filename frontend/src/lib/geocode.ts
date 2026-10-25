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

export interface IpLocationResult {
  lat: number
  lng: number
  city: string
  region: string
  ip: string
  formatted: string
}

let cachedIpLocation: IpLocationResult | null = null
let cachedIp: string | null = null

export async function fetchClientIp(): Promise<string> {
  if (cachedIp) return cachedIp
  try {
    const res = await fetch('https://api.ipify.org?format=json')
    if (res.ok) {
      const data = await res.json()
      if (data.ip) {
        cachedIp = data.ip
        return data.ip
      }
    }
  } catch (_) {}
  return '127.0.0.1'
}

export async function fetchIpLocation(): Promise<IpLocationResult | null> {
  if (cachedIpLocation) return cachedIpLocation

  // 1. Try ipapi.co
  try {
    const res = await fetch('https://ipapi.co/json/')
    if (res.ok) {
      const d = await res.json()
      if (d && d.latitude && d.longitude) {
        const city = d.city || 'KOTA'
        const region = d.region || d.country_name || ''
        const formatted = `${city}${region ? ` // ${region}` : ''}`.toUpperCase()
        if (d.ip) cachedIp = d.ip
        cachedIpLocation = {
          lat: Number(d.latitude),
          lng: Number(d.longitude),
          city,
          region,
          ip: d.ip || '',
          formatted
        }
        return cachedIpLocation
      }
    }
  } catch (e) {
    console.warn('[Geocode] ipapi.co failed, trying fallback...', e)
  }

  // 2. Try BigDataCloud reverse geocode client without coords (IP-based lookup)
  try {
    const res = await fetch('https://api.bigdatacloud.net/data/reverse-geocode-client?localityLanguage=id')
    if (res.ok) {
      const d = await res.json()
      if (d && d.latitude && d.longitude) {
        const city = d.city || d.locality || d.principalSubdivision || 'KOTA'
        const region = d.principalSubdivision || d.countryName || ''
        const formatted = `${city}${region && region !== city ? ` // ${region}` : ''}`.toUpperCase()
        cachedIpLocation = {
          lat: Number(d.latitude),
          lng: Number(d.longitude),
          city,
          region,
          ip: cachedIp || '',
          formatted
        }
        return cachedIpLocation
      }
    }
  } catch (e) {
    console.warn('[Geocode] BigDataCloud IP geocode failed...', e)
  }

  return null
}
