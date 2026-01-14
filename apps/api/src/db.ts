import { v4 as uuidv4 } from 'uuid';

export type Role = 'editor' | 'admin' | 'super';

export type TenantRow = {
  id: string;
  slug: string;
  name: string;
  pages_deploy_hook_url: string | null;
  build_token: string;
};

export type UserRow = {
  id: string;
  tenant_id: string;
  email: string;
  password_hash: string;
  role: Role;
};

export type TenantAdminRow = {
  id: string;
  slug: string;
  name: string;
  primary_domain: string;
  pages_project_name: string | null;
  pages_deploy_hook_url: string | null;
  build_token: string;
  created_at: number;
};

export type PostRow = {
  id: string;
  tenant_id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body_md: string | null;
  category_slug: string | null;
  status: string;
  publish_at: number | null;
  published_at: number | null;
  created_at: number;
  updated_at: number;
};

export type DeployJobRow = {
  id: string;
  tenant_id: string;
  triggered_by_user_id: string | null;
  post_id: string | null;
  status: 'queued' | 'building' | 'success' | 'failed' | 'canceled';
  message: string | null;
  created_at: number;
  updated_at: number;
};

export type CategoryRow = {
  id: string;
  tenant_id: string;
  slug: string;
  name: string;
  enabled: number;
  order_index: number;
};

export type SiteConfigRow = {
  tenant_id: string;
  logo_url: string | null;
  footer_text: string | null;
  home_layout: string | null;
  updated_at: number;
};

export type SiteNavigationRow = {
  id: string;
  tenant_id: string;
  location: 'header' | 'footer';
  label: string;
  url: string;
  order_index: number;
  created_at: number;
  updated_at: number;
};

export type PrCampaignRow = {
  id: string;
  tenant_id: string;
  name: string;
  status: 'draft' | 'scheduled' | 'in_progress' | 'completed';
  scheduled_at: number | null;
  description: string | null;
  created_at: number;
  updated_at: number;
};

export type PrMentionRow = {
  id: string;
  tenant_id: string;
  campaign_id: string;
  outlet_name: string;
  url: string;
  published_at: number | null;
  memo: string | null;
  created_at: number;
};

export type PrReportRow = {
  id: string;
  tenant_id: string;
  campaign_id: string;
  period_start: string | null;
  period_end: string | null;
  highlights: string | null;
  created_at: number;
};

export async function getTenantBySlug(db: D1Database, slug: string): Promise<TenantRow | null> {
  const result = await db
    .prepare('SELECT id, slug, name, pages_deploy_hook_url, build_token FROM tenants WHERE slug = ?')
    .bind(slug)
    .first<TenantRow>();
  return result ?? null;
}

export async function getTenantById(db: D1Database, id: string): Promise<TenantRow | null> {
  const result = await db
    .prepare('SELECT id, slug, name, pages_deploy_hook_url, build_token FROM tenants WHERE id = ?')
    .bind(id)
    .first<TenantRow>();
  return result ?? null;
}

export async function getTenantByBuildToken(db: D1Database, token: string): Promise<TenantRow | null> {
  const result = await db
    .prepare('SELECT id, slug, name, pages_deploy_hook_url, build_token FROM tenants WHERE build_token = ?')
    .bind(token)
    .first<TenantRow>();
  return result ?? null;
}

export async function getTenantByPagesProjectName(db: D1Database, projectName: string): Promise<TenantRow | null> {
  const result = await db
    .prepare('SELECT id, slug, name, pages_deploy_hook_url, build_token FROM tenants WHERE pages_project_name = ?')
    .bind(projectName)
    .first<TenantRow>();
  return result ?? null;
}

export async function listTenants(db: D1Database): Promise<TenantAdminRow[]> {
  const { results } = await db
    .prepare(
      'SELECT id, slug, name, primary_domain, pages_project_name, pages_deploy_hook_url, build_token, created_at FROM tenants ORDER BY created_at DESC'
    )
    .all<TenantAdminRow>();
  return (results ?? []) as TenantAdminRow[];
}

