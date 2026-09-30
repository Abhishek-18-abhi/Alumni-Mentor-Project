import { Router } from 'express';
import AuditLog from '../models/AuditLog.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const audit = await AuditLog.find().populate('userId', 'name email role').sort({ createdAt: -1 }).limit(500);
    res.json({ audit });
  } catch (err) { next(err); }
});

export default router;
