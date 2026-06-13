import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { Capacitor } from '@capacitor/core'
import { Share } from '@capacitor/share'
import { Filesystem, Directory } from '@capacitor/filesystem'
import type { Transaction } from '../db/transactions'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('id-ID', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

function toRows(transactions: Transaction[]): string[][] {
  return transactions.map(t => [
    formatDate(t.created_at),
    t.customer_name ?? '—',
    t.expression,
    String(t.amount),
  ])
}

export async function exportCSV(transactions: Transaction[], filename = 'transactions.csv') {
  const header = 'Date,Customer,Expression,Amount\n'
  const rows = transactions.map(t =>
    [
      `"${formatDate(t.created_at)}"`,
      `"${(t.customer_name ?? '').replace(/"/g, '""')}"`,
      `"${t.expression.replace(/"/g, '""')}"`,
      String(t.amount),
    ].join(','),
  )
  const csv = header + rows.join('\n')

  if (Capacitor.isNativePlatform()) {
    const path = filename
    await Filesystem.writeFile({ path, data: btoa(unescape(encodeURIComponent(csv))), directory: Directory.Cache, encoding: undefined as unknown as never })
    const { uri } = await Filesystem.getUri({ path, directory: Directory.Cache })
    await Share.share({ title: 'Transaction Report', url: uri })
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
) {
  const doc = new jsPDF()
  doc.setFontSize(16)
  doc.text('Transaction Report', 14, 16)
  if (subtitle) {
    doc.setFontSize(10)
    doc.text(subtitle, 14, 24)
  }

  autoTable(doc, {
    startY: subtitle ? 30 : 22,
    head: [['Date', 'Customer', 'Expression', 'Amount']],
    body: toRows(transactions),
    styles: { fontSize: 9 },
    columnStyles: { 3: { halign: 'right' } },
  })

  if (Capacitor.isNativePlatform()) {
    const base64 = doc.output('datauristring').split(',')[1]
    const path = filename
    await Filesystem.writeFile({ path, data: base64, directory: Directory.Cache, encoding: undefined as unknown as never })
    const { uri } = await Filesystem.getUri({ path, directory: Directory.Cache })
    await Share.share({ title: 'Transaction Report', url: uri })
  } else {
    doc.save(filename)
  }
}
