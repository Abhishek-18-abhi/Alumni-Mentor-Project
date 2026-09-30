import { Router } from 'express';
import Goal from '../models/Goal.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const filter = req.user.role === 'student' ? { studentId: req.user._id } : req.user.role === 'mentor' ? { createdBy: req.user._id } : {};
    const goals = await Goal.find(filter).populate('studentId createdBy', 'name email role').sort({ createdAt: -1 });
    res.json({ goals });
  } catch (err) { next(err); }
});

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { studentId, title, target = '', progress = 0 } = req.body;
    if (!studentId || !title) return res.status(400).json({ message: 'studentId and title are required.' });
    if (req.user.role === 'student' && String(studentId) !== String(req.user._id)) return res.status(403).json({ message: 'You can only create goals for yourself.' });
    const goal = await Goal.create({ studentId, createdBy: req.user._id, title, target, progress, status: Number(progress) >= 100 ? 'completed' : 'active' });
    res.status(201).json({ goal });
  } catch (err) { next(err); }
});

router.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    const goal = await Goal.findById(req.params.id);
    if (!goal) return res.status(404).json({ message: 'Goal not found.' });
    const allowed = ['title', 'target', 'progress', 'status'];
    const patch = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
    if (patch.progress !== undefined) {
      patch.progress = Math.min(100, Math.max(0, Number(patch.progress)));
      if (patch.progress >= 100) patch.status = 'completed';
    }
    const canEdit = req.user.role === 'admin' || goal.studentId.toString() === req.user._id.toString() || goal.createdBy.toString() === req.user._id.toString();
    if (!canEdit) return res.status(403).json({ message: 'You cannot update this goal.' });
    Object.assign(goal, patch);
    await goal.save();
    res.json({ goal });
  } catch (err) { next(err); }
});

export default router;
