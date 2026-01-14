import { Hono } from 'hono';
import { sessionMiddleware } from '../middleware/rbac';
import {
  getDeployJob,
  getLatestActiveDeployJob,
  getTenantByPagesProjectName,
  listDeployJobs,
  mapDeployJob,
  updateDeployJobStatus,
} from '../db';

const router = new Hono();

router.use('/cms/deploy-jobs/*', sessionMiddleware);
router.use('/cms/deploy-jobs', sessionMiddleware);

function requirePagesWebhookSecret(env: Record<string, any>, headerValue: string | undefined) {
  const secret = env.PAGES_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error('PAGES_WEBHOOK_SECRET binding is required');
  }
  if (!headerValue || headerValue !== secret) {
    throw new Error('Unauthorized');
  }
}

function normalizeDeployStatus(rawStatus: string | undefined) {
  if (!rawStatus) return null;
  const normalized = rawStatus.toLowerCase();
  if (normalized === 'success' || normalized === 'succeeded' || normalized === 'completed') return 'success';
  if (
    normalized === 'failed' ||
    normalized === 'failure' ||
    normalized === 'error' ||
    normalized === 'canceled' ||
    normalized === 'cancelled'
  )
    return 'failed';
  if (
    normalized === 'building' ||
    normalized === 'in_progress' ||
    normalized === 'running' ||
    normalized === 'queued' ||
    normalized === 'started'
  )
    return 'building';
  return null;
}

router.get('/cms/deploy-jobs', async (c) => {
  const tenant = c.get('tenant');
  const jobs = await listDeployJobs(c.env.DB, tenant.id);
  return c.json({ jobs: jobs.map(mapDeployJob) });
});

router.get('/cms/deploy-jobs/:id', async (c) => {
  const tenant = c.get('tenant');
  const id = c.req.param('id');
  const job = await getDeployJob(c.env.DB, tenant.id, id);
  if (!job) return c.json({ error: 'Deploy job not found' }, 404);
  return c.json({ job: mapDeployJob(job) });
});

router.post('/public/deploy-jobs/webhook', async (c) => {
  try {
    requirePagesWebhookSecret(c.env as Record<string, any>, c.req.header('x-pages-webhook-secret'));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized';
    const status = message === 'Unauthorized' ? 401 : 500;
    return c.json({ error: message }, status);
  }

  let payload: Record<string, any>;
  try {
    payload = await c.req.json();
  } catch (error) {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  const projectName =
    payload?.project_name ?? payload?.projectName ?? payload?.project?.name ?? payload?.project ?? payload?.project_id;
  if (!projectName) {
    return c.json({ error: 'project_name is required' }, 400);
  }

  const status = normalizeDeployStatus(
    payload?.status ?? payload?.result ?? payload?.state ?? payload?.deployment_status ?? payload?.deployment?.status
  );
  if (!status) {
    return c.json({ error: 'status is required' }, 400);
  }

  const tenant = await getTenantByPagesProjectName(c.env.DB, projectName);
  if (!tenant) {
    return c.json({ error: 'Tenant not found' }, 404);
  }

  const job = await getLatestActiveDeployJob(c.env.DB, tenant.id);
  if (!job) {
    return c.json({ error: 'Active deploy job not found' }, 404);
  }

  const messageParts: string[] = [];
  const messagePayload = payload?.message ?? payload?.summary ?? payload?.deployment?.message;
  if (typeof messagePayload === 'string' && messagePayload.trim()) {
    messageParts.push(messagePayload.trim());
  }
  const deploymentId = payload?.deployment_id ?? payload?.deploymentId ?? payload?.deployment?.id ?? payload?.id;
  if (deploymentId) {
    messageParts.push(`deployment_id=${deploymentId}`);
  }
  const message = messageParts.length ? messageParts.join(' | ') : `Deploy ${status}`;

  const updated = await updateDeployJobStatus(c.env.DB, job.id, status, message);
  return c.json({ ok: true, deploy_job: mapDeployJob(updated) });
});

export default router;
