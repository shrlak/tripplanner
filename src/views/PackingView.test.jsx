import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import PackingView from './PackingView.jsx'
import { TripProvider } from '../state/TripContext.jsx'
import { createTrip, createFamily } from '../state/tripModel.js'

const STORAGE_KEY = 'trip-command-center-v1'

// Seeds a minimal trip with no stops, so TripProvider's route/weather
// effects short-circuit instead of hitting the network from jsdom.
function seedMinimalTrip(overrides = {}) {
  const trip = createTrip({ families: [createFamily({ name: 'Test crew' })], ...overrides })
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      trips: { [trip.id]: trip },
      activeTripId: trip.id,
      prefs: { tempUnit: 'F', distUnit: 'mi', mapMode: 'light', theme: 'light' },
    }),
  )
  return trip
}

function renderPacking() {
  return render(
    <TripProvider>
      <PackingView />
    </TripProvider>,
  )
}

describe('PackingView', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('shows an empty state with a one-click starter list', () => {
    seedMinimalTrip()
    renderPacking()
    expect(screen.getByText(/nothing on the list yet/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /add trip essentials/i }))

    expect(screen.queryByText(/nothing on the list yet/i)).not.toBeInTheDocument()
    expect(screen.getByText('Phone charger')).toBeInTheDocument()
    expect(screen.getByText('ID / passport')).toBeInTheDocument()
  })

  it('does not duplicate starter items already on the list', () => {
    seedMinimalTrip({
      packing: [{ id: 'x', text: 'Phone charger', category: 'Electronics', qty: 1, assignedTo: null, packed: false }],
    })
    renderPacking()

    fireEvent.click(screen.getByRole('button', { name: /add trip essentials/i }))

    expect(screen.getAllByText('Phone charger')).toHaveLength(1)
  })

  it('tracks packed progress as items are checked', () => {
    seedMinimalTrip({
      packing: [
        { id: 'a', text: 'Sunscreen', category: 'Toiletries', qty: 1, assignedTo: null, packed: false },
        { id: 'b', text: 'Passport', category: 'Documents', qty: 1, assignedTo: null, packed: false },
      ],
    })
    renderPacking()
    expect(screen.getByText('0%')).toBeInTheDocument()

    fireEvent.click(screen.getAllByRole('checkbox')[0])

    expect(screen.getByText('50%')).toBeInTheDocument()
    expect(screen.getByText('1 of 2 items packed')).toBeInTheDocument()
  })

  it('removes an item from the list', () => {
    seedMinimalTrip({
      packing: [{ id: 'a', text: 'Sunscreen', category: 'Toiletries', qty: 1, assignedTo: null, packed: false }],
    })
    renderPacking()
    expect(screen.getByText('Sunscreen')).toBeInTheDocument()

    fireEvent.click(screen.getByTitle('Remove item'))

    expect(screen.queryByText('Sunscreen')).not.toBeInTheDocument()
    expect(screen.getByText(/nothing on the list yet/i)).toBeInTheDocument()
  })
})
