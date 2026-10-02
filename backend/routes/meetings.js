import { Router } from 'express';
import mongoose from 'mongoose';
import Meeting from '../models/Meeting.js';
import MentorshipRequest from '../models/MentorshipRequest.js';
import User from '../models/User.js';
import Mentor from '../models/Mentor.js';
import Notification from '../models/Notification.js';
import { requireAuth } from '../middleware/auth.js';
import { isSlotInAvailability } from '../services/meetingAvailability.js';
import { recordAudit } from '../services/auditService.js';

const router = Router();

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const filter =
      req.user.role === 'admin'
        ? {}
        : { $or: [{ mentorId: req.user._id }, { studentId: req.user._id }] };
    const meetings = await Meeting.find(filter)
      .populate('mentorId studentId', 'name email role jobTitle avatar company')
      .sort({ date: 1, time: 1 });
    res.json({ meetings });
  } catch (err) {
    next(err);
  }
});

router.post('/', requireAuth, async (req, res, next) => {
  try {
    let {
      mentorId,
      studentId,
      title = 'Mentorship Session',
      link = '',
      date,
      time,
      mode = 'Online',
      log = '',
      status = 'scheduled',
    } = req.body;

    if (!studentId && req.user.role === 'student') studentId = req.user._id.toString();
    if (!mentorId && req.user.role === 'mentor') mentorId = req.user._id.toString();

    if (!date || !time) {
      return res.status(400).json({ message: 'Date and time are required.' });
    }
    if (!mongoose.isValidObjectId(mentorId) || !mongoose.isValidObjectId(studentId)) {
      return res.status(400).json({ message: 'Invalid mentor or student ID.' });
    }
    if (!['scheduled', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid meeting status.' });
    }

    if (req.user.role === 'mentor' && String(mentorId) !== String(req.user._id)) {
      return res.status(403).json({ message: 'You can only schedule your own meetings.' });
    }
    if (req.user.role === 'student' && String(studentId) !== String(req.user._id)) {
      return res.status(403).json({ message: 'You can only schedule meetings for yourself.' });
    }

    const [mentor, student, mentorProfile] = await Promise.all([
      User.findOne({ _id: mentorId, role: 'mentor', isActive: { $ne: false } }),
      User.findOne({ _id: studentId, role: 'student', isActive: { $ne: false } }),
      Mentor.findOne({ userId: mentorId }),
    ]);

    if (!mentor || !student) {
      return res.status(404).json({ message: 'Active mentor and student accounts are required.' });
    }

    if (req.user.role !== 'admin') {
      const startTime = String(time).includes('-') ? String(time).split('-')[0].trim() : String(time).trim();
      const cleanTime = startTime.match(/\d{1,2}:\d{2}/) ? startTime.match(/\d{1,2}:\d{2}/)[0] : startTime;
      const meetingDateTime = new Date(`${date}T${cleanTime}:00`);
      if (isNaN(meetingDateTime.getTime())) {
        return res.status(400).json({ message: 'Invalid date or time format.' });
      }
      if (meetingDateTime < new Date(Date.now() - 5 * 60 * 1000)) {
        return res.status(400).json({ message: 'Meeting cannot be scheduled in the past.' });
      }

      const activeMentorship = await MentorshipRequest.findOne({
        mentorId,
        studentId,
        status: 'accepted',
      });
      if (!activeMentorship) {
        return res.status(403).json({
          message: 'A meeting can only be scheduled for an accepted mentorship relationship.',
        });
      }

      // 1. Verify slot matches mentor's availability if student is scheduling and mentor published slots
      const mentorSlots = mentorProfile?.availability || mentor.availability || [];
      if (req.user.role === 'student' && Array.isArray(mentorSlots) && mentorSlots.length > 0) {
        const slotMatches = isSlotInAvailability(date, time, mentorSlots);
        if (!slotMatches) {
          return res.status(400).json({
            message: "The selected date and time does not match any of the mentor's available slots.",
            availability: mentorSlots,
          });
        }
      }
    }

    // 2. Verify that NEITHER mentor NOR student has another non-cancelled meeting at that date/time
    const conflict = await Meeting.findOne({
      $or: [
        { mentorId, date, time },
        { studentId, date, time },
      ],
      status: { $ne: 'cancelled' },
    });

    if (conflict) {
      const isMentorConflict = conflict.mentorId.toString() === mentorId.toString();
      return res.status(409).json({
        message: isMentorConflict
          ? 'The mentor already has a scheduled meeting at this date and time.'
          : 'The student already has another scheduled meeting at this date and time.',
      });
    }

    const meeting = await Meeting.create({
      mentorId,
      studentId,
      title: title?.trim() || 'Mentorship Session',
      link: link?.trim() || '',
      date,
      time,
      mode,
      log,
      status,
    });

    if (mentor._id.toString() !== req.user._id.toString()) {
      await Notification.create({
        userId: mentor._id,
        title: 'New meeting scheduled',
        message: `${student.name} scheduled a mentorship meeting for ${date} at ${time}.`,
        type: 'meeting',
      }).catch((e) => console.warn('Meeting notification error:', e.message));
    }
    if (student._id.toString() !== req.user._id.toString()) {
      await Notification.create({
        userId: student._id,
        title: 'New meeting scheduled',
        message: `${mentor.name} scheduled a mentorship meeting for ${date} at ${time}.`,
        type: 'meeting',
      }).catch((e) => console.warn('Meeting notification error:', e.message));
    }

    await recordAudit({
      req,
      userId: req.user._id,
      action: 'Scheduled meeting',
      resource: meeting._id.toString(),
      details: { mentorId, studentId, date, time, mode },
    });

    res.status(201).json({ meeting });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid meeting ID.' });
    }
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) return res.status(404).json({ message: 'Meeting not found.' });

    const isParticipant = [meeting.mentorId.toString(), meeting.studentId.toString()].includes(
      req.user._id.toString()
    );
    if (!isParticipant && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You cannot update this meeting.' });
    }

    if (
      req.body.status !== undefined &&
      !['scheduled', 'completed', 'cancelled'].includes(req.body.status)
    ) {
      return res.status(400).json({ message: 'Invalid meeting status.' });
    }

    const patch = {};
    for (const key of [
      'title',
      'link',
      'date',
      'time',
      'mode',
      'log',
      'notes',
      'outcome',
      'nextSteps',
      'status',
    ]) {
      if (req.body[key] !== undefined) patch[key] = req.body[key];
    }
    Object.assign(meeting, patch);
    await meeting.save();

    await recordAudit({
      req,
      userId: req.user._id,
      action: 'Updated meeting',
      resource: meeting._id.toString(),
      details: patch,
    });

    res.json({ meeting });
  } catch (err) {
    next(err);
  }
});

export default router;
