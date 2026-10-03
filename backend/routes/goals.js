import { Router } from 'express';
import mongoose from 'mongoose';
import Goal from '../models/Goal.js';
import MentorshipRequest from '../models/MentorshipRequest.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import AuditLog from '../models/AuditLog.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, async (req, res, next) => {
  try {
    let filter = {};
    if (req.user.role === 'student') {
      filter = { studentId: req.user._id };
    } else if (req.user.role === 'mentor') {
      const menteeReqs = await MentorshipRequest.find({
        mentorId: req.user._id,
        status: 'accepted',
      }).select('studentId');
      const menteeIds = menteeReqs.map((r) => r.studentId);
      filter = {
        $or: [{ createdBy: req.user._id }, { studentId: { $in: menteeIds } }],
      };
    }
    const goals = await Goal.find(filter)
      .populate('studentId createdBy', 'name email role')
      .sort({ createdAt: -1 });
    res.json({ goals });
  } catch (err) {
    next(err);
  }
});

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { studentId, title, target = '', targetDate = '', progress = 0 } = req.body;
    if (!studentId || !title?.trim()) {
      return res.status(400).json({ message: 'studentId and title are required.' });
    }
    if (!mongoose.isValidObjectId(studentId)) {
      return res.status(400).json({ message: 'Invalid student ID.' });
    }

    const studentUser = await User.findOne({
      _id: studentId,
      role: 'student',
      isActive: { $ne: false },
    });
    if (!studentUser) return res.status(404).json({ message: 'Student account not found.' });

    if (req.user.role === 'student') {
      if (String(studentId) !== String(req.user._id)) {
        return res.status(403).json({ message: 'You can only create goals for yourself.' });
      }
    } else if (req.user.role === 'mentor') {
      const activeMentorship = await MentorshipRequest.findOne({
        mentorId: req.user._id,
        studentId,
        status: 'accepted',
      });
      if (!activeMentorship) {
        return res
          .status(403)
          .json({ message: 'You can only create goals for your active mentees.' });
      }
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized role.' });
    }

    const cleanProgress = Math.min(100, Math.max(0, Number(progress) || 0));
    const goal = await Goal.create({
      studentId,
      createdBy: req.user._id,
      title: title.trim(),
      target: String(target || '').trim(),
      targetDate: String(targetDate || '').trim(),
      progress: cleanProgress,
      status: cleanProgress >= 100 ? 'completed' : 'active',
    });

    if (String(studentId) !== String(req.user._id)) {
      await Notification.create({
        userId: studentId,
        title: 'New goal assigned',
        message: `${req.user.name} created a mentorship goal: "${title.trim()}".`,
        type: 'goal',
      }).catch((e) => console.warn('Goal notification error:', e.message));
    }

    await AuditLog.create({
      userId: req.user._id,
      action: 'Created goal',
      resource: goal._id.toString(),
    }).catch((e) => console.warn('Goal audit log error:', e.message));

    res.status(201).json({ goal });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid goal ID.' });
    }
    const goal = await Goal.findById(req.params.id);
    if (!goal) return res.status(404).json({ message: 'Goal not found.' });
    const allowed = ['title', 'target', 'targetDate', 'progress', 'status'];
    const patch = Object.fromEntries(
      Object.entries(req.body).filter(([key]) => allowed.includes(key))
    );
    if (patch.progress !== undefined) {
      patch.progress = Math.min(100, Math.max(0, Number(patch.progress)));
      if (patch.progress >= 100) {
        patch.status = 'completed';
      }
    }
    if (patch.title !== undefined) {
      patch.title = String(patch.title).trim();
    }
    if (patch.target !== undefined) {
      patch.target = String(patch.target).trim();
    }
    if (patch.targetDate !== undefined) {
      patch.targetDate = String(patch.targetDate).trim();
    }
    if (patch.status && !['active', 'in_progress', 'completed'].includes(patch.status)) {
      patch.status = 'active';
    }
    const canEdit =
      req.user.role === 'admin' ||
      goal.studentId.toString() === req.user._id.toString() ||
      goal.createdBy.toString() === req.user._id.toString();
    if (!canEdit) return res.status(403).json({ message: 'You cannot update this goal.' });
    Object.assign(goal, patch);
    await goal.save();
    res.json({ goal });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid goal ID.' });
    }
    const goal = await Goal.findById(req.params.id);
    if (!goal) return res.status(404).json({ message: 'Goal not found.' });

    const canDelete =
      req.user.role === 'admin' ||
      goal.studentId.toString() === req.user._id.toString() ||
      goal.createdBy.toString() === req.user._id.toString();
    if (!canDelete) return res.status(403).json({ message: 'You cannot delete this goal.' });

    await Goal.findByIdAndDelete(req.params.id);

    await AuditLog.create({
      userId: req.user._id,
      action: 'Deleted goal',
      resource: req.params.id,
    }).catch((e) => console.warn('Goal delete audit log error:', e.message));

    res.json({ message: 'Goal deleted successfully.' });
  } catch (err) {
    next(err);
  }
});

export default router;
