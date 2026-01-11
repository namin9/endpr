import { Hono } from 'hono';
import { getTenantBySlug } from '../db';

const router = new Hono();

router.post('/public/view', async (c) => {
  const body = await c.req.json();
  const { tenantSlug, pageKey } = body || {};
  if (!tenantSlug || !pageKey) return c.json({ error: 'tenantSlug and pageKey are required' }, 400);

  const tenant = await getTenantBySlug(c.env.DB, tenantSlug);
  if (!tenant) return c.json({ error: 'Tenant not found' }, 404);

  const day = new Date().toISOString().slice(0, 10);
  await c.env.DB.prepare(
    `INSERT INTO page_views_daily (tenant_id, page_key, day, views)
     VALUES (?, ?, ?, 1)
     ON CONFLICT (tenant_id, page_key, day)
     DO UPDATE SET views = views + 1`
  )
    .bind(tenant.id, pageKey, day)
    .run();

  return c.json({ ok: true });
});

export default router;
