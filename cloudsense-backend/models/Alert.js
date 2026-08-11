const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    anomalyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Anomaly',
      default: null,
    },
    budgetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Budget',
      default: null,
    },
    awsConnectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AwsConnection',
    },
    type: {
      type: String,
      enum: ['budget_breach', 'anomaly_detected'],
      required: true,
    },
    channel: {
      type: String,
      enum: ['phone_call', 'email', 'in_app'],
      default: 'phone_call',
    },
    status: {
      type: String,
      enum: ['sent', 'failed', 'acknowledged'],
      default: 'sent',
    },
    phoneNumber: {
      type: String,
    },
    twilioCallSid: {
      type: String,
    },
    message: {
      type: String,
      required: true,
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
    acknowledgedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

alertSchema.index({ userId: 1, sentAt: -1 });

module.exports = mongoose.model('Alert', alertSchema);
