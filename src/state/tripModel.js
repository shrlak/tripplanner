// Core trip data structures and pure helpers. All state is plain JSON so it
// round-trips through localStorage and export files.

export const uid = () => Math.random().toString(36).slice(2, 10)

export const STOP_KINDS = ['origin', 'stopover', 'poi', 'destination']

export const FAMILY_COLORS = ['#58a6ff', '#3fb950', '#d29922', '#bc8cff', '#f85149', '#39c5cf']

export const MEAL_TYPES = ['cook-in', 'reservation', 'pack-out', 'walk-in']

// Stored keys stay stable for saved trips; only the displayed labels changed.
export const MEAL_TYPE_LABELS = {
  'cook-in': 'self-catered',
  reservation: 'reservation',
  'pack-out': 'packed',
  'walk-in': 'walk-in',
}

export const TRAVEL_MODES = [
  { id: 'driving', label: 'Drive', verb: 'DRIVE' },
  { id: 'cycling', label: 'Bike', verb: 'BIKE' },
  { id: 'walking', label: 'Walk', verb: 'WALK' },
]

export function travelModeOf(trip) {
  return trip?.travelMode || 'driving'
}

export function travelVerb(trip) {
  return TRAVEL_MODES.find((m) => m.id === travelModeOf(trip))?.verb || 'DRIVE'
}

export const ACTIVITY_WINDOWS = ['early start', 'morning', 'afternoon', 'evening', 'all day', 'flexible']

export const ACTIVITY_STATUS = ['go', 'watch', 'hold']

export function createStop(partial = {}) {
  return {
    id: uid(),
    name: '',
    address: '',
    lat: null,
    lon: null,
    kind: 'poi',
    dwellMin: 60,
    notes: '',
    checklist: [],
    ...partial,
  }
}

export function createFamily(partial = {}) {
  return {
    id: uid(),
    name: '',
    color: FAMILY_COLORS[0],
    size: '2 adults',
    vehicle: 'SUV',
    origin: null, // { name, lat, lon }
    ...partial,
  }
}

export function createTrip(partial = {}) {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 9, 0)
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 10, 18, 0)
  return {
    id: uid(),
    name: 'NEW OPERATION',
    startDateTime: start.toISOString(),
    endDateTime: end.toISOString(),
    routeMode: 'optimized', // 'optimized' | 'manual'
    travelMode: 'driving', // 'driving' | 'cycling' | 'walking'
    manualOrder: [], // middle-stop ids in user order
    stops: [],
    families: [createFamily({ name: 'Group 1' })],
    activities: [],
    meals: [],
    lodging: [],
    expenses: [],
    ...partial,
  }
}

export function getOrigin(trip) {
  return trip.stops.find((s) => s.kind === 'origin') || null
}

export function getDestination(trip) {
  return trip.stops.find((s) => s.kind === 'destination') || null
}

export function getMiddleStops(trip) {
  return trip.stops.filter((s) => s.kind === 'poi' || s.kind === 'stopover')
}

export function locatedStops(stops) {
  return stops.filter((s) => Number.isFinite(s.lat) && Number.isFinite(s.lon))
}

// Middle stops in manual order: ids listed in manualOrder first (if they still
// exist), then any stops added since, in insertion order.
export function manualOrderedMiddles(trip) {
  const middles = getMiddleStops(trip)
  const byId = new Map(middles.map((s) => [s.id, s]))
  const ordered = []
  for (const id of trip.manualOrder || []) {
    if (byId.has(id)) {
      ordered.push(byId.get(id))
      byId.delete(id)
    }
  }
  for (const s of middles) if (byId.has(s.id)) ordered.push(s)
  return ordered
}
