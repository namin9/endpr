import { Hono } from 'hono';
import { sessionMiddleware, requireRole } from '../middleware/rbac';
import { listSubscribers, toIso } from '../db';
import { SessionData } from '../session';

const router = new Hono();

router.use('/cms/subscribers/*', sessionMiddleware);
router.use('/cms/subscribers', sessionMiddleware);

router.get('/cms/subscribers/export', async (c) => {
  const session = c.get('session') as SessionData;
  if (!requireRole(session, ['admin', 'super'])) return c.json({ error: 'Forbidden' }, 403);
  const tenant = c.get('tenant');
  const subscribers = await listSubscribers(c.env.DB, tenant.id);

  const lines = ['email,created_at'];
  const escapeCsv = (value: string) => `"${value.replace(/"/g, '""')}"`;
  subscribers.forEach((subscriber) => {
    const createdAt = toIso(subscriber.created_at) || '';
    lines.push(`${escapeCsv(subscriber.email)},${escapeCsv(createdAt)}`);
  });

  c.header('Content-Type', 'text/csv');
  c.header('Content-Disposition', 'attachment; filename="subscribers.csv"');
  return c.text(lines.join('\n'));
});

export default router;
