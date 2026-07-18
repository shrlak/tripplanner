import React, { useEffect, useState } from 'react'
import { Search, Compass, Sun, Moon, MonitorSmartphone } from 'lucide-react'
import { useTrip } from '../state/TripContext.jsx'
import { THEMES } from '../lib/theme.js'

const THEME_ICON = { light: Sun, dark: Moon, auto: MonitorSmartphone }
const THEME_LABEL = { light: 'Light', dark: 'Dark', auto: 'Auto' }

function ThemeToggle() {
  const { prefs, setPrefs } = useTrip()
  const theme = prefs.theme || 'light'
  const Icon = THEME_ICON[theme]
  const next = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length]
  const switchTheme = () => {
    const patch = { theme: next }
    // Keep the map basemap matched to a plain light/dark switch by default —
    // a bright light map on an all-black dashboard reads as a mistake. Only
    // nudge it when the map is still on the other theme's default so a
    // deliberate pick (satellite, terrain, streets) is never overridden.
    if (next === 'dark' && (prefs.mapMode || 'light') === 'light') patch.mapMode = 'dark'
    if (next === 'light' && prefs.mapMode === 'dark') patch.mapMode = 'light'
    setPrefs(patch)
  }
  return (
    <button
      className="icon-btn"
      title={`Appearance: ${THEME_LABEL[theme]} (click for ${THEME_LABEL[next]})`}
      aria-label={`Switch appearance, currently ${THEME_LABEL[theme]}`}
      onClick={switchTheme}
    >
      <Icon size={16} />
    </button>
  )
}

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
          className="input cmdbar-tripname"
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
        <span className="cmdbar-tripname" style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>
          {trip.name}
        </span>
      )}

      <div className="spacer" />

      <ThemeToggle />

      <span className={`chip ${flash ? 'green' : 'blue'}`}>
        <span className="pulse-dot" style={{ background: flash ? 'var(--green)' : 'var(--blue)' }} />
        <span className="cmdbar-savelabel">{flash ? 'Saved' : 'Autosave on'}</span>
      </span>

      <div className="cmdbar-search" style={{ position: 'relative', width: 220 }}>
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
