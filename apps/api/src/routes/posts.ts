import { Hono } from 'hono';
import { sessionMiddleware, requireRole } from '../middleware/rbac';
import {
  createPost,
  getPost,
  listPosts,
  mapPost,
  publishPost,
  updatePost,
  generateSlug,
  createDeployJob,
  updateDeployJobStatus,
  mapDeployJob,
} from '../db';
import { SessionData } from '../session';

const router = new Hono();

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

function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug.trim().toLowerCase());
}

function reservedSlugResponse(slug: string) {
  console.warn(`Reserved slug rejected: ${slug}`);
  return {
    error: 'reserved_slug',
    message: 'Slug is reserved and cannot be used.',
    reserved: Array.from(RESERVED_SLUGS),
  };
}

function isPublishedPost(post: { status: string; published_at: number | null }): boolean {
  return post.status === 'published' || post.published_at !== null;
}

function slugImmutableResponse() {
  console.warn('Published post slug change rejected');
  return {
    error: 'slug_immutable',
    message: 'Published posts cannot change slug.',
  };
}

function normalizeSlug(input: string | undefined | null): string {
  return (input ?? '')
    .normalize('NFKC')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}-]+/gu, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function isFallbackSlug(slug: string | null): boolean {
  if (!slug) return true;
  return /^post-[0-9a-f-]{36}$/i.test(slug);
}

function parseSlugRoot(slug: string) {
  const match = slug.match(/^(.*)-(\d+)$/);
  if (!match) return { root: slug, requestedSuffix: null };
  const suffix = Number(match[2]);
  if (!Number.isFinite(suffix) || suffix < 2) return { root: slug, requestedSuffix: null };
  return { root: match[1], requestedSuffix: suffix };
}

async function ensureUniqueSlug(db: D1Database, tenantId: string, desiredSlug: string, excludePostId?: string) {
  if (!desiredSlug) return desiredSlug;
  const { root } = parseSlugRoot(desiredSlug);
  const pattern = `${root}-%`;
  let query = 'SELECT slug FROM posts WHERE tenant_id = ? AND (slug = ? OR slug LIKE ?)';
  const params: Array<string> = [tenantId, root, pattern];
  if (excludePostId) {
    query += ' AND id != ?';
    params.push(excludePostId);
  }
  const { results } = await db.prepare(query).bind(...params).all<{ slug: string }>();
  const usedSuffixes = new Set<number>();
  for (const row of results ?? []) {
    if (row.slug === root) {
      usedSuffixes.add(1);
      continue;
    }
    const match = row.slug.match(/^(.*)-(\d+)$/);
    if (!match) continue;
    if (match[1] !== root) continue;
    const suffix = Number(match[2]);
    if (Number.isFinite(suffix) && suffix >= 2) usedSuffixes.add(suffix);
  }
  if (!usedSuffixes.size && desiredSlug === root) return desiredSlug;
  if (desiredSlug !== root) {
    const requestedSuffix = Number(desiredSlug.slice(root.length + 1));
    if (Number.isFinite(requestedSuffix) && requestedSuffix >= 2 && !usedSuffixes.has(requestedSuffix)) {
      return desiredSlug;
    }
  }
  if (!usedSuffixes.has(1) && desiredSlug === root) return desiredSlug;
  let candidate = 2;
  while (usedSuffixes.has(candidate)) candidate += 1;
  return `${root}-${candidate}`;
}

router.use('/cms/posts/*', sessionMiddleware);
router.use('/cms/posts', sessionMiddleware);

router.post('/cms/posts', async (c) => {
  const tenant = c.get('tenant');
  const body = await c.req.json();
  const { title, slug, excerpt, body_md, category_slug } = body;
  if (!title) return c.json({ error: 'title is required' }, 400);

  const finalSlug = slug ? generateSlug(slug) : generateSlug(title);
  if (isReservedSlug(finalSlug)) {
    return c.json(reservedSlugResponse(finalSlug), 400);
  }
  const uniqueSlug = await ensureUniqueSlug(c.env.DB, tenant.id, finalSlug);
  const post = await createPost(c.env.DB, tenant.id, { title, slug: uniqueSlug, excerpt, body_md, category_slug });
  return c.json({ post: mapPost(post) }, 201);
});

router.get('/cms/posts', async (c) => {
  const tenant = c.get('tenant');
  const posts = await listPosts(c.env.DB, tenant.id);
  return c.json({ posts: posts.map(mapPost) });
});

router.get('/cms/posts/:id', async (c) => {
  const tenant = c.get('tenant');
  const id = c.req.param('id');
  const post = await getPost(c.env.DB, tenant.id, id);
  if (!post) return c.json({ error: 'Post not found' }, 404);
  return c.json({ post: mapPost(post) });
});

