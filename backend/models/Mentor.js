import mongoose from 'mongoose';

const mentorSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    jobTitle: { type: String, default: '' },
    company: { type: String, default: '' },
    experience: { type: String, default: '' },
    domain: { type: String, default: '' },
    bio: { type: String, default: '' },
    skills: { type: [String], default: [] },
    interests: { type: [String], default: [] },
    goals: { type: [String], default: [] },
    languages: { type: [String], default: ['English'] },
    availability: { type: [String], default: [] },
    capacity: { type: Number, default: 1, min: 0 },
    currentMentees: { type: Number, default: 0, min: 0 },
    profileComplete: { type: Boolean, default: false }
  },
  { timestamps: true, collection: 'mentors' }
);

mentorSchema.index({ domain: 1 }, { name: 'domain_idx' });

export default mongoose.model('Mentor', mentorSchema);
