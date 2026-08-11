/**
 * Approximate hourly costs for common EC2 instance types (USD)
 */
const EC2_HOURLY_COSTS = {
  't2.micro': 0.0116,
  't2.small': 0.023,
  't2.medium': 0.0464,
  't3.micro': 0.0104,
  't3.small': 0.0208,
  't3.medium': 0.0416,
  't3.large': 0.0832,
  't3.xlarge': 0.1664,
  't3.2xlarge': 0.3328,
  'm5.large': 0.096,
  'm5.xlarge': 0.192,
  'm5.2xlarge': 0.384,
  'c5.large': 0.085,
  'c5.xlarge': 0.17,
  'r5.large': 0.126,
  'r5.xlarge': 0.252,
};

const HOURS_PER_MONTH = 730;

/**
 * Estimate monthly cost for an EC2 instance type
 * @param {string} instanceType
 * @returns {number} Estimated monthly cost in USD
 */
const estimateEC2MonthlyCost = (instanceType) => {
  const hourlyRate = EC2_HOURLY_COSTS[instanceType] || 0.1;
  return roundUSD(hourlyRate * HOURS_PER_MONTH);
};

/**
 * Round monetary value to 2 decimal places
 * @param {number} value
 * @returns {number}
 */
const roundUSD = (value) => {
  return Math.round((value + Number.EPSILON) * 100) / 100;
};

/**
 * Calculate percentage of budget used
 * @param {number} currentSpend
 * @param {number} limit
 * @returns {number}
 */
const calculatePercentUsed = (currentSpend, limit) => {
  if (limit <= 0) return 0;
  return roundUSD((currentSpend / limit) * 100);
};

/**
 * Calculate days until budget exhaustion at current spend rate
 * @param {number} currentSpend
 * @param {number} budget
 * @param {number} daysElapsedInMonth
 * @returns {number}
 */
const daysUntilBudgetExhaustion = (currentSpend, budget, daysElapsedInMonth) => {
  if (currentSpend <= 0 || daysElapsedInMonth <= 0) return 30;
  const dailyRate = currentSpend / daysElapsedInMonth;
  const remaining = budget - currentSpend;
  if (remaining <= 0) return 0;
  return Math.ceil(remaining / dailyRate);
};

/**
 * Get service cost from usage snapshot
 * @param {Object} usageSnapshot
 * @param {string} serviceCode - AWS service code
 * @returns {number}
 */
const getServiceCostFromSnapshot = (usageSnapshot, serviceCode) => {
  if (!usageSnapshot || !usageSnapshot.serviceCosts) return 0;
  const entry = usageSnapshot.serviceCosts.find((s) => s.service === serviceCode);
  return entry ? roundUSD(entry.costUSD) : 0;
};

/**
 * Get data transfer cost from usage snapshot
 * @param {Object} usageSnapshot
 * @returns {number}
 */
const getDataTransferCost = (usageSnapshot) => {
  if (!usageSnapshot || !usageSnapshot.serviceCosts) return 0;
  const dataTransferServices = ['AWSDataTransfer', 'AmazonCloudFront'];
  return usageSnapshot.serviceCosts
    .filter((s) => dataTransferServices.includes(s.service))
    .reduce((sum, s) => sum + s.costUSD, 0);
};

/**
 * Check if RDS instance class is considered large
 * @param {string} dbInstanceClass
 * @returns {boolean}
 */
const isLargeRDSInstance = (dbInstanceClass) => {
  const largePatterns = ['db.r5.large', 'db.r5.xlarge', 'db.r5.2xlarge', 'db.m5.large', 'db.m5.xlarge'];
  return largePatterns.some((p) => dbInstanceClass.includes(p));
};

module.exports = {
  EC2_HOURLY_COSTS,
  HOURS_PER_MONTH,
  estimateEC2MonthlyCost,
  roundUSD,
  calculatePercentUsed,
  daysUntilBudgetExhaustion,
  getServiceCostFromSnapshot,
  getDataTransferCost,
  isLargeRDSInstance,
};
