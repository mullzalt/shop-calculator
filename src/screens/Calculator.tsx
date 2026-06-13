import { useReducer, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Numpad } from '../components/Numpad'
import { CustomerSearch } from '../components/CustomerSearch'
import { evalExpression } from '../lib/eval'
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
      if (key === '=') return state // result is shown in preview; expression stays
      // map display minus to ASCII minus for eval, but keep display version in expression
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

// Expose shared state via navigation state so Confirm screen can read it
export interface CalcSessionState {
  expression: string
  customer: Customer | null
  amount: number
}

export function Calculator() {
  const navigate = useNavigate()
  const [state, dispatch] = useReducer(calcReducer, { expression: '', customer: null })
  const [showSearch, setShowSearch] = useState(false)

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
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <span className="text-white font-semibold text-lg">Shop Calc</span>
        <div className="flex gap-4">
          <button
            onClick={() => navigate('/history')}
            className="text-indigo-400 text-sm font-medium"
          >
            History
          </button>
          <button
            onClick={() => navigate('/customers')}
            className="text-indigo-400 text-sm font-medium"
          >
            Customers
          </button>
        </div>
      </header>

      {/* Customer bar */}
      <button
        onClick={() => setShowSearch(true)}
        className="flex items-center gap-2 px-4 py-3 border-b border-gray-800 text-left"
      >
        <span className="text-gray-500 text-sm">Customer:</span>
        <span className={`flex-1 font-medium ${state.customer ? 'text-indigo-300' : 'text-gray-500'}`}>
          {state.customer ? state.customer.name : 'Walk-in (tap to assign)'}
        </span>
        <span className="text-gray-600 text-xs">▾</span>
      </button>

      {/* Expression display */}
      <div className="flex-1 flex flex-col items-end justify-end px-5 py-4 min-h-[120px]">
        <div className="w-full overflow-hidden text-right">
          <span className={`text-white font-mono tracking-tight break-all ${exprFontSize(state.expression)}`}>
            {state.expression || <span className="text-gray-600">0</span>}
          </span>
        </div>
        <div className="text-gray-400 text-xl mt-1 font-mono">
          {result !== null && state.expression
            ? `= ${result.toLocaleString('id-ID')}`
            : ''}
        </div>
      </div>

      {/* Numpad */}
      <Numpad onKey={handleKey} onConfirm={handleConfirm} confirmDisabled={!canConfirm} />

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
