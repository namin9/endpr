import { Hono } from 'hono';
import { sessionMiddleware } from '../middleware/rbac';
import { createPrMention, deletePrMention, getPrCampaign, listPrMentions, mapPrMention, updatePrMention } from '../db';

const router = new Hono();

router.use('/cms/pr-mentions/*', sessionMiddleware);
router.use('/cms/pr-mentions', sessionMiddleware);

router.get('/cms/pr-mentions', async (c) => {
  const tenant = c.get('tenant');
  const campaignId = c.req.query('campaign_id');
  if (!campaignId) return c.json({ error: 'campaign_id is required' }, 400);
  const campaign = await getPrCampaign(c.env.DB, tenant.id, campaignId);
  if (!campaign) return c.json({ error: 'Campaign not found' }, 404);
  const mentions = await listPrMentions(c.env.DB, tenant.id, campaignId);
  return c.json({ mentions: mentions.map(mapPrMention) });
});

router.post('/cms/pr-mentions', async (c) => {
  const tenant = c.get('tenant');
  const body = await c.req.json();
  const { campaign_id, outlet_name, url, published_at, memo } = body || {};
  if (!campaign_id || !outlet_name || !url) {
    return c.json({ error: 'campaign_id, outlet_name, url are required' }, 400);
  }
  const campaign = await getPrCampaign(c.env.DB, tenant.id, campaign_id);
  if (!campaign) return c.json({ error: 'Campaign not found' }, 404);
  const created = await createPrMention(c.env.DB, tenant.id, { campaign_id, outlet_name, url, published_at, memo });
  return c.json({ mention: mapPrMention(created) }, 201);
});

router.patch('/cms/pr-mentions/:id', async (c) => {
  const tenant = c.get('tenant');
  const id = c.req.param('id');
  const body = await c.req.json();
  const updated = await updatePrMention(c.env.DB, tenant.id, id, body || {});
  return c.json({ mention: mapPrMention(updated) });
});

router.delete('/cms/pr-mentions/:id', async (c) => {
  const tenant = c.get('tenant');
  const id = c.req.param('id');
  await deletePrMention(c.env.DB, tenant.id, id);
  return c.json({ ok: true });
});

export default router;
