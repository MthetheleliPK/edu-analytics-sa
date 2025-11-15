const express = require('express');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const PasswordReset = require('../models/PasswordReset');
const auth = require('../middleware/auth');
const emailService = require('../services/emailService');

const router = express.Router();

// Request password reset
router.post('/forgot-password', [
  body('email').isEmail().withMessage('Valid email is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      // Don't reveal whether email exists
      return res.json({ 
        message: 'If an account with that email exists, a reset link has been sent' 
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

    // Save reset token
    await PasswordReset.findOneAndUpdate(
      { userId: user._id },
      {
        token: resetToken,
        expires: resetExpires,
        used: false
      },
      { upsert: true, new: true }
    );

    // Send email
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    await emailService.sendPasswordReset(user.email, resetUrl, user.firstName);

    res.json({ 
      message: 'If an account with that email exists, a reset link has been sent' 
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'Error processing password reset request' });
  }
});

// Reset password with token
router.post('/reset-password', [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { token, password } = req.body;

    // Find valid reset token
    const resetRequest = await PasswordReset.findOne({
      token,
      used: false,
      expires: { $gt: new Date() }
    }).populate('userId');

    if (!resetRequest) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Update user password
    const user = resetRequest.userId;
    user.password = password;
    await user.save();

    // Mark token as used
    resetRequest.used = true;
    await resetRequest.save();

    // Send confirmation email
    await emailService.sendPasswordResetConfirmation(user.email, user.firstName);

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'Error resetting password' });
  }
});

// Change password (authenticated)
router.post('/change-password', auth, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.userId);

    if (!(await user.comparePassword(currentPassword))) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    // Send security notification
    await emailService.sendPasswordChangeNotification(user.email, user.firstName);

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Error changing password' });
  }
});

module.exports = router;