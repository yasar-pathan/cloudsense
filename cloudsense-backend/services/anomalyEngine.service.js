const {
  estimateEC2MonthlyCost,
  roundUSD,
  daysUntilBudgetExhaustion,
  getServiceCostFromSnapshot,
  getDataTransferCost,
  isLargeRDSInstance,
} = require('../utils/costCalculator');
const aiAnalysisService = require('./aiAnalysis.service');
const logger = require('../utils/logger');

const CONFIDENCE_THRESHOLD = parseFloat(process.env.ALERT_CONFIDENCE_THRESHOLD || '0.75');

/**
 * Build base anomaly object structure
 * @param {Object} params
 * @returns {Object}
 */
const buildAnomaly = (params) => ({
  pattern: params.pattern,
  severity: params.severity,
  confidenceScore: params.confidenceScore,
  title: params.title,
  description: params.description,
  affectedService: params.affectedService || null,
  affectedResourceId: params.affectedResourceId || null,
  estimatedMonthlyCostImpact: roundUSD(params.estimatedMonthlyCostImpact || 0),
  recommendedAction: params.recommendedAction || '',
  userId: params.userId,
  awsConnectionId: params.connectionId,
  status: 'open',
});

/**
 * Check if EC2 instance costs exceed budget capacity
 * @param {Array<Object>} budgets - Budget documents
 * @param {Array<Object>} ec2Instances - EC2 instance data
 * @param {string} userId
 * @param {string} connectionId
 * @returns {Array<Object>}
 */
const checkBudgetInstanceMismatch = (budgets, ec2Instances, userId, connectionId) => {
  const anomalies = [];
  const overallBudget = budgets.find((b) => b.type === 'overall' && b.isActive);
  const ec2Budget = budgets.find(
    (b) => b.type === 'per_service' && b.service === 'AmazonEC2' && b.isActive
  );
  const budget = ec2Budget || overallBudget;

  if (!budget) return anomalies;

  const runningInstances = ec2Instances.filter((i) => i.state === 'running');
  const now = new Date();
  const daysElapsed = now.getUTCDate();

  for (const instance of runningInstances) {
    const estimatedMonthly = estimateEC2MonthlyCost(instance.instanceType);
    const budgetLimit = budget.monthlyLimit;

    let severity = null;
    let confidence = 0;

    if (estimatedMonthly > budgetLimit * 1.5) {
      severity = 'critical';
      confidence = 0.95;
    } else if (estimatedMonthly > budgetLimit) {
      severity = 'high';
      confidence = 0.9;
    } else if (estimatedMonthly > budgetLimit * 0.8) {
      severity = 'medium';
      confidence = 0.8;
    }

    if (!severity) continue;

    const daysLeft = daysUntilBudgetExhaustion(estimatedMonthly, budgetLimit, daysElapsed);

    anomalies.push(
      buildAnomaly({
        pattern: 'BUDGET_INSTANCE_MISMATCH',
        severity,
        confidenceScore: confidence,
        title: 'Instance type exceeds budget capacity',
        description:
          `Your ${instance.instanceType} instance (${instance.instanceId}) costs approximately ` +
          `$${roundUSD(estimatedMonthly)}/month but your budget is $${roundUSD(budgetLimit)}. ` +
          `At this rate your budget will be exhausted in ${daysLeft} days.`,
        affectedService: 'AmazonEC2',
        affectedResourceId: instance.instanceId,
        estimatedMonthlyCostImpact: estimatedMonthly - budgetLimit,
        recommendedAction:
          'Consider downsizing to a smaller instance type or increasing your budget allocation.',
        userId,
        connectionId,
      })
    );
  }

  return anomalies;
};

/**
 * Check for idle NAT Gateways with near-zero traffic
 * @param {Array<Object>} natGateways
 * @param {Object} usageSnapshot
 * @param {string} userId
 * @param {string} connectionId
 * @returns {Array<Object>}
 */
