import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';

import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import mentorshipRoutes from './routes/mentorship.js';
import notificationRoutes from './routes/notifications.js';
import meetingRoutes from './routes/meetings.js';
import goalRoutes from './routes/goals.js';
import feedbackRoutes from './routes/feedback.js';
import auditRoutes from './routes/audit.js';
import platformSettingsRoutes from './routes/platformSettings.js';

const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.set('trust proxy', 1);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

const defaultOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://localhost:3000',
  'https://alumni-mentor-project.vercel.app',
];
const customOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map((x) => x.trim().replace(/\/$/, ''))
  .filter(Boolean);
const allowedOriginsSet = new Set([...defaultOrigins, ...customOrigins]);

const isOriginAllowed = (origin) => {
  if (!origin) return true;
  if (allowedOriginsSet.has(origin)) return true;
  if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return true;
  if (/^https:\/\/alumni-mentor-project.*\.vercel\.app$/.test(origin)) return true;
  return false;
};

app.use(
  cors({
    origin: (origin, callback) => callback(null, isOriginAllowed(origin)),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    optionsSuccessStatus: 204,
  })
);
app.use(express.json({ limit: '1mb' }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many authentication attempts, please try again in 15 minutes.' },
});

app.use('/api', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/setup-admin', authLimiter);

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    service: 'alumni-mentor-backend',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

app.use('/api', async (req, res, next) => {
  if (req.path === '/health') return next();
  try {
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }
    next();
  } catch (err) {
    console.error('Database connection error in request:', err?.message || err);
    res.status(503).json({ message: 'Database temporarily unavailable. Please retry.' });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/mentorship-requests', mentorshipRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/platform-settings', platformSettingsRoutes);

app.use((req, res) => res.status(404).json({ message: 'API route not found.' }));

app.use((err, req, res, next) => {
  console.error(err);
  if (err?.code === 11000) return res.status(409).json({ message: 'A record with this unique value already exists.' });
  if (err instanceof mongoose.Error.ValidationError) return res.status(400).json({ message: err.message });
  res.status(500).json({ message: 'Internal server error.' });
});

if (!process.env.VERCEL) {
  connectDB()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`Backend running on http://localhost:${PORT}`);
      });
    })
    .catch((err) => {
      console.error('Failed to start backend:', err.message);
      process.exit(1);
    });
} else {
  connectDB().catch((err) => {
    console.error('Vercel initial DB connection error:', err?.message || err);
  });
}

export default app;