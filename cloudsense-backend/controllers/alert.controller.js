const { validationResult, body } = require('express-validator');
const Alert = require('../models/Alert');
const Anomaly = require('../models/Anomaly');
const twilioCallService = require('../services/twilioCall.service');

/**
 * Get alerts for current user
 */
const getAlerts = async (req, res) => {
  const { connectionId, type } = req.query;

  const filter = { userId: req.user._id };
  if (connectionId) filter.awsConnectionId = connectionId;
  if (type) filter.type = type;

  const alerts = await Alert.find(filter)
    .populate('anomalyId', 'title pattern severity')
    .populate('budgetId', 'type service monthlyLimit')
    .sort({ sentAt: -1 });

  res.json({ success: true, data: alerts });
};

/**
 * Acknowledge an alert
 */
const acknowledgeAlert = async (req, res) => {
  const alert = await Alert.findOne({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!alert) {
    return res.status(404).json({ success: false, message: 'Alert not found' });
  }

  alert.status = 'acknowledged';
  alert.acknowledgedAt = new Date();
  await alert.save();

  res.json({ success: true, data: alert });
};

/**
 * Send test phone call
 */
const testCall = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg });
  }

  const phoneNumber = req.body.phoneNumber || req.user.phone;

  const message =
    'Hello, this is CloudSense. This is a test call to verify your phone alert setup is working correctly.';

  const callResult = await twilioCallService.makeCall(phoneNumber, message);

  res.json({
    success: true,
    data: { callSid: callResult.callSid, status: callResult.status },
  });
};

/**
 * Twilio gather webhook for call acknowledgment
 */
const twilioGather = async (req, res) => {
  const digit = req.body.Digits;
  const callSid = req.body.CallSid;

  let twiml;

  if (digit === '1') {
    const alert = await Alert.findOne({ twilioCallSid: callSid });
    if (alert) {
      alert.status = 'acknowledged';
      alert.acknowledgedAt = new Date();
      await alert.save();
    }

    twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Matthew">Thank you. Your alert has been acknowledged.</Say>
</Response>`;
  } else if (digit === '2') {
    const alert = await Alert.findOne({ twilioCallSid: callSid });
    if (alert && alert.anomalyId) {
      await Anomaly.findByIdAndUpdate(alert.anomalyId, {
        status: 'dismissed',
      });
    }

    twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Matthew">Alert dismissed. Goodbye.</Say>
</Response>`;
  } else {
    twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Matthew">Invalid input. Goodbye.</Say>
</Response>`;
  }

  res.type('text/xml');
  res.send(twiml);
};

const testCallValidation = [
  body('phoneNumber').optional().trim().notEmpty().withMessage('phoneNumber cannot be empty'),
];

module.exports = {
  getAlerts,
  acknowledgeAlert,
  testCall,
  twilioGather,
  testCallValidation,
};