router.post('/cms/posts/:id/autosave', async (c) => {
  const tenant = c.get('tenant');
  const id = c.req.param('id');
  const body = await c.req.json();
  const { title, slug, excerpt, body_md, category_slug, status, publish_at } = body;
  const hasSlug = Object.prototype.hasOwnProperty.call(body, 'slug');
  const hasTitle = Object.prototype.hasOwnProperty.call(body, 'title');

  const existing = await getPost(c.env.DB, tenant.id, id);
  if (!existing) return c.json({ error: 'Post not found' }, 404);

  let nextSlug: string | undefined;

  if (hasSlug) {
    const requestedSlug = generateSlug(slug);
    if (requestedSlug !== existing.slug) {
      if (isPublishedPost(existing)) {
        return c.json(slugImmutableResponse(), 400);
      }
      if (isReservedSlug(requestedSlug)) {
        return c.json(reservedSlugResponse(requestedSlug), 400);
      }
      nextSlug = await ensureUniqueSlug(c.env.DB, tenant.id, requestedSlug, existing.id);
    }
  } else if (hasTitle && title !== existing.title && !isPublishedPost(existing)) {
    const { root } = parseSlugRoot(existing.slug ?? '');
    const derivedRoot = normalizeSlug(existing.title);
    const shouldAutoSync = isFallbackSlug(existing.slug) || (root && root === derivedRoot);
    if (shouldAutoSync) {
      const desired = normalizeSlug(title);
      if (desired) {
        if (isReservedSlug(desired)) {
          return c.json(reservedSlugResponse(desired), 400);
        }
        nextSlug = await ensureUniqueSlug(c.env.DB, tenant.id, desired, existing.id);
      }
    }
  }

  const updated = await updatePost(c.env.DB, tenant.id, id, {
    title,
    slug: nextSlug,
    excerpt,
    body_md,
    category_slug,
    status,
    publish_at,
  });

  return c.json({ post: mapPost(updated), saved_at: mapPost(updated).updated_at_iso });
});

router.post('/cms/posts/:id/publish', async (c) => {
  const session = c.get('session') as SessionData;
  const tenant = c.get('tenant');
  const id = c.req.param('id');

  if (!requireRole(session, ['admin', 'super'])) return c.json({ error: 'Forbidden' }, 403);

  const existing = await getPost(c.env.DB, tenant.id, id);
  if (!existing) return c.json({ error: 'Post not found' }, 404);
  if (isReservedSlug(existing.slug)) {
    return c.json(reservedSlugResponse(existing.slug), 400);
  }
  if (isPublishedPost(existing)) {
    const contentLength = Number(c.req.header('content-length') ?? '0');
    if (contentLength > 0) {
      const body = await c.req.json();
      const requestedSlug = body?.slug;
      if (typeof requestedSlug === 'string') {
        const nextSlug = generateSlug(requestedSlug);
        if (nextSlug !== existing.slug) {
          return c.json(slugImmutableResponse(), 400);
        }
      }
    }
  }

  if (!isPublishedPost(existing)) {
    const uniqueSlug = await ensureUniqueSlug(c.env.DB, tenant.id, existing.slug, existing.id);
    if (uniqueSlug !== existing.slug) {
      await updatePost(c.env.DB, tenant.id, id, { slug: uniqueSlug });
    }
  }

  const now = Math.floor(Date.now() / 1000);
  const published = await publishPost(c.env.DB, tenant.id, id, now);

  const job = await createDeployJob(c.env.DB, tenant.id, session.userId, 'queued', 'Publish triggered');
  const buildingJob = await updateDeployJobStatus(c.env.DB, job.id, 'building', 'Deploy hook triggered');

  let status: 'building' | 'success' | 'failed' = 'building';
  let message: string | null = 'Deploy hook triggered';

  if (!tenant.pages_deploy_hook_url) {
    status = 'failed';
    message = 'pages_deploy_hook_url not configured';
  } else {
    try {
      const resp = await fetch(tenant.pages_deploy_hook_url, { method: 'POST' });
      if (!resp.ok) {
        status = 'failed';
        message = `Deploy hook failed with status ${resp.status}`;
      } else {
        status = 'success';
        message = 'Deploy hook accepted';
      }
    } catch (error) {
      status = 'failed';
      message = 'Deploy hook request errored';
      console.error('Deploy hook error', error);
    }
  }

  const finalJob = await updateDeployJobStatus(c.env.DB, buildingJob.id, status, message);

  return c.json({ post: mapPost(published), deploy_job: mapDeployJob(finalJob) });
});

export default router;
