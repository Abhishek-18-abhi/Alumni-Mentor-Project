import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema(
  {
    fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    toUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'MentorshipRequest', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    text: { type: String, default: '' }
  },
  { timestamps: true, collection: 'feedback' }
);

feedbackSchema.index({ toUserId: 1, createdAt: -1 });
feedbackSchema.index({ fromUserId: 1, createdAt: -1 });
feedbackSchema.index({ requestId: 1 });

export default mongoose.model('Feedback', feedbackSchema);
