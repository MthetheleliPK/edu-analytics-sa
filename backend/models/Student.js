const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  studentNumber: {
    type: String,
    required: true,
    unique: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  gender: {
    type: String,
    enum: ['Male', 'Female'],
    required: true
  },
  grade: {
    type: String,
    enum: ['8', '9', '10', '11', '12'],
    required: true
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  contact: {
    parentName: String,
    parentPhone: String,
    parentEmail: String,
    address: String
  },
  enrollmentDate: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
studentSchema.index({ schoolId: 1, grade: 1 });
studentSchema.index({ schoolId: 1, class: 1 });

module.exports = mongoose.model('Student', studentSchema);