import type { Context, Next } from 'hono';

const ALLOWED_ORIGINS = ['https://cms.ourcompany.com', 'https://endpr.pages.dev'];
const ALLOWED_METHODS = 'GET,POST,OPTIONS';
const ALLOWED_HEADERS = 'content-type';
const AUTH_PATHS = new Set(['/cms/auth/login', '/cms/auth/me']);

function isAllowed(origin: string | undefined): origin is string {
  return !!origin && ALLOWED_ORIGINS.includes(origin);
}

export async function corsMiddleware(c: Context, next: Next) {
  const origin = c.req.header('origin');
  const path = new URL(c.req.url).pathname;
  const isAuthPath = AUTH_PATHS.has(path);
  const reqId = c.req.header('x-request-id') || c.req.header('cf-ray') || crypto.randomUUID();
  (c as any).set('reqId', reqId);
  const isAllowedOrigin = isAllowed(origin);

  if (c.req.method === 'OPTIONS') {
    console.log(`[cors] origin=${origin ?? 'none'} allowed=${isAllowedOrigin}`);
    if (!isAllowedOrigin) {
      const response = c.json(
        isAuthPath ? { error: 'CORS origin not allowed', error_code: 'cors_not_allowed' } : { error: 'CORS origin not allowed' },
        403
      );
      if (isAuthPath) {
        console.log(
          '[auth]',
          JSON.stringify({
            req_id: reqId,
            method: c.req.method,
            path,
            origin: origin ?? 'none',
            has_cookie: Boolean(c.req.header('cookie')),
            set_cookie_written: false,
            cors: {
              acao: Boolean(response.headers.get('Access-Control-Allow-Origin')),
              acac: Boolean(response.headers.get('Access-Control-Allow-Credentials')),
            },
            error_code: 'cors_not_allowed',
          })
        );
      }
      return response;
    }
    c.header('Access-Control-Allow-Origin', origin);
    c.header('Access-Control-Allow-Credentials', 'true');
    c.header('Access-Control-Allow-Methods', ALLOWED_METHODS);
    c.header('Access-Control-Allow-Headers', ALLOWED_HEADERS);
    c.header('Vary', 'Origin');
    const response = c.body(null, 204);
    if (isAuthPath) {
      console.log(
        '[auth]',
        JSON.stringify({
          req_id: reqId,
          method: c.req.method,
          path,
          origin: origin ?? 'none',
          has_cookie: Boolean(c.req.header('cookie')),
          set_cookie_written: false,
          cors: {
            acao: Boolean(response.headers.get('Access-Control-Allow-Origin')),
            acac: Boolean(response.headers.get('Access-Control-Allow-Credentials')),
          },
          error_code: null,
        })
      );
    }
    return response;
  }

  if (isAllowedOrigin) {
    c.header('Access-Control-Allow-Origin', origin);
    c.header('Access-Control-Allow-Credentials', 'true');
    c.header('Vary', 'Origin');
  }

  await next();
}
