import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true },
    resource: { type: String, default: '' },
    status: { type: String, enum: ['Success', 'Failed'], default: 'Success' }
  },
  { timestamps: true, collection: 'auditLogs' }
);

export default mongoose.model('AuditLog', auditLogSchema);
