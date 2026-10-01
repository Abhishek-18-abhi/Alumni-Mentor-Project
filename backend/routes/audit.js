import { Router } from 'express';
import AuditLog from '../models/AuditLog.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const limit = Math.min(500, Math.max(1, Number(req.query.limit) || 200));
    const skip = Math.max(0, Number(req.query.skip) || 0);
    const audit = await AuditLog.find()
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    const total = await AuditLog.countDocuments();
    res.json({ audit, total, limit, skip });
  } catch (err) { next(err); }
});

export default router;
