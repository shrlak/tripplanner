import { describe, it, expect } from 'vitest'
import { describeWmo, wmoIconGroup, pointKeyOf } from './weather.js'

describe('describeWmo', () => {
  it('describes known WMO codes', () => {
    expect(describeWmo(0)).toBe('Clear sky')
    expect(describeWmo(95)).toBe('Thunderstorm')
  })
  it('falls back for unknown codes', () => {
    expect(describeWmo(12345)).toBe('Unknown')
  })
})

describe('wmoIconGroup', () => {
  it.each([
    [0, 'sun'],
    [1, 'cloud-sun'],
    [2, 'cloud-sun'],
    [3, 'cloud'],
    [45, 'fog'],
    [48, 'fog'],
    [51, 'drizzle'],
    [57, 'drizzle'],
    [61, 'rain'],
    [82, 'rain'],
    [71, 'snow'],
    [86, 'snow'],
    [95, 'storm'],
    [99, 'storm'],
  ])('groups WMO code %i as %s', (code, group) => {
    expect(wmoIconGroup(code)).toBe(group)
  })

  it('defaults unknown codes to cloud', () => {
    expect(wmoIconGroup(-1)).toBe('cloud')
  })
})

describe('pointKeyOf', () => {
  it('rounds coordinates to 3 decimals for a stable cache key', () => {
    expect(pointKeyOf({ lat: 37.5, lon: -122.25 })).toBe('37.500,-122.250')
  })
  it('produces the same key for the same rounded point', () => {
    const a = pointKeyOf({ lat: 40.7128, lon: -74.006 })
    const b = pointKeyOf({ lat: 40.7128, lon: -74.006 })
    expect(a).toBe(b)
  })
})
