import { getCookie } from 'hono/cookie';
import type { Context, Next } from 'hono';
import { createSessionToken, SessionData, verifySessionToken } from '../session';
import { getTenantByBuildToken, getTenantById, Role, TenantRow } from '../db';

const SESSION_COOKIE = 'session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export type EnvBindings = {
  DB: D1Database;
  SESSION_SECRET: string;
};

export type Ctx = Context<{ Bindings: EnvBindings; Variables: { session: SessionData; tenant: TenantRow; buildTenant: TenantRow } }>;

function ensureSessionSecret(env: EnvBindings) {
  if (!env.SESSION_SECRET) {
    throw new Error('SESSION_SECRET binding is required');
  }
}

export const sessionMiddleware = async (c: Ctx, next: Next) => {
  ensureSessionSecret(c.env);
  const token = getCookie(c, SESSION_COOKIE);
  if (!token) return c.json({ error: 'Unauthorized' }, 401);

  const payload = await verifySessionToken(token, c.env.SESSION_SECRET);
  if (!payload) return c.json({ error: 'Invalid session' }, 401);

  const tenant = await getTenantById(c.env.DB, payload.tenantId);
  if (!tenant) return c.json({ error: 'Tenant not found' }, 401);

  c.set('session', payload);
  c.set('tenant', tenant);
  await next();
};

export const buildTokenMiddleware = async (c: Ctx, next: Next) => {
  const token = c.req.header('x-build-token');
  if (!token) return c.json({ error: 'Missing x-build-token' }, 401);
  const tenant = await getTenantByBuildToken(c.env.DB, token);
  if (!tenant) return c.json({ error: 'Invalid build token' }, 401);
  c.set('buildTenant', tenant);
  await next();
};

export function requireRole(session: SessionData | undefined, roles: Role[]): boolean {
  if (!session) return false;
  return roles.includes(session.role);
}

export async function refreshSessionCookie(c: Ctx, session: SessionData) {
  ensureSessionSecret(c.env);
  const token = await createSessionToken(session, c.env.SESSION_SECRET);
  c.header(
    'Set-Cookie',
    `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=${SESSION_MAX_AGE}`
  );
}
