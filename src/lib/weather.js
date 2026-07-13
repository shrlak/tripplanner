// Weather intel from Open-Meteo (api.open-meteo.com) — free, keyless daily
// forecasts up to 16 days out. One batched request covers every stop for the
// whole trip window; results are cached for 30 minutes.
import { addDays, format, startOfDay } from 'date-fns'

const memCache = new Map()
const TTL_MS = 30 * 60 * 1000
export const FORECAST_DAYS = 16

export const WMO = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Rime fog',
  51: 'Light drizzle',
  53: 'Drizzle',
  55: 'Dense drizzle',
  56: 'Freezing drizzle',
  57: 'Freezing drizzle',
  61: 'Light rain',
  63: 'Rain',
  65: 'Heavy rain',
  66: 'Freezing rain',
  67: 'Freezing rain',
  71: 'Light snow',
  73: 'Snow',
  75: 'Heavy snow',
  77: 'Snow grains',
  80: 'Light showers',
  81: 'Showers',
  82: 'Violent showers',
  85: 'Snow showers',
  86: 'Snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm + hail',
  99: 'Thunderstorm + hail',
}

export function describeWmo(code) {
  return WMO[code] || 'Unknown'
}

// Groups WMO codes for icon selection.
export function wmoIconGroup(code) {
  if (code === 0) return 'sun'
  if (code === 1 || code === 2) return 'cloud-sun'
  if (code === 3) return 'cloud'
  if (code === 45 || code === 48) return 'fog'
  if (code >= 51 && code <= 57) return 'drizzle'
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return 'rain'
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow'
  if (code >= 95) return 'storm'
  return 'cloud'
}

function clampRange(startISO, endISO) {
  const today = startOfDay(new Date())
  const horizon = addDays(today, FORECAST_DAYS - 1)
  let start = startOfDay(new Date(startISO))
  let end = startOfDay(new Date(endISO))
  if (start < today) start = today
  if (end > horizon) end = horizon
  if (end < start) return null
  return { start, end }
}

// Fetch daily forecasts for many points in one call.
// Returns Map<pointKey, { [dateStr]: { code, tMax, tMin, precipProb } }>.
export async function fetchTripWeather(points, startISO, endISO, tempUnit = 'F') {
  const range = clampRange(startISO, endISO)
  if (!range || points.length === 0) return new Map()

  const startStr = format(range.start, 'yyyy-MM-dd')
  const endStr = format(range.end, 'yyyy-MM-dd')
  const key = points.map((p) => `${p.lat.toFixed(3)},${p.lon.toFixed(3)}`).join(';') + `|${startStr}|${endStr}|${tempUnit}`
  const hit = memCache.get(key)
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value

  const lats = points.map((p) => p.lat.toFixed(4)).join(',')
  const lons = points.map((p) => p.lon.toFixed(4)).join(',')
  const unitParam = tempUnit === 'F' ? '&temperature_unit=fahrenheit' : ''
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max` +
    `&timezone=auto&start_date=${startStr}&end_date=${endStr}${unitParam}`

  const res = await fetch(url)
  if (!res.ok) throw new Error(`Open-Meteo ${res.status}`)
  const data = await res.json()
  const list = Array.isArray(data) ? data : [data]

  const out = new Map()
  list.forEach((loc, i) => {
    const point = points[i]
    if (!point || !loc?.daily) return
    const byDate = {}
    loc.daily.time.forEach((dateStr, di) => {
      byDate[dateStr] = {
        code: loc.daily.weather_code[di],
        tMax: loc.daily.temperature_2m_max[di],
        tMin: loc.daily.temperature_2m_min[di],
        precipProb: loc.daily.precipitation_probability_max?.[di] ?? null,
      }
    })
    out.set(pointKeyOf(point), byDate)
  })

  memCache.set(key, { at: Date.now(), value: out })
  return out
}

export function pointKeyOf(point) {
  return `${point.lat.toFixed(3)},${point.lon.toFixed(3)}`
}
