const express = require('express');
const School = require('../models/School');
const User = require('../models/User');
const Student = require('../models/Student');
const AuditLog = require('../models/AuditLog');
const BackupService = require('../services/backupService');
const auth = require('../middleware/auth');

const router = express.Router();

// Super admin auth middleware
const adminAuth = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    next();
  } catch (error) {
    res.status(401).json({ message: 'Authentication failed' });
  }
};

router.use(auth);
router.use(adminAuth);

// Get system-wide statistics
router.get('/stats', async (req, res) => {
  try {
    const totalSchools = await School.countDocuments();
    const totalStudents = await Student.countDocuments();
    const totalUsers = await User.countDocuments();
    
    const activeSchools = await School.countDocuments({
      'subscription.endDate': { $gte: new Date() }
    });

    // Recent schools (last 30 days)
    const recentSchools = await School.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name province district subscription studentCount');

    // Storage usage (simulated - would need actual file storage metrics)
    const storageUsed = await AuditLog.estimatedDocumentSize() || 0;

    res.json({
      totalSchools,
      activeSchools,
      totalStudents,
      totalUsers,
      recentSchools,
      storageUsed
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ message: 'Error fetching admin statistics' });
  }
});

// Get all schools with pagination
router.get('/schools', async (req, res) => {
  try {
    const { page = 1, limit = 20, search, province, status } = req.query;
    
    let query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { emisNumber: { $regex: search, $options: 'i' } },
        { district: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (province) query.province = province;
    if (status === 'active') {
      query['subscription.endDate'] = { $gte: new Date() };
    } else if (status === 'expired') {
      query['subscription.endDate'] = { $lt: new Date() };
    }

    const schools = await School.find(query)
      .select('name emisNumber province district contact subscription createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    // Get student counts for each school
    const schoolsWithStats = await Promise.all(
      schools.map(async (school) => {
        const studentCount = await Student.countDocuments({ schoolId: school._id });
        const userCount = await User.countDocuments({ schoolId: school._id });
        
        return {
          ...school.toObject(),
          studentCount,
          userCount
        };
      })
    );

    const total = await School.countDocuments(query);

    res.json({
      schools: schoolsWithStats,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Admin schools error:', error);
    res.status(500).json({ message: 'Error fetching schools' });
  }
});

// Get school details
router.get('/schools/:schoolId', async (req, res) => {
  try {
    const { schoolId } = req.params;

    const school = await School.findById(schoolId);
    if (!school) {
      return res.status(404).json({ message: 'School not found' });
    }

    const studentCount = await Student.countDocuments({ schoolId });
    const userCount = await User.countDocuments({ schoolId });
    const classCount = await require('../models/Class').countDocuments({ schoolId });

    // Recent activity
    const recentActivity = await AuditLog.find({ schoolId })
      .populate('userId', 'firstName lastName email')
      .sort({ timestamp: -1 })
      .limit(10);

    res.json({
      school,
      statistics: {
        students: studentCount,
        users: userCount,
        classes: classCount
      },
      recentActivity
    });
  } catch (error) {
    console.error('School details error:', error);
    res.status(500).json({ message: 'Error fetching school details' });
  }
});

// Update school subscription
router.put('/schools/:schoolId/subscription', [
  require('express-validator').body('plan').isIn(['trial', 'basic', 'premium']),
  require('express-validator').body('studentsLimit').isInt({ min: 1 })
], async (req, res) => {
  try {
    const errors = require('express-validator').validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { schoolId } = req.params;
    const { plan, studentsLimit, endDate } = req.body;

    const school = await School.findByIdAndUpdate(
      schoolId,
      {
        $set: {
          'subscription.plan': plan,
          'subscription.studentsLimit': studentsLimit,
          'subscription.endDate': endDate ? new Date(endDate) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year default
        }
      },
      { new: true, runValidators: true }
    );

    if (!school) {
      return res.status(404).json({ message: 'School not found' });
    }

    // Log subscription update
    await AuditLog.create({
      action: 'SUBSCRIPTION_UPDATE',
      userId: req.userId,
      schoolId: schoolId,
      details: {
        plan,
        studentsLimit,
        endDate
      },
      ip: req.ip
    });

    res.json({
      message: 'Subscription updated successfully',
      subscription: school.subscription
    });
  } catch (error) {
    console.error('Subscription update error:', error);
    res.status(500).json({ message: 'Error updating subscription' });
  }
});

// Get system users (all schools)
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, role, schoolId, search } = req.query;
    
    let query = {};
    
    if (role) query.role = role;
    if (schoolId) query.schoolId = schoolId;
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .populate('schoolId', 'name emisNumber')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Admin users error:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// Get system audit logs
router.get('/audit-logs', async (req, res) => {
  try {
    const { page = 1, limit = 50, action, schoolId, startDate, endDate } = req.query;
    
    let query = {};
    
    if (action) query.action = action;
    if (schoolId) query.schoolId = schoolId;
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const logs = await AuditLog.find(query)
      .populate('userId', 'firstName lastName email')
      .populate('schoolId', 'name emisNumber')
      .sort({ timestamp: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await AuditLog.countDocuments(query);

    res.json({
      logs,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Admin audit logs error:', error);
    res.status(500).json({ message: 'Error fetching audit logs' });
  }
});

// System health check
router.get('/health', async (req, res) => {
  try {
    // Database health
    const dbStatus = await checkDatabaseHealth();
    
    // Memory usage
    const memoryUsage = process.memoryUsage();
    
    // Uptime
    const uptime = process.uptime();
    
    // Active connections (simulated)
    const activeSessions = await AuditLog.countDocuments({
      timestamp: { $gte: new Date(Date.now() - 15 * 60 * 1000) } // Last 15 minutes
    });

    res.json({
      database: dbStatus,
      memory: {
        used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        rss: Math.round(memoryUsage.rss / 1024 / 1024)
      },
      uptime: Math.round(uptime),
      activeSessions,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ message: 'Health check failed' });
  }
});

// System backup
router.post('/backup', async (req, res) => {
  try {
    const { type = 'full', description } = req.body;

    const backup = await BackupService.createBackup();

    await AuditLog.create({
      action: 'SYSTEM_BACKUP',
      userId: req.userId,
      schoolId: req.schoolId,
      details: {
        type,
        description,
        filename: backup.filename
      },
      ip: req.ip
    });

    res.json({
      message: 'Backup created successfully',
      backup: {
        filename: backup.filename,
        size: backup.metadata.recordCounts,
        timestamp: backup.metadata.timestamp
      }
    });
  } catch (error) {
    console.error('System backup error:', error);
    res.status(500).json({ message: 'Error creating system backup' });
  }
});

// Data export
router.get('/export', async (req, res) => {
  try {
    const { format = 'json', dataType } = req.query;

    let data;
    switch (dataType) {
      case 'schools':
        data = await School.find().populate('subscription');
        break;
      case 'users':
        data = await User.find().select('-password').populate('schoolId', 'name emisNumber');
        break;
      case 'students':
        data = await Student.find().populate('schoolId', 'name emisNumber').populate('class', 'name grade');
        break;
      default:
        return res.status(400).json({ message: 'Invalid data type' });
    }

    if (format === 'csv') {
      const { Parser } = require('json2csv');
      const parser = new Parser();
      const csv = parser.parse(data);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${dataType}-export-${Date.now()}.csv`);
      return res.send(csv);
    }

    res.json({ data });
  } catch (error) {
    console.error('Data export error:', error);
    res.status(500).json({ message: 'Error exporting data' });
  }
});

async function checkDatabaseHealth() {
  try {
    // Test database connection and response time
    const startTime = Date.now();
    await require('mongoose').connection.db.admin().ping();
    const responseTime = Date.now() - startTime;

    return {
      status: 'healthy',
      responseTime: `${responseTime}ms`
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message
    };
  }
}

module.exports = router;