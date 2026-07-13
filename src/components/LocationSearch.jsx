import React, { useEffect, useRef, useState } from 'react'
import { MapPin, Loader2 } from 'lucide-react'
import { searchPlaces } from '../lib/geocode.js'

// Debounced Photon autocomplete. onSelect gets { name, detail, lat, lon }.
export default function LocationSearch({ placeholder = 'Search location…', onSelect, initialValue = '' }) {
  const [query, setQuery] = useState(initialValue)
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const abortRef = useRef(null)
  const boxRef = useRef(null)

  useEffect(() => {
    const q = query.trim()
    if (q.length < 3) {
      setResults([])
      return
    }
    setBusy(true)
    const timer = setTimeout(async () => {
      abortRef.current?.abort()
      const ctrl = new AbortController()
      abortRef.current = ctrl
      try {
        const found = await searchPlaces(q, { signal: ctrl.signal })
        setResults(found)
        setOpen(true)
      } catch (err) {
        if (err.name !== 'AbortError') setResults([])
      } finally {
        setBusy(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    const onDocClick = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  return (
    <div className="location-search" ref={boxRef}>
      <div style={{ position: 'relative' }}>
        <input
          className="input"
          value={query}
          placeholder={placeholder}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
        />
        {busy && (
          <Loader2
            size={13}
            className="spin"
            style={{ position: 'absolute', right: 8, top: 9, color: 'var(--muted)', animation: 'spin 1s linear infinite' }}
          />
        )}
      </div>
      {open && results.length > 0 && (
        <div className="results">
          {results.map((r, i) => (
            <button
              key={i}
              className="result-item"
              onClick={() => {
                onSelect(r)
                setQuery('')
                setResults([])
                setOpen(false)
              }}
            >
              <div className="r-name" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <MapPin size={11} style={{ color: 'var(--blue)', flex: 'none' }} />
                {r.name}
              </div>
              {r.detail && <div className="r-detail">{r.detail}</div>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
