export type SessionData = {
  userId: string;
  tenantId: string;
  tenantSlug: string;
  role: 'editor' | 'tenant_admin' | 'super_admin';
  email: string;
};

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

export async function createSessionToken(payload: SessionData, secret: string): Promise<string> {
  const body = base64UrlEncode(JSON.stringify(payload));
  const signature = await hmac(body, secret);
  return `${body}.${signature}`;
}

export async function verifySessionToken(token: string, secret: string): Promise<SessionData | null> {
  const [body, signature] = token.split('.');
  if (!body || !signature) return null;
  const expected = await hmac(body, secret);
  if (expected !== signature) return null;
  try {
    const decoded = JSON.parse(base64UrlDecode(body)) as SessionData;
    return decoded as SessionData;
  } catch (error) {
    console.error('Failed to parse session', error);
    return null;
  }
}
