const mongoose = require('mongoose');

const schoolSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  emisNumber: {
    type: String,
    required: true,
    unique: true
  },
  province: {
    type: String,
    required: true,
    enum: ['Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal', 'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape', 'Western Cape']
  },
  district: {
    type: String,
    required: true
  },
  address: {
    street: String,
    city: String,
    postalCode: String
  },
  contact: {
    phone: String,
    email: String,
    principalName: String
  },
  subscription: {
    plan: {
      type: String,
      enum: ['trial', 'basic', 'premium'],
      default: 'trial'
    },
    startDate: Date,
    endDate: Date,
    studentsLimit: {
      type: Number,
      default: 100
    }
  },
  settings: {
    academicYear: {
      type: Number,
      default: new Date().getFullYear()
    },
    terms: {
      term1: { start: Date, end: Date },
      term2: { start: Date, end: Date },
      term3: { start: Date, end: Date },
      term4: { start: Date, end: Date }
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('School', schoolSchema);