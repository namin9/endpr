import { Hono } from 'hono';
import { requireRole, sessionMiddleware } from '../middleware/rbac';
import {
  createSiteNavigation,
  deleteSiteNavigation,
  getSiteConfig,
  listSiteNavigations,
  updateSiteNavigation,
  upsertSiteConfig,
} from '../db';

const router = new Hono();

const DEFAULT_HOME_LAYOUT = [
  { type: 'hero', title: '주요 뉴스', limit: 1, order_by: 'latest', enable_slider: false },
  { type: 'latest', title: '최신글', limit: 6 },
  { type: 'popular', title: '인기글', limit: 6 },
];

type HomeSection = {
  id?: string;
  type: 'hero' | 'latest' | 'popular' | 'pick';
  title?: string | null;
  limit?: number | null;
  order_by?: 'latest' | 'popular' | 'manual' | null;
  enable_slider?: boolean | null;
  post_ids?: string[] | null;
  post_slugs?: string[] | null;
};

function normalizeHomeLayout(input: unknown): HomeSection[] {
  if (!input) return [...DEFAULT_HOME_LAYOUT];
  if (Array.isArray(input)) {
    return input.filter(Boolean) as HomeSection[];
  }
  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input);
      if (Array.isArray(parsed)) return parsed as HomeSection[];
    } catch {
      return [...DEFAULT_HOME_LAYOUT];
    }
  }
  return [...DEFAULT_HOME_LAYOUT];
}

function serializeHomeLayout(input: unknown): string {
  const normalized = normalizeHomeLayout(input);
  return JSON.stringify(normalized);
}

function sanitizeString(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const trimmed = `${value}`.trim();
  return trimmed ? trimmed : null;
}

function sanitizeBoolean(value: unknown): number | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value === 'boolean') return value ? 1 : 0;
  return null;
}

router.use('/cms/site-config/*', sessionMiddleware);
router.use('/cms/site-config', sessionMiddleware);
router.use('/cms/site-navigations/*', sessionMiddleware);
router.use('/cms/site-navigations', sessionMiddleware);
router.use('/cms/site-config/*', requireRole(['tenant_admin', 'super_admin']));
router.use('/cms/site-config', requireRole(['tenant_admin', 'super_admin']));
router.use('/cms/site-navigations/*', requireRole(['tenant_admin', 'super_admin']));
router.use('/cms/site-navigations', requireRole(['tenant_admin', 'super_admin']));

router.get('/cms/site-config', async (c) => {
  const tenant = c.get('tenant');
  const config = await getSiteConfig(c.env.DB, tenant.id);
  const homeLayout = normalizeHomeLayout(config?.home_layout || null);
  return c.json({
    config: {
      logo_url: config?.logo_url ?? null,
      footer_text: config?.footer_text ?? null,
      home_layout: homeLayout,
      search_enabled: config?.search_enabled ?? 1,
      updated_at: config?.updated_at ?? null,
    },
  });
});

router.put('/cms/site-config', async (c) => {
  const tenant = c.get('tenant');
  const body = await c.req.json();
  const existing = await getSiteConfig(c.env.DB, tenant.id);
  const logoUrl = sanitizeString(body?.logo_url);
  const footerText = sanitizeString(body?.footer_text);
  const searchEnabled = sanitizeBoolean(body?.search_enabled);
  const payload = {
    logo_url: logoUrl === undefined ? existing?.logo_url ?? null : logoUrl,
    footer_text: footerText === undefined ? existing?.footer_text ?? null : footerText,
    home_layout: serializeHomeLayout(body?.home_layout ?? existing?.home_layout ?? null),
    search_enabled: searchEnabled === undefined ? existing?.search_enabled ?? 1 : searchEnabled,
  };
  const config = await upsertSiteConfig(c.env.DB, tenant.id, payload);
  const homeLayout = normalizeHomeLayout(config.home_layout || null);
  return c.json({
    ok: true,
    config: {
      logo_url: config.logo_url ?? null,
      footer_text: config.footer_text ?? null,
      home_layout: homeLayout,
      search_enabled: config.search_enabled ?? 1,
      updated_at: config.updated_at ?? null,
    },
  });
});

router.get('/cms/site-navigations', async (c) => {
  const tenant = c.get('tenant');
  const items = await listSiteNavigations(c.env.DB, tenant.id);
  return c.json({ items });
});

router.post('/cms/site-navigations', async (c) => {
  const tenant = c.get('tenant');
  const body = await c.req.json();
  const location = body?.location;
  const label = sanitizeString(body?.label);
  const url = sanitizeString(body?.url);
  const parentId = sanitizeString(body?.parent_id);
  if (!location || !label || !url) {
    return c.json({ error: 'location, label, url are required' }, 400);
  }
  if (!['header', 'footer'].includes(location)) {
    return c.json({ error: 'invalid location' }, 400);
  }
  const orderIndex = Number.isFinite(Number(body?.order_index)) ? Number(body.order_index) : null;
  const item = await createSiteNavigation(c.env.DB, tenant.id, {
    location,
    parent_id: location === 'header' ? parentId : null,
    label,
    url,
    order_index: orderIndex,
  });
  return c.json({ item }, 201);
});

router.patch('/cms/site-navigations/:id', async (c) => {
  const tenant = c.get('tenant');
  const id = c.req.param('id');
  const body = await c.req.json();
  const location = ['header', 'footer'].includes(body?.location) ? body.location : undefined;
  const parentId = body?.parent_id !== undefined ? sanitizeString(body.parent_id) : undefined;
  const updates = {
    location,
    parent_id: location === 'footer' ? null : parentId,
    label: body?.label !== undefined ? sanitizeString(body.label) : undefined,
    url: body?.url !== undefined ? sanitizeString(body.url) : undefined,
    order_index: Number.isFinite(Number(body?.order_index)) ? Number(body.order_index) : undefined,
  };
  const item = await updateSiteNavigation(c.env.DB, tenant.id, id, updates);
  return c.json({ item });
});

router.delete('/cms/site-navigations/:id', async (c) => {
  const tenant = c.get('tenant');
  const id = c.req.param('id');
  await deleteSiteNavigation(c.env.DB, tenant.id, id);
  return c.json({ ok: true });
});

export default router;
