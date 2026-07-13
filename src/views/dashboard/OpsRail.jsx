import React, { useEffect, useMemo, useState } from 'react'
import { Play, Pause, RotateCcw, Rocket } from 'lucide-react'
import { useTrip } from '../../state/TripContext.jsx'
import { fmtDateTime, fmtDayShort, fmtDuration } from '../../lib/format.js'
import { format } from 'date-fns'

function useTicker(enabled) {
  const [, setTick] = useState(0)
  useEffect(() => {
    if (!enabled) return
    const iv = setInterval(() => setTick((t) => t + 1), 1000 * 30)
    return () => clearInterval(iv)
  }, [enabled])
}

export default function OpsRail() {
  const { trip, plan, familyRoutes, selection, setSelection, sim, launch } = useTrip()
  useTicker(!sim.simTime)
  const now = sim.simTime ?? Date.now()

  const stopById = useMemo(() => new Map(trip.stops.map((s) => [s.id, s])), [trip.stops])

  // Feed of movements + dwells, ordered by start time.
  const events = useMemo(() => {
    if (!plan) return []
    const list = []
    plan.legs.forEach((leg, i) => {
      list.push({
        key: `leg-${i}`,
        type: 'leg',
        id: i,
        title: `${stopById.get(leg.fromId)?.name || '?'} → ${stopById.get(leg.toId)?.name || '?'}`,
        start: new Date(leg.departure).getTime(),
        end: new Date(leg.arrival).getTime(),
        chip: 'TRANSIT',
        chipClass: 'blue',
        sub: `${fmtDateTime(leg.departure)} · ${fmtDuration(leg.driveSec)}`,
      })
    })
    plan.entries.forEach((e, i) => {
      if (i === 0) return
      const stop = stopById.get(e.stopId)
      if (!stop || (stop.dwellMin || 0) < 20) return
      list.push({
        key: `stop-${e.stopId}`,
        type: 'stop',
        id: e.stopId,
        title: stop.name,
        start: new Date(e.arrival).getTime(),
        end: new Date(e.departure).getTime(),
        chip: stop.kind === 'stopover' ? 'BASECAMP' : 'ON SITE',
        chipClass: 'green',
        sub: `${fmtDateTime(e.arrival)} arrival`,
      })
    })
    return list.sort((a, b) => a.start - b.start)
  }, [plan, stopById])

  const live = events.filter((e) => e.start <= now && now < e.end)
  const soon = events.filter((e) => e.start > now)

  const select = (ev) =>
    setSelection({ type: ev.type === 'leg' ? 'leg' : 'stop', id: ev.id })

  const isSelected = (ev) =>
    selection && ((ev.type === 'leg' && selection.type === 'leg' && selection.id === ev.id) ||
      (ev.type === 'stop' && selection.type === 'stop' && selection.id === ev.id))

  const renderRow = (ev) => (
    <div
      key={ev.key}
      className={`event-row${isSelected(ev) ? ' selected' : ''}`}
      onClick={() => select(ev)}
    >
      <div style={{ minWidth: 0 }}>
        <div className="title">{ev.title}</div>
        <div className="sub">{ev.sub}</div>
      </div>
      <span className={`chip ${ev.chipClass}`}>{ev.chip}</span>
    </div>
  )

  return (
    <aside className="ops-rail">
      <div className="panel">
        <div className="section-label">Current situation</div>
        <div className="mono" style={{ fontSize: 19, fontWeight: 700 }}>
          {format(new Date(now), 'EEE M/dd hh:mm a')}
        </div>
        <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>
          {live.length} live item{live.length === 1 ? '' : 's'} in motion
          {sim.simTime ? ' · scenario mode' : ''}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <div className="stat-box" style={{ flex: 1 }}>
            <div className="stat-label">Live</div>
            <div className="stat-value">{live.length}</div>
          </div>
          <div className="stat-box" style={{ flex: 1 }}>
            <div className="stat-label">Soon</div>
            <div className="stat-value">{soon.length}</div>
          </div>
        </div>
        <button className="btn go" style={{ width: '100%', marginTop: 10 }} onClick={launch.show}>
          <Rocket size={13} /> Mission launch
        </button>
      </div>

      <div>
        <div className="section-label muted-label">Live now</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {live.length === 0 && <div className="empty-note">Nothing in motion at this time.</div>}
          {live.map(renderRow)}
        </div>
      </div>

      <div>
        <div className="section-label muted-label">Coming up</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {soon.slice(0, 5).map(renderRow)}
          {soon.length === 0 && <div className="empty-note">No upcoming movements.</div>}
        </div>
      </div>

      <div>
        <div className="section-label">Travel units</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {trip.families.map((f) => {
            const fr = familyRoutes.find((r) => r.familyId === f.id)
            let chip = 'STAGED'
            let cls = ''
            if (fr) {
              const dep = new Date(fr.departure).getTime()
              const arr = new Date(fr.arrival).getTime()
              if (now >= arr) {
                chip = 'ARRIVED'
                cls = 'green'
              } else if (now >= dep) {
                chip = 'TRANSIT'
                cls = 'blue'
              }
            }
            return (
              <div key={f.id} className="event-row" style={{ cursor: 'default' }}>
                <div>
                  <div className="title" style={{ color: f.color }}>{f.name}</div>
                  <div className="sub">
                    {f.origin?.name || 'No origin set'} · {f.size}
                    {fr ? ` · ${fmtDuration(fr.driveSec)} inbound` : ''}
                  </div>
                </div>
                <span className={`chip ${cls}`}>{chip}</span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="panel">
        <div className="section-label">
          Scenario mode · time scrub
        </div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
          {(plan?.days || []).map((d, i) => {
            const active =
              sim.simTime &&
              new Date(sim.simTime).toDateString() === d.toDateString()
            return (
              <button
                key={i}
                className={`family-chip${active ? ' active' : ''}`}
                onClick={() => {
                  const t = new Date(d)
                  t.setHours(9, 0, 0, 0)
                  sim.setSimTime(t.getTime())
                }}
              >
                {fmtDayShort(d)} {format(d, 'M/dd')}
              </button>
            )
          })}
        </div>
        {plan && (
          <input
            type="range"
            style={{ width: '100%' }}
            min={new Date(plan.entries[0].departure).getTime()}
            max={new Date(plan.entries[plan.entries.length - 1].arrival).getTime()}
            step={5 * 60 * 1000}
            value={sim.simTime ?? new Date(plan.entries[0].departure).getTime()}
            onChange={(e) => sim.setSimTime(Number(e.target.value))}
          />
        )}
        <div style={{ display: 'flex', gap: 6, marginTop: 8, alignItems: 'center' }}>
          {sim.playing ? (
            <button className="btn sm" onClick={sim.pause}>
              <Pause size={11} />
            </button>
          ) : (
            <button className="btn sm primary" onClick={sim.play}>
              <Play size={11} />
            </button>
          )}
          <button className="btn sm ghost" onClick={sim.resetSim} title="Back to live clock">
            <RotateCcw size={11} />
          </button>
          {[1, 2, 4].map((s) => (
            <button
              key={s}
              className={`family-chip${sim.speed === s ? ' active' : ''}`}
              onClick={() => sim.setSpeed(s)}
            >
              {s}X
            </button>
          ))}
        </div>
      </div>
    </aside>
  )
}
