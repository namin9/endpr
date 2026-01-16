import { Hono } from 'hono';
import { sessionMiddleware } from '../middleware/rbac';
import { listInquiries, mapInquiry, markInquiryRead } from '../db';

const router = new Hono();

router.use('/cms/inquiries/*', sessionMiddleware);
router.use('/cms/inquiries', sessionMiddleware);

router.get('/cms/inquiries', async (c) => {
  const tenant = c.get('tenant');
  const inquiries = await listInquiries(c.env.DB, tenant.id);
  return c.json({ inquiries: inquiries.map(mapInquiry) });
});

router.patch('/cms/inquiries/:id/read', async (c) => {
  const tenant = c.get('tenant');
  const id = c.req.param('id');
  const updated = await markInquiryRead(c.env.DB, tenant.id, id);
  if (!updated) return c.json({ error: 'Inquiry not found' }, 404);
  return c.json({ inquiry: mapInquiry(updated) });
});

export default router;
