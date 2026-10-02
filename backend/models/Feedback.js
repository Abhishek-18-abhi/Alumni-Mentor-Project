import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema(
  {
    fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    toUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'MentorshipRequest', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    text: { type: String, default: '' },
    comment: { type: String, default: '' },
    aspects: {
      usefulness: { type: Number, min: 1, max: 5, default: 5 },
      clarity: { type: Number, min: 1, max: 5, default: 5 },
      comfort: { type: Number, min: 1, max: 5, default: 5 },
    },
  },
  { timestamps: true, collection: 'feedback', toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

feedbackSchema.index({ toUserId: 1, createdAt: -1 });
feedbackSchema.index({ fromUserId: 1, createdAt: -1 });
feedbackSchema.index({ requestId: 1 });

export default mongoose.model('Feedback', feedbackSchema);
