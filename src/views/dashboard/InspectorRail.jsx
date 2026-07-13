import React, { useMemo, useState } from 'react'
import { MapPin, Plus } from 'lucide-react'
import { useTrip } from '../../state/TripContext.jsx'
import WeatherIcon from '../../components/WeatherIcon.jsx'
import { describeWmo, FORECAST_DAYS } from '../../lib/weather.js'
import { fmtDateTime, fmtDuration, fmtDistance, fmtTemp, fmtDayShort } from '../../lib/format.js'
import { uid } from '../../state/tripModel.js'

function KV({ k, v, accent }) {
  return (
    <div className="kv-row">
      <span className="k">{k}</span>
      <span className="v" style={accent ? { color: accent } : undefined}>{v}</span>
    </div>
  )
}

function WeatherPanel({ stop, dateISO }) {
  const { weatherFor, prefs } = useTrip()
  const w = weatherFor(stop, dateISO)
  return (
    <div className="panel">
      <div className="section-label">Weather intel</div>
      {w ? (
        <div className="weather-row" style={{ border: 0, padding: 0, background: 'transparent' }}>
          <span className="w-icon">
            <WeatherIcon code={w.code} size={22} />
          </span>
          <div className="w-main">
            <div className="w-name">{describeWmo(w.code)}</div>
            <div className="w-desc">
              {w.precipProb != null ? `${w.precipProb}% precip` : 'On arrival day'}
            </div>
          </div>
          <div className="w-temp">
            {fmtTemp(w.tMax, prefs.tempUnit)}
            <small> / {fmtTemp(w.tMin, prefs.tempUnit)}</small>
          </div>
        </div>
      ) : (
        <div style={{ fontSize: 11, color: 'var(--faint)' }}>
          Forecast out of range — Open-Meteo covers {FORECAST_DAYS} days out.
        </div>
      )}
    </div>
  )
}

function StopInspector({ stopId }) {
  const { trip, plan, updateTrip, prefs } = useTrip()
  const [newTask, setNewTask] = useState('')
  const stop = trip.stops.find((s) => s.id === stopId)
  const entry = plan?.entries.find((e) => e.stopId === stopId)
  const legIn = plan?.legs.find((l) => l.toId === stopId)
  const stopById = useMemo(() => new Map(trip.stops.map((s) => [s.id, s])), [trip.stops])
  if (!stop) return <SnapshotInspector />

  const patchStop = (patch) =>
    updateTrip((t) => ({
      ...t,
      stops: t.stops.map((s) => (s.id === stopId ? { ...s, ...patch } : s)),
    }))

  const done = stop.checklist.filter((c) => c.done).length

  return (
    <>
      <div className="panel">
        <div className="section-label">Location</div>
        <div style={{ fontSize: 15, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.02em' }}>
          {stop.name}
        </div>
        <div style={{ fontSize: 11, color: 'var(--muted)', margin: '2px 0 8px' }}>
          <MapPin size={10} style={{ marginRight: 4 }} />
          {stop.address || 'No address'}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <span className={`chip ${stop.kind === 'destination' ? 'amber' : stop.kind === 'origin' ? 'green' : 'blue'}`}>
            {stop.kind}
          </span>
          {entry && <span className="chip">DAY {fmtDayShort(entry.arrival)}</span>}
          <span className="chip">CHECKLIST {done}/{stop.checklist.length}</span>
        </div>
      </div>

      {(legIn || entry) && (
        <div className="panel">
          <div className="section-label">Movement</div>
          {legIn && (
            <>
              <KV k="Route" v={`${stopById.get(legIn.fromId)?.name || '?'} →`} />
              <KV k="Drive time" v={fmtDuration(legIn.driveSec)} accent="var(--blue)" />
              <KV k="Distance" v={fmtDistance(legIn.distanceM, prefs.distUnit)} />
            </>
          )}
          {entry && (
            <>
              <KV k="Arrival ETA" v={fmtDateTime(entry.arrival)} />
              <KV k="Departure" v={fmtDateTime(entry.departure)} />
              {entry.overnightBefore && <KV k="Overnight hold" v="Departs next morning" accent="var(--violet)" />}
            </>
          )}
          <div style={{ marginTop: 8 }}>
            <label className="field-label">On-site time (minutes)</label>
            <input
              type="number"
              className="input"
              min={0}
              step={15}
              value={stop.dwellMin}
              onChange={(e) => patchStop({ dwellMin: Math.max(0, Number(e.target.value) || 0) })}
            />
          </div>
        </div>
      )}

      <WeatherPanel stop={stop} dateISO={entry?.arrival || trip.startDateTime} />

      <div className="panel">
        <div className="section-label">Checklist · planning tasks</div>
        {stop.checklist.length === 0 && (
          <div style={{ fontSize: 11, color: 'var(--faint)', marginBottom: 6 }}>
            No linked tasks yet. Add one below if this item needs follow-up.
          </div>
        )}
        {stop.checklist.map((c) => (
          <label key={c.id} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '3px 0', fontSize: 12 }}>
            <input
              type="checkbox"
              checked={c.done}
              onChange={() =>
                patchStop({
                  checklist: stop.checklist.map((x) => (x.id === c.id ? { ...x, done: !x.done } : x)),
                })
              }
            />
            <span style={c.done ? { textDecoration: 'line-through', color: 'var(--faint)' } : undefined}>{c.text}</span>
          </label>
        ))}
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          <input
            className="input"
            placeholder="Add a task tied to this item…"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newTask.trim()) {
                patchStop({ checklist: [...stop.checklist, { id: uid(), text: newTask.trim(), done: false }] })
                setNewTask('')
              }
            }}
          />
          <button
            className="btn sm"
            onClick={() => {
              if (!newTask.trim()) return
              patchStop({ checklist: [...stop.checklist, { id: uid(), text: newTask.trim(), done: false }] })
              setNewTask('')
            }}
          >
            <Plus size={11} /> Add
          </button>
        </div>
      </div>

      <div className="panel">
        <div className="section-label">Briefing · what matters here</div>
        <textarea
          className="input"
          placeholder="Capture planning notes, constraints, decisions, or reminders…"
          value={stop.notes}
          onChange={(e) => patchStop({ notes: e.target.value })}
        />
      </div>
    </>
  )
}

