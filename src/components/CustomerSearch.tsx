import { useState, useEffect, useRef } from 'react'
import { useCustomers } from '../hooks/useCustomers'
import { createCustomer } from '../db/customers'
import { useSettings } from '../context/SettingsContext'
import { getTranslations, formatCurrency } from '../lib/i18n'
import type { Customer } from '../db/customers'

interface CustomerSearchProps {
  onSelect: (customer: Customer | null) => void
  onClose: () => void
  selected: Customer | null
  allowCreate?: boolean
}

export function CustomerSearch({ onSelect, onClose, selected, allowCreate = false }: CustomerSearchProps) {
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  const [creating, setCreating] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const { customers, loading } = useCustomers(debounced)
  const { locale } = useSettings()
  const t = getTranslations(locale)

  useEffect(() => {
    const id = setTimeout(() => setDebounced(query), 300)
    return () => clearTimeout(id)
  }, [query])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  async function handleCreate() {
    const name = query.trim()
    if (!name || creating) return
    setCreating(true)
    try {
      const id = await createCustomer(name)
      onSelect({ id, name, created_at: new Date().toISOString() })
      onClose()
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-[var(--bg-overlay)] flex flex-col">
      <div className="flex items-center gap-3 p-4 border-b border-[var(--border)]">
        <button onClick={onClose} className="text-[var(--text-2)] text-2xl leading-none px-1">✕</button>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={t.searchCustomer}
          className="flex-1 bg-[var(--bg-input)] text-[var(--text-1)] rounded-xl px-4 py-2 outline-none text-base"
        />
      </div>

      <div className="flex-1 overflow-y-auto bg-[var(--bg-base)]">
        <button
          onClick={() => { onSelect(null); onClose() }}
          className={`w-full text-left px-5 py-4 border-b border-[var(--border)] flex items-center gap-3 ${!selected ? 'bg-[var(--accent-sub)]' : ''}`}
        >
          <span className="text-[var(--text-2)] text-sm">{t.walkinOption}</span>
          {!selected && <span className="ml-auto text-[var(--accent)] text-sm">{t.currentSelection}</span>}
        </button>

        {loading && (
          <div className="text-center py-10 text-[var(--text-3)]">{t.loading}</div>
        )}

        {!loading && customers.map(c => (
          <button
            key={c.id}
            onClick={() => { onSelect(c); onClose() }}
            className={`w-full text-left px-5 py-4 border-b border-[var(--border)] flex items-center justify-between ${selected?.id === c.id ? 'bg-[var(--accent-sub)]' : ''}`}
          >
            <div>
              <div className="text-[var(--text-1)] font-medium">{c.name}</div>
              <div className="text-[var(--text-3)] text-xs mt-0.5">
                Total: {formatCurrency(c.total_spend, locale)}
                {c.last_transaction && ` · ${t.lastTransaction}: ${new Date(c.last_transaction).toLocaleDateString(locale === 'id' ? 'id-ID' : 'en-US')}`}
              </div>
            </div>
            {selected?.id === c.id && <span className="text-[var(--accent)] text-sm">✓</span>}
          </button>
        ))}

        {!loading && customers.length === 0 && debounced && (
          <div className="text-center py-10 text-[var(--text-3)]">{t.noCustomersFound(debounced)}</div>
        )}

        {allowCreate && debounced.trim() && (
          <button
            onClick={handleCreate}
            disabled={creating}
            className="w-full text-left px-5 py-4 border-t border-[var(--border)] flex items-center gap-2 disabled:opacity-50"
          >
            <span className="text-[var(--accent)] text-sm font-medium">
              + {t.addCustomer} "{debounced.trim()}"
            </span>
          </button>
        )}
      </div>
    </div>
  )
}
