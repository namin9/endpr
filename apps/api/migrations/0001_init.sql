-- D1 initial schema aligned with checklist v1.2 (DB role)

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  primary_domain TEXT NOT NULL,
  pages_project_name TEXT,
  pages_deploy_hook_url TEXT,
  build_token TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('editor', 'admin', 'super')),
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  UNIQUE (tenant_id, email),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  excerpt TEXT,
  body_md TEXT,
  category_slug TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published')),
  publish_at INTEGER,
  published_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  UNIQUE (tenant_id, slug),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE TRIGGER IF NOT EXISTS posts_set_updated_at
AFTER UPDATE ON posts
FOR EACH ROW
BEGIN
  UPDATE posts SET updated_at = (strftime('%s','now')) WHERE id = OLD.id;
END;

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1,
  order_index INTEGER NOT NULL DEFAULT 0,
  UNIQUE (tenant_id, slug),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS deploy_jobs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  triggered_by_user_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('queued', 'building', 'success', 'failed')),
  message TEXT,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (triggered_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TRIGGER IF NOT EXISTS deploy_jobs_set_updated_at
AFTER UPDATE ON deploy_jobs
FOR EACH ROW
BEGIN
  UPDATE deploy_jobs SET updated_at = (strftime('%s','now')) WHERE id = OLD.id;
END;

CREATE TABLE IF NOT EXISTS page_views_daily (
  tenant_id TEXT NOT NULL,
  page_key TEXT NOT NULL,
  day TEXT NOT NULL,
  views INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (tenant_id, page_key, day),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS pr_campaigns (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'in_progress', 'completed')),
  scheduled_at INTEGER,
  description TEXT,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE TRIGGER IF NOT EXISTS pr_campaigns_set_updated_at
AFTER UPDATE ON pr_campaigns
FOR EACH ROW
BEGIN
  UPDATE pr_campaigns SET updated_at = (strftime('%s','now')) WHERE id = OLD.id;
END;

CREATE TABLE IF NOT EXISTS pr_distribution_runs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  campaign_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  scheduled_at INTEGER,
  executed_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (campaign_id) REFERENCES pr_campaigns(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS pr_mentions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  campaign_id TEXT NOT NULL,
  outlet_name TEXT NOT NULL,
  url TEXT NOT NULL,
  published_at INTEGER,
  memo TEXT,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (campaign_id) REFERENCES pr_campaigns(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS pr_reports (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  campaign_id TEXT NOT NULL,
  period_start TEXT,
  period_end TEXT,
  highlights TEXT,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (campaign_id) REFERENCES pr_campaigns(id) ON DELETE CASCADE
);

-- Minimal seed data: one tenant and admin user
INSERT INTO tenants (id, slug, name, primary_domain, pages_project_name, pages_deploy_hook_url, build_token)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'demo',
  'Demo Tenant',
  'blog.demo.com',
  'demo-pages-project',
  'https://pages.dev/deploy/demo',
  'demo-build-token-please-rotate'
);

INSERT INTO users (id, tenant_id, email, password_hash, role)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'admin@demo.com',
  'replace-with-real-hash',
  'super'
);
