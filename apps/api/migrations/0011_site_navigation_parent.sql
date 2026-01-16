PRAGMA foreign_keys = ON;

ALTER TABLE site_navigations ADD COLUMN parent_id TEXT;

CREATE INDEX IF NOT EXISTS site_navigations_tenant_location_parent_order
ON site_navigations (tenant_id, location, parent_id, order_index, created_at);
