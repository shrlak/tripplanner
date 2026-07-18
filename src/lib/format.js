import { format } from 'date-fns'

export function fmtDuration(sec) {
  if (!Number.isFinite(sec)) return '—'
  const totalMin = Math.round(sec / 60)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  if (h === 0) return `${m} min`
  if (m === 0) return `${h} hr`
  return `${h} hr ${m} min`
}

export function fmtDistance(meters, distUnit = 'mi') {
  if (!Number.isFinite(meters)) return '—'
  if (distUnit === 'km') {
    const km = meters / 1000
    return `${km >= 100 ? Math.round(km) : km.toFixed(1)} km`
  }
  const mi = meters / 1609.344
  return `${mi >= 100 ? Math.round(mi) : mi.toFixed(1)} mi`
}

export function fmtDateTime(d) {
  if (!d) return '—'
  return format(new Date(d), 'M/dd hh:mm a')
}

export function fmtTime(d) {
  if (!d) return '—'
  return format(new Date(d), 'hh:mm a')
}

export function fmtDayLabel(d) {
  return format(new Date(d), 'EEE M/dd').toUpperCase()
}

export function fmtDayShort(d) {
  return format(new Date(d), 'EEE').toUpperCase()
}

export function fmtTemp(v, unit = 'F') {
  if (!Number.isFinite(v)) return '—'
  return `${Math.round(v)} ${unit}`
}

export function fmtMoney(v) {
  if (!Number.isFinite(v)) return '—'
  return v.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

export function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v))
}
