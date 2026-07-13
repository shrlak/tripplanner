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
  { id: 'dashboard', icon: LayoutGrid, label: 'Command dashboard' },
  { id: 'setup', icon: Route, label: 'Route & trip setup' },
  { id: 'activities', icon: CalendarRange, label: 'Activity board' },
  { id: 'meals', icon: UtensilsCrossed, label: 'Meal logistics' },
  { id: 'lodging', icon: Home, label: 'Accommodations' },
  { id: 'expenses', icon: Receipt, label: 'Expenses' },
  { id: 'families', icon: Users, label: 'Travel units' },
]

export default function IconSidebar({ view, setView }) {
  return (
    <nav className="icon-sidebar">
      {NAV.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          className={`nav-btn${view === id ? ' active' : ''}`}
          title={label}
          aria-label={label}
          onClick={() => setView(id)}
        >
          <Icon size={17} />
        </button>
      ))}
      <div className="sidebar-spacer" />
    </nav>
  )
}
