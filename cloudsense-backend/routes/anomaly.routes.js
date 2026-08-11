const express = require('express');
const anomalyController = require('../controllers/anomaly.controller');
const authMiddleware = require('../middleware/auth.middleware');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

router.use(authMiddleware);

router.get('/', asyncHandler(anomalyController.getAnomalies));

router.post(
  '/scan',
  anomalyController.scanValidation,
  asyncHandler(anomalyController.scanAnomalies)
);

router.get('/:id', asyncHandler(anomalyController.getAnomalyById));

router.patch(
  '/:id/status',
  anomalyController.statusValidation,
  asyncHandler(anomalyController.updateAnomalyStatus)
);

module.exports = router;
