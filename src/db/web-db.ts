import initSqlJs from 'sql.js'
import type { Database } from 'sql.js'
import type { DbAdapter } from './adapter'

const IDB_DB = 'shop-calculator'
const IDB_STORE = 'sqlite'
const IDB_KEY = 'db'

function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_DB, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function loadSnapshot(): Promise<Uint8Array | null> {
  try {
    const idb = await openIDB()
    return new Promise((resolve) => {
      const tx = idb.transaction(IDB_STORE, 'readonly')
      const req = tx.objectStore(IDB_STORE).get(IDB_KEY)
      req.onsuccess = () => resolve(req.result ?? null)
      req.onerror = () => resolve(null)
    })
  } catch {
    return null
  }
}

async function saveSnapshot(sqlDb: Database): Promise<void> {
  try {
    const idb = await openIDB()
    const data = sqlDb.export()
    await new Promise<void>((resolve, reject) => {
      const tx = idb.transaction(IDB_STORE, 'readwrite')
      tx.objectStore(IDB_STORE).put(data, IDB_KEY)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch {
    // non-fatal — data is still usable in memory this session
  }
}

export async function createWebDB(): Promise<DbAdapter> {
  const snapshot = await loadSnapshot()
  const SQL = await initSqlJs({ locateFile: () => '/sql-wasm.wasm' })
  const sqlDb = snapshot ? new SQL.Database(snapshot) : new SQL.Database()

  return {
    async query(sql, params = []) {
      const stmt = sqlDb.prepare(sql)
      stmt.bind(params)
      const rows: Record<string, unknown>[] = []
      while (stmt.step()) rows.push(stmt.getAsObject() as Record<string, unknown>)
      stmt.free()
      return { values: rows }
    },

    async run(sql, params = []) {
      sqlDb.run(sql, params)
      const res = sqlDb.exec('SELECT last_insert_rowid() as id')
      const lastId = (res[0]?.values?.[0]?.[0] as number | undefined) ?? 0
      await saveSnapshot(sqlDb)
      return { changes: { lastId } }
    },

    async execute(sql) {
      sqlDb.exec(sql)
      await saveSnapshot(sqlDb)
    },
  }
}
