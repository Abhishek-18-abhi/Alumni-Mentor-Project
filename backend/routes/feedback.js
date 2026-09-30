import { Router } from 'express';
import mongoose from 'mongoose';
import Feedback from '../models/Feedback.js';
import MentorshipRequest from '../models/MentorshipRequest.js';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const MAX_FEEDBACK_TEXT_LENGTH = 2000;

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { $or: [{ fromUserId: req.user._id }, { toUserId: req.user._id }] };
    const feedback = await Feedback.find(filter).populate('fromUserId toUserId', 'name email role').sort({ createdAt: -1 });
    res.json({ feedback });
  } catch (err) { next(err); }
});

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { toUserId, requestId, rating, text = '' } = req.body;
    const numericRating = Number(rating);

    if (!mongoose.isValidObjectId(toUserId) || !mongoose.isValidObjectId(requestId)) {
      return res.status(400).json({ message: 'Valid toUserId and requestId are required.' });
    }
    if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ message: 'Rating must be an integer from 1 to 5.' });
    }
    if (typeof text !== 'string' || text.length > MAX_FEEDBACK_TEXT_LENGTH) {
      return res.status(400).json({ message: `Feedback text must be at most ${MAX_FEEDBACK_TEXT_LENGTH} characters.` });
    }
    if (String(toUserId) === String(req.user._id)) {
      return res.status(400).json({ message: 'You cannot submit feedback for yourself.' });
    }

    const [recipient, request] = await Promise.all([
      User.findOne({ _id: toUserId, isActive: { $ne: false } }),
      MentorshipRequest.findById(requestId)
    ]);
    if (!recipient) return res.status(404).json({ message: 'Feedback recipient not found.' });
    if (!request) return res.status(404).json({ message: 'Mentorship request not found.' });
    if (request.status !== 'accepted') return res.status(400).json({ message: 'Feedback can only be submitted for an accepted mentorship request.' });

    const isParticipant = String(request.studentId) === String(req.user._id) || String(request.mentorId) === String(req.user._id);
    const isRecipient = String(request.studentId) === String(toUserId) || String(request.mentorId) === String(toUserId);
    if (!isParticipant || !isRecipient || String(request.studentId) === String(request.mentorId)) {
      return res.status(403).json({ message: 'Feedback must be exchanged between participants in the selected mentorship request.' });
    }

    const existing = await Feedback.findOne({ fromUserId: req.user._id, requestId });
    if (existing) return res.status(409).json({ message: 'You have already submitted feedback for this mentorship request.' });

    const feedback = await Feedback.create({
      fromUserId: req.user._id,
      toUserId,
      requestId,
      rating: numericRating,
      text: text.trim()
    });
    res.status(201).json({ feedback });
  } catch (err) { next(err); }
});

export default router;
