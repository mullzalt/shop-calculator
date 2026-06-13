import { useState } from 'react'
import { listTransactions, type TransactionFilter } from '../db/transactions'
import { exportCSV, exportPDF } from '../lib/export'

interface ExportModalProps {
  filter: TransactionFilter
  filterLabel: string
  onClose: () => void
}

export function ExportModal({ filter, filterLabel, onClose }: ExportModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function run(type: 'csv' | 'pdf') {
    setLoading(true)
    setError('')
    try {
      const all = await listTransactions(filter, 10000, 0)
      const filename = `transactions_${new Date().toISOString().slice(0, 10)}`
      if (type === 'csv') await exportCSV(all, `${filename}.csv`)
      else await exportPDF(all, filterLabel, `${filename}.pdf`)
      onClose()
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-gray-950/80 flex items-end justify-center p-4">
      <div className="w-full max-w-sm bg-gray-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-semibold text-lg">Export Transactions</h2>
          <button onClick={onClose} className="text-gray-400 text-xl">✕</button>
        </div>

        {filterLabel && (
          <p className="text-gray-400 text-sm">{filterLabel}</p>
        )}

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => run('csv')}
            disabled={loading}
            className="bg-gray-700 hover:bg-gray-600 text-white rounded-xl py-3 font-medium disabled:opacity-50"
          >
            CSV
          </button>
          <button
            onClick={() => run('pdf')}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-3 font-medium disabled:opacity-50"
          >
            PDF
          </button>
        </div>

        {loading && <p className="text-center text-gray-500 text-sm">Preparing export…</p>}
      </div>
    </div>
  )
}
