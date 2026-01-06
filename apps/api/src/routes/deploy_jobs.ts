import { Hono } from 'hono';
import { sessionMiddleware } from '../middleware/rbac';
import { getDeployJob, listDeployJobs, mapDeployJob } from '../db';

const router = new Hono();

router.use('/cms/deploy-jobs/*', sessionMiddleware);
router.use('/cms/deploy-jobs', sessionMiddleware);

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

export default router;
