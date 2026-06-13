import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCustomers } from '../hooks/useCustomers'
import { createCustomer } from '../db/customers'

export function Customers() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)

  const { customers, loading, refresh } = useCustomers(debounced)

  function onQueryChange(val: string) {
    setQuery(val)
    clearTimeout((window as unknown as Record<string, number>).__customerSearchTimer)
    ;(window as unknown as Record<string, number>).__customerSearchTimer = window.setTimeout(() => setDebounced(val), 300)
  }

  async function handleAdd() {
    if (!newName.trim()) return
    setSaving(true)
    try {
      await createCustomer(newName.trim())
      setNewName('')
      setShowAdd(false)
      refresh()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-gray-800">
        <button onClick={() => navigate('/')} className="text-indigo-400 text-sm">← Calc</button>
        <span className="text-white font-semibold flex-1">Customers</span>
      </header>

      {/* Search */}
      <div className="p-3 border-b border-gray-800">
        <input
          type="text"
          value={query}
          onChange={e => onQueryChange(e.target.value)}
          placeholder="Search by name…"
          className="w-full bg-gray-800 text-white rounded-xl px-4 py-2.5 text-sm outline-none"
        />
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading && <div className="text-center py-10 text-gray-500">Loading…</div>}

        {!loading && customers.length === 0 && (
          <div className="text-center py-10 text-gray-600">
            {debounced ? `No customers matching "${debounced}"` : 'No customers yet'}
          </div>
        )}

        {customers.map(c => (
          <button
            key={c.id}
            onClick={() => navigate(`/customers/${c.id}`)}
            className="w-full text-left px-5 py-4 border-b border-gray-800 flex items-center justify-between"
          >
            <div>
              <div className="text-white font-medium">{c.name}</div>
              <div className="text-gray-500 text-xs mt-0.5">
                Total: {c.total_spend.toLocaleString('id-ID')}
                {c.last_transaction
                  ? ` · Last: ${new Date(c.last_transaction).toLocaleDateString('id-ID')}`
                  : ' · No transactions'}
              </div>
            </div>
            <span className="text-gray-600 text-sm">›</span>
          </button>
        ))}
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowAdd(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full text-2xl shadow-lg flex items-center justify-center"
      >
        +
      </button>

      {/* Add modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 bg-gray-950/80 flex items-end justify-center p-4">
          <div className="w-full max-w-sm bg-gray-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-semibold">Add Customer</h2>
              <button onClick={() => setShowAdd(false)} className="text-gray-400 text-xl">✕</button>
            </div>
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder="Customer name"
              autoFocus
              className="w-full bg-gray-700 text-white rounded-xl px-4 py-3 outline-none text-base"
            />
            <button
              onClick={handleAdd}
              disabled={saving || !newName.trim()}
              className="w-full bg-indigo-600 disabled:opacity-50 text-white rounded-xl py-3 font-medium"
            >
              {saving ? 'Adding…' : 'Add Customer'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
