import { useNavigate } from 'react-router-dom'
import { useSettings } from '../context/SettingsContext'
import { getTranslations } from '../lib/i18n'
import type { Locale, ThemePreference } from '../context/SettingsContext'

export function Settings() {
  const navigate = useNavigate()
  const { locale, theme, setLocale, setTheme } = useSettings()
  const t = getTranslations(locale)

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)]">
        <button onClick={() => navigate(-1)} className="text-[var(--accent)] text-sm font-medium">
          ← {t.back}
        </button>
        <span className="text-[var(--text-1)] font-semibold flex-1">{t.settingsTitle}</span>
      </header>

      <div className="flex-1 p-4 space-y-6 overflow-y-auto">
        <section>
          <h2 className="text-[var(--text-3)] text-xs font-medium uppercase tracking-wider mb-2 px-1">
            {t.language}
          </h2>
          <div className="bg-[var(--bg-card)] rounded-2xl overflow-hidden">
            {(['id', 'en'] as Locale[]).map((l, i) => (
              <button
                key={l}
                onClick={() => setLocale(l)}
                className={`w-full text-left px-4 py-4 flex items-center justify-between ${
                  i > 0 ? 'border-t border-[var(--border)]' : ''
                }`}
              >
                <span className="text-[var(--text-1)] text-base">
                  {l === 'id' ? t.languageId : t.languageEn}
                </span>
                {locale === l && <span className="text-[var(--accent)] font-semibold">✓</span>}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-[var(--text-3)] text-xs font-medium uppercase tracking-wider mb-2 px-1">
            {t.theme}
          </h2>
          <div className="bg-[var(--bg-card)] rounded-2xl overflow-hidden">
            {(['system', 'light', 'dark'] as ThemePreference[]).map((th, i) => {
              const label = th === 'dark' ? t.themeDark : th === 'light' ? t.themeLight : t.themeSystem
              return (
                <button
                  key={th}
                  onClick={() => setTheme(th)}
                  className={`w-full text-left px-4 py-4 flex items-center justify-between ${
                    i > 0 ? 'border-t border-[var(--border)]' : ''
                  }`}
                >
                  <span className="text-[var(--text-1)] text-base">{label}</span>
                  {theme === th && <span className="text-[var(--accent)] font-semibold">✓</span>}
                </button>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
