import { Router } from 'express';
import mongoose from 'mongoose';
import Notification from '../models/Notification.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// 1. Bulk Broadcast notifications (Admin only)
router.post('/broadcast', requireAuth, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only administrators can send broadcast notifications.' });
    }
    const { userIds = [], title, message, type = 'info' } = req.body;
    if (!title || !message || !Array.isArray(userIds) || !userIds.length) {
      return res.status(400).json({ message: 'Recipients, title and message are required.' });
    }
    const validIds = userIds.filter((id) => mongoose.isValidObjectId(id));
    if (!validIds.length) {
      return res.status(400).json({ message: 'No valid recipient user IDs provided.' });
    }
    const docs = validIds.map((userId) => ({
      userId,
      title: title.trim(),
      message: message.trim(),
      type,
    }));
    const notifications = await Notification.insertMany(docs);
    res.status(201).json({ notifications, count: notifications.length });
  } catch (err) {
    next(err);
  }
});

// 2. Single Notification creation
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { userId, title, message, type = 'info' } = req.body;
    if (!title || !message) {
      return res.status(400).json({ message: 'Title and message are required.' });
    }
    const targetUserId = userId || req.user._id;
    if (!mongoose.isValidObjectId(targetUserId)) {
      return res.status(400).json({ message: 'Invalid recipient user ID.' });
    }
    if (req.user.role !== 'admin' && String(targetUserId) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Only administrators can send notifications to other users.' });
    }
    const notification = await Notification.create({
      userId: targetUserId,
      title: title.trim(),
      message: message.trim(),
      type,
    });
    res.status(201).json({ notification });
  } catch (err) {
    next(err);
  }
});

// 3. Get user notifications
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ notifications });
  } catch (err) {
    next(err);
  }
});

// 4. Mark all read (support both /mark-all-read and /read-all)
router.patch('/mark-all-read', requireAuth, async (req, res, next) => {
  try {
    await Notification.updateMany({ userId: req.user._id, read: false }, { read: true });
    res.json({ message: 'Notifications marked as read.' });
  } catch (err) {
    next(err);
  }
});

router.patch('/read-all', requireAuth, async (req, res, next) => {
  try {
    await Notification.updateMany({ userId: req.user._id, read: false }, { read: true });
    res.json({ message: 'Notifications marked as read.' });
  } catch (err) {
    next(err);
  }
});

// 5. Parameterized routes for individual notifications
router.patch('/:id/read', requireAuth, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid notification ID.' });
    }
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { read: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ message: 'Notification not found.' });
    res.json({ notification });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid notification ID.' });
    }
    const read = req.body.read !== undefined ? Boolean(req.body.read) : true;
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { read },
      { new: true }
    );
    if (!notification) return res.status(404).json({ message: 'Notification not found.' });
    res.json({ notification });
  } catch (err) {
    next(err);
  }
});

export default router;
