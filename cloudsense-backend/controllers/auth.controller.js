const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { validationResult, body } = require('express-validator');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const emailService = require('../services/email.service');
const logger = require('../utils/logger');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

/**
 * Register a new user
 */
const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg });
  }

  const { name, email, password, phone } = req.body;

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return res.status(409).json({ success: false, message: 'Email already registered' });
  }

  const user = await User.create({ name, email, password, phone, authProvider: 'local' });
  const token = generateToken(user._id);

  res.status(201).json({
    success: true,
    data: {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
    },
  });
};

/**
 * Login user
 */
const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg });
  }

  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  // If the user signed up via Google, they don't have a password
  if (user.authProvider === 'google' && !user.password) {
    return res.status(401).json({
      success: false,
      message: 'This account uses Google Sign-In. Please sign in with Google.',
    });
  }

  if (!(await user.comparePassword(password))) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  const token = generateToken(user._id);

  res.json({
    success: true,
    data: {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
    },
  });
};

/**
 * Google Sign-In — verify ID token and find-or-create user
 */
const googleLogin = async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    return res.status(400).json({ success: false, message: 'Google credential is required' });
  }

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid Google token' });
  }

  const { sub: googleId, email, name, email_verified } = payload;

  if (!email_verified) {
    return res.status(401).json({ success: false, message: 'Google email not verified' });
  }

  // Find existing user by googleId or email
  let user = await User.findOne({
    $or: [{ googleId }, { email: email.toLowerCase() }],
  });

  let isNewUser = false;

  if (user) {
    // Link Google ID if they signed up via email/password previously
    if (!user.googleId) {
      user.googleId = googleId;
      user.authProvider = user.authProvider === 'local' ? 'local' : 'google';
      await user.save();
    }
  } else {
    // Create new user from Google profile
    isNewUser = true;
    user = await User.create({
      name: name || email.split('@')[0],
      email,
      googleId,
      authProvider: 'google',
      isVerified: true,
    });
  }

  const token = generateToken(user._id);

  res.json({
    success: true,
    data: {
      token,
      isNewUser,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        authProvider: user.authProvider,
      },
    },
  });
};

/**
 * Get current authenticated user
 */
const getMe = async (req, res) => {
  res.json({
    success: true,
    data: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      phone: req.user.phone,
      authProvider: req.user.authProvider,
      isVerified: req.user.isVerified,
      createdAt: req.user.createdAt,
    },
  });
};

/**
 * Initiate forgot password process - generates 6-digit OTP and sends email
 */
const forgotPassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg });
  }

  const { email } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() });

  // For security reasons, don't disclose whether email exists or not
  if (!user) {
    return res.json({
      success: true,
      message: 'If an account with that email exists, an OTP has been sent.',
    });
  }

  // Generate 6-digit OTP and reset token
  const otp = user.getResetPasswordOtp();
  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  // Send password reset OTP email
  await emailService.sendPasswordResetOtpEmail({
    to: user.email,
    name: user.name,
    otp,
  });

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

  res.json({
    success: true,
    message: 'A 6-digit verification code has been sent to your email.',
    email: user.email,
    ...(process.env.NODE_ENV !== 'production' ? { devOtp: otp, devResetUrl: resetUrl } : {}),
  });
};

/**
 * Verify OTP entered by the user
 */
const verifyOtp = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg });
  }

  const { email, otp } = req.body;
  const cleanOtp = String(otp).trim();
  const hashedOtp = crypto.createHash('sha256').update(cleanOtp).digest('hex');

  const user = await User.findOne({
    email: email.toLowerCase(),
    resetPasswordOtp: hashedOtp,
    resetPasswordOtpExpire: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired verification code. Please request a new one.',
    });
  }

  // Generate an authorized reset token for password setting
  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  res.json({
    success: true,
    message: 'Verification code confirmed successfully.',
    data: {
      resetToken,
      email: user.email,
    },
  });
};

/**
 * Verify if reset token is valid and not expired
 */
const verifyResetToken = async (req, res) => {
  const { token } = req.params;
  if (!token) {
    return res.status(400).json({ success: false, message: 'Reset token is required' });
  }

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'Password reset link is invalid or has expired. Please request a new one.',
    });
  }

  res.json({
    success: true,
    message: 'Reset token is valid',
    data: {
      email: user.email,
    },
  });
};

/**
 * Reset password using verified token OR email + OTP
 */
const resetPassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg });
  }

  const { password, email, otp } = req.body;
  const token = req.params.token || req.body.token;

  let user = null;

  // Case 1: Verified via token
  if (token) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });
  }
  // Case 2: Verified via email + OTP
  else if (email && otp) {
    const cleanOtp = String(otp).trim();
    const hashedOtp = crypto.createHash('sha256').update(cleanOtp).digest('hex');
    user = await User.findOne({
      email: email.toLowerCase(),
      resetPasswordOtp: hashedOtp,
      resetPasswordOtpExpire: { $gt: Date.now() },
    });
  } else {
    return res.status(400).json({
      success: false,
      message: 'Reset token or verification code is required',
    });
  }

  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'Verification has expired or is invalid. Please request a new code.',
    });
  }

  // Update password and clear all reset credentials
  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  user.resetPasswordOtp = undefined;
  user.resetPasswordOtpExpire = undefined;
  await user.save();

  const authToken = generateToken(user._id);

  res.json({
    success: true,
    message: 'Password has been reset successfully.',
    data: {
      token: authToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
    },
  });
};

const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('phone').trim().notEmpty().withMessage('Phone number is required'),
];

const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

const forgotPasswordValidation = [
  body('email').isEmail().withMessage('Please provide a valid email address'),
];

const verifyOtpValidation = [
  body('email').isEmail().withMessage('Please provide a valid email address'),
  body('otp')
    .trim()
    .isLength({ min: 6, max: 6 })
    .withMessage('Verification code must be 6 digits')
    .isNumeric()
    .withMessage('Verification code must contain digits only'),
];

const resetPasswordValidation = [
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least 1 uppercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least 1 number'),
];

module.exports = {
  register,
  login,
  googleLogin,
  getMe,
  forgotPassword,
  verifyOtp,
  verifyResetToken,
  resetPassword,
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  verifyOtpValidation,
  resetPasswordValidation,
};


