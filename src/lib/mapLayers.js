// Keyless base layers for the command map. All free tile services with
// attribution-only terms — no accounts, no tokens.

const OSM_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

export const MAP_LAYERS = {
  dark: {
    label: 'Dark ops',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    subdomains: 'abcd',
    attribution: `${OSM_ATTR} &copy; <a href="https://carto.com/attributions">CARTO</a>`,
    light: false,
  },
  light: {
    label: 'Light',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    subdomains: 'abcd',
    attribution: `${OSM_ATTR} &copy; <a href="https://carto.com/attributions">CARTO</a>`,
    light: true,
  },
  streets: {
    label: 'Streets',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    subdomains: 'abc',
    attribution: OSM_ATTR,
    light: true,
  },
  satellite: {
    label: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    subdomains: 'abc',
    attribution: 'Imagery &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics',
    light: false,
  },
  terrain: {
    label: 'Terrain',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    subdomains: 'abc',
    attribution: `${OSM_ATTR}, SRTM | &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)`,
    light: true,
  },
}

export const DEFAULT_MAP_MODE = 'dark'

export function mapLayerOf(mode) {
  return MAP_LAYERS[mode] || MAP_LAYERS[DEFAULT_MAP_MODE]
}

// Route colors that stay readable on both dark and light basemaps.
export function routeColorsFor(mode) {
  const light = mapLayerOf(mode).light
  return {
    main: light ? '#1f6feb' : '#58a6ff',
    selected: light ? '#b8860b' : '#d29922',
  }
}
