import { Router } from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Student from '../models/Student.js';
import Mentor from '../models/Mentor.js';
import Administrator from '../models/Administrator.js';
import MentorshipRequest from '../models/MentorshipRequest.js';
import Meeting from '../models/Meeting.js';
import Goal from '../models/Goal.js';
import Feedback from '../models/Feedback.js';
import Notification from '../models/Notification.js';
import AuditLog from '../models/AuditLog.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { getPublicUser, getPublicUsers } from '../utils/publicUser.js';

const router = Router();
const studentFields = ['college','course','year','bio','skills','interests','goals','languages','availability','profileComplete'];
const mentorFields = ['jobTitle','company','experience','domain','bio','skills','interests','goals','languages','availability','capacity','profileComplete'];
const adminFields = ['adminType','title','department','permissions'];

async function updateRoleProfile(user, body) {
  if (user.role === 'student') {
    const patch = Object.fromEntries(Object.entries(body).filter(([key]) => studentFields.includes(key)));
    return Student.findOneAndUpdate({ userId: user._id }, patch, { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true });
  }
  if (user.role === 'mentor') {
    const patch = Object.fromEntries(Object.entries(body).filter(([key]) => mentorFields.includes(key)));
    if (patch.capacity !== undefined) patch.capacity = Math.max(0, Number(patch.capacity) || 0);
    return Mentor.findOneAndUpdate({ userId: user._id }, patch, { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true });
  }
  const patch = Object.fromEntries(Object.entries(body).filter(([key]) => adminFields.includes(key)));
  return Administrator.findOneAndUpdate({ userId: user._id }, patch, { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true });
}

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const filter = {};
    if (typeof req.query.role === 'string' && ['student', 'mentor', 'admin'].includes(req.query.role)) {
      filter.role = req.query.role;
    }
    if (req.user.role !== 'admin') {
      filter.isActive = { $ne: false };
    }
    const users = await User.find(filter).sort({ createdAt: -1 });
    res.json({ users: await getPublicUsers(users) });
  } catch (err) { next(err); }
});

router.get('/mentors', requireAuth, async (req, res, next) => {
  try {
    const mentors = await User.find({ role: 'mentor', 'settings.profileVisible': { $ne: false }, isActive: { $ne: false } }).sort({ name: 1 });
    res.json({ users: await getPublicUsers(mentors) });
  } catch (err) { next(err); }
});

router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid user ID.' });
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json({ user: await getPublicUser(user) });
  } catch (err) { next(err); }
});

router.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid user ID.' });
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    const isSelf = req.user._id.toString() === req.params.id;
    if (!isSelf && req.user.role !== 'admin') return res.status(403).json({ message: 'You can only update your own profile.' });

    const common = {};
    for (const key of ['name', 'settings', 'isActive']) if (req.body[key] !== undefined && (key !== 'isActive' || req.user.role === 'admin')) common[key] = req.body[key];
    if (common.name !== undefined) common.name = String(common.name).trim();
    const updatedUser = Object.keys(common).length ? await User.findByIdAndUpdate(user._id, common, { new: true, runValidators: true }) : user;
    await updateRoleProfile(updatedUser, req.body);
    await AuditLog.create({ userId: req.user._id, action: 'Updated profile', resource: req.params.id });
    res.json({ user: await getPublicUser(updatedUser) });
  } catch (err) { next(err); }
});

router.delete('/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid user ID.' });
    }
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({ message: 'An administrator cannot delete their own account from this endpoint.' });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({ message: 'Cannot delete the last remaining administrator.' });
      }
    }

    if (user.role === 'student') {
      const acceptedRequests = await MentorshipRequest.find({ studentId: user._id, status: 'accepted' });
      for (const r of acceptedRequests) {
        await Mentor.updateOne({ userId: r.mentorId, currentMentees: { $gt: 0 } }, { $inc: { currentMentees: -1 } });
      }
    }

    await Promise.allSettled([
      User.deleteOne({ _id: user._id }),
      Student.deleteOne({ userId: user._id }),
      Mentor.deleteOne({ userId: user._id }),
      Administrator.deleteOne({ userId: user._id }),
      MentorshipRequest.deleteMany({ $or: [{ studentId: user._id }, { mentorId: user._id }] }),
      Meeting.deleteMany({ $or: [{ studentId: user._id }, { mentorId: user._id }] }),
      Goal.deleteMany({ $or: [{ studentId: user._id }, { createdBy: user._id }] }),
      Feedback.deleteMany({ $or: [{ fromUserId: user._id }, { toUserId: user._id }] }),
      Notification.deleteMany({ userId: user._id }),
    ]);

    await AuditLog.create({ userId: req.user._id, action: 'Deleted user', resource: req.params.id });
    res.json({ message: 'User and associated records deleted successfully.' });
  } catch (err) { next(err); }
});

export default router;
