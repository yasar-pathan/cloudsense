const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema(
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
    type: {
      type: String,
      enum: ['overall', 'per_service'],
      required: true,
    },
    service: {
      type: String,
      default: null,
    },
    monthlyLimit: {
      type: Number,
      required: [true, 'Monthly limit is required'],
      min: [0.01, 'Monthly limit must be greater than 0'],
    },
    alertAtPercent: {
      type: Number,
      default: 80,
      min: 1,
      max: 100,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

budgetSchema.index({ userId: 1, awsConnectionId: 1 });

module.exports = mongoose.model('Budget', budgetSchema);
