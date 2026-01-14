import { Hono } from 'hono';
import { sessionMiddleware, requireRole } from '../middleware/rbac';
import {
  createPost,
  getPost,
  listPosts,
  mapPost,
  publishPost,
  deletePost,
  updatePost,
  generateSlug,
  isReservedSlug,
  createDeployJob,
  updateDeployJobStatus,
  mapDeployJob,
  type TenantRow,
} from '../db';
import { SessionData } from '../session';

const router = new Hono();

router.use('/cms/posts/*', sessionMiddleware);
router.use('/cms/posts', sessionMiddleware);

router.post('/cms/posts', async (c) => {
  const tenant = c.get('tenant');
  const body = await c.req.json();
  const { title, slug, excerpt, body_md, category_slug } = body;
  if (!title) return c.json({ error: 'title is required' }, 400);

  const finalSlug = slug ? generateSlug(slug) : generateSlug(title);
  if (isReservedSlug(finalSlug)) {
    return c.json({ error: 'slug is reserved' }, 409);
  }
  try {
    const post = await createPost(c.env.DB, tenant.id, { title, slug: finalSlug, excerpt, body_md, category_slug });
    return c.json({ post: mapPost(post) }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    const isUniqueSlug = message.includes('UNIQUE constraint failed: posts.tenant_id, posts.slug');
    if (isUniqueSlug && slug) {
      return c.json({ error: 'slug already exists' }, 409);
    }
    if (isUniqueSlug) {
      const retrySlug = generateSlug(`${finalSlug}-${crypto.randomUUID().slice(0, 8)}`);
      const post = await createPost(c.env.DB, tenant.id, { title, slug: retrySlug, excerpt, body_md, category_slug });
      return c.json({ post: mapPost(post) }, 201);
    }
    throw error;
  }
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

  const nextSlug = slug ? generateSlug(slug) : title ? generateSlug(title) : undefined;
  if (isReservedSlug(nextSlug)) {
    return c.json({ error: 'slug is reserved' }, 409);
  }

  try {
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
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    const isUniqueSlug = message.includes('UNIQUE constraint failed: posts.tenant_id, posts.slug');
    if (isUniqueSlug && slug) {
      return c.json({ error: 'slug already exists' }, 409);
    }
    if (isUniqueSlug && nextSlug) {
      const retrySlug = generateSlug(`${nextSlug}-${crypto.randomUUID().slice(0, 8)}`);
      const updated = await updatePost(c.env.DB, tenant.id, id, {
        title,
        slug: retrySlug,
        excerpt,
        body_md,
        category_slug,
        status,
        publish_at,
      });
      return c.json({ post: mapPost(updated), saved_at: mapPost(updated).updated_at_iso });
    }
    throw error;
  }
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

  const finalJob = await triggerDeployHook({
    db: c.env.DB,
    tenant,
    triggeredBy: session.userId,
    postId: id,
    triggerReason: 'Publish triggered',
  });

  return c.json({ post: mapPost(published), deploy_job: mapDeployJob(finalJob) });
});

router.delete('/cms/posts/:id', async (c) => {
  const session = c.get('session') as SessionData;
  const tenant = c.get('tenant');
  const id = c.req.param('id');

  if (!requireRole(session, ['admin', 'super'])) return c.json({ error: 'Forbidden' }, 403);

  const existing = await getPost(c.env.DB, tenant.id, id);
  if (!existing) return c.json({ error: 'Post not found' }, 404);

  let updated: Awaited<ReturnType<typeof updatePost>>;
  try {
    updated = await updatePost(c.env.DB, tenant.id, id, { status: 'trashed' });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('CHECK constraint failed')) {
      updated = await updatePost(c.env.DB, tenant.id, id, { status: 'draft' });
    } else {
      throw error;
    }
  }
  const finalJob = await triggerDeployHookSafe({
    db: c.env.DB,
    tenant,
    triggeredBy: session.userId,
    postId: id,
    triggerReason: 'Trashed post',
  });
  return c.json({
    ok: true,
    post: mapPost(updated),
    deploy_job: finalJob ? mapDeployJob(finalJob) : null,
  });
});

router.post('/cms/posts/:id/unpublish', async (c) => {
  const session = c.get('session') as SessionData;
  const tenant = c.get('tenant');
  const id = c.req.param('id');

  if (!requireRole(session, ['admin', 'super'])) return c.json({ error: 'Forbidden' }, 403);

  const existing = await getPost(c.env.DB, tenant.id, id);
  if (!existing) return c.json({ error: 'Post not found' }, 404);

  let updated: Awaited<ReturnType<typeof updatePost>>;
  try {
    updated = await updatePost(c.env.DB, tenant.id, id, { status: 'paused' });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('CHECK constraint failed')) {
      updated = await updatePost(c.env.DB, tenant.id, id, { status: 'draft' });
    } else {
      throw error;
    }
  }
  const finalJob = await triggerDeployHookSafe({
    db: c.env.DB,
    tenant,
    triggeredBy: session.userId,
    postId: id,
    triggerReason: 'Unpublish triggered',
  });
  return c.json({
    ok: true,
    post: mapPost(updated),
    deploy_job: finalJob ? mapDeployJob(finalJob) : null,
  });
});

router.delete('/cms/posts/:id/purge', async (c) => {
  const session = c.get('session') as SessionData;
  const tenant = c.get('tenant');
  const id = c.req.param('id');

  if (!requireRole(session, ['admin', 'super'])) return c.json({ error: 'Forbidden' }, 403);

  const existing = await getPost(c.env.DB, tenant.id, id);
  if (!existing) return c.json({ error: 'Post not found' }, 404);
  if (existing.status !== 'trashed') {
    return c.json({ error: 'Post is not in trash' }, 409);
  }

  await deletePost(c.env.DB, tenant.id, id);
  return c.json({ ok: true });
});

type DeployHookInput = {
  db: D1Database;
  tenant: TenantRow;
  triggeredBy: string | null;
  postId: string | null;
  triggerReason: string;
};

async function triggerDeployHook({ db, tenant, triggeredBy, postId, triggerReason }: DeployHookInput) {
  const job = await createDeployJob(db, tenant.id, triggeredBy, 'queued', triggerReason, postId);
  const buildingJob = await updateDeployJobStatus(db, job.id, 'building', 'Deploy hook triggered');

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
        status = 'building';
        message = 'Deploy hook accepted; awaiting webhook';
      }
    } catch (error) {
      status = 'failed';
      message = 'Deploy hook request errored';
      console.error('Deploy hook error', error);
    }
  }

  return updateDeployJobStatus(db, buildingJob.id, status, message);
}

async function triggerDeployHookSafe(input: DeployHookInput) {
  try {
    return await triggerDeployHook(input);
  } catch (error) {
    console.error('Deploy hook skipped', error);
    return null;
  }
}

export default router;
