import { Hono } from 'hono';
import { sessionMiddleware } from '../middleware/rbac';
import { createCategory, generateSlug, isReservedSlug, listCategories, updateCategory } from '../db';

const router = new Hono();

router.use('/cms/categories/*', sessionMiddleware);
router.use('/cms/categories', sessionMiddleware);

router.get('/cms/categories', async (c) => {
  const tenant = c.get('tenant');
  const categories = await listCategories(c.env.DB, tenant.id);
  return c.json({ categories });
});

router.post('/cms/categories', async (c) => {
  const tenant = c.get('tenant');
  const body = await c.req.json();
  const { name, slug, enabled, order_index } = body;
  if (!name) return c.json({ error: 'name is required' }, 400);
  const finalSlug = slug ? generateSlug(slug) : generateSlug(name);
  if (isReservedSlug(finalSlug)) {
    return c.json({ error: 'slug is reserved' }, 409);
  }
  const category = await createCategory(c.env.DB, tenant.id, {
    slug: finalSlug,
    name,
    enabled: typeof enabled === 'boolean' ? (enabled ? 1 : 0) : 1,
    order_index: Number.isFinite(order_index) ? order_index : 0,
  });
  return c.json({ category }, 201);
});

router.patch('/cms/categories/:id', async (c) => {
  const tenant = c.get('tenant');
  const id = c.req.param('id');
  const body = await c.req.json();
  const { name, slug, enabled, order_index } = body;
  const nextSlug = slug ? generateSlug(slug) : undefined;
  if (isReservedSlug(nextSlug)) {
    return c.json({ error: 'slug is reserved' }, 409);
  }
  const category = await updateCategory(c.env.DB, tenant.id, id, {
    name,
    slug: nextSlug,
    enabled: typeof enabled === 'boolean' ? (enabled ? 1 : 0) : undefined,
    order_index: Number.isFinite(order_index) ? order_index : undefined,
  });
  return c.json({ category });
});

export default router;
