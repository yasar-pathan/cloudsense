const { STSClient } = require('@aws-sdk/client-sts');
const { EC2Client } = require('@aws-sdk/client-ec2');
const { RDSClient } = require('@aws-sdk/client-rds');
const { S3Client } = require('@aws-sdk/client-s3');
const { LambdaClient } = require('@aws-sdk/client-lambda');
const { CostExplorerClient } = require('@aws-sdk/client-cost-explorer');
const { CloudWatchLogsClient } = require('@aws-sdk/client-cloudwatch-logs');
const { CloudWatchClient } = require('@aws-sdk/client-cloudwatch');

/**
 * Create STS client using platform AWS credentials
 * @param {string} [region='us-east-1']
 * @returns {STSClient}
 */
const createSTSClient = (region = 'us-east-1') => {
  return new STSClient({
    region,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });
};

/**
 * Create AWS service client with temporary STS credentials
 * @param {string} service - Service name: ec2, rds, s3, lambda, costExplorer, cloudWatchLogs, cloudWatch
 * @param {Object} credentials - Temporary credentials from AssumeRole
 * @param {string} region - AWS region
 * @returns {Object} AWS SDK client instance
 */
const createServiceClient = (service, credentials, region = 'us-east-1') => {
  const clientConfig = {
    region,
    credentials: {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      sessionToken: credentials.sessionToken,
    },
  };

  const clients = {
    ec2: () => new EC2Client(clientConfig),
    rds: () => new RDSClient(clientConfig),
    s3: () => new S3Client(clientConfig),
    lambda: () => new LambdaClient(clientConfig),
    costExplorer: () => new CostExplorerClient({ ...clientConfig, region: 'us-east-1' }),
    cloudWatchLogs: () => new CloudWatchLogsClient(clientConfig),
    cloudWatch: () => new CloudWatchClient(clientConfig),
  };

  const factory = clients[service];
  if (!factory) {
    throw new Error(`Unknown AWS service: ${service}`);
  }

  return factory();
};

module.exports = {
  createSTSClient,
  createServiceClient,
};