function LegInspector({ legIdx }) {
  const { trip, plan, prefs } = useTrip()
  const leg = plan?.legs[legIdx]
  const stopById = useMemo(() => new Map(trip.stops.map((s) => [s.id, s])), [trip.stops])
  if (!leg) return <SnapshotInspector />
  return (
    <>
      <div className="panel">
        <div className="section-label">Transit leg</div>
        <div style={{ fontSize: 14, fontWeight: 800, textTransform: 'uppercase' }}>
          {stopById.get(leg.fromId)?.name} → {stopById.get(leg.toId)?.name}
        </div>
        <div style={{ marginTop: 8 }}>
          <KV k="Depart" v={fmtDateTime(leg.departure)} />
          <KV k="Arrive" v={fmtDateTime(leg.arrival)} />
          <KV k="Drive time" v={fmtDuration(leg.driveSec)} accent="var(--blue)" />
          <KV k="Distance" v={fmtDistance(leg.distanceM, prefs.distUnit)} />
        </div>
      </div>
      <WeatherArrival leg={leg} />
    </>
  )
}

function WeatherArrival({ leg }) {
  const { trip } = useTrip()
  const dest = trip.stops.find((s) => s.id === leg.toId)
  if (!dest) return null
  return <WeatherPanel stop={dest} dateISO={leg.arrival} />
}

function SnapshotInspector() {
  const { trip, plan, prefs, weatherFor, routeStatus } = useTrip()
  return (
    <>
      <div className="panel">
        <div className="section-label">Operation snapshot</div>
        <div style={{ fontSize: 15, fontWeight: 800, textTransform: 'uppercase' }}>{trip.name}</div>
        <div style={{ fontSize: 11, color: 'var(--muted)', margin: '2px 0 10px' }}>
          {fmtDateTime(trip.startDateTime)} → {fmtDateTime(trip.endDateTime)}
        </div>
        {plan ? (
          <>
            <KV k="Stops" v={plan.orderedStops.length} />
            <KV k="Total drive" v={fmtDuration(plan.totalDriveSec)} accent="var(--blue)" />
            <KV k="Total distance" v={fmtDistance(plan.totalDistanceM, prefs.distUnit)} />
            <KV k="Days" v={plan.days.length} />
            <div style={{ marginTop: 8 }}>
              {plan.overrun ? (
                <span className="chip red">Overrun — plan exceeds end date</span>
              ) : (
                <span className="chip green">On schedule</span>
              )}
              {plan.estimated && <span className="chip amber" style={{ marginLeft: 6 }}>Offline estimate</span>}
            </div>
          </>
        ) : (
          <div style={{ fontSize: 11, color: 'var(--faint)' }}>
            {routeStatus === 'loading' ? 'Computing route…' : 'Add an origin and destination to compute the route.'}
          </div>
        )}
      </div>

      <div>
        <div className="section-label muted-label">Weather by location</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {(plan?.orderedStops || trip.stops).map((s) => {
            const entry = plan?.entries.find((e) => e.stopId === s.id)
            const w = weatherFor(s, entry?.arrival || trip.startDateTime)
            return (
              <div key={s.id} className="weather-row">
                <span className="w-icon">{w ? <WeatherIcon code={w.code} size={17} /> : <span style={{ width: 17 }} />}</span>
                <div className="w-main">
                  <div className="w-name">{s.name}</div>
                  <div className="w-desc">
                    {entry ? fmtDateTime(entry.arrival) : '—'} · {w ? describeWmo(w.code) : 'No forecast'}
                  </div>
                </div>
                {w && (
                  <div className="w-temp">
                    {fmtTemp(w.tMax, prefs.tempUnit)}
                    <small> / {fmtTemp(w.tMin, prefs.tempUnit)}</small>
                  </div>
                )}
              </div>
            )
          })}
          {trip.stops.length === 0 && <div className="empty-note">No stops yet.</div>}
        </div>
      </div>
    </>
  )
}

export default function InspectorRail() {
  const { selection, setSelection } = useTrip()
  return (
    <aside className="inspector-rail">
      {selection && (
        <button className="btn sm ghost" style={{ alignSelf: 'flex-end' }} onClick={() => setSelection(null)}>
          Back to snapshot
        </button>
      )}
      {selection?.type === 'stop' ? (
        <StopInspector stopId={selection.id} />
      ) : selection?.type === 'leg' ? (
        <LegInspector legIdx={selection.id} />
      ) : (
        <SnapshotInspector />
      )}
    </aside>
  )
}
