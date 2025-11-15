const express = require('express');
const AssessmentResult = require('../models/AssessmentResult');
const Student = require('../models/Student');
const Assessment = require('../models/Assessment');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');

const router = express.Router();

router.use(auth);

// Get class performance analytics
router.get('/class-performance', async (req, res) => {
  try {
    const { grade, classId, term, subject } = req.query;
    const schoolId = req.schoolId;

    let matchStage = { schoolId: mongoose.Types.ObjectId(schoolId) };
    
    if (grade) matchStage.grade = grade;
    if (classId) matchStage.classId = mongoose.Types.ObjectId(classId);
    if (term) matchStage.term = parseInt(term);
    if (subject) matchStage.subject = subject;

    const assessments = await Assessment.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: 'assessmentresults',
          localField: '_id',
          foreignField: 'assessmentId',
          as: 'results'
        }
      },
      {
        $unwind: '$results'
      },
      {
        $group: {
          _id: {
            classId: '$classId',
            subject: '$subject',
            assessmentType: '$assessmentType'
          },
          averagePercentage: { $avg: '$results.percentage' },
          totalStudents: { $sum: 1 },
          totalAssessments: { $addToSet: '$_id' }
        }
      },
      {
        $group: {
          _id: {
            classId: '$_id.classId',
            subject: '$_id.subject'
          },
          overallAverage: { $avg: '$averagePercentage' },
          assessmentBreakdown: {
            $push: {
              type: '$_id.assessmentType',
              average: '$averagePercentage'
            }
          },
          totalAssessments: { $sum: { $size: '$totalAssessments' } }
        }
      },
      {
        $lookup: {
          from: 'classes',
          localField: '_id.classId',
          foreignField: '_id',
          as: 'class'
        }
      },
      {
        $unwind: '$class'
      }
    ]);

    res.json(assessments);
  } catch (error) {
    console.error('Error fetching class performance:', error);
    res.status(500).json({ message: 'Error fetching class performance', error: error.message });
  }
});

// Get student progress
router.get('/student-progress', async (req, res) => {
  try {
    const { studentId, subject } = req.query;
    const schoolId = req.schoolId;

    const progress = await AssessmentResult.aggregate([
      {
        $match: {
          schoolId: mongoose.Types.ObjectId(schoolId),
          studentId: mongoose.Types.ObjectId(studentId)
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
      {
        $unwind: '$assessment'
      },
      {
        $match: subject ? { 'assessment.subject': subject } : {}
      },
      {
        $group: {
          _id: {
            term: '$assessment.term',
            subject: '$assessment.subject'
          },
          average: { $avg: '$percentage' },
          assessments: {
            $push: {
              title: '$assessment.title',
              type: '$assessment.assessmentType',
              marks: '$marks',
              percentage: '$percentage',
              date: '$assessment.date'
            }
          }
        }
      },
      {
        $sort: { '_id.term': 1 }
      }
    ]);

    res.json(progress);
  } catch (error) {
    console.error('Error fetching student progress:', error);
    res.status(500).json({ message: 'Error fetching student progress', error: error.message });
  }
});

// Get at-risk students
router.get('/at-risk-students', async (req, res) => {
  try {
    const { grade, threshold = 50, term } = req.query;
    const schoolId = req.schoolId;

    const atRiskStudents = await AssessmentResult.aggregate([
      {
        $lookup: {
          from: 'assessments',
          localField: 'assessmentId',
          foreignField: '_id',
          as: 'assessment'
        }
      },
      {
        $unwind: '$assessment'
      },
      {
        $match: {
          'assessment.schoolId': mongoose.Types.ObjectId(schoolId),
          'assessment.term': term ? parseInt(term) : { $exists: true }
        }
      },
      {
        $lookup: {
          from: 'students',
          localField: 'studentId',
          foreignField: '_id',
          as: 'student'
        }
      },
      {
        $unwind: '$student'
      },
      {
        $match: grade ? { 'student.grade': grade } : {}
      },
      {
        $group: {
          _id: '$studentId',
          student: { $first: '$student' },
          averagePercentage: { $avg: '$percentage' },
          subjects: {
            $addToSet: {
              subject: '$assessment.subject',
              average: '$percentage'
            }
          }
        }
      },
      {
        $match: {
          averagePercentage: { $lt: parseFloat(threshold) }
        }
      },
      {
        $project: {
          'student.studentNumber': 1,
          'student.firstName': 1,
          'student.lastName': 1,
          'student.grade': 1,
          'student.class': 1,
          averagePercentage: 1,
          weakSubjects: {
            $filter: {
              input: '$subjects',
              as: 'subject',
              cond: { $lt: ['$$subject.average', parseFloat(threshold)] }
            }
          }
        }
      }
    ]);

    res.json(atRiskStudents);
  } catch (error) {
    console.error('Error identifying at-risk students:', error);
    res.status(500).json({ message: 'Error identifying at-risk students', error: error.message });
  }
});

// Get school overview
router.get('/school-overview', async (req, res) => {
  try {
    const schoolId = req.schoolId;

    const overview = await AssessmentResult.aggregate([
      {
        $lookup: {
          from: 'assessments',
          localField: 'assessmentId',
          foreignField: '_id',
          as: 'assessment'
        }
      },
      {
        $unwind: '$assessment'
      },
      {
        $match: {
          'assessment.schoolId': mongoose.Types.ObjectId(schoolId)
        }
      },
      {
        $facet: {
          overallStats: [
            {
              $group: {
                _id: null,
                totalAssessments: { $addToSet: '$assessmentId' },
                averagePercentage: { $avg: '$percentage' },
                totalStudents: { $addToSet: '$studentId' }
              }
            }
          ],
          gradePerformance: [
            {
              $lookup: {
                from: 'students',
                localField: 'studentId',
                foreignField: '_id',
                as: 'student'
              }
            },
            {
              $unwind: '$student'
            },
            {
              $group: {
                _id: '$student.grade',
                average: { $avg: '$percentage' },
                studentCount: { $addToSet: '$studentId' }
              }
            }
          ],
          subjectPerformance: [
            {
              $group: {
                _id: '$assessment.subject',
                average: { $avg: '$percentage' },
                assessmentCount: { $sum: 1 }
              }
            }
          ]
        }
      }
    ]);

    const stats = {
      overallAverage: overview[0].overallStats[0]?.averagePercentage || 0,
      totalAssessments: overview[0].overallStats[0]?.totalAssessments?.length || 0,
      totalStudents: overview[0].overallStats[0]?.totalStudents?.length || 0,
      gradePerformance: overview[0].gradePerformance,
      subjectPerformance: overview[0].subjectPerformance
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching school overview:', error);
    res.status(500).json({ message: 'Error fetching school overview', error: error.message });
  }
});

module.exports = router;