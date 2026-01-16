import { Hono } from 'hono';
import bcrypt from 'bcryptjs';
import { hasRole, sessionMiddleware } from '../middleware/rbac';
import { createUser, getUserById, listUsersByTenant, updateUser } from '../db';
import { v4 as uuidv4 } from 'uuid';
import { SessionData } from '../session';

const router = new Hono();

router.use('/cms/users/*', sessionMiddleware);
router.use('/cms/users', sessionMiddleware);

router.get('/cms/users', async (c) => {
  const session = c.get('session') as SessionData;
  if (!hasRole(session, ['tenant_admin', 'super_admin'])) {
    return c.json({ ok: false, error: 'forbidden' }, 403);
  }
  const requestedTenantId = c.req.query('tenant_id');
  const tenant = c.get('tenant');
  if (session.role !== 'super_admin' && requestedTenantId && requestedTenantId !== tenant.id) {
    return c.json({ ok: false, error: 'forbidden' }, 403);
  }
  const tenantId = session.role === 'super_admin' ? requestedTenantId : tenant.id;
  if (!tenantId) {
    return c.json({ ok: false, error: 'tenant_id is required' }, 400);
  }
  const users = await listUsersByTenant(c.env.DB, tenantId);
  return c.json({ users: users.map((user) => ({ id: user.id, tenant_id: user.tenant_id, email: user.email, role: user.role })) });
});

router.post('/cms/users', async (c) => {
  const session = c.get('session') as SessionData;
  if (!hasRole(session, ['tenant_admin', 'super_admin'])) {
    return c.json({ ok: false, error: 'forbidden' }, 403);
  }
  const body = await c.req.json();
  const { tenant_id, email, password, role } = body;
  const tenant = c.get('tenant');
  if (session.role !== 'super_admin' && tenant_id && tenant_id !== tenant.id) {
    return c.json({ ok: false, error: 'forbidden' }, 403);
  }
  const tenantId = session.role === 'super_admin' ? tenant_id : tenant.id;
  if (!tenantId || !email || !password || !role) {
    return c.json({ ok: false, error: 'tenant_id, email, password, role are required' }, 400);
  }
  const hashed = await bcrypt.hash(password, 10);
  const user = await createUser(c.env.DB, tenantId, { email, password_hash: hashed, role });
  return c.json({ user: { id: user.id, tenant_id: user.tenant_id, email: user.email, role: user.role } }, 201);
});

router.patch('/cms/users/:id', async (c) => {
  const session = c.get('session') as SessionData;
  if (!hasRole(session, ['tenant_admin', 'super_admin'])) {
    return c.json({ ok: false, error: 'forbidden' }, 403);
  }
  const id = c.req.param('id');
  const body = await c.req.json();
  const { tenant_id, email, password, role } = body;
  const tenant = c.get('tenant');
  if (session.role !== 'super_admin' && tenant_id && tenant_id !== tenant.id) {
    return c.json({ ok: false, error: 'forbidden' }, 403);
  }
  const tenantId = session.role === 'super_admin' ? tenant_id : tenant.id;
  if (!tenantId) {
    return c.json({ ok: false, error: 'tenant_id is required' }, 400);
  }
  const updates = {
    email,
    role,
    password_hash: password ? await bcrypt.hash(password, 10) : undefined,
  };
  const user = await updateUser(c.env.DB, tenantId, id, updates);
  return c.json({ user: { id: user.id, tenant_id: user.tenant_id, email: user.email, role: user.role } });
});

router.post('/cms/users/:id/password', async (c) => {
  const session = c.get('session') as SessionData;
  if (!hasRole(session, ['tenant_admin', 'super_admin'])) {
    return c.json({ ok: false, error: 'forbidden' }, 403);
  }
  const id = c.req.param('id');
  const body = await c.req.json();
  const { tenant_id, password } = body || {};
  const tenant = c.get('tenant');
  if (session.role !== 'super_admin' && tenant_id && tenant_id !== tenant.id) {
    return c.json({ ok: false, error: 'forbidden' }, 403);
  }
  const tenantId = session.role === 'super_admin' ? tenant_id : tenant.id;
  if (!tenantId || !password) {
    return c.json({ ok: false, error: 'tenant_id and password are required' }, 400);
  }
  const hashed = await bcrypt.hash(password, 10);
  const user = await updateUser(c.env.DB, tenantId, id, { password_hash: hashed });
  return c.json({ user: { id: user.id, tenant_id: user.tenant_id, email: user.email, role: user.role } });
});

router.post('/cms/users/:id/password-reset-link', async (c) => {
  const session = c.get('session') as SessionData;
  if (!hasRole(session, ['tenant_admin', 'super_admin'])) {
    return c.json({ ok: false, error: 'forbidden' }, 403);
  }
  const id = c.req.param('id');
  const body = await c.req.json();
  const { tenant_id, expires_in_seconds } = body || {};
  const tenant = c.get('tenant');
  if (session.role !== 'super_admin' && tenant_id && tenant_id !== tenant.id) {
    return c.json({ ok: false, error: 'forbidden' }, 403);
  }
  const tenantId = session.role === 'super_admin' ? tenant_id : tenant.id;
  if (!tenantId) {
    return c.json({ ok: false, error: 'tenant_id is required' }, 400);
  }
  const user = await getUserById(c.env.DB, tenantId, id);
  if (!user) {
    return c.json({ ok: false, error: 'user not found' }, 404);
  }
  const now = Math.floor(Date.now() / 1000);
  const ttl = Number.isFinite(expires_in_seconds) && expires_in_seconds > 0 ? expires_in_seconds : 60 * 60;
  const expiresAt = now + ttl;
  const token = uuidv4();

  await c.env.DB.prepare(
    `INSERT INTO auth_password_resets (id, tenant_id, user_id, token, expires_at)
     VALUES (?, ?, ?, ?, ?)`
  )
    .bind(uuidv4(), tenantId, id, token, expiresAt)
    .run();

  const origin = new URL(c.req.url).origin;
  const url = `${origin}/reset-password?token=${token}`;
  return c.json({ ok: true, url, expires_at: expiresAt });
});

export default router;
