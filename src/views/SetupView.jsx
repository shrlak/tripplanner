import React from 'react'
import { Reorder } from 'framer-motion'
import { GripVertical, Trash2, ArrowDown, Download, Upload, RefreshCw, Plus, Car, Bike, Footprints } from 'lucide-react'
import { useTrip } from '../state/TripContext.jsx'
import LocationSearch from '../components/LocationSearch.jsx'
import { createStop, getOrigin, getDestination, manualOrderedMiddles, TRAVEL_MODES, travelModeOf } from '../state/tripModel.js'
import { fmtDuration, fmtDistance, fmtDateTime } from '../lib/format.js'

function toLocalInput(iso) {
  const d = new Date(iso)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function EndpointField({ label, stop, onPick, onClear, placeholder }) {
  return (
    <div>
      <label className="field-label">{label}</label>
      {stop ? (
        <div className="stop-row">
          <div className="stop-name">
            <div className="n">{stop.name}</div>
            <div className="a">{stop.address}</div>
          </div>
          <button className="icon-btn danger" title="Remove" onClick={onClear}>
            <Trash2 size={13} />
          </button>
        </div>
      ) : (
        <LocationSearch placeholder={placeholder} onSelect={onPick} />
      )}
    </div>
  )
}

export default function SetupView({ setView }) {
  const { trip, updateTrip, plan, routeStatus, prefs, setPrefs, resetToDemo, createNewTrip, deleteTrip, importTrip } = useTrip()
  const origin = getOrigin(trip)
  const destination = getDestination(trip)
  const middles = manualOrderedMiddles(trip)

  const addEndpoint = (kind) => (place) =>
    updateTrip((t) => ({
      ...t,
      stops: [
        ...t.stops.filter((s) => s.kind !== kind),
        createStop({
          name: place.name,
          address: place.detail,
          lat: place.lat,
          lon: place.lon,
          kind,
          dwellMin: 0,
        }),
      ],
    }))

  const removeStop = (id) =>
    updateTrip((t) => ({
      ...t,
      stops: t.stops.filter((s) => s.id !== id),
      manualOrder: (t.manualOrder || []).filter((x) => x !== id),
    }))

  const addMiddle = (kind) => (place) =>
    updateTrip((t) => {
      const stop = createStop({
        name: place.name,
        address: place.detail,
        lat: place.lat,
        lon: place.lon,
        kind,
        dwellMin: kind === 'stopover' ? 12 * 60 : 60,
      })
      return { ...t, stops: [...t.stops, stop], manualOrder: [...(t.manualOrder || []), stop.id] }
    })

  const patchStop = (id, patch) =>
    updateTrip((t) => ({ ...t, stops: t.stops.map((s) => (s.id === id ? { ...s, ...patch } : s)) }))

  const setDate = (field) => (e) => {
    const v = e.target.value
    if (!v) return
    updateTrip({ [field]: new Date(v).toISOString() })
  }

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(trip, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${trip.name.toLowerCase().replace(/\s+/g, '-')}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const importJson = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json'
    input.onchange = async () => {
      try {
        importTrip(JSON.parse(await input.files[0].text()))
      } catch (err) {
        alert(`Import failed: ${err.message}`)
      }
    }
    input.click()
  }

  const middleList = middles.map((s) => s.id)

  return (
    <div className="setup-grid">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="panel">
          <div className="section-label">1 · Trip basics</div>
          <label className="field-label">Trip name</label>
          <input
            className="input"
            value={trip.name}
            onChange={(e) => updateTrip({ name: e.target.value.toUpperCase() })}
          />
          <div className="form-row" style={{ marginTop: 10 }}>
            <div>
              <label className="field-label">Start (departure)</label>
              <input type="datetime-local" className="input" value={toLocalInput(trip.startDateTime)} onChange={setDate('startDateTime')} />
            </div>
            <div>
              <label className="field-label">End (return by)</label>
              <input type="datetime-local" className="input" value={toLocalInput(trip.endDateTime)} onChange={setDate('endDateTime')} />
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="section-label">2 · Start &amp; end</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <EndpointField
              label="Origin (start location)"
              stop={origin}
              onPick={addEndpoint('origin')}
              onClear={() => removeStop(origin.id)}
              placeholder="Search start location…"
            />
            <EndpointField
              label="Final destination"
              stop={destination}
              onPick={addEndpoint('destination')}
              onClear={() => removeStop(destination.id)}
              placeholder="Search destination…"
            />
          </div>
        </div>

        <div className="panel">
          <div className="section-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
            3 · Stops &amp; places to visit
            <span style={{ color: 'var(--faint)' }}>{middles.length} listed</span>
          </div>

          <div className="mode-toggle" style={{ marginBottom: 10 }}>
            <button
              className={trip.routeMode === 'optimized' ? 'active' : ''}
              onClick={() => updateTrip({ routeMode: 'optimized' })}
            >
              Auto-optimize path
            </button>
            <button
              className={trip.routeMode === 'manual' ? 'active' : ''}
              onClick={() =>
                updateTrip((t) => ({
                  ...t,
                  routeMode: 'manual',
                  // freeze the current optimized order as the manual baseline
                  manualOrder: plan
                    ? plan.orderedStops.filter((s) => s.kind === 'poi' || s.kind === 'stopover').map((s) => s.id)
                    : t.manualOrder,
                }))
              }
            >
              Manual order
            </button>
          </div>

          {trip.routeMode === 'manual' ? (
            <Reorder.Group
              axis="y"
              values={middleList}
              onReorder={(ids) => updateTrip({ manualOrder: ids })}
              style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}
            >
              {middles.map((s) => (
                <Reorder.Item key={s.id} value={s.id} style={{ listStyle: 'none' }}>
                  <StopEditRow stop={s} patchStop={patchStop} removeStop={removeStop} draggable />
                </Reorder.Item>
              ))}
            </Reorder.Group>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {middles.map((s) => (
                <StopEditRow key={s.id} stop={s} patchStop={patchStop} removeStop={removeStop} />
              ))}
            </div>
          )}
          {middles.length === 0 && <div className="empty-note">No stops yet — add places to visit below.</div>}

          <div style={{ marginTop: 12 }}>
            <label className="field-label">Add a place to visit (POI)</label>
            <LocationSearch placeholder="Search a place to visit…" onSelect={addMiddle('poi')} />
          </div>
          <div style={{ marginTop: 8 }}>
            <label className="field-label">Add an overnight stopover</label>
            <LocationSearch placeholder="Search a stopover (overnight base)…" onSelect={addMiddle('stopover')} />
          </div>
        </div>

        <div className="panel">
          <div className="section-label">4 · Travel mode &amp; preferences</div>
          <label className="field-label">How are you traveling?</label>
          <div className="mode-toggle" style={{ marginBottom: 10 }}>
            {TRAVEL_MODES.map((m) => {
              const Icon = m.id === 'driving' ? Car : m.id === 'cycling' ? Bike : Footprints
              return (
                <button
                  key={m.id}
                  className={travelModeOf(trip) === m.id ? 'active' : ''}
                  onClick={() => updateTrip({ travelMode: m.id })}
                >
                  <Icon size={12} style={{ verticalAlign: '-2px', marginRight: 4 }} />
                  {m.label}
                </button>
              )
            })}
          </div>
          <div className="form-row">
            <div>
              <label className="field-label">Temperature</label>
              <select className="input" value={prefs.tempUnit} onChange={(e) => setPrefs({ tempUnit: e.target.value })}>
                <option value="F">Fahrenheit</option>
                <option value="C">Celsius</option>
              </select>
            </div>
            <div>
              <label className="field-label">Distance</label>
              <select className="input" value={prefs.distUnit} onChange={(e) => setPrefs({ distUnit: e.target.value })}>
                <option value="mi">Miles</option>
                <option value="km">Kilometers</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            <button className="btn sm" onClick={createNewTrip}><Plus size={11} /> New trip</button>
            <button className="btn sm" onClick={exportJson}><Download size={11} /> Export</button>
            <button className="btn sm" onClick={importJson}><Upload size={11} /> Import</button>
            <button className="btn sm ghost" onClick={resetToDemo}><RefreshCw size={11} /> Load demo trip</button>
            <button
              className="btn sm danger"
              onClick={() => {
                if (window.confirm(`Delete "${trip.name}"? This cannot be undone.`)) deleteTrip(trip.id)
              }}
            >
              <Trash2 size={11} /> Delete this trip
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="panel">
          <div className="section-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
            Planned path
            {routeStatus === 'loading' && <span style={{ color: 'var(--amber)' }}>COMPUTING…</span>}
            {plan?.estimated && <span style={{ color: 'var(--amber)' }}>OFFLINE ESTIMATE</span>}
          </div>
          {!plan && routeStatus !== 'loading' && (
            <div className="empty-note">Set an origin and destination to compute the best path.</div>
          )}
          {plan && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {plan.orderedStops.map((s, i) => {
                const entry = plan.entries[i]
                const legOut = plan.legs[i]
                return (
                  <React.Fragment key={s.id}>
                    <div className="stop-row" style={{ borderColor: i === 0 ? 'rgba(63,185,80,.4)' : i === plan.orderedStops.length - 1 ? 'rgba(210,153,34,.4)' : undefined }}>
                      <span className="mono" style={{ fontSize: 10, color: 'var(--muted)', width: 16, textAlign: 'right' }}>{i + 1}</span>
                      <div className="stop-name">
                        <div className="n">{s.name}</div>
                        <div className="a">
                          {i === 0 ? `Depart ${fmtDateTime(entry.departure)}` : `Arrive ${fmtDateTime(entry.arrival)}`}
                          {entry.overnightBefore ? ' · overnight hold' : ''}
                        </div>
                      </div>
                      <span className={`chip ${s.kind === 'origin' ? 'green' : s.kind === 'destination' ? 'amber' : s.kind === 'stopover' ? '' : 'blue'}`}>
                        {s.kind}
                      </span>
                    </div>
                    {legOut && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0 3px 24px', color: 'var(--muted)' }}>
                        <ArrowDown size={11} style={{ color: 'var(--blue)' }} />
                        <span className="mono" style={{ fontSize: 10 }}>
                          {fmtDuration(legOut.driveSec)} · {fmtDistance(legOut.distanceM, prefs.distUnit)}
                        </span>
                      </div>
                    )}
                  </React.Fragment>
                )
              })}
              <hr className="hairline" />
              <div className="kv-row">
                <span className="k">Total drive</span>
                <span className="v" style={{ color: 'var(--blue)' }}>{fmtDuration(plan.totalDriveSec)}</span>
              </div>
              <div className="kv-row">
                <span className="k">Total distance</span>
                <span className="v">{fmtDistance(plan.totalDistanceM, prefs.distUnit)}</span>
              </div>
              <div className="kv-row">
                <span className="k">Final arrival</span>
                <span className="v">{fmtDateTime(plan.entries[plan.entries.length - 1].arrival)}</span>
              </div>
              <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
                {plan.overrun ? (
                  <span className="chip red">Overrun — exceeds end date</span>
                ) : (
                  <span className="chip green">Fits the trip window</span>
                )}
                <span className="chip">{trip.routeMode === 'optimized' ? 'Auto-optimized' : 'Manual order'}</span>
              </div>
              <button className="btn primary" style={{ marginTop: 10 }} onClick={() => setView('dashboard')}>
                View on command map
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StopEditRow({ stop, patchStop, removeStop, draggable }) {
  return (
    <div className="stop-row">
      {draggable && (
        <span className="drag-handle">
          <GripVertical size={13} />
        </span>
      )}
      <div className="stop-name">
        <div className="n">{stop.name}</div>
        <div className="a">{stop.address}</div>
      </div>
      <span className={`chip ${stop.kind === 'stopover' ? '' : 'blue'}`}>{stop.kind}</span>
      <input
        type="number"
        className="input dwell-input"
        title="Minutes on site"
        min={0}
        step={15}
        value={stop.dwellMin}
        onChange={(e) => patchStop(stop.id, { dwellMin: Math.max(0, Number(e.target.value) || 0) })}
      />
      <button className="icon-btn danger" title="Remove stop" onClick={() => removeStop(stop.id)}>
        <Trash2 size={13} />
      </button>
    </div>
  )
}
