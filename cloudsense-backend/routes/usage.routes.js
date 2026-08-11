const express = require('express');
const usageController = require('../controllers/usage.controller');
const authMiddleware = require('../middleware/auth.middleware');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

router.use(authMiddleware);

router.get('/current', asyncHandler(usageController.getCurrentUsage));

router.get('/history', asyncHandler(usageController.getUsageHistory));

router.get('/services', asyncHandler(usageController.getServicesBreakdown));

router.post(
  '/sync',
  usageController.syncValidation,
  asyncHandler(usageController.syncUsage)
);

module.exports = router;
