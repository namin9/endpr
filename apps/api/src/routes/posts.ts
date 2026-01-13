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
  deletePost,
} from '../db';
import { SessionData } from '../session';

const router = new Hono();

function extractImageUrlsFromText(text: string): string[] {
  const markdownRegex = /!\[[^\]]*]\(([^)]+)\)/g;
  const htmlRegex = /<img[^>]+src=["']([^"']+)["']/gi;
  const urls = new Set<string>();
  let match = markdownRegex.exec(text);
  while (match) {
    urls.add(match[1]);
    match = markdownRegex.exec(text);
  }
  let htmlMatch = htmlRegex.exec(text);
  while (htmlMatch) {
    urls.add(htmlMatch[1]);
    htmlMatch = htmlRegex.exec(text);
  }
  return Array.from(urls);
}

function extractImageKeys({
  bodyText,
  explicitKeys,
  publicBaseUrl,
}: {
  bodyText: string | null;
  explicitKeys: string[];
  publicBaseUrl: string | null;
}): string[] {
  const keys = new Set<string>(explicitKeys);
  const allowedOrigin = publicBaseUrl ? new URL(publicBaseUrl).origin : null;
  if (bodyText) {
    const urls = extractImageUrlsFromText(bodyText);
    urls.forEach((url) => {
      if (!allowedOrigin) return;
      try {
        const parsed = new URL(url, allowedOrigin);
        if (parsed.origin !== allowedOrigin) return;
        const key = parsed.pathname.replace(/^\/+/, '');
        if (!key) return;
        keys.add(key);
      } catch (error) {
        return;
      }
    });
  }
  return Array.from(keys);
}

router.use('/cms/posts/*', sessionMiddleware);
router.use('/cms/posts', sessionMiddleware);

router.post('/cms/posts', async (c) => {
  const tenant = c.get('tenant');
  const body = await c.req.json();
  const { title, slug, excerpt, body_md, category_slug } = body;
  if (!title) return c.json({ error: 'title is required' }, 400);

  const finalSlug = slug ? generateSlug(slug) : generateSlug(title);
  const post = await createPost(c.env.DB, tenant.id, { title, slug: finalSlug, excerpt, body_md, category_slug });
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

  const existing = await getPost(c.env.DB, tenant.id, id);
  if (!existing) return c.json({ error: 'Post not found' }, 404);

  const updated = await updatePost(c.env.DB, tenant.id, id, {
    title,
    slug: slug ? generateSlug(slug) : undefined,
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

router.delete('/cms/posts/:id', async (c) => {
  const session = c.get('session') as SessionData;
  const tenant = c.get('tenant');
  const id = c.req.param('id');

  if (!requireRole(session, ['admin', 'super'])) return c.json({ error: 'Forbidden' }, 403);

  const existing = await getPost(c.env.DB, tenant.id, id);
  if (!existing) return c.json({ error: 'Post not found' }, 404);

  let body: any = null;
  try {
    body = await c.req.json();
  } catch (error) {
    body = null;
  }

  const explicitKeys = Array.isArray(body?.image_keys)
    ? body.image_keys
    : Array.isArray(body?.imageKeys)
      ? body.imageKeys
      : [];
  const bodyText = body?.body_md || body?.body || existing.body_md || '';
  const publicBaseUrl = c.env.R2_PUBLIC_BASE_URL || null;
  const keys = extractImageKeys({
    bodyText,
    explicitKeys,
    publicBaseUrl,
  });

  let deletedImages: string[] = [];
  let imageErrors: string[] = [];
  if (keys.length > 0 && c.env.R2_BUCKET) {
    try {
      await c.env.R2_BUCKET.delete(keys);
      deletedImages = keys;
    } catch (error) {
      console.error('Failed to delete R2 objects', error);
      imageErrors.push('r2_delete_failed');
    }
  }

  const deleted = await deletePost(c.env.DB, tenant.id, id);
  if (!deleted) return c.json({ error: 'Failed to delete post' }, 500);

  return c.json({ ok: true, deleted_post_id: id, deleted_images: deletedImages, image_delete_errors: imageErrors });
});

export default router;
