import { Hono } from 'hono';
import authRoutes from './routes/auth';
import postRoutes from './routes/posts';
import deployJobRoutes from './routes/deploy_jobs';
import buildRoutes from './routes/build';
import uploadRoutes from './routes/uploads';
import categoryRoutes from './routes/categories';
import shareRoutes from './routes/share';
import publicRoutes from './routes/public';
import scheduledRoutes from './routes/scheduled';
import prCampaignRoutes from './routes/pr_campaigns';
import prMentionRoutes from './routes/pr_mentions';
import prReportRoutes from './routes/pr_reports';
import themeRoutes from './routes/theme';
import tenantRoutes from './routes/tenants';
import userRoutes from './routes/users';
import siteSettingsRoutes from './routes/site_settings';
import { corsMiddleware } from './middleware/cors';

const app = new Hono();

app.use('*', corsMiddleware);

app.route('/', authRoutes);
app.route('/', postRoutes);
app.route('/', deployJobRoutes);
app.route('/', buildRoutes);
app.route('/', uploadRoutes);
app.route('/', categoryRoutes);
app.route('/', shareRoutes);
app.route('/', publicRoutes);
app.route('/', scheduledRoutes);
app.route('/', prCampaignRoutes);
app.route('/', prMentionRoutes);
app.route('/', prReportRoutes);
app.route('/', themeRoutes);
app.route('/', tenantRoutes);
app.route('/', userRoutes);
app.route('/', siteSettingsRoutes);

app.notFound((c) => c.json({ error: 'Not Found' }, 404));

export default app;
