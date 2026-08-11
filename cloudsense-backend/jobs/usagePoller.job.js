const cron = require('node-cron');
const AwsConnection = require('../models/AwsConnection');
const Budget = require('../models/Budget');
const User = require('../models/User');
const awsFetcher = require('../services/awsFetcher.service');
const alertTrigger = require('../services/alertTrigger.service');
const { saveUsageSnapshot } = require('../controllers/usage.controller');
const logger = require('../utils/logger');

let isRunning = false;

/**
 * Poll AWS usage for all active connections and check budget breaches
 */
const pollUsage = async () => {
  if (isRunning) {
    logger.warn('Usage poller already running, skipping');
    return;
  }

  isRunning = true;

  try {
    const connections = await AwsConnection.find({ isActive: true, connectionStatus: 'connected' });
    logger.info('Usage poller started', { connectionCount: connections.length });

    for (const connection of connections) {
      try {
        const awsData = await awsFetcher.fetchAllAwsData(connection);
        const snapshot = await saveUsageSnapshot(connection, awsData);

        const budgets = await Budget.find({
          awsConnectionId: connection._id,
          isActive: true,
        });

        if (budgets.length > 0) {
          const user = await User.findById(connection.userId);
          if (user) {
            await alertTrigger.checkBudgetBreaches(budgets, snapshot, user);
          }
        }
      } catch (error) {
        logger.error('Usage poll failed for connection', {
          connectionId: connection._id,
          error: error.message,
        });

        connection.connectionStatus = 'error';
        await connection.save();
      }
    }

    logger.info('Usage poller completed');
  } catch (error) {
    logger.error('Usage poller error', { error: error.message });
  } finally {
    isRunning = false;
  }
};

/**
 * Start the usage polling cron job
 */
const startUsagePoller = () => {
  const intervalMinutes = parseInt(process.env.USAGE_POLL_INTERVAL_MINUTES || '30', 10);
  const cronExpression = `*/${intervalMinutes} * * * *`;

  logger.info('Starting usage poller', { intervalMinutes, cronExpression });

  cron.schedule(cronExpression, pollUsage);
};

module.exports = {
  startUsagePoller,
  pollUsage,
};
