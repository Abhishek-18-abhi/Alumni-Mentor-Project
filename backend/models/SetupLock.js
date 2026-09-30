import mongoose from 'mongoose';

const setupLockSchema = new mongoose.Schema(
  { key: { type: String, required: true, unique: true, default: 'global' } },
  { collection: 'setupLocks', timestamps: true }
);

export default mongoose.model('SetupLock', setupLockSchema);
