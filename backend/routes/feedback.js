import { Router } from 'express';
import Feedback from '../models/Feedback.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

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
    if (!toUserId || !requestId || !Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ message: 'toUserId, requestId and a rating from 1 to 5 are required.' });
    }
    const feedback = await Feedback.create({ fromUserId: req.user._id, toUserId, requestId, rating: numericRating, text });
    res.status(201).json({ feedback });
  } catch (err) { next(err); }
});

export default router;
