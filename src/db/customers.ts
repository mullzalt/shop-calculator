import { getDB } from './client'

export interface Customer {
  id: number
  name: string
  created_at: string
}

export interface CustomerWithStats extends Customer {
  total_spend: number
  last_transaction: string | null
}

export async function listCustomers(search = ''): Promise<CustomerWithStats[]> {
  const db = getDB()
  const pattern = `%${search}%`
  const result = await db.query(
    `SELECT c.id, c.name, c.created_at,
            COALESCE(SUM(t.amount), 0) as total_spend,
            MAX(t.created_at) as last_transaction
     FROM customers c
     LEFT JOIN transactions t ON t.customer_id = c.id
     WHERE c.name LIKE ?
     GROUP BY c.id
     ORDER BY c.name COLLATE NOCASE ASC`,
    [pattern],
  )
  return (result.values ?? []) as CustomerWithStats[]
}

export async function getCustomer(id: number): Promise<Customer | null> {
  const db = getDB()
  const result = await db.query('SELECT * FROM customers WHERE id = ?', [id])
  return (result.values?.[0] as Customer) ?? null
}

export async function createCustomer(name: string): Promise<number> {
  const db = getDB()
  const result = await db.run('INSERT INTO customers (name) VALUES (?)', [name.trim()])
  return result.changes?.lastId ?? 0
}

export async function updateCustomerName(id: number, name: string): Promise<void> {
  const db = getDB()
  await db.run('UPDATE customers SET name = ? WHERE id = ?', [name.trim(), id])
}

export async function deleteCustomer(id: number): Promise<void> {
  const db = getDB()
  await db.run('DELETE FROM customers WHERE id = ?', [id])
}
