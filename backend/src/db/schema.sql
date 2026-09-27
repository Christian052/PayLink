-- Sellers (app users)
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  business_name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  email TEXT,
  password_hash TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_code TEXT UNIQUE NOT NULL,      -- e.g. "inv_9823", used in the PayLink
  user_id INTEGER NOT NULL,
  buyer_name TEXT NOT NULL,
  buyer_phone TEXT NOT NULL,
  description TEXT,
  amount REAL NOT NULL,
  currency TEXT DEFAULT 'RWF',
  status TEXT DEFAULT 'PENDING',          -- PENDING | PAID | FAILED | EXPIRED
  created_at TEXT DEFAULT (datetime('now')),
  paid_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Payment attempts / transactions (from the MoMo provider)
CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_id INTEGER NOT NULL,
  provider_transaction_id TEXT UNIQUE,    -- ID returned by MTN MoMo / aggregator
  status TEXT DEFAULT 'INITIATED',        -- INITIATED | SUCCESS | FAILED
  raw_payload TEXT,                       -- store the full webhook JSON for audit/debug
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (invoice_id) REFERENCES invoices(id)
);

-- Receipts
CREATE TABLE IF NOT EXISTS receipts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_id INTEGER NOT NULL,
  pdf_path TEXT NOT NULL,
  generated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (invoice_id) REFERENCES invoices(id)
);

-- Webhook event log (for idempotency + debugging)
CREATE TABLE IF NOT EXISTS webhook_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id TEXT UNIQUE NOT NULL,          -- unique ID from the provider, prevents double-processing
  invoice_id INTEGER,
  payload TEXT,
  received_at TEXT DEFAULT (datetime('now'))
);
