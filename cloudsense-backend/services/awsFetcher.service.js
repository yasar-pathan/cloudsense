const { AssumeRoleCommand } = require('@aws-sdk/client-sts');
const {
  GetCostAndUsageCommand,
} = require('@aws-sdk/client-cost-explorer');
const {
  DescribeInstancesCommand,
  DescribeNatGatewaysCommand,
  DescribeAddressesCommand,
} = require('@aws-sdk/client-ec2');
const { DescribeDBInstancesCommand } = require('@aws-sdk/client-rds');
const {
  ListBucketsCommand,
  GetBucketLifecycleConfigurationCommand,
} = require('@aws-sdk/client-s3');
const { ListFunctionsCommand } = require('@aws-sdk/client-lambda');
const { DescribeLogGroupsCommand } = require('@aws-sdk/client-cloudwatch-logs');
const { GetMetricStatisticsCommand } = require('@aws-sdk/client-cloudwatch');
const { createSTSClient, createServiceClient } = require('../config/aws');
const { getServiceName } = require('../utils/awsRegions');
const { roundUSD } = require('../utils/costCalculator');
const logger = require('../utils/logger');

/**
 * Assume an IAM role using STS with external ID
 * @param {string} roleArn - IAM role ARN to assume
 * @param {string} externalId - External ID for confused deputy protection
 * @param {string} [region='us-east-1'] - AWS region for STS client
 * @returns {Promise<{accessKeyId: string, secretAccessKey: string, sessionToken: string}>}
 */
const assumeRole = async (roleArn, externalId, region = 'us-east-1') => {
  const stsClient = createSTSClient(region);

  logger.info('AWS STS AssumeRole', { roleArn });

  const command = new AssumeRoleCommand({
    RoleArn: roleArn,
    RoleSessionName: `CloudSense-${Date.now()}`,
    ExternalId: externalId,
    DurationSeconds: 3600,
  });

  const response = await stsClient.send(command);

  if (!response.Credentials) {
    throw new Error('Failed to obtain temporary credentials from STS');
  }

  return {
    accessKeyId: response.Credentials.AccessKeyId,
    secretAccessKey: response.Credentials.SecretAccessKey,
    sessionToken: response.Credentials.SessionToken,
  };
};

/**
 * Get start and end dates for current billing month
 * @returns {{start: string, end: string, billingPeriodStart: Date, billingPeriodEnd: Date}}
 */
const getCurrentMonthDateRange = () => {
  const now = new Date();
  const billingPeriodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const billingPeriodEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  const format = (date) => date.toISOString().split('T')[0];

  return {
    start: format(billingPeriodStart),
    end: format(billingPeriodEnd),
    billingPeriodStart,
    billingPeriodEnd,
  };
};

/**
 * Get total cost for current month from Cost Explorer
 * @param {Object} credentials - Temporary AWS credentials
 * @param {string} region - AWS region
 * @returns {Promise<{totalCostUSD: number, billingPeriodStart: Date, billingPeriodEnd: Date}>}
 */
const getMonthlyTotalCost = async (credentials, region) => {
  const client = createServiceClient('costExplorer', credentials, region);
  const { start, end, billingPeriodStart, billingPeriodEnd } = getCurrentMonthDateRange();

  logger.info('AWS Cost Explorer getMonthlyTotalCost', { start, end });

  const command = new GetCostAndUsageCommand({
    TimePeriod: { Start: start, End: end },
    Granularity: 'MONTHLY',
    Metrics: ['UnblendedCost'],
  });

  const response = await client.send(command);
  const result = response.ResultsByTime?.[0];
  const amount = parseFloat(result?.Total?.UnblendedCost?.Amount || '0');

  return {
    totalCostUSD: roundUSD(amount),
    billingPeriodStart,
    billingPeriodEnd,
    rawResponse: response,
  };
};

/**
 * Get cost breakdown by AWS service for current month
 * @param {Object} credentials - Temporary AWS credentials
 * @param {string} region - AWS region
 * @returns {Promise<Array<{service: string, serviceName: string, costUSD: number, unit: string, usageDetails: Object}>>}
 */
const getCostByService = async (credentials, region) => {
  const client = createServiceClient('costExplorer', credentials, region);
  const { start, end } = getCurrentMonthDateRange();

  logger.info('AWS Cost Explorer getCostByService', { start, end });

  const command = new GetCostAndUsageCommand({
    TimePeriod: { Start: start, End: end },
    Granularity: 'MONTHLY',
    Metrics: ['UnblendedCost', 'UsageQuantity'],
    GroupBy: [{ Type: 'DIMENSION', Key: 'SERVICE' }],
  });

  const response = await client.send(command);
  const groups = response.ResultsByTime?.[0]?.Groups || [];

  return groups
    .map((group) => {
      const service = group.Keys?.[0] || 'Unknown';
      const costUSD = roundUSD(parseFloat(group.Metrics?.UnblendedCost?.Amount || '0'));
      const unit = group.Metrics?.UnblendedCost?.Unit || 'USD';

      return {
        service,
        serviceName: getServiceName(service),
        costUSD,
        unit,
        usageDetails: group.Metrics,
      };
    })
    .filter((item) => item.costUSD > 0)
    .sort((a, b) => b.costUSD - a.costUSD);
};

