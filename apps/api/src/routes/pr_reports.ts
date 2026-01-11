import { Hono } from 'hono';
import { sessionMiddleware } from '../middleware/rbac';
import { createPrReport, deletePrReport, listPrReports, mapPrReport, updatePrReport } from '../db';

const router = new Hono();

router.use('/cms/pr-reports/*', sessionMiddleware);
router.use('/cms/pr-reports', sessionMiddleware);

router.get('/cms/pr-reports', async (c) => {
  const tenant = c.get('tenant');
  const campaignId = c.req.query('campaign_id');
  if (!campaignId) return c.json({ error: 'campaign_id is required' }, 400);
  const reports = await listPrReports(c.env.DB, tenant.id, campaignId);
  return c.json({ reports: reports.map(mapPrReport) });
});

router.post('/cms/pr-reports', async (c) => {
  const tenant = c.get('tenant');
  const body = await c.req.json();
  const { campaign_id, period_start, period_end, highlights } = body || {};
  if (!campaign_id) return c.json({ error: 'campaign_id is required' }, 400);
  const created = await createPrReport(c.env.DB, tenant.id, { campaign_id, period_start, period_end, highlights });
  return c.json({ report: mapPrReport(created) }, 201);
});

router.patch('/cms/pr-reports/:id', async (c) => {
  const tenant = c.get('tenant');
  const id = c.req.param('id');
  const body = await c.req.json();
  const updated = await updatePrReport(c.env.DB, tenant.id, id, body || {});
  return c.json({ report: mapPrReport(updated) });
});

router.delete('/cms/pr-reports/:id', async (c) => {
  const tenant = c.get('tenant');
  const id = c.req.param('id');
  await deletePrReport(c.env.DB, tenant.id, id);
  return c.json({ ok: true });
});

export default router;
