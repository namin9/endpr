import { Hono } from 'hono';
import { sessionMiddleware } from '../middleware/rbac';

const router = new Hono();

router.use('/cms/uploads/*', sessionMiddleware);
router.use('/cms/uploads', sessionMiddleware);

function getBucket(c: any) {
  const bucket = c.env?.MEDIA_BUCKET;
  if (!bucket) {
    throw new Error('MEDIA_BUCKET binding is required');
  }
  return bucket;
}

function buildPublicUrl(c: any, key: string) {
  const base = c.env?.MEDIA_PUBLIC_URL ? `${c.env.MEDIA_PUBLIC_URL}`.replace(/\/$/, '') : '';
  if (base) {
    return `${base}/${key}`;
  }
  const origin = new URL(c.req.url).origin;
  return `${origin}/cms/uploads/${key}`;
}

router.post('/cms/uploads', async (c) => {
  let bucket;
  try {
    bucket = getBucket(c);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'MEDIA_BUCKET binding is required';
    return c.json({ error: message }, 500);
  }

  const formData = await c.req.formData();
  const file = formData.get('file');
  if (!(file instanceof File)) {
    return c.json({ error: 'file is required' }, 400);
  }
  if (!file.type || !file.type.startsWith('image/')) {
    return c.json({ error: 'unsupported file type' }, 415);
  }

  const filename = file.name || 'upload';
  const extMatch = filename.match(/\.([a-z0-9]+)$/i);
  const extension = extMatch ? `.${extMatch[1].toLowerCase()}` : '';
  const key = `uploads/${c.get('tenant').id}/${crypto.randomUUID()}${extension}`;

  const payload = await file.arrayBuffer();
  await bucket.put(key, payload, { httpMetadata: { contentType: file.type } });

  return c.json({ ok: true, key, url: buildPublicUrl(c, key) });
});

router.get('/cms/uploads/:key{.+}', async (c) => {
  let bucket;
  try {
    bucket = getBucket(c);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'MEDIA_BUCKET binding is required';
    return c.json({ error: message }, 500);
  }

  const key = c.req.param('key');
  const object = await bucket.get(key);
  if (!object) {
    return c.json({ error: 'Not found' }, 404);
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  return new Response(object.body, { headers });
});

export default router;