/**
 * Describe all EC2 instances in the account
 * @param {Object} credentials - Temporary AWS credentials
 * @param {string} region - AWS region
 * @returns {Promise<Array<{instanceId: string, instanceType: string, state: string, launchTime: Date, availabilityZone: string}>>}
 */
const getEC2Instances = async (credentials, region) => {
  const client = createServiceClient('ec2', credentials, region);

  logger.info('AWS EC2 describeInstances', { region });

  const command = new DescribeInstancesCommand({});
  const response = await client.send(command);

  const instances = [];

  for (const reservation of response.Reservations || []) {
    for (const instance of reservation.Instances || []) {
      instances.push({
        instanceId: instance.InstanceId,
        instanceType: instance.InstanceType,
        state: instance.State?.Name,
        launchTime: instance.LaunchTime,
        availabilityZone: instance.Placement?.AvailabilityZone,
      });
    }
  }

  return instances;
};

/**
 * Describe all RDS DB instances
 * @param {Object} credentials - Temporary AWS credentials
 * @param {string} region - AWS region
 * @returns {Promise<Array<{dbInstanceId: string, dbInstanceClass: string, engine: string, multiAZ: boolean, status: string}>>}
 */
const getRDSInstances = async (credentials, region) => {
  const client = createServiceClient('rds', credentials, region);

  logger.info('AWS RDS describeDBInstances', { region });

  const command = new DescribeDBInstancesCommand({});
  const response = await client.send(command);

  return (response.DBInstances || []).map((db) => ({
    dbInstanceId: db.DBInstanceIdentifier,
    dbInstanceClass: db.DBInstanceClass,
    engine: db.Engine,
    multiAZ: db.MultiAZ || false,
    status: db.DBInstanceStatus,
  }));
};

/**
 * List S3 buckets and check lifecycle policies
 * @param {Object} credentials - Temporary AWS credentials
 * @param {string} region - AWS region
 * @returns {Promise<Array<{bucketName: string, hasLifecyclePolicy: boolean, creationDate: Date}>>}
 */
const getS3Buckets = async (credentials, region) => {
  const client = createServiceClient('s3', credentials, region);

  logger.info('AWS S3 listBuckets', { region });

  const command = new ListBucketsCommand({});
  const response = await client.send(command);

  const buckets = [];

  for (const bucket of response.Buckets || []) {
    let hasLifecyclePolicy = false;

    try {
      const lifecycleCommand = new GetBucketLifecycleConfigurationCommand({
        Bucket: bucket.Name,
      });
      const lifecycleResponse = await client.send(lifecycleCommand);
      hasLifecyclePolicy = (lifecycleResponse.Rules?.length || 0) > 0;
    } catch (error) {
      if (error.name !== 'NoSuchLifecycleConfiguration' && error.$metadata?.httpStatusCode !== 404) {
        logger.debug('S3 lifecycle check failed', { bucket: bucket.Name, error: error.message });
      }
    }

    buckets.push({
      bucketName: bucket.Name,
      hasLifecyclePolicy,
      creationDate: bucket.CreationDate,
    });
  }

  return buckets;
};

/**
 * List Lambda functions
 * @param {Object} credentials - Temporary AWS credentials
 * @param {string} region - AWS region
 * @returns {Promise<Array<{functionName: string, memorySize: number, runtime: string, lastModified: string}>>}
 */
const getLambdaFunctions = async (credentials, region) => {
  const client = createServiceClient('lambda', credentials, region);

  logger.info('AWS Lambda listFunctions', { region });

  const command = new ListFunctionsCommand({});
  const response = await client.send(command);

  return (response.Functions || []).map((fn) => ({
    functionName: fn.FunctionName,
    memorySize: fn.MemorySize,
    runtime: fn.Runtime,
    lastModified: fn.LastModified,
  }));
};

/**
 * Describe NAT Gateways
 * @param {Object} credentials - Temporary AWS credentials
 * @param {string} region - AWS region
 * @returns {Promise<Array<{natGatewayId: string, state: string, vpcId: string, subnetId: string, createTime: Date}>>}
 */
const getNATGateways = async (credentials, region) => {
  const client = createServiceClient('ec2', credentials, region);

  logger.info('AWS EC2 describeNatGateways', { region });

  const command = new DescribeNatGatewaysCommand({});
  const response = await client.send(command);

  return (response.NatGateways || []).map((nat) => ({
    natGatewayId: nat.NatGatewayId,
    state: nat.State,
    vpcId: nat.VpcId,
    subnetId: nat.SubnetId,
    createTime: nat.CreateTime,
  }));
};

