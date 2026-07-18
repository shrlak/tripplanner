import React, { useEffect, useState } from 'react'
import { Search, Compass } from 'lucide-react'
import { useTrip } from '../state/TripContext.jsx'

export default function CommandBar({ setView }) {
  const { trip, trips, switchTrip, savedAt, setSelection } = useTrip()
  const [flash, setFlash] = useState(false)
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (!savedAt) return
    setFlash(true)
    const t = setTimeout(() => setFlash(false), 1200)
    return () => clearTimeout(t)
  }, [savedAt])

  const onSearch = (e) => {
    if (e.key !== 'Enter') return
    const q = query.trim().toLowerCase()
    if (!q) return
    const hit = trip.stops.find(
      (s) => s.name.toLowerCase().includes(q) || s.address.toLowerCase().includes(q),
    )
    if (hit) {
      setSelection({ type: 'stop', id: hit.id })
      setView('dashboard')
    }
  }

  return (
    <header className="command-bar">
      <div className="brand">
        <span className="classification">
          <Compass size={16} />
        </span>
        <span className="app-title">Trip Command Center</span>
      </div>

      {trips.length > 1 ? (
        <select
          className="input"
          style={{ width: 220 }}
          value={trip.id}
          onChange={(e) => switchTrip(e.target.value)}
          title="Switch trip"
        >
          {trips.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      ) : (
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>
          {trip.name}
        </span>
      )}

      <div className="spacer" />

      <span className={`chip ${flash ? 'green' : 'blue'}`}>
        <span className="pulse-dot" style={{ background: flash ? 'var(--green)' : 'var(--blue)' }} />
        {flash ? 'Saved' : 'Autosave on'}
      </span>

      <div style={{ position: 'relative', width: 220 }}>
        <Search size={14} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--faint)' }} />
        <input
          className="input"
          style={{ padding: '9px 12px 9px 36px' }}
          placeholder="Find a stop…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onSearch}
        />
      </div>
    </header>
  )
}
