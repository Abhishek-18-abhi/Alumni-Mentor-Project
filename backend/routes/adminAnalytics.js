import { Router } from 'express';
import User from '../models/User.js';
import Mentor from '../models/Mentor.js';
import Student from '../models/Student.js';
import MentorshipRequest from '../models/MentorshipRequest.js';
import Meeting from '../models/Meeting.js';
import Feedback from '../models/Feedback.js';
import AuditLog from '../models/AuditLog.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

function calculateGiniAndStdDev(values = []) {
  if (values.length <= 1) return { gini: 0, stdDev: 0, mean: values[0] || 0 };
  const n = values.length;
  const mean = values.reduce((sum, v) => sum + v, 0) / n;
  if (mean === 0) return { gini: 0, stdDev: 0, mean: 0 };

  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);

  let diffSum = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      diffSum += Math.abs(values[i] - values[j]);
    }
  }
  const gini = diffSum / (2 * n * n * mean);

  return {
    gini: Math.round(gini * 1000) / 1000,
    stdDev: Math.round(stdDev * 1000) / 1000,
    mean: Math.round(mean * 100) / 100,
  };
}

/**
 * GET /api/admin/analytics
 * Comprehensive server-side analytics computed directly from MongoDB.
 */
router.get('/analytics', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalStudents,
      totalMentors,
      totalAdmins,
      activeUsers,
      allMentorProfiles,
      requests,
      meetings,
      feedbackList,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'mentor' }),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ isActive: { $ne: false } }),
      Mentor.find().populate('userId', 'name email isActive').lean(),
      MentorshipRequest.find().lean(),
      Meeting.find().lean(),
      Feedback.find().populate('fromUserId toUserId', 'name email role').sort({ createdAt: -1 }).lean(),
    ]);

    // Request Funnel metrics
    const totalRequests = requests.length;
    const pendingRequests = requests.filter((r) => r.status === 'pending').length;
    const acceptedRequests = requests.filter((r) => r.status === 'accepted').length;
    const rejectedRequests = requests.filter((r) => r.status === 'rejected').length;
    const completedDecisions = acceptedRequests + rejectedRequests;
    const acceptRate = completedDecisions > 0 ? Math.round((acceptedRequests / completedDecisions) * 100) : 0;

    // Average match score
    const scores = requests
      .map((r) => r.matchSnapshot?.score)
      .filter((s) => typeof s === 'number' && !isNaN(s));
    const avgMatchScore =
      scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

    // Mentor load and capacity balance analysis
    let totalCapacity = 0;
    let totalCurrentMentees = 0;
    const loadRatios = [];
    const overloadedMentors = [];

    for (const m of allMentorProfiles) {
      const cap = Math.max(1, Number(m.capacity) || 1);
      const current = Math.max(0, Number(m.currentMentees) || 0);
      totalCapacity += cap;
      totalCurrentMentees += current;
      const ratio = current / cap;
      loadRatios.push(ratio);

      if (current >= cap) {
        overloadedMentors.push({
          id: m.userId?._id || m.userId,
          name: m.userId?.name || 'Mentor',
          company: m.company || 'Alumni',
          capacity: cap,
          currentMentees: current,
          loadRatioPercent: Math.round(ratio * 100),
        });
      }
    }

    const { gini, stdDev, mean: meanLoadRatio } = calculateGiniAndStdDev(loadRatios);

    // Meetings breakdown
    const scheduledMeetings = meetings.filter((m) => m.status === 'scheduled').length;
    const completedMeetings = meetings.filter((m) => m.status === 'completed').length;
    const cancelledMeetings = meetings.filter((m) => m.status === 'cancelled').length;

    // Feedback satisfaction
    const ratings = feedbackList.map((f) => Number(f.rating) || 5);
    const avgRating =
      ratings.length > 0
        ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
        : 5.0;

    // Conflicts blocked (count failed scheduling attempts or audits)
    const conflictLogs = await AuditLog.countDocuments({
      action: { $in: ['Scheduled meeting', 'Blocked scheduling conflict'] },
      status: 'Failed',
    });

    // Individual Mentor Performance Aggregation
    const mentorPerformance = allMentorProfiles.map((m) => {
      const mUserId = String(m.userId?._id || m.userId || '');
      const mFeedback = feedbackList.filter((f) => {
        const toId = String(f.toUserId?._id || f.toUserId || '');
        return toId === mUserId;
      });

      const mRatings = mFeedback.map((f) => Number(f.rating) || 5);
      const mAvgRating =
        mRatings.length > 0
          ? Math.round((mRatings.reduce((a, b) => a + b, 0) / mRatings.length) * 10) / 10
          : null;

      const avgUsefulness =
        mFeedback.length > 0
          ? Math.round((mFeedback.reduce((a, b) => a + (b.aspects?.usefulness || 5), 0) / mFeedback.length) * 10) / 10
          : 5.0;
      const avgClarity =
        mFeedback.length > 0
          ? Math.round((mFeedback.reduce((a, b) => a + (b.aspects?.clarity || 5), 0) / mFeedback.length) * 10) / 10
          : 5.0;
      const avgComfort =
        mFeedback.length > 0
          ? Math.round((mFeedback.reduce((a, b) => a + (b.aspects?.comfort || 5), 0) / mFeedback.length) * 10) / 10
          : 5.0;

      return {
        mentorId: mUserId,
        name: m.userId?.name || 'Mentor',
        email: m.userId?.email || '',
        company: m.company || 'Alumni Cell',
        domain: m.domain || 'Software Engineering',
        totalReviews: mFeedback.length,
        avgRating: mAvgRating,
        avgUsefulness,
        avgClarity,
        avgComfort,
        recentReviews: mFeedback.slice(0, 5).map((rf) => ({
          id: rf._id,
          studentName: rf.fromUserId?.name || 'Student',
          rating: rf.rating,
          comment: rf.comment || rf.text || '',
          aspects: rf.aspects,
          createdAt: rf.createdAt,
        })),
      };
    }).sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0) || b.totalReviews - a.totalReviews);

    res.json({
      overview: {
        totalUsers,
        totalStudents,
        totalMentors,
        totalAdmins,
        activeUsers,
        totalRequests,
        totalMeetings: meetings.length,
        totalFeedback: feedbackList.length,
      },
      funnel: {
        totalRequests,
        pending: pendingRequests,
        accepted: acceptedRequests,
        rejected: rejectedRequests,
        acceptRatePercent: acceptRate,
      },
      matching: {
        avgMatchScore,
        totalEvaluated: scores.length,
      },
      capacity: {
        totalCapacity,
        totalCurrentMentees,
        utilizationPercent: totalCapacity > 0 ? Math.round((totalCurrentMentees / totalCapacity) * 100) : 0,
        meanLoadRatio,
        loadGiniCoefficient: gini,
        loadStandardDeviation: stdDev,
        overloadedMentorsCount: overloadedMentors.length,
        overloadedMentors,
      },
      meetings: {
        total: meetings.length,
        scheduled: scheduledMeetings,
        completed: completedMeetings,
        cancelled: cancelledMeetings,
        conflictsBlockedCount: conflictLogs,
      },
      satisfaction: {
        averageRating: avgRating,
        totalSurveys: feedbackList.length,
      },
      mentorPerformance,
      allFeedback: feedbackList.map((f) => ({
        id: f._id,
        rating: f.rating,
        text: f.text || f.comment,
        aspects: f.aspects,
        studentName: f.fromUserId?.name || 'Student',
        studentEmail: f.fromUserId?.email || '',
        mentorName: f.toUserId?.name || 'Mentor',
        mentorEmail: f.toUserId?.email || '',
        mentorId: f.toUserId?._id || f.toUserId,
        createdAt: f.createdAt,
      })),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
