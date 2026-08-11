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

router.get('/me', authMiddleware, asyncHandler(authController.getMe));

module.exports = router;