const checkNATGatewayIdle = (natGateways, usageSnapshot, userId, connectionId) => {
  const anomalies = [];
  const activeNats = natGateways.filter((n) => n.state === 'available');

  if (activeNats.length === 0) return anomalies;

  const vpcCost = getServiceCostFromSnapshot(usageSnapshot, 'AmazonVPC');
  const dataTransferCost = getDataTransferCost(usageSnapshot);
  const natRelatedCost = vpcCost + dataTransferCost;

  if (natRelatedCost >= 1) return anomalies;

  for (const nat of activeNats) {
    anomalies.push(
      buildAnomaly({
        pattern: 'NAT_GATEWAY_IDLE',
        severity: 'medium',
        confidenceScore: 0.85,
        title: 'Idle NAT Gateway detected',
        description:
          `You have a NAT Gateway (${nat.natGatewayId}) running with near-zero traffic. ` +
          'NAT Gateways cost ~$32/month even when idle. Consider deleting it if not actively needed.',
        affectedService: 'AmazonVPC',
        affectedResourceId: nat.natGatewayId,
        estimatedMonthlyCostImpact: 32,
        recommendedAction: 'Delete the NAT Gateway if it is not required, or route traffic through a more cost-effective solution.',
        userId,
        connectionId,
      })
    );
  }

  return anomalies;
};

/**
 * Check for unattached Elastic IP addresses
 * @param {Array<Object>} elasticIPs
 * @param {string} userId
 * @param {string} connectionId
 * @returns {Array<Object>}
 */
const checkEIPUnattached = (elasticIPs, userId, connectionId) => {
  const unattached = elasticIPs.filter(
    (eip) => !eip.instanceId || !eip.associationId
  );

  if (unattached.length === 0) return [];

  const costPerEip = 3.65;
  const totalImpact = unattached.length * costPerEip;

  return [
    buildAnomaly({
      pattern: 'EIP_UNATTACHED',
      severity: 'low',
      confidenceScore: 0.99,
      title: 'Unattached Elastic IP addresses',
      description:
        `You have ${unattached.length} unattached Elastic IP address(es). ` +
        'AWS charges ~$3.65/month per unattached EIP.',
      affectedService: 'AmazonEC2',
      affectedResourceId: unattached.map((e) => e.allocationId).join(','),
      estimatedMonthlyCostImpact: totalImpact,
      recommendedAction: 'Release unattached Elastic IPs or associate them with running instances.',
      userId,
      connectionId,
    }),
  ];
};

/**
 * Check S3 buckets without lifecycle policies when storage costs are significant
 * @param {Array<Object>} s3Buckets
 * @param {Object} usageSnapshot
 * @param {string} userId
 * @param {string} connectionId
 * @returns {Array<Object>}
 */
const checkS3NoLifecyclePolicy = (s3Buckets, usageSnapshot, userId, connectionId) => {
  const anomalies = [];
  const s3Cost = getServiceCostFromSnapshot(usageSnapshot, 'AmazonS3');

  if (s3Cost <= 5) return anomalies;

  const bucketsWithoutLifecycle = s3Buckets.filter((b) => !b.hasLifecyclePolicy);

  for (const bucket of bucketsWithoutLifecycle) {
    anomalies.push(
      buildAnomaly({
        pattern: 'S3_NO_LIFECYCLE',
        severity: 'medium',
        confidenceScore: 0.8,
        title: 'S3 bucket missing lifecycle policy',
        description:
          `Bucket "${bucket.bucketName}" has no lifecycle policy and your S3 costs are $${roundUSD(s3Cost)}/month. ` +
          'Without lifecycle rules, old data accumulates and increases storage costs.',
        affectedService: 'AmazonS3',
        affectedResourceId: bucket.bucketName,
        estimatedMonthlyCostImpact: s3Cost * 0.3,
        recommendedAction:
          'Add lifecycle rules to transition infrequently accessed data to cheaper storage tiers or expire old objects.',
        userId,
        connectionId,
      })
    );
  }

  return anomalies;
};

