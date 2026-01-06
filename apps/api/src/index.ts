import { Hono } from 'hono';
import authRoutes from './routes/auth';
import postRoutes from './routes/posts';
import deployJobRoutes from './routes/deploy_jobs';
import buildRoutes from './routes/build';

const app = new Hono();

app.route('/', authRoutes);
app.route('/', postRoutes);
app.route('/', deployJobRoutes);
app.route('/', buildRoutes);

app.notFound((c) => c.json({ error: 'Not Found' }, 404));

export default app;
