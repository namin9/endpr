import { Hono } from 'hono';
import { createDeployJob, getTenantById, listDueScheduledPosts, mapDeployJob, publishPost, updateDeployJobStatus } from '../db';

const router = new Hono();

function requireCronSecret(env: Record<string, any>, headerValue: string | undefined) {
  const secret = env.CRON_SECRET;
  if (!secret) {
    throw new Error('CRON_SECRET binding is required');
  }
  if (!headerValue || headerValue !== secret) {
    throw new Error('Unauthorized');
  }
}

router.post('/cron/publish', async (c) => {
  try {
    requireCronSecret(c.env as Record<string, any>, c.req.header('x-cron-secret'));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized';
    const status = message === 'Unauthorized' ? 401 : 500;
    return c.json({ error: message }, status);
  }

  const now = Math.floor(Date.now() / 1000);
  const duePosts = await listDueScheduledPosts(c.env.DB, now);
  if (!duePosts.length) {
    return c.json({ ok: true, published: 0, tenants: 0 });
  }

  const postsByTenant = new Map<string, typeof duePosts>();
  duePosts.forEach((post) => {
    const list = postsByTenant.get(post.tenant_id) || [];
    list.push(post);
    postsByTenant.set(post.tenant_id, list);
  });

  let publishedCount = 0;
  const deployJobs = [];

  for (const [tenantId, posts] of postsByTenant.entries()) {
    for (const post of posts) {
      await publishPost(c.env.DB, tenantId, post.id, now);
      publishedCount += 1;
    }

    const tenant = await getTenantById(c.env.DB, tenantId);
    const job = await createDeployJob(c.env.DB, tenantId, null, 'queued', 'Scheduled publish triggered');
    const buildingJob = await updateDeployJobStatus(c.env.DB, job.id, 'building', 'Deploy hook triggered');

    let status: 'building' | 'success' | 'failed' = 'building';
    let message: string | null = 'Deploy hook triggered';

    if (!tenant?.pages_deploy_hook_url) {
      status = 'failed';
      message = 'pages_deploy_hook_url not configured';
    } else {
      try {
        const resp = await fetch(tenant.pages_deploy_hook_url, { method: 'POST' });
        if (!resp.ok) {
          status = 'failed';
          message = `Deploy hook failed with status ${resp.status}`;
        } else {
          status = 'building';
          message = 'Deploy hook accepted; awaiting webhook';
        }
      } catch (error) {
        status = 'failed';
        message = 'Deploy hook request errored';
        console.error('Deploy hook error', error);
      }
    }

    const finalJob = await updateDeployJobStatus(c.env.DB, buildingJob.id, status, message);
    deployJobs.push(mapDeployJob(finalJob));
  }

  return c.json({ ok: true, published: publishedCount, tenants: postsByTenant.size, deploy_jobs: deployJobs });
});

export default router;
