import { useState } from 'react'
import { listTransactions, type TransactionFilter } from '../db/transactions'
import { exportCSV, exportPDF } from '../lib/export'
import { useSettings } from '../context/SettingsContext'
import { getTranslations } from '../lib/i18n'

interface ExportModalProps {
  filter: TransactionFilter
  filterLabel: string
  onClose: () => void
}

export function ExportModal({ filter, filterLabel, onClose }: ExportModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { locale } = useSettings()
  const t = getTranslations(locale)

  async function run(type: 'csv' | 'pdf') {
    setLoading(true)
    setError('')
    try {
      const all = await listTransactions(filter, 10000, 0)
      const filename = `transactions_${new Date().toISOString().slice(0, 10)}`
      if (type === 'csv') await exportCSV(all, `${filename}.csv`, locale, t)
      else await exportPDF(all, filterLabel, `${filename}.pdf`, locale, t)
      onClose()
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-[var(--bg-overlay)] flex items-end justify-center p-4">
      <div className="w-full max-w-sm bg-[var(--bg-card)] rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[var(--text-1)] font-semibold text-lg">{t.exportTitle}</h2>
          <button onClick={onClose} className="text-[var(--text-2)] text-xl">✕</button>
        </div>

        {filterLabel && (
          <p className="text-[var(--text-2)] text-sm">{filterLabel}</p>
        )}

        {error && <p className="text-[var(--danger-t)] text-sm">{error}</p>}

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => run('csv')}
            disabled={loading}
            className="bg-[var(--bg-input)] text-[var(--text-1)] rounded-xl py-3 font-medium disabled:opacity-50"
          >
            CSV
          </button>
          <button
            onClick={() => run('pdf')}
            disabled={loading}
            className="bg-[var(--accent-bg)] text-white rounded-xl py-3 font-medium disabled:opacity-50"
          >
            PDF
          </button>
        </div>

        {loading && <p className="text-center text-[var(--text-3)] text-sm">{t.exportPreparing}</p>}
      </div>
    </div>
  )
}
