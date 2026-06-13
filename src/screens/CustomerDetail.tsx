import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getCustomer, updateCustomerName, deleteCustomer } from '../db/customers'
import { useTransactions } from '../hooks/useTransactions'
import { updateTransaction, deleteTransaction } from '../db/transactions'
import { useSettings } from '../context/SettingsContext'
import { getTranslations, formatAmount, formatDateTime } from '../lib/i18n'
import type { Customer } from '../db/customers'
import type { Transaction } from '../db/transactions'
import { CustomerSearch } from '../components/CustomerSearch'

function currentYearRange() {
  const year = new Date().getFullYear()
  return { from: `${year}-01-01`, to: `${year}-12-31` }
}

interface EditState {
  id: number
  expression: string
  amount: string
  customer_id: string
  customer: Customer | null
}

export function CustomerDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const customerId = Number(id)

  const { locale } = useSettings()
  const t = getTranslations(locale)

  const [customer, setCustomer] = useState<Customer | null>(null)
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const range = currentYearRange()
  const [dateFrom, setDateFrom] = useState(range.from)
  const [dateTo, setDateTo] = useState(range.to)
  const [editState, setEditState] = useState<EditState | null>(null)
  const [showEditCustomer, setShowEditCustomer] = useState(false)
  const [page, setPage] = useState(0)

  useEffect(() => {
    getCustomer(customerId).then(c => {
      setCustomer(c)
      setNameInput(c?.name ?? '')
    })
  }, [customerId])

  const filter = { customerId, dateFrom, dateTo }
  const { transactions, total, totalAmount, loading, refresh, pageSize } = useTransactions(filter, page)

  async function saveName() {
    if (!nameInput.trim() || !customer) return
    await updateCustomerName(customer.id, nameInput.trim())
    setCustomer(c => c ? { ...c, name: nameInput.trim() } : c)
    setEditingName(false)
  }

  async function handleDeleteCustomer() {
    if (!customer) return
    await deleteCustomer(customer.id)
    navigate('/customers')
  }

  async function saveEdit() {
    if (!editState) return
    await updateTransaction(editState.id, {
      expression: editState.expression,
      amount: parseInt(editState.amount) || 0,
      customer_id: editState.customer_id ? parseInt(editState.customer_id) : null,
    })
    setEditState(null)
    refresh()
  }

  async function handleDeleteTx(txId: number) {
    await deleteTransaction(txId)
    refresh()
  }

  function startEdit(tx: Transaction) {
    const cust = tx.customer_id != null
      ? { id: tx.customer_id, name: tx.customer_name ?? '' } as Customer
      : null
    setEditState({
      id: tx.id,
      expression: tx.expression,
      amount: String(tx.amount),
      customer_id: tx.customer_id != null ? String(tx.customer_id) : '',
      customer: cust,
    })
  }

  if (!customer) return (
    <div className="flex items-center justify-center h-full text-[var(--text-3)]">{t.loading}</div>
  )

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)]">
        <button onClick={() => navigate('/customers')} className="text-[var(--accent)] text-sm">← {t.customersTitle}</button>
        <span className="text-[var(--text-1)] font-semibold flex-1">{t.customerDetail}</span>
      </header>

      {/* Name */}
      <div className="px-5 py-4 border-b border-[var(--border)]">
        {editingName ? (
          <div className="flex gap-2 items-center">
            <input
              autoFocus
              type="text"
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false) }}
              className="flex-1 bg-[var(--bg-card)] text-[var(--text-1)] rounded-xl px-4 py-2 text-lg font-semibold outline-none"
            />
            <button onClick={saveName} className="text-[var(--accent)] text-sm font-medium">{t.save}</button>
            <button onClick={() => setEditingName(false)} className="text-[var(--text-3)] text-sm">{t.cancel}</button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-[var(--text-1)] text-2xl font-bold flex-1">{customer.name}</span>
            <button onClick={() => setEditingName(true)} className="text-[var(--accent)] text-sm font-medium">{t.edit}</button>
          </div>
        )}
      </div>

      {/* Date filter */}
      <div className="flex gap-2 p-3 border-b border-[var(--border)]">
        <div className="flex-1">
          <label className="text-[var(--text-3)] text-xs block mb-1">{t.filterFrom}</label>
          <input
            type="date"
            value={dateFrom}
            onChange={e => { setDateFrom(e.target.value); setPage(0) }}
            className="w-full bg-[var(--bg-card)] text-[var(--text-1)] rounded-lg px-3 py-2 text-sm outline-none"
          />
        </div>
        <div className="flex-1">
          <label className="text-[var(--text-3)] text-xs block mb-1">{t.filterTo}</label>
          <input
            type="date"
            value={dateTo}
            onChange={e => { setDateTo(e.target.value); setPage(0) }}
            className="w-full bg-[var(--bg-card)] text-[var(--text-1)] rounded-lg px-3 py-2 text-sm outline-none"
          />
        </div>
      </div>

      {/* Total */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <span className="text-[var(--text-3)] text-sm">{t.transactions(total)}</span>
        <span className="text-[var(--text-1)] font-semibold">{formatAmount(totalAmount, locale)}</span>
      </div>

      {/* Transaction list */}
      <div className="flex-1 overflow-y-auto">
        {loading && <div className="text-center py-10 text-[var(--text-3)]">{t.loading}</div>}
        {!loading && transactions.length === 0 && (
          <div className="text-center py-10 text-[var(--text-4)]">{t.noTransactionsPeriod}</div>
        )}

        {transactions.map(tx => (
          <div key={tx.id} className="border-b border-[var(--border)]">
            <button
              onClick={() => startEdit(tx)}
              className="w-full text-left px-4 py-3 flex items-start justify-between gap-2"
            >
              <div className="flex-1 min-w-0">
                <div className="text-[var(--text-1)] font-semibold">{formatAmount(tx.amount, locale)}</div>
                <div className="text-[var(--text-3)] text-xs font-mono truncate">{tx.expression}</div>
                <div className="text-[var(--text-4)] text-xs mt-0.5">{formatDateTime(tx.created_at, locale)}</div>
              </div>
              <span className="text-[var(--text-4)] text-xs mt-1">{t.edit}</span>
            </button>

            {editState?.id === tx.id && (
              <div className="px-4 pb-4 space-y-2 bg-[var(--bg-card)]">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-[var(--text-3)] text-xs block mb-1">{t.expression}</label>
                    <input
                      type="text"
                      value={editState.expression}
                      onChange={e => setEditState(s => s ? { ...s, expression: e.target.value } : s)}
                      className="w-full bg-[var(--bg-input)] text-[var(--text-1)] rounded-lg px-3 py-2 text-sm outline-none font-mono"
                    />
                  </div>
                  <div className="w-28">
                    <label className="text-[var(--text-3)] text-xs block mb-1">{t.amount}</label>
                    <input
                      type="number"
                      value={editState.amount}
                      onChange={e => setEditState(s => s ? { ...s, amount: e.target.value } : s)}
                      className="w-full bg-[var(--bg-input)] text-[var(--text-1)] rounded-lg px-3 py-2 text-sm outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[var(--text-3)] text-xs block mb-1">{t.filterCustomer}</label>
                  <button
                    onClick={() => setShowEditCustomer(true)}
                    className="w-full bg-[var(--bg-input)] text-[var(--text-1)] rounded-lg px-3 py-2 text-sm text-left flex items-center justify-between"
                  >
                    <span className={editState.customer ? 'text-[var(--accent-txt)]' : 'text-[var(--text-3)]'}>
                      {editState.customer ? editState.customer.name : t.walkIn}
                    </span>
                    <span className="text-[var(--text-4)] text-xs">▾</span>
                  </button>
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={saveEdit} className="flex-1 bg-[var(--accent-bg)] text-white rounded-lg py-2 text-sm font-medium">{t.save}</button>
                  <button onClick={() => setEditState(null)} className="flex-1 bg-[var(--bg-input)] text-[var(--text-1)] rounded-lg py-2 text-sm font-medium">{t.cancel}</button>
                  <button onClick={() => handleDeleteTx(tx.id)} className="bg-[var(--danger-bg)] text-[var(--danger-t)] rounded-lg py-2 px-4 text-sm font-medium">{t.delete}</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border)]">
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="text-[var(--accent)] disabled:text-[var(--text-4)] text-sm">{t.prevPage}</button>
          <span className="text-[var(--text-3)] text-sm">{page + 1} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="text-[var(--accent)] disabled:text-[var(--text-4)] text-sm">{t.nextPage}</button>
        </div>
      )}

      {/* Delete customer */}
      <div className="p-4 border-t border-[var(--border)]">
        <button
          onClick={handleDeleteCustomer}
          className="w-full bg-[var(--danger-bg2)] text-[var(--danger-t)] rounded-xl py-3 text-sm font-medium"
        >
          {t.deleteCustomer}
        </button>
      </div>

      {showEditCustomer && editState && (
        <CustomerSearch
          selected={editState.customer}
          onSelect={c => setEditState(s => s ? { ...s, customer: c, customer_id: c ? String(c.id) : '' } : s)}
          onClose={() => setShowEditCustomer(false)}
        />
      )}
    </div>
  )
}
