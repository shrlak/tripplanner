import { describe, it, expect } from 'vitest'
import {
  createStop,
  createFamily,
  createTrip,
  getOrigin,
  getDestination,
  getMiddleStops,
  locatedStops,
  manualOrderedMiddles,
  travelModeOf,
  travelVerb,
  FAMILY_COLORS,
} from './tripModel.js'

describe('createStop', () => {
  it('fills in sensible defaults', () => {
    const stop = createStop()
    expect(stop.id).toBeTruthy()
    expect(stop.kind).toBe('poi')
    expect(stop.dwellMin).toBe(60)
    expect(stop.checklist).toEqual([])
  })
  it('lets a partial override defaults', () => {
    const stop = createStop({ name: 'Golden Gate', kind: 'destination', dwellMin: 0 })
    expect(stop.name).toBe('Golden Gate')
    expect(stop.kind).toBe('destination')
    expect(stop.dwellMin).toBe(0)
  })
})

describe('createFamily', () => {
  it('defaults to the first palette color', () => {
    expect(createFamily().color).toBe(FAMILY_COLORS[0])
  })
})

describe('createTrip', () => {
  it('uses a friendly default name, not a shouting placeholder', () => {
    expect(createTrip().name).toBe('New Trip')
  })
  it('starts with one travel group and an optimized route mode', () => {
    const trip = createTrip()
    expect(trip.families).toHaveLength(1)
    expect(trip.routeMode).toBe('optimized')
    expect(trip.travelMode).toBe('driving')
  })
})

describe('stop lookup helpers', () => {
  const trip = createTrip({
    stops: [
      createStop({ id: 'o', kind: 'origin', lat: 1, lon: 1 }),
      createStop({ id: 'p1', kind: 'poi', lat: 2, lon: 2 }),
      createStop({ id: 'p2', kind: 'poi' }), // not located
      createStop({ id: 's1', kind: 'stopover', lat: 3, lon: 3 }),
      createStop({ id: 'd', kind: 'destination', lat: 4, lon: 4 }),
    ],
  })

  it('getOrigin/getDestination find the endpoints', () => {
    expect(getOrigin(trip).id).toBe('o')
    expect(getDestination(trip).id).toBe('d')
  })

  it('getMiddleStops returns POIs and stopovers, not endpoints', () => {
    expect(getMiddleStops(trip).map((s) => s.id).sort()).toEqual(['p1', 'p2', 's1'])
  })

  it('locatedStops filters out stops without coordinates', () => {
    expect(locatedStops(trip.stops).map((s) => s.id)).not.toContain('p2')
  })

  it('returns null when there is no origin or destination', () => {
    const empty = createTrip()
    expect(getOrigin(empty)).toBeNull()
    expect(getDestination(empty)).toBeNull()
  })
})

describe('manualOrderedMiddles', () => {
  it('orders by manualOrder, then appends unlisted stops', () => {
    const trip = createTrip({
      manualOrder: ['b', 'a'],
      stops: [
        createStop({ id: 'a', kind: 'poi' }),
        createStop({ id: 'b', kind: 'poi' }),
        createStop({ id: 'c', kind: 'poi' }), // added after manualOrder was set
      ],
    })
    expect(manualOrderedMiddles(trip).map((s) => s.id)).toEqual(['b', 'a', 'c'])
  })

  it('drops manualOrder ids that no longer exist as stops', () => {
    const trip = createTrip({
      manualOrder: ['gone', 'a'],
      stops: [createStop({ id: 'a', kind: 'poi' })],
    })
    expect(manualOrderedMiddles(trip).map((s) => s.id)).toEqual(['a'])
  })
})

describe('travel mode helpers', () => {
  it('defaults to driving when unset', () => {
    expect(travelModeOf({})).toBe('driving')
    expect(travelModeOf(null)).toBe('driving')
  })
  it('returns the matching verb for each mode', () => {
    expect(travelVerb({ travelMode: 'cycling' })).toBe('BIKE')
    expect(travelVerb({ travelMode: 'walking' })).toBe('WALK')
    expect(travelVerb({ travelMode: 'driving' })).toBe('DRIVE')
  })
})
