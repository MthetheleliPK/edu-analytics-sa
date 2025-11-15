const express = require('express');
const PDFService = require('../services/pdfService');
const AssessmentResult = require('../models/AssessmentResult');
const Student = require('../models/Student');
const auth = require('../middleware/auth');

const router = express.Router();

router.use(auth);

// Generate student report
router.get('/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { term } = req.query;

    // Get student data
    const student = await Student.findById(studentId)
      .populate('class')
      .populate('schoolId');

    if (!student || student.schoolId._id.toString() !== req.schoolId) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Get assessment results
    let matchStage = { 
      studentId: student._id,
      schoolId: req.schoolId 
    };
    
    if (term) {
      const assessments = await require('../models/Assessment').find({
        schoolId: req.schoolId,
        term: parseInt(term)
      });
      matchStage.assessmentId = { $in: assessments.map(a => a._id) };
    }

    const assessmentResults = await AssessmentResult.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: 'assessments',
          localField: 'assessmentId',
          foreignField: '_id',
          as: 'assessment'
        }
      },
      { $unwind: '$assessment' }
    ]);

    // Calculate overall stats
    const overallAverage = assessmentResults.length > 0 
      ? assessmentResults.reduce((sum, result) => sum + result.percentage, 0) / assessmentResults.length
      : 0;

    const stats = {
      average: overallAverage,
      totalAssessments: assessmentResults.length
    };

    // Generate PDF
    const pdfBuffer = await PDFService.generateStudentReport(
      student, 
      assessmentResults.map(r => ({
        ...r.assessment,
        marks: r.marks,
        percentage: r.percentage
      })), 
      stats
    );

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 
      `attachment; filename="${student.firstName}_${student.lastName}_report.pdf"`);
    
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Report generation error:', error);
    res.status(500).json({ message: 'Error generating report' });
  }
});

// Generate class report
router.get('/class/:classId', async (req, res) => {
  try {
    const { classId } = req.params;
    const { term } = req.query;

    // Get class and students
    const students = await Student.find({ 
      class: classId, 
      schoolId: req.schoolId 
    }).populate('class');

    // Get class performance data
    const classStats = await AssessmentResult.aggregate([
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
          'assessment.classId': require('mongoose').Types.ObjectId(classId),
          'assessment.schoolId': require('mongoose').Types.ObjectId(req.schoolId),
          ...(term && { 'assessment.term': parseInt(term) })
        }
      },
      {
        $group: {
          _id: '$studentId',
          average: { $avg: '$percentage' }
        }
      }
    ]);

    const studentAverages = students.map(student => {
      const stats = classStats.find(s => s._id.toString() === student._id.toString());
      return {
        ...student.toObject(),
        average: stats?.average || 0
      };
    });

    const classAverage = classStats.length > 0
      ? classStats.reduce((sum, s) => sum + s.average, 0) / classStats.length
      : 0;

    const stats = {
      classAverage,
      topStudent: studentAverages.length > 0 
        ? `${studentAverages[0].firstName} ${studentAverages[0].lastName}`
        : 'N/A',
      topAverage: studentAverages.length > 0 ? studentAverages[0].average : 0,
      atRiskCount: studentAverages.filter(s => s.average < 50).length
    };

    // Generate PDF
    const pdfBuffer = await PDFService.generateClassReport(
      students[0]?.class?.name || 'Class',
      studentAverages.sort((a, b) => b.average - a.average),
      [],
      stats
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 
      `attachment; filename="class_${students[0]?.class?.name}_report.pdf"`);
    
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Class report error:', error);
    res.status(500).json({ message: 'Error generating class report' });
  }
});

module.exports = router;