import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema({
  deviceId: String,
  action: String,
  timestamp: { type: Date, default: Date.now },
  operator: String,
  status: String,
  signedCertificate: String
});

export const AuditLog = mongoose.model('AuditLog', AuditLogSchema); 