import React, { Suspense, lazy, useState } from 'react'
import { TripProvider, useTrip } from './state/TripContext.jsx'
import CommandBar from './components/CommandBar.jsx'
import IconSidebar from './components/IconSidebar.jsx'

// Lazy-loaded so the map (Leaflet) and drag-reorder (Framer Motion) code
// only ships to whoever actually opens a view that needs them, instead of
// bloating everyone's first paint.
const DashboardView = lazy(() => import('./views/DashboardView.jsx'))
const SetupView = lazy(() => import('./views/SetupView.jsx'))
const ActivitiesView = lazy(() => import('./views/ActivitiesView.jsx'))
const MealsView = lazy(() => import('./views/MealsView.jsx'))
const LodgingView = lazy(() => import('./views/LodgingView.jsx'))
const ExpensesView = lazy(() => import('./views/ExpensesView.jsx'))
const FamiliesView = lazy(() => import('./views/FamiliesView.jsx'))
const PackingView = lazy(() => import('./views/PackingView.jsx'))
const MissionLaunch = lazy(() => import('./overlays/MissionLaunch.jsx'))

const VIEWS = {
  dashboard: DashboardView,
  setup: SetupView,
  activities: ActivitiesView,
  meals: MealsView,
  lodging: LodgingView,
  expenses: ExpensesView,
  families: FamiliesView,
  packing: PackingView,
}

function ViewFallback() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--faint)', fontSize: 12 }}>
      Loading…
    </div>
  )
}

function Shell() {
  const { trip, launch } = useTrip()
  // First run / fresh trips land on the setup form, not an empty dashboard.
  const hasRoute = trip.stops.filter((s) => Number.isFinite(s.lat)).length >= 2
  const [view, setView] = useState(hasRoute ? 'dashboard' : 'setup')
  const View = VIEWS[view] || DashboardView
  return (
    <div className="app-shell">
      <CommandBar view={view} setView={setView} />
      <IconSidebar view={view} setView={setView} />
      <main className="view-root">
        <Suspense fallback={<ViewFallback />}>
          <View setView={setView} />
        </Suspense>
      </main>
      {launch.open && (
        <Suspense fallback={null}>
          <MissionLaunch />
        </Suspense>
      )}
    </div>
  )
}

export default function App() {
  return (
    <TripProvider>
      <Shell />
    </TripProvider>
  )
}
