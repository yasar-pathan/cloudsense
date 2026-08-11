const axios = require('axios');
const logger = require('../utils/logger');

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1/chat/completions';

/**
 * Call OpenRouter AI API
 * @param {Array<{role: string, content: string}>} messages
 * @returns {Promise<string>}
 */
const callAI = async (messages) => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-haiku';

  if (!apiKey) {
    logger.warn('OPENROUTER_API_KEY not configured, skipping AI enrichment');
    return null;
  }

  try {
    const response = await axios.post(
      OPENROUTER_BASE_URL,
      {
        model,
        messages,
        max_tokens: 300,
        temperature: 0.3,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:3000',
          'X-Title': 'CloudSense',
        },
        timeout: 30000,
      }
    );

    return response.data?.choices?.[0]?.message?.content?.trim() || null;
  } catch (error) {
    logger.error('AI API call failed', { error: error.message });
    return null;
  }
};

/**
 * Enrich anomaly description with AI-generated explanation
 * @param {Object} anomaly - Anomaly object with pattern, title, description, etc.
 * @param {Object} awsContext - Relevant AWS context data
 * @returns {Promise<string>} Enriched description
 */
const enrichAnomalyDescription = async (anomaly, awsContext) => {
  const systemPrompt =
    'You are an AWS cost optimization expert. Given an anomaly detected in a user\'s AWS account, provide a clear, plain-English explanation of what the problem is, why it\'s costing money, and exactly what the user should do to fix it. Be specific, concise, and use dollar amounts where possible. Do not use jargon. Max 3 sentences.';

  const userPrompt = JSON.stringify({
    pattern: anomaly.pattern,
    title: anomaly.title,
    description: anomaly.description,
    severity: anomaly.severity,
    affectedService: anomaly.affectedService,
    affectedResourceId: anomaly.affectedResourceId,
    estimatedMonthlyCostImpact: anomaly.estimatedMonthlyCostImpact,
    recommendedAction: anomaly.recommendedAction,
    context: awsContext,
  });

  logger.info('AI enrichAnomalyDescription', { pattern: anomaly.pattern });

  const enriched = await callAI([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ]);

  return enriched || anomaly.description;
};

/**
 * Analyze a batch of anomalies holistically for priority ranking
 * @param {Array<Object>} anomalies - Array of detected anomalies
 * @param {Object} totalContext - Overall AWS account context
 * @returns {Promise<{priorityAnomalyId: string|null, summary: string, estimatedSavings: number}>}
 */
const analyzeAnomalyBatch = async (anomalies, totalContext) => {
  if (!anomalies.length) {
    return { priorityAnomalyId: null, summary: 'No anomalies detected.', estimatedSavings: 0 };
  }

  const systemPrompt =
    'You are an AWS cost optimization expert. Analyze the provided anomalies and identify which single anomaly should be fixed first for maximum cost savings. Respond in JSON format with keys: priorityIndex (0-based index), summary (1-2 sentences), estimatedSavings (number in USD).';

  const userPrompt = JSON.stringify({
    anomalies: anomalies.map((a, i) => ({
      index: i,
      id: a._id || a.pattern + a.affectedResourceId,
      pattern: a.pattern,
      title: a.title,
      severity: a.severity,
      confidenceScore: a.confidenceScore,
      estimatedMonthlyCostImpact: a.estimatedMonthlyCostImpact,
    })),
    totalContext,
  });

  logger.info('AI analyzeAnomalyBatch', { count: anomalies.length });

  const response = await callAI([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ]);

  if (!response) {
    const sorted = [...anomalies].sort(
      (a, b) => (b.estimatedMonthlyCostImpact || 0) - (a.estimatedMonthlyCostImpact || 0)
    );
    return {
      priorityAnomalyId: sorted[0]._id?.toString() || null,
      summary: `Highest impact anomaly: ${sorted[0].title}`,
      estimatedSavings: sorted[0].estimatedMonthlyCostImpact || 0,
    };
  }

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : response);
    const priorityIndex = parsed.priorityIndex ?? 0;
    const priorityAnomaly = anomalies[priorityIndex];

    return {
      priorityAnomalyId: priorityAnomaly?._id?.toString() || null,
      summary: parsed.summary || 'Analysis complete.',
      estimatedSavings: parsed.estimatedSavings || 0,
    };
  } catch {
    const sorted = [...anomalies].sort(
      (a, b) => (b.estimatedMonthlyCostImpact || 0) - (a.estimatedMonthlyCostImpact || 0)
    );
    return {
      priorityAnomalyId: sorted[0]._id?.toString() || null,
      summary: response,
      estimatedSavings: sorted[0].estimatedMonthlyCostImpact || 0,
    };
  }
};

module.exports = {
  enrichAnomalyDescription,
  analyzeAnomalyBatch,
};
