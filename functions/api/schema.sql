-- D1 schema for overlay-spirit

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  role TEXT NOT NULL DEFAULT 'customer',
  provider TEXT,
  provider_id TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

CREATE TABLE IF NOT EXISTS overlay_sets (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  is_paid INTEGER NOT NULL DEFAULT 0,
  price_cents INTEGER,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_by TEXT REFERENCES users(id),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sets_category_active ON overlay_sets(category, is_active);

CREATE TABLE IF NOT EXISTS overlays (
  id TEXT PRIMARY KEY,
  set_id TEXT NOT NULL REFERENCES overlay_sets(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  value TEXT NOT NULL,
  aspect_ratio REAL,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_overlays_set ON overlays(set_id, is_active, order_index);

CREATE TABLE IF NOT EXISTS purchases (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  set_id TEXT NOT NULL REFERENCES overlay_sets(id) ON DELETE CASCADE,
  price_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL,
  provider TEXT,
  provider_txn_id TEXT UNIQUE,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_purchases_user ON purchases(user_id, status);
CREATE INDEX IF NOT EXISTS idx_purchases_set ON purchases(set_id);

CREATE TABLE IF NOT EXISTS usage_stats (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  client_id TEXT,
  set_id TEXT REFERENCES overlay_sets(id),
  overlay_id TEXT REFERENCES overlays(id),
  action TEXT NOT NULL,
  meta_json TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_stats_action ON usage_stats(action);
CREATE INDEX IF NOT EXISTS idx_stats_created ON usage_stats(created_at);


