import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { Locale } from '../lib/i18n'

export type { Locale }
export type ThemePreference = 'dark' | 'light' | 'system'
export type ResolvedTheme = 'dark' | 'light'

interface SettingsValue {
  locale: Locale
  theme: ThemePreference
  resolvedTheme: ResolvedTheme
  setLocale: (l: Locale) => void
  setTheme: (t: ThemePreference) => void
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

  return (
    <SettingsContext.Provider value={{ locale, theme, resolvedTheme, setLocale, setTheme }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be inside SettingsProvider')
  return ctx
}
