const express = require('express');
const School = require('../models/School');
const User = require('../models/User');
const Student = require('../models/Student');
const Class = require('../models/Class');
const auth = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const { auditLoggers } = require('../middleware/auditLogger');

const router = express.Router();

router.use(auth);

// Get school profile
router.get('/profile', async (req, res) => {
  try {
    const school = await School.findById(req.schoolId);
    
    if (!school) {
      return res.status(404).json({ message: 'School not found' });
    }

    // Get statistics
    const studentCount = await Student.countDocuments({ schoolId: req.schoolId });
    const teacherCount = await User.countDocuments({ 
      schoolId: req.schoolId, 
      role: { $in: ['teacher', 'hod'] } 
    });
    const classCount = await Class.countDocuments({ schoolId: req.schoolId });

    res.json({
      school,
      statistics: {
        students: studentCount,
        teachers: teacherCount,
        classes: classCount
      }
    });
  } catch (error) {
    console.error('School profile error:', error);
    res.status(500).json({ message: 'Error fetching school profile' });
  }
});

// Update school profile
router.put('/profile', [
  body('name').optional().trim().notEmpty().withMessage('School name cannot be empty'),
  body('province').optional().isIn(['Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal', 'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape', 'Western Cape']),
  body('contact.phone').optional().isMobilePhone().withMessage('Valid phone number required'),
  body('contact.email').optional().isEmail().withMessage('Valid email required')
], auditLoggers.updateUser(), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const school = await School.findByIdAndUpdate(
      req.schoolId,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!school) {
      return res.status(404).json({ message: 'School not found' });
    }

    res.json({
      message: 'School profile updated successfully',
      school
    });
  } catch (error) {
    console.error('School update error:', error);
    res.status(500).json({ message: 'Error updating school profile' });
  }
});

// Update academic settings
router.put('/settings', [
  body('academicYear').isInt({ min: 2020, max: 2030 }).withMessage('Valid academic year required'),
  body('terms.term1.start').isISO8601().withMessage('Valid start date required for Term 1'),
  body('terms.term1.end').isISO8601().withMessage('Valid end date required for Term 1'),
  body('terms.term2.start').isISO8601().withMessage('Valid start date required for Term 2'),
  body('terms.term2.end').isISO8601().withMessage('Valid end date required for Term 2'),
  body('terms.term3.start').isISO8601().withMessage('Valid start date required for Term 3'),
  body('terms.term3.end').isISO8601().withMessage('Valid end date required for Term 3'),
  body('terms.term4.start').isISO8601().withMessage('Valid start date required for Term 4'),
  body('terms.term4.end').isISO8601().withMessage('Valid end date required for Term 4')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const school = await School.findByIdAndUpdate(
      req.schoolId,
      { 
        $set: { 
          'settings.academicYear': req.body.academicYear,
          'settings.terms': req.body.terms
        } 
      },
      { new: true, runValidators: true }
    );

    if (!school) {
      return res.status(404).json({ message: 'School not found' });
    }

    // Log settings update
    await require('../models/AuditLog').create({
      action: 'SYSTEM_SETTINGS_UPDATE',
      userId: req.userId,
      schoolId: req.schoolId,
      details: {
        setting: 'academic_calendar',
        academicYear: req.body.academicYear
      },
      ip: req.ip
    });

    res.json({
      message: 'Academic settings updated successfully',
      settings: school.settings
    });
  } catch (error) {
    console.error('Settings update error:', error);
    res.status(500).json({ message: 'Error updating academic settings' });
  }
});

// Get school users (teachers, admin, etc.)
router.get('/users', async (req, res) => {
  try {
    const { role, page = 1, limit = 20, search } = req.query;
    
    let query = { schoolId: req.schoolId };
    
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .populate('classes', 'name grade')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ firstName: 1 });

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
    console.error('School users error:', error);
    res.status(500).json({ message: 'Error fetching school users' });
  }
});

// Create new user (teacher/admin)
router.post('/users', [
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['admin', 'principal', 'teacher', 'hod']).withMessage('Valid role is required')
], auditLoggers.createUser(), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstName, lastName, email, password, role, subjects, classes } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const user = new User({
      firstName,
      lastName,
      email,
      password,
      role,
      subjects: subjects || [],
      classes: classes || [],
      schoolId: req.schoolId
    });

    await user.save();

    // Don't send password in response
    const userResponse = await User.findById(user._id)
      .select('-password')
      .populate('classes', 'name grade');

    res.status(201).json({
      message: 'User created successfully',
      user: userResponse
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Error creating user' });
  }
});

