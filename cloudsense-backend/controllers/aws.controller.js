const { v4: uuidv4 } = require('uuid');
const { validationResult, body } = require('express-validator');
const AwsConnection = require('../models/AwsConnection');
const awsFetcher = require('../services/awsFetcher.service');

/**
 * Generate external ID for IAM trust policy
 */
const generateExternalId = async (req, res) => {
  const externalId = uuidv4();

  res.json({
    success: true,
    data: { externalId },
  });
};

/**
 * Connect AWS account via IAM Role
 */
const connect = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg });
  }

  const { roleArn, externalId, region = 'us-east-1' } = req.body;

  try {
    const credentials = await awsFetcher.assumeRole(roleArn, externalId, region);
    const accountIdMatch = roleArn.match(/:(\d{12}):/);
    const accountId = accountIdMatch ? accountIdMatch[1] : null;

    const existingConnection = await AwsConnection.findOne({
      userId: req.user._id,
      roleArn,
      isActive: true,
    });

    if (existingConnection) {
      existingConnection.externalId = externalId;
      existingConnection.region = region;
      existingConnection.accountId = accountId;
      existingConnection.connectionStatus = 'connected';
      await existingConnection.save();

      return res.json({ success: true, data: { connection: existingConnection } });
    }

    const connection = await AwsConnection.create({
      userId: req.user._id,
      roleArn,
      externalId,
      region,
      accountId,
      connectionStatus: 'connected',
    });

    res.status(201).json({ success: true, data: { connection } });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: `Failed to assume IAM role: ${error.message}. Verify the ARN and trust policy.`,
    });
  }
};

/**
 * Get all AWS connections for current user
 */
const getConnections = async (req, res) => {
  const connections = await AwsConnection.find({
    userId: req.user._id,
    isActive: true,
  }).sort({ createdAt: -1 });

  res.json({ success: true, data: connections });
};

/**
 * Soft delete an AWS connection
 */
const deleteConnection = async (req, res) => {
  const connection = await AwsConnection.findOne({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!connection) {
    return res.status(404).json({ success: false, message: 'Connection not found' });
  }

  connection.isActive = false;
  await connection.save();

  res.json({ success: true, data: { message: 'Connection deactivated' } });
};

/**
 * Test AWS connection by attempting AssumeRole
 */
const testConnection = async (req, res) => {
  const connection = await AwsConnection.findOne({
    _id: req.params.id,
    userId: req.user._id,
    isActive: true,
  });

  if (!connection) {
    return res.status(404).json({ success: false, message: 'Connection not found' });
  }

  try {
    await awsFetcher.assumeRole(connection.roleArn, connection.externalId, connection.region);
    connection.connectionStatus = 'connected';
    await connection.save();

    res.json({
      success: true,
      data: { status: 'connected', message: 'Connection is valid' },
    });
  } catch (error) {
    connection.connectionStatus = 'error';
    await connection.save();

    res.json({
      success: true,
      data: { status: 'error', message: error.message },
    });
  }
};

const connectValidation = [
  body('roleArn')
    .trim()
    .notEmpty()
    .matches(/^arn:aws:iam::\d{12}:role\/.+$/)
    .withMessage('Valid IAM Role ARN is required'),
  body('externalId').trim().notEmpty().withMessage('External ID is required'),
  body('region').optional().isString(),
];

module.exports = {
  generateExternalId,
  connect,
  getConnections,
  deleteConnection,
  testConnection,
  connectValidation,
};