/**
 * Describe Elastic IP addresses
 * @param {Object} credentials - Temporary AWS credentials
 * @param {string} region - AWS region
 * @returns {Promise<Array<{allocationId: string, publicIp: string, instanceId: string|null, associationId: string|null}>>}
 */
const getElasticIPs = async (credentials, region) => {
  const client = createServiceClient('ec2', credentials, region);

  logger.info('AWS EC2 describeAddresses', { region });

  const command = new DescribeAddressesCommand({});
  const response = await client.send(command);

  return (response.Addresses || []).map((addr) => ({
    allocationId: addr.AllocationId,
    publicIp: addr.PublicIp,
    instanceId: addr.InstanceId || null,
    associationId: addr.AssociationId || null,
  }));
};

/**
 * Describe CloudWatch log groups
 * @param {Object} credentials - Temporary AWS credentials
 * @param {string} region - AWS region
 * @returns {Promise<Array<{logGroupName: string, retentionInDays: number|null, storedBytes: number}>>}
 */
const getCloudWatchLogGroups = async (credentials, region) => {
  const client = createServiceClient('cloudWatchLogs', credentials, region);

  logger.info('AWS CloudWatch Logs describeLogGroups', { region });

  const command = new DescribeLogGroupsCommand({});
  const response = await client.send(command);

  return (response.logGroups || []).map((lg) => ({
    logGroupName: lg.logGroupName,
    retentionInDays: lg.retentionInDays ?? null,
    storedBytes: lg.storedBytes || 0,
  }));
};

/**
 * Get EC2 CPU utilization metrics for an instance
 * @param {Object} credentials - Temporary AWS credentials
 * @param {string} region - AWS region
 * @param {string} instanceId - EC2 instance ID
 * @param {number} [days=7] - Number of days of metrics to fetch
 * @returns {Promise<Array<{timestamp: Date, average: number}>>}
 */
const getEC2MetricsCPU = async (credentials, region, instanceId, days = 7) => {
  const client = createServiceClient('cloudWatch', credentials, region);

  logger.info('AWS CloudWatch getMetricStatistics', { instanceId, days });

  const endTime = new Date();
  const startTime = new Date();
  startTime.setDate(startTime.getDate() - days);

  const command = new GetMetricStatisticsCommand({
    Namespace: 'AWS/EC2',
    MetricName: 'CPUUtilization',
    Dimensions: [{ Name: 'InstanceId', Value: instanceId }],
    StartTime: startTime,
    EndTime: endTime,
    Period: 3600,
    Statistics: ['Average'],
  });

  const response = await client.send(command);

  return (response.Datapoints || [])
    .map((dp) => ({
      timestamp: dp.Timestamp,
      average: dp.Average,
    }))
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
};

/**
 * Fetch all AWS data needed for anomaly detection and usage snapshots
 * @param {Object} connection - AwsConnection document
 * @returns {Promise<Object>} Combined AWS resource data
 */
const fetchAllAwsData = async (connection) => {
  const credentials = await assumeRole(connection.roleArn, connection.externalId, connection.region);
  const region = connection.region || 'us-east-1';

  const [
    monthlyCost,
    costByService,
    ec2Instances,
    rdsInstances,
    s3Buckets,
    lambdaFunctions,
    natGateways,
    elasticIPs,
    logGroups,
  ] = await Promise.all([
    getMonthlyTotalCost(credentials, region),
    getCostByService(credentials, region),
    getEC2Instances(credentials, region),
    getRDSInstances(credentials, region),
    getS3Buckets(credentials, region),
    getLambdaFunctions(credentials, region),
    getNATGateways(credentials, region),
    getElasticIPs(credentials, region),
    getCloudWatchLogGroups(credentials, region),
  ]);

  const runningInstances = ec2Instances.filter((i) => i.state === 'running');
  const cpuMetrics = {};

  for (const instance of runningInstances.slice(0, 10)) {
    try {
      cpuMetrics[instance.instanceId] = await getEC2MetricsCPU(
        credentials,
        region,
        instance.instanceId,
        7
      );
    } catch (error) {
      logger.warn('Failed to fetch CPU metrics', { instanceId: instance.instanceId });
      cpuMetrics[instance.instanceId] = [];
    }
  }

  return {
    credentials,
    monthlyCost,
    costByService,
    ec2Instances,
    rdsInstances,
    s3Buckets,
    lambdaFunctions,
    natGateways,
    elasticIPs,
    logGroups,
    cpuMetrics,
  };
};

module.exports = {
  assumeRole,
  getMonthlyTotalCost,
  getCostByService,
  getEC2Instances,
  getRDSInstances,
  getS3Buckets,
  getLambdaFunctions,
  getNATGateways,
  getElasticIPs,
  getCloudWatchLogGroups,
  getEC2MetricsCPU,
  fetchAllAwsData,
};
