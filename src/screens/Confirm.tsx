import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { CustomerSearch } from '../components/CustomerSearch'
import { createTransaction } from '../db/transactions'
import type { CalcSessionState } from './Calculator'
import type { Customer } from '../db/customers'

export function Confirm() {
  const navigate = useNavigate()
  const location = useLocation()
  const session = location.state as CalcSessionState | null

  const [customer, setCustomer] = useState<Customer | null>(session?.customer ?? null)
  const [showSearch, setShowSearch] = useState(false)
  const [saving, setSaving] = useState(false)
  // Guard against touch bleed from the numpad ✓ button landing on Save
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 400)
    return () => clearTimeout(t)
  }, [])

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
      navigate('/', { replace: true })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-gray-800">
        <button
          onClick={() => navigate(-1)}
          className="text-indigo-400 text-sm font-medium"
        >
          ← Back to Edit
        </button>
        <span className="text-gray-400 text-sm flex-1 text-right">Confirm Transaction</span>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
        {/* Amount */}
        <div className="text-center">
          <div className="text-gray-500 text-sm mb-1">Total Amount</div>
          <div className="text-white text-5xl font-bold tracking-tight">
            {session.amount.toLocaleString('id-ID')}
          </div>
          <div className="text-gray-600 text-sm mt-2 font-mono">{session.expression}</div>
        </div>

        {/* Customer */}
        <div
          onClick={() => setShowSearch(true)}
          className="w-full max-w-sm bg-gray-800 rounded-2xl px-5 py-4 flex items-center justify-between cursor-pointer"
        >
          <div>
            <div className="text-gray-500 text-xs mb-0.5">Customer</div>
            <div className={`font-medium ${customer ? 'text-indigo-300' : 'text-gray-500'}`}>
              {customer ? customer.name : 'Walk-in customer'}
            </div>
          </div>
          <span className="text-gray-600 text-sm">Change ›</span>
        </div>
      </div>

      {/* Save button */}
      <div className="p-5">
        <button
          onClick={handleSave}
          disabled={saving || !ready}
          className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-2xl py-4 text-lg font-semibold"
        >
          {saving ? 'Saving…' : 'Save & New Transaction'}
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
