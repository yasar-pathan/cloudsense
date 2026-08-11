const express = require('express');
const awsController = require('../controllers/aws.controller');
const authMiddleware = require('../middleware/auth.middleware');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

router.use(authMiddleware);

router.get('/generate-external-id', asyncHandler(awsController.generateExternalId));

router.post(
  '/connect',
  awsController.connectValidation,
  asyncHandler(awsController.connect)
);

router.get('/connections', asyncHandler(awsController.getConnections));

router.delete('/connections/:id', asyncHandler(awsController.deleteConnection));

router.post('/connections/:id/test', asyncHandler(awsController.testConnection));

module.exports = router;
