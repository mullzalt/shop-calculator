import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCustomers } from '../hooks/useCustomers'
import { createCustomer } from '../db/customers'
import { useSettings } from '../context/SettingsContext'
import { getTranslations, formatCurrency } from '../lib/i18n'

export function Customers() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)

  const { locale } = useSettings()
  const t = getTranslations(locale)

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
      <header className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)]">
        <button onClick={() => navigate('/')} className="text-[var(--accent)] text-sm">← {t.appName}</button>
        <span className="text-[var(--text-1)] font-semibold flex-1">{t.customersTitle}</span>
      </header>

      <div className="p-3 border-b border-[var(--border)]">
        <input
          type="text"
          value={query}
          onChange={e => onQueryChange(e.target.value)}
          placeholder={t.searchByName}
          className="w-full bg-[var(--bg-card)] text-[var(--text-1)] rounded-xl px-4 py-2.5 text-sm outline-none"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading && <div className="text-center py-10 text-[var(--text-3)]">{t.loading}</div>}

        {!loading && customers.length === 0 && (
          <div className="text-center py-10 text-[var(--text-4)]">
            {debounced ? t.noCustomersMatching(debounced) : t.noCustomersYet}
          </div>
        )}

        {customers.map(c => (
          <button
            key={c.id}
            onClick={() => navigate(`/customers/${c.id}`)}
            className="w-full text-left px-5 py-4 border-b border-[var(--border)] flex items-center justify-between"
          >
            <div>
              <div className="text-[var(--text-1)] font-medium">{c.name}</div>
              <div className="text-[var(--text-3)] text-xs mt-0.5">
                {t.total}: {formatCurrency(c.total_spend, locale)}
                {c.last_transaction
                  ? ` · ${t.lastTransaction}: ${new Date(c.last_transaction).toLocaleDateString(locale === 'id' ? 'id-ID' : 'en-US')}`
                  : ` · ${t.noTransactionsShort}`}
              </div>
            </div>
            <span className="text-[var(--text-4)] text-sm">›</span>
          </button>
        ))}
      </div>

      <button
        onClick={() => setShowAdd(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-[var(--accent-bg)] text-white rounded-full text-2xl shadow-lg flex items-center justify-center"
      >
        +
      </button>

      {showAdd && (
        <div className="fixed inset-0 z-50 bg-[var(--bg-overlay)] flex items-end justify-center p-4">
          <div className="w-full max-w-sm bg-[var(--bg-card)] rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[var(--text-1)] font-semibold">{t.addCustomer}</h2>
              <button onClick={() => setShowAdd(false)} className="text-[var(--text-2)] text-xl">✕</button>
            </div>
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder={t.customerName}
              autoFocus
              className="w-full bg-[var(--bg-input)] text-[var(--text-1)] rounded-xl px-4 py-3 outline-none text-base"
            />
            <button
              onClick={handleAdd}
              disabled={saving || !newName.trim()}
              className="w-full bg-[var(--accent-bg)] disabled:opacity-50 text-white rounded-xl py-3 font-medium"
            >
              {saving ? t.adding : t.addCustomer}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
