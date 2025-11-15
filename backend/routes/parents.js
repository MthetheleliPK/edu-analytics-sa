const express = require('express');
const { body, validationResult } = require('express-validator');
const Parent = require('../models/Parent');
const Student = require('../models/Student');
const AssessmentResult = require('../models/AssessmentResult');
const auth = require('../middleware/auth');
const { auditLoggers } = require('../middleware/auditLogger');
const emailService = require('../services/emailService');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Parent registration
router.post('/register', [
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('studentNumber').notEmpty().withMessage('Student number is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstName, lastName, email, phone, password, studentNumber, relationship } = req.body;

    // Find student by student number
    const student = await Student.findOne({ studentNumber })
      .populate('schoolId')
      .populate('class');

    if (!student) {
      return res.status(404).json({ message: 'Student not found with provided student number' });
    }

    // Check if parent already exists
    let parent = await Parent.findOne({ email });
    if (parent) {
      // Add student to existing parent
      const existingStudent = parent.students.find(s => 
        s.studentId.toString() === student._id.toString()
      );
      
      if (existingStudent) {
        return res.status(400).json({ message: 'You are already registered for this student' });
      }

      parent.students.push({
        studentId: student._id,
        relationship: relationship || 'Parent',
        isVerified: false
      });

      await parent.save();
    } else {
      // Create new parent
      parent = new Parent({
        firstName,
        lastName,
        email,
        phone,
        password,
        schoolId: student.schoolId._id,
        students: [{
          studentId: student._id,
          relationship: relationship || 'Parent',
          isVerified: false
        }]
      });

      await parent.save();
    }

    // Send verification email to school admin
    await emailService.sendParentVerificationRequest(
      student.schoolId.contact.email,
      parent,
      student
    );

    // Log the registration
    await require('../models/AuditLog').create({
      action: 'PARENT_REGISTER',
      userId: parent._id,
      schoolId: student.schoolId._id,
      details: {
        parentEmail: parent.email,
        studentName: `${student.firstName} ${student.lastName}`,
        studentNumber: student.studentNumber
      },
      ip: req.ip
    });

    res.status(201).json({ 
      message: 'Registration successful. Please wait for verification from the school.',
      parent: {
        id: parent._id,
        firstName: parent.firstName,
        lastName: parent.lastName,
        email: parent.email
      }
    });
  } catch (error) {
    console.error('Parent registration error:', error);
    res.status(500).json({ message: 'Error during parent registration' });
  }
});

// Parent login
router.post('/login', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    const parent = await Parent.findOne({ email })
      .populate('students.studentId')
      .populate('schoolId');

    if (!parent || !(await parent.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!parent.isActive) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    // Check if parent has any verified students
    const hasVerifiedStudents = parent.students.some(student => student.isVerified);
    if (!hasVerifiedStudents) {
      return res.status(401).json({ 
        message: 'Your account is pending verification by the school' 
      });
    }

    // Update last login
    parent.lastLogin = new Date();
    await parent.save();

    // Generate token
    const token = jwt.sign(
      { parentId: parent._id }, 
      process.env.JWT_SECRET || 'edu-analytics-secret',
      { expiresIn: '30d' }
    );

    // Log login
    await require('../models/AuditLog').create({
      action: 'PARENT_LOGIN',
      userId: parent._id,
      schoolId: parent.schoolId._id,
      ip: req.ip
    });

    res.json({
      message: 'Login successful',
      token,
      parent: {
        id: parent._id,
        firstName: parent.firstName,
        lastName: parent.lastName,
        email: parent.email,
        students: parent.students.filter(s => s.isVerified).map(s => ({
          studentId: s.studentId._id,
          firstName: s.studentId.firstName,
          lastName: s.studentId.lastName,
          grade: s.studentId.grade,
          class: s.studentId.class,
          relationship: s.relationship
        }))
      },
      school: parent.schoolId
    });
  } catch (error) {
    console.error('Parent login error:', error);
    res.status(500).json({ message: 'Error during parent login' });
  }
});

