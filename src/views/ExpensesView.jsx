import React, { useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useTrip } from '../state/TripContext.jsx'
import { uid } from '../state/tripModel.js'
import { fmtMoney, fmtDayLabel } from '../lib/format.js'
import { tripDays } from './ActivitiesView.jsx'

const CATEGORIES = ['lodging', 'food', 'fuel', 'activities', 'supplies', 'other']

export default function ExpensesView() {
  const { trip, updateTrip } = useTrip()
  const days = tripDays(trip)
  const [form, setForm] = useState({ desc: '', amount: '', payerId: trip.families[0]?.id ?? '', category: 'food', dayIdx: 0 })

  const familyById = new Map(trip.families.map((f) => [f.id, f]))

  const totals = useMemo(() => {
    const paid = new Map(trip.families.map((f) => [f.id, 0]))
    let total = 0
    for (const e of trip.expenses) {
      total += e.amount
      if (paid.has(e.payerId)) paid.set(e.payerId, paid.get(e.payerId) + e.amount)
    }
    const share = trip.families.length > 0 ? total / trip.families.length : 0
    return { total, share, paid }
  }, [trip.expenses, trip.families])

  const add = () => {
    const amount = Number(form.amount)
    if (!form.desc.trim() || !Number.isFinite(amount) || amount <= 0) return
    updateTrip((t) => ({
      ...t,
      expenses: [...t.expenses, { id: uid(), ...form, desc: form.desc.trim(), amount }],
    }))
    setForm({ ...form, desc: '', amount: '' })
  }

  return (
    <div style={{ padding: 18, overflowY: 'auto', height: '100%' }}>
      <div className="section-label">Expenses</div>
      <div className="panel-title" style={{ marginBottom: 14 }}>Cost ledger &amp; even split</div>

      <div className="split-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(520px, 1fr) 320px', gap: 14, maxWidth: 1200, alignItems: 'start' }}>
        <div className="panel" style={{ padding: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Day</th>
                <th>Category</th>
                <th>Paid by</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {trip.expenses.map((e) => (
                <tr key={e.id}>
                  <td>{e.desc}</td>
                  <td className="mono-cell">{days[e.dayIdx] ? fmtDayLabel(days[e.dayIdx]) : '—'}</td>
                  <td><span className="chip">{e.category}</span></td>
                  <td style={{ color: familyById.get(e.payerId)?.color }}>{familyById.get(e.payerId)?.name || '—'}</td>
                  <td className="mono-cell" style={{ textAlign: 'right' }}>{fmtMoney(e.amount)}</td>
                  <td style={{ width: 34 }}>
                    <button className="icon-btn danger" onClick={() => updateTrip((t) => ({ ...t, expenses: t.expenses.filter((x) => x.id !== e.id) }))}>
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              ))}
              {trip.expenses.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ color: 'var(--faint)', textAlign: 'center', padding: 20 }}>No expenses logged.</td>
                </tr>
              )}
              <tr>
                <td><input className="input" placeholder="New expense…" value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} /></td>
                <td>
                  <select className="input" value={form.dayIdx} onChange={(e) => setForm({ ...form, dayIdx: Number(e.target.value) })}>
                    {days.map((d, i) => (
                      <option key={i} value={i}>{fmtDayLabel(d)}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <select className="input" value={form.payerId} onChange={(e) => setForm({ ...form, payerId: e.target.value })}>
                    {trip.families.map((f) => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </td>
                <td><input className="input mono" style={{ textAlign: 'right' }} placeholder="0.00" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></td>
                <td>
                  <button className="icon-btn" onClick={add} title="Add expense">
                    <Plus size={13} />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="panel">
            <div className="section-label">Totals</div>
            <div className="kv-row"><span className="k">Trip total</span><span className="v" style={{ fontSize: 15, color: 'var(--text)' }}>{fmtMoney(totals.total)}</span></div>
            <div className="kv-row"><span className="k">Even split / group</span><span className="v">{fmtMoney(totals.share)}</span></div>
          </div>
          <div className="panel">
            <div className="section-label">Settlement — even split</div>
            {trip.families.map((f) => {
              const paid = totals.paid.get(f.id) || 0
              const net = paid - totals.share
              return (
                <div key={f.id} className="kv-row">
                  <span className="k" style={{ color: f.color }}>{f.name}</span>
                  <span className="v" style={{ color: net >= 0 ? 'var(--green)' : 'var(--red)' }}>
                    {net >= 0 ? `is owed ${fmtMoney(net)}` : `owes ${fmtMoney(-net)}`}
                  </span>
                </div>
              )
            })}
            <div style={{ fontSize: 10, color: 'var(--faint)', marginTop: 8 }}>
              Paid vs. an even split across {trip.families.length} travel group{trip.families.length === 1 ? '' : 's'}.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
