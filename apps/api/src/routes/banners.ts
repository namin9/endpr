import { Hono } from 'hono';
import { requireRole, sessionMiddleware } from '../middleware/rbac';
import { createBanner, deleteBanner, listBanners, updateBanner } from '../db';

const router = new Hono();

router.use('/cms/banners/*', sessionMiddleware);
router.use('/cms/banners', sessionMiddleware);
router.use('/cms/banners/*', requireRole(['tenant_admin', 'super_admin']));
router.use('/cms/banners', requireRole(['tenant_admin', 'super_admin']));

function normalizeLocation(value: unknown): 'home_top' | 'sidebar' | 'post_bottom' | null {
  if (value === 'home_top' || value === 'sidebar' || value === 'post_bottom') return value;
  return null;
}

router.get('/cms/banners', async (c) => {
  const tenant = c.get('tenant');
  const location = c.req.query('location');
  const normalizedLocation = location ? normalizeLocation(location) : null;
  if (location && !normalizedLocation) {
    return c.json({ error: 'location is invalid' }, 400);
  }
  const banners = await listBanners(c.env.DB, tenant.id, normalizedLocation ?? undefined);
  return c.json({ banners });
});

router.post('/cms/banners', async (c) => {
  const tenant = c.get('tenant');
  const body = await c.req.json();
  const location = normalizeLocation(body?.location);
  const imageUrl = body?.image_url ? `${body.image_url}`.trim() : '';
  const linkUrl = body?.link_url ? `${body.link_url}`.trim() : '';
  if (!location || !imageUrl || !linkUrl) {
    return c.json({ error: 'location, image_url, link_url are required' }, 400);
  }
  if (body?.is_active !== undefined && typeof body?.is_active !== 'boolean') {
    return c.json({ error: 'is_active must be boolean' }, 400);
  }
  const orderIndex = Number.isFinite(Number(body?.order_index)) ? Number(body.order_index) : undefined;
  const isActive = typeof body?.is_active === 'boolean' ? (body.is_active ? 1 : 0) : 1;
  const banner = await createBanner(c.env.DB, tenant.id, {
    location,
    image_url: imageUrl,
    link_url: linkUrl,
    order_index: orderIndex,
    is_active: isActive,
  });
  return c.json({ banner }, 201);
});

router.put('/cms/banners/:id', async (c) => {
  const tenant = c.get('tenant');
  const id = c.req.param('id');
  const body = await c.req.json();
  const location = body?.location !== undefined ? normalizeLocation(body?.location) : undefined;
  if (body?.location !== undefined && !location) {
    return c.json({ error: 'location is invalid' }, 400);
  }
  const imageUrl = body?.image_url !== undefined ? `${body.image_url}`.trim() : undefined;
  const linkUrl = body?.link_url !== undefined ? `${body.link_url}`.trim() : undefined;
  if (body?.image_url !== undefined && !imageUrl) {
    return c.json({ error: 'image_url is invalid' }, 400);
  }
  if (body?.link_url !== undefined && !linkUrl) {
    return c.json({ error: 'link_url is invalid' }, 400);
  }
  if (body?.is_active !== undefined && typeof body?.is_active !== 'boolean') {
    return c.json({ error: 'is_active must be boolean' }, 400);
  }
  const orderIndex = Number.isFinite(Number(body?.order_index)) ? Number(body.order_index) : undefined;
  const isActive = body?.is_active === undefined ? undefined : body.is_active ? 1 : 0;

  const banner = await updateBanner(c.env.DB, tenant.id, id, {
    location,
    image_url: imageUrl,
    link_url: linkUrl,
    order_index: orderIndex,
    is_active: isActive,
  });
  return c.json({ banner });
});

router.delete('/cms/banners/:id', async (c) => {
  const tenant = c.get('tenant');
  const id = c.req.param('id');
  await deleteBanner(c.env.DB, tenant.id, id);
  return c.json({ ok: true });
});

export default router;