export async function createTenant(
  db: D1Database,
  input: Omit<TenantAdminRow, 'id' | 'created_at'>
): Promise<TenantAdminRow> {
  const id = uuidv4();
  const now = Math.floor(Date.now() / 1000);
  await db
    .prepare(
      `INSERT INTO tenants (id, slug, name, primary_domain, pages_project_name, pages_deploy_hook_url, build_token, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      input.slug,
      input.name,
      input.primary_domain,
      input.pages_project_name ?? null,
      input.pages_deploy_hook_url ?? null,
      input.build_token,
      now
    )
    .run();
  const created = await db
    .prepare(
      'SELECT id, slug, name, primary_domain, pages_project_name, pages_deploy_hook_url, build_token, created_at FROM tenants WHERE id = ?'
    )
    .bind(id)
    .first<TenantAdminRow>();
  if (!created) throw new Error('Failed to create tenant');
  return created;
}

export async function updateTenant(
  db: D1Database,
  id: string,
  updates: Partial<Omit<TenantAdminRow, 'id' | 'created_at'>>
): Promise<TenantAdminRow> {
  await db
    .prepare(
      `UPDATE tenants SET
        slug = COALESCE(?, slug),
        name = COALESCE(?, name),
        primary_domain = COALESCE(?, primary_domain),
        pages_project_name = COALESCE(?, pages_project_name),
        pages_deploy_hook_url = COALESCE(?, pages_deploy_hook_url),
        build_token = COALESCE(?, build_token)
       WHERE id = ?`
    )
    .bind(
      updates.slug ?? null,
      updates.name ?? null,
      updates.primary_domain ?? null,
      updates.pages_project_name ?? null,
      updates.pages_deploy_hook_url ?? null,
      updates.build_token ?? null,
      id
    )
    .run();
  const updated = await db
    .prepare(
      'SELECT id, slug, name, primary_domain, pages_project_name, pages_deploy_hook_url, build_token, created_at FROM tenants WHERE id = ?'
    )
    .bind(id)
    .first<TenantAdminRow>();
  if (!updated) throw new Error('Failed to update tenant');
  return updated;
}

export async function listUsersByTenant(db: D1Database, tenantId: string): Promise<UserRow[]> {
  const { results } = await db
    .prepare('SELECT id, tenant_id, email, password_hash, role FROM users WHERE tenant_id = ? ORDER BY created_at DESC')
    .bind(tenantId)
    .all<UserRow>();
  return (results ?? []) as UserRow[];
}

export async function createUser(
  db: D1Database,
  tenantId: string,
  input: Pick<UserRow, 'email' | 'password_hash' | 'role'>
): Promise<UserRow> {
  const id = uuidv4();
  await db
    .prepare('INSERT INTO users (id, tenant_id, email, password_hash, role) VALUES (?, ?, ?, ?, ?)')
    .bind(id, tenantId, input.email, input.password_hash, input.role)
    .run();
  const created = await db
    .prepare('SELECT id, tenant_id, email, password_hash, role FROM users WHERE id = ? AND tenant_id = ?')
    .bind(id, tenantId)
    .first<UserRow>();
  if (!created) throw new Error('Failed to create user');
  return created;
}

export async function updateUser(
  db: D1Database,
  tenantId: string,
  id: string,
  updates: Partial<Pick<UserRow, 'email' | 'password_hash' | 'role'>>
): Promise<UserRow> {
  await db
    .prepare(
      `UPDATE users SET
        email = COALESCE(?, email),
        password_hash = COALESCE(?, password_hash),
        role = COALESCE(?, role)
       WHERE id = ? AND tenant_id = ?`
    )
    .bind(updates.email ?? null, updates.password_hash ?? null, updates.role ?? null, id, tenantId)
    .run();
  const updated = await db
    .prepare('SELECT id, tenant_id, email, password_hash, role FROM users WHERE id = ? AND tenant_id = ?')
    .bind(id, tenantId)
    .first<UserRow>();
  if (!updated) throw new Error('Failed to update user');
  return updated;
}

export async function getUserByEmail(db: D1Database, tenantId: string, email: string): Promise<UserRow | null> {
  const result = await db
    .prepare('SELECT id, tenant_id, email, password_hash, role FROM users WHERE tenant_id = ? AND email = ?')
    .bind(tenantId, email)
    .first<UserRow>();
  return result ?? null;
}

export async function getUserById(db: D1Database, tenantId: string, id: string): Promise<UserRow | null> {
  const result = await db
    .prepare('SELECT id, tenant_id, email, password_hash, role FROM users WHERE tenant_id = ? AND id = ?')
    .bind(tenantId, id)
    .first<UserRow>();
  return result ?? null;
}

export async function createPost(db: D1Database, tenantId: string, input: Partial<PostRow>): Promise<PostRow> {
  const id = uuidv4();
  const now = Math.floor(Date.now() / 1000);
  await db
    .prepare(
      `INSERT INTO posts (id, tenant_id, title, slug, excerpt, body_md, category_slug, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?)`
    )
    .bind(
      id,
      tenantId,
      input.title,
      input.slug,
      input.excerpt ?? null,
      input.body_md ?? null,
      input.category_slug ?? null,
      now,
      now
    )
    .run();

  const created = await db.prepare('SELECT * FROM posts WHERE id = ? AND tenant_id = ?').bind(id, tenantId).first<PostRow>();
  if (!created) throw new Error('Failed to create post');
  return created;
}

export async function listPosts(db: D1Database, tenantId: string): Promise<PostRow[]> {
  const { results } = await db
    .prepare(
      `SELECT posts.*,
        COALESCE(SUM(page_views_daily.views), 0) AS view_count
       FROM posts
       LEFT JOIN page_views_daily
         ON page_views_daily.tenant_id = posts.tenant_id
        AND page_views_daily.page_key = posts.slug
       WHERE posts.tenant_id = ?
       GROUP BY posts.id
       ORDER BY posts.created_at DESC`
    )
    .bind(tenantId)
    .all<PostRow>();
  return (results ?? []) as PostRow[];
}

type ViewRangeOptions = {
  startDay?: string | null;
  endDay?: string | null;
  orderByViews?: boolean;
};

export async function listPostsWithViews(
  db: D1Database,
  tenantId: string,
  { startDay = null, endDay = null, orderByViews = false }: ViewRangeOptions = {}
): Promise<PostRow[]> {
  const hasRange = Boolean(startDay && endDay);
  const joinClause = hasRange
    ? `LEFT JOIN page_views_daily
         ON page_views_daily.tenant_id = posts.tenant_id
        AND page_views_daily.page_key = posts.slug
        AND page_views_daily.day BETWEEN ? AND ?`
    : `LEFT JOIN page_views_daily
         ON page_views_daily.tenant_id = posts.tenant_id
        AND page_views_daily.page_key = posts.slug`;
  const orderClause = orderByViews
    ? 'ORDER BY view_count DESC, posts.created_at DESC'
    : 'ORDER BY posts.created_at DESC';
  const sql = `SELECT posts.*,
        COALESCE(SUM(page_views_daily.views), 0) AS view_count
      FROM posts
      ${joinClause}
      WHERE posts.tenant_id = ?
      GROUP BY posts.id
      ${orderClause}`;

  const statement = db.prepare(sql);
  const bound = hasRange
    ? statement.bind(startDay, endDay, tenantId)
    : statement.bind(tenantId);
  const { results } = await bound.all<PostRow>();
  return (results ?? []) as PostRow[];
}

export async function getPost(db: D1Database, tenantId: string, id: string): Promise<PostRow | null> {
  const post = await db.prepare('SELECT * FROM posts WHERE id = ? AND tenant_id = ?').bind(id, tenantId).first<PostRow>();
  return post ?? null;
}

export async function getPostBySlug(db: D1Database, tenantId: string, slug: string): Promise<PostRow | null> {
  const post = await db
    .prepare('SELECT * FROM posts WHERE slug = ? AND tenant_id = ?')
    .bind(slug, tenantId)
    .first<PostRow>();
  return post ?? null;
}

export async function updatePost(db: D1Database, tenantId: string, id: string, updates: Partial<PostRow>): Promise<PostRow> {
  await db
    .prepare(
      `UPDATE posts SET
        title = COALESCE(?, title),
        slug = COALESCE(?, slug),
        excerpt = COALESCE(?, excerpt),
        body_md = COALESCE(?, body_md),
        category_slug = COALESCE(?, category_slug),
        status = COALESCE(?, status),
        publish_at = COALESCE(?, publish_at)
       WHERE id = ? AND tenant_id = ?`
    )
    .bind(
      updates.title ?? null,
      updates.slug ?? null,
      updates.excerpt ?? null,
      updates.body_md ?? null,
      updates.category_slug ?? null,
      updates.status ?? null,
      updates.publish_at ?? null,
      id,
      tenantId
    )
    .run();

  const updated = await getPost(db, tenantId, id);
  if (!updated) throw new Error('Failed to load updated post');
  return updated;
}

export async function deletePost(db: D1Database, tenantId: string, id: string): Promise<void> {
  await db.prepare('DELETE FROM posts WHERE id = ? AND tenant_id = ?').bind(id, tenantId).run();
}

export async function ensurePostStatusSchema(db: D1Database): Promise<boolean> {
  const schemaRow = await db
    .prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'posts'")
    .first<{ sql?: string }>();
  const sql = schemaRow?.sql ?? '';
  if (sql.includes("'trashed'") && sql.includes("'paused'")) {
    return true;
  }
  const legacyTable = await db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'posts_old'")
    .first();
  if (legacyTable) {
    return false;
  }
  await db.prepare('DROP TRIGGER IF EXISTS posts_set_updated_at').run();
  await db.prepare('ALTER TABLE posts RENAME TO posts_old').run();
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS posts (
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
      )`
    )
    .run();
  await db
    .prepare(
      `INSERT INTO posts (id, tenant_id, title, slug, excerpt, body_md, category_slug, status, publish_at, published_at, created_at, updated_at)
       SELECT id, tenant_id, title, slug, excerpt, body_md, category_slug, status, publish_at, published_at, created_at, updated_at
       FROM posts_old`
    )
    .run();
  await db.prepare('DROP TABLE posts_old').run();
  await db
    .prepare(
      `CREATE TRIGGER IF NOT EXISTS posts_set_updated_at
       AFTER UPDATE ON posts
       FOR EACH ROW
       BEGIN
         UPDATE posts SET updated_at = (strftime('%s','now')) WHERE id = OLD.id;
       END`
    )
    .run();
  return true;
}

