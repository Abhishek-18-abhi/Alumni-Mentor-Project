import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    college: { type: String, default: '' },
    course: { type: String, default: '' },
    year: { type: String, default: '' },
    bio: { type: String, default: '' },
    skills: { type: [String], default: [] },
    interests: { type: [String], default: [] },
    goals: { type: [String], default: [] },
    languages: { type: [String], default: ['English'] },
    availability: { type: [String], default: [] },
    profileComplete: { type: Boolean, default: false }
  },
  { timestamps: true, collection: 'students' }
);

studentSchema.index({ skills: 1 }, { name: 'skills_idx' });
studentSchema.index({ profileComplete: 1 });

export default mongoose.model('Student', studentSchema);
