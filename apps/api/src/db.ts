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
  status: 'queued' | 'building' | 'success' | 'failed';
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
    .prepare('SELECT * FROM posts WHERE tenant_id = ? ORDER BY created_at DESC')
    .bind(tenantId)
    .all<PostRow>();
  return (results ?? []) as PostRow[];
}

export async function deletePost(db: D1Database, tenantId: string, id: string): Promise<boolean> {
  const result = await db.prepare('DELETE FROM posts WHERE id = ? AND tenant_id = ?').bind(id, tenantId).run();
  return (result.changes ?? 0) > 0;
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
  message: string | null
): Promise<DeployJobRow> {
  const id = uuidv4();
  await db
    .prepare('INSERT INTO deploy_jobs (id, tenant_id, triggered_by_user_id, status, message) VALUES (?, ?, ?, ?, ?)')
    .bind(id, tenantId, triggeredBy, status, message)
    .run();
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

export async function listPublishedPosts(db: D1Database, tenantId: string): Promise<PostRow[]> {
  const { results } = await db
    .prepare(`SELECT * FROM posts WHERE tenant_id = ? AND status = 'published' ORDER BY published_at DESC`)
    .bind(tenantId)
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
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    body_md: row.body_md,
    category_slug: row.category_slug,
    status: row.status,
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
    status: row.status,
    message: row.message,
    triggered_by_user_id: row.triggered_by_user_id,
    created_at: createdAt ?? undefined,
    updated_at: updatedAt ?? undefined,
    updated_at_iso: toIso(updatedAt),
  };
}

export function generateSlug(input: string | undefined | null): string {
  const safe = (input ?? '').toLowerCase().trim();
  const base = safe
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
  if (base) return base;
  return `post-${uuidv4()}`;
}
