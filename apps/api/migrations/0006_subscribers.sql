-- Add subscribers table for newsletter subscriptions

CREATE TABLE IF NOT EXISTS subscribers (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  UNIQUE (tenant_id, email),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS subscribers_tenant_created_idx
ON subscribers (tenant_id, created_at DESC);
