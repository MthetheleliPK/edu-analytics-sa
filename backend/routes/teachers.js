const express = require('express');
const User = require('../models/User');
const Class = require('../models/Class');
const Assessment = require('../models/Assessment');
const AssessmentResult = require('../models/AssessmentResult');
const Student = require('../models/Student');
const auth = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const { auditLoggers } = require('../middleware/auditLogger');

const router = express.Router();

router.use(auth);

// Get teacher's classes and subjects
router.get('/my-classes', async (req, res) => {
  try {
    const classes = await Class.find({
      $or: [
        { teacherId: req.userId },
        { 'subjects.teacherId': req.userId }
      ],
      schoolId: req.schoolId
    })
    .populate('students', 'firstName lastName studentNumber')
    .sort({ grade: 1, name: 1 });

    // Get student counts for each class
    const classesWithStats = await Promise.all(
      classes.map(async (classObj) => {
        const studentCount = await Student.countDocuments({ 
          class: classObj._id,
          schoolId: req.schoolId 
        });

        const recentAssessments = await Assessment.countDocuments({
          classId: classObj._id,
          teacherId: req.userId,
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        });

        return {
          ...classObj.toObject(),
          studentCount,
          recentAssessments
        };
      })
    );

    res.json(classesWithStats);
  } catch (error) {
    console.error('Teacher classes error:', error);
    res.status(500).json({ message: 'Error fetching teacher classes' });
  }
});

// Get teacher's dashboard statistics
router.get('/dashboard', async (req, res) => {
  try {
    const teacher = await User.findById(req.userId);
    
    // Get class count
    const classCount = await Class.countDocuments({
      $or: [
        { teacherId: req.userId },
        { 'subjects.teacherId': req.userId }
      ],
      schoolId: req.schoolId
    });

    // Get student count across all classes
    const teacherClasses = await Class.find({
      $or: [
        { teacherId: req.userId },
        { 'subjects.teacherId': req.userId }
      ],
      schoolId: req.schoolId
    }).select('_id');

    const classIds = teacherClasses.map(c => c._id);
    const studentCount = await Student.countDocuments({
      class: { $in: classIds },
      schoolId: req.schoolId
    });

    // Get recent assessments
    const recentAssessments = await Assessment.find({
      teacherId: req.userId,
      schoolId: req.schoolId
    })
    .populate('classId', 'name grade')
    .sort({ date: -1 })
    .limit(5);

    // Get marks entry statistics
    const marksStats = await AssessmentResult.aggregate([
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
        $match: {
          'assessment.teacherId': req.userId,
          'assessment.schoolId': req.schoolId
        }
      },
      {
        $group: {
          _id: null,
          totalMarks: { $sum: 1 },
          averagePercentage: { $avg: '$percentage' }
        }
      }
    ]);

    res.json({
      teacher: {
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        subjects: teacher.subjects,
        role: teacher.role
      },
      statistics: {
        classes: classCount,
        students: studentCount,
        totalMarks: marksStats[0]?.totalMarks || 0,
        averagePercentage: marksStats[0]?.averagePercentage || 0
      },
      recentAssessments,
      upcomingTasks: [] // Could be populated with deadlines
    });
  } catch (error) {
    console.error('Teacher dashboard error:', error);
    res.status(500).json({ message: 'Error fetching teacher dashboard' });
  }
});

// Get students for a specific class
router.get('/classes/:classId/students', async (req, res) => {
  try {
    const { classId } = req.params;

    // Verify teacher has access to this class
    const classObj = await Class.findOne({
      _id: classId,
      schoolId: req.schoolId,
      $or: [
        { teacherId: req.userId },
        { 'subjects.teacherId': req.userId }
      ]
    });

    if (!classObj) {
      return res.status(403).json({ message: 'Access denied to this class' });
    }

    const students = await Student.find({
      class: classId,
      schoolId: req.schoolId
    })
    .select('firstName lastName studentNumber gender dateOfBirth')
    .sort({ firstName: 1 });

    res.json(students);
  } catch (error) {
    console.error('Class students error:', error);
    res.status(500).json({ message: 'Error fetching class students' });
  }
});

