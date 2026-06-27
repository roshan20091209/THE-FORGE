import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import simulationRoutes from './routes/simulations.js';
import attemptRoutes from './routes/attempts.js';
import credentialRoutes from './routes/credentials.js';
import reviewRoutes from './routes/reviews.js';
import employerRoutes from './routes/employers.js';
import adminRoutes from './routes/admin.js';
import { generalRateLimiter } from './middleware/rateLimiter.js';
import { getMonthlyUsage } from './ai.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.disable('x-powered-by');
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(generalRateLimiter);
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/simulations', simulationRoutes);
app.use('/api/attempts', attemptRoutes);
app.use('/api/credentials', credentialRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/employers', employerRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), database: 'supabase' });
});

app.get('/api/ai/usage', (req, res) => {
  res.json(getMonthlyUsage());
});

export default app;
