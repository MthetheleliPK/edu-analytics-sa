// Utility functions for the application

/**
 * Format a number as a percentage with 1 decimal place
 */
const formatPercentage = (number) => {
  if (number == null || isNaN(number)) return '0.0%';
  return `${parseFloat(number).toFixed(1)}%`;
};

/**
 * Generate a random student number
 */
const generateStudentNumber = (grade, sequence) => {
  const year = new Date().getFullYear().toString().slice(-2);
  return `S${year}${grade}${sequence.toString().padStart(4, '0')}`;
};

/**
 * Calculate term based on current date
 */
const getCurrentTerm = (academicYear, terms) => {
  const now = new Date();
  
  if (!terms) return 1;
  
  for (let term = 1; term <= 4; term++) {
    const termKey = `term${term}`;
    if (terms[termKey] && terms[termKey].start && terms[termKey].end) {
      const start = new Date(terms[termKey].start);
      const end = new Date(terms[termKey].end);
      
      if (now >= start && now <= end) {
        return term;
      }
    }
  }
  
  return 1; // Default to term 1 if no match
};

/**
 * Validate South African phone number
 */
const validateSAPhoneNumber = (phone) => {
  const saPhoneRegex = /^(\+27|0)[6-8][0-9]{8}$/;
  return saPhoneRegex.test(phone.replace(/\s/g, ''));
};

/**
 * Format date for display
 */
const formatDate = (date, includeTime = false) => {
  if (!date) return '';
  
  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };
  
  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }
  
  return new Date(date).toLocaleDateString('en-ZA', options);
};

/**
 * Calculate age from date of birth
 */
const calculateAge = (dateOfBirth) => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

/**
 * Generate a secure random password
 */
const generateRandomPassword = (length = 12) => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  
  return password;
};

/**
 * Sanitize user input for database queries
 */
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/[&<>"']/g, '')
    .trim()
    .substring(0, 255); // Limit length
};

/**
 * Calculate grade average from assessments
 */
const calculateGradeAverage = (assessments) => {
  if (!assessments || assessments.length === 0) return 0;
  
  const total = assessments.reduce((sum, assessment) => {
    return sum + (assessment.percentage || 0);
  }, 0);
  
  return total / assessments.length;
};

/**
 * Determine performance category based on percentage
 */
const getPerformanceCategory = (percentage) => {
  if (percentage >= 80) return 'Excellent';
  if (percentage >= 70) return 'Good';
  if (percentage >= 60) return 'Satisfactory';
  if (percentage >= 50) return 'Needs Improvement';
  return 'At Risk';
};

module.exports = {
  formatPercentage,
  generateStudentNumber,
  getCurrentTerm,
  validateSAPhoneNumber,
  formatDate,
  calculateAge,
  generateRandomPassword,
  sanitizeInput,
  calculateGradeAverage,
  getPerformanceCategory
};