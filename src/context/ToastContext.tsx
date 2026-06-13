import { createContext, useContext, useState, useCallback, useRef } from 'react'

interface ToastValue {
  showToast: (message: string) => void
}

const ToastContext = createContext<ToastValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be inside ToastProvider')
  return ctx
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState<string | null>(null)
  const [visible, setVisible] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = useCallback((msg: string) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setMessage(msg)
    setVisible(true)
    timerRef.current = setTimeout(() => setVisible(false), 2500)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        aria-live="polite"
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] transition-all duration-300 ${
          visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'
        }`}
      >
        {message && (
          <div className="bg-[var(--bg-card)] text-[var(--text-1)] text-sm font-medium px-5 py-3 rounded-2xl shadow-xl whitespace-nowrap border border-[var(--border)]">
            {message}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  )
}
