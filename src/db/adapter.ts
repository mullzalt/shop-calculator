export interface DbAdapter {
  query(sql: string, params?: (string | number | null)[]): Promise<{ values?: Record<string, unknown>[] }>
  run(sql: string, params?: (string | number | null)[]): Promise<{ changes?: { lastId?: number } }>
  execute(sql: string): Promise<void>
}
