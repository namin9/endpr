PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS site_configs (
  tenant_id TEXT PRIMARY KEY,
  logo_url TEXT,
  footer_text TEXT,
  home_layout TEXT,
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE TRIGGER IF NOT EXISTS site_configs_set_updated_at
AFTER UPDATE ON site_configs
FOR EACH ROW
BEGIN
  UPDATE site_configs SET updated_at = (strftime('%s','now')) WHERE tenant_id = OLD.tenant_id;
END;

CREATE TABLE IF NOT EXISTS site_navigations (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  location TEXT NOT NULL CHECK (location IN ('header', 'footer')),
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS site_navigations_tenant_location_order
ON site_navigations (tenant_id, location, order_index, created_at);

CREATE TRIGGER IF NOT EXISTS site_navigations_set_updated_at
AFTER UPDATE ON site_navigations
FOR EACH ROW
BEGIN
  UPDATE site_navigations SET updated_at = (strftime('%s','now')) WHERE id = OLD.id;
END;