export async function purgeTrashedPosts(db: D1Database, cutoffEpoch: number): Promise<number> {
  const result = await db
    .prepare("DELETE FROM posts WHERE status = 'trashed' AND updated_at <= ?")
    .bind(cutoffEpoch)
    .run();
  return result?.changes ?? 0;
}

export async function publishPost(db: D1Database, tenantId: string, id: string, publishTime: number): Promise<PostRow> {
  await db
    .prepare(
      `UPDATE posts
       SET status = 'published',
           published_at = COALESCE(published_at, ?),
           publish_at = COALESCE(publish_at, ?)
       WHERE id = ? AND tenant_id = ?`
    )
    .bind(publishTime, publishTime, id, tenantId)
    .run();
  const updated = await getPost(db, tenantId, id);
  if (!updated) throw new Error('Failed to publish post');
  return updated;
}

export async function createDeployJob(
  db: D1Database,
  tenantId: string,
  triggeredBy: string | null,
  status: DeployJobRow['status'],
  message: string | null,
  postId: string | null = null
): Promise<DeployJobRow> {
  const id = uuidv4();
  try {
    await db
      .prepare(
        'INSERT INTO deploy_jobs (id, tenant_id, triggered_by_user_id, post_id, status, message) VALUES (?, ?, ?, ?, ?, ?)'
      )
      .bind(id, tenantId, triggeredBy, postId, status, message)
      .run();
  } catch (error) {
    const messageText = error instanceof Error ? error.message : String(error);
    if (messageText.includes('post_id')) {
      await db
        .prepare('INSERT INTO deploy_jobs (id, tenant_id, triggered_by_user_id, status, message) VALUES (?, ?, ?, ?, ?)')
        .bind(id, tenantId, triggeredBy, status, message)
        .run();
    } else {
      throw error;
    }
  }
  const job = await db.prepare('SELECT * FROM deploy_jobs WHERE id = ?').bind(id).first<DeployJobRow>();
  if (!job) throw new Error('Failed to create deploy job');
  return job;
}

