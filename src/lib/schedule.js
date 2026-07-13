// Turns an ordered stop list + legs into a day-by-day schedule of arrival and
// departure ETAs. Driving that would land after DAY_END rolls the departure to
// DAY_START the next morning (an overnight at the previous stop), so long
// trips spread naturally across the date range.
import { addDays, addMinutes, addSeconds, differenceInCalendarDays, startOfDay } from 'date-fns'

export const DAY_START_HOUR = 9
export const DAY_END_HOUR = 20

function nextMorning(date) {
  const d = addDays(startOfDay(date), 1)
  d.setHours(DAY_START_HOUR, 0, 0, 0)
  return d
}

export function buildSchedule({ orderedStops, legs, startDateTime, endDateTime }) {
  const start = new Date(startDateTime)
  const end = new Date(endDateTime)
  const entries = []
  if (orderedStops.length === 0) {
    return { entries, days: [], totalDriveSec: 0, totalDistanceM: 0, overrun: false }
  }

  let cursor = new Date(start)
  entries.push({
    stopId: orderedStops[0].id,
    arrival: cursor.toISOString(),
    departure: cursor.toISOString(),
    overnightBefore: false,
  })

  let totalDriveSec = 0
  let totalDistanceM = 0

  for (let i = 0; i < legs.length; i++) {
    const leg = legs[i]
    totalDriveSec += leg.driveSec
    totalDistanceM += leg.distanceM

    let depart = new Date(entries[i].departure)
    let arrive = addSeconds(depart, leg.driveSec)
    let overnightBefore = false

    // If we'd arrive after the day-end cutoff, overnight at the previous stop
    // and leave at day-start next morning instead.
    const cutoff = new Date(depart)
    cutoff.setHours(DAY_END_HOUR, 0, 0, 0)
    if (arrive > cutoff && depart.getHours() >= DAY_START_HOUR) {
      depart = nextMorning(depart)
      arrive = addSeconds(depart, leg.driveSec)
      overnightBefore = true
      entries[i].departure = depart.toISOString()
    }

    const stop = orderedStops[i + 1]
    let departure = addMinutes(arrive, stop.dwellMin || 0)
    // Long dwells (overnights) can push the departure into the small hours —
    // snap those forward to the day-start hour instead of leaving at 4 AM.
    if (departure.getHours() >= DAY_END_HOUR) {
      departure = nextMorning(departure)
    } else if (departure.getHours() < DAY_START_HOUR && departure > arrive) {
      departure = new Date(departure)
      departure.setHours(DAY_START_HOUR, 0, 0, 0)
    }
    entries.push({
      stopId: stop.id,
      arrival: arrive.toISOString(),
      departure: departure.toISOString(),
      overnightBefore,
    })
    cursor = departure
  }

  const lastArrival = new Date(entries[entries.length - 1].arrival)
  const overrun = lastArrival > end

  const lastDay = lastArrival > end ? lastArrival : end
  const dayCount = Math.max(1, differenceInCalendarDays(startOfDay(lastDay), startOfDay(start)) + 1)
  const days = Array.from({ length: dayCount }, (_, i) => addDays(startOfDay(start), i))

  return { entries, days, totalDriveSec, totalDistanceM, overrun }
}

export function dayIndexOf(dateISO, days) {
  if (!days?.length || !dateISO) return 0
  return differenceInCalendarDays(startOfDay(new Date(dateISO)), days[0])
}
