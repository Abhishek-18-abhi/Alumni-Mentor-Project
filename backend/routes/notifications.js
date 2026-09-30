import { Router } from 'express';
import { validateId } from '../middleware/validateId.js';
import Notification from '../models/Notification.js';
import mongoose from 'mongoose';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.param('id', validateId);

router.post('/broadcast', requireAuth, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Only administrators can send broadcast notifications.' });
    const { userIds = [], title, message, type = 'admin' } = req.body;
    if (!Array.isArray(userIds) || userIds.some((userId) => !mongoose.isValidObjectId(userId))) return res.status(400).json({ message: 'All recipient user IDs must be valid.' });
    if (!title || !message || !Array.isArray(userIds) || !userIds.length) return res.status(400).json({ message: 'Recipients, title and message are required.' });
    const docs = userIds.map((userId) => ({ userId, title, message, type }));
    const notifications = await Notification.insertMany(docs);
    res.status(201).json({ notifications });
  } catch (err) { next(err); }
});

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ notifications });
  } catch (err) { next(err); }
});

router.patch('/:id/read', requireAuth, async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { read: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ message: 'Notification not found.' });
    res.json({ notification });
  } catch (err) { next(err); }
});

router.patch('/read-all', requireAuth, async (req, res, next) => {
  try {
    await Notification.updateMany({ userId: req.user._id, read: false }, { read: true });
    res.json({ message: 'Notifications marked as read.' });
  } catch (err) { next(err); }
});

export default router;
