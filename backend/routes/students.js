const express = require('express');
const Student = require('../models/Student');
const auth = require('../middleware/auth');
const { body } = require('express-validator');

const router = express.Router();

router.use(auth);

// Get all students for school
router.get('/', async (req, res) => {
  try {
    const { grade, class: classId, page = 1, limit = 20 } = req.query;
    
    let query = { schoolId: req.schoolId };
    if (grade) query.grade = grade;
    if (classId) query.class = classId;

    const students = await Student.find(query)
      .populate('class')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ firstName: 1 });

    const total = await Student.countDocuments(query);

    res.json({
      students,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching students', error: error.message });
  }
});

// Create new student
router.post('/', [
  body('studentNumber').notEmpty().withMessage('Student number is required'),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('grade').isIn(['8', '9', '10', '11', '12']).withMessage('Valid grade is required'),
  body('class').notEmpty().withMessage('Class is required')
], async (req, res) => {
  try {
    const studentData = {
      ...req.body,
      schoolId: req.schoolId
    };

    const student = new Student(studentData);
    await student.save();
    
    await student.populate('class');
    res.status(201).json(student);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Student number already exists' });
    }
    res.status(500).json({ message: 'Error creating student', error: error.message });
  }
});

// Bulk create students
router.post('/bulk', async (req, res) => {
  try {
    const students = req.body;
    const studentsWithSchool = students.map(student => ({
      ...student,
      schoolId: req.schoolId
    }));

    const result = await Student.insertMany(studentsWithSchool, { ordered: false });
    res.status(201).json({ message: `${result.length} students created successfully` });
  } catch (error) {
    res.status(500).json({ message: 'Error creating students', error: error.message });
  }
});

module.exports = router;