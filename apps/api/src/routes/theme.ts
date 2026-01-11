import { Hono } from 'hono';
import { sessionMiddleware } from '../middleware/rbac';
import { SessionData } from '../session';
import { createDeployJob, mapDeployJob, updateDeployJobStatus } from '../db';
import { THEME_PRESETS } from '../theme/presets';

const router = new Hono();
const DEFAULT_PRESET_ID = 'minimal-clean';

type ThemeConfig = {
  preset_id: string;
  updated_at: number;
};

function getBucket(c: any) {
  const bucket = c.env?.MEDIA_BUCKET;
  if (!bucket) {
    throw new Error('MEDIA_BUCKET binding is required');
  }
  return bucket;
}

function getThemeKey(tenantId: string) {
  return `tenants/${tenantId}/theme.json`;
}

function resolvePreset(presetId: string | null | undefined) {
  return THEME_PRESETS.find((preset) => preset.id === presetId) || THEME_PRESETS[0];
}

async function readThemeConfig(c: any, tenantId: string): Promise<ThemeConfig> {
  const bucket = getBucket(c);
  const object = await bucket.get(getThemeKey(tenantId));
  if (!object) {
    return { preset_id: DEFAULT_PRESET_ID, updated_at: Date.now() };
  }
  const text = await object.text();
  try {
    const parsed = JSON.parse(text) as ThemeConfig;
    const preset = resolvePreset(parsed?.preset_id || DEFAULT_PRESET_ID);
    return {
      preset_id: preset.id,
      updated_at: parsed?.updated_at || Date.now(),
    };
  } catch {
    return { preset_id: DEFAULT_PRESET_ID, updated_at: Date.now() };
  }
}

async function writeThemeConfig(c: any, tenantId: string, presetId: string) {
  const bucket = getBucket(c);
  const payload: ThemeConfig = {
    preset_id: presetId,
    updated_at: Date.now(),
  };
  await bucket.put(getThemeKey(tenantId), JSON.stringify(payload), {
    httpMetadata: { contentType: 'application/json' },
  });
  return payload;
}

function parseSuperAdminEmails(raw: string | undefined) {
  if (!raw) return [];
  return raw
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function isSuperAdmin(session: SessionData | undefined, env: any) {
  if (session?.role) {
    return session.role === 'super';
  }
  const allowlist = parseSuperAdminEmails(env?.SUPER_ADMIN_EMAILS);
  if (!allowlist.length) return false;
  return allowlist.includes(session?.email?.toLowerCase() || '');
}

router.use('/cms/theme/*', sessionMiddleware);
router.use('/cms/theme', sessionMiddleware);

router.get('/cms/theme', async (c) => {
  const tenant = c.get('tenant');
  const config = await readThemeConfig(c, tenant.id);
  return c.json({ ok: true, preset_id: config.preset_id, updated_at: config.updated_at });
});

router.get('/cms/theme/presets', async (c) => {
  const presets = THEME_PRESETS.map((preset) => ({
    id: preset.id,
    name: preset.name,
    swatch: {
      bg: preset.tokens.light['--bg'],
      primary: preset.tokens.light['--primary'],
    },
  }));
  return c.json({ ok: true, presets });
});

router.get('/cms/theme/tokens', async (c) => {
  const tenant = c.get('tenant');
  const config = await readThemeConfig(c, tenant.id);
  const preset = resolvePreset(config.preset_id);
  return c.json({ ok: true, preset_id: preset.id, tokens: preset.tokens });
});

router.put('/cms/theme', async (c) => {
  const tenant = c.get('tenant');
  const session = c.get('session') as SessionData;
  if (!isSuperAdmin(session, c.env)) {
    return c.json({ ok: false, error: 'forbidden' }, 403);
  }
  const body = await c.req.json();
  const presetId = body?.preset_id;
  const preset = resolvePreset(presetId);
  if (!preset || preset.id !== presetId) {
    return c.json({ ok: false, error: 'invalid preset_id' }, 400);
  }

  const config = await writeThemeConfig(c, tenant.id, presetId);

  const job = await createDeployJob(c.env.DB, tenant.id, session.userId, 'queued', 'Theme change requested');
  const buildingJob = await updateDeployJobStatus(c.env.DB, job.id, 'building', 'Deploy hook triggered');

  let status: 'building' | 'success' | 'failed' = 'building';
  let message: string | null = 'Deploy hook triggered';

  if (!tenant?.pages_deploy_hook_url) {
    status = 'failed';
    message = 'pages_deploy_hook_url not configured';
  } else {
    try {
      const resp = await fetch(tenant.pages_deploy_hook_url, { method: 'POST' });
      if (!resp.ok) {
        status = 'failed';
        message = `Deploy hook failed with status ${resp.status}`;
      } else {
        status = 'success';
        message = 'Deploy hook accepted';
      }
    } catch (error) {
      status = 'failed';
      message = 'Deploy hook request errored';
      console.error('Deploy hook error', error);
    }
  }

  const finalJob = await updateDeployJobStatus(c.env.DB, buildingJob.id, status, message);

  return c.json({
    ok: true,
    preset_id: config.preset_id,
    updated_at: config.updated_at,
    deploy_job: mapDeployJob(finalJob),
  });
});

export default router;
