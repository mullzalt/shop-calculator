import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ChevronLeft, Printer } from 'lucide-react'
import type { BluetoothDevice } from 'capacitor-thermal-printer'
import { CustomerSearch } from '../components/CustomerSearch'
import { BluetoothScanModal } from '../components/BluetoothScanModal'
import { createTransaction } from '../db/transactions'
import { useSettings } from '../context/SettingsContext'
import { useToast } from '../context/ToastContext'
import { getTranslations, formatCurrency } from '../lib/i18n'
import { printReceipt } from '../lib/print'
import type { CalcSessionState } from './Calculator'
import type { Customer } from '../db/customers'

export function Confirm() {
  const navigate = useNavigate()
  const location = useLocation()
  const session = location.state as CalcSessionState | null

  const [customer, setCustomer] = useState<Customer | null>(session?.customer ?? null)
  const [showSearch, setShowSearch] = useState(false)
  const [showPrinterScan, setShowPrinterScan] = useState(false)
  const [pendingPrint, setPendingPrint] = useState(false)
  const [saving, setSaving] = useState(false)
  const [printing, setPrinting] = useState(false)
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 400)
    return () => clearTimeout(t)
  }, [])

  const { locale, currencyConfig, printConfig, setPrintConfig } = useSettings()
  const { showToast } = useToast()
  const t = getTranslations(locale)

  if (!session) {
    navigate('/')
    return null
  }

  async function doSave() {
    await createTransaction({
      customer_id: customer?.id ?? null,
      amount: session!.amount,
      expression: session!.expression,
    })
    sessionStorage.removeItem('calc_draft')
  }

  async function doSaveAndPrint(printerAddress: string) {
    setSaving(true)
    try {
      await doSave()
      setPrinting(true)
      try {
        await printReceipt({
          amount: session!.amount,
          customer: customer?.name ?? null,
          createdAt: new Date().toISOString(),
          printConfig: { ...printConfig, printerAddress },
          currencyConfig,
        })
        showToast(t.printed)
      } catch {
        showToast(t.printError)
      } finally {
        setPrinting(false)
      }
      navigate('/', { replace: true })
    } finally {
      setSaving(false)
    }
  }

  async function handleSave() {
    if (!session) return
    setSaving(true)
    try {
      await doSave()
      showToast(t.toastSaved(formatCurrency(session.amount, locale)))
      navigate('/', { replace: true })
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveAndPrint() {
    if (!session) return
    if (!printConfig.printerAddress) {
      setPendingPrint(true)
      setShowPrinterScan(true)
      return
    }
    await doSaveAndPrint(printConfig.printerAddress)
  }

  async function onPrinterSelected(device: BluetoothDevice) {
    const updated = { ...printConfig, printerAddress: device.address, printerName: device.name }
    setPrintConfig(updated)
    setShowPrinterScan(false)
    if (pendingPrint) {
      setPendingPrint(false)
      await doSaveAndPrint(device.address)
    }
  }

  const busy = saving || printing

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)]">
        <button
          onClick={() => navigate('/', { state: { restore: session } })}
          className="text-[var(--accent)] p-1 -ml-1"
        >
          <ChevronLeft size={24} />
        </button>
        <span className="text-[var(--text-3)] text-sm flex-1 text-right">{t.confirmTitle}</span>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
        {/* Amount */}
        <div className="text-center">
          <div className="text-[var(--text-3)] text-sm mb-1">{t.totalAmount}</div>
          <div className="text-[var(--text-1)] text-5xl font-bold tracking-tight">
            {session.amount.toLocaleString('id-ID')}
          </div>
          <div className="text-[var(--text-4)] text-sm mt-2 font-mono">{session.expression}</div>
        </div>

        {/* Customer */}
        <div
          onClick={() => setShowSearch(true)}
          className="w-full max-w-sm bg-[var(--bg-card)] rounded-2xl px-5 py-4 flex items-center justify-between cursor-pointer"
        >
          <div>
            <div className="text-[var(--text-3)] text-xs mb-0.5">{t.filterCustomer}</div>
            <div className={`font-medium ${customer ? 'text-[var(--accent-txt)]' : 'text-[var(--text-3)]'}`}>
              {customer ? customer.name : t.walkinCustomer}
            </div>
          </div>
          <span className="text-[var(--text-4)] text-sm">{t.changeCustomer}</span>
        </div>
      </div>

      {/* Buttons */}
      <div className="p-5 flex gap-3">
        <button
          onClick={handleSave}
          disabled={busy || !ready}
          className="flex-1 bg-[var(--confirm)] disabled:opacity-50 text-white rounded-2xl py-4 text-base font-semibold"
        >
          {saving && !printing ? t.saving : t.saveAndNew}
        </button>
        <button
          onClick={handleSaveAndPrint}
          disabled={busy || !ready}
          className="flex-1 bg-[var(--accent-bg)] disabled:opacity-50 text-white rounded-2xl py-4 text-base font-semibold flex items-center justify-center gap-2"
        >
          {printing ? (
            <span>{t.printing}</span>
          ) : (
            <>
              <Printer size={18} />
              <span>{t.saveAndPrint}</span>
            </>
          )}
        </button>
      </div>

      {showSearch && (
        <CustomerSearch
          selected={customer}
          onSelect={setCustomer}
          onClose={() => setShowSearch(false)}
        />
      )}

      {showPrinterScan && (
        <BluetoothScanModal
          t={t}
          onSelect={onPrinterSelected}
          onClose={() => { setShowPrinterScan(false); setPendingPrint(false) }}
        />
      )}
    </div>
  )
}
