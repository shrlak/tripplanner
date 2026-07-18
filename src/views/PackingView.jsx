import React, { useMemo, useState } from 'react'
import { Plus, Trash2, Sparkles, Package } from 'lucide-react'
import { useTrip } from '../state/TripContext.jsx'
import { uid, PACKING_CATEGORIES, PACKING_STARTER_ITEMS } from '../state/tripModel.js'

export default function PackingView() {
  const { trip, updateTrip } = useTrip()
  const packing = trip.packing || []
  const [form, setForm] = useState({ text: '', category: PACKING_CATEGORIES[0], assignedTo: '', qty: 1 })

  const familyById = new Map(trip.families.map((f) => [f.id, f]))

  const grouped = useMemo(() => {
    const map = new Map(PACKING_CATEGORIES.map((c) => [c, []]))
    for (const item of packing) {
      if (!map.has(item.category)) map.set(item.category, [])
      map.get(item.category).push(item)
    }
    return [...map.entries()].filter(([, items]) => items.length > 0)
  }, [packing])

  const packedCount = packing.filter((i) => i.packed).length
  const pct = packing.length ? Math.round((packedCount / packing.length) * 100) : 0

  const patchItem = (id, patch) =>
    updateTrip((t) => ({ ...t, packing: (t.packing || []).map((i) => (i.id === id ? { ...i, ...patch } : i)) }))

  const removeItem = (id) => updateTrip((t) => ({ ...t, packing: (t.packing || []).filter((i) => i.id !== id) }))

  const addItem = () => {
    if (!form.text.trim()) return
    updateTrip((t) => ({
      ...t,
      packing: [
        ...(t.packing || []),
        {
          id: uid(),
          text: form.text.trim(),
          category: form.category,
          assignedTo: form.assignedTo || null,
          qty: Math.max(1, Number(form.qty) || 1),
          packed: false,
        },
      ],
    }))
    setForm({ ...form, text: '' })
  }

  const addStarterList = () => {
    updateTrip((t) => {
      const existing = new Set((t.packing || []).map((i) => i.text.toLowerCase()))
      const additions = PACKING_STARTER_ITEMS.filter((i) => !existing.has(i.text.toLowerCase())).map((i) => ({
        id: uid(),
        text: i.text,
        category: i.category,
        assignedTo: null,
        qty: 1,
        packed: false,
      }))
      return { ...t, packing: [...(t.packing || []), ...additions] }
    })
  }

  const clearPacked = () => updateTrip((t) => ({ ...t, packing: (t.packing || []).map((i) => ({ ...i, packed: false })) }))

  return (
    <div style={{ padding: 18, overflowY: 'auto', height: '100%' }}>
      <div className="section-label">Packing</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
        <span className="panel-title">Packing list</span>
        {packing.length > 0 && (
          <span style={{ fontSize: 11, color: 'var(--faint)' }}>
            {packedCount}/{packing.length} packed
          </span>
        )}
      </div>

      <div className="split-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: 16, maxWidth: 1200, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
          {packing.length === 0 && (
            <div className="panel" style={{ textAlign: 'center', padding: 28 }}>
              <Package size={22} style={{ color: 'var(--faint)', marginBottom: 8 }} />
              <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>Nothing on the list yet.</div>
              <button className="btn primary" onClick={addStarterList}>
                <Sparkles size={13} /> Add trip essentials
              </button>
            </div>
          )}

          {grouped.map(([category, items]) => (
            <div key={category} className="panel">
              <div className="section-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                {category}
                <span style={{ color: 'var(--faint)' }}>
                  {items.filter((i) => i.packed).length}/{items.length}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {items.map((item) => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 2px' }}>
                    <input
                      type="checkbox"
                      checked={item.packed}
                      onChange={() => patchItem(item.id, { packed: !item.packed })}
                    />
                    <span
                      style={{
                        flex: 1,
                        minWidth: 0,
                        fontSize: 13,
                        ...(item.packed ? { color: 'var(--faint)', textDecoration: 'line-through' } : {}),
                      }}
                    >
                      {item.text}
                      {item.qty > 1 ? ` ×${item.qty}` : ''}
                    </span>
                    {item.assignedTo && familyById.get(item.assignedTo) && (
                      <span style={{ fontSize: 10, fontWeight: 600, color: familyById.get(item.assignedTo).color, whiteSpace: 'nowrap' }}>
                        {familyById.get(item.assignedTo).name}
                      </span>
                    )}
                    <button className="icon-btn danger" title="Remove item" onClick={() => removeItem(item.id)}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="panel">
            <div className="section-label muted-label">Add item</div>
            <div className="form-row">
              <input
                className="input"
                placeholder="Item name"
                value={form.text}
                onChange={(e) => setForm({ ...form, text: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && addItem()}
              />
              <input
                type="number"
                className="input"
                style={{ maxWidth: 72 }}
                min={1}
                title="Quantity"
                value={form.qty}
                onChange={(e) => setForm({ ...form, qty: e.target.value })}
              />
            </div>
            <div className="form-row" style={{ marginTop: 8 }}>
              <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {PACKING_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <select className="input" value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}>
                <option value="">Unassigned</option>
                {trip.families.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
            <button className="btn primary" style={{ width: '100%', marginTop: 8 }} onClick={addItem}>
              <Plus size={12} /> Add item
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="panel">
            <div className="section-label">Progress</div>
            <div className="mono" style={{ fontSize: 28, fontWeight: 700 }}>{pct}%</div>
            <div style={{ height: 6, background: 'var(--surface-2)', borderRadius: 999, overflow: 'hidden', margin: '8px 0' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: 'var(--green)', transition: 'width 200ms ease' }} />
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>
              {packing.length === 0 ? 'No items yet' : `${packedCount} of ${packing.length} items packed`}
            </div>
          </div>

          {packing.length > 0 && (
            <div className="panel">
              <div className="section-label">Quick actions</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <button className="btn sm" onClick={addStarterList}>
                  <Sparkles size={11} /> Add trip essentials
                </button>
                <button className="btn sm ghost" onClick={clearPacked}>
                  Uncheck all
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
