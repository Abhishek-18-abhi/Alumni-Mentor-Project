import { Router } from 'express';
import mongoose from 'mongoose';
import MentorshipRequest from '../models/MentorshipRequest.js';
import User from '../models/User.js';
import Mentor from '../models/Mentor.js';
import Student from '../models/Student.js';
import Notification from '../models/Notification.js';
import { requireAuth } from '../middleware/auth.js';
import { scoreMatch, buildMatchSnapshot } from '../services/matching.js';
import { recordAudit } from '../services/auditService.js';

const router = Router();

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const filter =
      req.user.role === 'student'
        ? { studentId: req.user._id }
        : req.user.role === 'mentor'
        ? { mentorId: req.user._id }
        : {};
    const requests = await MentorshipRequest.find(filter)
      .populate('studentId mentorId', 'name email role')
      .sort({ createdAt: -1 });
    res.json({ requests });
  } catch (err) {
    next(err);
  }
});

router.post('/', requireAuth, async (req, res, next) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can send mentorship requests.' });
    }
    const { mentorId, message = '' } = req.body;
    if (!mentorId || !mongoose.isValidObjectId(mentorId)) {
      return res.status(400).json({ message: 'Invalid mentor ID.' });
    }

    const [mentor, mentorProfile, studentProfile] = await Promise.all([
      User.findOne({ _id: mentorId, role: 'mentor', isActive: { $ne: false } }),
      Mentor.findOne({ userId: mentorId }),
      Student.findOne({ userId: req.user._id }),
    ]);

    if (!mentor || !mentorProfile) {
      return res.status(404).json({ message: 'Mentor not found.' });
    }

    if (mentorProfile.pauseRequests) {
      return res.status(400).json({
        message: 'This mentor has temporarily paused new mentorship requests.',
      });
    }

    const existing = await MentorshipRequest.findOne({
      studentId: req.user._id,
      mentorId,
      status: { $in: ['pending', 'accepted'] },
    });
    if (existing) {
      return res.status(409).json({
        message:
          existing.status === 'accepted'
            ? 'You are already actively paired with this mentor.'
            : 'You already have a pending request with this mentor.',
      });
    }

    // SERVER-SIDE MATCH COMPUTATION: Do NOT trust client matchSnapshot
    const studentUserWithProfile = {
      ...(req.user.toObject ? req.user.toObject() : req.user),
      ...(studentProfile ? studentProfile.toObject() : {}),
    };
    const mentorUserWithProfile = {
      ...(mentor.toObject ? mentor.toObject() : mentor),
      ...(mentorProfile ? mentorProfile.toObject() : {}),
    };

    const computedMatch = scoreMatch(studentUserWithProfile, mentorUserWithProfile);
    const computedSnapshot = buildMatchSnapshot(computedMatch);

    const request = await MentorshipRequest.create({
      studentId: req.user._id,
      mentorId,
      message: String(message || '').trim(),
      matchSnapshot: computedSnapshot,
    });

    if (mentor.settings?.notifications !== false && mentor.settings?.requestAlerts !== false) {
      await Notification.create({
        userId: mentor._id,
        title: 'New mentorship request',
        message: `${req.user.name} has requested mentorship.`,
        type: 'request',
      }).catch((e) => console.warn('Notification error:', e.message));
    }

    await recordAudit({
      req,
      userId: req.user._id,
      action: 'Sent mentorship request',
      resource: request._id.toString(),
      details: { mentorId, score: computedMatch.score },
    });

    res.status(201).json({ request });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/withdraw', requireAuth, async (req, res, next) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can withdraw mentorship requests.' });
    }
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid request ID.' });
    }
    const request = await MentorshipRequest.findOneAndUpdate(
      { _id: req.params.id, studentId: req.user._id, status: 'pending' },
      { status: 'withdrawn' },
      { new: true }
    );
    if (!request) {
      return res.status(404).json({ message: 'Pending request not found or already processed.' });
    }
    await recordAudit({
      req,
      userId: req.user._id,
      action: 'Withdrew mentorship request',
      resource: request._id.toString(),
    });
    res.json({ request, message: 'Request withdrawn successfully.' });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/respond', requireAuth, async (req, res, next) => {
  try {
    if (req.user.role !== 'mentor') {
      return res.status(403).json({ message: 'Only mentors can respond to requests.' });
    }
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid request ID.' });
    }
    const { status } = req.body;
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid response.' });
    }

    const request = await MentorshipRequest.findOne({
      _id: req.params.id,
      mentorId: req.user._id,
    });
    if (!request) {
      return res.status(404).json({ message: 'Request not found.' });
    }
    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'This request has already been answered.' });
    }

    if (status === 'accepted') {
      // ATOMIC CAPACITY CHECK & INCREMENT
      // Uses $expr guard to ensure currentMentees < capacity atomically
      const updatedMentor = await Mentor.findOneAndUpdate(
        {
          userId: req.user._id,
          $expr: { $lt: ['$currentMentees', '$capacity'] },
        },
        { $inc: { currentMentees: 1 } },
        { new: true }
      );

      if (!updatedMentor) {
        return res.status(400).json({
          message: 'Your capacity is full. Increase capacity before accepting.',
        });
      }

      // Atomically update request to accepted if still pending
      const updatedRequest = await MentorshipRequest.findOneAndUpdate(
        { _id: req.params.id, mentorId: req.user._id, status: 'pending' },
        { status: 'accepted', respondedAt: new Date() },
        { new: true }
      );

      if (!updatedRequest) {
        // Rollback capacity if request was modified concurrently
        await Mentor.updateOne({ userId: req.user._id }, { $inc: { currentMentees: -1 } });
        return res.status(400).json({ message: 'This request has already been answered.' });
      }

      await Notification.create({
        userId: updatedRequest.studentId,
        title: 'Mentorship request accepted',
        message: `${req.user.name} accepted your mentorship request.`,
        type: 'request',
      }).catch((e) => console.warn('Notification error:', e.message));

      await recordAudit({
        req,
        userId: req.user._id,
        action: 'Accepted mentorship request',
        resource: updatedRequest._id.toString(),
        details: { currentMentees: updatedMentor.currentMentees, capacity: updatedMentor.capacity },
      });

      return res.json({ request: updatedRequest });
    }

    // Status is 'rejected'
    const updatedRequest = await MentorshipRequest.findOneAndUpdate(
      { _id: req.params.id, mentorId: req.user._id, status: 'pending' },
      { status: 'rejected', respondedAt: new Date() },
      { new: true }
    );

    if (!updatedRequest) {
      return res.status(400).json({ message: 'This request has already been answered.' });
    }

    await Notification.create({
      userId: updatedRequest.studentId,
      title: 'Mentorship request declined',
      message: `${req.user.name} declined your mentorship request.`,
      type: 'request',
    }).catch((e) => console.warn('Notification error:', e.message));

    await recordAudit({
      req,
      userId: req.user._id,
      action: 'Declined mentorship request',
      resource: updatedRequest._id.toString(),
    });

    res.json({ request: updatedRequest });
  } catch (err) {
    next(err);
  }
});

export default router;
