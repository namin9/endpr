-- Add post type and inquiries table for business CMS features

ALTER TABLE posts
  ADD COLUMN type TEXT NOT NULL DEFAULT 'post' CHECK (type IN ('post', 'page'));

CREATE TABLE IF NOT EXISTS inquiries (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  type TEXT NOT NULL,
  data TEXT NOT NULL,
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS inquiries_tenant_created_idx
ON inquiries (tenant_id, created_at DESC);
