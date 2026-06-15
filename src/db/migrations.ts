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
    amount      REAL    NOT NULL,
    expression  TEXT    NOT NULL,
    note        TEXT,
    paid        INTEGER NOT NULL DEFAULT 1,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_transactions_customer ON transactions(customer_id);
  CREATE INDEX IF NOT EXISTS idx_transactions_created  ON transactions(created_at);
  `,
  // v2: migrate amount column from INTEGER to REAL for decimal support
  `
  CREATE TABLE transactions_v2 (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
    amount      REAL    NOT NULL,
    expression  TEXT    NOT NULL,
    note        TEXT,
    paid        INTEGER NOT NULL DEFAULT 1,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
  );
  INSERT INTO transactions_v2 SELECT * FROM transactions;
  DROP TABLE transactions;
  ALTER TABLE transactions_v2 RENAME TO transactions;
  CREATE INDEX IF NOT EXISTS idx_transactions_customer ON transactions(customer_id);
  CREATE INDEX IF NOT EXISTS idx_transactions_created  ON transactions(created_at);
  `,
  // v2: unique customer names — dedup existing rows then add constraint
  `
  DELETE FROM customers WHERE id NOT IN (
    SELECT MIN(id) FROM customers GROUP BY name
  );
  CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
  `,
]
