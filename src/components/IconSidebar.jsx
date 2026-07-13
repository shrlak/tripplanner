import React from 'react'
import {
  LayoutGrid,
  Route,
  CalendarRange,
  UtensilsCrossed,
  Home,
  Receipt,
  Users,
} from 'lucide-react'

const NAV = [
  { id: 'dashboard', icon: LayoutGrid, label: 'Dashboard', title: 'Trip dashboard' },
  { id: 'setup', icon: Route, label: 'Setup', title: 'Route & trip setup' },
  { id: 'activities', icon: CalendarRange, label: 'Days', title: 'Day planner' },
  { id: 'meals', icon: UtensilsCrossed, label: 'Meals', title: 'Meal plan' },
  { id: 'lodging', icon: Home, label: 'Stays', title: 'Where you are staying' },
  { id: 'expenses', icon: Receipt, label: 'Costs', title: 'Expenses & split' },
  { id: 'families', icon: Users, label: 'Groups', title: 'Travel groups' },
]

export default function IconSidebar({ view, setView }) {
  return (
    <nav className="icon-sidebar">
      {NAV.map(({ id, icon: Icon, label, title }) => (
        <button
          key={id}
          className={`nav-btn${view === id ? ' active' : ''}`}
          title={title}
          aria-label={title}
          onClick={() => setView(id)}
        >
          <Icon size={16} />
          <span className="nav-label">{label}</span>
        </button>
      ))}
      <div className="sidebar-spacer" />
    </nav>
  )
}
