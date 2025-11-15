const express = require('express');
const Assessment = require('../models/Assessment');
const AssessmentResult = require('../models/AssessmentResult');
const auth = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

router.use(auth);

// Create assessment
router.post('/', [
  body('title').notEmpty().withMessage('Title is required'),
  body('subject').notEmpty().withMessage('Subject is required'),
  body('assessmentType').isIn(['Test', 'Exam', 'Assignment', 'Practical', 'Project']),
  body('term').isInt({ min: 1, max: 4 }),
  body('maxMarks').isInt({ min: 1 }),
  body('classId').notEmpty().withMessage('Class is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const assessment = new Assessment({
      ...req.body,
      schoolId: req.schoolId,
      teacherId: req.userId
    });
    await assessment.save();
    res.status(201).json(assessment);
  } catch (error) {
    res.status(500).json({ message: 'Error creating assessment', error: error.message });
  }
});

// Enter marks for assessment
router.post('/:assessmentId/marks', [
  body('results').isArray().withMessage('Results array is required')
], async (req, res) => {
  try {
    const { assessmentId } = req.params;
    const { results } = req.body;

    const assessment = await Assessment.findOne({ 
      _id: assessmentId, 
      schoolId: req.schoolId 
    });
    
    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    // Create assessment results
    const assessmentResults = results.map(result => ({
      assessmentId,
      studentId: result.studentId,
      marks: result.marks,
      schoolId: req.schoolId
    }));

    await AssessmentResult.insertMany(assessmentResults, { ordered: false });
    
    res.json({ message: 'Marks saved successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error saving marks', error: error.message });
  }
});

// Get assessments for class
router.get('/', async (req, res) => {
  try {
    const { classId, term, subject } = req.query;
    
    let query = { schoolId: req.schoolId };
    if (classId) query.classId = classId;
    if (term) query.term = parseInt(term);
    if (subject) query.subject = subject;

    const assessments = await Assessment.find(query)
      .populate('classId')
      .sort({ date: -1 });

    res.json(assessments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching assessments', error: error.message });
  }
});

module.exports = router;