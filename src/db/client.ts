import { Capacitor } from '@capacitor/core'
import { migrations } from './migrations'
import type { DbAdapter } from './adapter'

let db: DbAdapter | null = null
let initPromise: Promise<DbAdapter> | null = null

export function initDB(): Promise<DbAdapter> {
  if (!initPromise) initPromise = _init()
  return initPromise
}

async function _init(): Promise<DbAdapter> {
  if (Capacitor.isNativePlatform()) {
    db = await initNativeDB()
  } else {
    const { createWebDB } = await import('./web-db')
    db = await createWebDB()
  }
  await runMigrations(db)
  return db
}

async function initNativeDB(): Promise<DbAdapter> {
  const { CapacitorSQLite, SQLiteConnection } = await import('@capacitor-community/sqlite')
  const DB_NAME = 'shop_calculator'
  const sqlite = new SQLiteConnection(CapacitorSQLite)

  const isConn = (await sqlite.isConnection(DB_NAME, false)).result
  const conn = isConn
    ? await sqlite.retrieveConnection(DB_NAME, false)
    : await sqlite.createConnection(DB_NAME, false, 'no-encryption', 1, false)

  await conn.open()

  // Wrap SQLiteDBConnection into DbAdapter
  return {
    query: (sql, params) => conn.query(sql, params as never),
    run: async (sql, params) => {
      const r = await conn.run(sql, params as never)
      return { changes: { lastId: r.changes?.lastId } }
    },
    execute: async (sql) => { await conn.execute(sql) },
  }
}

async function runMigrations(adapter: DbAdapter) {
  await adapter.execute(`
    CREATE TABLE IF NOT EXISTS _migrations (
      version INTEGER PRIMARY KEY
    )
  `)

  const result = await adapter.query('SELECT MAX(version) as v FROM _migrations')
  const currentVersion: number = (result.values?.[0]?.v as number) ?? -1

  for (let i = currentVersion + 1; i < migrations.length; i++) {
    await adapter.execute(migrations[i])
    await adapter.run('INSERT INTO _migrations (version) VALUES (?)', [i])
  }
}

export function getDB(): DbAdapter {
  if (!db) throw new Error('DB not initialized — call initDB() first')
  return db
}