export async function updateDeployJobStatus(
  db: D1Database,
  id: string,
  status: DeployJobRow['status'],
  message: string | null
): Promise<DeployJobRow> {
  await db.prepare('UPDATE deploy_jobs SET status = ?, message = ? WHERE id = ?').bind(status, message, id).run();
  const job = await db.prepare('SELECT * FROM deploy_jobs WHERE id = ?').bind(id).first<DeployJobRow>();
  if (!job) throw new Error('Failed to update deploy job');
  return job;
}

export async function listDeployJobs(db: D1Database, tenantId: string): Promise<DeployJobRow[]> {
  const { results } = await db
    .prepare('SELECT * FROM deploy_jobs WHERE tenant_id = ? ORDER BY created_at DESC')
    .bind(tenantId)
    .all<DeployJobRow>();
  return (results ?? []) as DeployJobRow[];
}

export async function getDeployJob(db: D1Database, tenantId: string, id: string): Promise<DeployJobRow | null> {
  const job = await db
    .prepare('SELECT * FROM deploy_jobs WHERE id = ? AND tenant_id = ?')
    .bind(id, tenantId)
    .first<DeployJobRow>();
  return job ?? null;
}

export async function getLatestActiveDeployJob(db: D1Database, tenantId: string): Promise<DeployJobRow | null> {
  const job = await db
    .prepare(
      `SELECT * FROM deploy_jobs
       WHERE tenant_id = ? AND status IN ('queued', 'building')
       ORDER BY created_at DESC
       LIMIT 1`
    )
    .bind(tenantId)
    .first<DeployJobRow>();
  return job ?? null;
}

export async function listPublishedPosts(db: D1Database, tenantId: string): Promise<PostRow[]> {
  const { results } = await db
    .prepare(`SELECT * FROM posts WHERE tenant_id = ? AND status = 'published' ORDER BY published_at DESC`)
    .bind(tenantId)
    .all<PostRow>();
  return (results ?? []) as PostRow[];
}

export async function listPublishedPostsWithViews(
  db: D1Database,
  tenantId: string,
  { orderByViews = false }: { orderByViews?: boolean } = {}
): Promise<PostRow[]> {
  const orderClause = orderByViews
    ? 'ORDER BY view_count DESC, posts.published_at DESC, posts.created_at DESC'
    : 'ORDER BY posts.published_at DESC, posts.created_at DESC';
  const { results } = await db
    .prepare(
      `SELECT posts.*,
        COALESCE(SUM(page_views_daily.views), 0) AS view_count
       FROM posts
       LEFT JOIN page_views_daily
         ON page_views_daily.tenant_id = posts.tenant_id
        AND page_views_daily.page_key = posts.slug
       WHERE posts.tenant_id = ? AND posts.status = 'published'
       GROUP BY posts.id
       ${orderClause}`
    )
    .bind(tenantId)
    .all<PostRow>();
  return (results ?? []) as PostRow[];
}

