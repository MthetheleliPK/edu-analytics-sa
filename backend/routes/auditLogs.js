const express = require('express');
const AuditLog = require('../models/AuditLog');
const auth = require('../middleware/auth');

const router = express.Router();

router.use(auth);

// Get audit logs with filtering and pagination
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      action,
      userId,
      startDate,
      endDate,
      status
    } = req.query;

    const query = { schoolId: req.schoolId };

    // Apply filters
    if (action) query.action = action;
    if (userId) query.userId = userId;
    if (status) query.status = status;
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const logs = await AuditLog.find(query)
      .populate('userId', 'firstName lastName email role')
      .sort({ timestamp: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await AuditLog.countDocuments(query);

    // Get action statistics
    const actionStats = await AuditLog.aggregate([
      { $match: { schoolId: req.schoolId, timestamp: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 },
          lastActivity: { $max: '$timestamp' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      logs,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      },
      statistics: {
        actionStats,
        totalActions: total,
        successRate: total > 0 ? ((await AuditLog.countDocuments({ ...query, status: 'SUCCESS' })) / total * 100).toFixed(1) : 0
      }
    });
  } catch (error) {
    console.error('Audit log fetch error:', error);
    res.status(500).json({ message: 'Error fetching audit logs' });
  }
});

// Get audit log statistics for dashboard
router.get('/statistics', async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const stats = await AuditLog.aggregate([
      {
        $match: {
          schoolId: req.schoolId,
          timestamp: { $gte: thirtyDaysAgo }
        }
      },
      {
        $facet: {
          dailyActivity: [
            {
              $group: {
                _id: {
                  $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
                },
                count: { $sum: 1 },
                uniqueUsers: { $addToSet: '$userId' }
              }
            },
            { $sort: { _id: 1 } },
            { $limit: 30 }
          ],
          topActions: [
            {
              $group: {
                _id: '$action',
                count: { $sum: 1 }
              }
            },
            { $sort: { count: -1 } },
            { $limit: 10 }
          ],
          userActivity: [
            {
              $group: {
                _id: '$userId',
                count: { $sum: 1 },
                lastActivity: { $max: '$timestamp' }
              }
            },
            {
              $lookup: {
                from: 'users',
                localField: '_id',
                foreignField: '_id',
                as: 'user'
              }
            },
            { $unwind: '$user' },
            { $sort: { count: -1 } },
            { $limit: 10 }
          ],
          successRate: [
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 }
              }
            }
          ]
        }
      }
    ]);

    res.json(stats[0]);
  } catch (error) {
    console.error('Audit statistics error:', error);
    res.status(500).json({ message: 'Error fetching audit statistics' });
  }
});

// Export audit logs
router.get('/export', async (req, res) => {
  try {
    const { format = 'json', startDate, endDate } = req.query;

    const query = { schoolId: req.schoolId };
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const logs = await AuditLog.find(query)
      .populate('userId', 'firstName lastName email role')
      .sort({ timestamp: -1 })
      .lean();

    if (format === 'csv') {
      const { Parser } = require('json2csv');
      const fields = [
        'timestamp',
        'action',
        'user.firstName',
        'user.lastName',
        'user.role',
        'status',
        'ip',
        'details'
      ];
      
      const parser = new Parser({ fields });
      const csv = parser.parse(logs);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=audit-logs-${Date.now()}.csv`);
      return res.send(csv);
    }

    res.json({ logs });
  } catch (error) {
    console.error('Audit export error:', error);
    res.status(500).json({ message: 'Error exporting audit logs' });
  }
});

module.exports = router;