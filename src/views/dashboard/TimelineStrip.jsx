import React, { useMemo } from 'react'
import { useTrip } from '../../state/TripContext.jsx'
import { getDestination } from '../../state/tripModel.js'
import WeatherIcon from '../../components/WeatherIcon.jsx'
import { describeWmo } from '../../lib/weather.js'
import { fmtDayLabel, fmtTemp, clamp } from '../../lib/format.js'

const HOUR_START = 6
const HOUR_END = 22
const SPAN = HOUR_END - HOUR_START

function hourFrac(dateISO) {
  const d = new Date(dateISO)
  return clamp((d.getHours() + d.getMinutes() / 60 - HOUR_START) / SPAN, 0, 1)
}

function sameDay(a, b) {
  return a.toDateString() === b.toDateString()
}

export default function TimelineStrip() {
  const { trip, plan, weatherFor, prefs, setSelection, sim } = useTrip()
  const stopById = useMemo(() => new Map(trip.stops.map((s) => [s.id, s])), [trip.stops])
  const weatherAnchor = trip.stops.find((s) => s.kind === 'stopover') || getDestination(trip)

  if (!plan) {
    return (
      <div className="timeline-cell" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div className="empty-note" style={{ border: 0 }}>
          Set an origin and destination in Route &amp; Trip Setup to build the mission timeline.
        </div>
      </div>
    )
  }

  return (
    <div className="timeline-cell">
      <div className="timeline-body">
        <div className="timeline-grid">
          {plan.days.map((day, di) => {
            const w = weatherAnchor ? weatherFor(weatherAnchor, day.toISOString()) : null
            const legBlocks = plan.legs
              .map((leg, i) => ({ leg, i }))
              .filter(({ leg }) => {
                const dep = new Date(leg.departure)
                const arr = new Date(leg.arrival)
                return sameDay(dep, day) || sameDay(arr, day) || (dep < day && arr > day)
              })
            const dwellBlocks = plan.entries
              .map((e, i) => ({ e, i }))
              .filter(({ e, i }) => {
                if (i === 0) return false
                const stop = stopById.get(e.stopId)
                if (!stop || (stop.dwellMin || 0) < 30) return false
                const a = new Date(e.arrival)
                const d = new Date(e.departure)
                return sameDay(a, day) || sameDay(d, day) || (a < day && d > day)
              })
            const simDate = sim.simTime ? new Date(sim.simTime) : null
            const cursorFrac = simDate && sameDay(simDate, day) ? hourFrac(simDate.toISOString()) : null

            return (
              <div className="timeline-day" key={di}>
                <div className="day-head">
                  <span className="mono" style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.08em' }}>
                    {fmtDayLabel(day)}
                  </span>
                  {w ? (
                    <span className="day-weather" title={describeWmo(w.code)}>
                      <WeatherIcon code={w.code} size={14} />
                      <span className="temp">{fmtTemp(w.tMax, prefs.tempUnit)}</span>
                      <span style={{ fontSize: 10 }}>{describeWmo(w.code)}</span>
                    </span>
                  ) : (
                    <span className="day-weather" style={{ fontSize: 9, letterSpacing: '.08em' }}>
                      NO FORECAST
                    </span>
                  )}
                </div>
                <div className="timeline-lane">
                  {legBlocks.map(({ leg, i }) => {
                    const dep = new Date(leg.departure)
                    const arr = new Date(leg.arrival)
                    const left = sameDay(dep, day) ? hourFrac(leg.departure) : 0
                    const right = sameDay(arr, day) ? hourFrac(leg.arrival) : 1
                    if (right - left <= 0) return null
                    return (
                      <div
                        key={`l${i}`}
                        className="timeline-block transit"
                        style={{ left: `${left * 100}%`, width: `${Math.max(3, (right - left) * 100)}%` }}
                        title={`${stopById.get(leg.fromId)?.name} → ${stopById.get(leg.toId)?.name}`}
                        onClick={() => setSelection({ type: 'leg', id: i })}
                      >
                        {stopById.get(leg.toId)?.name || 'Transit'}
                      </div>
                    )
                  })}
                  {dwellBlocks.map(({ e }) => {
                    const stop = stopById.get(e.stopId)
                    const a = new Date(e.arrival)
                    const d = new Date(e.departure)
                    const left = sameDay(a, day) ? hourFrac(e.arrival) : 0
                    const right = sameDay(d, day) ? hourFrac(e.departure) : 1
                    if (right - left <= 0) return null
                    const cls = stop.kind === 'stopover' ? 'overnight' : 'dwell'
                    return (
                      <div
                        key={`d${e.stopId}`}
                        className={`timeline-block ${cls}`}
                        style={{ left: `${left * 100}%`, width: `${Math.max(3, (right - left) * 100)}%` }}
                        title={stop.name}
                        onClick={() => setSelection({ type: 'stop', id: e.stopId })}
                      >
                        {stop.name}
                      </div>
                    )
                  })}
                  {cursorFrac !== null && (
                    <div className="time-cursor" style={{ left: `${cursorFrac * 100}%` }}>
                      <span className="cursor-tag">CURSOR</span>
                    </div>
                  )}
                </div>
                <div className="timeline-hours">
                  {[6, 9, 12, 15, 18, 21].map((h) => (
                    <span key={h}>{String(h).padStart(2, '0')}</span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
