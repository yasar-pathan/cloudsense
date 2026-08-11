const mongoose = require('mongoose');

const awsConnectionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    roleArn: {
      type: String,
      required: [true, 'IAM Role ARN is required'],
      trim: true,
    },
    externalId: {
      type: String,
      required: [true, 'External ID is required'],
      trim: true,
    },
    accountId: {
      type: String,
      trim: true,
    },
    accountAlias: {
      type: String,
      trim: true,
    },
    region: {
      type: String,
      default: 'us-east-1',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastSyncedAt: {
      type: Date,
    },
    connectionStatus: {
      type: String,
      enum: ['connected', 'error', 'pending'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

awsConnectionSchema.index({ userId: 1 });

module.exports = mongoose.model('AwsConnection', awsConnectionSchema);
