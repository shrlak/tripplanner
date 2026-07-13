import React, { useState } from 'react'
import { Plus, Home, Trash2 } from 'lucide-react'
import { useTrip } from '../state/TripContext.jsx'
import { uid } from '../state/tripModel.js'
import { fmtDayLabel } from '../lib/format.js'
import { tripDays } from './ActivitiesView.jsx'

export default function LodgingView() {
  const { trip, updateTrip } = useTrip()
  const days = tripDays(trip)
  const [form, setForm] = useState({ name: '', address: '', checkInDayIdx: 0, checkOutDayIdx: Math.max(0, days.length - 1), confirmation: '' })

  const dayLabel = (idx) => (days[idx] ? fmtDayLabel(days[idx]) : `DAY ${idx + 1}`)

  const patch = (id, p) =>
    updateTrip((t) => ({ ...t, lodging: t.lodging.map((l) => (l.id === id ? { ...l, ...p } : l)) }))

  const add = () => {
    if (!form.name.trim()) return
    updateTrip((t) => ({ ...t, lodging: [...t.lodging, { id: uid(), stopId: null, notes: '', ...form, name: form.name.trim() }] }))
    setForm({ name: '', address: '', checkInDayIdx: 0, checkOutDayIdx: Math.max(0, days.length - 1), confirmation: '' })
  }

  return (
    <div style={{ padding: 18, overflowY: 'auto', height: '100%' }}>
      <div className="section-label">Accommodations</div>
      <div className="panel-title" style={{ marginBottom: 14 }}>Basing plan</div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14, maxWidth: 1200 }}>
        {trip.lodging.map((l) => (
          <div key={l.id} className="panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div className="section-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Home size={11} /> Base
              </div>
              <button
                className="icon-btn danger"
                onClick={() => updateTrip((t) => ({ ...t, lodging: t.lodging.filter((x) => x.id !== l.id) }))}
              >
                <Trash2 size={13} />
              </button>
            </div>
            <input
              className="input"
              style={{ fontSize: 15, fontWeight: 700, textTransform: 'uppercase' }}
              value={l.name}
              onChange={(e) => patch(l.id, { name: e.target.value })}
            />
            <div style={{ marginTop: 8 }}>
              <label className="field-label">Address</label>
              <input className="input" value={l.address} onChange={(e) => patch(l.id, { address: e.target.value })} />
            </div>
            <div className="form-row" style={{ marginTop: 8 }}>
              <div>
                <label className="field-label">Check-in</label>
                <select className="input" value={l.checkInDayIdx} onChange={(e) => patch(l.id, { checkInDayIdx: Number(e.target.value) })}>
                  {days.map((d, i) => (
                    <option key={i} value={i}>{fmtDayLabel(d)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="field-label">Check-out</label>
                <select className="input" value={l.checkOutDayIdx} onChange={(e) => patch(l.id, { checkOutDayIdx: Number(e.target.value) })}>
                  {days.map((d, i) => (
                    <option key={i} value={i}>{fmtDayLabel(d)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="field-label">Confirmation</label>
                <input className="input mono" value={l.confirmation} onChange={(e) => patch(l.id, { confirmation: e.target.value })} />
              </div>
            </div>
            <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
              <span className="chip green">{dayLabel(l.checkInDayIdx)} in</span>
              <span className="chip amber">{dayLabel(l.checkOutDayIdx)} out</span>
              <span className="chip">{Math.max(0, l.checkOutDayIdx - l.checkInDayIdx)} nights</span>
            </div>
            <div style={{ marginTop: 8 }}>
              <label className="field-label">Notes</label>
              <textarea className="input" value={l.notes} onChange={(e) => patch(l.id, { notes: e.target.value })} placeholder="Gate codes, check-in windows, parking, quirks…" />
            </div>
          </div>
        ))}

        <div className="panel" style={{ borderStyle: 'dashed' }}>
          <div className="section-label muted-label">Add base</div>
          <input className="input" placeholder="Lodging name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="input" style={{ marginTop: 6 }} placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <div className="form-row" style={{ marginTop: 6 }}>
            <select className="input" value={form.checkInDayIdx} onChange={(e) => setForm({ ...form, checkInDayIdx: Number(e.target.value) })}>
              {days.map((d, i) => (
                <option key={i} value={i}>{fmtDayLabel(d)} in</option>
              ))}
            </select>
            <select className="input" value={form.checkOutDayIdx} onChange={(e) => setForm({ ...form, checkOutDayIdx: Number(e.target.value) })}>
              {days.map((d, i) => (
                <option key={i} value={i}>{fmtDayLabel(d)} out</option>
              ))}
            </select>
          </div>
          <input className="input" style={{ marginTop: 6 }} placeholder="Confirmation #" value={form.confirmation} onChange={(e) => setForm({ ...form, confirmation: e.target.value })} />
          <button className="btn primary" style={{ width: '100%', marginTop: 8 }} onClick={add}>
            <Plus size={12} /> Add lodging
          </button>
        </div>
      </div>
    </div>
  )
}
