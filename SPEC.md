# Shop Calculator — Product Spec

## Overview

A cashier-focused calculator app for a small shop. The cashier enters prices using a numpad (with expression support), optionally assigns the transaction to a named regular customer, then saves it. The shop owner can review per-customer spending history filtered by any date range and export reports as CSV or PDF.

**Platform:** Android APK via Capacitor (also works in-browser during development)  
**Data:** Local SQLite — no backend, no sync  
**Users:** Single user, single device

---

## Core Concepts

### Transaction
A saved record of a payment. Fields:
- `amount` — total in IDR (integer)
- `expression` — the raw input string (e.g. `15000+8000×3`)
- `customer_id` — optional FK to a customer; NULL means walk-in
- `note` — optional free-text
- `paid` — boolean, always true in v1 (reserved for future debt tracking)
- `created_at`, `updated_at`

### Customer
A named regular customer. Only stores `name`. Transactions link to customers; deleting a customer NULLs the FK on their transactions (history is preserved).

---

## Calculator Screen (main screen)

**Layout top → bottom:**
1. **Navigation bar** — app title left, links to History and Customers right
2. **Customer bar** — "No customer (walk-in)" or selected name; tap to open customer search
3. **Expression display** — large right-aligned text of current input (e.g. `15000+8000`)
4. **Result preview** — smaller text showing live-evaluated result; blank if expression is incomplete
5. **Numpad (4 columns × 5 rows):**

```
  C    (   )   ÷
  7    8   9   ×
  4    5   6   −
  1    2   3   +
  ⌫   0   =   ✓
```

- `C` — clears expression and result
- `⌫` — deletes last character
- `(` `)` — parentheses for grouping
- `=` — evaluates expression, freezes result (expression still editable)
- `✓` (confirm) — navigates to Confirmation screen; disabled unless result > 0

**Expression evaluation:**
- Uses `mathjs.evaluate()` — supports `+`, `−`, `×`, `÷`, parentheses
- Re-evaluates live on every keystroke
- Invalid/incomplete expressions show no result (no error message)
- Operators `×` and `÷` are converted to `*` and `/` before evaluation

---

## Confirmation Screen (`/confirm`)

Reached only from the calculator `✓` button. Shows:

| Field | Value |
|---|---|
| Amount | Large display of the total |
| Expression | The raw input |
| Customer | Name, or "Walk-in customer" |

Actions:
- **Change customer** — opens the same customer search modal
- **Save & New Transaction** — writes record to DB; clears calculator state; navigates to `/`
- **← Back to Edit** — returns to `/` with expression and customer intact

---

## History Screen (`/history`)

**Filter bar:**
- Date range picker (start date, end date; defaults to today)
- Customer filter (search-select, optional)

**Transaction list** (newest first, 50 per page):
- Each row: timestamp, customer name (or "—"), expression, amount
- Tap row → expand inline edit form

**Inline edit form:**
- Change customer (search modal)
- Change amount (numeric input) and expression (text input)
- Delete button (no confirmation dialog — direct delete)

**Export button** (top right) → opens Export Modal

---

## Export Modal

Appears on History screen. Options:
- **Export CSV** — downloads/shares a `.csv` file
- **Export PDF** — downloads/shares a `.pdf` file

Both exports use the currently active filters (date range + customer).

**CSV columns:** `Date,Customer,Expression,Amount`  
**PDF:** Table with same columns, title "Transaction Report", date range in subtitle

On Android, files are shared via the native share sheet. In browser, they trigger a download.

---

## Customers Screen (`/customers`)

- Search input at top (debounced 300ms) — filters by name
- List: name, all-time total spend, date of last transaction
- Tap row → Customer Detail screen
- FAB (bottom-right) → "Add Customer" modal (name input only)

---

## Customer Detail Screen (`/customers/:id`)

- Customer name (editable inline, saves on blur)
- Date range filter (defaults to current calendar year Jan 1 – Dec 31)
- Total spend within filter range (large number display)
- Transaction list filtered to this customer + date range (same row format as History)
- **Delete Customer** button at bottom — removes customer record; their transactions remain with `customer_id = NULL`

---

## Data Rules

- All amounts are integers (IDR, no decimals)
- Anyone can edit or delete any transaction — no authentication
- Deleting a customer does not delete their transactions
- `paid` column always = 1 in v1 (no debt UI)

---

## Database Schema

```sql
CREATE TABLE customers (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT    NOT NULL,
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE transactions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
  amount      INTEGER NOT NULL,
  expression  TEXT    NOT NULL,
  note        TEXT,
  paid        INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_transactions_customer ON transactions(customer_id);
CREATE INDEX idx_transactions_created  ON transactions(created_at);
```

---

## Tech Stack

| Concern | Solution |
|---|---|
| UI framework | React 18 + Vite + TypeScript |
| Styling | Tailwind CSS |
| Routing | React Router v6 |
| Mobile bridge | Capacitor 6 |
| SQLite | `@capacitor-community/sqlite` |
| Expression eval | `mathjs` |
| PDF export | `jspdf` + `jspdf-autotable` |
| CSV export | Native string generation |

---

## Out of Scope (v1)

- User authentication or roles
- Debt / unpaid transaction UI (schema reserved)
- Multi-device sync
- Item/product catalog
- Receipt printing
- Discount or tax calculations
