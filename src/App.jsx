import React, { useState } from 'react'
import { TripProvider, useTrip } from './state/TripContext.jsx'
import CommandBar from './components/CommandBar.jsx'
import IconSidebar from './components/IconSidebar.jsx'
import DashboardView from './views/DashboardView.jsx'
import SetupView from './views/SetupView.jsx'
import ActivitiesView from './views/ActivitiesView.jsx'
import MealsView from './views/MealsView.jsx'
import LodgingView from './views/LodgingView.jsx'
import ExpensesView from './views/ExpensesView.jsx'
import FamiliesView from './views/FamiliesView.jsx'
import MissionLaunch from './overlays/MissionLaunch.jsx'

const VIEWS = {
  dashboard: DashboardView,
  setup: SetupView,
  activities: ActivitiesView,
  meals: MealsView,
  lodging: LodgingView,
  expenses: ExpensesView,
  families: FamiliesView,
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
        <View setView={setView} />
      </main>
      {launch.open && <MissionLaunch />}
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
