import { Hono } from 'hono';
import { sessionMiddleware } from '../middleware/rbac';
import { createPrCampaign, deletePrCampaign, listPrCampaigns, mapPrCampaign, updatePrCampaign } from '../db';

const router = new Hono();

router.use('/cms/pr-campaigns/*', sessionMiddleware);
router.use('/cms/pr-campaigns', sessionMiddleware);

router.get('/cms/pr-campaigns', async (c) => {
  const tenant = c.get('tenant');
  const campaigns = await listPrCampaigns(c.env.DB, tenant.id);
  return c.json({ campaigns: campaigns.map(mapPrCampaign) });
});

router.post('/cms/pr-campaigns', async (c) => {
  const tenant = c.get('tenant');
  const body = await c.req.json();
  const { name, status, scheduled_at, description } = body || {};
  if (!name) return c.json({ error: 'name is required' }, 400);
  const created = await createPrCampaign(c.env.DB, tenant.id, { name, status, scheduled_at, description });
  return c.json({ campaign: mapPrCampaign(created) }, 201);
});

router.patch('/cms/pr-campaigns/:id', async (c) => {
  const tenant = c.get('tenant');
  const id = c.req.param('id');
  const body = await c.req.json();
  const updated = await updatePrCampaign(c.env.DB, tenant.id, id, body || {});
  return c.json({ campaign: mapPrCampaign(updated) });
});

router.delete('/cms/pr-campaigns/:id', async (c) => {
  const tenant = c.get('tenant');
  const id = c.req.param('id');
  await deletePrCampaign(c.env.DB, tenant.id, id);
  return c.json({ ok: true });
});

export default router;
