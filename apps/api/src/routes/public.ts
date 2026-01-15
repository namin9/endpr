import { Hono } from 'hono';
import { createInquiry, getTenantBySlug } from '../db';

const router = new Hono();
const INQUIRY_MAX_LENGTH = 5000;

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

router.post('/public/inquiry', async (c) => {
  const body = await c.req.json();
  const { tenantSlug, type, data, ...rest } = body || {};
  if (!tenantSlug) return c.json({ error: 'tenantSlug is required' }, 400);

  const tenant = await getTenantBySlug(c.env.DB, tenantSlug);
  if (!tenant) return c.json({ error: 'Tenant not found' }, 404);

  const resolvedType = typeof type === 'string' && type.trim() ? type.trim() : 'contact';
  if (resolvedType.length > 50) {
    return c.json({ error: 'type is too long' }, 400);
  }

  const payload = data ?? rest ?? {};
  const serialized = JSON.stringify(payload);
  if (serialized.length > INQUIRY_MAX_LENGTH) {
    return c.json({ error: 'Inquiry payload is too long' }, 413);
  }

  await createInquiry(c.env.DB, tenant.id, { type: resolvedType, data: serialized });
  return c.json({ ok: true }, 201);
});

export default router;
