import { Hono } from 'hono';
import bcrypt from 'bcryptjs';
import { getCookie } from 'hono/cookie';
import { refreshSessionCookie } from '../middleware/rbac';
import { getTenantById, getTenantBySlug, getUserByEmail, getUserById, Role, TenantRow } from '../db';
import { SessionData, verifySessionToken } from '../session';

const router = new Hono();

type AuthLogDetails = {
  errorCode?: string | null;
  setCookieWritten: boolean;
};

function getRequestId(c: Parameters<typeof getCookie>[0]): string {
  return (
    (c.get && (c.get('reqId') as string | undefined)) ||
    c.req.header('x-request-id') ||
    c.req.header('cf-ray') ||
    crypto.randomUUID()
  );
}

function logAuthResponse(c: Parameters<typeof getCookie>[0], response: Response, details: AuthLogDetails) {
  const reqId = getRequestId(c);
  const origin = c.req.header('origin') ?? 'none';
  const hasCookie = Boolean(getCookie(c, 'session'));
  const acao = response.headers.get('Access-Control-Allow-Origin');
  const acac = response.headers.get('Access-Control-Allow-Credentials');
  const payload = {
    req_id: reqId,
    method: c.req.method,
    path: new URL(c.req.url).pathname,
    origin,
    has_cookie: hasCookie,
    set_cookie_written: details.setCookieWritten,
    cors: {
      acao: Boolean(acao),
      acac: Boolean(acac),
    },
    error_code: details.errorCode ?? null,
  };
  console.log('[auth]', JSON.stringify(payload));
}

function respondWithLog(c: Parameters<typeof getCookie>[0], response: Response, details: AuthLogDetails) {
  logAuthResponse(c, response, details);
  return response;
}

router.post('/cms/auth/login', async (c) => {
  const body = await c.req.json();
  const { tenantSlug, email, password } = body;
  if (!tenantSlug || !email || !password) {
    return respondWithLog(
      c,
      c.json({ error: 'tenantSlug, email, and password are required', error_code: 'missing_credentials' }, 400),
      { errorCode: 'missing_credentials', setCookieWritten: false }
    );
  }

  const tenant = await getTenantBySlug(c.env.DB, tenantSlug);
  if (!tenant) {
    return respondWithLog(
      c,
      c.json({ error: 'Invalid credentials', error_code: 'invalid_credentials' }, 401),
      { errorCode: 'invalid_credentials', setCookieWritten: false }
    );
  }

  const user = await getUserByEmail(c.env.DB, tenant.id, email);
  if (!user) {
    return respondWithLog(
      c,
      c.json({ error: 'Invalid credentials', error_code: 'invalid_credentials' }, 401),
      { errorCode: 'invalid_credentials', setCookieWritten: false }
    );
  }

  const isValid =
    (user.password_hash?.startsWith('$2') && (await bcrypt.compare(password, user.password_hash))) ||
    user.password_hash === password;
  if (!isValid) {
    return respondWithLog(
      c,
      c.json({ error: 'Invalid credentials', error_code: 'invalid_credentials' }, 401),
      { errorCode: 'invalid_credentials', setCookieWritten: false }
    );
  }

  if (!c.env.SESSION_SECRET) {
    return respondWithLog(
      c,
      c.json({ error: 'SESSION_SECRET binding is required', error_code: 'missing_session_secret' }, 500),
      { errorCode: 'missing_session_secret', setCookieWritten: false }
    );
  }

  const session: SessionData = {
    userId: user.id,
    tenantId: tenant.id,
    tenantSlug: tenant.slug,
    role: user.role as Role,
    email: user.email,
  };

  await refreshSessionCookie(c as any, session);

  const response = c.json({
    user: { id: user.id, email: user.email, role: user.role },
    tenant: { id: tenant.id, slug: tenant.slug, name: tenant.name },
  });
  const setCookieWritten = Boolean(response.headers.get('Set-Cookie'));
  return respondWithLog(c, response, { setCookieWritten, errorCode: null });
});

router.get('/cms/auth/me', async (c) => {
  if (!c.env.SESSION_SECRET) {
    return respondWithLog(
      c,
      c.json({ error: 'SESSION_SECRET binding is required', error_code: 'missing_session_secret' }, 500),
      { errorCode: 'missing_session_secret', setCookieWritten: false }
    );
  }

  const token = getCookie(c, 'session');
  if (!token) {
    return respondWithLog(c, c.json({ error: 'Unauthorized', error_code: 'missing_session' }, 401), {
      errorCode: 'missing_session',
      setCookieWritten: false,
    });
  }

  const session = await verifySessionToken(token, c.env.SESSION_SECRET);
  if (!session) {
    return respondWithLog(c, c.json({ error: 'Invalid session', error_code: 'invalid_session' }, 401), {
      errorCode: 'invalid_session',
      setCookieWritten: false,
    });
  }

  const tenant = (await getTenantById(c.env.DB, session.tenantId)) as TenantRow | null;
  if (!tenant) {
    return respondWithLog(c, c.json({ error: 'Tenant not found', error_code: 'tenant_not_found' }, 401), {
      errorCode: 'tenant_not_found',
      setCookieWritten: false,
    });
  }

  const user = await getUserById(c.env.DB, tenant.id, session.userId);
  if (!user) {
    return respondWithLog(c, c.json({ error: 'User not found', error_code: 'user_not_found' }, 401), {
      errorCode: 'user_not_found',
      setCookieWritten: false,
    });
  }

  const response = c.json({
    user: { id: user.id, email: user.email, role: user.role },
    tenant: { id: tenant.id, slug: tenant.slug, name: tenant.name },
  });
  return respondWithLog(c, response, { setCookieWritten: false, errorCode: null });
});

export default router;
