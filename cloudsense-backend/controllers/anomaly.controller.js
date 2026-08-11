const { validationResult, body } = require('express-validator');
const Anomaly = require('../models/Anomaly');
const Alert = require('../models/Alert');
const Budget = require('../models/Budget');
const UsageSnapshot = require('../models/UsageSnapshot');
const AwsConnection = require('../models/AwsConnection');
const awsFetcher = require('../services/awsFetcher.service');
const anomalyEngine = require('../services/anomalyEngine.service');
const alertTrigger = require('../services/alertTrigger.service');

const CONFIDENCE_THRESHOLD = parseFloat(process.env.ALERT_CONFIDENCE_THRESHOLD || '0.75');

/**
 * Get filtered anomalies
 */
const getAnomalies = async (req, res) => {
  const { connectionId, status, severity } = req.query;

  const filter = { userId: req.user._id };
  if (connectionId) filter.awsConnectionId = connectionId;
  if (status) filter.status = status;
  if (severity) filter.severity = severity;

  const anomalies = await Anomaly.find(filter).sort({ detectedAt: -1 });

  res.json({ success: true, data: anomalies });
};

/**
 * Get single anomaly by ID
 */
const getAnomalyById = async (req, res) => {
  const anomaly = await Anomaly.findOne({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!anomaly) {
    return res.status(404).json({ success: false, message: 'Anomaly not found' });
  }

  res.json({ success: true, data: anomaly });
};

/**
 * Trigger full anomaly scan
 */
const scanAnomalies = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg });
  }

  const { connectionId } = req.body;

  const connection = await AwsConnection.findOne({
    _id: connectionId,
    userId: req.user._id,
    isActive: true,
  });

  if (!connection) {
    return res.status(404).json({ success: false, message: 'Connection not found' });
  }

  const [awsData, budgets, usageHistory] = await Promise.all([
    awsFetcher.fetchAllAwsData(connection),
    Budget.find({ userId: req.user._id, awsConnectionId: connectionId, isActive: true }),
    UsageSnapshot.find({ awsConnectionId: connectionId }).sort({ snapshotDate: -1 }).limit(6),
  ]);

  const detectedAnomalies = await anomalyEngine.runFullScan(
    awsData,
    budgets,
    req.user._id.toString(),
    connectionId,
    usageHistory
  );

  const savedAnomalies = [];
  for (const anomalyData of detectedAnomalies) {
    const anomaly = await Anomaly.create(anomalyData);
    savedAnomalies.push(anomaly);
  }

  const recentAlerts = await Alert.find({ userId: req.user._id })
    .populate('anomalyId')
    .sort({ sentAt: -1 })
    .limit(50);

  for (const anomaly of savedAnomalies) {
    if (anomaly.confidenceScore >= CONFIDENCE_THRESHOLD) {
      if (alertTrigger.shouldTriggerAlert(anomaly, recentAlerts)) {
        await alertTrigger.triggerAnomalyAlert(anomaly, req.user);
      }
    }
  }

  res.json({
    success: true,
    data: { detected: savedAnomalies.length, anomalies: savedAnomalies },
  });
};

/**
 * Update anomaly status
 */
const updateAnomalyStatus = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg });
  }

  const { status } = req.body;

  const anomaly = await Anomaly.findOne({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!anomaly) {
    return res.status(404).json({ success: false, message: 'Anomaly not found' });
  }

  anomaly.status = status;
  if (status === 'resolved') {
    anomaly.resolvedAt = new Date();
  }

  await anomaly.save();

  res.json({ success: true, data: anomaly });
};

const scanValidation = [
  body('connectionId').notEmpty().withMessage('connectionId is required'),
];

const statusValidation = [
  body('status').isIn(['resolved', 'dismissed']).withMessage('status must be resolved or dismissed'),
];

module.exports = {
  getAnomalies,
  getAnomalyById,
  scanAnomalies,
  updateAnomalyStatus,
  scanValidation,
  statusValidation,
};
