import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { CapacitorThermalPrinter } from 'capacitor-thermal-printer'
import type { BluetoothDevice } from 'capacitor-thermal-printer'
import { BluetoothScanModal } from '../components/BluetoothScanModal'
import { useSettings } from '../context/SettingsContext'
import { getTranslations } from '../lib/i18n'
import type { Locale, ThemePreference, CurrencyConfig, PrintConfig } from '../context/SettingsContext'

function SectionHeader({ label }: { label: string }) {
  return (
    <h2 className="text-[var(--text-3)] text-xs font-medium uppercase tracking-wider mb-2 px-1">
      {label}
    </h2>
  )
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex items-center justify-between px-4 py-4 cursor-pointer">
      <span className="text-[var(--text-1)] text-base">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="w-5 h-5 accent-[var(--accent-bg)]"
      />
    </label>
  )
}

export function Settings() {
  const navigate = useNavigate()
  const { locale, theme, currencyConfig, printConfig, setLocale, setTheme, setCurrencyConfig, setPrintConfig } = useSettings()
  const t = getTranslations(locale)

  const [showScan, setShowScan] = useState(false)
  const [customWidth, setCustomWidth] = useState(
    printConfig.paperWidth !== 58 && printConfig.paperWidth !== 80
      ? String(printConfig.paperWidth)
      : ''
  )
  const isCustomWidth = printConfig.paperWidth !== 58 && printConfig.paperWidth !== 80

  function updateCurrency(patch: Partial<CurrencyConfig>) {
    setCurrencyConfig({ ...currencyConfig, ...patch })
  }

  function updatePrint(patch: Partial<PrintConfig>) {
    setPrintConfig({ ...printConfig, ...patch })
  }

  function onPrinterSelected(device: BluetoothDevice) {
    updatePrint({ printerAddress: device.address, printerName: device.name })
    setShowScan(false)
  }

  async function onDisconnect() {
    await CapacitorThermalPrinter.disconnect().catch(() => {})
    updatePrint({ printerAddress: null, printerName: null })
  }

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)]">
        <button onClick={() => navigate(-1)} className="text-[var(--accent)] p-1 -ml-1">
          <ChevronLeft size={24} />
        </button>
        <span className="text-[var(--text-1)] font-semibold flex-1">{t.settingsTitle}</span>
      </header>

      <div className="flex-1 p-4 space-y-6 overflow-y-auto">
        {/* Language */}
        <section>
          <SectionHeader label={t.language} />
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

        {/* Theme */}
        <section>
          <SectionHeader label={t.theme} />
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

        {/* Currency */}
        <section>
          <SectionHeader label={t.currency} />
          <div className="bg-[var(--bg-card)] rounded-2xl overflow-hidden">
            {/* Symbol */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-[var(--border)]">
              <span className="text-[var(--text-1)] text-base">{t.currencySymbol}</span>
              <input
                type="text"
                value={currencyConfig.symbol}
                onChange={e => updateCurrency({ symbol: e.target.value })}
                className="w-20 bg-[var(--bg-input)] text-[var(--text-1)] rounded-lg px-3 py-1.5 text-sm text-right outline-none"
              />
            </div>

            {/* Position */}
            <div className="px-4 py-3 border-b border-[var(--border)]">
              <div className="text-[var(--text-3)] text-xs mb-2">{t.currencySymbol}</div>
              <div className="flex gap-2">
                {(['prefix', 'suffix'] as const).map(pos => (
                  <button
                    key={pos}
                    onClick={() => updateCurrency({ symbolPosition: pos })}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                      currencyConfig.symbolPosition === pos
                        ? 'bg-[var(--accent-bg)] text-white'
                        : 'bg-[var(--bg-input)] text-[var(--text-1)]'
                    }`}
                  >
                    {pos === 'prefix' ? t.symbolPrefix : t.symbolSuffix}
                  </button>
                ))}
              </div>
            </div>

            {/* Decimal places */}
            <div className="px-4 py-3">
              <div className="text-[var(--text-3)] text-xs mb-2">{t.decimalPlaces}</div>
              <div className="flex gap-2">
                {([0, 2] as const).map(d => (
                  <button
                    key={d}
                    onClick={() => updateCurrency({ decimalPlaces: d })}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                      currencyConfig.decimalPlaces === d
                        ? 'bg-[var(--accent-bg)] text-white'
                        : 'bg-[var(--bg-input)] text-[var(--text-1)]'
                    }`}
                  >
                    {d === 0 ? '1.000' : '1.000,00'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Printer */}
        <section>
          <SectionHeader label={t.printer} />
          <div className="bg-[var(--bg-card)] rounded-2xl overflow-hidden">
            {/* Select printer */}
            <div className="flex items-center border-b border-[var(--border)]">
              <button
                onClick={() => setShowScan(true)}
                className="flex-1 text-left px-4 py-4"
              >
                <div className="text-[var(--text-1)] text-base">{t.selectPrinter}</div>
                <div className="text-[var(--text-3)] text-xs mt-0.5">
                  {printConfig.printerName ?? t.noPrinter}
                </div>
              </button>
              {printConfig.printerAddress ? (
                <button
                  onClick={onDisconnect}
                  className="text-[var(--danger-t)] text-sm font-medium px-4 py-4"
                >
                  {t.disconnect}
                </button>
              ) : (
                <span className="text-[var(--text-4)] text-sm pr-4">›</span>
              )}
            </div>

            {/* Paper width */}
            <div className="px-4 py-3 border-b border-[var(--border)]">
              <div className="text-[var(--text-3)] text-xs mb-2">{t.paperWidth}</div>
              <div className="flex gap-2">
                {[58, 80].map(w => (
                  <button
                    key={w}
                    onClick={() => { updatePrint({ paperWidth: w }); setCustomWidth('') }}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                      printConfig.paperWidth === w && !isCustomWidth
                        ? 'bg-[var(--accent-bg)] text-white'
                        : 'bg-[var(--bg-input)] text-[var(--text-1)]'
                    }`}
                  >
                    {w}mm
                  </button>
                ))}
                <div className={`flex-1 flex items-center rounded-xl overflow-hidden ${isCustomWidth ? 'bg-[var(--accent-bg)]' : 'bg-[var(--bg-input)]'}`}>
                  <input
                    type="number"
                    value={customWidth}
                    placeholder="…"
                    onChange={e => {
                      setCustomWidth(e.target.value)
                      const n = parseInt(e.target.value)
                      if (n > 0) updatePrint({ paperWidth: n })
                    }}
                    className={`w-full bg-transparent py-2 px-3 text-sm outline-none text-center ${isCustomWidth ? 'text-white placeholder:text-white/70' : 'text-[var(--text-1)]'}`}
                  />
                </div>
              </div>
            </div>

            {/* Header text */}
            <div className="px-4 py-3 border-b border-[var(--border)]">
              <label className="text-[var(--text-3)] text-xs block mb-2">{t.headerText}</label>
              <textarea
                value={printConfig.headerText}
                onChange={e => updatePrint({ headerText: e.target.value })}
                rows={2}
                placeholder="Nama Toko"
                className="w-full bg-[var(--bg-input)] text-[var(--text-1)] rounded-xl px-3 py-2 text-sm outline-none resize-none"
              />
            </div>

            {/* Show date/time */}
            <div className="border-b border-[var(--border)]">
              <ToggleRow
                label={t.showDateTime}
                checked={printConfig.showDateTime}
                onChange={v => updatePrint({ showDateTime: v })}
              />
            </div>

            {/* Show customer */}
            <div className="border-b border-[var(--border)]">
              <ToggleRow
                label={t.showCustomer}
                checked={printConfig.showCustomer}
                onChange={v => updatePrint({ showCustomer: v })}
              />
            </div>

            {/* Footer text */}
            <div className="px-4 py-3">
              <label className="text-[var(--text-3)] text-xs block mb-2">{t.footerText}</label>
              <textarea
                value={printConfig.footerText}
                onChange={e => updatePrint({ footerText: e.target.value })}
                rows={2}
                placeholder="Terima kasih!"
                className="w-full bg-[var(--bg-input)] text-[var(--text-1)] rounded-xl px-3 py-2 text-sm outline-none resize-none"
              />
            </div>
          </div>
        </section>
      </div>

      {showScan && (
        <BluetoothScanModal
          t={t}
          onSelect={onPrinterSelected}
          onClose={() => setShowScan(false)}
        />
      )}
    </div>
  )
}
