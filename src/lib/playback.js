// Position interpolation for route playback: where is the convoy at simTime?
import { haversineMeters } from './routing.js'

export function pointAlongGeometry(geometry, fraction) {
  if (!geometry || geometry.length === 0) return null
  if (geometry.length === 1 || fraction <= 0) return geometry[0]
  if (fraction >= 1) return geometry[geometry.length - 1]

  const segLens = []
  let total = 0
  for (let i = 0; i < geometry.length - 1; i++) {
    const len = haversineMeters(
      { lat: geometry[i][0], lon: geometry[i][1] },
      { lat: geometry[i + 1][0], lon: geometry[i + 1][1] },
    )
    segLens.push(len)
    total += len
  }
  if (total === 0) return geometry[0]

  let target = fraction * total
  for (let i = 0; i < segLens.length; i++) {
    if (target <= segLens[i]) {
      const f = segLens[i] === 0 ? 0 : target / segLens[i]
      const [aLat, aLon] = geometry[i]
      const [bLat, bLon] = geometry[i + 1]
      return [aLat + (bLat - aLat) * f, aLon + (bLon - aLon) * f]
    }
    target -= segLens[i]
  }
  return geometry[geometry.length - 1]
}

// legs: [{ departure, arrival, geometry }] in visit order.
// Returns { pos: [lat, lon], moving: bool } or null when before/after the plan.
export function convoyPositionAt(legs, simTimeMs) {
  if (!legs?.length || !Number.isFinite(simTimeMs)) return null
  const firstDepart = new Date(legs[0].departure).getTime()
  const lastArrive = new Date(legs[legs.length - 1].arrival).getTime()
  if (simTimeMs <= firstDepart) return { pos: legs[0].geometry[0], moving: false }
  if (simTimeMs >= lastArrive) {
    const g = legs[legs.length - 1].geometry
    return { pos: g[g.length - 1], moving: false }
  }
  for (const leg of legs) {
    const dep = new Date(leg.departure).getTime()
    const arr = new Date(leg.arrival).getTime()
    if (simTimeMs < dep) {
      // dwelling at the start of this leg
      return { pos: leg.geometry[0], moving: false }
    }
    if (simTimeMs <= arr) {
      const fraction = arr === dep ? 1 : (simTimeMs - dep) / (arr - dep)
      return { pos: pointAlongGeometry(leg.geometry, fraction), moving: true }
    }
  }
  return null
}
