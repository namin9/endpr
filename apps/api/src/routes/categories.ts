import { Hono } from 'hono';
import { sessionMiddleware } from '../middleware/rbac';
import { listCategories } from '../db';

const router = new Hono();

router.use('/cms/categories/*', sessionMiddleware);
router.use('/cms/categories', sessionMiddleware);

router.get('/cms/categories', async (c) => {
  const tenant = c.get('tenant');
  const categories = await listCategories(c.env.DB, tenant.id);
  return c.json({ categories });
});

export default router;
