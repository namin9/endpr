import { SessionData } from './session';

function parseSuperAdminEmails(raw: string | undefined) {
  if (!raw) return [];
  return raw
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

export function isSuperAdmin(session: SessionData | undefined, env: any) {
  if (session?.role) {
    return session.role === 'super_admin';
  }
  const allowlist = parseSuperAdminEmails(env?.SUPER_ADMIN_EMAILS);
  if (!allowlist.length) return false;
  return allowlist.includes(session?.email?.toLowerCase() || '');
}
