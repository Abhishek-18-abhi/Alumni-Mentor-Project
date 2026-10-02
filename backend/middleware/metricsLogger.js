import crypto from 'crypto';
import { getAiTelemetry } from '../services/aiService.js';

const latencies = [];
const MAX_LATENCIES = 2000;

const state = {
  requestCount: 0,
  errorCount: 0,
  startedAt: new Date().toISOString(),
};

function calculatePercentile(array, percentile) {
  if (array.length === 0) return 0;
  const sorted = [...array].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return Math.round((sorted[Math.max(0, index)] || 0) * 100) / 100;
}

export function metricsMiddleware(req, res, next) {
  // Generate Request ID
  const requestId = req.headers['x-request-id'] || crypto.randomUUID();
  req.id = requestId;
  res.setHeader('X-Request-Id', requestId);

  // Skip metrics for static assets or health checks if preferred, or include all
  const start = performance.now();

  res.on('finish', () => {
    const durationMs = Math.round((performance.now() - start) * 100) / 100;
    state.requestCount += 1;

    if (res.statusCode >= 400) {
      state.errorCount += 1;
    }

    latencies.push(durationMs);
    if (latencies.length > MAX_LATENCIES) {
      latencies.shift();
    }

    // Structured JSON request log
    if (process.env.NODE_ENV !== 'test') {
      const logRecord = {
        requestId,
        method: req.method,
        path: req.originalUrl || req.url,
        status: res.statusCode,
        durationMs,
        ip: req.ip || req.socket?.remoteAddress,
        timestamp: new Date().toISOString(),
      };
      console.log(JSON.stringify(logRecord));
    }
  });

  next();
}

export function getSystemMetrics() {
  const p50 = calculatePercentile(latencies, 50);
  const p95 = calculatePercentile(latencies, 95);
  const p99 = calculatePercentile(latencies, 99);
  const errorRate =
    state.requestCount > 0
      ? Math.round((state.errorCount / state.requestCount) * 10000) / 100
      : 0;

  const ai = getAiTelemetry();

  return {
    uptimeSeconds: Math.round(process.uptime()),
    serverStartTime: state.startedAt,
    requests: {
      total: state.requestCount,
      errors: state.errorCount,
      errorRatePercent: errorRate,
    },
    latency: {
      p50Ms: p50,
      p95Ms: p95,
      p99Ms: p99,
      samples: latencies.length,
    },
    ai: {
      callCount: ai.totalCalls,
      fallbackCount: ai.fallbackCalls,
      fallbackRatePercent: ai.fallbackRatePercent,
      provider: ai.provider,
      configured: ai.configured,
    },
  };
}