// Update user
router.put('/users/:userId', [
  body('firstName').optional().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().notEmpty().withMessage('Last name cannot be empty'),
  body('role').optional().isIn(['admin', 'principal', 'teacher', 'hod']).withMessage('Valid role is required')
], auditLoggers.updateUser(), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId } = req.params;
    const updateData = { ...req.body };

    // Remove password from update data if present
    delete updateData.password;

    const user = await User.findOneAndUpdate(
      { _id: userId, schoolId: req.schoolId },
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password').populate('classes', 'name grade');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Error updating user' });
  }
});

// Get school classes with statistics
router.get('/classes', async (req, res) => {
  try {
    const { grade } = req.query;
    
    let query = { schoolId: req.schoolId };
    if (grade) query.grade = grade;

    const classes = await Class.find(query)
      .populate('teacherId', 'firstName lastName')
      .populate('subjects.teacherId', 'firstName lastName')
      .sort({ grade: 1, name: 1 });

    // Get student counts for each class
    const classesWithStats = await Promise.all(
      classes.map(async (classObj) => {
        const studentCount = await Student.countDocuments({ 
          class: classObj._id,
          schoolId: req.schoolId 
        });

        return {
          ...classObj.toObject(),
          studentCount
        };
      })
    );

    res.json(classesWithStats);
  } catch (error) {
    console.error('School classes error:', error);
    res.status(500).json({ message: 'Error fetching school classes' });
  }
});

// Get school statistics for dashboard
router.get('/statistics', async (req, res) => {
  try {
    const studentCount = await Student.countDocuments({ schoolId: req.schoolId });
    const teacherCount = await User.countDocuments({ 
      schoolId: req.schoolId, 
      role: { $in: ['teacher', 'hod'] } 
    });
    const classCount = await Class.countDocuments({ schoolId: req.schoolId });
    
    // Get grade distribution
    const gradeDistribution = await Student.aggregate([
      { $match: { schoolId: req.schoolId } },
      {
        $group: {
          _id: '$grade',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get recent activity count (last 7 days)
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentActivityCount = await require('../models/AuditLog').countDocuments({
      schoolId: req.schoolId,
      timestamp: { $gte: oneWeekAgo }
    });

    // Get assessment statistics
    const assessmentStats = await require('../models/Assessment').aggregate([
      { $match: { schoolId: req.schoolId } },
      {
        $group: {
          _id: '$term',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      overview: {
        students: studentCount,
        teachers: teacherCount,
        classes: classCount,
        recentActivity: recentActivityCount
      },
      gradeDistribution,
      assessmentStats,
      lastUpdated: new Date()
    });
  } catch (error) {
    console.error('School statistics error:', error);
    res.status(500).json({ message: 'Error fetching school statistics' });
  }
});

// Get parent requests (for verification)
router.get('/parent-requests', async (req, res) => {
  try {
    const parents = await require('../models/Parent').find({
      schoolId: req.schoolId,
      'students.isVerified': false
    })
    .populate('students.studentId', 'firstName lastName studentNumber grade class')
    .sort({ createdAt: -1 });

    res.json(parents);
  } catch (error) {
    console.error('Parent requests error:', error);
    res.status(500).json({ message: 'Error fetching parent requests' });
  }
});

// Verify parent access
router.put('/parent-requests/:parentId/verify', [
  body('studentId').notEmpty().withMessage('Student ID is required'),
  body('verify').isBoolean().withMessage('Verify must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { parentId } = req.params;
    const { studentId, verify } = req.body;

    const parent = await require('../models/Parent').findOne({
      _id: parentId,
      schoolId: req.schoolId
    });

    if (!parent) {
      return res.status(404).json({ message: 'Parent request not found' });
    }

    // Update verification status
    const studentIndex = parent.students.findIndex(
      s => s.studentId.toString() === studentId
    );

    if (studentIndex === -1) {
      return res.status(404).json({ message: 'Student not found in parent request' });
    }

    parent.students[studentIndex].isVerified = verify;
    await parent.save();

    // Send notification email to parent
    if (verify) {
      const emailService = require('../services/emailService');
      const student = await require('../models/Student').findById(studentId);
      
      await emailService.sendParentVerificationApproval(
        parent.email,
        parent.firstName,
        `${student.firstName} ${student.lastName}`
      );
    }

    res.json({
      message: `Parent access ${verify ? 'approved' : 'revoked'} successfully`,
      parent: {
        id: parent._id,
        name: `${parent.firstName} ${parent.lastName}`,
        students: parent.students
      }
    });
  } catch (error) {
    console.error('Parent verification error:', error);
    res.status(500).json({ message: 'Error processing parent verification' });
  }
});

module.exports = router;