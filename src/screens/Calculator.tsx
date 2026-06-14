import { useReducer, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Calculator as CalcIcon, History as HistoryIcon, Users, Settings as SettingsIcon } from 'lucide-react'
import { Numpad } from '../components/Numpad'
import { CustomerSearch } from '../components/CustomerSearch'
import { evalExpression } from '../lib/eval'
import { useSettings } from '../context/SettingsContext'
import { getTranslations, formatAmount } from '../lib/i18n'
import type { Customer } from '../db/customers'

interface HistoryEntry {
  expression: string
  result: number
}

interface CalcState {
  expression: string
  customer: Customer | null
  history: HistoryEntry[]
}

type CalcAction =
  | { type: 'key'; key: string }
  | { type: 'setCustomer'; customer: Customer | null }
  | { type: 'clear' }
  | { type: 'restore'; expression: string }

function calcReducer(state: CalcState, action: CalcAction): CalcState {
  switch (action.type) {
    case 'setCustomer':
      return { ...state, customer: action.customer }
    case 'clear':
      return { expression: '', customer: null, history: [] }
    case 'restore':
      return { ...state, expression: action.expression }
    case 'key': {
      const { key } = action
      if (key === 'C') return { ...state, expression: '', history: [] }
      if (key === 'DEL') return { ...state, expression: state.expression.slice(0, -1) }
      if (key === '=') {
        const r = evalExpression(state.expression)
        if (r === null) return state
        return {
          ...state,
          expression: String(r),
          history: [{ expression: state.expression, result: r }, ...state.history],
        }
      }
      if (key === '.') {
        const tokenMatch = /(?:^|[+\-×÷−(])(\d*\.?\d*)$/.exec(state.expression)
        const token = tokenMatch?.[1] ?? ''
        if (token.includes('.')) return state
        if (token === '') return { ...state, expression: state.expression + '0.' }
        return { ...state, expression: state.expression + '.' }
      }
      if (key === '00') {
        if (!state.expression) return state
        const lastTokenIsZero = /(?:^|[+\-×÷−(])0$/.test(state.expression)
        if (lastTokenIsZero) return state
        return { ...state, expression: state.expression + '00' }
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
  const location = useLocation()

  const [state, dispatch] = useReducer(calcReducer, location, (loc): CalcState => {
    const restored = (loc.state as { restore?: CalcSessionState } | null)?.restore
    if (restored) {
      sessionStorage.removeItem('calc_draft')
      return { expression: restored.expression, customer: restored.customer, history: [] }
    }
    const raw = sessionStorage.getItem('calc_draft')
    if (raw) {
      sessionStorage.removeItem('calc_draft')
      try {
        const { expression, customer } = JSON.parse(raw)
        return { expression: expression ?? '', customer: customer ?? null, history: [] }
      } catch { /* ignore malformed */ }
    }
    return { expression: '', customer: null, history: [] }
  })
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
    sessionStorage.setItem('calc_draft', JSON.stringify({
      expression: state.expression,
      customer: state.customer ? { id: state.customer.id, name: state.customer.name } : null,
    }))
    navigate('/confirm', { state: session })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Nav bar */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <button onClick={() => navigate('/')} className="text-[var(--text-1)] p-1">
          <CalcIcon size={24} />
        </button>
        <div className="flex gap-1">
          <button onClick={() => navigate('/history')} className="text-[var(--accent)] p-2">
            <HistoryIcon size={22} />
          </button>
          <button onClick={() => navigate('/customers')} className="text-[var(--accent)] p-2">
            <Users size={22} />
          </button>
          <button onClick={() => navigate('/settings')} className="text-[var(--accent)] p-2">
            <SettingsIcon size={22} />
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

      {/* Session history */}
      {state.history.length > 0 && (
        <div className="overflow-y-auto max-h-32 flex flex-col-reverse px-5 pt-1 pb-1 border-b border-[var(--border)]">
          {state.history.map((h, i) => (
            <button
              key={i}
              onPointerDown={e => { e.preventDefault(); dispatch({ type: 'restore', expression: h.expression }) }}
              className="w-full text-right py-1 border-b border-[var(--border)] last:border-0 active:opacity-60"
            >
              <div className="text-[var(--text-4)] text-xs font-mono truncate">{h.expression}</div>
              <div className="text-[var(--text-2)] text-sm font-mono">{formatAmount(h.result, locale)}</div>
            </button>
          ))}
        </div>
      )}

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
          allowCreate
        />
      )}
    </div>
  )
}
