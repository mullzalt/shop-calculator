import { getDB } from './client'

export interface Transaction {
  id: number
  customer_id: number | null
  amount: number
  expression: string
  note: string | null
  paid: number
  created_at: string
  updated_at: string
  customer_name?: string | null
}

export interface TransactionFilter {
  customerId?: number | null
  dateFrom?: string
  dateTo?: string
}

export async function listTransactions(
  filter: TransactionFilter = {},
  limit = 50,
  offset = 0,
): Promise<Transaction[]> {
  const db = getDB()
  const conditions: string[] = []
  const params: (string | number)[] = []

  if (filter.customerId !== undefined && filter.customerId !== null) {
    conditions.push('t.customer_id = ?')
    params.push(filter.customerId)
  }
  if (filter.dateFrom) {
    conditions.push("date(t.created_at) >= date(?)")
    params.push(filter.dateFrom)
  }
  if (filter.dateTo) {
    conditions.push("date(t.created_at) <= date(?)")
    params.push(filter.dateTo)
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  params.push(limit, offset)

  const result = await db.query(
    `SELECT t.*, c.name as customer_name
     FROM transactions t
     LEFT JOIN customers c ON c.id = t.customer_id
     ${where}
     ORDER BY t.created_at DESC
     LIMIT ? OFFSET ?`,
    params,
  )
  return (result.values ?? []) as Transaction[]
}

export async function countTransactions(filter: TransactionFilter = {}): Promise<number> {
  const db = getDB()
  const conditions: string[] = []
  const params: (string | number)[] = []

  if (filter.customerId !== undefined && filter.customerId !== null) {
    conditions.push('customer_id = ?')
    params.push(filter.customerId)
  }
  if (filter.dateFrom) {
    conditions.push("date(created_at) >= date(?)")
    params.push(filter.dateFrom)
  }
  if (filter.dateTo) {
    conditions.push("date(created_at) <= date(?)")
    params.push(filter.dateTo)
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const result = await db.query(`SELECT COUNT(*) as n FROM transactions ${where}`, params)
  return (result.values?.[0]?.n as number) ?? 0
}

export async function sumTransactions(filter: TransactionFilter = {}): Promise<number> {
  const db = getDB()
  const conditions: string[] = []
  const params: (string | number)[] = []

  if (filter.customerId !== undefined && filter.customerId !== null) {
    conditions.push('customer_id = ?')
    params.push(filter.customerId)
  }
  if (filter.dateFrom) {
    conditions.push("date(created_at) >= date(?)")
    params.push(filter.dateFrom)
  }
  if (filter.dateTo) {
    conditions.push("date(created_at) <= date(?)")
    params.push(filter.dateTo)
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const result = await db.query(`SELECT COALESCE(SUM(amount), 0) as total FROM transactions ${where}`, params)
  return (result.values?.[0]?.total as number) ?? 0
}

export async function createTransaction(data: {
  customer_id: number | null
  amount: number
  expression: string
  note?: string
}): Promise<number> {
  const db = getDB()
  const result = await db.run(
    'INSERT INTO transactions (customer_id, amount, expression, note) VALUES (?, ?, ?, ?)',
    [data.customer_id, data.amount, data.expression, data.note ?? null],
  )
  return result.changes?.lastId ?? 0
}

export async function updateTransaction(
  id: number,
  data: { customer_id?: number | null; amount?: number; expression?: string; note?: string },
): Promise<void> {
  const db = getDB()
  const fields: string[] = []
  const params: (string | number | null)[] = []

  if ('customer_id' in data) { fields.push('customer_id = ?'); params.push(data.customer_id ?? null) }
  if (data.amount !== undefined) { fields.push('amount = ?'); params.push(data.amount) }
  if (data.expression !== undefined) { fields.push('expression = ?'); params.push(data.expression) }
  if (data.note !== undefined) { fields.push('note = ?'); params.push(data.note) }

  if (!fields.length) return
  fields.push("updated_at = datetime('now')")
  params.push(id)

  await db.run(`UPDATE transactions SET ${fields.join(', ')} WHERE id = ?`, params)
}

export async function deleteTransaction(id: number): Promise<void> {
  const db = getDB()
  await db.run('DELETE FROM transactions WHERE id = ?', [id])
}
