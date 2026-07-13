// Sanitized demo trip, in the spirit of the reference project's public data.
// Dates are generated relative to "today" so the weather intel always has a
// real forecast to show on first load.
import { createTrip, createStop, createFamily } from './tripModel.js'

function upcoming(dayOffset, hour, minute = 0) {
  const d = new Date()
  d.setDate(d.getDate() + dayOffset)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

export function buildSeedTrip() {
  const origin = createStop({
    name: 'San Francisco Staging',
    address: 'San Francisco, CA',
    lat: 37.7749,
    lon: -122.4194,
    kind: 'origin',
    dwellMin: 0,
  })
  const cheese = createStop({
    name: 'Oakdale Cheese & Specialties',
    address: '10040 CA-120, Oakdale, CA 95361',
    lat: 37.7592,
    lon: -120.8180,
    kind: 'poi',
    dwellMin: 45,
    notes:
      'Strong shared stop on the Highway 120 approach: grilled cheese, picnic tables, animal pens, bathrooms, and enough room for the kids to reset before the final leg.',
    checklist: [{ id: 'c1', text: 'Road snacks secured', done: true }],
  })
  const rainbow = createStop({
    name: 'Rainbow Pool Day Use Area',
    address: 'CA-120, Groveland, CA 95321',
    lat: 37.8144,
    lon: -120.0080,
    kind: 'poi',
    dwellMin: 60,
    notes: 'Short waterfall stop right off 120. Good leg-stretch before basecamp.',
  })
  const basecamp = createStop({
    name: 'Pine Mountain Lake Basecamp',
    address: 'Pine Mountain Lake, Groveland, CA 95321',
    lat: 37.8574,
    lon: -120.1750,
    kind: 'stopover',
    dwellMin: 16 * 60,
    notes:
      'Shared Groveland-area basecamp used as the trip staging point for arrival, reset, and departure windows.',
    checklist: [{ id: 'c2', text: 'Confirm gate access and arrival sequence', done: false }],
  })
  const yosemite = createStop({
    name: 'Yosemite Valley',
    address: 'Yosemite National Park, El Portal, CA',
    lat: 37.7456,
    lon: -119.5936,
    kind: 'destination',
    dwellMin: 0,
    notes: 'Primary excursion objective. Keep lunch packed and hit a sensible dinner stop on the way back.',
  })

  const parkers = createFamily({
    name: 'Parkers',
    color: '#d29922',
    size: '2 adults, 1 kid',
    vehicle: 'SUV',
    origin: { name: 'Los Angeles, CA', lat: 34.0522, lon: -118.2437 },
  })
  const jiangs = createFamily({
    name: 'Jiangs',
    color: '#58a6ff',
    size: '2 adults, 1 kid',
    vehicle: 'Minivan',
    origin: { name: 'San Francisco, CA', lat: 37.7749, lon: -122.4194 },
  })
  const riveras = createFamily({
    name: 'Riveras',
    color: '#3fb950',
    size: '2 adults, 2 kids',
    vehicle: 'Crossover',
    origin: { name: 'Reno, NV', lat: 39.5296, lon: -119.8138 },
  })

  const trip = createTrip({
    name: 'SIERRA BASECAMP OP',
    startDateTime: upcoming(1, 9, 0),
    endDateTime: upcoming(4, 18, 0),
    stops: [origin, cheese, rainbow, basecamp, yosemite],
    families: [parkers, jiangs, riveras],
    manualOrder: [cheese.id, rainbow.id, basecamp.id],
  })

  trip.activities = [
    {
      id: 'a1',
      title: 'Transit + settle in',
      dayIdx: 0,
      window: 'afternoon',
      status: 'go',
      stopId: basecamp.id,
      description:
        'Families move on day one. First-night goal is arrival, check-in, kid decompression, and an easy reservation-backed dinner.',
      fallback: 'If traffic spikes, shift to minimum-viable check-in and keep the first-night setup light.',
      notes: '',
    },
    {
      id: 'a2',
      title: 'Basecamp reset day',
      dayIdx: 1,
      window: 'all day',
      status: 'go',
      stopId: basecamp.id,
      description:
        'Keep day two local. One lunch outing, no evening convoy, and enough slack to absorb late arrivals without scrambling the rest of the trip.',
      fallback: 'If timing drifts, skip the lunch run and keep the whole day centered on basecamp and the lake area.',
      notes: '',
    },
    {
      id: 'a3',
      title: 'Yosemite day',
      dayIdx: 2,
      window: 'early start',
      status: 'watch',
      stopId: yosemite.id,
      description:
        'Primary excursion day. Use Big Oak Flat as the actual route anchor, keep lunch packed, and hit a sensible Groveland dinner stop on the way back.',
      fallback: 'If park conditions drift, trim Yosemite dwell time and preserve the return-drive dinner stop.',
      notes: '',
    },
    {
      id: 'a4',
      title: 'Return home',
      dayIdx: 3,
      window: 'morning',
      status: 'go',
      stopId: null,
      description: 'Pack, cabin reset, brunch, and staggered drive-home windows.',
      fallback: 'Pre-pack the night before to reduce the morning chaos tax.',
      notes: '',
    },
  ]

  trip.meals = [
    {
      id: 'm1',
      title: 'The Grill at Pine Mountain Lake',
      dayIdx: 0,
      time: '18:00',
      type: 'reservation',
      ownerId: jiangs.id,
      location: 'Pine Mountain Lake Country Club, Groveland, CA',
      notes: 'First-night dinner should stay frictionless so arrival, gate access, and room setup do not cascade into everyone else.',
    },
    {
      id: 'm2',
      title: 'Basecamp breakfast',
      dayIdx: 1,
      time: '08:00',
      type: 'cook-in',
      ownerId: parkers.id,
      location: 'Pine Mountain Lake Basecamp',
      notes: 'Shared basecamp meal.',
    },
    {
      id: 'm3',
      title: 'Packed Yosemite lunch',
      dayIdx: 2,
      time: '12:30',
      type: 'pack-out',
      ownerId: riveras.id,
      location: 'Big Oak Flat entrance',
      notes: 'Park day lunch. Pack the night before.',
    },
    {
      id: 'm4',
      title: 'Groveland return dinner',
      dayIdx: 2,
      time: '18:30',
      type: 'walk-in',
      ownerId: jiangs.id,
      location: 'Groveland, CA',
      notes: 'Return-drive dinner. Keep it flexible.',
    },
    {
      id: 'm5',
      title: 'Basecamp brunch before departure',
      dayIdx: 3,
      time: '09:00',
      type: 'cook-in',
      ownerId: parkers.id,
      location: 'Pine Mountain Lake Basecamp',
      notes: 'Clear the fridge.',
    },
  ]

  trip.lodging = [
    {
      id: 'l1',
      name: 'Basecamp cabin',
      stopId: basecamp.id,
      address: 'Pine Mountain Lake, Groveland, CA 95321',
      checkInDayIdx: 0,
      checkOutDayIdx: 3,
      confirmation: 'PML-4402',
      notes: 'Check-in after 4:00 PM. Check out before 11:00 AM. Gate code shared in the group thread.',
    },
  ]

  trip.expenses = [
    { id: 'e1', desc: 'Basecamp cabin (3 nights)', amount: 940, payerId: parkers.id, category: 'lodging', dayIdx: 0 },
    { id: 'e2', desc: 'Group grocery run', amount: 212.4, payerId: jiangs.id, category: 'food', dayIdx: 0 },
    { id: 'e3', desc: 'First-night dinner', amount: 186, payerId: riveras.id, category: 'food', dayIdx: 0 },
    { id: 'e4', desc: 'Park entry (3 vehicles)', amount: 105, payerId: parkers.id, category: 'activities', dayIdx: 2 },
    { id: 'e5', desc: 'Firewood + ice', amount: 38, payerId: riveras.id, category: 'supplies', dayIdx: 1 },
  ]

  return trip
}
