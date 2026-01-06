import type { Context, Next } from 'hono';

const ALLOWED_ORIGIN = 'https://cms.ourcompany.com';
const ALLOWED_METHODS = 'GET,POST,OPTIONS';
const ALLOWED_HEADERS = 'Content-Type,x-build-token';

export async function corsMiddleware(c: Context, next: Next) {
  const origin = c.req.header('origin');
  const isAllowedOrigin = origin === ALLOWED_ORIGIN;

  if (c.req.method === 'OPTIONS') {
    if (!isAllowedOrigin) {
      return c.json({ error: 'CORS origin not allowed' }, 403);
    }
    c.header('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
    c.header('Access-Control-Allow-Credentials', 'true');
    c.header('Access-Control-Allow-Methods', ALLOWED_METHODS);
    c.header('Access-Control-Allow-Headers', ALLOWED_HEADERS);
    c.header('Vary', 'Origin');
    return c.body(null, 204);
  }

  if (isAllowedOrigin) {
    c.header('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
    c.header('Access-Control-Allow-Credentials', 'true');
    c.header('Vary', 'Origin');
  }

  await next();
}
