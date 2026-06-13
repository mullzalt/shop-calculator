interface NumpadProps {
  onKey: (key: string) => void
  onConfirm: () => void
  confirmDisabled?: boolean
}

type Key = { label: string; value: string; wide?: boolean; accent?: boolean; confirm?: boolean; danger?: boolean }

const KEYS: Key[][] = [
  [
    { label: 'C', value: 'C', danger: true },
    { label: '⌫', value: 'DEL', wide: true },
    { label: '÷', value: '÷', accent: true },
  ],
  [
    { label: '7', value: '7' },
    { label: '8', value: '8' },
    { label: '9', value: '9' },
    { label: '×', value: '×', accent: true },
  ],
  [
    { label: '4', value: '4' },
    { label: '5', value: '5' },
    { label: '6', value: '6' },
    { label: '−', value: '−', accent: true },
  ],
  [
    { label: '1', value: '1' },
    { label: '2', value: '2' },
    { label: '3', value: '3' },
    { label: '+', value: '+', accent: true },
  ],
  [
    { label: '0', value: '0', wide: true },
    { label: '=', value: '=' },
    { label: '✓', value: 'CONFIRM', confirm: true },
  ],
]

export function Numpad({ onKey, onConfirm, confirmDisabled }: NumpadProps) {
  return (
    <div className="grid grid-cols-4 gap-2 p-3">
      {KEYS.flat().map((key) => {
        const isConfirm = key.value === 'CONFIRM'
        const base =
          'h-16 rounded-2xl text-2xl font-semibold select-none active:scale-95 transition-transform flex items-center justify-center cursor-pointer'
        let color = 'bg-gray-700 text-white'
        if (key.danger) color = 'bg-red-900/60 text-red-300'
        else if (key.accent) color = 'bg-indigo-800/70 text-indigo-200'
        else if (isConfirm)
          color = confirmDisabled
            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
            : 'bg-emerald-600 text-white'

        return (
          <button
            key={key.value}
            className={`${base} ${color}${key.wide ? ' col-span-2' : ''}`}
            // Confirm uses onClick so the full tap cycle completes before
            // navigating — prevents touch bleed onto the next screen's save button.
            // All other keys use onPointerDown for instant response.
            {...(isConfirm
              ? {
                  onClick: () => { if (!confirmDisabled) onConfirm() },
                }
              : {
                  onPointerDown: (e) => { e.preventDefault(); onKey(key.value) },
                })}
            disabled={isConfirm && confirmDisabled}
          >
            {key.label}
          </button>
        )
      })}
    </div>
  )
}
