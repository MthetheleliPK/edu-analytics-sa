const User = require('../models/User');
const School = require('../models/School');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

// Make sure you have a JWT secret in your .env file
const JWT_SECRET = process.env.JWT_SECRET || 'edu-analytics-development-secret-2024';

const generateToken = (userId, email, role, schoolId) => {
  return jwt.sign(
    { 
      userId, 
      email, 
      role, 
      schoolId 
    }, 
    JWT_SECRET,
    { expiresIn: '30d' }
  );
};

exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { school, user } = req.body;

    // Create school first
    const newSchool = new School(school);
    await newSchool.save();

    // Create admin user
    const newUser = new User({
      ...user,
      schoolId: newSchool._id,
      role: 'admin'
    });
    await newUser.save();

    const token = generateToken(newUser._id, newUser.email, newUser.role, newSchool._id);

    res.status(201).json({
      message: 'School and admin user created successfully',
      token,
      user: {
        id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        role: newUser.role,
        schoolId: newSchool._id
      },
      school: {
        id: newSchool._id,
        name: newSchool.name,
        emisNumber: newSchool.emisNumber
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email or EMIS number already exists' });
    }
    res.status(500).json({ message: 'Server error during registration', error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    console.log('🔐 Login attempt for:', email);

    // Find user and populate school info
    const user = await User.findOne({ email: email.toLowerCase() }).populate('schoolId');
    
    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    console.log('✅ User found:', user.email, 'Role:', user.role);

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    // Compare passwords
    console.log('🔑 Comparing passwords...');
    const isPasswordValid = await user.comparePassword(password);
    console.log('Password match:', isPasswordValid);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate token with proper payload
    const token = generateToken(user._id, user.email, user.role, user.schoolId._id);

    console.log('✅ Login successful for:', user.email);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        schoolId: user.schoolId._id,
        subjects: user.subjects,
        classes: user.classes
      },
      school: user.schoolId
    });
  } catch (error) {
    console.error('💥 Login error:', error);
    res.status(500).json({ message: 'Server error during login', error: error.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).populate('schoolId').select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
};