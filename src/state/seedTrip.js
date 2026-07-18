// Demo trip shown on first load: a classic coastal city-to-city road trip
// with hotels, sights, and restaurants — the kind of plan the app is for.
// Dates are generated relative to "today" so the weather intel always has a
// real forecast to show.
import { createTrip, createStop, createFamily } from './tripModel.js'

function upcoming(dayOffset, hour, minute = 0) {
  const d = new Date()
  d.setDate(d.getDate() + dayOffset)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

export function buildSeedTrip() {
  const origin = createStop({
    name: 'San Francisco',
    address: 'San Francisco, CA',
    lat: 37.7749,
    lon: -122.4194,
    kind: 'origin',
    dwellMin: 0,
  })
  const boardwalk = createStop({
    name: 'Santa Cruz Beach Boardwalk',
    address: '400 Beach St, Santa Cruz, CA 95060',
    lat: 36.9641,
    lon: -122.0177,
    kind: 'poi',
    dwellMin: 90,
    notes: 'Classic seaside amusement park. Good first leg-stretch and lunch stop.',
  })
  const montereyStay = createStop({
    name: 'Monterey Bayfront Hotel',
    address: 'Cannery Row, Monterey, CA 93940',
    lat: 36.6177,
    lon: -121.9016,
    kind: 'stopover',
    dwellMin: 16 * 60,
    notes: 'Night one. Walkable to Cannery Row and the aquarium — do the aquarium first thing tomorrow.',
    checklist: [{ id: 'c1', text: 'Book aquarium tickets online (cheaper)', done: false }],
  })
  const mcway = createStop({
    name: 'McWay Falls Overlook',
    address: 'Julia Pfeiffer Burns State Park, Big Sur, CA',
    lat: 36.1578,
    lon: -121.6722,
    kind: 'poi',
    dwellMin: 45,
    notes: 'Short walk to the overlook. Cell service is spotty along Highway 1 — download maps offline.',
  })
  const sloStay = createStop({
    name: 'San Luis Obispo Inn',
    address: 'San Luis Obispo, CA 93401',
    lat: 35.2828,
    lon: -120.6596,
    kind: 'stopover',
    dwellMin: 15 * 60,
    notes: 'Night two. Downtown is walkable — Thursday farmers market if the timing lines up.',
  })
  const wharf = createStop({
    name: 'Stearns Wharf',
    address: 'Santa Barbara, CA 93101',
    lat: 34.4108,
    lon: -119.6863,
    kind: 'poi',
    dwellMin: 75,
    notes: 'Waterfront lunch stop before the final leg into LA.',
  })
  const la = createStop({
    name: 'Los Angeles',
    address: 'Los Angeles, CA',
    lat: 34.0522,
    lon: -118.2437,
    kind: 'destination',
    dwellMin: 0,
    notes: 'Trip ends here. Return rental car by 6 PM if applicable.',
  })

  const northCrew = createFamily({
    name: 'North crew',
    color: '#0071e3',
    size: '2 adults, 1 kid',
    vehicle: 'SUV',
    origin: { name: 'San Francisco, CA', lat: 37.7749, lon: -122.4194 },
  })
  const southCrew = createFamily({
    name: 'South crew',
    color: '#1a7f37',
    size: '2 adults',
    vehicle: 'Sedan',
    origin: { name: 'San Diego, CA', lat: 32.7157, lon: -117.1611 },
  })

  const trip = createTrip({
    name: 'Pacific Coast Road Trip',
    startDateTime: upcoming(1, 9, 0),
    endDateTime: upcoming(3, 20, 0),
    stops: [origin, boardwalk, montereyStay, mcway, sloStay, wharf, la],
    families: [northCrew, southCrew],
    manualOrder: [boardwalk.id, montereyStay.id, mcway.id, sloStay.id, wharf.id],
  })

  trip.activities = [
    {
      id: 'a1',
      title: 'Drive day + hotel check-in',
      dayIdx: 0,
      window: 'afternoon',
      status: 'go',
      stopId: montereyStay.id,
      description:
        'Day one goal is simple: get to Monterey, check in, and end with an easy reservation-backed dinner near the hotel.',
      fallback: 'If traffic is bad, skip the boardwalk rides and just do the lunch stop.',
      notes: '',
    },
    {
      id: 'a2',
      title: 'Aquarium morning',
      dayIdx: 1,
      window: 'morning',
      status: 'go',
      stopId: montereyStay.id,
      description: 'Monterey Bay Aquarium right at opening, before the crowds. Two hours, then hit the road south.',
      fallback: 'If tickets sell out, do the Cannery Row waterfront walk and tide pools instead.',
      notes: '',
    },
    {
      id: 'a3',
      title: 'Highway 1 scenic drive',
      dayIdx: 1,
      window: 'afternoon',
      status: 'watch',
      stopId: mcway.id,
      description:
        'The Big Sur stretch — slow, winding, spectacular. McWay Falls is the anchor stop; add Bixby Bridge if everyone is fresh.',
      fallback: 'If Highway 1 has a closure, reroute via US-101 and swap in a Paso Robles stop.',
      notes: '',
    },
    {
      id: 'a4',
      title: 'Beach + wharf afternoon',
      dayIdx: 2,
      window: 'afternoon',
      status: 'go',
      stopId: wharf.id,
      description: 'Santa Barbara waterfront lunch and a beach hour before the last leg into LA.',
      fallback: 'Running late? Make it a quick pier walk and eat on the road.',
      notes: '',
    },
  ]

  trip.meals = [
    {
      id: 'm1',
      title: 'Cannery Row dinner',
      dayIdx: 0,
      time: '18:30',
      type: 'reservation',
      ownerId: northCrew.id,
      location: 'Cannery Row, Monterey, CA',
      notes: 'First-night dinner should be frictionless — book somewhere walkable from the hotel.',
    },
    {
      id: 'm2',
      title: 'Hotel breakfast',
      dayIdx: 1,
      time: '08:00',
      type: 'cook-in',
      ownerId: northCrew.id,
      location: 'Monterey Bayfront Hotel',
      notes: 'Included with the room. Eat early to make the aquarium at opening.',
    },
    {
      id: 'm3',
      title: 'Packed Big Sur picnic',
      dayIdx: 1,
      time: '13:00',
      type: 'pack-out',
      ownerId: southCrew.id,
      location: 'Big Sur pullout',
      notes: 'No reliable food stops on the scenic stretch — buy supplies in Monterey before leaving.',
    },
    {
      id: 'm4',
      title: 'Downtown SLO dinner',
      dayIdx: 1,
      time: '19:00',
      type: 'walk-in',
      ownerId: southCrew.id,
      location: 'Higuera St, San Luis Obispo, CA',
      notes: 'Plenty of options downtown — keep it flexible.',
    },
    {
      id: 'm5',
      title: 'Stearns Wharf lunch',
      dayIdx: 2,
      time: '12:30',
      type: 'walk-in',
      ownerId: northCrew.id,
      location: 'Stearns Wharf, Santa Barbara, CA',
      notes: 'Seafood on the pier before the final leg.',
    },
  ]

  trip.lodging = [
    {
      id: 'l1',
      name: 'Monterey Bayfront Hotel',
      stopId: montereyStay.id,
      address: 'Cannery Row, Monterey, CA 93940',
      checkInDayIdx: 0,
      checkOutDayIdx: 1,
      confirmation: 'MBH-88213',
      notes: 'Check-in after 3 PM. Parking is $30/night — street parking fills up by 5.',
    },
    {
      id: 'l2',
      name: 'San Luis Obispo Inn',
      stopId: sloStay.id,
      address: 'San Luis Obispo, CA 93401',
      checkInDayIdx: 1,
      checkOutDayIdx: 2,
      confirmation: 'SLO-4417',
      notes: 'Front desk closes at 10 PM — call ahead if arriving late.',
    },
  ]

  trip.expenses = [
    { id: 'e1', desc: 'Monterey hotel (1 night)', amount: 289, payerId: northCrew.id, category: 'lodging', dayIdx: 0 },
    { id: 'e2', desc: 'SLO inn (1 night)', amount: 214, payerId: southCrew.id, category: 'lodging', dayIdx: 1 },
    { id: 'e3', desc: 'Aquarium tickets', amount: 165, payerId: northCrew.id, category: 'activities', dayIdx: 1 },
    { id: 'e4', desc: 'Gas + tolls', amount: 96, payerId: southCrew.id, category: 'fuel', dayIdx: 1 },
    { id: 'e5', desc: 'Picnic groceries', amount: 54, payerId: southCrew.id, category: 'food', dayIdx: 1 },
  ]

  return trip
}
