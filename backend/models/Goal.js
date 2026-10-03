import mongoose from 'mongoose';

const goalSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    target: { type: String, default: '' },
    targetDate: { type: String, default: '' },
    status: { type: String, enum: ['active', 'in_progress', 'completed'], default: 'active' },
    progress: { type: Number, default: 0, min: 0, max: 100 },
  },
  { timestamps: true, collection: 'goals' }
);

goalSchema.index({ studentId: 1, createdAt: -1 });
goalSchema.index({ createdBy: 1, createdAt: -1 });

export default mongoose.model('Goal', goalSchema);