export async function listPublishedPostsByIds(
  db: D1Database,
  tenantId: string,
  ids: string[]
): Promise<PostRow[]> {
  if (!ids.length) return [];
  const placeholders = ids.map(() => '?').join(', ');
  const { results } = await db
    .prepare(
      `SELECT posts.*,
        COALESCE(SUM(page_views_daily.views), 0) AS view_count
       FROM posts
       LEFT JOIN page_views_daily
         ON page_views_daily.tenant_id = posts.tenant_id
        AND page_views_daily.page_key = posts.slug
       WHERE posts.tenant_id = ? AND posts.status = 'published' AND posts.id IN (${placeholders})
       GROUP BY posts.id`
    )
    .bind(tenantId, ...ids)
    .all<PostRow>();
  const rows = (results ?? []) as PostRow[];
  const map = new Map(rows.map((row) => [row.id, row]));
  return ids.map((id) => map.get(id)).filter(Boolean) as PostRow[];
}

export async function listPublishedPostsBySlugs(
  db: D1Database,
  tenantId: string,
  slugs: string[]
): Promise<PostRow[]> {
  if (!slugs.length) return [];
  const placeholders = slugs.map(() => '?').join(', ');
  const { results } = await db
    .prepare(
      `SELECT posts.*,
        COALESCE(SUM(page_views_daily.views), 0) AS view_count
       FROM posts
       LEFT JOIN page_views_daily
         ON page_views_daily.tenant_id = posts.tenant_id
        AND page_views_daily.page_key = posts.slug
       WHERE posts.tenant_id = ? AND posts.status = 'published' AND posts.slug IN (${placeholders})
       GROUP BY posts.id`
    )
    .bind(tenantId, ...slugs)
    .all<PostRow>();
  const rows = (results ?? []) as PostRow[];
  const map = new Map(rows.map((row) => [row.slug, row]));
  return slugs.map((slug) => map.get(slug)).filter(Boolean) as PostRow[];
}

export async function listDueScheduledPosts(db: D1Database, nowSeconds: number): Promise<PostRow[]> {
  const { results } = await db
    .prepare(`SELECT * FROM posts WHERE status = 'scheduled' AND publish_at IS NOT NULL AND publish_at <= ? ORDER BY publish_at ASC`)
    .bind(nowSeconds)
    .all<PostRow>();
  return (results ?? []) as PostRow[];
}

export async function listEnabledCategories(db: D1Database, tenantId: string): Promise<CategoryRow[]> {
  const { results } = await db
    .prepare(`SELECT slug, name, enabled, order_index, tenant_id, id FROM categories WHERE tenant_id = ? AND enabled = 1 ORDER BY order_index ASC`)
    .bind(tenantId)
    .all<CategoryRow>();
  return (results ?? []) as CategoryRow[];
}

export async function listCategories(db: D1Database, tenantId: string): Promise<CategoryRow[]> {
  const { results } = await db
    .prepare(`SELECT slug, name, enabled, order_index, tenant_id, id FROM categories WHERE tenant_id = ? ORDER BY order_index ASC`)
    .bind(tenantId)
    .all<CategoryRow>();
  return (results ?? []) as CategoryRow[];
}

export async function getSiteConfig(db: D1Database, tenantId: string): Promise<SiteConfigRow | null> {
  const config = await db
    .prepare('SELECT tenant_id, logo_url, footer_text, home_layout, updated_at FROM site_configs WHERE tenant_id = ?')
    .bind(tenantId)
    .first<SiteConfigRow>();
  return config ?? null;
}

export async function upsertSiteConfig(
  db: D1Database,
  tenantId: string,
  updates: Partial<Pick<SiteConfigRow, 'logo_url' | 'footer_text' | 'home_layout'>>
): Promise<SiteConfigRow> {
  await db
    .prepare(
      `INSERT INTO site_configs (tenant_id, logo_url, footer_text, home_layout)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(tenant_id) DO UPDATE SET
         logo_url = excluded.logo_url,
         footer_text = excluded.footer_text,
         home_layout = excluded.home_layout`
    )
    .bind(tenantId, updates.logo_url ?? null, updates.footer_text ?? null, updates.home_layout ?? null)
    .run();
  const config = await getSiteConfig(db, tenantId);
  if (!config) throw new Error('Failed to update site config');
  return config;
}

export async function listSiteNavigations(db: D1Database, tenantId: string): Promise<SiteNavigationRow[]> {
  const { results } = await db
    .prepare(
      `SELECT id, tenant_id, location, label, url, order_index, created_at, updated_at
       FROM site_navigations
       WHERE tenant_id = ?
       ORDER BY location ASC, order_index ASC, created_at ASC`
    )
    .bind(tenantId)
    .all<SiteNavigationRow>();
  return (results ?? []) as SiteNavigationRow[];
}

