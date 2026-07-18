import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Flag, Route as RouteIcon, Users, MapPin, ArrowRight } from 'lucide-react'
import { useTrip } from '../state/TripContext.jsx'
import { getDestination } from '../state/tripModel.js'
import { fmtDateTime, fmtDuration } from '../lib/format.js'

const COUNTDOWN_FROM = 5

export default function MissionLaunch() {
  const { trip, plan, launch, sim } = useTrip()
  const [count, setCount] = useState(COUNTDOWN_FROM)

  const dest = getDestination(trip)
  const launchInfo = useMemo(() => {
    if (!plan) return null
    return {
      depart: plan.entries[0].departure,
      arrive: plan.entries[plan.entries.length - 1].arrival,
      units: trip.families.length,
      totalDrive: plan.totalDriveSec,
    }
  }, [plan, trip.families.length])

  useEffect(() => {
    if (count <= 0) return
    const t = setTimeout(() => setCount((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [count])

  const proceed = () => {
    launch.hide()
    if (plan) {
      sim.setSimTime(new Date(plan.entries[0].departure).getTime())
      sim.play()
    }
  }

  useEffect(() => {
    if (count === 0) proceed()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count])

  const frac = count / COUNTDOWN_FROM
  const R = 56
  const CIRC = 2 * Math.PI * R

  return (
    <div className="overlay-backdrop" onClick={launch.hide}>
      <motion.div
        className="launch-modal"
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="lm-kicker">Departure day launch</div>
        <div className="lm-sub">Everyone en route</div>
        <h1>Departure day</h1>
        <p className="lm-desc">
          {trip.families.map((f) => f.name).filter(Boolean).join(' + ') || 'Everyone'} heading
          {dest ? ` to ${dest.name}.` : '.'}
        </p>

        <div className="launch-stats">
          <span className="launch-stat">
            <Flag size={12} /> Launch <b>{launchInfo ? fmtDateTime(launchInfo.depart) : '—'}</b>
          </span>
          <span className="launch-stat">
            <RouteIcon size={12} /> ETA <b>{launchInfo ? fmtDateTime(launchInfo.arrive) : '—'}</b>
          </span>
          <span className="launch-stat">
            <Users size={12} /> Groups <b>{launchInfo?.units ?? '—'}</b>
          </span>
          <span className="launch-stat">
            Drive <b>{launchInfo ? fmtDuration(launchInfo.totalDrive) : '—'}</b>
          </span>
        </div>

        <div className="launch-lower">
          <div className="countdown-ring">
            <svg width="132" height="132" viewBox="0 0 132 132">
              <circle cx="66" cy="66" r={R} fill="none" stroke="#e5e5e7" strokeWidth="7" />
              <motion.circle
                cx="66"
                cy="66"
                r={R}
                fill="none"
                stroke="#9a6700"
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={CIRC}
                animate={{ strokeDashoffset: CIRC * (1 - frac) }}
                transition={{ duration: 0.9, ease: 'linear' }}
              />
            </svg>
            <div className="cd-num">
              <span className="l">Launch in</span>
              <span className="n">{count}</span>
            </div>
          </div>

          <div className="launch-target">
            <div className="section-label" style={{ color: 'var(--muted)' }}>
              <MapPin size={10} style={{ marginRight: 4 }} />
              Target
            </div>
            <div className="lt-title">{dest?.name || 'No destination set'}</div>
            <div className="lt-desc">
              Get everyone to the destination, checked in, and settled before the evening.
            </div>
          </div>
        </div>

        <div className="launch-actions">
          <button className="btn" onClick={launch.hide}>
            Abort
          </button>
          <button className="btn go" onClick={proceed}>
            Proceed now <ArrowRight size={13} />
          </button>
        </div>
      </motion.div>
    </div>
  )
}
