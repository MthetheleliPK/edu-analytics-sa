const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: [
      'USER_LOGIN',
      'USER_LOGOUT',
      'USER_CREATE',
      'USER_UPDATE',
      'USER_DELETE',
      'STUDENT_CREATE',
      'STUDENT_UPDATE',
      'STUDENT_DELETE',
      'ASSESSMENT_CREATE',
      'ASSESSMENT_UPDATE',
      'ASSESSMENT_DELETE',
      'MARKS_ENTRY',
      'MARKS_UPDATE',
      'REPORT_GENERATE',
      'BACKUP_CREATE',
      'BACKUP_RESTORE',
      'SYSTEM_SETTINGS_UPDATE',
      'PASSWORD_RESET',
      'PARENT_ACCESS'
    ]
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  userAgent: String,
  ip: String,
  details: mongoose.Schema.Types.Mixed,
  resourceId: mongoose.Schema.Types.ObjectId,
  resourceType: String,
  timestamp: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['SUCCESS', 'FAILURE'],
    default: 'SUCCESS'
  },
  errorMessage: String
}, {
  timestamps: true
});

// Index for efficient querying
auditLogSchema.index({ schoolId: 1, timestamp: -1 });
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });

// Auto-delete logs older than 1 year
auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });

module.exports = mongoose.model('AuditLog', auditLogSchema);