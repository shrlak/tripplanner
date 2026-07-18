import { describe, it, expect } from 'vitest'
import { buildSchedule, DAY_START_HOUR } from './schedule.js'

// Build an ISO string from local wall-clock components so assertions stay
// correct regardless of the machine's timezone — buildSchedule round-trips
// through `new Date(iso)` and reads local hours back out.
const local = (y, m, d, h = 0, mi = 0) => new Date(y, m, d, h, mi, 0, 0).toISOString()

describe('buildSchedule', () => {
  it('returns an empty schedule for no stops', () => {
    const result = buildSchedule({
      orderedStops: [],
      legs: [],
      startDateTime: local(2026, 6, 20, 9),
      endDateTime: local(2026, 6, 22, 18),
    })
    expect(result).toEqual({ entries: [], days: [], totalDriveSec: 0, totalDistanceM: 0, overrun: false })
  })

  it('schedules a same-day leg without an overnight hold', () => {
    const stops = [{ id: 'a', dwellMin: 0 }, { id: 'b', dwellMin: 30 }]
    const legs = [{ driveSec: 2 * 3600, distanceM: 100000 }]
    const result = buildSchedule({
      orderedStops: stops,
      legs,
      startDateTime: local(2026, 6, 20, 10),
      endDateTime: local(2026, 6, 22, 18),
    })

    expect(result.entries).toHaveLength(2)
    expect(result.entries[1].overnightBefore).toBe(false)
    expect(new Date(result.entries[1].arrival).getHours()).toBe(12) // 10 AM + 2h drive
    expect(result.totalDriveSec).toBe(2 * 3600)
    expect(result.totalDistanceM).toBe(100000)
    expect(result.overrun).toBe(false)
    expect(result.days).toHaveLength(3) // Jul 20, 21, 22
  })

  it('rolls a late-arriving leg to next-morning departure instead of a night arrival', () => {
    const stops = [{ id: 'a', dwellMin: 0 }, { id: 'b', dwellMin: 0 }]
    // Departing at 6 PM, an 8-hour drive would land at 2 AM — past the
    // day-end cutoff — so the leg should hold overnight and leave at
    // DAY_START_HOUR the next morning instead.
    const legs = [{ driveSec: 8 * 3600, distanceM: 500000 }]
    const result = buildSchedule({
      orderedStops: stops,
      legs,
      startDateTime: local(2026, 6, 20, 18),
      endDateTime: local(2026, 6, 25, 18),
    })

    expect(result.entries[1].overnightBefore).toBe(true)
    const pushedDeparture = new Date(result.entries[0].departure)
    expect(pushedDeparture.getHours()).toBe(DAY_START_HOUR)
    expect(pushedDeparture.getDate()).toBe(21)
    expect(new Date(result.entries[1].arrival).getHours()).toBe(DAY_START_HOUR + 8)
  })

  it('flags overrun when the schedule runs past the trip end date', () => {
    const stops = [{ id: 'a', dwellMin: 0 }, { id: 'b', dwellMin: 0 }]
    const legs = [{ driveSec: 3 * 3600, distanceM: 200000 }]
    const result = buildSchedule({
      orderedStops: stops,
      legs,
      startDateTime: local(2026, 6, 20, 10),
      endDateTime: local(2026, 6, 20, 12), // ends before the 3-hour drive completes
    })

    expect(result.overrun).toBe(true)
  })

  it('sums drive time and distance across multiple legs', () => {
    const stops = [{ id: 'a', dwellMin: 0 }, { id: 'b', dwellMin: 0 }, { id: 'c', dwellMin: 0 }]
    const legs = [
      { driveSec: 3600, distanceM: 50000 },
      { driveSec: 1800, distanceM: 20000 },
    ]
    const result = buildSchedule({
      orderedStops: stops,
      legs,
      startDateTime: local(2026, 6, 20, 9),
      endDateTime: local(2026, 6, 22, 18),
    })
    expect(result.totalDriveSec).toBe(5400)
    expect(result.totalDistanceM).toBe(70000)
  })
})
