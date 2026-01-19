/**
 * LLM Cost Monitoring Service
 * 
 * Tracks LLM usage, costs, and provides budget alerts.
 * Based on COMPREHENSIVE_MANUS_LLM_INTEGRATION_PROMPT_v1.7_FINAL
 */

import type { LLMModel } from "./llmService";

/**
 * Approximate pricing per 1M tokens (as of Dec 2025)
 * These are estimates - actual pricing may vary
 */
const MODEL_PRICING: Record<LLMModel, { input: number; output: number }> = {
  "gpt-5.2": { input: 0.030, output: 0.060 },
  "gpt-5.2-codex": { input: 0.035, output: 0.070 },
  "gpt-5.2-instant": { input: 0.010, output: 0.020 },
  "claude-opus-4-5": { input: 0.030, output: 0.060 },
  "claude-sonnet-4-5": { input: 0.010, output: 0.020 },
  "claude-haiku-4-5": { input: 0.002, output: 0.004 },
  "gemini-3-pro": { input: 0.025, output: 0.050 },
  "gemini-3-flash": { input: 0.008, output: 0.016 },
  "gemini-2.5-flash": { input: 0.003, output: 0.006 },
};

export interface UsageRecord {
  timestamp: Date;
  organizationId: string;
  userId: string;
  useCase: string;
  model: LLMModel;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCost: number;
  latencyMs: number;
  fallbackUsed: boolean;
}

export interface UsageStats {
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  byModel: Record<string, {
    requests: number;
    tokens: number;
    cost: number;
  }>;
  byUseCase: Record<string, {
    requests: number;
    tokens: number;
    cost: number;
  }>;
  fallbackRate: number;
  averageLatencyMs: number;
}

// In-memory storage (in production, use database)
const usageRecords: UsageRecord[] = [];

/**
 * Calculate estimated cost for a request
 */
export function calculateCost(
  model: LLMModel,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = MODEL_PRICING[model];
  if (!pricing) {
    console.warn(`[LLM Cost Monitor] No pricing data for model: ${model}`);
    return 0;
  }

  const inputCost = (inputTokens / 1_000_000) * pricing.input;
  const outputCost = (outputTokens / 1_000_000) * pricing.output;
  
  return inputCost + outputCost;
}

/**
 * Record LLM usage
 */
export function recordUsage(record: Omit<UsageRecord, "timestamp" | "estimatedCost">): void {
  const estimatedCost = calculateCost(
    record.model,
    record.inputTokens,
    record.outputTokens
  );

  usageRecords.push({
    ...record,
    timestamp: new Date(),
    estimatedCost,
  });

  console.log(
    `[LLM Cost Monitor] Recorded usage: ${record.model}, ${record.totalTokens} tokens, $${estimatedCost.toFixed(4)}`
  );

  // Check budget alerts
  checkBudgetAlerts(record.organizationId);
}

/**
 * Get usage statistics for an organization
 */
export function getUsageStats(
  organizationId: string,
  startDate?: Date,
  endDate?: Date
): UsageStats {
  const filtered = usageRecords.filter((record) => {
    if (record.organizationId !== organizationId) return false;
    if (startDate && record.timestamp < startDate) return false;
    if (endDate && record.timestamp > endDate) return false;
    return true;
  });

  const stats: UsageStats = {
    totalRequests: filtered.length,
    totalTokens: 0,
    totalCost: 0,
    byModel: {},
    byUseCase: {},
    fallbackRate: 0,
    averageLatencyMs: 0,
  };

  let totalLatency = 0;
  let fallbackCount = 0;

  for (const record of filtered) {
    stats.totalTokens += record.totalTokens;
    stats.totalCost += record.estimatedCost;
    totalLatency += record.latencyMs;

    if (record.fallbackUsed) {
      fallbackCount++;
    }

    // By model
    if (!stats.byModel[record.model]) {
      stats.byModel[record.model] = { requests: 0, tokens: 0, cost: 0 };
    }
    stats.byModel[record.model].requests++;
    stats.byModel[record.model].tokens += record.totalTokens;
    stats.byModel[record.model].cost += record.estimatedCost;

    // By use case
    if (!stats.byUseCase[record.useCase]) {
      stats.byUseCase[record.useCase] = { requests: 0, tokens: 0, cost: 0 };
    }
    stats.byUseCase[record.useCase].requests++;
    stats.byUseCase[record.useCase].tokens += record.totalTokens;
    stats.byUseCase[record.useCase].cost += record.estimatedCost;
  }

  stats.fallbackRate = filtered.length > 0 ? fallbackCount / filtered.length : 0;
  stats.averageLatencyMs = filtered.length > 0 ? totalLatency / filtered.length : 0;

  return stats;
}

