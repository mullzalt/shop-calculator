import { useState, useEffect, useRef } from 'react'
import { useCustomers } from '../hooks/useCustomers'
import type { Customer } from '../db/customers'

interface CustomerSearchProps {
  onSelect: (customer: Customer | null) => void
  onClose: () => void
  selected: Customer | null
}

export function CustomerSearch({ onSelect, onClose, selected }: CustomerSearchProps) {
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const { customers, loading } = useCustomers(debounced)

  useEffect(() => {
    const id = setTimeout(() => setDebounced(query), 300)
    return () => clearTimeout(id)
  }, [query])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  return (
    <div className="fixed inset-0 z-50 bg-gray-950/90 flex flex-col">
      <div className="flex items-center gap-3 p-4 border-b border-gray-700">
        <button onClick={onClose} className="text-gray-400 text-2xl leading-none px-1">✕</button>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search customer..."
          className="flex-1 bg-gray-800 text-white rounded-xl px-4 py-2 outline-none text-base"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Walk-in option */}
        <button
          onClick={() => { onSelect(null); onClose() }}
          className={`w-full text-left px-5 py-4 border-b border-gray-800 flex items-center gap-3 ${!selected ? 'bg-indigo-900/40' : ''}`}
        >
          <span className="text-gray-400 text-sm">Walk-in customer (no assignment)</span>
          {!selected && <span className="ml-auto text-indigo-400 text-sm">✓ current</span>}
        </button>

        {loading && (
          <div className="text-center py-10 text-gray-500">Loading…</div>
        )}

        {!loading && customers.map(c => (
          <button
            key={c.id}
            onClick={() => { onSelect(c); onClose() }}
            className={`w-full text-left px-5 py-4 border-b border-gray-800 flex items-center justify-between ${selected?.id === c.id ? 'bg-indigo-900/40' : ''}`}
          >
            <div>
              <div className="text-white font-medium">{c.name}</div>
              <div className="text-gray-500 text-xs mt-0.5">
                Total: Rp {c.total_spend.toLocaleString('id-ID')}
                {c.last_transaction && ` · Last: ${new Date(c.last_transaction).toLocaleDateString('id-ID')}`}
              </div>
            </div>
            {selected?.id === c.id && <span className="text-indigo-400 text-sm">✓</span>}
          </button>
        ))}

        {!loading && customers.length === 0 && debounced && (
          <div className="text-center py-10 text-gray-500">No customers found for "{debounced}"</div>
        )}
      </div>
    </div>
  )
}
