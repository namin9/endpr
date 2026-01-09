import { Hono } from 'hono';
import { sessionMiddleware } from '../middleware/rbac';

type UploadEnv = {
  Bindings: {
    DB: D1Database;
    SESSION_SECRET: string;
    R2: R2Bucket;
    PUBLIC_R2_BASE_URL: string;
  };
};

const router = new Hono<UploadEnv>();

router.use('/cms/uploads', sessionMiddleware);

const UPLOAD_TOKEN_TTL_SECONDS = 10 * 60;

function normalizeExtension(fileName: string | undefined, contentType: string | undefined): string {
  const fromName = fileName?.split('.').pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]+$/.test(fromName)) return fromName;
  if (contentType?.includes('webp')) return 'webp';
  if (contentType?.includes('png')) return 'png';
  if (contentType?.includes('jpeg') || contentType?.includes('jpg')) return 'jpg';
  return 'bin';
}

function base64UrlEncode(value: string): string {
  return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlDecode(value: string): string {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  return atob(padded);
}

async function signToken(input: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(input));
  return base64UrlEncode(String.fromCharCode(...new Uint8Array(signature)));
}

async function createUploadToken(payload: { key: string; exp: number }, secret: string): Promise<string> {
  const body = base64UrlEncode(JSON.stringify(payload));
  const signature = await signToken(body, secret);
  return `${body}.${signature}`;
}

async function verifyUploadToken(token: string, secret: string): Promise<{ key: string; exp: number } | null> {
  const [body, signature] = token.split('.');
  if (!body || !signature) return null;
  const expected = await signToken(body, secret);
  if (expected !== signature) return null;
  try {
    return JSON.parse(base64UrlDecode(body)) as { key: string; exp: number };
  } catch (error) {
    console.error('Failed to parse upload token', error);
    return null;
  }
}

router.post('/cms/uploads', async (c) => {
  const tenant = c.get('tenant');
  const fallbackBaseUrl = `${new URL(c.req.url).origin}/assets`;
  const baseUrl = (c.env.PUBLIC_R2_BASE_URL || fallbackBaseUrl).replace(/\/$/, '');
  const contentType = c.req.header('content-type') ?? '';

  if (contentType.includes('application/json')) {
    const body = await c.req.json();
    const filename = typeof body?.filename === 'string' ? body.filename : 'upload.bin';
    const suppliedType = typeof body?.content_type === 'string' ? body.content_type : undefined;
    const extension = normalizeExtension(filename, suppliedType);
    const key = `${tenant.slug}/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${extension}`;
    const exp = Math.floor(Date.now() / 1000) + UPLOAD_TOKEN_TTL_SECONDS;
    const token = await createUploadToken({ key, exp }, c.env.SESSION_SECRET);
    const uploadUrl = `${new URL(c.req.url).origin}/cms/uploads/${encodeURIComponent(key)}?token=${encodeURIComponent(token)}`;
    const publicUrl = `${baseUrl}/${key}`;
    return c.json({ upload_url: uploadUrl, public_url: publicUrl, method: 'PUT' }, 201);
  }

  const formData = await c.req.formData();
  const primary = formData.get('file') ?? formData.get('image');
  let file = primary instanceof File ? primary : null;
  if (!file) {
    for (const value of formData.values()) {
      if (value instanceof File) {
        file = value;
        break;
      }
    }
  }

  if (!file) {
    return c.json({ error: 'file is required' }, 400);
  }

  const extension = normalizeExtension(file.name, file.type);
  const key = `${tenant.slug}/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${extension}`;
  const data = await file.arrayBuffer();

  await c.env.R2.put(key, data, {
    httpMetadata: {
      contentType: file.type || 'application/octet-stream',
    },
  });

  const url = `${baseUrl}/${key}`;

  return c.json({ key, url, content_type: file.type, size: file.size }, 201);
});

router.put('/cms/uploads/:key', async (c) => {
  const token = c.req.query('token');
  if (!token) return c.json({ error: 'Missing token' }, 401);
  const payload = await verifyUploadToken(token, c.env.SESSION_SECRET);
  if (!payload) return c.json({ error: 'Invalid token' }, 401);
  if (payload.exp < Math.floor(Date.now() / 1000)) return c.json({ error: 'Token expired' }, 401);

  const key = decodeURIComponent(c.req.param('key'));
  if (payload.key !== key) return c.json({ error: 'Token mismatch' }, 403);

  const contentType = c.req.header('content-type') || 'application/octet-stream';
  const data = await c.req.arrayBuffer();
  await c.env.R2.put(key, data, {
    httpMetadata: {
      contentType,
    },
  });

  return c.json({ ok: true }, 200);
});

router.get('/assets/*', async (c) => {
  const key = c.req.param('*');
  if (!key) {
    return c.json({ error: 'Object key is required' }, 400);
  }

  const object = await c.env.R2.get(key);
  if (!object) {
    return c.json({ error: 'Not Found' }, 404);
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  return new Response(object.body, { headers });
});

export default router;
