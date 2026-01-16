import { Hono } from 'hono';
import { requireRole, sessionMiddleware } from '../middleware/rbac';
import { createPopup, deletePopup, listPopups, updatePopup } from '../db';

const router = new Hono();

router.use('/cms/popups/*', sessionMiddleware);
router.use('/cms/popups', sessionMiddleware);
router.use('/cms/popups/*', requireRole(['tenant_admin', 'super_admin']));
router.use('/cms/popups', requireRole(['tenant_admin', 'super_admin']));

function normalizePopupType(value: unknown): 'modal' | 'topbar' | 'bottombar' | null {
  if (value === 'modal' || value === 'topbar' || value === 'bottombar') return value;
  return null;
}

function normalizeContent(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value);
  } catch {
    return null;
  }
}

function normalizeTimestamp(value: unknown): number | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  if (typeof value === 'number' && Number.isFinite(value)) return Math.floor(value);
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    if (Number.isNaN(parsed)) return null;
    return Math.floor(parsed / 1000);
  }
  return null;
}

router.get('/cms/popups', async (c) => {
  const tenant = c.get('tenant');
  const popups = await listPopups(c.env.DB, tenant.id);
  return c.json({ popups });
});

router.post('/cms/popups', async (c) => {
  const tenant = c.get('tenant');
  const body = await c.req.json();
  const title = body?.title ? `${body.title}`.trim() : '';
  const content = normalizeContent(body?.content);
  const type = normalizePopupType(body?.type);
  if (!title || !content || !type) {
    return c.json({ error: 'title, content, type are required' }, 400);
  }
  if (body?.is_active !== undefined && typeof body?.is_active !== 'boolean') {
    return c.json({ error: 'is_active must be boolean' }, 400);
  }
  const startAt = normalizeTimestamp(body?.start_at);
  const endAt = normalizeTimestamp(body?.end_at);
  if (startAt === null && body?.start_at !== undefined && body?.start_at !== null && body?.start_at !== '') {
    return c.json({ error: 'start_at is invalid' }, 400);
  }
  if (endAt === null && body?.end_at !== undefined && body?.end_at !== null && body?.end_at !== '') {
    return c.json({ error: 'end_at is invalid' }, 400);
  }
  const isActive = typeof body?.is_active === 'boolean' ? (body.is_active ? 1 : 0) : 1;
  const popup = await createPopup(c.env.DB, tenant.id, {
    title,
    content,
    type,
    start_at: startAt ?? null,
    end_at: endAt ?? null,
    is_active: isActive,
  });
  return c.json({ popup }, 201);
});

router.put('/cms/popups/:id', async (c) => {
  const tenant = c.get('tenant');
  const id = c.req.param('id');
  const body = await c.req.json();
  const title = body?.title !== undefined ? `${body.title}`.trim() : undefined;
  const content = body?.content !== undefined ? normalizeContent(body?.content) : undefined;
  const type = body?.type !== undefined ? normalizePopupType(body?.type) : undefined;
  if (body?.type !== undefined && !type) {
    return c.json({ error: 'type is invalid' }, 400);
  }
  if (body?.title !== undefined && !title) {
    return c.json({ error: 'title is invalid' }, 400);
  }
  if (body?.content !== undefined && content === null) {
    return c.json({ error: 'content is invalid' }, 400);
  }
  if (body?.is_active !== undefined && typeof body?.is_active !== 'boolean') {
    return c.json({ error: 'is_active must be boolean' }, 400);
  }
  const startAt = normalizeTimestamp(body?.start_at);
  const endAt = normalizeTimestamp(body?.end_at);
  if (startAt === null && body?.start_at !== undefined && body?.start_at !== null && body?.start_at !== '') {
    return c.json({ error: 'start_at is invalid' }, 400);
  }
  if (endAt === null && body?.end_at !== undefined && body?.end_at !== null && body?.end_at !== '') {
    return c.json({ error: 'end_at is invalid' }, 400);
  }
  const isActive = body?.is_active === undefined ? undefined : body.is_active ? 1 : 0;

  const popup = await updatePopup(c.env.DB, tenant.id, id, {
    title: title === undefined ? undefined : title,
    content,
    type,
    start_at: startAt,
    end_at: endAt,
    is_active: isActive,
  });
  return c.json({ popup });
});

router.delete('/cms/popups/:id', async (c) => {
  const tenant = c.get('tenant');
  const id = c.req.param('id');
  await deletePopup(c.env.DB, tenant.id, id);
  return c.json({ ok: true });
});

export default router;
