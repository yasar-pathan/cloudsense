const cron = require('node-cron');
const AwsConnection = require('../models/AwsConnection');
const Budget = require('../models/Budget');
const UsageSnapshot = require('../models/UsageSnapshot');
const Anomaly = require('../models/Anomaly');
const Alert = require('../models/Alert');
const User = require('../models/User');
const awsFetcher = require('../services/awsFetcher.service');
const anomalyEngine = require('../services/anomalyEngine.service');
const alertTrigger = require('../services/alertTrigger.service');
const logger = require('../utils/logger');

const CONFIDENCE_THRESHOLD = parseFloat(process.env.ALERT_CONFIDENCE_THRESHOLD || '0.75');

let isRunning = false;

/**
 * Run anomaly scan for all active connections
 */
const scanAllConnections = async () => {
  if (isRunning) {
    logger.warn('Anomaly scanner already running, skipping');
    return;
  }

  isRunning = true;

  try {
    const connections = await AwsConnection.find({ isActive: true, connectionStatus: 'connected' });
    logger.info('Anomaly scanner started', { connectionCount: connections.length });

    for (const connection of connections) {
      try {
        const user = await User.findById(connection.userId);
        if (!user) continue;

        const [awsData, budgets, usageHistory] = await Promise.all([
          awsFetcher.fetchAllAwsData(connection),
          Budget.find({ awsConnectionId: connection._id, isActive: true }),
          UsageSnapshot.find({ awsConnectionId: connection._id })
            .sort({ snapshotDate: -1 })
            .limit(6),
        ]);

        const detectedAnomalies = await anomalyEngine.runFullScan(
          awsData,
          budgets,
          connection.userId.toString(),
          connection._id.toString(),
          usageHistory
        );

        const savedAnomalies = [];
        for (const anomalyData of detectedAnomalies) {
          const anomaly = await Anomaly.create(anomalyData);
          savedAnomalies.push(anomaly);
        }

        const recentAlerts = await Alert.find({ userId: connection.userId })
          .populate('anomalyId')
          .sort({ sentAt: -1 })
          .limit(50);

        for (const anomaly of savedAnomalies) {
          if (anomaly.confidenceScore >= CONFIDENCE_THRESHOLD) {
            if (alertTrigger.shouldTriggerAlert(anomaly, recentAlerts)) {
              await alertTrigger.triggerAnomalyAlert(anomaly, user);
            }
          }
        }

        logger.info('Anomaly scan completed for connection', {
          connectionId: connection._id,
          detected: savedAnomalies.length,
        });
      } catch (error) {
        logger.error('Anomaly scan failed for connection', {
          connectionId: connection._id,
          error: error.message,
        });
      }
    }

    logger.info('Anomaly scanner completed');
  } catch (error) {
    logger.error('Anomaly scanner error', { error: error.message });
  } finally {
    isRunning = false;
  }
};

/**
 * Start the anomaly scanning cron job (every 6 hours)
 */
const startAnomalyScanner = () => {
  const cronExpression = '0 */6 * * *';

  logger.info('Starting anomaly scanner', { cronExpression });

  cron.schedule(cronExpression, scanAllConnections);
};

module.exports = {
  startAnomalyScanner,
  scanAllConnections,
};
