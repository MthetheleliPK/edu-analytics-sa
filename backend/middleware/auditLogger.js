const AuditLog = require('../models/AuditLog');

const auditLogger = (action, options = {}) => {
  return async (req, res, next) => {
    const startTime = Date.now();
    
    // Store original response methods
    const originalSend = res.send;
    const originalJson = res.json;

    let responseBody;
    
    // Capture response
    res.send = function(body) {
      responseBody = body;
      originalSend.call(this, body);
    };

    res.json = function(body) {
      responseBody = body;
      originalJson.call(this, body);
    };

    res.on('finish', async () => {
      try {
        const duration = Date.now() - startTime;
        const status = res.statusCode >= 200 && res.statusCode < 400 ? 'SUCCESS' : 'FAILURE';
        
        const logData = {
          action,
          userId: req.userId,
          schoolId: req.schoolId,
          userAgent: req.get('User-Agent'),
          ip: req.ip || req.connection.remoteAddress,
          timestamp: new Date(),
          status,
          duration,
          statusCode: res.statusCode
        };

        // Add resource details if available
        if (options.resourceId) {
          logData.resourceId = options.resourceId;
          logData.resourceType = options.resourceType;
        }

        // Add request details
        if (options.includeBody && req.body) {
          const bodyCopy = { ...req.body };
          // Remove sensitive fields
          if (bodyCopy.password) delete bodyCopy.password;
          if (bodyCopy.token) delete bodyCopy.token;
          logData.details = { ...bodyCopy, ...options.details };
        } else if (options.details) {
          logData.details = options.details;
        }

        // Add error message for failures
        if (status === 'FAILURE' && responseBody && responseBody.message) {
          logData.errorMessage = responseBody.message;
        }

        // Add resource ID from params if not specified
        if (!logData.resourceId && req.params.id) {
          logData.resourceId = req.params.id;
        }

        await AuditLog.create(logData);
      } catch (error) {
        console.error('Audit logging error:', error);
        // Don't throw error to avoid breaking the main request
      }
    });

    next();
  };
};

// Specific audit loggers for common actions
const auditLoggers = {
  login: () => auditLogger('USER_LOGIN', { includeBody: false }),
  logout: () => auditLogger('USER_LOGOUT'),
  createUser: () => auditLogger('USER_CREATE', { includeBody: true }),
  updateUser: () => auditLogger('USER_UPDATE', { includeBody: true }),
  createStudent: () => auditLogger('STUDENT_CREATE', { includeBody: true }),
  updateStudent: () => auditLogger('STUDENT_UPDATE', { includeBody: true }),
  createAssessment: () => auditLogger('ASSESSMENT_CREATE', { includeBody: true }),
  enterMarks: () => auditLogger('MARKS_ENTRY', { includeBody: true }),
  generateReport: () => auditLogger('REPORT_GENERATE'),
  backupCreate: () => auditLogger('BACKUP_CREATE'),
  backupRestore: () => auditLogger('BACKUP_RESTORE')
};

module.exports = { auditLogger, auditLoggers };