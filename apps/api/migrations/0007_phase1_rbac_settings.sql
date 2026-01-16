PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS popups (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('modal', 'topbar', 'bottombar')),
  start_at INTEGER,
  end_at INTEGER,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS popups_tenant_created_at
ON popups (tenant_id, created_at DESC);

CREATE TABLE IF NOT EXISTS banners (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  location TEXT NOT NULL CHECK (location IN ('home_top', 'sidebar', 'post_bottom')),
  image_url TEXT NOT NULL,
  link_url TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS banners_tenant_location_order
ON banners (tenant_id, location, order_index, id);
