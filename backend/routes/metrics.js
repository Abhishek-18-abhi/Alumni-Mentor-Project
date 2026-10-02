import { Router } from 'express';
import { getSystemMetrics } from '../middleware/metricsLogger.js';

const router = Router();

/**
 * GET /api/metrics
 * System operational metrics including latency p50/p95, error rate, and AI telemetry.
 */
router.get('/', (req, res) => {
  res.json(getSystemMetrics());
});

export default router;
