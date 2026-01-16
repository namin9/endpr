import { getCookie } from 'hono/cookie';
import type { Context, Next } from 'hono';
import { createSessionToken, SessionData, verifySessionToken } from '../session';
import { getTenantByBuildToken, getTenantById, Role, TenantRow } from '../db';

const SESSION_COOKIE = 'session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days
const TENANT_OVERRIDE_HEADER = 'x-tenant-id';

export type EnvBindings = {
  DB: D1Database;
  SESSION_SECRET: string;
};

export type Ctx = Context<{ Bindings: EnvBindings; Variables: { session: SessionData; tenant: TenantRow; buildTenant: TenantRow } }>;

function getSessionSecret(env: EnvBindings): string | null {
  return env.SESSION_SECRET || null;
}

export const sessionMiddleware = async (c: Ctx, next: Next) => {
  if (c.req.method === 'OPTIONS') {
    await next();
    return;
  }
  const sessionSecret = getSessionSecret(c.env);
  if (!sessionSecret) {
    return c.json({ error: 'Server misconfigured: SESSION_SECRET missing' }, 500);
  }
  const token = getCookie(c, SESSION_COOKIE);
  if (!token) return c.json({ error: 'Unauthorized' }, 401);

  const payload = await verifySessionToken(token, sessionSecret);
  if (!payload) return c.json({ error: 'Invalid session' }, 401);

  const overrideTenantId = payload.role === 'super_admin' ? c.req.header(TENANT_OVERRIDE_HEADER) : null;
  const tenantId = overrideTenantId || payload.tenantId;
  const tenant = await getTenantById(c.env.DB, tenantId);
  if (!tenant) return c.json({ error: 'Tenant not found' }, 401);

  c.set('session', payload);
  c.set('tenant', tenant);
  await next();
};

export const buildTokenMiddleware = async (c: Ctx, next: Next) => {
  if (c.req.method === 'OPTIONS') {
    await next();
    return;
  }
  const token = c.req.header('x-build-token');
  if (!token) return c.json({ error: 'Missing x-build-token' }, 401);
  const tenant = await getTenantByBuildToken(c.env.DB, token);
  if (!tenant) return c.json({ error: 'Invalid build token' }, 401);
  c.set('buildTenant', tenant);
  await next();
};

export function hasRole(session: SessionData | undefined, roles: Role[]): boolean {
  if (!session) return false;
  return roles.includes(session.role);
}

export const requireRole = (roles: Role[]) => {
  return async (c: Ctx, next: Next) => {
    if (c.req.method === 'OPTIONS') {
      await next();
      return;
    }
    const session = c.get('session') as SessionData | undefined;
    if (!hasRole(session, roles)) {
      return c.json({ error: 'Forbidden' }, 403);
    }
    await next();
  };
};

export async function refreshSessionCookie(c: Ctx, session: SessionData): Promise<boolean> {
  const sessionSecret = getSessionSecret(c.env);
  if (!sessionSecret) {
    console.error('SESSION_SECRET binding is required to issue session cookies.');
    return false;
  }
  const token = await createSessionToken(session, sessionSecret);
  c.header(
    'Set-Cookie',
    `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=None; Secure; Max-Age=${SESSION_MAX_AGE}`
  );
  return true;
}

export function clearSessionCookie(c: Ctx) {
  c.header('Set-Cookie', `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=None; Secure; Max-Age=0`);
}
