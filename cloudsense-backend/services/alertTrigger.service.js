const Alert = require('../models/Alert');
const Anomaly = require('../models/Anomaly');
const twilioCallService = require('./twilioCall.service');
const logger = require('../utils/logger');
const { roundUSD, calculatePercentUsed } = require('../utils/costCalculator');

const ALERT_COOLDOWN_HOURS = 24;

/**
 * Determine if an alert should be triggered for an anomaly
 * @param {Object} anomaly - Anomaly object
 * @param {Array<Object>} existingAlerts - Recent alerts for this user
 * @returns {boolean}
 */
const shouldTriggerAlert = (anomaly, existingAlerts) => {
  const cooldownMs = ALERT_COOLDOWN_HOURS * 60 * 60 * 1000;
  const now = Date.now();

  const recentSamePattern = existingAlerts.find((alert) => {
    if (!alert.anomalyId) return false;
    const alertAge = now - new Date(alert.sentAt).getTime();
    if (alertAge > cooldownMs) return false;

    const alertAnomaly = alert.anomalyId;
    if (typeof alertAnomaly === 'object' && alertAnomaly !== null) {
      return (
        alertAnomaly.pattern === anomaly.pattern &&
        alertAnomaly.affectedResourceId === anomaly.affectedResourceId
      );
    }
    return false;
  });

  if (recentSamePattern) {
    return false;
  }

  return true;
};

/**
 * Trigger phone alert for a detected anomaly
 * @param {Object} anomaly - Anomaly Mongoose document
 * @param {Object} user - User document
 * @returns {Promise<Object>} Created Alert document
 */
const triggerAnomalyAlert = async (anomaly, user) => {
  const message = twilioCallService.buildAnomalyMessage(anomaly);

  logger.info('Triggering anomaly alert', {
    anomalyId: anomaly._id,
    pattern: anomaly.pattern,
    userId: user._id,
  });

  let callResult;
  let alertStatus = 'sent';

  try {
    callResult = await twilioCallService.makeCall(user.phone, message);
  } catch (error) {
    logger.error('Failed to make anomaly alert call', { error: error.message });
    alertStatus = 'failed';
    callResult = { callSid: null, status: 'failed' };
  }

  const alert = await Alert.create({
    userId: user._id,
    anomalyId: anomaly._id,
    awsConnectionId: anomaly.awsConnectionId,
    type: 'anomaly_detected',
    channel: 'phone_call',
    status: alertStatus,
    phoneNumber: user.phone,
    twilioCallSid: callResult.callSid,
    message,
    sentAt: new Date(),
  });

  if (alertStatus === 'sent') {
    anomaly.status = 'alerted';
    await anomaly.save();
  }

  return alert;
};

/**
 * Trigger phone alert for budget breach or near-breach
 * @param {Object} budget - Budget document
 * @param {number} currentSpend - Current spend in USD
 * @param {Object} user - User document
 * @returns {Promise<Object>} Created Alert document
 */
const triggerBudgetAlert = async (budget, currentSpend, user) => {
  const percentUsed = calculatePercentUsed(currentSpend, budget.monthlyLimit);
  const isFullBreach = currentSpend >= budget.monthlyLimit;
  const breachType = isFullBreach ? 'full_breach' : 'near_breach';

  const message = twilioCallService.buildBudgetMessage(
    budget.type,
    budget.service,
    currentSpend,
    budget.monthlyLimit,
    percentUsed
  );

  const fullMessage = isFullBreach
    ? `${message} Your budget has been fully exceeded.`
    : `${message} You are approaching your budget limit.`;

  logger.info('Triggering budget alert', {
    budgetId: budget._id,
    breachType,
    percentUsed,
    userId: user._id,
  });

  let callResult;
  let alertStatus = 'sent';

  try {
    callResult = await twilioCallService.makeCall(user.phone, fullMessage);
  } catch (error) {
    logger.error('Failed to make budget alert call', { error: error.message });
    alertStatus = 'failed';
    callResult = { callSid: null, status: 'failed' };
  }

  const alert = await Alert.create({
    userId: user._id,
    budgetId: budget._id,
    awsConnectionId: budget.awsConnectionId,
    type: 'budget_breach',
    channel: 'phone_call',
    status: alertStatus,
    phoneNumber: user.phone,
    twilioCallSid: callResult.callSid,
    message: fullMessage,
    sentAt: new Date(),
  });

  return alert;
};

/**
 * Check all active budgets against current usage and trigger alerts if needed
 * @param {Array<Object>} budgets - Active budget documents
 * @param {Object} usageSnapshot - Current usage snapshot
 * @param {Object} user - User document
 * @returns {Promise<Array<Object>>} Triggered alerts
 */
const checkBudgetBreaches = async (budgets, usageSnapshot, user) => {
  const triggeredAlerts = [];
  const cooldownMs = ALERT_COOLDOWN_HOURS * 60 * 60 * 1000;
  const cutoff = new Date(Date.now() - cooldownMs);

  for (const budget of budgets.filter((b) => b.isActive)) {
    let currentSpend;

    if (budget.type === 'overall') {
      currentSpend = usageSnapshot.totalCostUSD;
    } else {
      const serviceEntry = usageSnapshot.serviceCosts.find((s) => s.service === budget.service);
      currentSpend = serviceEntry ? serviceEntry.costUSD : 0;
    }

    const percentUsed = calculatePercentUsed(currentSpend, budget.monthlyLimit);
    const isBreached = currentSpend >= budget.monthlyLimit;
    const isNearBreached = percentUsed >= budget.alertAtPercent;

    if (!isBreached && !isNearBreached) continue;

    const recentAlert = await Alert.findOne({
      budgetId: budget._id,
      userId: user._id,
      sentAt: { $gte: cutoff },
    });

    if (recentAlert) continue;

    const alert = await triggerBudgetAlert(budget, currentSpend, user);
    triggeredAlerts.push(alert);
  }

  return triggeredAlerts;
};

module.exports = {
  shouldTriggerAlert,
  triggerAnomalyAlert,
  triggerBudgetAlert,
  checkBudgetBreaches,
};
