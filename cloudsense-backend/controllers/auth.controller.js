const jwt = require('jsonwebtoken');
const { validationResult, body } = require('express-validator');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');

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

module.exports = {
  register,
  login,
  googleLogin,
  getMe,
  registerValidation,
  loginValidation,
};

