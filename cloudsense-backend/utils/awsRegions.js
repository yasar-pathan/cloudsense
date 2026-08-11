/**
 * AWS service code to human-readable name mapping
 */
const SERVICE_NAMES = {
  AmazonEC2: 'Amazon EC2',
  AmazonRDS: 'Amazon RDS',
  AmazonS3: 'Amazon S3',
  AWSLambda: 'AWS Lambda',
  AmazonCloudWatch: 'Amazon CloudWatch',
  AWSDataTransfer: 'AWS Data Transfer',
  AmazonCloudFront: 'Amazon CloudFront',
  AmazonVPC: 'Amazon VPC',
  AmazonDynamoDB: 'Amazon DynamoDB',
  AmazonElastiCache: 'Amazon ElastiCache',
  AmazonECS: 'Amazon ECS',
  AmazonEKS: 'Amazon EKS',
  AmazonRoute53: 'Amazon Route 53',
  AWSELB: 'Elastic Load Balancing',
  AmazonSNS: 'Amazon SNS',
  AmazonSQS: 'Amazon SQS',
};

/**
 * Default AWS region
 */
const DEFAULT_REGION = 'us-east-1';

/**
 * Supported AWS regions for connections
 */
const SUPPORTED_REGIONS = [
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  'eu-west-1',
  'eu-central-1',
  'ap-southeast-1',
  'ap-northeast-1',
];

/**
 * Get human-readable service name from AWS service code
 * @param {string} serviceCode
 * @returns {string}
 */
const getServiceName = (serviceCode) => {
  return SERVICE_NAMES[serviceCode] || serviceCode;
};

module.exports = {
  SERVICE_NAMES,
  DEFAULT_REGION,
  SUPPORTED_REGIONS,
  getServiceName,
};