/**
 * Check for overprovisioned Lambda functions with high memory
 * @param {Array<Object>} lambdaFunctions
 * @param {Object} usageSnapshot
 * @param {string} userId
 * @param {string} connectionId
 * @returns {Array<Object>}
 */
const checkLambdaOverprovisioned = (lambdaFunctions, usageSnapshot, userId, connectionId) => {
  const anomalies = [];
  const lambdaCost = getServiceCostFromSnapshot(usageSnapshot, 'AWSLambda');
  const highMemoryFunctions = lambdaFunctions.filter((fn) => fn.memorySize >= 1024);

  for (const fn of highMemoryFunctions) {
    let confidence = 0.75;
    let severity = 'low';

    if (lambdaCost > 1) {
      confidence = 0.85;
      severity = 'medium';
    }

    anomalies.push(
      buildAnomaly({
        pattern: 'LAMBDA_OVERPROVISIONED',
        severity,
        confidenceScore: confidence,
        title: 'Overprovisioned Lambda function',
        description:
          `Function "${fn.functionName}" is configured with ${fn.memorySize} MB of memory. ` +
          'High memory allocation increases cost per invocation even if the function does not use it.',
        affectedService: 'AWSLambda',
        affectedResourceId: fn.functionName,
        estimatedMonthlyCostImpact: lambdaCost > 0 ? lambdaCost * 0.4 : 5,
        recommendedAction:
          'Run AWS Lambda Power Tuning or reduce memory allocation based on actual usage patterns.',
        userId,
        connectionId,
      })
    );
  }

  return anomalies;
};

/**
 * Check for oversized RDS instances
 * @param {Array<Object>} rdsInstances
 * @param {Object} usageSnapshot
 * @param {Array<Object>} budgets
 * @param {string} userId
 * @param {string} connectionId
 * @returns {Array<Object>}
 */
const checkRDSOversized = (rdsInstances, usageSnapshot, budgets, userId, connectionId) => {
  const anomalies = [];
  const rdsCost = getServiceCostFromSnapshot(usageSnapshot, 'AmazonRDS');
  const totalCost = usageSnapshot?.totalCostUSD || 0;
  const overallBudget = budgets.find((b) => b.type === 'overall' && b.isActive);

  for (const db of rdsInstances) {
    if (db.status !== 'available') continue;

    const isLarge = isLargeRDSInstance(db.dbInstanceClass);
    const rdsPercentOfBill = totalCost > 0 ? (rdsCost / totalCost) * 100 : 0;

    if (isLarge && rdsPercentOfBill > 40) {
      anomalies.push(
        buildAnomaly({
          pattern: 'RDS_OVERSIZED',
          severity: 'high',
          confidenceScore: 0.85,
          title: 'Oversized RDS instance',
          description:
            `RDS instance "${db.dbInstanceId}" (${db.dbInstanceClass}) accounts for ` +
            `${roundUSD(rdsPercentOfBill)}% of your total AWS bill ($${roundUSD(rdsCost)}/month).`,
          affectedService: 'AmazonRDS',
          affectedResourceId: db.dbInstanceId,
          estimatedMonthlyCostImpact: rdsCost * 0.5,
          recommendedAction:
            'Review instance utilization metrics and consider downsizing or switching to Aurora Serverless.',
          userId,
          connectionId,
        })
      );
    }

    if (db.multiAZ && overallBudget && overallBudget.monthlyLimit < 50) {
      anomalies.push(
        buildAnomaly({
          pattern: 'RDS_OVERSIZED',
          severity: 'high',
          confidenceScore: 0.85,
          title: 'Multi-AZ RDS on low budget',
          description:
            `Multi-AZ RDS instance "${db.dbInstanceId}" doubles your database costs. ` +
            `Your overall budget is only $${roundUSD(overallBudget.monthlyLimit)}/month.`,
          affectedService: 'AmazonRDS',
          affectedResourceId: db.dbInstanceId,
          estimatedMonthlyCostImpact: rdsCost * 0.5,
          recommendedAction:
            'Disable Multi-AZ for development environments or use a single-AZ instance.',
          userId,
          connectionId,
        })
      );
    }
  }

  return anomalies;
};

