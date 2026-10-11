const { validationResult, body } = require('express-validator');
const UsageSnapshot = require('../models/UsageSnapshot');
const AwsConnection = require('../models/AwsConnection');
const awsFetcher = require('../services/awsFetcher.service');
const { roundUSD } = require('../utils/costCalculator');

/**
 * Save usage snapshot from AWS data
 * @param {Object} connection
 * @param {Object} awsData
 * @returns {Promise<Object>}
 */
const saveUsageSnapshot = async (connection, awsData) => {
  const snapshot = await UsageSnapshot.create({
    userId: connection.userId,
    awsConnectionId: connection._id,
    snapshotDate: new Date(),
    billingPeriodStart: awsData.monthlyCost.billingPeriodStart,
    billingPeriodEnd: awsData.monthlyCost.billingPeriodEnd,
    totalCostUSD: awsData.monthlyCost.totalCostUSD,
    serviceCosts: awsData.costByService,
    rawCostExplorerResponse: awsData.monthlyCost.rawResponse,
  });

  connection.lastSyncedAt = new Date();
  await connection.save();

  return snapshot;
};

/**
 * Get current month usage (fast DB read with fallback)
 */
const getCurrentUsage = async (req, res) => {
  const { connectionId } = req.query;

  if (!connectionId) {
    return res.status(400).json({ success: false, message: 'connectionId is required' });
  }

  const connection = await AwsConnection.findOne({
    _id: connectionId,
    userId: req.user._id,
    isActive: true,
  });

  if (!connection) {
    return res.status(404).json({ success: false, message: 'Connection not found' });
  }

  // Fast path: return latest usage snapshot from database
  let snapshot = await UsageSnapshot.findOne({
    awsConnectionId: connectionId,
  }).sort({ snapshotDate: -1 });

  // Only perform live AWS fetch if no snapshot exists in DB yet
  if (!snapshot) {
    try {
      const awsData = await awsFetcher.fetchAllAwsData(connection);
      snapshot = await saveUsageSnapshot(connection, awsData);
    } catch (err) {
      // Fallback: return empty snapshot structure if AWS fetch fails
      return res.json({
        success: true,
        data: {
          totalCostUSD: 0,
          serviceCosts: [],
          snapshotDate: new Date(),
        },
      });
    }
  }

  res.json({ success: true, data: snapshot });
};

/**
 * Get usage history
 */
const getUsageHistory = async (req, res) => {
  const { connectionId, days = 30 } = req.query;

  if (!connectionId) {
    return res.status(400).json({ success: false, message: 'connectionId is required' });
  }

  const connection = await AwsConnection.findOne({
    _id: connectionId,
    userId: req.user._id,
  });

  if (!connection) {
    return res.status(404).json({ success: false, message: 'Connection not found' });
  }

  const since = new Date();
  since.setDate(since.getDate() - parseInt(days, 10));

  const snapshots = await UsageSnapshot.find({
    awsConnectionId: connectionId,
    userId: req.user._id,
    snapshotDate: { $gte: since },
  }).sort({ snapshotDate: -1 });

  res.json({ success: true, data: snapshots });
};

/**
 * Get current month cost by service (fast DB read with fallback)
 */
const getServicesBreakdown = async (req, res) => {
  const { connectionId } = req.query;

  if (!connectionId) {
    return res.status(400).json({ success: false, message: 'connectionId is required' });
  }

  const connection = await AwsConnection.findOne({
    _id: connectionId,
    userId: req.user._id,
    isActive: true,
  });

  if (!connection) {
    return res.status(404).json({ success: false, message: 'Connection not found' });
  }

  // Fast path: use latest snapshot's serviceCosts from MongoDB (instant response)
  const latestSnapshot = await UsageSnapshot.findOne({
    awsConnectionId: connectionId,
  }).sort({ snapshotDate: -1 });

  if (latestSnapshot && Array.isArray(latestSnapshot.serviceCosts) && latestSnapshot.serviceCosts.length > 0) {
    const totalCost =
      latestSnapshot.totalCostUSD ||
      latestSnapshot.serviceCosts.reduce((sum, s) => sum + (s.costUSD || 0), 0);

    const breakdown = latestSnapshot.serviceCosts.map((s) => ({
      service: s.service,
      serviceName: s.serviceName || s.service,
      costUSD: s.costUSD,
      percentage: totalCost > 0 ? roundUSD((s.costUSD / totalCost) * 100) : 0,
    }));

    return res.json({ success: true, data: breakdown });
  }

  // Fallback: If no snapshot exists yet, fetch live from AWS
  try {
    const credentials = await awsFetcher.assumeRole(
      connection.roleArn,
      connection.externalId,
      connection.region
    );
    const costByService = await awsFetcher.getCostByService(credentials, connection.region);
    const totalCost = costByService.reduce((sum, s) => sum + s.costUSD, 0);

    const breakdown = costByService.map((s) => ({
      service: s.service,
      serviceName: s.serviceName,
      costUSD: s.costUSD,
      percentage: totalCost > 0 ? roundUSD((s.costUSD / totalCost) * 100) : 0,
    }));

    return res.json({ success: true, data: breakdown });
  } catch (err) {
    return res.json({ success: true, data: [] });
  }
};

/**
 * Manually trigger usage sync
 */
const syncUsage = async (req, res) => {
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

  const awsData = await awsFetcher.fetchAllAwsData(connection);
  const snapshot = await saveUsageSnapshot(connection, awsData);

  res.json({
    success: true,
    data: { snapshot, message: 'Sync complete' },
  });
};

const syncValidation = [
  body('connectionId').notEmpty().withMessage('connectionId is required'),
];

module.exports = {
  getCurrentUsage,
  getUsageHistory,
  getServicesBreakdown,
  syncUsage,
  saveUsageSnapshot,
  syncValidation,
};
