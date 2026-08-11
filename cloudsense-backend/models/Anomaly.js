const mongoose = require('mongoose');

const anomalySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    awsConnectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AwsConnection',
      required: true,
    },
    detectedAt: {
      type: Date,
      default: Date.now,
    },
    pattern: {
      type: String,
      required: true,
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      required: true,
    },
    confidenceScore: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    affectedService: {
      type: String,
    },
    affectedResourceId: {
      type: String,
    },
    estimatedMonthlyCostImpact: {
      type: Number,
      default: 0,
    },
    recommendedAction: {
      type: String,
    },
    status: {
      type: String,
      enum: ['open', 'alerted', 'resolved', 'dismissed'],
      default: 'open',
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

anomalySchema.index({ userId: 1, status: 1, detectedAt: -1 });
anomalySchema.index({ awsConnectionId: 1, pattern: 1, affectedResourceId: 1 });

module.exports = mongoose.model('Anomaly', anomalySchema);
