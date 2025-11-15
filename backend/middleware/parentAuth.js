const jwt = require('jsonwebtoken');
const Parent = require('../models/Parent');

const parentAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'edu-analytics-secret');
    const parent = await Parent.findById(decoded.parentId);
    
    if (!parent) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    req.parentId = parent._id;
    req.schoolId = parent.schoolId;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = parentAuth;