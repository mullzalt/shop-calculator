export interface DbAdapter {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query(sql: string, params?: (string | number | null)[]): Promise<{ values?: any[] }>
  run(sql: string, params?: (string | number | null)[]): Promise<{ changes?: { lastId?: number } }>
  execute(sql: string): Promise<void>
}
