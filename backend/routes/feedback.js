import { Router } from 'express';
import mongoose from 'mongoose';
import Feedback from '../models/Feedback.js';
import MentorshipRequest from '../models/MentorshipRequest.js';
import Notification from '../models/Notification.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { recordAudit } from '../services/auditService.js';

const router = Router();

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const filter =
      req.user.role === 'admin'
        ? {}
        : { $or: [{ fromUserId: req.user._id }, { toUserId: req.user._id }] };
    const feedback = await Feedback.find(filter)
      .populate('fromUserId toUserId', 'name email role')
      .sort({ createdAt: -1 });
    res.json({ feedback });
  } catch (err) {
    next(err);
  }
});

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { toUserId, requestId, rating, text = '', comment = '', aspects } = req.body;
    const numericRating = Number(rating);
    if (
      !toUserId ||
      !requestId ||
      !Number.isInteger(numericRating) ||
      numericRating < 1 ||
      numericRating > 5
    ) {
      return res.status(400).json({
        message: 'toUserId, requestId and an integer rating from 1 to 5 are required.',
      });
    }
    if (!mongoose.isValidObjectId(toUserId) || !mongoose.isValidObjectId(requestId)) {
      return res.status(400).json({ message: 'Invalid recipient or request ID.' });
    }
    if (String(toUserId) === String(req.user._id)) {
      return res.status(400).json({ message: 'You cannot submit feedback to yourself.' });
    }

    const mentorshipRequest = await MentorshipRequest.findById(requestId);
    if (!mentorshipRequest) {
      return res.status(404).json({ message: 'Mentorship request not found.' });
    }
    if (mentorshipRequest.status !== 'accepted') {
      return res.status(400).json({
        message: 'Feedback can only be submitted for accepted mentorship relationships.',
      });
    }

    const isStudentAuthor =
      String(mentorshipRequest.studentId) === String(req.user._id) &&
      String(mentorshipRequest.mentorId) === String(toUserId);
    const isMentorAuthor =
      String(mentorshipRequest.mentorId) === String(req.user._id) &&
      String(mentorshipRequest.studentId) === String(toUserId);

    if (!isStudentAuthor && !isMentorAuthor) {
      return res.status(403).json({
        message: 'You can only submit feedback for your partner in this mentorship.',
      });
    }

    const feedbackContent = String(comment || text || '').trim();

    const feedback = await Feedback.create({
      fromUserId: req.user._id,
      toUserId,
      requestId,
      rating: numericRating,
      text: feedbackContent,
      comment: feedbackContent,
      aspects: aspects || { usefulness: 5, clarity: 5, comfort: 5 },
    });

    await Notification.create({
      userId: toUserId,
      title: 'New feedback received',
      message: `${req.user.name} submitted a ${numericRating}-star review for you.`,
      type: 'feedback',
    }).catch((e) => console.warn('Feedback notification error:', e.message));

    await recordAudit({
      req,
      userId: req.user._id,
      action: 'Submitted feedback',
      resource: feedback._id.toString(),
      details: { toUserId, rating: numericRating },
    });

    res.status(201).json({ feedback });
  } catch (err) {
    next(err);
  }
});

export default router;
