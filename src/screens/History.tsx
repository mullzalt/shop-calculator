import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Download } from 'lucide-react'
import { useTransactions } from '../hooks/useTransactions'
import { updateTransaction, deleteTransaction } from '../db/transactions'
import type { Transaction, TransactionFilter } from '../db/transactions'
import { ExportModal } from '../components/ExportModal'
import { CustomerSearch } from '../components/CustomerSearch'
import { useSettings } from '../context/SettingsContext'
import { getTranslations, formatAmount, formatDateTime } from '../lib/i18n'
import type { Customer } from '../db/customers'

function todayISO() {
  return new Date().toISOString().slice(0, 10)
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

  const { locale } = useSettings()
  const t = getTranslations(locale)

  const filter: TransactionFilter = {
    customerId: filterCustomer?.id ?? undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  }

  const { transactions, total, totalAmount, loading, refresh, pageSize } = useTransactions(filter, page)

  function startEdit(tx: Transaction) {
    const customer = tx.customer_id != null
      ? { id: tx.customer_id, name: tx.customer_name ?? '' } as Customer
      : null
    setEditState({
      id: tx.id,
      expression: tx.expression,
      amount: String(tx.amount),
      customer_id: tx.customer_id != null ? String(tx.customer_id) : '',
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
    dateFrom && `${t.filterFrom} ${dateFrom}`,
    dateTo && `${t.filterTo} ${dateTo}`,
    filterCustomer?.name,
  ].filter(Boolean).join(' · ')

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)]">
        <button onClick={() => navigate('/')} className="text-[var(--accent)] p-1 -ml-1">
          <ChevronLeft size={24} />
        </button>
        <span className="text-[var(--text-1)] font-semibold flex-1">{t.historyTitle}</span>
        <button onClick={() => setShowExport(true)} className="text-[var(--accent)] p-2">
          <Download size={22} />
        </button>
      </header>

      {/* Filters */}
      <div className="border-b border-[var(--border)] p-3 space-y-2">
        <div className="flex gap-2">
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
        <div>
          <label className="text-[var(--text-3)] text-xs block mb-1">{t.filterCustomer}</label>
          <button
            onClick={() => setShowCustomerFilter(true)}
            className="w-full bg-[var(--bg-card)] text-[var(--text-1)] rounded-lg px-3 py-2 text-sm text-left flex items-center justify-between"
          >
            <span className={filterCustomer ? 'text-[var(--accent-txt)]' : 'text-[var(--text-3)]'}>
              {filterCustomer ? filterCustomer.name : t.allCustomers}
            </span>
            <span className="text-[var(--text-4)] text-xs">▾</span>
          </button>
        </div>
      </div>

      {/* Summary bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[var(--bg-base)] text-sm border-b border-[var(--border)]">
        <span className="text-[var(--text-3)]">{t.transactions(total)}</span>
        <span className="text-[var(--text-1)] font-semibold">
          {t.total}: {formatAmount(totalAmount, locale)}
        </span>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="text-center py-10 text-[var(--text-3)]">{t.loading}</div>
        )}
        {!loading && transactions.length === 0 && (
          <div className="text-center py-10 text-[var(--text-4)]">{t.noTransactionsFiltered}</div>
        )}
        {transactions.map(tx => (
          <div key={tx.id} className="border-b border-[var(--border)]">
            <button
              onClick={() => { setEditState(null); startEdit(tx) }}
              className="w-full text-left px-4 py-3 flex items-start justify-between gap-2"
            >
              <div className="flex-1 min-w-0">
                <div className="text-[var(--text-1)] font-semibold text-base">{formatAmount(tx.amount, locale)}</div>
                <div className="text-[var(--text-3)] text-xs font-mono truncate">{tx.expression}</div>
                <div className="text-[var(--text-4)] text-xs mt-0.5">
                  {tx.customer_name ?? t.walkinLabel} · {formatDateTime(tx.created_at, locale)}
                </div>
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
                  <button
                    onClick={saveEdit}
                    className="flex-1 bg-[var(--accent-bg)] text-white rounded-lg py-2 text-sm font-medium"
                  >
                    {t.save}
                  </button>
                  <button
                    onClick={() => setEditState(null)}
                    className="flex-1 bg-[var(--bg-input)] text-[var(--text-1)] rounded-lg py-2 text-sm font-medium"
                  >
                    {t.cancel}
                  </button>
                  <button
                    onClick={() => handleDelete(tx.id)}
                    className="bg-[var(--danger-bg)] text-[var(--danger-t)] rounded-lg py-2 px-4 text-sm font-medium"
                  >
                    {t.delete}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border)]">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="text-[var(--accent)] disabled:text-[var(--text-4)] text-sm"
          >
            {t.prevPage}
          </button>
          <span className="text-[var(--text-3)] text-sm">
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="text-[var(--accent)] disabled:text-[var(--text-4)] text-sm"
          >
            {t.nextPage}
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
