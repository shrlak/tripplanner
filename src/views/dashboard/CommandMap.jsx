import React, { useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, Polyline, Marker, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { Layers, ChevronDown, MousePointer2 } from 'lucide-react'
import { useTrip } from '../../state/TripContext.jsx'
import { locatedStops, getDestination, createStop } from '../../state/tripModel.js'
import { MAP_LAYERS, mapLayerOf, routeColorsFor, DEFAULT_MAP_MODE } from '../../lib/mapLayers.js'
import { reverseGeocode } from '../../lib/geocode.js'
import { convoyPositionAt } from '../../lib/playback.js'
import { describeWmo } from '../../lib/weather.js'
import WeatherIcon from '../../components/WeatherIcon.jsx'
import { fmtTemp } from '../../lib/format.js'

function stopIcon(number, kind, selected) {
  return L.divIcon({
    className: '',
    html: `<div class="stop-marker ${kind}${selected ? ' selected' : ''}">${number}</div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  })
}

function convoyIcon(color) {
  return L.divIcon({
    className: '',
    html: `<div class="convoy-marker" style="background:${color}; box-shadow: 0 0 10px 2px ${color}88"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  })
}

function FitToStops({ stops }) {
  const map = useMap()
  const key = stops.map((s) => `${s.lat},${s.lon}`).join('|')
  useEffect(() => {
    if (stops.length === 0) return
    if (stops.length === 1) {
      map.setView([stops[0].lat, stops[0].lon], 9)
      return
    }
    const bounds = L.latLngBounds(stops.map((s) => [s.lat, s.lon]))
    map.fitBounds(bounds, { padding: [60, 60] })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, map])
  return null
}

// Right-click (long-press on touch devices) anywhere on the map to add a stop.
function AddStopOnRightClick({ onAdd }) {
  useMapEvents({
    contextmenu(e) {
      onAdd(e.latlng)
    },
  })
  return null
}

function LayerControl({ mode, setMode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="layer-control">
      <button className="btn sm" onClick={() => setOpen((o) => !o)}>
        <Layers size={12} /> Map: {mapLayerOf(mode).label} <ChevronDown size={11} />
      </button>
      {open && (
        <div className="layer-menu">
          {Object.entries(MAP_LAYERS).map(([id, layer]) => (
            <button
              key={id}
              className={id === mode ? 'active' : ''}
              onClick={() => {
                setMode(id)
                setOpen(false)
              }}
            >
              {layer.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function WeatherIntelOverlay() {
  const { trip, plan, weatherFor, prefs } = useTrip()
  const rows = useMemo(() => {
    const picks = []
    const base = trip.stops.find((s) => s.kind === 'stopover') || null
    const dest = getDestination(trip)
    for (const stop of [base, dest]) {
      if (!stop || !Number.isFinite(stop.lat)) continue
      const entry = plan?.entries.find((e) => e.stopId === stop.id)
      const w = weatherFor(stop, entry?.arrival || trip.startDateTime)
      if (w) picks.push({ stop, w })
    }
    return picks
  }, [trip, plan, weatherFor])

  if (rows.length === 0) return null
  return (
    <div className="map-panel fade-in">
      <div className="section-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
        Weather
        <span style={{ color: 'var(--faint)' }}>OPEN-METEO</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {rows.map(({ stop, w }) => (
          <div key={stop.id} className="weather-row" style={{ background: 'transparent', border: 0, padding: '2px 0' }}>
            <span className="w-icon">
              <WeatherIcon code={w.code} size={18} />
            </span>
            <div className="w-main">
              <div className="w-name">{stop.name}</div>
              <div className="w-desc">{describeWmo(w.code)}</div>
            </div>
            <div className="w-temp">
              {fmtTemp(w.tMax, prefs.tempUnit)}
              <small> / {fmtTemp(w.tMin, prefs.tempUnit)}</small>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function CommandMap() {
  const { trip, updateTrip, plan, familyRoutes, selection, setSelection, sim, prefs, setPrefs } = useTrip()
  const stops = locatedStops(trip.stops)
  const mapMode = prefs.mapMode || DEFAULT_MAP_MODE
  const layer = mapLayerOf(mapMode)
  const colors = routeColorsFor(mapMode)

  const orderNumber = useMemo(() => {
    const m = new Map()
    plan?.orderedStops.forEach((s, i) => m.set(s.id, i + 1))
    return m
  }, [plan])

  const addStopAt = async ({ lat, lng }) => {
    const stop = createStop({
      name: 'Dropped pin',
      address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      lat,
      lon: lng,
      kind: 'poi',
      dwellMin: 60,
    })
    updateTrip((t) => ({ ...t, stops: [...t.stops, stop], manualOrder: [...(t.manualOrder || []), stop.id] }))
    setSelection({ type: 'stop', id: stop.id })
    const place = await reverseGeocode(lat, lng)
    updateTrip((t) => ({
      ...t,
      stops: t.stops.map((s) =>
        s.id === stop.id ? { ...s, name: place.name, address: place.detail || s.address } : s,
      ),
    }))
  }

  const simNow = sim.simTime
  const mainConvoy = useMemo(
    () => (plan && simNow ? convoyPositionAt(plan.legs, simNow) : null),
    [plan, simNow],
  )
  const familyPositions = useMemo(() => {
    if (!simNow) return []
    return familyRoutes
      .map((fr) => {
        const p = convoyPositionAt(
          [{ departure: fr.departure, arrival: fr.arrival, geometry: fr.geometry }],
          simNow,
        )
        return p ? { ...fr, pos: p.pos } : null
      })
      .filter(Boolean)
  }, [familyRoutes, simNow])

  return (
    <div className="map-cell">
      <MapContainer
        center={[37.8, -120.5]}
        zoom={7}
        zoomControl={true}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          key={mapMode}
          url={layer.url}
          attribution={layer.attribution}
          subdomains={layer.subdomains}
          maxZoom={19}
        />
        <FitToStops stops={stops} />
        <AddStopOnRightClick onAdd={addStopAt} />

        {familyRoutes.map((fr) => (
          <Polyline
            key={fr.familyId}
            positions={fr.geometry}
            pathOptions={{ color: fr.color, weight: 2, opacity: 0.55, dashArray: '6 6' }}
          />
        ))}

        {plan?.legs.map((leg, i) => (
          <Polyline
            key={i}
            positions={leg.geometry}
            eventHandlers={{ click: () => setSelection({ type: 'leg', id: i }) }}
            pathOptions={{
              color: selection?.type === 'leg' && selection.id === i ? colors.selected : colors.main,
              weight: selection?.type === 'leg' && selection.id === i ? 4 : 3,
              opacity: 0.85,
            }}
          />
        ))}

        {stops.map((s) => (
          <Marker
            key={s.id}
            position={[s.lat, s.lon]}
            icon={stopIcon(
              orderNumber.get(s.id) ?? '·',
              s.kind === 'origin' ? 'origin' : s.kind === 'destination' ? 'destination' : '',
              selection?.type === 'stop' && selection.id === s.id,
            )}
            eventHandlers={{ click: () => setSelection({ type: 'stop', id: s.id }) }}
          />
        ))}

        {mainConvoy && <Marker position={mainConvoy.pos} icon={convoyIcon(colors.main)} zIndexOffset={900} />}
        {familyPositions.map((fp) => (
          <Marker key={fp.familyId} position={fp.pos} icon={convoyIcon(fp.color)} zIndexOffset={800} />
        ))}
      </MapContainer>

      <div className="map-overlay-tl" style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <LayerControl mode={mapMode} setMode={(m) => setPrefs({ mapMode: m })} />
        {plan?.estimated && (
          <span className="chip amber" title="Routing service unreachable — times are straight-line estimates">
            Offline estimate
          </span>
        )}
      </div>
      <div className="map-overlay-tr">
        <WeatherIntelOverlay />
      </div>
      <div style={{ position: 'absolute', bottom: 24, left: 12, zIndex: 1000 }}>
        <span className="chip" title="Adds a place to visit at that point">
          <MousePointer2 size={10} /> Right-click map to add a stop
        </span>
      </div>
    </div>
  )
}
