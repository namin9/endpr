import { Hono } from 'hono';
import bcrypt from 'bcryptjs';
import { refreshSessionCookie, sessionMiddleware } from '../middleware/rbac';
import { getTenantBySlug, getUserByEmail, getUserById, Role, TenantRow } from '../db';
import { SessionData } from '../session';

const router = new Hono();

router.post('/cms/auth/login', async (c) => {
  const body = await c.req.json();
  const { tenantSlug, email, password } = body;
  if (!tenantSlug || !email || !password) return c.json({ error: 'tenantSlug, email, and password are required' }, 400);

  const tenant = await getTenantBySlug(c.env.DB, tenantSlug);
  if (!tenant) return c.json({ error: 'Invalid credentials' }, 401);

  const user = await getUserByEmail(c.env.DB, tenant.id, email);
  if (!user) return c.json({ error: 'Invalid credentials' }, 401);

  const isValid =
    (user.password_hash?.startsWith('$2') && (await bcrypt.compare(password, user.password_hash))) ||
    user.password_hash === password;
  if (!isValid) return c.json({ error: 'Invalid credentials' }, 401);

  const session: SessionData = {
    userId: user.id,
    tenantId: tenant.id,
    tenantSlug: tenant.slug,
    role: user.role as Role,
    email: user.email,
  };

  await refreshSessionCookie(c as any, session);

  return c.json({ user: { id: user.id, email: user.email, role: user.role }, tenant: { id: tenant.id, slug: tenant.slug, name: tenant.name } });
});

router.get('/cms/auth/me', sessionMiddleware, async (c) => {
  const session = c.get('session') as SessionData;
  const tenant = c.get('tenant') as TenantRow;
  const user = await getUserById(c.env.DB, tenant.id, session.userId);
  if (!user) return c.json({ error: 'User not found' }, 401);
  return c.json({ user: { id: user.id, email: user.email, role: user.role }, tenant: { id: tenant.id, slug: tenant.slug, name: tenant.name } });
});

export default router;
