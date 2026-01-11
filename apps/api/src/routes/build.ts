import { Hono } from 'hono';
import { buildTokenMiddleware } from '../middleware/rbac';
import { listEnabledCategories, listPublishedPosts, mapPost } from '../db';
import { THEME_PRESETS } from '../theme/presets';

const router = new Hono();
const DEFAULT_PRESET_ID = 'minimal-clean';

function getBucket(c: any) {
  const bucket = c.env?.MEDIA_BUCKET;
  if (!bucket) {
    throw new Error('MEDIA_BUCKET binding is required');
  }
  return bucket;
}

async function readThemeConfig(c: any, tenantId: string) {
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
}

function resolvePreset(presetId: string | null | undefined) {
  return THEME_PRESETS.find((preset) => preset.id === presetId) || THEME_PRESETS[0];
}

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

router.get('/build/theme', async (c) => {
  const tenant = c.get('buildTenant');
  try {
    const config = await readThemeConfig(c, tenant.id);
    const preset = resolvePreset(config.preset_id);
    return c.json({ ok: true, preset_id: preset.id, tokens: preset.tokens });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Theme load failed';
    return c.json({ ok: false, error: message }, 500);
  }
});

export default router;
