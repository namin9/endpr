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

function normalizeExtension(fileName: string | undefined, contentType: string | undefined): string {
  const fromName = fileName?.split('.').pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]+$/.test(fromName)) return fromName;
  if (contentType?.includes('webp')) return 'webp';
  if (contentType?.includes('png')) return 'png';
  if (contentType?.includes('jpeg') || contentType?.includes('jpg')) return 'jpg';
  return 'bin';
}

router.post('/cms/uploads', async (c) => {
  const tenant = c.get('tenant');
  const body = await c.req.parseBody();
  const upload = body.file ?? body.image;
  const file = Array.isArray(upload) ? upload[0] : upload;

  if (!(file instanceof File)) {
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

  const fallbackBaseUrl = `${new URL(c.req.url).origin}/assets`;
  const baseUrl = (c.env.PUBLIC_R2_BASE_URL || fallbackBaseUrl).replace(/\/$/, '');
  const url = `${baseUrl}/${key}`;

  return c.json({ key, url, content_type: file.type, size: file.size }, 201);
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
