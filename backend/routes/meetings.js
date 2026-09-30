import { Router } from 'express';
import Meeting from '../models/Meeting.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import AuditLog from '../models/AuditLog.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { $or: [{ mentorId: req.user._id }, { studentId: req.user._id }] };
    const meetings = await Meeting.find(filter).populate('mentorId studentId', 'name email role').sort({ date: 1, time: 1 });
    res.json({ meetings });
  } catch (err) { next(err); }
});

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { mentorId, studentId, date, time, mode = 'Online', log = '', status = 'scheduled' } = req.body;
    if (!date || !time) return res.status(400).json({ message: 'Date and time are required.' });
    if (req.user.role === 'mentor' && String(mentorId) !== String(req.user._id)) return res.status(403).json({ message: 'You can only schedule your own meetings.' });
    if (req.user.role === 'student' && String(studentId) !== String(req.user._id)) return res.status(403).json({ message: 'You can only schedule meetings for yourself.' });

    const [mentor, student] = await Promise.all([User.findOne({ _id: mentorId, role: 'mentor' }), User.findOne({ _id: studentId, role: 'student' })]);
    if (!mentor || !student) return res.status(404).json({ message: 'Valid mentor and student are required.' });

    const meeting = await Meeting.create({ mentorId, studentId, date, time, mode, log, status });
    if (mentor._id.toString() !== req.user._id.toString()) await Notification.create({ userId: mentor._id, title: 'New meeting scheduled', message: `${student.name} scheduled a mentorship meeting.`, type: 'meeting' });
    if (student._id.toString() !== req.user._id.toString()) await Notification.create({ userId: student._id, title: 'New meeting scheduled', message: `${mentor.name} scheduled a mentorship meeting.`, type: 'meeting' });
    await AuditLog.create({ userId: req.user._id, action: 'Scheduled meeting', resource: meeting._id.toString() });
    res.status(201).json({ meeting });
  } catch (err) { next(err); }
});

router.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) return res.status(404).json({ message: 'Meeting not found.' });
    const isParticipant = [meeting.mentorId.toString(), meeting.studentId.toString()].includes(req.user._id.toString());
    if (!isParticipant && req.user.role !== 'admin') return res.status(403).json({ message: 'You cannot update this meeting.' });
    const patch = {};
    for (const key of ['date', 'time', 'mode', 'log', 'status']) if (req.body[key] !== undefined) patch[key] = req.body[key];
    Object.assign(meeting, patch);
    await meeting.save();
    res.json({ meeting });
  } catch (err) { next(err); }
});

export default router;
