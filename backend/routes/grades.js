const express = require('express');
const Class = require('../models/Class');
const auth = require('../middleware/auth');

const router = express.Router();

router.use(auth);

// Get all classes for school
router.get('/classes', async (req, res) => {
  try {
    const { grade } = req.query;
    
    let query = { schoolId: req.schoolId };
    if (grade) query.grade = grade;

    const classes = await Class.find(query)
      .populate('teacherId', 'firstName lastName')
      .populate('subjects.teacherId', 'firstName lastName');

    res.json(classes);
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({ message: 'Error fetching classes', error: error.message });
  }
});

// Get grades structure
router.get('/', async (req, res) => {
  try {
    const classes = await Class.find({ schoolId: req.schoolId });
    
    const grades = {
      '8': { name: 'Grade 8', classes: [] },
      '9': { name: 'Grade 9', classes: [] },
      '10': { name: 'Grade 10', classes: [] },
      '11': { name: 'Grade 11', classes: [] },
      '12': { name: 'Grade 12', classes: [] }
    };

    classes.forEach(classObj => {
      if (grades[classObj.grade]) {
        grades[classObj.grade].classes.push(classObj);
      }
    });

    res.json(grades);
  } catch (error) {
    console.error('Error fetching grades:', error);
    res.status(500).json({ message: 'Error fetching grades', error: error.message });
  }
});

module.exports = router;