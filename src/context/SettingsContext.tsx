import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { Locale } from '../lib/i18n'

export type { Locale }
export type ThemePreference = 'dark' | 'light' | 'system'
export type ResolvedTheme = 'dark' | 'light'

export interface CurrencyConfig {
  symbol: string
  symbolPosition: 'prefix' | 'suffix'
  decimalPlaces: 0 | 2
}

export interface PrintConfig {
  printerAddress: string | null
  printerName: string | null
  paperWidth: number
  headerText: string
  showDateTime: boolean
  showCustomer: boolean
  footerText: string
}

const DEFAULT_CURRENCY: CurrencyConfig = {
  symbol: 'Rp',
  symbolPosition: 'prefix',
  decimalPlaces: 0,
}

const DEFAULT_PRINT: PrintConfig = {
  printerAddress: null,
  printerName: null,
  paperWidth: 58,
  headerText: '',
  showDateTime: true,
  showCustomer: true,
  footerText: '',
}

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback
  } catch {
    return fallback
  }
}

interface SettingsValue {
  locale: Locale
  theme: ThemePreference
  resolvedTheme: ResolvedTheme
  currencyConfig: CurrencyConfig
  printConfig: PrintConfig
  setLocale: (l: Locale) => void
  setTheme: (t: ThemePreference) => void
  setCurrencyConfig: (c: CurrencyConfig) => void
  setPrintConfig: (p: PrintConfig) => void
}

const SettingsContext = createContext<SettingsValue | null>(null)

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function resolve(pref: ThemePreference): ResolvedTheme {
  return pref === 'system' ? getSystemTheme() : pref
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(
    () => (localStorage.getItem('locale') as Locale | null) ?? 'id'
  )
  const [theme, setThemeState] = useState<ThemePreference>(
    () => (localStorage.getItem('theme') as ThemePreference | null) ?? 'system'
  )
  const [resolvedTheme, setResolved] = useState<ResolvedTheme>(() =>
    resolve((localStorage.getItem('theme') as ThemePreference | null) ?? 'system')
  )
  const [currencyConfig, setCurrencyState] = useState<CurrencyConfig>(
    () => loadJSON('currency_config', DEFAULT_CURRENCY)
  )
  const [printConfig, setPrintState] = useState<PrintConfig>(
    () => loadJSON('print_config', DEFAULT_PRINT)
  )

  useEffect(() => {
    const r = resolve(theme)
    setResolved(r)
    document.documentElement.setAttribute('data-theme', r)
  }, [theme])

  useEffect(() => {
    if (theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => {
      const r: ResolvedTheme = e.matches ? 'dark' : 'light'
      setResolved(r)
      document.documentElement.setAttribute('data-theme', r)
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  const setLocale = useCallback((l: Locale) => {
    localStorage.setItem('locale', l)
    setLocaleState(l)
  }, [])

  const setTheme = useCallback((t: ThemePreference) => {
    localStorage.setItem('theme', t)
    setThemeState(t)
  }, [])

  const setCurrencyConfig = useCallback((c: CurrencyConfig) => {
    localStorage.setItem('currency_config', JSON.stringify(c))
    setCurrencyState(c)
  }, [])

  const setPrintConfig = useCallback((p: PrintConfig) => {
    localStorage.setItem('print_config', JSON.stringify(p))
    setPrintState(p)
  }, [])

  return (
    <SettingsContext.Provider value={{
      locale, theme, resolvedTheme,
      currencyConfig, printConfig,
      setLocale, setTheme,
      setCurrencyConfig, setPrintConfig,
    }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be inside SettingsProvider')
  return ctx
}
