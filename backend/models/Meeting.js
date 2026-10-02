import mongoose from 'mongoose';

const meetingSchema = new mongoose.Schema(
  {
    mentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    mode: { type: String, default: 'Online' },
    log: { type: String, default: '' },
    notes: { type: String, default: '' },
    outcome: { type: String, default: '' },
    nextSteps: { type: String, default: '' },
    status: { type: String, enum: ['scheduled', 'completed', 'cancelled'], default: 'scheduled' }
  },
  { timestamps: true, collection: 'meetings' }
);

meetingSchema.index({ mentorId: 1, date: 1 });
meetingSchema.index({ studentId: 1, date: 1 });

export default mongoose.model('Meeting', meetingSchema);
