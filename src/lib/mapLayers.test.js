import { describe, it, expect } from 'vitest'
import { mapLayerOf, routeColorsFor, DEFAULT_MAP_MODE, MAP_LAYERS } from './mapLayers.js'

describe('mapLayerOf', () => {
  it('returns the requested layer', () => {
    expect(mapLayerOf('light').label).toBe('Light')
    expect(mapLayerOf('satellite').label).toBe('Satellite')
  })
  it('falls back to the default mode for an unknown mode', () => {
    expect(mapLayerOf('not-a-real-mode')).toBe(MAP_LAYERS[DEFAULT_MAP_MODE])
  })
  it('defaults to a light basemap so it matches the light UI theme', () => {
    expect(DEFAULT_MAP_MODE).toBe('light')
  })
})

describe('routeColorsFor', () => {
  it('uses accessible, brand-matched colors on light basemaps', () => {
    expect(routeColorsFor('light')).toEqual({ main: '#0071e3', selected: '#9a6700' })
  })
  it('uses brighter colors tuned for dark basemaps', () => {
    expect(routeColorsFor('dark')).toEqual({ main: '#58a6ff', selected: '#d29922' })
  })
})
