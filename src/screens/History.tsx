import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTransactions } from '../hooks/useTransactions'
import { updateTransaction, deleteTransaction } from '../db/transactions'
import type { Transaction, TransactionFilter } from '../db/transactions'
import { ExportModal } from '../components/ExportModal'
import { CustomerSearch } from '../components/CustomerSearch'
import type { Customer } from '../db/customers'

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

interface EditState {
  id: number
  expression: string
  amount: string
  customer_id: string
  customer: Customer | null
}

export function History() {
  const navigate = useNavigate()
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState(todayISO())
  const [filterCustomer, setFilterCustomer] = useState<Customer | null>(null)
  const [showCustomerFilter, setShowCustomerFilter] = useState(false)
  const [page, setPage] = useState(0)
  const [showExport, setShowExport] = useState(false)
  const [editState, setEditState] = useState<EditState | null>(null)
  const [showEditCustomer, setShowEditCustomer] = useState(false)

  const filter: TransactionFilter = {
    customerId: filterCustomer?.id ?? undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  }

  const { transactions, total, totalAmount, loading, refresh, pageSize } = useTransactions(filter, page)

  function startEdit(t: Transaction) {
    const customer = t.customer_id != null
      ? { id: t.customer_id, name: t.customer_name ?? '' } as Customer
      : null
    setEditState({
      id: t.id,
      expression: t.expression,
      amount: String(t.amount),
      customer_id: t.customer_id != null ? String(t.customer_id) : '',
      customer,
    })
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

  async function handleDelete(id: number) {
    await deleteTransaction(id)
    refresh()
  }

  const filterLabel = [
    dateFrom && `From ${dateFrom}`,
    dateTo && `To ${dateTo}`,
    filterCustomer?.name,
  ].filter(Boolean).join(' · ')

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-gray-800">
        <button onClick={() => navigate('/')} className="text-indigo-400 text-sm">← Calc</button>
        <span className="text-white font-semibold flex-1">History</span>
        <button
          onClick={() => setShowExport(true)}
          className="text-indigo-400 text-sm font-medium"
        >
          Export
        </button>
      </header>

      {/* Filters */}
      <div className="border-b border-gray-800 p-3 space-y-2">
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-gray-500 text-xs block mb-1">From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={e => { setDateFrom(e.target.value); setPage(0) }}
              className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm outline-none"
            />
          </div>
          <div className="flex-1">
            <label className="text-gray-500 text-xs block mb-1">To</label>
            <input
              type="date"
              value={dateTo}
              onChange={e => { setDateTo(e.target.value); setPage(0) }}
              className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm outline-none"
            />
          </div>
        </div>
        <div>
          <label className="text-gray-500 text-xs block mb-1">Customer</label>
          <button
            onClick={() => setShowCustomerFilter(true)}
            className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm text-left flex items-center justify-between"
          >
            <span className={filterCustomer ? 'text-indigo-300' : 'text-gray-400'}>
              {filterCustomer ? filterCustomer.name : 'All customers'}
            </span>
            <span className="text-gray-600 text-xs">▾</span>
          </button>
        </div>
      </div>

      {/* Summary bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900/60 text-sm">
        <span className="text-gray-500">{total} transaction{total !== 1 ? 's' : ''}</span>
        <span className="text-white font-semibold">
          Total: {totalAmount.toLocaleString('id-ID')}
        </span>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="text-center py-10 text-gray-500">Loading…</div>
        )}
        {!loading && transactions.length === 0 && (
          <div className="text-center py-10 text-gray-600">No transactions found</div>
        )}
        {transactions.map(t => (
          <div key={t.id} className="border-b border-gray-800">
            <button
              onClick={() => { setEditState(null); startEdit(t) }}
              className="w-full text-left px-4 py-3 flex items-start justify-between gap-2"
            >
              <div className="flex-1 min-w-0">
                <div className="text-white font-semibold text-base">{t.amount.toLocaleString('id-ID')}</div>
                <div className="text-gray-500 text-xs font-mono truncate">{t.expression}</div>
                <div className="text-gray-600 text-xs mt-0.5">
                  {t.customer_name ?? '—'} · {formatDateTime(t.created_at)}
                </div>
              </div>
              <span className="text-gray-600 text-xs mt-1">Edit</span>
            </button>

            {editState?.id === t.id && (
              <div className="px-4 pb-4 space-y-2 bg-gray-800/50">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-gray-500 text-xs block mb-1">Expression</label>
                    <input
                      type="text"
                      value={editState.expression}
                      onChange={e => setEditState(s => s ? { ...s, expression: e.target.value } : s)}
                      className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm outline-none font-mono"
                    />
                  </div>
                  <div className="w-28">
                    <label className="text-gray-500 text-xs block mb-1">Amount</label>
                    <input
                      type="number"
                      value={editState.amount}
                      onChange={e => setEditState(s => s ? { ...s, amount: e.target.value } : s)}
                      className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-gray-500 text-xs block mb-1">Customer</label>
                  <button
                    onClick={() => setShowEditCustomer(true)}
                    className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm text-left flex items-center justify-between"
                  >
                    <span className={editState.customer ? 'text-indigo-300' : 'text-gray-400'}>
                      {editState.customer ? editState.customer.name : 'Walk-in'}
                    </span>
                    <span className="text-gray-600 text-xs">▾</span>
                  </button>
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={saveEdit}
                    className="flex-1 bg-indigo-600 text-white rounded-lg py-2 text-sm font-medium"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditState(null)}
                    className="flex-1 bg-gray-700 text-white rounded-lg py-2 text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDelete(t.id)}
                    className="bg-red-900/60 text-red-300 rounded-lg py-2 px-4 text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="text-indigo-400 disabled:text-gray-600 text-sm"
          >
            ← Prev
          </button>
          <span className="text-gray-500 text-sm">
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="text-indigo-400 disabled:text-gray-600 text-sm"
          >
            Next →
          </button>
        </div>
      )}

      {showExport && (
        <ExportModal
          filter={filter}
          filterLabel={filterLabel}
          onClose={() => setShowExport(false)}
        />
      )}

      {showCustomerFilter && (
        <CustomerSearch
          selected={filterCustomer}
          onSelect={c => { setFilterCustomer(c); setPage(0) }}
          onClose={() => setShowCustomerFilter(false)}
        />
      )}

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
