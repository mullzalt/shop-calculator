import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { Capacitor } from '@capacitor/core'
import { Share } from '@capacitor/share'
import { Filesystem, Directory } from '@capacitor/filesystem'
import type { Transaction } from '../db/transactions'
import type { Locale, Translations } from './i18n'
import { formatDateTime } from './i18n'

function toRows(transactions: Transaction[], locale: Locale): string[][] {
  return transactions.map(t => [
    formatDateTime(t.created_at, locale),
    t.customer_name ?? '—',
    t.expression,
    String(t.amount),
  ])
}

export async function exportCSV(
  transactions: Transaction[],
  filename = 'transactions.csv',
  locale: Locale = 'id',
  t: Pick<Translations, 'exportColDate' | 'exportColCustomer' | 'exportColExpr' | 'exportColAmount'>,
) {
  const header = `${t.exportColDate},${t.exportColCustomer},${t.exportColExpr},${t.exportColAmount}\n`
  const rows = transactions.map(tx =>
    [
      `"${formatDateTime(tx.created_at, locale)}"`,
      `"${(tx.customer_name ?? '').replace(/"/g, '""')}"`,
      `"${tx.expression.replace(/"/g, '""')}"`,
      String(tx.amount),
    ].join(','),
  )
  const csv = header + rows.join('\n')

  if (Capacitor.isNativePlatform()) {
    const path = filename
    await Filesystem.writeFile({ path, data: btoa(unescape(encodeURIComponent(csv))), directory: Directory.Cache, encoding: undefined as unknown as never })
    const { uri } = await Filesystem.getUri({ path, directory: Directory.Cache })
    await Share.share({ title: t.exportColDate, url: uri })
  } else {
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = filename; a.click()
    URL.revokeObjectURL(url)
  }
}

export async function exportPDF(
  transactions: Transaction[],
  subtitle = '',
  filename = 'transactions.pdf',
  locale: Locale = 'id',
  t: Pick<Translations, 'exportReportTitle' | 'exportColDate' | 'exportColCustomer' | 'exportColExpr' | 'exportColAmount'>,
) {
  const doc = new jsPDF()
  doc.setFontSize(16)
  doc.text(t.exportReportTitle, 14, 16)
  if (subtitle) {
    doc.setFontSize(10)
    doc.text(subtitle, 14, 24)
  }

  autoTable(doc, {
    startY: subtitle ? 30 : 22,
    head: [[t.exportColDate, t.exportColCustomer, t.exportColExpr, t.exportColAmount]],
    body: toRows(transactions, locale),
    styles: { fontSize: 9 },
    columnStyles: { 3: { halign: 'right' } },
  })

  if (Capacitor.isNativePlatform()) {
    const base64 = doc.output('datauristring').split(',')[1]
    const path = filename
    await Filesystem.writeFile({ path, data: base64, directory: Directory.Cache, encoding: undefined as unknown as never })
    const { uri } = await Filesystem.getUri({ path, directory: Directory.Cache })
    await Share.share({ title: t.exportReportTitle, url: uri })
  } else {
    doc.save(filename)
  }
}
