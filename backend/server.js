import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';

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

app.use(cors({
  origin: process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',').map((x) => x.trim()) : true,
  credentials: true
}));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    service: 'alumni-mentor-backend',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
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
  console.error('API error:', {
    method: req.method,
    path: req.originalUrl,
    name: err?.name,
    code: err?.code,
    message: err?.message
  });

  if (res.headersSent) return next(err);

  if (err?.code === 11000) {
    return res.status(409).json({ message: 'A record with this unique value already exists.' });
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const message = Object.values(err.errors || {}).map((item) => item.message).join(' ') || 'Validation failed.';
    return res.status(400).json({ message });
  }

  if (err instanceof mongoose.Error.CastError || err?.name === 'BSONError') {
    return res.status(400).json({ message: 'Invalid identifier or data format.' });
  }

  if (err?.name === 'JsonWebTokenError' || err?.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }

  const status = Number.isInteger(err?.status) && err.status >= 400 && err.status < 600 ? err.status : 500;
  return res.status(status).json({
    message: status === 500 ? 'Internal server error.' : (err.message || 'Request failed.')
  });
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
  await connectDB();
}

export default app;