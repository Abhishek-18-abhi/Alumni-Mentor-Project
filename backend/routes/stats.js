import { Router } from 'express';
import User from '../models/User.js';
import MentorshipRequest from '../models/MentorshipRequest.js';
import Meeting from '../models/Meeting.js';
import Feedback from '../models/Feedback.js';

const router = Router();

// Public platform aggregate statistics for landing page and overview
router.get('/', async (req, res, next) => {
  try {
    const [totalMentors, totalStudents, activeMentorships, totalMeetings, feedbackStats] = await Promise.all([
      User.countDocuments({ role: 'mentor', isActive: true }),
      User.countDocuments({ role: 'student', isActive: true }),
      MentorshipRequest.countDocuments({ status: 'accepted' }),
      Meeting.countDocuments({ status: { $ne: 'cancelled' } }),
      Feedback.aggregate([
        { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
      ]),
    ]);

    const reviewCount = feedbackStats[0]?.count || 0;
    const avgRating = reviewCount >= 3 ? Math.round(feedbackStats[0].avgRating * 10) / 10 : null;

    res.json({
      totalMentors,
      totalStudents,
      activeMentorships,
      totalMeetings,
      avgRating,
      reviewCount,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
