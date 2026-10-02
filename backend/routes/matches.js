import { Router } from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Student from '../models/Student.js';
import Mentor from '../models/Mentor.js';
import { requireAuth } from '../middleware/auth.js';
import { scoreMatch } from '../services/matching.js';
import { getPublicUser } from '../utils/publicUser.js';
import { recordAudit } from '../services/auditService.js';

const router = Router();

/**
 * GET /api/matches/:studentId
 * Returns server-side ranked mentors with factor breakdowns for a given student.
 */
router.get('/:studentId', requireAuth, async (req, res, next) => {
  try {
    const { studentId } = req.params;
    if (!mongoose.isValidObjectId(studentId)) {
      return res.status(400).json({ message: 'Invalid student ID.' });
    }

    // Only the student themselves or an admin can retrieve their ranked matches
    const isSelf = req.user._id.toString() === studentId;
    if (!isSelf && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You can only view your own match recommendations.' });
    }

    const [studentUser, studentProfile] = await Promise.all([
      User.findOne({ _id: studentId, role: 'student', isActive: { $ne: false } }),
      Student.findOne({ userId: studentId }).lean(),
    ]);

    if (!studentUser) {
      return res.status(404).json({ message: 'Student account not found or inactive.' });
    }

    const studentData = {
      ...(studentUser.toObject ? studentUser.toObject() : studentUser),
      ...(studentProfile || {}),
    };

    // Retrieve all active, visible mentors
    const mentorUsers = await User.find({
      role: 'mentor',
      isActive: { $ne: false },
      'settings.profileVisible': { $ne: false },
    }).lean();

    const mentorIds = mentorUsers.map((m) => m._id);
    const mentorProfiles = await Mentor.find({ userId: { $in: mentorIds } }).lean();
    const profileMap = new Map();
    for (const p of mentorProfiles) profileMap.set(String(p.userId), p);

    const matches = [];

    for (const mentorUser of mentorUsers) {
      const profile = profileMap.get(String(mentorUser._id)) || {};
      const mentorData = {
        ...mentorUser,
        ...profile,
      };

      const matchResult = scoreMatch(studentData, mentorData);
      const publicMentor = await getPublicUser(mentorUser, req.user);

      matches.push({
        mentor: publicMentor,
        mentorId: mentorUser._id.toString(),
        score: matchResult.score,
        algorithmVersion: matchResult.algorithmVersion,
        factors: matchResult.factors,
        hasCapacity: matchResult.capacity,
        matchedSkills: matchResult.matched,
        matchedInterests: matchResult.matchedInterests,
        matchedGoals: matchResult.matchedGoals,
        matchedLanguages: matchResult.matchedLanguages,
        matchedAvailability: matchResult.matchedAvailability,
      });
    }

    // Sort: 1st by score descending, then by capacity availability, then by name
    matches.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.hasCapacity !== b.hasCapacity) return a.hasCapacity ? -1 : 1;
      return (a.mentor.name || '').localeCompare(b.mentor.name || '');
    });

    await recordAudit({
      req,
      userId: req.user._id,
      action: 'Fetched ranked matches',
      resource: studentId,
      details: { matchCount: matches.length },
    });

    res.json({
      studentId,
      totalMatches: matches.length,
      matches,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
