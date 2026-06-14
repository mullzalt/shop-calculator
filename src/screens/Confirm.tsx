import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { CustomerSearch } from '../components/CustomerSearch'
import { createTransaction } from '../db/transactions'
import { useSettings } from '../context/SettingsContext'
import { useToast } from '../context/ToastContext'
import { getTranslations, formatAmount, formatCurrency } from '../lib/i18n'
import type { CalcSessionState } from './Calculator'
import type { Customer } from '../db/customers'

export function Confirm() {
  const navigate = useNavigate()
  const location = useLocation()
  const session = location.state as CalcSessionState | null

  const [customer, setCustomer] = useState<Customer | null>(session?.customer ?? null)
  const [showSearch, setShowSearch] = useState(false)
  const [saving, setSaving] = useState(false)
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 400)
    return () => clearTimeout(t)
  }, [])


  const { locale } = useSettings()
  const { showToast } = useToast()
  const t = getTranslations(locale)

  if (!session) {
    navigate('/')
    return null
  }

  async function handleSave() {
    if (!session) return
    setSaving(true)
    try {
      await createTransaction({
        customer_id: customer?.id ?? null,
        amount: session.amount,
        expression: session.expression,
      })
      sessionStorage.removeItem('calc_draft')
      showToast(t.toastSaved(formatCurrency(session.amount, locale)))
      navigate('/', { replace: true })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)]">
        <button
          onClick={() => navigate('/', { state: { restore: session } })}
          className="text-[var(--accent)] text-sm font-medium"
        >
          {t.backToEdit}
        </button>
        <span className="text-[var(--text-3)] text-sm flex-1 text-right">{t.confirmTitle}</span>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
        {/* Amount */}
        <div className="text-center">
          <div className="text-[var(--text-3)] text-sm mb-1">{t.totalAmount}</div>
          <div className="text-[var(--text-1)] text-5xl font-bold tracking-tight">
            {formatAmount(session.amount, locale)}
          </div>
          <div className="text-[var(--text-4)] text-sm mt-2 font-mono">{session.expression}</div>
        </div>

        {/* Customer */}
        <div
          onClick={() => setShowSearch(true)}
          className="w-full max-w-sm bg-[var(--bg-card)] rounded-2xl px-5 py-4 flex items-center justify-between cursor-pointer"
        >
          <div>
            <div className="text-[var(--text-3)] text-xs mb-0.5">{t.filterCustomer}</div>
            <div className={`font-medium ${customer ? 'text-[var(--accent-txt)]' : 'text-[var(--text-3)]'}`}>
              {customer ? customer.name : t.walkinCustomer}
            </div>
          </div>
          <span className="text-[var(--text-4)] text-sm">{t.changeCustomer}</span>
        </div>
      </div>

      {/* Save button */}
      <div className="p-5">
        <button
          onClick={handleSave}
          disabled={saving || !ready}
          className="w-full bg-[var(--confirm)] disabled:opacity-50 text-white rounded-2xl py-4 text-lg font-semibold"
        >
          {saving ? t.saving : t.saveAndNew}
        </button>
      </div>

      {showSearch && (
        <CustomerSearch
          selected={customer}
          onSelect={setCustomer}
          onClose={() => setShowSearch(false)}
        />
      )}
    </div>
  )
}
