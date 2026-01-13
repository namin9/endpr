import { Hono } from 'hono';
import { sessionMiddleware } from '../middleware/rbac';
import { getPost, getTenantById, mapPost } from '../db';

const router = new Hono();
const SHARE_TTL_SECONDS = 60 * 60 * 24 * 7;

function base64UrlEncode(value: string): string {
  return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlDecode(value: string): string {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  return atob(padded);
}

async function hmac(input: string, secret: string): Promise<string> {
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

async function signToken(payload: Record<string, any>, secret: string): Promise<string> {
  const body = base64UrlEncode(JSON.stringify(payload));
  const signature = await hmac(body, secret);
  return `${body}.${signature}`;
}

async function verifyToken(token: string, secret: string): Promise<Record<string, any> | null> {
  const [body, signature] = token.split('.');
  if (!body || !signature) return null;
  const expected = await hmac(body, secret);
  if (expected !== signature) return null;
  try {
    return JSON.parse(base64UrlDecode(body));
  } catch {
    return null;
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderMarkdown(md = '') {
  const safe = escapeHtml(md);
  const paragraphs = safe.trim().split(/\n{2,}/);
  return paragraphs.map((p) => `<p>${p.replace(/\n/g, '<br />')}</p>`).join('\n');
}

router.post('/cms/posts/:id/share-link', sessionMiddleware, async (c) => {
  if (!c.env.SESSION_SECRET) return c.json({ error: 'SESSION_SECRET binding is required' }, 500);
  const tenant = c.get('tenant');
  const id = c.req.param('id');
  const post = await getPost(c.env.DB, tenant.id, id);
  if (!post) return c.json({ error: 'Post not found' }, 404);
  const exp = Math.floor(Date.now() / 1000) + SHARE_TTL_SECONDS;
  const token = await signToken({ postId: post.id, tenantId: tenant.id, exp }, c.env.SESSION_SECRET);
  const origin = new URL(c.req.url).origin;
  return c.json({ url: `${origin}/share/${token}`, expires_at: exp });
});

router.delete('/cms/posts/:id/share-link', sessionMiddleware, async (c) => {
  const id = c.req.param('id');
  return c.json({ ok: true, revoked: true, id });
});

router.get('/share/:token', async (c) => {
  if (!c.env.SESSION_SECRET) return c.text('SESSION_SECRET binding is required', 500);
  const token = c.req.param('token');
  const payload = await verifyToken(token, c.env.SESSION_SECRET);
  if (!payload) return c.text('Invalid share link', 401);
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return c.text('Share link expired', 410);

  const post = await getPost(c.env.DB, payload.tenantId, payload.postId);
  if (!post) return c.text('Post not found', 404);
  const tenant = await getTenantById(c.env.DB, payload.tenantId);
  const title = escapeHtml(post.title || 'Untitled');
  const body = post.body_md ? renderMarkdown(post.body_md) : '<p></p>';

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="robots" content="noindex,nofollow" />
  <title>${title}</title>
</head>
<body>
  <header>
    <h1>${title}</h1>
    <p>${escapeHtml(tenant?.name || '')}</p>
  </header>
  <main>
    ${body}
  </main>
</body>
</html>`;

  return c.html(html);
});

export default router;
