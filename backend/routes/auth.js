import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Student from '../models/Student.js';
import Mentor from '../models/Mentor.js';
import Administrator from '../models/Administrator.js';
import AuditLog from '../models/AuditLog.js';
import Notification from '../models/Notification.js';
import { getPublicUser, profilePayload } from '../utils/publicUser.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
const MIN_PASSWORD_LENGTH = 8;

function tokenFor(user) {
  return jwt.sign({ userId: user._id.toString(), role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

async function createRoleProfile(user, data = {}) {
  if (user.role === 'student') return Student.create({ userId: user._id, ...profilePayload('student', data) });
  if (user.role === 'mentor') return Mentor.create({ userId: user._id, ...profilePayload('mentor', data) });
  return Administrator.create({ userId: user._id, ...profilePayload('admin', data) });
}

router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, role = 'student', ...profile } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Name, email and password are required.' });
    if (password.length < MIN_PASSWORD_LENGTH) return res.status(400).json({ message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` });
    if (!['student', 'mentor'].includes(role)) return res.status(400).json({ message: 'Public registration is only for students and mentors.' });
    const normalizedEmail = email.toLowerCase().trim();
    if (await User.findOne({ email: normalizedEmail })) return res.status(409).json({ message: 'An account with this email already exists.' });

    const user = await User.create({ name: name.trim(), email: normalizedEmail, passwordHash: await bcrypt.hash(password, 10), role });
    await createRoleProfile(user, { ...profile, profileComplete: false });
    await AuditLog.create({ userId: user._id, action: 'Account created', resource: 'Account' });
    await Notification.create({ userId: user._id, title: 'Welcome to MentorConnect', message: 'Complete your profile to start using mentorship features.' });
    res.status(201).json({ token: tokenFor(user), user: await getPublicUser(user) });
  } catch (err) { next(err); }
});

router.post('/setup-admin', async (req, res, next) => {
  try {
    if (await User.exists({ role: 'admin' })) return res.status(409).json({ message: 'Administrator setup is already complete.' });
    const { name, email, password, ...profile } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Name, email and password are required.' });
    if (password.length < MIN_PASSWORD_LENGTH) return res.status(400).json({ message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` });
    const normalizedEmail = email.toLowerCase().trim();
    if (await User.exists({ email: normalizedEmail })) return res.status(409).json({ message: 'Email already exists.' });
    const user = await User.create({ name: name.trim(), email: normalizedEmail, passwordHash: await bcrypt.hash(password, 10), role: 'admin' });
    await createRoleProfile(user, { ...profile, adminType: 'admin' });
    await AuditLog.create({ userId: user._id, action: 'Initial administrator created', resource: 'Account' });
    await Notification.create({ userId: user._id, title: 'Welcome to MentorConnect', message: 'Your administrator account is ready.' });
    res.status(201).json({ token: tokenFor(user), user: await getPublicUser(user) });
  } catch (err) { next(err); }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: String(email || '').toLowerCase().trim(), isActive: { $ne: false } }).select('+passwordHash');
    if (!user || !(await bcrypt.compare(String(password || ''), user.passwordHash))) return res.status(401).json({ message: 'Invalid email or password.' });
    await AuditLog.create({ userId: user._id, action: 'Signed in', resource: 'Account' });
    res.json({ token: tokenFor(user), user: await getPublicUser(user) });
  } catch (err) { next(err); }
});

router.get('/me', requireAuth, async (req, res, next) => {
  try { res.json({ user: await getPublicUser(req.user) }); } catch (err) { next(err); }
});

router.patch('/change-password', requireAuth, async (req, res, next) => {
  try {
    const { currentPassword, nextPassword } = req.body;
    if (!nextPassword || nextPassword.length < MIN_PASSWORD_LENGTH) return res.status(400).json({ message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` });
    const user = await User.findById(req.user._id).select('+passwordHash');
    if (!(await bcrypt.compare(String(currentPassword || ''), user.passwordHash))) return res.status(400).json({ message: 'Current password is incorrect.' });
    user.passwordHash = await bcrypt.hash(nextPassword, 10);
    await user.save();
    await AuditLog.create({ userId: user._id, action: 'Changed password', resource: 'Account' });
    res.json({ message: 'Password changed successfully.' });
  } catch (err) { next(err); }
});

router.post('/admins', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const { name, email, password, ...profile } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Name, email and password are required.' });
    if (password.length < MIN_PASSWORD_LENGTH) return res.status(400).json({ message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` });
    const normalizedEmail = email.toLowerCase().trim();
    if (await User.findOne({ email: normalizedEmail })) return res.status(409).json({ message: 'Email already exists.' });
    const user = await User.create({ name: name.trim(), email: normalizedEmail, passwordHash: await bcrypt.hash(password, 10), role: 'admin' });
    await createRoleProfile(user, { ...profile, adminType: profile.adminType || 'admin' });
    await AuditLog.create({ userId: req.user._id, action: 'Created administrator', resource: user.email });
    await Notification.create({ userId: user._id, title: 'Administrator account created', message: 'Your administrator account is ready.' });
    res.status(201).json({ user: await getPublicUser(user) });
  } catch (err) { next(err); }
});

export default router;
