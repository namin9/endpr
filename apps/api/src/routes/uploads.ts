import { Hono } from 'hono';
import { sessionMiddleware } from '../middleware/rbac';

const router = new Hono();

const TARGET_WIDTH = 800;
const MAX_GIF_BYTES = 2 * 1024 * 1024;

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
  return `${origin}/uploads/${key}`;
}

router.post('/cms/uploads', sessionMiddleware, async (c) => {
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
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'].includes(file.type)) {
    return c.json({ error: 'unsupported file type' }, 415);
  }
  if (file.type === 'image/gif' && file.size > MAX_GIF_BYTES) {
    return c.json({ error: 'gif too large' }, 413);
  }

  const tenantId = c.get('tenant').id;
  let payload: ArrayBuffer;
  let contentType = file.type;
  let extension = '.webp';

  if (file.type === 'image/gif' || file.type === 'image/svg+xml') {
    payload = await file.arrayBuffer();
    contentType = file.type;
    extension = file.type === 'image/svg+xml' ? '.svg' : '.gif';
  } else {
    try {
      const bitmap = await createImageBitmap(file);
      const scale = TARGET_WIDTH / bitmap.width;
      const width = TARGET_WIDTH;
      const height = Math.max(1, Math.round(bitmap.height * scale));
      const canvas = new OffscreenCanvas(width, height);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return c.json({ error: 'image processing failed' }, 500);
      }
      ctx.drawImage(bitmap, 0, 0, width, height);
      const blob = await canvas.convertToBlob({ type: 'image/webp', quality: 0.82 });
      payload = await blob.arrayBuffer();
      contentType = 'image/webp';
      extension = '.webp';
    } catch (error) {
      payload = await file.arrayBuffer();
      contentType = file.type;
      extension = file.type === 'image/png' ? '.png' : file.type === 'image/jpeg' ? '.jpg' : '.webp';
    }
  }

  const key = `uploads/${tenantId}/${crypto.randomUUID()}${extension}`;
  await bucket.put(key, payload, { httpMetadata: { contentType } });

  return c.json({ ok: true, key, url: buildPublicUrl(c, key) });
});

async function handleGetUpload(c: any) {
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
}

router.get('/cms/uploads/:key{.+}', handleGetUpload);
router.get('/uploads/:key{.+}', handleGetUpload);

export default router;
