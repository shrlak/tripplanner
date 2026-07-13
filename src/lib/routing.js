// Travel times and route geometry from free, keyless OSRM servers. Each
// travel mode maps to a FOSSGIS profile server (routing.openstreetmap.de);
// driving additionally falls back to the OSRM demo server. Responses are
// cached in localStorage keyed by mode + rounded coordinates, and every call
// degrades to a haversine estimate (straight lines at a mode-typical speed)
// if no server is reachable, so the planner never hard-fails.

const SERVERS = {
  driving: ['https://routing.openstreetmap.de/routed-car', 'https://router.project-osrm.org'],
  cycling: ['https://routing.openstreetmap.de/routed-bike'],
  walking: ['https://routing.openstreetmap.de/routed-foot'],
}

// Straight-line fallback speeds (km/h) and detour factor per mode.
const FALLBACK_KMH = { driving: 70, cycling: 16, walking: 4.5 }

const CACHE_PREFIX = 'tcc-osrm-'
const memCache = new Map()

function coordKey(coords) {
  return coords.map((c) => `${c.lon.toFixed(4)},${c.lat.toFixed(4)}`).join(';')
}

function cacheGet(key) {
  if (memCache.has(key)) return memCache.get(key)
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key)
    if (raw) {
      const val = JSON.parse(raw)
      memCache.set(key, val)
      return val
    }
  } catch {
    /* ignore */
  }
  return null
}

function cacheSet(key, val) {
  memCache.set(key, val)
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(val))
  } catch {
    /* storage full — memory cache still works */
  }
}

export function haversineMeters(a, b) {
  const R = 6371000
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLon = toRad(b.lon - a.lon)
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

// Real paths ≈ 1.25 × crow-flies at a mode-typical speed.
function estimateLeg(a, b, mode) {
  const meters = haversineMeters(a, b) * 1.25
  const kmh = FALLBACK_KMH[mode] || FALLBACK_KMH.driving
  return { driveSec: meters / ((kmh * 1000) / 3600), distanceM: meters }
}

async function fetchFromServers(mode, path) {
  const servers = SERVERS[mode] || SERVERS.driving
  let lastErr
  for (const base of servers) {
    try {
      const res = await fetch(`${base}${path}`)
      if (!res.ok) throw new Error(`OSRM ${res.status}`)
      const data = await res.json()
      if (data.code !== 'Ok') throw new Error(`OSRM ${data.code}`)
      return data
    } catch (err) {
      lastErr = err
    }
  }
  throw lastErr
}

// Duration matrix (seconds) between every pair of coords [{lat, lon}, …].
export async function getDurationMatrix(coords, mode = 'driving') {
  const key = `table:${mode}:` + coordKey(coords)
  const hit = cacheGet(key)
  if (hit) return hit

  try {
    const path = coords.map((c) => `${c.lon},${c.lat}`).join(';')
    const data = await fetchFromServers(
      mode,
      `/table/v1/driving/${path}?annotations=duration,distance`,
    )
    const out = { durations: data.durations, distances: data.distances, estimated: false }
    cacheSet(key, out)
    return out
  } catch {
    const n = coords.length
    const durations = Array.from({ length: n }, () => new Array(n).fill(0))
    const distances = Array.from({ length: n }, () => new Array(n).fill(0))
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) continue
        const { driveSec, distanceM } = estimateLeg(coords[i], coords[j], mode)
        durations[i][j] = driveSec
        distances[i][j] = distanceM
      }
    }
    return { durations, distances, estimated: true }
  }
}

// Full route through ordered coords. Returns per-leg duration/distance and
// per-leg geometry as [[lat, lon], …] (built from OSRM step geometries).
export async function getRoute(coords, mode = 'driving') {
  const key = `route:${mode}:` + coordKey(coords)
  const hit = cacheGet(key)
  if (hit) return hit

  try {
    const path = coords.map((c) => `${c.lon},${c.lat}`).join(';')
    const data = await fetchFromServers(
      mode,
      `/route/v1/driving/${path}?overview=false&steps=true&geometries=geojson`,
    )
    if (!data.routes?.[0]) throw new Error('OSRM no route')
    const route = data.routes[0]
    const legs = route.legs.map((leg) => {
      const line = []
      for (const step of leg.steps) {
        for (const [lon, lat] of step.geometry.coordinates) {
          const last = line[line.length - 1]
          if (!last || last[0] !== lat || last[1] !== lon) line.push([lat, lon])
        }
      }
      return { driveSec: leg.duration, distanceM: leg.distance, geometry: line }
    })
    const out = { legs, estimated: false }
    cacheSet(key, out)
    return out
  } catch {
    const legs = []
    for (let i = 0; i < coords.length - 1; i++) {
      const { driveSec, distanceM } = estimateLeg(coords[i], coords[i + 1], mode)
      legs.push({
        driveSec,
        distanceM,
        geometry: [
          [coords[i].lat, coords[i].lon],
          [coords[i + 1].lat, coords[i + 1].lon],
        ],
      })
    }
    return { legs, estimated: true }
  }
}
