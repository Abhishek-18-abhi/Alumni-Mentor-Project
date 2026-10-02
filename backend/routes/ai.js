import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  explainMatch,
  suggestGoals,
  summarizeRequest,
  summarizeFeedback,
  getAiTelemetry,
} from '../services/aiService.js';
import { recordAudit } from '../services/auditService.js';
import MentorshipRequest from '../models/MentorshipRequest.js';
import Feedback from '../models/Feedback.js';
import PlatformSettings from '../models/PlatformSettings.js';
import User from '../models/User.js';
import Student from '../models/Student.js';
import Mentor from '../models/Mentor.js';
import { scoreMatch } from '../services/matching.js';

const router = Router();

// AI-specific rate limiter
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'AI rate limit exceeded. Please try again in a few minutes.' },
});

router.use(aiLimiter);

// Guard against AI when disabled by administrator
router.use(async (req, res, next) => {
  if (req.method === 'GET' && req.path === '/status') return next();
  try {
    const settings = await PlatformSettings.findOne().sort({ createdAt: 1 });
    if (settings && settings.aiEnabled === false) {
      return res.status(503).json({ message: 'AI features are currently disabled by the administrator.' });
    }
  } catch (_) {}
  next();
});

/**
 * GET /api/ai/status
 * Telemetry and operational health of the AI service
 */
router.get('/status', requireAuth, (req, res) => {
  res.json(getAiTelemetry());
});

/**
 * POST /api/ai/explain-match
 * Natural-language explanation grounded strictly in the factor breakdown
 */
router.post('/explain-match', requireAuth, async (req, res, next) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Match explanations are available to students for their own recommendations.' });
    }
    const { mentorId } = req.body;
    if (!mentorId || !mongoose.isValidObjectId(mentorId)) {
      return res.status(400).json({ message: 'A valid mentor ID is required.' });
    }

    // Never accept score or factor data from the browser: the explanation is
    // derived exclusively from the same server-owned profiles as matching.
    const [studentProfile, mentorUser, mentorProfile] = await Promise.all([
      Student.findOne({ userId: req.user._id }).lean(),
      User.findOne({ _id: mentorId, role: 'mentor', isActive: { $ne: false } }).lean(),
      Mentor.findOne({ userId: mentorId }).lean(),
    ]);
    if (!mentorUser || !mentorProfile) {
      return res.status(404).json({ message: 'Active mentor not found.' });
    }

    const match = scoreMatch(
      { ...(req.user.toObject ? req.user.toObject() : req.user), ...(studentProfile || {}) },
      { ...mentorUser, ...mentorProfile }
    );
    const explanation = await explainMatch({ score: match.score, factors: match.factors });

    await recordAudit({
      req,
      userId: req.user._id,
      action: 'Generated match explanation',
      resource: 'AI:explain-match',
      details: { mentorId, score: match.score, fallbackUsed: explanation.source === 'deterministic-fallback' },
    });

    res.json({
      ...explanation,
      explanation: explanation.text,
      text: explanation.text,
      score: match.score,
      factors: match.factors,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/ai/suggest-goals
 * 3-5 SMART goals from student profile + mentor expertise
 */
router.post('/suggest-goals', requireAuth, async (req, res, next) => {
  try {
    const { studentSkills = [], studentGoals = [], mentorSkills = [], mentorDomain = '' } = req.body;

    const result = await suggestGoals({
      studentSkills,
      studentGoals,
      mentorSkills,
      mentorDomain,
    });

    await recordAudit({
      req,
      userId: req.user._id,
      action: 'Generated AI goal suggestions',
      resource: 'AI:suggest-goals',
      details: { goalCount: result.goals?.length || 0 },
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/ai/summarize-request
 * Mentor-facing summary of student mentorship request
 */
router.post('/summarize-request', requireAuth, async (req, res, next) => {
  try {
    if (req.user.role !== 'mentor' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only mentors or admins can summarize requests.' });
    }

    const { requestId, message, matchScore, sharedSkills, studentGoals } = req.body;

    let requestDoc = null;
    if (requestId && mongoose.isValidObjectId(requestId)) {
      requestDoc = await MentorshipRequest.findById(requestId);
    }

    const effectiveMsg = requestDoc?.message || message || req.body.requestMessage || '';
    const effectiveScore = requestDoc?.matchSnapshot?.score || matchScore || 75;
    const skillsFactor = requestDoc?.matchSnapshot?.factors?.find((f) => f.name === 'skills');
    const effectiveSharedSkills =
      skillsFactor?.matchedItems || sharedSkills || req.body.studentSkills || [];

    const summaryResult = await summarizeRequest({
      message: effectiveMsg,
      matchScore: effectiveScore,
      sharedSkills: effectiveSharedSkills,
      studentGoals: studentGoals || [],
    });

    await recordAudit({
      req,
      userId: req.user._id,
      action: 'Summarized mentorship request',
      resource: requestId || 'AI:summarize-request',
    });

    res.json(summaryResult);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/ai/summarize-feedback
 * Admin-facing thematic synthesis across survey comments
 */
router.post('/summarize-feedback', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const allFeedback = await Feedback.find().lean();
    const comments = allFeedback
      .map((f) => f.comment)
      .filter((c) => Boolean(c && typeof c === 'string' && c.trim().length > 3));

    const totalRatings = allFeedback.map((f) => Number(f.rating) || 5);
    const avg =
      totalRatings.length > 0
        ? totalRatings.reduce((a, b) => a + b, 0) / totalRatings.length
        : 5;

    const result = await summarizeFeedback({
      feedbackComments: comments,
      averageRating: avg,
    });

    await recordAudit({
      req,
      userId: req.user._id,
      action: 'Summarized feedback themes',
      resource: 'AI:summarize-feedback',
      details: { commentCount: comments.length },
    });

    res.json({
      ...result,
      sampleSize: comments.length,
      averageRating: Math.round(avg * 10) / 10,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
