import mongoose from 'mongoose';

const matchFactorSchema = new mongoose.Schema(
  {
    name: String,
    rawScore: Number,
    weight: Number,
    contribution: Number,
    matchedItems: { type: [String], default: [] },
    explanation: String
  },
  { _id: false }
);

const requestSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    mentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, default: '' },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
    matchSnapshot: {
      score: Number,
      algorithmVersion: String,
      factors: { type: [matchFactorSchema], default: [] },
      computedAt: Date
    },
    respondedAt: Date
  },
  { timestamps: true, collection: 'mentorshipRequests' }
);

requestSchema.index({ studentId: 1, status: 1 });
requestSchema.index({ mentorId: 1, status: 1 });

export default mongoose.model('MentorshipRequest', requestSchema);