/**
 * Check for CloudWatch log groups with infinite retention and large storage
 * @param {Array<Object>} logGroups
 * @param {string} userId
 * @param {string} connectionId
 * @returns {Array<Object>}
 */
const checkLogRetentionInfinite = (logGroups, userId, connectionId) => {
  const anomalies = [];
  const BYTES_100MB = 100 * 1024 * 1024;

  for (const lg of logGroups) {
    if (lg.retentionInDays !== null) continue;
    if (lg.storedBytes <= BYTES_100MB) continue;

    const storedGB = lg.storedBytes / (1024 * 1024 * 1024);
    const estimatedCost = storedGB * 0.5;

    anomalies.push(
      buildAnomaly({
        pattern: 'LOG_RETENTION_INFINITE',
        severity: 'low',
        confidenceScore: 0.99,
        title: 'CloudWatch logs with infinite retention',
        description:
          `Log group "${lg.logGroupName}" has no retention limit and stores ` +
          `${roundUSD(storedGB)} GB of data, incurring ongoing storage charges.`,
        affectedService: 'AmazonCloudWatch',
        affectedResourceId: lg.logGroupName,
        estimatedMonthlyCostImpact: estimatedCost,
        recommendedAction: 'Set a retention period (e.g., 30 or 90 days) to automatically delete old log data.',
        userId,
        connectionId,
      })
    );
  }

  return anomalies;
};

/**
 * Check for data transfer cost spikes compared to historical average
 * @param {Array<Object>} usageHistory - Previous usage snapshots
 * @param {Object} currentSnapshot
 * @param {string} userId
 * @param {string} connectionId
 * @returns {Array<Object>}
 */
const checkDataTransferSpike = (usageHistory, currentSnapshot, userId, connectionId) => {
  const currentTransferCost = getDataTransferCost(currentSnapshot);

  if (usageHistory.length < 1) return [];

  const historicalCosts = usageHistory.slice(0, 3).map((snap) => getDataTransferCost(snap));
  const avgHistorical =
    historicalCosts.reduce((sum, c) => sum + c, 0) / historicalCosts.length;

  if (avgHistorical <= 0 || currentTransferCost <= avgHistorical * 2) return [];

  return [
    buildAnomaly({
      pattern: 'DATA_TRANSFER_SPIKE',
      severity: 'high',
      confidenceScore: 0.88,
      title: 'Data transfer cost spike detected',
      description:
        `Current month data transfer costs ($${roundUSD(currentTransferCost)}) are more than 2x ` +
        `the 3-month average ($${roundUSD(avgHistorical)}). Investigate unexpected outbound traffic.`,
      affectedService: 'AWSDataTransfer',
      affectedResourceId: null,
      estimatedMonthlyCostImpact: currentTransferCost - avgHistorical,
      recommendedAction:
        'Review CloudFront, NAT Gateway, and cross-region transfer patterns. Check for misconfigured services sending excessive data.',
      userId,
      connectionId,
    }),
  ];
};

/**
 * Check for EC2 instances running 24/7 with low CPU during off-hours
 * @param {Array<Object>} ec2Instances
 * @param {Object} cpuMetrics - Map of instanceId to CPU datapoints
 * @param {string} userId
 * @param {string} connectionId
 * @returns {Array<Object>}
 */
