const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  grade: {
    type: String,
    enum: ['8', '9', '10', '11', '12'],
    required: true
  },
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  subjects: [{
    subject: {
      type: String,
      enum: ['Mathematics', 'English', 'Afrikaans', 'IsiZulu', 'Physical Science', 'Life Sciences', 'Geography', 'History', 'Accounting', 'Business Studies', 'Economics', 'Life Orientation', 'Computer Science', 'Technology']
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  academicYear: {
    type: Number,
    default: new Date().getFullYear()
  }
}, {
  timestamps: true
});

// Compound index
classSchema.index({ schoolId: 1, grade: 1, academicYear: 1 });

module.exports = mongoose.model('Class', classSchema);