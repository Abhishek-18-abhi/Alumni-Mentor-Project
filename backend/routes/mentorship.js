import { Router } from 'express';
import mongoose from 'mongoose';
import MentorshipRequest from '../models/MentorshipRequest.js';
import User from '../models/User.js';
import Mentor from '../models/Mentor.js';
import Notification from '../models/Notification.js';
import AuditLog from '../models/AuditLog.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const filter = req.user.role === 'student' ? { studentId: req.user._id } : req.user.role === 'mentor' ? { mentorId: req.user._id } : {};
    const requests = await MentorshipRequest.find(filter).populate('studentId mentorId', 'name email role').sort({ createdAt: -1 });
    res.json({ requests });
  } catch (err) { next(err); }
});

router.post('/', requireAuth, async (req, res, next) => {
  try {
    if (req.user.role !== 'student') return res.status(403).json({ message: 'Only students can send mentorship requests.' });
    const { mentorId, message = '', matchSnapshot } = req.body;
    if (!mongoose.isValidObjectId(mentorId)) return res.status(400).json({ message: 'Invalid mentor ID.' });
    const [mentor, mentorProfile] = await Promise.all([User.findOne({ _id: mentorId, role: 'mentor', isActive: { $ne: false } }), Mentor.findOne({ userId: mentorId })]);
    if (!mentor || !mentorProfile) return res.status(404).json({ message: 'Mentor not found.' });
    const existing = await MentorshipRequest.findOne({
      studentId: req.user._id,
      mentorId,
      status: { $in: ['pending', 'accepted'] },
    });
    if (existing) {
      return res.status(409).json({
        message: existing.status === 'accepted'
          ? 'You are already actively paired with this mentor.'
          : 'You already have a pending request with this mentor.',
      });
    }

    const request = await MentorshipRequest.create({ studentId: req.user._id, mentorId, message, matchSnapshot });
    if (mentor.settings?.notifications !== false && mentor.settings?.requestAlerts !== false) {
      await Notification.create({ userId: mentor._id, title: 'New mentorship request', message: `${req.user.name} has requested mentorship.`, type: 'request' });
    }
    await AuditLog.create({ userId: req.user._id, action: 'Sent mentorship request', resource: request._id.toString() });
    res.status(201).json({ request });
  } catch (err) { next(err); }
});

router.patch('/:id/respond', requireAuth, async (req, res, next) => {
  try {
    if (req.user.role !== 'mentor') return res.status(403).json({ message: 'Only mentors can respond to requests.' });
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid request ID.' });
    const { status } = req.body;
    if (!['accepted', 'rejected'].includes(status)) return res.status(400).json({ message: 'Invalid response.' });
    const request = await MentorshipRequest.findOne({ _id: req.params.id, mentorId: req.user._id });
    if (!request) return res.status(404).json({ message: 'Request not found.' });
    if (request.status !== 'pending') return res.status(400).json({ message: 'This request has already been answered.' });

    if (status === 'accepted') {
      const mentorProfile = await Mentor.findOne({ userId: req.user._id });
      if (!mentorProfile) return res.status(404).json({ message: 'Mentor profile not found.' });
      if ((mentorProfile.currentMentees || 0) >= (mentorProfile.capacity || 0)) return res.status(400).json({ message: 'Your capacity is full. Increase capacity before accepting.' });
      mentorProfile.currentMentees = (mentorProfile.currentMentees || 0) + 1;
      await mentorProfile.save();
    }

    request.status = status;
    request.respondedAt = new Date();
    await request.save();

    const title = status === 'accepted' ? 'Mentorship request accepted' : 'Mentorship request declined';
    const message = status === 'accepted' ? `${req.user.name} accepted your mentorship request.` : `${req.user.name} declined your mentorship request.`;
    await Notification.create({ userId: request.studentId, title, message, type: 'request' });
    await AuditLog.create({ userId: req.user._id, action: `${status === 'accepted' ? 'Accepted' : 'Declined'} mentorship request`, resource: request._id.toString() });
    res.json({ request });
  } catch (err) { next(err); }
});

export default router;
