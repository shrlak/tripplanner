// localStorage persistence for the whole planner state (all trips + prefs).
// Saves are debounced; `savedAt` drives the AUTOSAVE badge in the command bar.
import { useEffect, useRef, useState } from 'react'
import { buildSeedTrip } from './seedTrip.js'

const STORAGE_KEY = 'trip-command-center-v1'

function loadInitialState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && parsed.trips && parsed.activeTripId) return parsed
    }
  } catch {
    // corrupted state falls through to a fresh seed
  }
  const seed = buildSeedTrip()
  return {
    trips: { [seed.id]: seed },
    activeTripId: seed.id,
    prefs: { tempUnit: 'F', distUnit: 'mi', mapMode: 'light', theme: 'light' },
  }
}

export function usePersistedTripState() {
  const [state, setState] = useState(loadInitialState)
  const [savedAt, setSavedAt] = useState(null)
  const timer = useRef(null)
  const first = useRef(true)

  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
        setSavedAt(Date.now())
      } catch {
        // storage full/unavailable — keep running in memory
      }
    }, 400)
    return () => clearTimeout(timer.current)
  }, [state])

  return [state, setState, savedAt]
}