/**
 * Budget alert configuration
 */
interface BudgetAlert {
  organizationId: string;
  monthlyBudget: number;
  alertThresholds: number[]; // e.g., [0.5, 0.75, 0.9] for 50%, 75%, 90%
  lastAlertSent?: Date;
}

const budgetAlerts: Map<string, BudgetAlert> = new Map();

/**
 * Set budget alert for an organization
 */
export function setBudgetAlert(
  organizationId: string,
  monthlyBudget: number,
  alertThresholds: number[] = [0.5, 0.75, 0.9]
): void {
  budgetAlerts.set(organizationId, {
    organizationId,
    monthlyBudget,
    alertThresholds,
  });
}

/**
 * Check if budget alerts should be triggered
 */
function checkBudgetAlerts(organizationId: string): void {
  const alert = budgetAlerts.get(organizationId);
  if (!alert) return;

  // Get current month usage
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const stats = getUsageStats(organizationId, startOfMonth);

  const usagePercentage = stats.totalCost / alert.monthlyBudget;

  // Check thresholds
  for (const threshold of alert.alertThresholds) {
    if (usagePercentage >= threshold) {
      console.warn(
        `[LLM Cost Monitor] Budget Alert: Organization ${organizationId} has used ${(usagePercentage * 100).toFixed(1)}% of monthly budget ($${stats.totalCost.toFixed(2)} / $${alert.monthlyBudget})`
      );
      // TODO: Send notification to organization owner
    }
  }
}

/**
 * Get cost comparison between models for a use case
 */
export function compareCosts(
  useCase: string,
  estimatedTokens: number
): Array<{ model: LLMModel; estimatedCost: number }> {
  const results: Array<{ model: LLMModel; estimatedCost: number }> = [];

  for (const [model, pricing] of Object.entries(MODEL_PRICING)) {
    // Assume 60/40 split between input/output tokens
    const inputTokens = Math.floor(estimatedTokens * 0.6);
    const outputTokens = Math.floor(estimatedTokens * 0.4);
    
    const cost = calculateCost(model as LLMModel, inputTokens, outputTokens);
    results.push({ model: model as LLMModel, estimatedCost: cost });
  }

  return results.sort((a, b) => a.estimatedCost - b.estimatedCost);
}

/**
 * Export usage data as CSV
 */
export function exportUsageCSV(
  organizationId: string,
  startDate?: Date,
  endDate?: Date
): string {
  const filtered = usageRecords.filter((record) => {
    if (record.organizationId !== organizationId) return false;
    if (startDate && record.timestamp < startDate) return false;
    if (endDate && record.timestamp > endDate) return false;
    return true;
  });

  const headers = [
    "Timestamp",
    "User ID",
    "Use Case",
    "Model",
    "Input Tokens",
    "Output Tokens",
    "Total Tokens",
    "Estimated Cost",
    "Latency (ms)",
    "Fallback Used",
  ];

  const rows = filtered.map((record) => [
    record.timestamp.toISOString(),
    record.userId,
    record.useCase,
    record.model,
    record.inputTokens.toString(),
    record.outputTokens.toString(),
    record.totalTokens.toString(),
    record.estimatedCost.toFixed(4),
    record.latencyMs.toString(),
    record.fallbackUsed.toString(),
  ]);

  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
}
