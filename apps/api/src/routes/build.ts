import { Hono } from 'hono';
import { buildTokenMiddleware } from '../middleware/rbac';
import { listEnabledCategories, listPublishedPosts, mapPost } from '../db';

const router = new Hono();

router.use('/build/*', buildTokenMiddleware);

router.get('/build/posts', async (c) => {
  const tenant = c.get('buildTenant');
  const posts = await listPublishedPosts(c.env.DB, tenant.id);
  return c.json({ posts: posts.map(mapPost) });
});

router.get('/build/post/:slug', async (c) => {
  const tenant = c.get('buildTenant');
  const slug = c.req.param('slug');
  const { results } = await c.env.DB.prepare(
    `SELECT * FROM posts WHERE tenant_id = ? AND slug = ? AND status = 'published' LIMIT 1`
  )
    .bind(tenant.id, slug)
    .all();
  const post = results?.[0] as any;
  if (!post) return c.json({ error: 'Post not found' }, 404);
  return c.json({ post: mapPost(post) });
});

router.get('/build/categories', async (c) => {
  const tenant = c.get('buildTenant');
  const categories = await listEnabledCategories(c.env.DB, tenant.id);
  return c.json({ categories });
});

export default router;
