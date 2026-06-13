import { createContext, useContext } from 'react'
import type { DbAdapter } from '../db/adapter'

export const DBContext = createContext<DbAdapter | null>(null)

export function useDB(): DbAdapter {
  const db = useContext(DBContext)
  if (!db) throw new Error('useDB must be used inside DBProvider')
  return db
}