export async function createSiteNavigation(
  db: D1Database,
  tenantId: string,
  input: Pick<SiteNavigationRow, 'location' | 'label' | 'url'> & { order_index?: number | null }
): Promise<SiteNavigationRow> {
  const id = uuidv4();
  let orderIndex = input.order_index;
  if (orderIndex === null || orderIndex === undefined) {
    const row = await db
      .prepare(
        `SELECT COALESCE(MAX(order_index), -1) AS max_order
         FROM site_navigations
         WHERE tenant_id = ? AND location = ?`
      )
      .bind(tenantId, input.location)
      .first<{ max_order: number }>();
    orderIndex = (row?.max_order ?? -1) + 1;
  }
  await db
    .prepare(
      `INSERT INTO site_navigations (id, tenant_id, location, label, url, order_index)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .bind(id, tenantId, input.location, input.label, input.url, orderIndex)
    .run();
  const created = await db
    .prepare(
      'SELECT id, tenant_id, location, label, url, order_index, created_at, updated_at FROM site_navigations WHERE id = ?'
    )
    .bind(id)
    .first<SiteNavigationRow>();
  if (!created) throw new Error('Failed to create site navigation');
  return created;
}

export async function updateSiteNavigation(
  db: D1Database,
  tenantId: string,
  id: string,
  updates: Partial<Pick<SiteNavigationRow, 'location' | 'label' | 'url' | 'order_index'>>
): Promise<SiteNavigationRow> {
  await db
    .prepare(
      `UPDATE site_navigations SET
        location = COALESCE(?, location),
        label = COALESCE(?, label),
        url = COALESCE(?, url),
        order_index = COALESCE(?, order_index)
       WHERE id = ? AND tenant_id = ?`
    )
    .bind(updates.location ?? null, updates.label ?? null, updates.url ?? null, updates.order_index ?? null, id, tenantId)
    .run();
  const updated = await db
    .prepare(
      'SELECT id, tenant_id, location, label, url, order_index, created_at, updated_at FROM site_navigations WHERE id = ? AND tenant_id = ?'
    )
    .bind(id, tenantId)
    .first<SiteNavigationRow>();
  if (!updated) throw new Error('Failed to update site navigation');
  return updated;
}

export async function deleteSiteNavigation(db: D1Database, tenantId: string, id: string): Promise<void> {
  await db.prepare('DELETE FROM site_navigations WHERE id = ? AND tenant_id = ?').bind(id, tenantId).run();
}

export async function createCategory(
  db: D1Database,
  tenantId: string,
  input: Pick<CategoryRow, 'slug' | 'name' | 'enabled' | 'order_index'>
): Promise<CategoryRow> {
  const id = uuidv4();
  await db
    .prepare(
      `INSERT INTO categories (id, tenant_id, slug, name, enabled, order_index)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .bind(id, tenantId, input.slug, input.name, input.enabled, input.order_index)
    .run();
  const created = await db
    .prepare('SELECT slug, name, enabled, order_index, tenant_id, id FROM categories WHERE id = ? AND tenant_id = ?')
    .bind(id, tenantId)
    .first<CategoryRow>();
  if (!created) throw new Error('Failed to create category');
  return created;
}

export async function updateCategory(
  db: D1Database,
  tenantId: string,
  id: string,
  updates: Partial<Pick<CategoryRow, 'slug' | 'name' | 'enabled' | 'order_index'>>
): Promise<CategoryRow> {
  await db
    .prepare(
      `UPDATE categories SET
        slug = COALESCE(?, slug),
        name = COALESCE(?, name),
        enabled = COALESCE(?, enabled),
        order_index = COALESCE(?, order_index)
       WHERE id = ? AND tenant_id = ?`
    )
    .bind(
      updates.slug ?? null,
      updates.name ?? null,
      updates.enabled ?? null,
      updates.order_index ?? null,
      id,
      tenantId
    )
    .run();
  const updated = await db
    .prepare('SELECT slug, name, enabled, order_index, tenant_id, id FROM categories WHERE id = ? AND tenant_id = ?')
    .bind(id, tenantId)
    .first<CategoryRow>();
  if (!updated) throw new Error('Failed to update category');
  return updated;
}

export async function listPrCampaigns(db: D1Database, tenantId: string): Promise<PrCampaignRow[]> {
  const { results } = await db
    .prepare('SELECT * FROM pr_campaigns WHERE tenant_id = ? ORDER BY created_at DESC')
    .bind(tenantId)
    .all<PrCampaignRow>();
  return (results ?? []) as PrCampaignRow[];
}

export async function getPrCampaign(db: D1Database, tenantId: string, id: string): Promise<PrCampaignRow | null> {
  const campaign = await db
    .prepare('SELECT * FROM pr_campaigns WHERE id = ? AND tenant_id = ?')
    .bind(id, tenantId)
    .first<PrCampaignRow>();
  return campaign ?? null;
}

export async function createPrCampaign(db: D1Database, tenantId: string, input: Partial<PrCampaignRow>): Promise<PrCampaignRow> {
  const id = uuidv4();
  const now = Math.floor(Date.now() / 1000);
  await db
    .prepare(
      `INSERT INTO pr_campaigns (id, tenant_id, name, status, scheduled_at, description, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(id, tenantId, input.name, input.status ?? 'draft', input.scheduled_at ?? null, input.description ?? null, now, now)
    .run();
  const created = await getPrCampaign(db, tenantId, id);
  if (!created) throw new Error('Failed to create PR campaign');
  return created;
}

export async function updatePrCampaign(
  db: D1Database,
  tenantId: string,
  id: string,
  updates: Partial<PrCampaignRow>
): Promise<PrCampaignRow> {
  await db
    .prepare(
      `UPDATE pr_campaigns SET
        name = COALESCE(?, name),
        status = COALESCE(?, status),
        scheduled_at = COALESCE(?, scheduled_at),
        description = COALESCE(?, description)
       WHERE id = ? AND tenant_id = ?`
    )
    .bind(
      updates.name ?? null,
      updates.status ?? null,
      updates.scheduled_at ?? null,
      updates.description ?? null,
      id,
      tenantId
    )
    .run();
  const updated = await getPrCampaign(db, tenantId, id);
  if (!updated) throw new Error('Failed to update PR campaign');
  return updated;
}

export async function deletePrCampaign(db: D1Database, tenantId: string, id: string): Promise<void> {
  await db.prepare('DELETE FROM pr_campaigns WHERE id = ? AND tenant_id = ?').bind(id, tenantId).run();
}

export async function listPrMentions(db: D1Database, tenantId: string, campaignId: string): Promise<PrMentionRow[]> {
  const { results } = await db
    .prepare('SELECT * FROM pr_mentions WHERE tenant_id = ? AND campaign_id = ? ORDER BY created_at DESC')
    .bind(tenantId, campaignId)
    .all<PrMentionRow>();
  return (results ?? []) as PrMentionRow[];
}

export async function createPrMention(db: D1Database, tenantId: string, input: Partial<PrMentionRow>): Promise<PrMentionRow> {
  const id = uuidv4();
  const now = Math.floor(Date.now() / 1000);
  await db
    .prepare(
      `INSERT INTO pr_mentions (id, tenant_id, campaign_id, outlet_name, url, published_at, memo, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      tenantId,
      input.campaign_id,
      input.outlet_name,
      input.url,
      input.published_at ?? null,
      input.memo ?? null,
      now
    )
    .run();
  const mention = await db
    .prepare('SELECT * FROM pr_mentions WHERE id = ? AND tenant_id = ?')
    .bind(id, tenantId)
    .first<PrMentionRow>();
  if (!mention) throw new Error('Failed to create PR mention');
  return mention;
}

export async function updatePrMention(
  db: D1Database,
  tenantId: string,
  id: string,
  updates: Partial<PrMentionRow>
): Promise<PrMentionRow> {
  await db
    .prepare(
      `UPDATE pr_mentions SET
        outlet_name = COALESCE(?, outlet_name),
        url = COALESCE(?, url),
        published_at = COALESCE(?, published_at),
        memo = COALESCE(?, memo)
       WHERE id = ? AND tenant_id = ?`
    )
    .bind(
      updates.outlet_name ?? null,
      updates.url ?? null,
      updates.published_at ?? null,
      updates.memo ?? null,
      id,
      tenantId
    )
    .run();
  const mention = await db
    .prepare('SELECT * FROM pr_mentions WHERE id = ? AND tenant_id = ?')
    .bind(id, tenantId)
    .first<PrMentionRow>();
  if (!mention) throw new Error('Failed to update PR mention');
  return mention;
}

export async function deletePrMention(db: D1Database, tenantId: string, id: string): Promise<void> {
  await db.prepare('DELETE FROM pr_mentions WHERE id = ? AND tenant_id = ?').bind(id, tenantId).run();
}

export async function listPrReports(db: D1Database, tenantId: string, campaignId: string): Promise<PrReportRow[]> {
  const { results } = await db
    .prepare('SELECT * FROM pr_reports WHERE tenant_id = ? AND campaign_id = ? ORDER BY created_at DESC')
    .bind(tenantId, campaignId)
    .all<PrReportRow>();
  return (results ?? []) as PrReportRow[];
}

export async function createPrReport(db: D1Database, tenantId: string, input: Partial<PrReportRow>): Promise<PrReportRow> {
  const id = uuidv4();
  const now = Math.floor(Date.now() / 1000);
  await db
    .prepare(
      `INSERT INTO pr_reports (id, tenant_id, campaign_id, period_start, period_end, highlights, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(id, tenantId, input.campaign_id, input.period_start ?? null, input.period_end ?? null, input.highlights ?? null, now)
    .run();
  const report = await db
    .prepare('SELECT * FROM pr_reports WHERE id = ? AND tenant_id = ?')
    .bind(id, tenantId)
    .first<PrReportRow>();
  if (!report) throw new Error('Failed to create PR report');
  return report;
}

export async function updatePrReport(
  db: D1Database,
  tenantId: string,
  id: string,
  updates: Partial<PrReportRow>
): Promise<PrReportRow> {
  await db
    .prepare(
      `UPDATE pr_reports SET
        period_start = COALESCE(?, period_start),
        period_end = COALESCE(?, period_end),
        highlights = COALESCE(?, highlights)
       WHERE id = ? AND tenant_id = ?`
    )
    .bind(updates.period_start ?? null, updates.period_end ?? null, updates.highlights ?? null, id, tenantId)
    .run();
  const report = await db
    .prepare('SELECT * FROM pr_reports WHERE id = ? AND tenant_id = ?')
    .bind(id, tenantId)
    .first<PrReportRow>();
  if (!report) throw new Error('Failed to update PR report');
  return report;
}

export async function deletePrReport(db: D1Database, tenantId: string, id: string): Promise<void> {
  await db.prepare('DELETE FROM pr_reports WHERE id = ? AND tenant_id = ?').bind(id, tenantId).run();
}

export function toNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
}

export function toIso(input: number | null): string | null {
  if (!input) return null;
  return new Date(input * 1000).toISOString();
}

export function mapPost(row: PostRow) {
  const publishAt = toNumber((row as any).publish_at ?? row.publish_at);
  const publishedAt = toNumber((row as any).published_at ?? row.published_at);
  const createdAt = toNumber((row as any).created_at ?? row.created_at);
  const updatedAt = toNumber((row as any).updated_at ?? row.updated_at);
  const viewCount = toNumber((row as any).view_count ?? 0) ?? 0;
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    body_md: row.body_md,
    category_slug: row.category_slug,
    status: row.status,
    view_count: viewCount,
    publish_at: publishAt,
    published_at: publishedAt,
    created_at: createdAt ?? undefined,
    updated_at: updatedAt ?? undefined,
    published_at_iso: toIso(publishedAt),
    updated_at_iso: toIso(updatedAt),
  };
}

export function mapDeployJob(row: DeployJobRow) {
  const updatedAt = toNumber((row as any).updated_at ?? row.updated_at);
  const createdAt = toNumber((row as any).created_at ?? row.created_at);
  return {
    id: row.id,
    post_id: row.post_id,
    status: row.status,
    message: row.message,
    triggered_by_user_id: row.triggered_by_user_id,
    created_at: createdAt ?? undefined,
    updated_at: updatedAt ?? undefined,
    updated_at_iso: toIso(updatedAt),
  };
}

export function mapPrCampaign(row: PrCampaignRow) {
  const scheduledAt = toNumber((row as any).scheduled_at ?? row.scheduled_at);
  const createdAt = toNumber((row as any).created_at ?? row.created_at);
  const updatedAt = toNumber((row as any).updated_at ?? row.updated_at);
  return {
    id: row.id,
    name: row.name,
    status: row.status,
    scheduled_at: scheduledAt,
    description: row.description,
    created_at: createdAt ?? undefined,
    updated_at: updatedAt ?? undefined,
    scheduled_at_iso: toIso(scheduledAt),
    updated_at_iso: toIso(updatedAt),
  };
}

export function mapPrMention(row: PrMentionRow) {
  const publishedAt = toNumber((row as any).published_at ?? row.published_at);
  const createdAt = toNumber((row as any).created_at ?? row.created_at);
  return {
    id: row.id,
    campaign_id: row.campaign_id,
    outlet_name: row.outlet_name,
    url: row.url,
    published_at: publishedAt,
    memo: row.memo,
    created_at: createdAt ?? undefined,
    published_at_iso: toIso(publishedAt),
  };
}

export function mapPrReport(row: PrReportRow) {
  const createdAt = toNumber((row as any).created_at ?? row.created_at);
  return {
    id: row.id,
    campaign_id: row.campaign_id,
    period_start: row.period_start,
    period_end: row.period_end,
    highlights: row.highlights,
    created_at: createdAt ?? undefined,
  };
}

const SLUG_REGEX = /^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u;
const RESERVED_SLUGS = new Set([
  'posts',
  'category',
  'tag',
  'search',
  'assets',
  'api',
  'cms',
  'sitemap.xml',
  'robots.txt',
]);

export function isReservedSlug(input: string | undefined | null): boolean {
  if (!input) return false;
  return RESERVED_SLUGS.has(input.toLowerCase());
}

export function generateSlug(input: string | undefined | null): string {
  const safe = (input ?? '')
    .normalize('NFC')
    .toLowerCase()
    .trim();
  const base = safe
    .replace(/[^\p{L}\p{N}\s-]+/gu, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (base && SLUG_REGEX.test(base)) return base;
  if (base) return base;
  return `post-${uuidv4()}`;
}
