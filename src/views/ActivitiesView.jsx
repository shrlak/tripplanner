import React, { useMemo, useState } from 'react'
import { eachDayOfInterval, startOfDay, addDays } from 'date-fns'
import { Plus, MapPin, Search, Settings2, AlertTriangle, Clock, Trash2 } from 'lucide-react'
import { useTrip } from '../state/TripContext.jsx'
import { uid, ACTIVITY_WINDOWS, ACTIVITY_STATUS } from '../state/tripModel.js'
import { fmtDayLabel } from '../lib/format.js'

export function tripDays(trip) {
  const start = startOfDay(new Date(trip.startDateTime))
  const end = startOfDay(new Date(trip.endDateTime))
  return eachDayOfInterval({ start, end: end < start ? addDays(start, 1) : end })
}

const statusChip = { go: 'green', watch: 'amber', hold: 'red' }

export default function ActivitiesView() {
  const { trip, updateTrip } = useTrip()
  const days = tripDays(trip)
  const [selectedId, setSelectedId] = useState(trip.activities[0]?.id ?? null)
  const [form, setForm] = useState({ title: '', dayIdx: 0, window: 'flexible', description: '' })

  const selected = trip.activities.find((a) => a.id === selectedId) || null
  const stopById = useMemo(() => new Map(trip.stops.map((s) => [s.id, s])), [trip.stops])

  const patchActivity = (id, patch) =>
    updateTrip((t) => ({
      ...t,
      activities: t.activities.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    }))

  const addActivity = () => {
    if (!form.title.trim()) return
    const a = { id: uid(), status: 'go', stopId: null, fallback: '', notes: '', ...form, title: form.title.trim() }
    updateTrip((t) => ({ ...t, activities: [...t.activities, a] }))
    setForm({ title: '', dayIdx: 0, window: 'flexible', description: '' })
    setSelectedId(a.id)
  }

  const dayLabel = (idx) => (days[idx] ? fmtDayLabel(days[idx]) : `DAY ${idx + 1}`)

  return (
    <div className="board">
      <div className="board-list">
        <div>
          <div className="section-label">Day planner</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span className="panel-title">Day plans</span>
            <span style={{ fontSize: 10, color: 'var(--faint)' }}>{trip.activities.length} tracked</span>
          </div>
        </div>

        {trip.activities
          .slice()
          .sort((a, b) => a.dayIdx - b.dayIdx)
          .map((a) => (
            <div
              key={a.id}
              className={`mission-card${a.id === selectedId ? ' selected' : ''}`}
              onClick={() => setSelectedId(a.id)}
            >
              <div className="mc-head">
                <span className="mc-title">{a.title}</span>
                <span className={`chip ${statusChip[a.status] || ''}`}>{a.status}</span>
              </div>
              <div className="mc-window">
                {dayLabel(a.dayIdx)} / {a.window}
              </div>
              {a.description && <div className="mc-body">{a.description}</div>}
              {a.fallback && (
                <div className="mc-fallback">
                  <b>BACKUP:</b> {a.fallback}
                </div>
              )}
              <button
                className="icon-btn danger card-del"
                title="Remove day plan"
                onClick={(e) => {
                  e.stopPropagation()
                  updateTrip((t) => ({ ...t, activities: t.activities.filter((x) => x.id !== a.id) }))
                  if (selectedId === a.id) setSelectedId(null)
                }}
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        {trip.activities.length === 0 && <div className="empty-note">No day plans yet.</div>}

        <div className="panel" style={{ marginTop: 'auto' }}>
          <div className="section-label muted-label">Planner · add activity</div>
          <input
            className="input"
            placeholder="Activity title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <div className="form-row" style={{ marginTop: 6 }}>
            <select className="input" value={form.dayIdx} onChange={(e) => setForm({ ...form, dayIdx: Number(e.target.value) })}>
              {days.map((d, i) => (
                <option key={i} value={i}>{fmtDayLabel(d)}</option>
              ))}
            </select>
            <select className="input" value={form.window} onChange={(e) => setForm({ ...form, window: e.target.value })}>
              {ACTIVITY_WINDOWS.map((w) => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
          </div>
          <textarea
            className="input"
            style={{ marginTop: 6 }}
            placeholder="Short description or planning purpose…"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <button className="btn primary" style={{ width: '100%', marginTop: 8 }} onClick={addActivity}>
            <Plus size={12} /> Add activity
          </button>
        </div>
      </div>

      <div className="board-main">
        {selected ? (
          <>
            <div className="panel">
              <div className="section-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                Plan details
                <span className={`chip ${statusChip[selected.status]}`}>{selected.status}</span>
              </div>
              <h2 style={{ margin: '4px 0 2px', fontSize: 22, letterSpacing: '-0.01em' }}>
                {selected.title}
              </h2>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                {dayLabel(selected.dayIdx)} · {selected.window}
              </div>
              {selected.stopId && stopById.get(selected.stopId) && (
                <button className="btn sm go" style={{ marginTop: 10 }}>
                  <Search size={11} /> Inspect {stopById.get(selected.stopId).name}
                </button>
              )}
            </div>

            <div className="panel">
              <div className="section-label">The plan</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <FrameRow icon={<Settings2 size={12} />} label="What's happening">
                  <textarea
                    className="input"
                    value={selected.description}
                    placeholder="What is this day for?"
                    onChange={(e) => patchActivity(selected.id, { description: e.target.value })}
                  />
                </FrameRow>
                <FrameRow icon={<MapPin size={12} />} label="Location">
                  <select
                    className="input"
                    value={selected.stopId || ''}
                    onChange={(e) => patchActivity(selected.id, { stopId: e.target.value || null })}
                  >
                    <option value="">No anchor</option>
                    {trip.stops.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </FrameRow>
                <FrameRow icon={<AlertTriangle size={12} />} label="Backup plan">
                  <textarea
                    className="input"
                    value={selected.fallback}
                    placeholder="If conditions drift, what do we do instead?"
                    onChange={(e) => patchActivity(selected.id, { fallback: e.target.value })}
                  />
                </FrameRow>
                <FrameRow icon={<Clock size={12} />} label="Status">
                  <div style={{ display: 'flex', gap: 6 }}>
                    {ACTIVITY_STATUS.map((s) => (
                      <button
                        key={s}
                        className={`family-chip${selected.status === s ? ' active' : ''}`}
                        onClick={() => patchActivity(selected.id, { status: s })}
                      >
                        {s}
                      </button>
                    ))}
                    <button
                      className="btn sm danger ghost"
                      style={{ marginLeft: 'auto' }}
                      onClick={() => {
                        updateTrip((t) => ({ ...t, activities: t.activities.filter((a) => a.id !== selected.id) }))
                        setSelectedId(null)
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </FrameRow>
              </div>
            </div>

            <div className="panel">
              <div className="section-label">Activities note</div>
              <textarea
                className="input"
                placeholder="Capture alternate plans, micro-itineraries, weather triggers, or new activity ideas…"
                value={selected.notes}
                onChange={(e) => patchActivity(selected.id, { notes: e.target.value })}
              />
            </div>
          </>
        ) : (
          <div className="empty-note" style={{ marginTop: 40 }}>Select a day plan to see its details.</div>
        )}
      </div>

      <div className="board-inspector">
        {selected && (
          <>
            <div className="panel">
              <div className="section-label">Selected plan</div>
              <div className="kv-row"><span className="k">Risk watch</span><span className="v" style={{ color: selected.status === 'watch' ? 'var(--amber)' : 'var(--green)' }}>{selected.status === 'watch' ? 'Medium' : selected.status === 'hold' ? 'High' : 'Low'}</span></div>
              <div className="kv-row"><span className="k">Window</span><span className="v">{dayLabel(selected.dayIdx)} / {selected.window}</span></div>
              {selected.stopId && stopById.get(selected.stopId) && (
                <div className="kv-row"><span className="k">Location</span><span className="v">{stopById.get(selected.stopId).name}</span></div>
              )}
              {selected.description && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8 }}>{selected.description}</div>}
              {selected.fallback && (
                <div className="mc-fallback" style={{ background: 'var(--amber-dim)', border: '1px solid rgba(154,103,0,.3)', borderRadius: 10, padding: 10, marginTop: 8 }}>
                  <b>BACKUP:</b> {selected.fallback}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function FrameRow({ icon, label, children }) {
  return (
    <div>
      <div className="field-label" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--blue)' }}>
        {icon} {label}
      </div>
      {children}
    </div>
  )
}
