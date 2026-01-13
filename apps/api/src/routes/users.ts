import { Hono } from 'hono';
import bcrypt from 'bcryptjs';
import { sessionMiddleware } from '../middleware/rbac';
import { createUser, listUsersByTenant, updateUser } from '../db';
import { SessionData } from '../session';
import { isSuperAdmin } from '../super_admin';

const router = new Hono();

router.use('/cms/users/*', sessionMiddleware);
router.use('/cms/users', sessionMiddleware);

router.get('/cms/users', async (c) => {
  const session = c.get('session') as SessionData;
  if (!isSuperAdmin(session, c.env)) {
    return c.json({ ok: false, error: 'forbidden' }, 403);
  }
  const tenantId = c.req.query('tenant_id');
  if (!tenantId) {
    return c.json({ ok: false, error: 'tenant_id is required' }, 400);
  }
  const users = await listUsersByTenant(c.env.DB, tenantId);
  return c.json({ users: users.map((user) => ({ id: user.id, tenant_id: user.tenant_id, email: user.email, role: user.role })) });
});

router.post('/cms/users', async (c) => {
  const session = c.get('session') as SessionData;
  if (!isSuperAdmin(session, c.env)) {
    return c.json({ ok: false, error: 'forbidden' }, 403);
  }
  const body = await c.req.json();
  const { tenant_id, email, password, role } = body;
  if (!tenant_id || !email || !password || !role) {
    return c.json({ ok: false, error: 'tenant_id, email, password, role are required' }, 400);
  }
  const hashed = await bcrypt.hash(password, 10);
  const user = await createUser(c.env.DB, tenant_id, { email, password_hash: hashed, role });
  return c.json({ user: { id: user.id, tenant_id: user.tenant_id, email: user.email, role: user.role } }, 201);
});

router.patch('/cms/users/:id', async (c) => {
  const session = c.get('session') as SessionData;
  if (!isSuperAdmin(session, c.env)) {
    return c.json({ ok: false, error: 'forbidden' }, 403);
  }
  const id = c.req.param('id');
  const body = await c.req.json();
  const { tenant_id, email, password, role } = body;
  if (!tenant_id) {
    return c.json({ ok: false, error: 'tenant_id is required' }, 400);
  }
  const updates = {
    email,
    role,
    password_hash: password ? await bcrypt.hash(password, 10) : undefined,
  };
  const user = await updateUser(c.env.DB, tenant_id, id, updates);
  return c.json({ user: { id: user.id, tenant_id: user.tenant_id, email: user.email, role: user.role } });
});

export default router;
