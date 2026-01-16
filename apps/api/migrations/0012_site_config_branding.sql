ALTER TABLE site_configs ADD COLUMN site_name TEXT;
ALTER TABLE site_configs ADD COLUMN site_description TEXT;
ALTER TABLE site_configs ADD COLUMN og_image_url TEXT;
ALTER TABLE site_configs ADD COLUMN og_image_use_logo INTEGER DEFAULT 0;
ALTER TABLE site_configs ADD COLUMN favicon_url TEXT;
