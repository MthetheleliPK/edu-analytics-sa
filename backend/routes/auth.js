const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/register', [
  body('school.name').notEmpty().withMessage('School name is required'),
  body('school.emisNumber').notEmpty().withMessage('EMIS number is required'),
  body('school.province').notEmpty().withMessage('Province is required'),
  body('user.firstName').notEmpty().withMessage('First name is required'),
  body('user.lastName').notEmpty().withMessage('Last name is required'),
  body('user.email').isEmail().withMessage('Valid email is required'),
  body('user.password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], authController.register);

router.post('/login', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
], authController.login);

router.get('/profile', auth, authController.getProfile);

module.exports = router;