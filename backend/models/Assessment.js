const mongoose = require('mongoose');

// SIMPLIFIED VERSION - Remove complex validations and methods for now
const assessmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  subject: {
    type: String,
    required: true
  },
  assessmentType: {
    type: String,
    required: true,
    default: 'Test'
  },
  term: {
    type: Number,
    required: true
  },
  maxMarks: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Basic indexes only
assessmentSchema.index({ schoolId: 1, classId: 1 });
assessmentSchema.index({ schoolId: 1, teacherId: 1 });

module.exports = mongoose.model('Assessment', assessmentSchema);