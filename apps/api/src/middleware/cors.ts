import type { Context, Next } from 'hono';

const ALLOWED_ORIGINS = ['https://cms.ourcompany.com', 'https://endpr.pages.dev'];
const ALLOWED_METHODS = 'GET,POST,PUT,PATCH,DELETE,OPTIONS';
const ALLOWED_HEADERS = 'content-type';

function isAllowed(origin: string | undefined): origin is string {
  return !!origin && ALLOWED_ORIGINS.includes(origin);
}

export async function corsMiddleware(c: Context, next: Next) {
  const origin = c.req.header('origin');
  const isAllowedOrigin = isAllowed(origin);

  if (c.req.method === 'OPTIONS') {
    console.log(`[cors] origin=${origin ?? 'none'} allowed=${isAllowedOrigin}`);
    if (!isAllowedOrigin) {
      return c.json({ error: 'CORS origin not allowed' }, 403);
    }
    c.header('Access-Control-Allow-Origin', origin);
    c.header('Access-Control-Allow-Credentials', 'true');
    c.header('Access-Control-Allow-Methods', ALLOWED_METHODS);
    c.header('Access-Control-Allow-Headers', ALLOWED_HEADERS);
    c.header('Vary', 'Origin');
    return c.body(null, 204);
  }

  if (isAllowedOrigin) {
    c.header('Access-Control-Allow-Origin', origin);
    c.header('Access-Control-Allow-Credentials', 'true');
    c.header('Vary', 'Origin');
  }

  await next();
}