// Get parent dashboard data
router.get('/dashboard', auth, async (req, res) => {
  try {
    const parent = await Parent.findById(req.parentId)
      .populate('students.studentId')
      .populate('schoolId');

    if (!parent) {
      return res.status(404).json({ message: 'Parent not found' });
    }

    // Get recent assessments for all verified students
    const studentIds = parent.students
      .filter(s => s.isVerified)
      .map(s => s.studentId._id);

    const recentAssessments = await AssessmentResult.aggregate([
      {
        $match: {
          studentId: { $in: studentIds },
          schoolId: parent.schoolId._id
        }
      },
      {
        $lookup: {
          from: 'assessments',
          localField: 'assessmentId',
          foreignField: '_id',
          as: 'assessment'
        }
      },
      { $unwind: '$assessment' },
      {
        $lookup: {
          from: 'students',
          localField: 'studentId',
          foreignField: '_id',
          as: 'student'
        }
      },
      { $unwind: '$student' },
      {
        $sort: { 'assessment.date': -1 }
      },
      {
        $limit: 10
      },
      {
        $project: {
          studentName: { $concat: ['$student.firstName', ' ', '$student.lastName'] },
          title: '$assessment.title',
          subject: '$assessment.subject',
          marks: '$marks',
          percentage: '$percentage',
          maxMarks: '$assessment.maxMarks',
          date: '$assessment.date',
          type: '$assessment.assessmentType'
        }
      }
    ]);

    // Get student performance overview
    const studentPerformance = await AssessmentResult.aggregate([
      {
        $match: {
          studentId: { $in: studentIds },
          schoolId: parent.schoolId._id
        }
      },
      {
        $group: {
          _id: '$studentId',
          averagePercentage: { $avg: '$percentage' },
          totalAssessments: { $sum: 1 },
          lastAssessment: { $max: '$createdAt' }
        }
      },
      {
        $lookup: {
          from: 'students',
          localField: '_id',
          foreignField: '_id',
          as: 'student'
        }
      },
      { $unwind: '$student' }
    ]);

    res.json({
      parent: {
        firstName: parent.firstName,
        lastName: parent.lastName,
        email: parent.email,
        students: parent.students.filter(s => s.isVerified).map(s => ({
          studentId: s.studentId._id,
          firstName: s.studentId.firstName,
          lastName: s.studentId.lastName,
          grade: s.studentId.grade,
          class: s.studentId.class,
          relationship: s.relationship
        }))
      },
      recentAssessments,
      studentPerformance,
      school: {
        name: parent.schoolId.name,
        contact: parent.schoolId.contact
      }
    });
  } catch (error) {
    console.error('Parent dashboard error:', error);
    res.status(500).json({ message: 'Error fetching parent dashboard' });
  }
});

// Get student detailed report
router.get('/students/:studentId/report', auth, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { term } = req.query;

    const parent = await Parent.findById(req.parentId);
    if (!parent) {
      return res.status(404).json({ message: 'Parent not found' });
    }

    // Verify parent has access to this student
    const studentAccess = parent.students.find(s => 
      s.studentId.toString() === studentId && s.isVerified
    );
    
    if (!studentAccess) {
      return res.status(403).json({ message: 'Access denied to this student' });
    }

    // Get student performance data
    const performanceData = await AssessmentResult.aggregate([
      {
        $match: {
          studentId: require('mongoose').Types.ObjectId(studentId),
          schoolId: parent.schoolId
        }
      },
      {
        $lookup: {
          from: 'assessments',
          localField: 'assessmentId',
          foreignField: '_id',
          as: 'assessment'
        }
      },
      { $unwind: '$assessment' },
      ...(term ? [{ $match: { 'assessment.term': parseInt(term) } }] : []),
      {
        $group: {
          _id: {
            subject: '$assessment.subject',
            term: '$assessment.term'
          },
          average: { $avg: '$percentage' },
          assessments: {
            $push: {
              title: '$assessment.title',
              type: '$assessment.assessmentType',
              marks: '$marks',
              percentage: '$percentage',
              maxMarks: '$assessment.maxMarks',
              date: '$assessment.date'
            }
          }
        }
      },
      {
        $sort: { '_id.term': 1, '_id.subject': 1 }
      }
    ]);

    res.json({ performanceData });
  } catch (error) {
    console.error('Student report error:', error);
    res.status(500).json({ message: 'Error fetching student report' });
  }
});

module.exports = router;