const checkEC2RunningContinuously = (ec2Instances, cpuMetrics, userId, connectionId) => {
  const anomalies = [];
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  for (const instance of ec2Instances.filter((i) => i.state === 'running')) {
    const launchTime = new Date(instance.launchTime);
    const runningDays = Math.floor((now - launchTime) / (1000 * 60 * 60 * 24));

    if (runningDays < 20 && launchTime > monthStart) continue;

    const metrics = cpuMetrics[instance.instanceId] || [];
    if (metrics.length === 0) continue;

    const offHoursMetrics = metrics.filter((dp) => {
      const hour = new Date(dp.timestamp).getUTCHours();
      return hour >= 20 || hour < 8;
    });

    if (offHoursMetrics.length === 0) continue;

    const avgOffHoursCpu =
      offHoursMetrics.reduce((sum, dp) => sum + dp.average, 0) / offHoursMetrics.length;

    if (avgOffHoursCpu >= 10) continue;

    anomalies.push(
      buildAnomaly({
        pattern: 'EC2_24_7_NO_SCALING',
        severity: 'medium',
        confidenceScore: 0.78,
        title: 'EC2 instance running idle during off-hours',
        description:
          `Instance ${instance.instanceId} (${instance.instanceType}) has averaged ${roundUSD(avgOffHoursCpu)}% CPU ` +
          'during off-hours (8pm-8am). Consider scheduled stop/start to reduce costs.',
        affectedService: 'AmazonEC2',
        affectedResourceId: instance.instanceId,
        estimatedMonthlyCostImpact: estimateEC2MonthlyCost(instance.instanceType) * 0.4,
        recommendedAction:
          'Use AWS Instance Scheduler or EventBridge rules to stop instances during non-business hours.',
        userId,
        connectionId,
      })
    );
  }

  return anomalies;
};

/**
 * Check for free tier breach risks
 * @param {Array<Object>} ec2Instances
 * @param {Array<Object>} rdsInstances
 * @param {Object} usageSnapshot
 * @param {Array<Object>} usageHistory
 * @param {string} userId
 * @param {string} connectionId
 * @returns {Array<Object>}
 */
const checkFreeTierBreachRisk = (
  ec2Instances,
  rdsInstances,
  usageSnapshot,
  usageHistory,
  userId,
  connectionId
) => {
  const anomalies = [];
  const allSnapshots = usageHistory.length > 0 ? usageHistory : usageSnapshot ? [usageSnapshot] : [];

  if (allSnapshots.length === 0) return anomalies;

  const earliestSnapshot = allSnapshots.reduce((earliest, snap) => {
    const date = new Date(snap.createdAt || snap.snapshotDate);
    return date < earliest ? date : earliest;
  }, new Date());

  const accountAgeMonths =
    (Date.now() - earliestSnapshot.getTime()) / (1000 * 60 * 60 * 24 * 30);

  if (accountAgeMonths >= 12) return anomalies;

  const runningInstances = ec2Instances.filter((i) => i.state === 'running');
  const freeTierTypes = ['t2.micro', 't3.micro'];
  const nonFreeTierInstances = runningInstances.filter(
    (i) => !freeTierTypes.includes(i.instanceType)
  );

  for (const instance of nonFreeTierInstances) {
    anomalies.push(
      buildAnomaly({
        pattern: 'FREE_TIER_BREACH_RISK',
        severity: 'high',
        confidenceScore: 0.9,
        title: 'Free tier breach risk — non-eligible EC2 instance',
        description:
          `Instance ${instance.instanceId} uses ${instance.instanceType}, which is not eligible for the ` +
          'AWS Free Tier (750 hours/month of t2.micro or t3.micro only).',
        affectedService: 'AmazonEC2',
        affectedResourceId: instance.instanceId,
        estimatedMonthlyCostImpact: estimateEC2MonthlyCost(instance.instanceType),
        recommendedAction: 'Switch to t2.micro or t3.micro if eligible, or monitor costs closely during free tier period.',
        userId,
        connectionId,
      })
    );
  }

  const microInstances = runningInstances.filter((i) => freeTierTypes.includes(i.instanceType));
  if (microInstances.length > 1) {
    const combinedHours = microInstances.length * 730;
    if (combinedHours > 750) {
      anomalies.push(
        buildAnomaly({
          pattern: 'FREE_TIER_BREACH_RISK',
          severity: 'high',
          confidenceScore: 0.9,
          title: 'Free tier breach risk — multiple micro instances',
          description:
            `You have ${microInstances.length} t2/t3.micro instances running simultaneously. ` +
            'Free tier allows 750 hours/month total, not per instance.',
          affectedService: 'AmazonEC2',
          affectedResourceId: microInstances.map((i) => i.instanceId).join(','),
          estimatedMonthlyCostImpact: (combinedHours - 750) * 0.0116,
          recommendedAction: 'Stop unused micro instances or consolidate workloads onto a single instance.',
          userId,
          connectionId,
        })
      );
    }
  }

  return anomalies;
};

