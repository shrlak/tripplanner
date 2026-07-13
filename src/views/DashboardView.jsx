import React from 'react'
import OpsRail from './dashboard/OpsRail.jsx'
import CommandMap from './dashboard/CommandMap.jsx'
import TimelineStrip from './dashboard/TimelineStrip.jsx'
import InspectorRail from './dashboard/InspectorRail.jsx'

export default function DashboardView({ setView }) {
  return (
    <div className="dashboard">
      <OpsRail />
      <CommandMap />
      <InspectorRail />
      <TimelineStrip setView={setView} />
    </div>
  )
}