// Get teacher's assessments
router.get('/assessments', async (req, res) => {
  try {
    const { classId, term, subject, page = 1, limit = 20 } = req.query;
    
    let query = { 
      teacherId: req.userId,
      schoolId: req.schoolId 
    };

    if (classId) query.classId = classId;
    if (term) query.term = parseInt(term);
    if (subject) query.subject = subject;

    const assessments = await Assessment.find(query)
      .populate('classId', 'name grade')
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Assessment.countDocuments(query);

    res.json({
      assessments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Teacher assessments error:', error);
    res.status(500).json({ message: 'Error fetching assessments' });
  }
});

// Bulk marks entry
router.post('/assessments/:assessmentId/marks/bulk', [
  body('results').isArray().withMessage('Results array is required'),
  body('results.*.studentId').notEmpty().withMessage('Student ID is required'),
  body('results.*.marks').isNumeric().withMessage('Marks must be numeric')
], auditLoggers.enterMarks(), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { assessmentId } = req.params;
    const { results } = req.body;

    // Verify assessment belongs to teacher
    const assessment = await Assessment.findOne({
      _id: assessmentId,
      teacherId: req.userId,
      schoolId: req.schoolId
    });

    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found or access denied' });
    }

    // Prepare assessment results
    const assessmentResults = results.map(result => ({
      assessmentId,
      studentId: result.studentId,
      marks: result.marks,
      schoolId: req.schoolId,
      comment: result.comment || ''
    }));

    // Use bulk write for better performance
    const bulkOps = assessmentResults.map(result => ({
      updateOne: {
        filter: {
          assessmentId: result.assessmentId,
          studentId: result.studentId
        },
        update: { $set: result },
        upsert: true
      }
    }));

    await AssessmentResult.bulkWrite(bulkOps);

    // Send notifications to parents if enabled
    if (process.env.SMS_PROVIDER || process.env.SMTP_HOST) {
      try {
        const smsService = require('../services/smsService');
        const emailService = require('../services/emailService');
        
        for (const result of results) {
          const student = await Student.findById(result.studentId)
            .populate('contact');
          
          if (student.contact?.parentPhone && student.contact.parentPhone !== '') {
            await smsService.sendAssessmentNotification(
              student.contact.parentPhone,
              `${student.firstName} ${student.lastName}`,
              assessment,
              result.marks,
              (result.marks / assessment.maxMarks * 100).toFixed(1)
            );
          }

          if (student.contact?.parentEmail && student.contact.parentEmail !== '') {
            await emailService.sendAssessmentResults(
              student.contact.parentEmail,
              student.contact.parentName || 'Parent',
              `${student.firstName} ${student.lastName}`,
              assessment,
              result.marks,
              (result.marks / assessment.maxMarks * 100).toFixed(1)
            );
          }
        }
      } catch (notificationError) {
        console.error('Notification error:', notificationError);
        // Don't fail the marks entry if notifications fail
      }
    }

    res.json({ 
      message: 'Marks saved successfully',
      resultsCount: results.length
    });
  } catch (error) {
    console.error('Bulk marks error:', error);
    res.status(500).json({ message: 'Error saving marks' });
  }
});

// Get marks for an assessment
router.get('/assessments/:assessmentId/marks', async (req, res) => {
  try {
    const { assessmentId } = req.params;

    // Verify assessment belongs to teacher
    const assessment = await Assessment.findOne({
      _id: assessmentId,
      teacherId: req.userId,
      schoolId: req.schoolId
    }).populate('classId', 'name grade');

    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found or access denied' });
    }

    // Get students in the class
    const students = await Student.find({
      class: assessment.classId,
      schoolId: req.schoolId
    }).select('firstName lastName studentNumber');

    // Get existing marks
    const existingMarks = await AssessmentResult.find({
      assessmentId: assessmentId
    });

    // Combine student data with marks
    const marksData = students.map(student => {
      const existingResult = existingMarks.find(mark => 
        mark.studentId.toString() === student._id.toString()
      );

      return {
        studentId: student._id,
        studentNumber: student.studentNumber,
        firstName: student.firstName,
        lastName: student.lastName,
        marks: existingResult?.marks || '',
        percentage: existingResult?.percentage || 0,
        comment: existingResult?.comment || ''
      };
    });

    res.json({
      assessment,
      marks: marksData
    });
  } catch (error) {
    console.error('Get marks error:', error);
    res.status(500).json({ message: 'Error fetching marks' });
  }
});

// Get teacher's performance analytics
router.get('/analytics/class-performance', async (req, res) => {
  try {
    const { classId, subject, term } = req.query;

    let matchStage = {
      schoolId: req.schoolId
    };

    // Build teacher-specific filter
    const teacherClasses = await Class.find({
      schoolId: req.schoolId,
      $or: [
        { teacherId: req.userId },
        { 'subjects.teacherId': req.userId }
      ]
    }).select('_id');

    const accessibleClassIds = teacherClasses.map(c => c._id);
    matchStage['assessment.classId'] = { $in: accessibleClassIds };

    if (classId) matchStage['assessment.classId'] = classId;
    if (subject) matchStage['assessment.subject'] = subject;
    if (term) matchStage['assessment.term'] = parseInt(term);

    const analytics = await AssessmentResult.aggregate([
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
        $match: matchStage
      },
      {
        $lookup: {
          from: 'classes',
          localField: 'assessment.classId',
          foreignField: '_id',
          as: 'class'
        }
      },
      { $unwind: '$class' },
      {
        $group: {
          _id: {
            classId: '$assessment.classId',
            className: '$class.name',
            subject: '$assessment.subject',
            term: '$assessment.term'
          },
          averagePercentage: { $avg: '$percentage' },
          totalStudents: { $addToSet: '$studentId' },
          totalAssessments: { $addToSet: '$assessmentId' },
          atRiskCount: {
            $sum: {
              $cond: [{ $lt: ['$percentage', 50] }, 1, 0]
            }
          }
        }
      },
      {
        $project: {
          className: '$_id.className',
          subject: '$_id.subject',
          term: '$_id.term',
          averagePercentage: { $round: ['$averagePercentage', 1] },
          studentCount: { $size: '$totalStudents' },
          assessmentCount: { $size: '$totalAssessments' },
          atRiskCount: 1
        }
      },
      { $sort: { '$_id.term': 1, '$_id.subject': 1 } }
    ]);

    res.json(analytics);
  } catch (error) {
    console.error('Teacher analytics error:', error);
    res.status(500).json({ message: 'Error fetching analytics' });
  }
});

module.exports = router;