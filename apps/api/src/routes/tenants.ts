import { Hono } from 'hono';
import { sessionMiddleware } from '../middleware/rbac';
import { createTenant, listTenants, updateTenant } from '../db';
import { SessionData } from '../session';
import { isSuperAdmin } from '../super_admin';

const router = new Hono();

router.use('/cms/tenants/*', sessionMiddleware);
router.use('/cms/tenants', sessionMiddleware);

router.get('/cms/tenants', async (c) => {
  const session = c.get('session') as SessionData;
  if (!isSuperAdmin(session, c.env)) {
    return c.json({ ok: false, error: 'forbidden' }, 403);
  }
  const tenants = await listTenants(c.env.DB);
  return c.json({ tenants });
});

router.post('/cms/tenants', async (c) => {
  const session = c.get('session') as SessionData;
  if (!isSuperAdmin(session, c.env)) {
    return c.json({ ok: false, error: 'forbidden' }, 403);
  }
  const body = await c.req.json();
  const { slug, name, primary_domain, pages_project_name, pages_deploy_hook_url, build_token } = body;
  if (!slug || !name || !primary_domain || !build_token) {
    return c.json({ ok: false, error: 'slug, name, primary_domain, build_token are required' }, 400);
  }
  const tenant = await createTenant(c.env.DB, {
    slug,
    name,
    primary_domain,
    pages_project_name: pages_project_name ?? null,
    pages_deploy_hook_url: pages_deploy_hook_url ?? null,
    build_token,
  });
  return c.json({ tenant }, 201);
});

router.patch('/cms/tenants/:id', async (c) => {
  const session = c.get('session') as SessionData;
  if (!isSuperAdmin(session, c.env)) {
    return c.json({ ok: false, error: 'forbidden' }, 403);
  }
  const id = c.req.param('id');
  const body = await c.req.json();
  const { slug, name, primary_domain, pages_project_name, pages_deploy_hook_url, build_token } = body;
  const tenant = await updateTenant(c.env.DB, id, {
    slug,
    name,
    primary_domain,
    pages_project_name,
    pages_deploy_hook_url,
    build_token,
  });
  return c.json({ tenant });
});

router.post('/cms/tenants/:id/rotate-build-token', async (c) => {
  const session = c.get('session') as SessionData;
  if (!isSuperAdmin(session, c.env)) {
    return c.json({ ok: false, error: 'forbidden' }, 403);
  }
  const id = c.req.param('id');
  const newToken = crypto.randomUUID();
  const tenant = await updateTenant(c.env.DB, id, { build_token: newToken });
  return c.json({ tenant, build_token: newToken });
});

export default router;
