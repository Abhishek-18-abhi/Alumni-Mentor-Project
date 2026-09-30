import { Router } from 'express';
import PlatformSettings from '../models/PlatformSettings.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, async (req, res, next) => {
  try {
    let settings = await PlatformSettings.findOne().sort({ createdAt: 1 });
    if (!settings) settings = await PlatformSettings.create({});
    res.json({ settings });
  } catch (err) { next(err); }
});

router.patch('/', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const allowed = ['platformName', 'matchingEnabled', 'registrationsEnabled', 'maintenanceMode', 'defaultMentorCapacity'];
    const patch = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
    if (patch.defaultMentorCapacity !== undefined) patch.defaultMentorCapacity = Math.max(0, Number(patch.defaultMentorCapacity) || 0);
    const settings = await PlatformSettings.findOneAndUpdate({}, patch, { new: true, upsert: true, setDefaultsOnInsert: true });
    res.json({ settings });
  } catch (err) { next(err); }
});

export default router;
