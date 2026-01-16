import { Hono } from 'hono';
import { buildTokenMiddleware } from '../middleware/rbac';
import {
  getSiteConfig,
  listEnabledCategories,
  listPublishedPostsByIds,
  listPublishedPostsBySlugs,
  listPublishedPostsWithViews,
  listSiteNavigations,
  mapPost,
} from '../db';
import { THEME_PRESETS } from '../theme/presets';

const router = new Hono();
const DEFAULT_PRESET_ID = 'type-a-portal';
const DEFAULT_HOME_LAYOUT = [
  { type: 'hero', title: '주요 뉴스', limit: 1, order_by: 'latest', enable_slider: false },
  { type: 'latest', title: '최신글', limit: 6 },
  { type: 'popular', title: '인기글', limit: 6 },
];

type HomeSection = {
  id?: string;
  type: 'hero' | 'latest' | 'popular' | 'pick' | 'banner' | 'features' | 'html';
  title?: string | null;
  limit?: number | null;
  order_by?: 'latest' | 'popular' | 'manual' | null;
  enable_slider?: boolean | null;
  post_ids?: string[] | null;
  post_slugs?: string[] | null;
  subtitle?: string | null;
  image_url?: string | null;
  button_text?: string | null;
  button_link?: string | null;
  height_size?: string | null;
  items?: Array<{ icon?: string | null; title?: string | null; description?: string | null }> | null;
  raw_content?: string | null;
};

function getBucket(c: any) {
  const bucket = c.env?.MEDIA_BUCKET;
  if (!bucket) {
    throw new Error('MEDIA_BUCKET binding is required');
  }
  return bucket;
}

async function readThemeConfig(c: any, tenantId: string) {
  try {
    const bucket = getBucket(c);
    const key = `tenants/${tenantId}/theme.json`;
    const object = await bucket.get(key);
    if (!object) {
      return { preset_id: DEFAULT_PRESET_ID };
    }
    try {
      const parsed = JSON.parse(await object.text());
      return { preset_id: parsed?.preset_id || DEFAULT_PRESET_ID };
    } catch {
      return { preset_id: DEFAULT_PRESET_ID };
    }
  } catch {
    return { preset_id: DEFAULT_PRESET_ID };
  }
}

function resolvePreset(presetId: string | null | undefined) {
  return THEME_PRESETS.find((preset) => preset.id === presetId) || THEME_PRESETS[0];
}

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

router.use('/build/*', buildTokenMiddleware);

router.get('/build/posts', async (c) => {
  const tenant = c.get('buildTenant');
  const pageParam = Number.parseInt(c.req.query('page') || '1', 10);
  const limitParam = Number.parseInt(c.req.query('limit') || '100', 10);
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 200) : 100;
  const offset = (page - 1) * limit;

  const { results } = await c.env.DB.prepare(
    `SELECT * FROM posts
     WHERE tenant_id = ? AND status = 'published'
     ORDER BY published_at DESC
     LIMIT ? OFFSET ?`
  )
    .bind(tenant.id, limit + 1, offset)
    .all();

  const rows = (results ?? []) as any[];
  const hasNext = rows.length > limit;
  const sliced = rows.slice(0, limit);
  return c.json({ posts: sliced.map(mapPost), meta: { has_next: hasNext } });
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

router.get('/build/site', async (c) => {
  const tenant = c.get('buildTenant');
  const config = await getSiteConfig(c.env.DB, tenant.id);
  const items = await listSiteNavigations(c.env.DB, tenant.id);
  const header = items.filter((item) => item.location === 'header');
  const footer = items.filter((item) => item.location === 'footer');
  return c.json({
    logo_url: config?.logo_url ?? null,
    footer_text: config?.footer_text ?? null,
    search_enabled: config?.search_enabled ?? 1,
    navigations: { header, footer },
  });
});

router.get('/build/home', async (c) => {
  const tenant = c.get('buildTenant');
  const config = await getSiteConfig(c.env.DB, tenant.id);
  const layout = normalizeHomeLayout(config?.home_layout || null);
  const latestPosts = await listPublishedPostsWithViews(c.env.DB, tenant.id, { orderByViews: false });
  const popularPosts = await listPublishedPostsWithViews(c.env.DB, tenant.id, { orderByViews: true });

  const sections = [];
  for (const section of layout) {
    if (!section || !section.type) continue;
    if (section.type === 'banner' || section.type === 'features' || section.type === 'html') {
      sections.push({
        ...section,
        posts: [],
      });
      continue;
    }
    const limit = section.limit && section.limit > 0 ? section.limit : section.type === 'hero' ? 1 : 6;
    let posts = [];
    if (section.type === 'hero') {
      if (section.order_by === 'manual') {
        const ids = Array.isArray(section.post_ids) ? section.post_ids.filter(Boolean) : [];
        const slugs = Array.isArray(section.post_slugs) ? section.post_slugs.filter(Boolean) : [];
        if (ids.length) {
          posts = await listPublishedPostsByIds(c.env.DB, tenant.id, ids);
        } else if (slugs.length) {
          posts = await listPublishedPostsBySlugs(c.env.DB, tenant.id, slugs);
        }
      } else {
        const source = section.order_by === 'popular' ? popularPosts : latestPosts;
        posts = source.slice(0, limit);
      }
    } else if (section.type === 'latest') {
      posts = latestPosts.slice(0, limit);
    } else if (section.type === 'popular') {
      posts = popularPosts.slice(0, limit);
    } else if (section.type === 'pick') {
      const ids = Array.isArray(section.post_ids) ? section.post_ids.filter(Boolean) : [];
      const slugs = Array.isArray(section.post_slugs) ? section.post_slugs.filter(Boolean) : [];
      if (ids.length) {
        posts = await listPublishedPostsByIds(c.env.DB, tenant.id, ids);
      } else if (slugs.length) {
        posts = await listPublishedPostsBySlugs(c.env.DB, tenant.id, slugs);
      }
    }
    sections.push({
      ...section,
      posts: posts.map(mapPost),
    });
  }

  return c.json({ sections });
});

router.get('/build/theme', async (c) => {
  const tenant = c.get('buildTenant');
  const config = await readThemeConfig(c, tenant.id);
  const preset = resolvePreset(config.preset_id);
  return c.json({
    ok: true,
    preset_id: preset.id,
    layout_type: preset.layout_type,
    tokens: preset.tokens,
  });
});

router.get('/build/meta', (c) => {
  const tenant = c.get('buildTenant');
  return c.json({ tenant: { id: tenant.id, slug: tenant.slug, name: tenant.name } });
});

export default router;
