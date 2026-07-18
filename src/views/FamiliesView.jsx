import React from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useTrip } from '../state/TripContext.jsx'
import { createFamily, FAMILY_COLORS } from '../state/tripModel.js'
import LocationSearch from '../components/LocationSearch.jsx'
import { fmtDuration } from '../lib/format.js'

export default function FamiliesView() {
  const { trip, updateTrip, familyRoutes } = useTrip()

  const patch = (id, p) =>
    updateTrip((t) => ({ ...t, families: t.families.map((f) => (f.id === id ? { ...f, ...p } : f)) }))

  return (
    <div style={{ padding: 18, overflowY: 'auto', height: '100%' }}>
      <div className="section-label">Who's coming</div>
      <div className="panel-title" style={{ marginBottom: 14 }}>
        Travel groups <span style={{ color: 'var(--faint)', fontSize: 11, fontWeight: 400 }}>· {trip.families.length} tracked</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: 14, maxWidth: 1200 }}>
        {trip.families.map((f) => {
          const fr = familyRoutes.find((r) => r.familyId === f.id)
          return (
            <div key={f.id} className="panel" style={{ borderTop: `2px solid ${f.color}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <input
                  className="input"
                  style={{ fontSize: 15, fontWeight: 800, color: f.color, width: '65%' }}
                  value={f.name}
                  placeholder="Group name"
                  onChange={(e) => patch(f.id, { name: e.target.value })}
                />
                <button
                  className="icon-btn danger"
                  onClick={() => updateTrip((t) => ({ ...t, families: t.families.filter((x) => x.id !== f.id) }))}
                >
                  <Trash2 size={13} />
                </button>
              </div>

              <div className="form-row" style={{ marginTop: 10 }}>
                <div>
                  <label className="field-label">Headcount</label>
                  <input className="input" value={f.size} onChange={(e) => patch(f.id, { size: e.target.value })} />
                </div>
                <div>
                  <label className="field-label">Vehicle</label>
                  <input className="input" value={f.vehicle} onChange={(e) => patch(f.id, { vehicle: e.target.value })} />
                </div>
              </div>

              <div style={{ marginTop: 10 }}>
                <label className="field-label">Origin city</label>
                {f.origin ? (
                  <div className="stop-row">
                    <div className="stop-name">
                      <div className="n">{f.origin.name}</div>
                      {fr && <div className="a">{fmtDuration(fr.driveSec)} to destination</div>}
                    </div>
                    <button className="icon-btn danger" onClick={() => patch(f.id, { origin: null })}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                ) : (
                  <LocationSearch
                    placeholder="Search origin city…"
                    onSelect={(p) => patch(f.id, { origin: { name: p.name, lat: p.lat, lon: p.lon } })}
                  />
                )}
              </div>

              <div style={{ marginTop: 10 }}>
                <label className="field-label">Route color</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {FAMILY_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => patch(f.id, { color: c })}
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        background: c,
                        border: '2px solid #fff',
                        boxShadow: f.color === c ? '0 0 0 2px var(--text)' : '0 0 0 1px var(--border-strong)',
                        cursor: 'pointer',
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )
        })}

        <button
          className="panel"
          style={{ borderStyle: 'dashed', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--muted)', minHeight: 120 }}
          onClick={() =>
            updateTrip((t) => ({
              ...t,
              families: [
                ...t.families,
                createFamily({ name: `Group ${t.families.length + 1}`, color: FAMILY_COLORS[t.families.length % FAMILY_COLORS.length] }),
              ],
            }))
          }
        >
          <Plus size={15} /> Add travel group
        </button>
      </div>
    </div>
  )
}
