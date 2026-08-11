const { validationResult, body, query } = require('express-validator');
const Budget = require('../models/Budget');
const UsageSnapshot = require('../models/UsageSnapshot');
const AwsConnection = require('../models/AwsConnection');
const { roundUSD, calculatePercentUsed } = require('../utils/costCalculator');

/**
 * Get all budgets for a connection
 */
const getBudgets = async (req, res) => {
  const { connectionId } = req.query;

  if (!connectionId) {
    return res.status(400).json({ success: false, message: 'connectionId is required' });
  }

  const connection = await AwsConnection.findOne({
    _id: connectionId,
    userId: req.user._id,
    isActive: true,
  });

  if (!connection) {
    return res.status(404).json({ success: false, message: 'Connection not found' });
  }

  const budgets = await Budget.find({
    userId: req.user._id,
    awsConnectionId: connectionId,
  }).sort({ createdAt: -1 });

  res.json({ success: true, data: budgets });
};

/**
 * Create a new budget
 */
const createBudget = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg });
  }

  const { connectionId, type, service, monthlyLimit, alertAtPercent = 80 } = req.body;

  const connection = await AwsConnection.findOne({
    _id: connectionId,
    userId: req.user._id,
    isActive: true,
  });

  if (!connection) {
    return res.status(404).json({ success: false, message: 'Connection not found' });
  }

  if (type === 'overall') {
    const existingOverall = await Budget.findOne({
      userId: req.user._id,
      awsConnectionId: connectionId,
      type: 'overall',
      isActive: true,
    });

    if (existingOverall) {
      return res.status(409).json({
        success: false,
        message: 'An overall budget already exists for this connection',
      });
    }
  }

  const budget = await Budget.create({
    userId: req.user._id,
    awsConnectionId: connectionId,
    type,
    service: type === 'per_service' ? service : null,
    monthlyLimit,
    alertAtPercent,
  });

  res.status(201).json({ success: true, data: budget });
};

/**
 * Update a budget
 */
const updateBudget = async (req, res) => {
  const budget = await Budget.findOne({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!budget) {
    return res.status(404).json({ success: false, message: 'Budget not found' });
  }

  const { monthlyLimit, alertAtPercent, isActive } = req.body;

  if (monthlyLimit !== undefined) budget.monthlyLimit = monthlyLimit;
  if (alertAtPercent !== undefined) budget.alertAtPercent = alertAtPercent;
  if (isActive !== undefined) budget.isActive = isActive;

  await budget.save();

  res.json({ success: true, data: budget });
};

/**
 * Delete a budget
 */
const deleteBudget = async (req, res) => {
  const budget = await Budget.findOneAndDelete({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!budget) {
    return res.status(404).json({ success: false, message: 'Budget not found' });
  }

  res.json({ success: true, data: { message: 'Budget deleted' } });
};

/**
 * Get budget status with current spend data
 */
const getBudgetStatus = async (req, res) => {
  const { connectionId } = req.query;

  if (!connectionId) {
    return res.status(400).json({ success: false, message: 'connectionId is required' });
  }

  const connection = await AwsConnection.findOne({
    _id: connectionId,
    userId: req.user._id,
    isActive: true,
  });

  if (!connection) {
    return res.status(404).json({ success: false, message: 'Connection not found' });
  }

  const budgets = await Budget.find({
    userId: req.user._id,
    awsConnectionId: connectionId,
    isActive: true,
  });

  let latestSnapshot = await UsageSnapshot.findOne({
    awsConnectionId: connectionId,
  }).sort({ snapshotDate: -1 });

  const statusList = budgets.map((budget) => {
    let currentSpend = 0;

    if (latestSnapshot) {
      if (budget.type === 'overall') {
        currentSpend = latestSnapshot.totalCostUSD;
      } else {
        const serviceEntry = latestSnapshot.serviceCosts.find((s) => s.service === budget.service);
        currentSpend = serviceEntry ? serviceEntry.costUSD : 0;
      }
    }

    const percentUsed = calculatePercentUsed(currentSpend, budget.monthlyLimit);

    return {
      budgetId: budget._id,
      type: budget.type,
      service: budget.service,
      monthlyLimit: budget.monthlyLimit,
      alertAtPercent: budget.alertAtPercent,
      currentSpend: roundUSD(currentSpend),
      percentUsed,
      remaining: roundUSD(Math.max(0, budget.monthlyLimit - currentSpend)),
      isBreached: currentSpend >= budget.monthlyLimit,
      isNearBreached: percentUsed >= budget.alertAtPercent,
    };
  });

  res.json({ success: true, data: statusList });
};

const createBudgetValidation = [
  body('connectionId').notEmpty().withMessage('connectionId is required'),
  body('type').isIn(['overall', 'per_service']).withMessage('type must be overall or per_service'),
  body('service')
    .if(body('type').equals('per_service'))
    .notEmpty()
    .withMessage('service is required for per_service budgets'),
  body('monthlyLimit').isFloat({ min: 0.01 }).withMessage('monthlyLimit must be greater than 0'),
  body('alertAtPercent')
    .optional()
    .isFloat({ min: 1, max: 100 })
    .withMessage('alertAtPercent must be between 1 and 100'),
];

module.exports = {
  getBudgets,
  createBudget,
  updateBudget,
  deleteBudget,
  getBudgetStatus,
  createBudgetValidation,
};
