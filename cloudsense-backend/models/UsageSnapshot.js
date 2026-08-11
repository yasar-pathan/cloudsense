const mongoose = require('mongoose');

const serviceCostSchema = new mongoose.Schema(
  {
    service: { type: String, required: true },
    serviceName: { type: String, required: true },
    costUSD: { type: Number, required: true },
    usageDetails: { type: mongoose.Schema.Types.Mixed },
  },
  { _id: false }
);

const usageSnapshotSchema = new mongoose.Schema(
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
    snapshotDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    billingPeriodStart: {
      type: Date,
      required: true,
    },
    billingPeriodEnd: {
      type: Date,
      required: true,
    },
    totalCostUSD: {
      type: Number,
      required: true,
    },
    serviceCosts: [serviceCostSchema],
    rawCostExplorerResponse: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

usageSnapshotSchema.index({ userId: 1, snapshotDate: -1 });
usageSnapshotSchema.index({ awsConnectionId: 1, snapshotDate: -1 });

module.exports = mongoose.model('UsageSnapshot', usageSnapshotSchema);
