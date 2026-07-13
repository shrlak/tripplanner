import React, { useState } from 'react'
import { Plus, MapPin, Trash2 } from 'lucide-react'
import { useTrip } from '../state/TripContext.jsx'
import { uid, MEAL_TYPES, MEAL_TYPE_LABELS } from '../state/tripModel.js'
import { fmtDayLabel } from '../lib/format.js'
import { tripDays } from './ActivitiesView.jsx'

const typeChip = {
  'cook-in': 'green',
  reservation: 'amber',
  'pack-out': 'blue',
  'walk-in': '',
}

function fmtClock(hhmm) {
  if (!hhmm) return ''
  const [h, m] = hhmm.split(':').map(Number)
  const am = h < 12
  const hr = h % 12 === 0 ? 12 : h % 12
  return `${hr}:${String(m).padStart(2, '0')} ${am ? 'AM' : 'PM'}`
}

export default function MealsView() {
  const { trip, updateTrip } = useTrip()
  const days = tripDays(trip)
  const [selectedId, setSelectedId] = useState(trip.meals[0]?.id ?? null)
  const [form, setForm] = useState({ title: '', dayIdx: 0, time: '18:00', type: 'cook-in', location: '' })

  const meals = trip.meals.slice().sort((a, b) => a.dayIdx - b.dayIdx || a.time.localeCompare(b.time))
  const selected = trip.meals.find((m) => m.id === selectedId) || null
  const familyById = new Map(trip.families.map((f) => [f.id, f]))

  const patchMeal = (id, patch) =>
    updateTrip((t) => ({ ...t, meals: t.meals.map((m) => (m.id === id ? { ...m, ...patch } : m)) }))

  const addMeal = () => {
    if (!form.title.trim()) return
    const m = { id: uid(), ownerId: trip.families[0]?.id ?? null, notes: '', ...form, title: form.title.trim() }
    updateTrip((t) => ({ ...t, meals: [...t.meals, m] }))
    setForm({ title: '', dayIdx: 0, time: '18:00', type: 'cook-in', location: '' })
    setSelectedId(m.id)
  }

  const dayLabel = (idx) => (days[idx] ? fmtDayLabel(days[idx]) : `DAY ${idx + 1}`)

  return (
    <div className="board">
      <div className="board-list" style={{ minWidth: 0 }}>
        <div>
          <div className="section-label">Meals</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span className="panel-title">Meal plan</span>
            <span style={{ fontSize: 10, color: 'var(--faint)' }}>ownership + prep</span>
          </div>
        </div>

        {meals.map((m) => (
          <div key={m.id} className={`mission-card${m.id === selectedId ? ' selected' : ''}`} onClick={() => setSelectedId(m.id)}>
            <div className="mc-head">
              <span className="mono" style={{ fontSize: 10, color: 'var(--muted)' }}>
                {dayLabel(m.dayIdx)} {fmtClock(m.time)}
              </span>
              <span className={`chip ${typeChip[m.type] || ''}`}>{MEAL_TYPE_LABELS[m.type] || m.type}</span>
            </div>
            <div className="mc-title" style={{ marginTop: 4 }}>{m.title}</div>
            <button
              className="icon-btn danger card-del"
              title="Remove meal"
              onClick={(e) => {
                e.stopPropagation()
                updateTrip((t) => ({ ...t, meals: t.meals.filter((x) => x.id !== m.id) }))
                if (selectedId === m.id) setSelectedId(null)
              }}
            >
              <Trash2 size={12} />
            </button>
            <div className="mc-window">{m.location || 'Location TBD'}</div>
            {m.ownerId && familyById.get(m.ownerId) && (
              <div style={{ fontSize: 10, color: familyById.get(m.ownerId).color, marginTop: 4 }}>
                {familyById.get(m.ownerId).name} owns
              </div>
            )}
          </div>
        ))}
        {meals.length === 0 && <div className="empty-note">No meals planned.</div>}

        <div className="panel" style={{ marginTop: 'auto' }}>
          <div className="section-label muted-label">Add meal</div>
          <input className="input" placeholder="Meal title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <div className="form-row" style={{ marginTop: 6 }}>
            <select className="input" value={form.dayIdx} onChange={(e) => setForm({ ...form, dayIdx: Number(e.target.value) })}>
              {days.map((d, i) => (
                <option key={i} value={i}>{fmtDayLabel(d)}</option>
              ))}
            </select>
            <input type="time" className="input" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
          </div>
          <div className="form-row" style={{ marginTop: 6 }}>
            <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {MEAL_TYPES.map((t) => (
                <option key={t} value={t}>{MEAL_TYPE_LABELS[t]}</option>
              ))}
            </select>
          </div>
          <input className="input" style={{ marginTop: 6 }} placeholder="Venue / location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          <button className="btn primary" style={{ width: '100%', marginTop: 8 }} onClick={addMeal}>
            <Plus size={12} /> Add meal
          </button>
        </div>
      </div>

      <div className="board-main">
        {selected ? (
          <>
            <div className="panel">
              <div className="section-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                Meal details
                <span className={`chip ${typeChip[selected.type] || ''}`}>{MEAL_TYPE_LABELS[selected.type] || selected.type}</span>
              </div>
              <h2 style={{ margin: '4px 0 2px', fontSize: 22, textTransform: 'uppercase', letterSpacing: '.02em' }}>
                {selected.title}
              </h2>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                {dayLabel(selected.dayIdx)} at {fmtClock(selected.time)} · {MEAL_TYPE_LABELS[selected.type] || selected.type}
              </div>
            </div>

            <div className="panel">
              <div className="section-label">Venue</div>
              <label className="field-label"><MapPin size={10} style={{ marginRight: 4 }} />Location</label>
              <input className="input" value={selected.location} placeholder="Venue address or description" onChange={(e) => patchMeal(selected.id, { location: e.target.value })} />
              <div className="form-row" style={{ marginTop: 10 }}>
                <div>
                  <label className="field-label">Day</label>
                  <select className="input" value={selected.dayIdx} onChange={(e) => patchMeal(selected.id, { dayIdx: Number(e.target.value) })}>
                    {days.map((d, i) => (
                      <option key={i} value={i}>{fmtDayLabel(d)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="field-label">Time</label>
                  <input type="time" className="input" value={selected.time} onChange={(e) => patchMeal(selected.id, { time: e.target.value })} />
                </div>
                <div>
                  <label className="field-label">Owner</label>
                  <select className="input" value={selected.ownerId || ''} onChange={(e) => patchMeal(selected.id, { ownerId: e.target.value || null })}>
                    <option value="">Unassigned</option>
                    {trip.families.map((f) => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                {MEAL_TYPES.map((t) => (
                  <button key={t} className={`family-chip${selected.type === t ? ' active' : ''}`} onClick={() => patchMeal(selected.id, { type: t })}>
                    {MEAL_TYPE_LABELS[t]}
                  </button>
                ))}
                <button
                  className="btn sm danger ghost"
                  style={{ marginLeft: 'auto' }}
                  onClick={() => {
                    updateTrip((t) => ({ ...t, meals: t.meals.filter((m) => m.id !== selected.id) }))
                    setSelectedId(null)
                  }}
                >
                  Remove
                </button>
              </div>
            </div>

            <div className="panel">
              <div className="section-label">Notes</div>
              <textarea
                className="input"
                placeholder="Capture grocery strategy, allergy notes, kid fallback meals, or timing calls for restaurant stops…"
                value={selected.notes}
                onChange={(e) => patchMeal(selected.id, { notes: e.target.value })}
              />
            </div>
          </>
        ) : (
          <div className="empty-note" style={{ marginTop: 40 }}>Select a meal to see its details.</div>
        )}
      </div>

      <div className="board-inspector">
        {selected && (
          <div className="panel">
            <div className="section-label">Selected meal</div>
            <div className="kv-row"><span className="k">Window</span><span className="v">{dayLabel(selected.dayIdx)} {fmtClock(selected.time)}</span></div>
            <div className="kv-row"><span className="k">Type</span><span className="v">{selected.type}</span></div>
            <div className="kv-row"><span className="k">Owner</span><span className="v">{familyById.get(selected.ownerId)?.name || 'Unassigned'}</span></div>
            {selected.location && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8 }}>{selected.location}</div>}
            {selected.notes && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8 }}>{selected.notes}</div>}
          </div>
        )}
      </div>
    </div>
  )
}
