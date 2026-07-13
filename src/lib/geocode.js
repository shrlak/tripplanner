// Location search via Photon (photon.komoot.io) — an OpenStreetMap-backed
// geocoder built for as-you-type autocomplete. Free, keyless, CORS-enabled.
// Callers debounce; we additionally cache by query string.

const cache = new Map()

export async function searchPlaces(query, { limit = 6, signal } = {}) {
  const q = query.trim()
  if (q.length < 2) return []
  const key = `${q}|${limit}`
  if (cache.has(key)) return cache.get(key)

  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=${limit}`
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`Photon ${res.status}`)
  const data = await res.json()
  const results = (data.features || []).map((f) => {
    const p = f.properties || {}
    const [lon, lat] = f.geometry.coordinates
    const detailParts = [
      [p.housenumber, p.street].filter(Boolean).join(' '),
      p.district,
      p.city || p.town || p.village,
      p.state,
      p.country,
    ].filter(Boolean)
    return {
      name: p.name || detailParts[0] || q,
      detail: detailParts.join(', '),
      lat,
      lon,
    }
  })
  cache.set(key, results)
  return results
}

// Name a point dropped on the map. Falls back to raw coordinates so adding a
// stop always works even when the geocoder is unreachable.
export async function reverseGeocode(lat, lon) {
  try {
    const res = await fetch(`https://photon.komoot.io/reverse?lat=${lat}&lon=${lon}`)
    if (!res.ok) throw new Error(`Photon ${res.status}`)
    const data = await res.json()
    const p = data.features?.[0]?.properties
    if (p) {
      const detail = [p.city || p.town || p.village, p.state, p.country].filter(Boolean).join(', ')
      return { name: p.name || p.street || detail || 'Dropped pin', detail }
    }
  } catch {
    /* fall through */
  }
  return { name: 'Dropped pin', detail: `${lat.toFixed(4)}, ${lon.toFixed(4)}` }
}
