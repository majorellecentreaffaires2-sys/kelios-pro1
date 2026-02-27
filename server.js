import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import helmet from 'helmet';
import xss from 'xss-clean';
import hpp from 'hpp';
import rateLimit from 'express-rate-limit';
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurations & Database
import { initDb } from './server/config/db.js';
import { initCronJobs } from './server/jobs/cronJobs.js';

// Routes
import authRoutes from './server/routes/auth.js';
import userRoutes from './server/routes/users.js';
import companyRoutes from './server/routes/companies.js';
import invoiceRoutes from './server/routes/invoices.js';
import clientRoutes from './server/routes/clients.js';
import articleRoutes from './server/routes/articles.js';
import reportRoutes from './server/routes/reports.js';
import settingsRoutes from './server/routes/settings.js';
import automationRoutes from './server/routes/automation.js';
import publicRoutes from './server/routes/public.js';
import uploadRoutes from './server/routes/upload.js';

const app = express();
const PORT = process.env.PORT || 5000;

// --- INITIALIZATION ---
initDb().then(() => {
  initCronJobs();
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});

// --- MIDDLEWARE ---
app.set('trust proxy', 1);
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false
}));
app.use(cors());
app.use(xss());
app.use(hpp());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Global Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', apiLimiter);

// --- STATIC FILES & SECURITY ---
app.use(express.static(path.join(__dirname, 'dist')));

// Middleware to log requests to static files for debugging
app.use((req, res, next) => {
  if (req.path.startsWith('/uploads/')) {
    console.log(`📂 Request for upload: ${req.path}`);
  }
  next();
});

app.use((req, res, next) => {
  const sensitiveFiles = ['.env', '.git', 'server.js', 'package.json', 'node_modules'];
  const path = req.path.toLowerCase();
  const segments = path.split('/');

  if (sensitiveFiles.some(file => segments.includes(file.toLowerCase()) || path.endsWith('/' + file.toLowerCase()))) {
    console.warn(`🔒 Access blocked to: ${req.path}`);
    return res.status(403).json({ error: 'Access Denied' });
  }
  next();
});

// --- API ROUTES ---
app.use('/api', authRoutes);
app.use('/api', userRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api', reportRoutes); // Mounted at /api to support /api/logs and /api/reports/monthly
app.use('/api', settingsRoutes);
app.use('/api/automation', automationRoutes);
app.use('/api', publicRoutes);  // /api/view/:token and /api/invoices/:id/public-link
app.use('/api/upload', uploadRoutes);

// Diagnostic route
app.get('/api/check-uploads', (req, res) => {
  const dir = path.join(__dirname, 'uploads');
  try {
    const files = fs.readdirSync(dir);
    res.json({ exists: true, path: dir, files });
  } catch (e) {
    res.json({ exists: false, error: e.message, path: dir });
  }
});

// Debug route for Cron Jobs (REMOVE BEFORE PRODUCTION)
app.get('/api/debug/run-cron', async (req, res) => {
  const { processRecurringSchedules, processReminders, processTrialWarnings, cleanupOldTokens } = await import('./server/jobs/cronJobs.js');

  const results = {
    recurring: 'running...',
    reminders: 'running...',
    trial: 'running...',
    cleanup: 'running...'
  };

  try {
    await processRecurringSchedules();
    results.recurring = 'done';
    await processReminders();
    results.reminders = 'done';
    await processTrialWarnings();
    results.trial = 'done';
    await cleanupOldTokens();
    results.cleanup = 'done';

    res.json({ success: true, results });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Serve uploaded files (logos etc.) with absolute path
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Fallback for SPA
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ error: 'Endpoint not found' });
  res.sendFile('index.html', { root: 'dist' });
});

// --- GLOBAL ERROR HANDLER ---
app.use((err, req, res, next) => {
  console.error('💥 Error:', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

app.listen(PORT, () => {
  console.log(`
  🚀 Server Majorlle Pro is running
  🔹 Port: ${PORT}
  🔹 URL: ${process.env.APP_URL || 'Not Set (using fallback)'}
  🔹 Environment: ${process.env.NODE_ENV || 'development'}
  `);
});
