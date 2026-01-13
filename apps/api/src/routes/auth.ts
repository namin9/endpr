import { Hono } from 'hono';
import bcrypt from 'bcryptjs';
import { clearSessionCookie, refreshSessionCookie, sessionMiddleware } from '../middleware/rbac';
import { getTenantBySlug, getUserByEmail, getUserById, Role, TenantRow } from '../db';
import { SessionData } from '../session';
import { v4 as uuidv4 } from 'uuid';

const router = new Hono();
const DEFAULT_MAX_LOGIN_ATTEMPTS = 5;
const DEFAULT_ATTEMPT_WINDOW_SECONDS = 10 * 60;
const DEFAULT_LOCKOUT_SECONDS = 15 * 60;
const DEFAULT_PASSWORD_RESET_TTL_SECONDS = 60 * 60;

function readNumberEnv(value: string | undefined, fallback: number) {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getAuthRateLimitConfig(env: Record<string, any>) {
  return {
    maxAttempts: readNumberEnv(env.RATE_LIMIT_MAX_ATTEMPTS, DEFAULT_MAX_LOGIN_ATTEMPTS),
    attemptWindowSeconds: readNumberEnv(env.RATE_LIMIT_WINDOW_SECONDS, DEFAULT_ATTEMPT_WINDOW_SECONDS),
    lockoutSeconds: readNumberEnv(env.RATE_LIMIT_LOCKOUT_SECONDS, DEFAULT_LOCKOUT_SECONDS),
    passwordResetTtlSeconds: readNumberEnv(env.PASSWORD_RESET_TTL_SECONDS, DEFAULT_PASSWORD_RESET_TTL_SECONDS),
  };
}

function getClientIp(c: any) {
  return (
    c.req.header('cf-connecting-ip') ||
    c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  );
}

async function ensureAuthTables(c: any): Promise<boolean> {
  try {
    await c.env.DB.prepare('SELECT 1 FROM auth_login_attempts LIMIT 1').run();
    await c.env.DB.prepare('SELECT 1 FROM auth_audit_logs LIMIT 1').run();
    return true;
  } catch (error) {
    console.error('Auth tables missing or unavailable.', error);
    return false;
  }
}

async function logAuthEvent(c: any, payload: { tenantId?: string | null; email?: string | null; ip?: string; action: string; success: boolean; message?: string | null }) {
  const now = Math.floor(Date.now() / 1000);
  await c.env.DB.prepare(
    `INSERT INTO auth_audit_logs (id, tenant_id, email, ip, action, success, message, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      uuidv4(),
      payload.tenantId ?? null,
      payload.email ?? null,
      payload.ip ?? null,
      payload.action,
      payload.success ? 1 : 0,
      payload.message ?? null,
      now
    )
    .run();
}

async function recordLoginAttempt(c: any, payload: { tenantId?: string | null; email: string; ip: string; success: boolean }) {
  const { maxAttempts, attemptWindowSeconds, lockoutSeconds } = getAuthRateLimitConfig(c.env || {});
  const now = Math.floor(Date.now() / 1000);
  const existing = await c.env.DB.prepare(
    `SELECT id, attempts, first_attempt_at, last_attempt_at, locked_until
     FROM auth_login_attempts
     WHERE tenant_id IS ? AND email = ? AND ip = ?
     LIMIT 1`
  )
    .bind(payload.tenantId ?? null, payload.email, payload.ip)
    .first<any>();

  if (payload.success) {
    if (existing) {
      await c.env.DB.prepare('DELETE FROM auth_login_attempts WHERE id = ?').bind(existing.id).run();
    }
    return { locked: false, attempts: 0 };
  }

  const withinWindow = existing && now - existing.first_attempt_at <= attemptWindowSeconds;
  const attempts = existing && withinWindow ? existing.attempts + 1 : 1;
  const firstAttemptAt = existing && withinWindow ? existing.first_attempt_at : now;
  const lockedUntil = attempts >= maxAttempts ? now + lockoutSeconds : null;

  if (existing) {
    await c.env.DB.prepare(
      `UPDATE auth_login_attempts
       SET attempts = ?, first_attempt_at = ?, last_attempt_at = ?, locked_until = ?
       WHERE id = ?`
    )
      .bind(attempts, firstAttemptAt, now, lockedUntil, existing.id)
      .run();
  } else {
    await c.env.DB.prepare(
      `INSERT INTO auth_login_attempts (id, tenant_id, email, ip, attempts, first_attempt_at, last_attempt_at, locked_until)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(uuidv4(), payload.tenantId ?? null, payload.email, payload.ip, attempts, firstAttemptAt, now, lockedUntil)
      .run();
  }

  return { locked: Boolean(lockedUntil), attempts };
}

async function ensureLoginAllowed(c: any, payload: { tenantId?: string | null; email: string; ip: string }) {
  const { attemptWindowSeconds } = getAuthRateLimitConfig(c.env || {});
  const now = Math.floor(Date.now() / 1000);
  const existing = await c.env.DB.prepare(
    `SELECT locked_until, attempts, first_attempt_at
     FROM auth_login_attempts
     WHERE tenant_id IS ? AND email = ? AND ip = ?
     LIMIT 1`
  )
    .bind(payload.tenantId ?? null, payload.email, payload.ip)
    .first<any>();
  if (existing?.locked_until && existing.locked_until > now) {
    return { allowed: false, retryAfter: existing.locked_until - now };
  }
  if (existing && now - existing.first_attempt_at > attemptWindowSeconds) {
    await c.env.DB.prepare('DELETE FROM auth_login_attempts WHERE tenant_id IS ? AND email = ? AND ip = ?')
      .bind(payload.tenantId ?? null, payload.email, payload.ip)
      .run();
  }
  return { allowed: true, retryAfter: 0 };
}

router.post('/cms/auth/login', async (c) => {
  const body = await c.req.json();
  const { tenantSlug, email, password } = body;
  if (!tenantSlug || !email || !password) return c.json({ error: 'tenantSlug, email, and password are required' }, 400);

  const authTablesReady = await ensureAuthTables(c);
  if (!authTablesReady) {
    return c.json({ error: 'Server misconfigured: auth tables missing' }, 500);
  }

  const tenant = await getTenantBySlug(c.env.DB, tenantSlug);
  const ip = getClientIp(c);

  const preflight = await ensureLoginAllowed(c, { tenantId: tenant?.id ?? null, email, ip });
  if (!preflight.allowed) {
    await logAuthEvent(c, { tenantId: tenant?.id ?? null, email, ip, action: 'login', success: false, message: 'rate_limited' });
    return c.json({ error: 'Too many login attempts. Please retry later.' }, 429);
  }

  if (!tenant) {
    await recordLoginAttempt(c, { tenantId: null, email, ip, success: false });
    await logAuthEvent(c, { tenantId: null, email, ip, action: 'login', success: false, message: 'tenant_not_found' });
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  const user = await getUserByEmail(c.env.DB, tenant.id, email);
  if (!user) {
    await recordLoginAttempt(c, { tenantId: tenant.id, email, ip, success: false });
    await logAuthEvent(c, { tenantId: tenant.id, email, ip, action: 'login', success: false, message: 'user_not_found' });
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  if (!user.password_hash?.startsWith('$2')) {
    console.warn('Rejected login due to invalid password hash format.');
    await recordLoginAttempt(c, { tenantId: tenant.id, email, ip, success: false });
    await logAuthEvent(c, { tenantId: tenant.id, email, ip, action: 'login', success: false, message: 'invalid_hash_format' });
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    const result = await recordLoginAttempt(c, { tenantId: tenant.id, email, ip, success: false });
    await logAuthEvent(c, { tenantId: tenant.id, email, ip, action: 'login', success: false, message: 'invalid_password' });
    if (result.locked) {
      return c.json({ error: 'Too many login attempts. Please retry later.' }, 429);
    }
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  const session: SessionData = {
    userId: user.id,
    tenantId: tenant.id,
    tenantSlug: tenant.slug,
    role: user.role as Role,
    email: user.email,
  };

  const sessionIssued = await refreshSessionCookie(c as any, session);
  if (!sessionIssued) {
    await logAuthEvent(c, { tenantId: tenant.id, email, ip, action: 'login', success: false, message: 'session_secret_missing' });
    return c.json({ error: 'Server misconfigured: SESSION_SECRET missing' }, 500);
  }
  await recordLoginAttempt(c, { tenantId: tenant.id, email, ip, success: true });
  await logAuthEvent(c, { tenantId: tenant.id, email, ip, action: 'login', success: true, message: 'ok' });

  return c.json({ user: { id: user.id, email: user.email, role: user.role }, tenant: { id: tenant.id, slug: tenant.slug, name: tenant.name } });
});

router.get('/cms/auth/me', sessionMiddleware, async (c) => {
  const session = c.get('session') as SessionData;
  const tenant = c.get('tenant') as TenantRow;
  const user = await getUserById(c.env.DB, tenant.id, session.userId);
  if (!user) return c.json({ error: 'User not found' }, 401);
  return c.json({ user: { id: user.id, email: user.email, role: user.role }, tenant: { id: tenant.id, slug: tenant.slug, name: tenant.name } });
});

router.post('/cms/auth/logout', sessionMiddleware, async (c) => {
  clearSessionCookie(c as any);
  await logAuthEvent(c, { tenantId: (c.get('tenant') as TenantRow)?.id ?? null, email: (c.get('session') as SessionData)?.email ?? null, ip: getClientIp(c), action: 'logout', success: true, message: 'ok' });
  return c.json({ ok: true });
});

router.post('/cms/auth/password', sessionMiddleware, async (c) => {
  const session = c.get('session') as SessionData;
  const tenant = c.get('tenant') as TenantRow;
  const body = await c.req.json();
  const { current_password, new_password } = body || {};
  if (!current_password || !new_password) {
    return c.json({ error: 'current_password and new_password are required' }, 400);
  }
  const user = await getUserById(c.env.DB, tenant.id, session.userId);
  if (!user) return c.json({ error: 'User not found' }, 404);
  const isValid = await bcrypt.compare(current_password, user.password_hash);
  if (!isValid) {
    await logAuthEvent(c, { tenantId: tenant.id, email: user.email, ip: getClientIp(c), action: 'password_change', success: false, message: 'invalid_current_password' });
    return c.json({ error: 'Invalid credentials' }, 401);
  }
  const hashed = await bcrypt.hash(new_password, 10);
  await c.env.DB.prepare('UPDATE users SET password_hash = ? WHERE id = ? AND tenant_id = ?')
    .bind(hashed, user.id, tenant.id)
    .run();
  await logAuthEvent(c, { tenantId: tenant.id, email: user.email, ip: getClientIp(c), action: 'password_change', success: true, message: 'ok' });
  return c.json({ ok: true });
});

router.post('/cms/auth/password-reset', async (c) => {
  const body = await c.req.json();
  const { token, new_password } = body || {};
  if (!token || !new_password) {
    return c.json({ error: 'token and new_password are required' }, 400);
  }
  const now = Math.floor(Date.now() / 1000);
  const reset = await c.env.DB.prepare(
    `SELECT id, tenant_id, user_id, expires_at FROM auth_password_resets WHERE token = ? LIMIT 1`
  )
    .bind(token)
    .first<any>();
  if (!reset || reset.expires_at < now) {
    if (reset?.id) {
      await c.env.DB.prepare('DELETE FROM auth_password_resets WHERE id = ?').bind(reset.id).run();
    }
    return c.json({ error: 'Invalid or expired token' }, 410);
  }
  const user = await getUserById(c.env.DB, reset.tenant_id, reset.user_id);
  if (!user) {
    await c.env.DB.prepare('DELETE FROM auth_password_resets WHERE id = ?').bind(reset.id).run();
    return c.json({ error: 'User not found' }, 404);
  }
  const hashed = await bcrypt.hash(new_password, 10);
  await c.env.DB.prepare('UPDATE users SET password_hash = ? WHERE id = ? AND tenant_id = ?')
    .bind(hashed, user.id, reset.tenant_id)
    .run();
  await c.env.DB.prepare('DELETE FROM auth_password_resets WHERE id = ?').bind(reset.id).run();
  await logAuthEvent(c, { tenantId: reset.tenant_id, email: user.email, ip: getClientIp(c), action: 'password_reset', success: true, message: 'ok' });
  return c.json({ ok: true });
});

export default router;
