type Env = {
  DB: D1Database;
};

function corsHeaders(origin: string | null) {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
  if (origin) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Credentials'] = 'true';
  } else {
    headers['Access-Control-Allow-Origin'] = '*';
  }
  return headers;
}

function jsonResponse(body: unknown, init: ResponseInit = {}, origin?: string | null) {
  const headers = {
    'Content-Type': 'application/json',
    ...corsHeaders(origin ?? null),
    ...(init.headers || {}),
  };
  return new Response(JSON.stringify(body), { ...init, headers });
}

async function handleView(request: Request, env: Env) {
  const origin = request.headers.get('Origin');
  let payload: { tenantSlug?: string; pageKey?: string } = {};
  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, { status: 400 }, origin);
  }

  const tenantSlug = payload.tenantSlug?.trim();
  const pageKey = payload.pageKey?.trim();
  if (!tenantSlug || !pageKey) {
    return jsonResponse({ error: 'tenantSlug and pageKey are required' }, { status: 400 }, origin);
  }

  const tenant = await env.DB.prepare('SELECT id FROM tenants WHERE slug = ? LIMIT 1')
    .bind(tenantSlug)
    .first<{ id: string }>();
  if (!tenant) {
    return jsonResponse({ error: 'Tenant not found' }, { status: 404 }, origin);
  }

  const day = new Date().toISOString().slice(0, 10);
  await env.DB.prepare(
    `INSERT INTO page_views_daily (tenant_id, page_key, day, views)
     VALUES (?, ?, ?, 1)
     ON CONFLICT (tenant_id, page_key, day)
     DO UPDATE SET views = views + 1`
  )
    .bind(tenant.id, pageKey, day)
    .run();

  return jsonResponse({ ok: true }, { status: 200 }, origin);
}

export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin');

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (request.method === 'POST' && url.pathname === '/public/view') {
      return handleView(request, env);
    }

    return jsonResponse({ error: 'Not Found' }, { status: 404 }, origin);
  },
};
