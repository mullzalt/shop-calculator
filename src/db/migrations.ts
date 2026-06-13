export const migrations: string[] = [
  // v1
  `
  CREATE TABLE IF NOT EXISTS customers (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT    NOT NULL,
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
    amount      INTEGER NOT NULL,
    expression  TEXT    NOT NULL,
    note        TEXT,
    paid        INTEGER NOT NULL DEFAULT 1,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_transactions_customer ON transactions(customer_id);
  CREATE INDEX IF NOT EXISTS idx_transactions_created  ON transactions(created_at);
  `,
]
