import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema(
  {
    fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    toUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'MentorshipRequest', required: true },
    rating: { type: Number, required: true, min: 1, max: 5, validate: { validator: Number.isInteger, message: 'Rating must be an integer.' } },
    text: { type: String, default: '', maxlength: 2000, trim: true }
  },
  { timestamps: true, collection: 'feedback' }
);

feedbackSchema.index({ fromUserId: 1, requestId: 1 }, { unique: true });

export default mongoose.model('Feedback', feedbackSchema);
