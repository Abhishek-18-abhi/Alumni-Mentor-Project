import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true },
    resource: { type: String, default: '' },
    status: { type: String, enum: ['Success', 'Failed'], default: 'Success' },
    ip: { type: String, default: '' },
    details: { type: mongoose.Schema.Types.Mixed, default: null },
    prevHash: { type: String, default: '' },
    hash: { type: String, default: '' }
  },
  { timestamps: true, collection: 'auditLogs' }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ hash: 1 });

export default mongoose.model('AuditLog', auditLogSchema);
