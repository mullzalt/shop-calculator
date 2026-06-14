import { CapacitorThermalPrinter } from 'capacitor-thermal-printer'
import type { CurrencyConfig, PrintConfig } from '../context/SettingsContext'
import { formatPrintAmount } from './i18n'

export async function printReceipt(opts: {
  amount: number
  customer: string | null
  createdAt: string
  printConfig: PrintConfig
  currencyConfig: CurrencyConfig
}): Promise<void> {
  const { amount, customer, createdAt, printConfig, currencyConfig } = opts

  if (!printConfig.printerAddress) throw new Error('No printer configured')

  await CapacitorThermalPrinter.connect({ address: printConfig.printerAddress })

  const sepLen = Math.min(Math.round(printConfig.paperWidth * 0.55), 48)
  const sep = '-'.repeat(sepLen)

  CapacitorThermalPrinter.begin()

  if (printConfig.headerText) {
    for (const line of printConfig.headerText.split('\n')) {
      CapacitorThermalPrinter.align('center').text(line + '\n')
    }
    CapacitorThermalPrinter.align('center').text(sep + '\n')
  }

  CapacitorThermalPrinter
    .align('center')
    .doubleWidth(true)
    .doubleHeight(true)
    .bold(true)
    .text(formatPrintAmount(amount, currencyConfig) + '\n')
    .bold(false)
    .doubleWidth(false)
    .doubleHeight(false)

  if (printConfig.showCustomer && customer) {
    CapacitorThermalPrinter.align('left').text(customer + '\n')
  }

  if (printConfig.showDateTime) {
    const dt = new Date(createdAt).toLocaleString('id-ID', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
    CapacitorThermalPrinter.align('left').text(dt + '\n')
  }

  if (printConfig.footerText) {
    CapacitorThermalPrinter.align('center').text(sep + '\n')
    for (const line of printConfig.footerText.split('\n')) {
      CapacitorThermalPrinter.align('center').text(line + '\n')
    }
  }

  await CapacitorThermalPrinter.feedCutPaper().write()
}
