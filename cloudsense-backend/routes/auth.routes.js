const express = require('express');
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

router.post(
  '/register',
  authController.registerValidation,
  asyncHandler(authController.register)
);

router.post(
  '/login',
  authController.loginValidation,
  asyncHandler(authController.login)
);

router.post('/google', asyncHandler(authController.googleLogin));

router.post(
  '/forgot-password',
  authController.forgotPasswordValidation,
  asyncHandler(authController.forgotPassword)
);

router.post(
  '/verify-otp',
  authController.verifyOtpValidation,
  asyncHandler(authController.verifyOtp)
);

router.get(
  '/reset-password/:token',
  asyncHandler(authController.verifyResetToken)
);

router.post(
  '/reset-password',
  authController.resetPasswordValidation,
  asyncHandler(authController.resetPassword)
);

router.post(
  '/reset-password/:token',
  authController.resetPasswordValidation,
  asyncHandler(authController.resetPassword)
);

router.get('/me', authMiddleware, asyncHandler(authController.getMe));

module.exports = router;

