import mongoose from 'mongoose';

const platformSettingsSchema = new mongoose.Schema(
  {
    platformName: { type: String, default: 'MentorConnect' },
    matchingEnabled: { type: Boolean, default: true },
    registrationsEnabled: { type: Boolean, default: true },
    maintenanceMode: { type: Boolean, default: false },
    aiEnabled: { type: Boolean, default: true },
    defaultMentorCapacity: { type: Number, default: 3, min: 0 }
  },
  { timestamps: true, collection: 'platformSettings' }
);

export default mongoose.model('PlatformSettings', platformSettingsSchema);
