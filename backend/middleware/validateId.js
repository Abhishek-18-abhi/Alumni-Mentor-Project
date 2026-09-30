import mongoose from 'mongoose';

export function validateId(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid id.' });
  }
  next();
}
