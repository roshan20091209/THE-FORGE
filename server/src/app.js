import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import simulationRoutes from './routes/simulations.js';
import attemptRoutes from './routes/attempts.js';
import credentialRoutes from './routes/credentials.js';
import leaderboardRoutes from './routes/leaderboard.js';
import textbookRoutes from './routes/textbooks.js';
import askRoutes from './routes/ask.js';
import questionPaperRoutes from './routes/questionPapers.js';
import subscriptionRoutes from './routes/subscriptions.js';
import paymentRoutes from './routes/payments.js';
import webhookRoutes from './routes/webhooks.js';
import adminRoutes from './routes/admin.js';
import { generalRateLimiter } from './middleware/rateLimiter.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.disable('x-powered-by');
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(generalRateLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/simulations', simulationRoutes);
app.use('/api/attempts', attemptRoutes);
app.use('/api/credentials', credentialRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/textbooks', textbookRoutes);
app.use('/api/ask', askRoutes);
app.use('/api/question-papers', questionPaperRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default app;
