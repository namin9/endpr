import { Hono } from 'hono';
import authRoutes from './routes/auth';
import postRoutes from './routes/posts';
import deployJobRoutes from './routes/deploy_jobs';
import buildRoutes from './routes/build';
import uploadRoutes from './routes/uploads';
import { corsMiddleware } from './middleware/cors';

const app = new Hono();

app.use('*', corsMiddleware);

app.route('/', authRoutes);
app.route('/', postRoutes);
app.route('/', deployJobRoutes);
app.route('/', buildRoutes);
app.route('/', uploadRoutes);

app.notFound((c) => c.json({ error: 'Not Found' }, 404));

export default app;
