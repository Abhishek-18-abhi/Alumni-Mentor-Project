import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema(
  {
    notifications: { type: Boolean, default: true },
    requestAlerts: { type: Boolean, default: true },
    meetingAlerts: { type: Boolean, default: true },
    profileVisible: { type: Boolean, default: true },
    compactMode: { type: Boolean, default: false },
    language: { type: String, default: 'English' }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['student', 'mentor', 'admin'], required: true },
    isActive: { type: Boolean, default: true },
    settings: { type: settingsSchema, default: () => ({}) }
  },
  { timestamps: true, collection: 'users' }
);

userSchema.index({ role: 1 }, { name: 'role_idx' });

export default mongoose.model('User', userSchema);
