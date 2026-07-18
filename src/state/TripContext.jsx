import React, { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { usePersistedTripState } from './usePersistedTripState.js'
import { getOrigin, getDestination, manualOrderedMiddles, locatedStops, createTrip, travelModeOf } from './tripModel.js'
import { buildSeedTrip } from './seedTrip.js'
import { getDurationMatrix, getRoute } from '../lib/routing.js'
import { optimizeMiddleOrder } from '../lib/optimizer.js'
import { buildSchedule } from '../lib/schedule.js'
import { fetchTripWeather, pointKeyOf } from '../lib/weather.js'
import { applyTheme } from '../lib/theme.js'

const TripCtx = createContext(null)
export const useTrip = () => useContext(TripCtx)

// Sim playback speed: simulated ms advanced per real ms, per 1X step.
const SIM_BASE_RATE = 900 // 1X ≈ 15 sim-minutes per second

export function TripProvider({ children }) {
  const [state, setState, savedAt] = usePersistedTripState()
  const trip = state.trips[state.activeTripId]

  const updateTrip = useCallback(
    (updater) => {
      setState((prev) => {
        const current = prev.trips[prev.activeTripId]
        const next = typeof updater === 'function' ? updater(current) : { ...current, ...updater }
        return { ...prev, trips: { ...prev.trips, [next.id]: next } }
      })
    },
    [setState],
  )

  const setPrefs = useCallback(
    (patch) => setState((prev) => ({ ...prev, prefs: { ...prev.prefs, ...patch } })),
    [setState],
  )

  const theme = state.prefs.theme || 'light'
  useEffect(() => {
    applyTheme(theme)
    if (theme !== 'auto') return
    // In "auto" mode, keep following the OS setting live.
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyTheme('auto')
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [theme])

  const switchTrip = useCallback(
    (id) => setState((prev) => (prev.trips[id] ? { ...prev, activeTripId: id } : prev)),
    [setState],
  )

  const createNewTrip = useCallback(() => {
    const t = createTrip()
    setState((prev) => ({ ...prev, trips: { ...prev.trips, [t.id]: t }, activeTripId: t.id }))
  }, [setState])

  const resetToDemo = useCallback(() => {
    const seed = buildSeedTrip()
    setState((prev) => ({ ...prev, trips: { ...prev.trips, [seed.id]: seed }, activeTripId: seed.id }))
  }, [setState])

  const deleteTrip = useCallback(
    (id) => {
      setState((prev) => {
        const trips = { ...prev.trips }
        delete trips[id]
        let activeTripId = prev.activeTripId
        if (activeTripId === id) {
          activeTripId = Object.keys(trips)[0]
          if (!activeTripId) {
            const fresh = createTrip()
            trips[fresh.id] = fresh
            activeTripId = fresh.id
          }
        }
        return { ...prev, trips, activeTripId }
      })
    },
    [setState],
  )

  const importTrip = useCallback(
    (tripJson) => {
      if (!tripJson?.id || !Array.isArray(tripJson.stops)) throw new Error('Not a trip file')
      setState((prev) => ({
        ...prev,
        trips: { ...prev.trips, [tripJson.id]: tripJson },
        activeTripId: tripJson.id,
      }))
    },
    [setState],
  )

  // ---------- route computation ----------
  // routeData = { orderedIds, legs, estimated } — refetched only when the
  // located coordinates, mode, or manual order change.
  const [routeData, setRouteData] = useState(null)
  const [routeStatus, setRouteStatus] = useState('idle') // idle | loading | ready | error

  const origin = getOrigin(trip)
  const destination = getDestination(trip)
  const middles = manualOrderedMiddles(trip)

  const travelMode = travelModeOf(trip)
  const routeKey = useMemo(() => {
    const pts = [origin, ...middles, destination]
      .filter((s) => s && Number.isFinite(s.lat))
      .map((s) => `${s.id}:${s.lat.toFixed(4)},${s.lon.toFixed(4)}`)
    return JSON.stringify({ pts, mode: trip.routeMode, travelMode })
  }, [origin, middles, destination, trip.routeMode, travelMode])

  const routeSeq = useRef(0)
  useEffect(() => {
    const seq = ++routeSeq.current
    const o = origin && Number.isFinite(origin.lat) ? origin : null
    const d = destination && Number.isFinite(destination.lat) ? destination : null
    const mids = locatedStops(middles)
    const all = [o, ...mids, d].filter(Boolean)
    if (all.length < 2) {
      setRouteData(null)
      setRouteStatus('idle')
      return
    }
    setRouteStatus('loading')
    const timer = setTimeout(async () => {
      try {
        let orderedMids = mids
        let estimated = false
        if (trip.routeMode === 'optimized' && o && d && mids.length > 1) {
          const matrixStops = [o, ...mids, d]
          const matrix = await getDurationMatrix(
            matrixStops.map((s) => ({ lat: s.lat, lon: s.lon })),
            travelMode,
          )
          estimated = matrix.estimated
          const order = optimizeMiddleOrder(matrix.durations)
          orderedMids = order.map((idx) => matrixStops[idx])
        }
        const ordered = [o, ...orderedMids, d].filter(Boolean)
        const route = await getRoute(ordered.map((s) => ({ lat: s.lat, lon: s.lon })), travelMode)
        if (seq !== routeSeq.current) return
        setRouteData({
          orderedIds: ordered.map((s) => s.id),
          legs: route.legs,
          estimated: estimated || route.estimated,
        })
        setRouteStatus('ready')
      } catch (err) {
        if (seq !== routeSeq.current) return
        console.error('route computation failed', err)
        setRouteData(null)
        setRouteStatus('error')
      }
    }, 350)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeKey])

  // Schedule is cheap and recomputes on any date/dwell edit without refetching.
  const plan = useMemo(() => {
    if (!routeData) return null
    const byId = new Map(trip.stops.map((s) => [s.id, s]))
    const orderedStops = routeData.orderedIds.map((id) => byId.get(id)).filter(Boolean)
    if (orderedStops.length !== routeData.orderedIds.length) return null
    const sched = buildSchedule({
      orderedStops,
      legs: routeData.legs,
      startDateTime: trip.startDateTime,
      endDateTime: trip.endDateTime,
    })
    const legs = routeData.legs.map((leg, i) => ({
      ...leg,
      fromId: orderedStops[i].id,
      toId: orderedStops[i + 1].id,
      departure: sched.entries[i].departure,
      arrival: sched.entries[i + 1].arrival,
    }))
    return {
      orderedStops,
      legs,
      estimated: routeData.estimated,
      ...sched,
    }
  }, [routeData, trip.stops, trip.startDateTime, trip.endDateTime])

  // ---------- family inbound routes (convoy view) ----------
  const [familyRoutes, setFamilyRoutes] = useState([])
  const famKey = useMemo(
    () =>
      JSON.stringify(
        trip.families
          .filter((f) => f.origin && Number.isFinite(f.origin.lat))
          .map((f) => [f.id, f.origin.lat.toFixed(3), f.origin.lon.toFixed(3)]),
      ) +
      (destination && Number.isFinite(destination?.lat) ? `${destination.lat},${destination.lon}` : '') +
      travelMode,
    [trip.families, destination, travelMode],
  )
  useEffect(() => {
    let alive = true
    const target = destination && Number.isFinite(destination.lat) ? destination : null
    const anchor = target || (origin && Number.isFinite(origin.lat) ? origin : null)
    if (!anchor) {
      setFamilyRoutes([])
      return
    }
    const fams = trip.families.filter((f) => f.origin && Number.isFinite(f.origin.lat))
    Promise.all(
      fams.map(async (f) => {
        const route = await getRoute(
          [
            { lat: f.origin.lat, lon: f.origin.lon },
            { lat: anchor.lat, lon: anchor.lon },
          ],
          travelMode,
        )
        const driveSec = route.legs.reduce((a, l) => a + l.driveSec, 0)
        const geometry = route.legs.flatMap((l) => l.geometry)
        const depart = new Date(trip.startDateTime)
        const arrive = new Date(depart.getTime() + driveSec * 1000)
        return {
          familyId: f.id,
          color: f.color,
          name: f.name,
          geometry,
          driveSec,
          estimated: route.estimated,
          departure: depart.toISOString(),
          arrival: arrive.toISOString(),
        }
      }),
    )
      .then((routes) => alive && setFamilyRoutes(routes))
      .catch(() => alive && setFamilyRoutes([]))
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [famKey, trip.startDateTime])

  // ---------- weather ----------
  const [weather, setWeather] = useState({ status: 'idle', byPoint: new Map() })
  const weatherPoints = useMemo(() => {
    const pts = locatedStops(trip.stops).map((s) => ({ lat: s.lat, lon: s.lon }))
    const seen = new Set()
    return pts.filter((p) => {
      const k = pointKeyOf(p)
      if (seen.has(k)) return false
      seen.add(k)
      return true
    })
  }, [trip.stops])

  useEffect(() => {
    let alive = true
    if (weatherPoints.length === 0) {
      setWeather({ status: 'idle', byPoint: new Map() })
      return
    }
    setWeather((w) => ({ ...w, status: 'loading' }))
    fetchTripWeather(weatherPoints, trip.startDateTime, trip.endDateTime, state.prefs.tempUnit)
      .then((byPoint) => alive && setWeather({ status: 'ready', byPoint }))
      .catch((err) => {
        console.error('weather fetch failed', err)
        if (alive) setWeather({ status: 'error', byPoint: new Map() })
      })
    return () => {
      alive = false
    }
  }, [weatherPoints, trip.startDateTime, trip.endDateTime, state.prefs.tempUnit])

  const weatherFor = useCallback(
    (stop, dateISO) => {
      if (!stop || !Number.isFinite(stop.lat) || !dateISO) return null
      const byDate = weather.byPoint.get(pointKeyOf(stop))
      if (!byDate) return null
      const dateStr = new Date(dateISO).toISOString().slice(0, 10)
      // API dates are local to the location; match on calendar date string
      // from the schedule's local rendering instead of UTC when they differ.
      const local = new Date(dateISO)
      const localStr = `${local.getFullYear()}-${String(local.getMonth() + 1).padStart(2, '0')}-${String(
        local.getDate(),
      ).padStart(2, '0')}`
      return byDate[localStr] || byDate[dateStr] || null
    },
    [weather.byPoint],
  )

  // ---------- selection ----------
  const [selection, setSelection] = useState(null) // { type: 'stop'|'leg', id }

  // ---------- sim playback ----------
  const [simTime, setSimTime] = useState(null) // ms epoch or null (live clock)
  const [playing, setPlaying] = useState(false)
  const [simSpeed, setSimSpeed] = useState(2)
  const simEnd = plan ? new Date(plan.entries[plan.entries.length - 1].arrival).getTime() : null

  useEffect(() => {
    if (!playing) return
    const iv = setInterval(() => {
      setSimTime((t) => {
        const base = t ?? (plan ? new Date(plan.entries[0].departure).getTime() : Date.now())
        const next = base + SIM_BASE_RATE * simSpeed * 100
        if (simEnd && next >= simEnd) {
          setPlaying(false)
          return simEnd
        }
        return next
      })
    }, 100)
    return () => clearInterval(iv)
  }, [playing, simSpeed, simEnd, plan])

  const play = useCallback(() => {
    setSimTime((t) => t ?? (plan ? new Date(plan.entries[0].departure).getTime() : Date.now()))
    setPlaying(true)
  }, [plan])
  const pause = useCallback(() => setPlaying(false), [])
  const resetSim = useCallback(() => {
    setPlaying(false)
    setSimTime(null)
  }, [])

  // ---------- launch overlay ----------
  const [launchOpen, setLaunchOpen] = useState(false)

  const value = {
    state,
    prefs: state.prefs,
    setPrefs,
    savedAt,
    trip,
    trips: Object.values(state.trips),
    updateTrip,
    switchTrip,
    createNewTrip,
    deleteTrip,
    resetToDemo,
    importTrip,
    plan,
    routeStatus,
    familyRoutes,
    weather,
    weatherFor,
    selection,
    setSelection,
    sim: { simTime, playing, speed: simSpeed, setSpeed: setSimSpeed, play, pause, resetSim, setSimTime },
    launch: { open: launchOpen, show: () => setLaunchOpen(true), hide: () => setLaunchOpen(false) },
  }

  return <TripCtx.Provider value={value}>{children}</TripCtx.Provider>
}
