BEGIN TRANSACTION;

DROP TRIGGER IF EXISTS deploy_jobs_set_updated_at;

ALTER TABLE deploy_jobs RENAME TO deploy_jobs_old;

CREATE TABLE IF NOT EXISTS deploy_jobs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  triggered_by_user_id TEXT,
  post_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('queued', 'building', 'success', 'failed', 'canceled')),
  message TEXT,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE SET NULL,
  FOREIGN KEY (triggered_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

INSERT INTO deploy_jobs (id, tenant_id, triggered_by_user_id, post_id, status, message, created_at, updated_at)
SELECT id, tenant_id, triggered_by_user_id, NULL, status, message, created_at, updated_at
FROM deploy_jobs_old;

DROP TABLE deploy_jobs_old;

CREATE TRIGGER IF NOT EXISTS deploy_jobs_set_updated_at
AFTER UPDATE ON deploy_jobs
FOR EACH ROW
BEGIN
  UPDATE deploy_jobs SET updated_at = (strftime('%s','now')) WHERE id = OLD.id;
END;

COMMIT;
