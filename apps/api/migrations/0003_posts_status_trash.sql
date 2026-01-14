BEGIN TRANSACTION;

DROP TRIGGER IF EXISTS posts_set_updated_at;

ALTER TABLE posts RENAME TO posts_old;

CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  excerpt TEXT,
  body_md TEXT,
  category_slug TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'paused', 'trashed')),
  publish_at INTEGER,
  published_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  UNIQUE (tenant_id, slug),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

INSERT INTO posts (id, tenant_id, title, slug, excerpt, body_md, category_slug, status, publish_at, published_at, created_at, updated_at)
SELECT id, tenant_id, title, slug, excerpt, body_md, category_slug, status, publish_at, published_at, created_at, updated_at
FROM posts_old;

DROP TABLE posts_old;

CREATE TRIGGER IF NOT EXISTS posts_set_updated_at
AFTER UPDATE ON posts
FOR EACH ROW
BEGIN
  UPDATE posts SET updated_at = (strftime('%s','now')) WHERE id = OLD.id;
END;

COMMIT;
