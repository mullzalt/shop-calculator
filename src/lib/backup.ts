import { Capacitor } from '@capacitor/core'
import { Share } from '@capacitor/share'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { getDB } from '../db/client'

interface BackupCustomer {
  id: number
  name: string
  created_at: string
}

interface BackupTransaction {
  id: number
  customer_id: number | null
  amount: number
  expression: string
  note: string | null
  paid: number
  created_at: string
  updated_at: string
}

interface BackupData {
  version: 1
  exported_at: string
  customers: BackupCustomer[]
  transactions: BackupTransaction[]
}

function isBackupData(obj: unknown): obj is BackupData {
  if (typeof obj !== 'object' || obj === null) return false
  const b = obj as Record<string, unknown>
  return b.version === 1 && Array.isArray(b.customers) && Array.isArray(b.transactions)
}

export async function exportBackup(filename = 'shop-calculator-backup.json'): Promise<void> {
  const db = getDB()

  const customersResult = await db.query('SELECT id, name, created_at FROM customers ORDER BY id')
  const transactionsResult = await db.query(
    'SELECT id, customer_id, amount, expression, note, paid, created_at, updated_at FROM transactions ORDER BY id',
  )

  const data: BackupData = {
    version: 1,
    exported_at: new Date().toISOString(),
    customers: (customersResult.values ?? []) as BackupCustomer[],
    transactions: (transactionsResult.values ?? []) as BackupTransaction[],
  }

  const json = JSON.stringify(data, null, 2)

  if (Capacitor.isNativePlatform()) {
    await Filesystem.writeFile({
      path: filename,
      data: btoa(unescape(encodeURIComponent(json))),
      directory: Directory.Cache,
      encoding: undefined as unknown as never,
    })
    const { uri } = await Filesystem.getUri({ path: filename, directory: Directory.Cache })
    await Share.share({ title: 'Shop Calculator Backup', url: uri })
  } else {
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }
}

export async function importBackup(
  file: File,
  mode: 'merge' | 'replace',
): Promise<{ customers: number; transactions: number }> {
  const text = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsText(file)
  })

  const parsed: unknown = JSON.parse(text)
  if (!isBackupData(parsed)) throw new Error('Invalid backup format')

  const db = getDB()

  if (mode === 'replace') {
    await db.execute('DELETE FROM transactions')
    await db.execute('DELETE FROM customers')
  }

  // Build old→new ID map, deduplicating by name
  const idMap = new Map<number, number>()
  for (const c of parsed.customers) {
    const existing = await db.query('SELECT id FROM customers WHERE name = ?', [c.name])
    if (existing.values?.length) {
      idMap.set(c.id, existing.values[0].id as number)
    } else {
      const result = await db.run(
        'INSERT INTO customers (name, created_at) VALUES (?, ?)',
        [c.name, c.created_at],
      )
      if (result.changes?.lastId != null) idMap.set(c.id, result.changes.lastId)
    }
  }

  // Insert transactions with remapped customer_ids
  for (const tx of parsed.transactions) {
    const newCustomerId = tx.customer_id != null ? (idMap.get(tx.customer_id) ?? null) : null
    await db.run(
      'INSERT INTO transactions (customer_id, amount, expression, note, paid, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [newCustomerId, tx.amount, tx.expression, tx.note, tx.paid, tx.created_at, tx.updated_at],
    )
  }

  return { customers: parsed.customers.length, transactions: parsed.transactions.length }
}

export function parseBackupPreview(file: File): Promise<{ customers: number; transactions: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed: unknown = JSON.parse(reader.result as string)
        if (!isBackupData(parsed)) throw new Error('Invalid')
        resolve({ customers: parsed.customers.length, transactions: parsed.transactions.length })
      } catch {
        reject(new Error('Invalid backup format'))
      }
    }
    reader.onerror = reject
    reader.readAsText(file)
  })
}