/**
 * Run all anomaly pattern checks against fetched AWS data
 * @param {Object} awsData - Combined output from awsFetcher
 * @param {Array<Object>} budgets - Active budgets
 * @param {string} userId
 * @param {string} connectionId
 * @param {Array<Object>} [usageHistory=[]] - Historical usage snapshots
 * @returns {Promise<Array<Object>>} Detected anomalies ready to persist
 */
const runFullScan = async (awsData, budgets, userId, connectionId, usageHistory = []) => {
  logger.info('Running full anomaly scan', { userId, connectionId });

  const usageSnapshot = {
    totalCostUSD: awsData.monthlyCost?.totalCostUSD || 0,
    serviceCosts: awsData.costByService || [],
  };

  const allAnomalies = [
    ...checkBudgetInstanceMismatch(budgets, awsData.ec2Instances || [], userId, connectionId),
    ...checkNATGatewayIdle(awsData.natGateways || [], usageSnapshot, userId, connectionId),
    ...checkEIPUnattached(awsData.elasticIPs || [], userId, connectionId),
    ...checkS3NoLifecyclePolicy(awsData.s3Buckets || [], usageSnapshot, userId, connectionId),
    ...checkLambdaOverprovisioned(awsData.lambdaFunctions || [], usageSnapshot, userId, connectionId),
    ...checkRDSOversized(awsData.rdsInstances || [], usageSnapshot, budgets, userId, connectionId),
    ...checkLogRetentionInfinite(awsData.logGroups || [], userId, connectionId),
    ...checkDataTransferSpike(usageHistory, usageSnapshot, userId, connectionId),
    ...checkEC2RunningContinuously(
      awsData.ec2Instances || [],
      awsData.cpuMetrics || {},
      userId,
      connectionId
    ),
    ...checkFreeTierBreachRisk(
      awsData.ec2Instances || [],
      awsData.rdsInstances || [],
      usageSnapshot,
      usageHistory,
      userId,
      connectionId
    ),
  ];

  const enrichedAnomalies = [];

  for (const anomaly of allAnomalies) {
    if (anomaly.confidenceScore >= CONFIDENCE_THRESHOLD) {
      try {
        const enrichedDescription = await aiAnalysisService.enrichAnomalyDescription(anomaly, {
          totalCost: usageSnapshot.totalCostUSD,
          serviceCosts: usageSnapshot.serviceCosts,
        });
        anomaly.description = enrichedDescription || anomaly.description;
      } catch (error) {
        logger.warn('AI enrichment failed for anomaly', { pattern: anomaly.pattern });
      }
    }
    enrichedAnomalies.push(anomaly);
  }

  logger.info('Anomaly scan complete', { detected: enrichedAnomalies.length });

  return enrichedAnomalies;
};

module.exports = {
  runFullScan,
  checkBudgetInstanceMismatch,
  checkNATGatewayIdle,
  checkEIPUnattached,
  checkS3NoLifecyclePolicy,
  checkLambdaOverprovisioned,
  checkRDSOversized,
  checkLogRetentionInfinite,
  checkDataTransferSpike,
  checkEC2RunningContinuously,
  checkFreeTierBreachRisk,
};
