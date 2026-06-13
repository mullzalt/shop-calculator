import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getCustomer, updateCustomerName, deleteCustomer } from '../db/customers'
import { useTransactions } from '../hooks/useTransactions'
import { updateTransaction, deleteTransaction } from '../db/transactions'
import { useCustomers } from '../hooks/useCustomers'
import type { Customer } from '../db/customers'
import type { Transaction } from '../db/transactions'

function currentYearRange() {
  const year = new Date().getFullYear()
  return { from: `${year}-01-01`, to: `${year}-12-31` }
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
}

export function CustomerDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const customerId = Number(id)

  const [customer, setCustomer] = useState<Customer | null>(null)
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const range = currentYearRange()
  const [dateFrom, setDateFrom] = useState(range.from)
  const [dateTo, setDateTo] = useState(range.to)
  const [editState, setEditState] = useState<EditState | null>(null)
  const [page, setPage] = useState(0)

  const { customers: allCustomers } = useCustomers()

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

  async function handleDelete(id: number) {
    await deleteTransaction(id)
    refresh()
  }

  function startEdit(t: Transaction) {
    setEditState({
      id: t.id,
      expression: t.expression,
      amount: String(t.amount),
      customer_id: t.customer_id !== null && t.customer_id !== undefined ? String(t.customer_id) : '',
    })
  }

  if (!customer) return <div className="flex items-center justify-center h-full text-gray-500">Loading…</div>

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-gray-800">
        <button onClick={() => navigate('/customers')} className="text-indigo-400 text-sm">← Customers</button>
        <span className="text-white font-semibold flex-1">Customer Detail</span>
      </header>

      {/* Name */}
      <div className="px-5 py-4 border-b border-gray-800">
        {editingName ? (
          <div className="flex gap-2 items-center">
            <input
              autoFocus
              type="text"
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false) }}
              className="flex-1 bg-gray-800 text-white rounded-xl px-4 py-2 text-lg font-semibold outline-none"
            />
            <button onClick={saveName} className="text-indigo-400 text-sm font-medium">Save</button>
            <button onClick={() => setEditingName(false)} className="text-gray-500 text-sm">Cancel</button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-white text-2xl font-bold flex-1">{customer.name}</span>
            <button onClick={() => setEditingName(true)} className="text-indigo-400 text-sm font-medium">Edit</button>
          </div>
        )}
      </div>

      {/* Date filter */}
      <div className="flex gap-2 p-3 border-b border-gray-800">
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

      {/* Total */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <span className="text-gray-500 text-sm">{total} transaction{total !== 1 ? 's' : ''}</span>
        <span className="text-white font-semibold">{totalAmount.toLocaleString('id-ID')}</span>
      </div>

      {/* Transaction list */}
      <div className="flex-1 overflow-y-auto">
        {loading && <div className="text-center py-10 text-gray-500">Loading…</div>}
        {!loading && transactions.length === 0 && (
          <div className="text-center py-10 text-gray-600">No transactions in this period</div>
        )}

        {transactions.map(t => (
          <div key={t.id} className="border-b border-gray-800">
            <button
              onClick={() => startEdit(t)}
              className="w-full text-left px-4 py-3 flex items-start justify-between gap-2"
            >
              <div className="flex-1 min-w-0">
                <div className="text-white font-semibold">{t.amount.toLocaleString('id-ID')}</div>
                <div className="text-gray-500 text-xs font-mono truncate">{t.expression}</div>
                <div className="text-gray-600 text-xs mt-0.5">{formatDateTime(t.created_at)}</div>
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
                  <select
                    value={editState.customer_id}
                    onChange={e => setEditState(s => s ? { ...s, customer_id: e.target.value } : s)}
                    className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm outline-none"
                  >
                    <option value="">Walk-in</option>
                    {allCustomers.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={saveEdit} className="flex-1 bg-indigo-600 text-white rounded-lg py-2 text-sm font-medium">Save</button>
                  <button onClick={() => setEditState(null)} className="flex-1 bg-gray-700 text-white rounded-lg py-2 text-sm font-medium">Cancel</button>
                  <button onClick={() => handleDelete(t.id)} className="bg-red-900/60 text-red-300 rounded-lg py-2 px-4 text-sm font-medium">Delete</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800">
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="text-indigo-400 disabled:text-gray-600 text-sm">← Prev</button>
          <span className="text-gray-500 text-sm">{page + 1} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="text-indigo-400 disabled:text-gray-600 text-sm">Next →</button>
        </div>
      )}

      {/* Delete customer */}
      <div className="p-4 border-t border-gray-800">
        <button
          onClick={handleDeleteCustomer}
          className="w-full bg-red-900/40 hover:bg-red-900/60 text-red-400 rounded-xl py-3 text-sm font-medium"
        >
          Delete Customer (keep transaction history)
        </button>
      </div>
    </div>
  )
}
