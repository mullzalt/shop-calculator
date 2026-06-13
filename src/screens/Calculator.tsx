import { useReducer, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Numpad } from '../components/Numpad'
import { CustomerSearch } from '../components/CustomerSearch'
import { evalExpression } from '../lib/eval'
import { useSettings } from '../context/SettingsContext'
import { getTranslations, formatAmount } from '../lib/i18n'
import type { Customer } from '../db/customers'

interface CalcState {
  expression: string
  customer: Customer | null
}

type CalcAction =
  | { type: 'key'; key: string }
  | { type: 'setCustomer'; customer: Customer | null }
  | { type: 'clear' }

function calcReducer(state: CalcState, action: CalcAction): CalcState {
  switch (action.type) {
    case 'setCustomer':
      return { ...state, customer: action.customer }
    case 'clear':
      return { expression: '', customer: null }
    case 'key': {
      const { key } = action
      if (key === 'C') return { ...state, expression: '' }
      if (key === 'DEL') return { ...state, expression: state.expression.slice(0, -1) }
      if (key === '=') {
        const r = evalExpression(state.expression)
        return r !== null ? { ...state, expression: String(r) } : state
      }
      const isDigit = /^[0-9]$/.test(key)
      const lastTokenIsZero = /(?:^|[+\-×÷−(])0$/.test(state.expression)
      if (isDigit && lastTokenIsZero) {
        if (key === '0') return state
        return { ...state, expression: state.expression.slice(0, -1) + key }
      }
      return { ...state, expression: state.expression + key }
    }
  }
}

function exprFontSize(expr: string): string {
  if (expr.length <= 8)  return 'text-4xl'
  if (expr.length <= 13) return 'text-3xl'
  if (expr.length <= 18) return 'text-2xl'
  return 'text-xl'
}

export interface CalcSessionState {
  expression: string
  customer: Customer | null
  amount: number
}

export function Calculator() {
  const navigate = useNavigate()
  const [state, dispatch] = useReducer(calcReducer, { expression: '', customer: null })
  const [showSearch, setShowSearch] = useState(false)
  const { locale } = useSettings()
  const t = getTranslations(locale)

  const result = evalExpression(state.expression)
  const canConfirm = result !== null && result > 0

  function handleKey(key: string) {
    dispatch({ type: 'key', key })
  }

  function handleConfirm() {
    if (!canConfirm || result === null) return
    const session: CalcSessionState = {
      expression: state.expression,
      customer: state.customer,
      amount: result,
    }
    navigate('/confirm', { state: session })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Nav bar */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <span className="text-[var(--text-1)] font-semibold text-lg">{t.appName}</span>
        <div className="flex gap-4">
          <button
            onClick={() => navigate('/history')}
            className="text-[var(--accent)] text-sm font-medium"
          >
            {t.history}
          </button>
          <button
            onClick={() => navigate('/customers')}
            className="text-[var(--accent)] text-sm font-medium"
          >
            {t.customers}
          </button>
          <button
            onClick={() => navigate('/settings')}
            className="text-[var(--accent)] text-sm font-medium"
          >
            {t.settings}
          </button>
        </div>
      </header>

      {/* Customer bar + confirm button */}
      <div className="flex items-center border-b border-[var(--border)]">
        <button
          onClick={() => setShowSearch(true)}
          className="flex-1 flex items-center gap-2 px-4 py-3 text-left"
        >
          <span className="text-[var(--text-3)] text-sm">{t.customer}</span>
          <span className={`flex-1 font-medium ${state.customer ? 'text-[var(--accent-txt)]' : 'text-[var(--text-3)]'}`}>
            {state.customer ? state.customer.name : t.walkin}
          </span>
          <span className="text-[var(--text-4)] text-xs">▾</span>
        </button>
        <button
          onClick={handleConfirm}
          disabled={!canConfirm}
          className={`px-5 py-3 text-2xl font-bold border-l border-[var(--border)] ${
            canConfirm ? 'text-[var(--confirm-t)]' : 'text-[var(--text-4)]'
          }`}
        >
          ✓
        </button>
      </div>

      {/* Expression display */}
      <div className="flex-1 flex flex-col items-end justify-end px-5 py-4 min-h-[120px]">
        <div className="w-full overflow-hidden text-right">
          <span className={`text-[var(--text-1)] font-mono tracking-tight whitespace-nowrap ${exprFontSize(state.expression)}`}>
            {state.expression || <span className="text-[var(--text-4)]">0</span>}
          </span>
        </div>
        <div className="text-[var(--text-2)] text-xl mt-1 font-mono">
          {result !== null && state.expression
            ? `= ${formatAmount(result, locale)}`
            : ''}
        </div>
      </div>

      {/* Numpad */}
      <Numpad onKey={handleKey} />

      {showSearch && (
        <CustomerSearch
          selected={state.customer}
          onSelect={c => dispatch({ type: 'setCustomer', customer: c })}
          onClose={() => setShowSearch(false)}
        />
      )}
    </div>
  )
}
