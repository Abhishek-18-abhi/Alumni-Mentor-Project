import mongoose from 'mongoose';

const administratorSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    adminType: { type: String, enum: ['admin', 'coordinator'], default: 'admin' },
    title: { type: String, default: 'Administrator' },
    department: { type: String, default: 'Alumni Cell' },
    permissions: { type: [String], default: [] }
  },
  { timestamps: true, collection: 'administrators' }
);

administratorSchema.index({ adminType: 1 }, { name: 'admin_type_idx' });

export default mongoose.model('Administrator', administratorSchema);
