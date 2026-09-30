import { Router } from 'express';
import { validateId } from '../middleware/validateId.js';
import User from '../models/User.js';
import Student from '../models/Student.js';
import Mentor from '../models/Mentor.js';
import Administrator from '../models/Administrator.js';
import AuditLog from '../models/AuditLog.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { getPublicUser, getPublicUsers } from '../utils/publicUser.js';

const router = Router();
router.param('id', validateId);
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

router.get('/', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.role) filter.role = req.query.role;
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
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    const isSelf = req.user._id.toString() === req.params.id;
    if (!isSelf && req.user.role !== 'admin') {
      if (user.role !== 'mentor' || user.settings?.profileVisible === false || user.isActive === false) {
        return res.status(403).json({ message: 'You do not have permission to view this profile.' });
      }
    }
    res.json({ user: await getPublicUser(user) });
  } catch (err) { next(err); }
});

router.patch('/:id', requireAuth, async (req, res, next) => {
  try {
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
    if (req.user._id.toString() === req.params.id) return res.status(400).json({ message: 'An administrator cannot delete their own account from this endpoint.' });
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    await Promise.all([
      User.deleteOne({ _id: user._id }),
      Student.deleteOne({ userId: user._id }),
      Mentor.deleteOne({ userId: user._id }),
      Administrator.deleteOne({ userId: user._id })
    ]);
    await AuditLog.create({ userId: req.user._id, action: 'Deleted user', resource: req.params.id });
    res.json({ message: 'User deleted successfully.' });
  } catch (err) { next(err); }
});

export default router;
