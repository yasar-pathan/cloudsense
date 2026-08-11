const express = require('express');
const alertController = require('../controllers/alert.controller');
const authMiddleware = require('../middleware/auth.middleware');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

router.post('/twilio-gather', asyncHandler(alertController.twilioGather));

router.use(authMiddleware);

router.get('/', asyncHandler(alertController.getAlerts));

router.patch('/:id/acknowledge', asyncHandler(alertController.acknowledgeAlert));

router.post(
  '/test-call',
  alertController.testCallValidation,
  asyncHandler(alertController.testCall)
);

module.exports = router;
