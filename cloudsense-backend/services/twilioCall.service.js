const { getTwilioClient } = require('../config/twilio');
const logger = require('../utils/logger');
const { roundUSD, calculatePercentUsed } = require('../utils/costCalculator');

/**
 * Build TwiML URL for gather action
 * @returns {string}
 */
const getGatherActionUrl = () => {
  const baseUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;
  return `${baseUrl}/api/alerts/twilio-gather`;
};

/**
 * Initiate a phone call via Twilio with text-to-speech message
 * @param {string} toPhoneNumber - Destination phone number
 * @param {string} message - Message to speak
 * @returns {Promise<{callSid: string, status: string}>}
 */
const makeCall = async (toPhoneNumber, message) => {
  const client = getTwilioClient();
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!fromNumber) {
    throw new Error('TWILIO_PHONE_NUMBER is not configured');
  }

  const sanitizedMessage = message.replace(/[<>&"']/g, '');

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Matthew" loop="1">${sanitizedMessage}</Say>
  <Pause length="2"/>
  <Say voice="Polly.Matthew">To acknowledge this alert, press 1. To dismiss, press 2.</Say>
  <Gather numDigits="1" action="${getGatherActionUrl()}" method="POST"/>
</Response>`;

  logger.info('Twilio makeCall', { to: toPhoneNumber });

  const call = await client.calls.create({
    to: toPhoneNumber,
    from: fromNumber,
    twiml,
  });

  return {
    callSid: call.sid,
    status: call.status,
  };
};

/**
 * Build budget alert voice message
 * @param {string} budgetType - 'overall' or 'per_service'
 * @param {string|null} service - AWS service code for per_service budgets
 * @param {number} currentSpend - Current spend in USD
 * @param {number} limit - Budget limit in USD
 * @param {number} percentUsed - Percentage of budget used
 * @returns {string}
 */
const buildBudgetMessage = (budgetType, service, currentSpend, limit, percentUsed) => {
  const budgetLabel = budgetType === 'overall' ? 'overall' : service;
  return (
    `Hello, this is CloudSense, your AWS monitoring assistant. ` +
    `Alert: Your ${budgetLabel} AWS spending has reached ${roundUSD(percentUsed)} percent ` +
    `of your ${roundUSD(limit)} dollar monthly budget. Current spend is ${roundUSD(currentSpend)} dollars. ` +
    `Immediate review is recommended.`
  );
};

/**
 * Build anomaly alert voice message
 * @param {Object} anomaly - Anomaly document or object
 * @returns {string}
 */
const buildAnomalyMessage = (anomaly) => {
  const shortDescription = anomaly.description.length > 200
    ? `${anomaly.description.substring(0, 200)}...`
    : anomaly.description;

  return (
    `Hello, this is CloudSense, your AWS monitoring assistant. ` +
    `Anomaly detected: ${anomaly.title}. ${shortDescription} ` +
    `Estimated monthly cost impact: ${roundUSD(anomaly.estimatedMonthlyCostImpact || 0)} dollars.`
  );
};

module.exports = {
  makeCall,
  buildBudgetMessage,
  buildAnomalyMessage,
};
