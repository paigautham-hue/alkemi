/**
 * ALKEMI™ Intelligent LLM Router
 * 
 * This module provides intelligent routing of LLM requests with:
 * - Cost tracking and budget enforcement
 * - Provider allowlists/denylists at organization level
 * - Content redaction for sensitive data
 * - Audit logging for all LLM interactions
 */

import { invokeLLM } from "./_core/llm";
import * as db from "./db";
import type { Message } from "./_core/llm";

// Cost per 1M tokens (approximate, should be updated from actual provider pricing)
const MODEL_COSTS = {
  "gpt-4": { input: 30, output: 60 },
  "gpt-4-turbo": { input: 10, output: 30 },
  "gpt-3.5-turbo": { input: 0.5, output: 1.5 },
  "claude-3-opus": { input: 15, output: 75 },
  "claude-3-sonnet": { input: 3, output: 15 },
  "claude-3-haiku": { input: 0.25, output: 1.25 },
  "gemini-pro": { input: 0.5, output: 1.5 },
  "gemini-pro-vision": { input: 0.5, output: 1.5 },
};

// Budget limits (in USD)
const BUDGET_LIMITS = {
  perRequest: 1.0,
  perUserPerDay: 10.0,
  perOrgPerDay: 100.0,
};

// Sensitive data patterns to redact
const SENSITIVE_PATTERNS = [
  {
    name: "email",
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    replacement: "[EMAIL_REDACTED]",
  },
  {
    name: "phone",
    pattern: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
    replacement: "[PHONE_REDACTED]",
  },
  {
    name: "ssn",
    pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
    replacement: "[SSN_REDACTED]",
  },
  {
    name: "credit_card",
    pattern: /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g,
    replacement: "[CARD_REDACTED]",
  },
  {
    name: "api_key",
    pattern: /\b[A-Za-z0-9_-]{32,}\b/g,
    replacement: "[KEY_REDACTED]",
  },
];

export interface LLMRouterRequest {
  organizationId: string;
  userId: string;
  messages: Message[];
  purpose: string; // e.g., "prediction", "debate", "compliance_check"
  maxTokens?: number;
  temperature?: number;
  responseFormat?: any;
  tools?: any[];
}

export interface LLMRouterResponse {
  content: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  redactedFields: string[];
  auditLogId: string;
}

/**
 * Main router function that handles LLM requests with budget enforcement and redaction
 */
export async function routeLLMRequest(
  request: LLMRouterRequest
): Promise<LLMRouterResponse> {
  // 1. Check organization provider settings
  const orgSettings = await db.getOrganizationLLMSettings(request.organizationId);
  
  // 2. Select appropriate model based on settings and purpose
  const selectedModel = selectModel(request.purpose, orgSettings);

  // 3. Check budget limits before proceeding
  await enforeBudgetLimits(request.organizationId, request.userId, selectedModel);

  // 4. Redact sensitive content from messages
  const { redactedMessages, redactedFields } = redactSensitiveContent(request.messages);

  // 5. Invoke LLM
  const startTime = Date.now();
  let response;
  
  try {
    response = await invokeLLM({
      messages: redactedMessages,
      max_tokens: request.maxTokens,
      response_format: request.responseFormat,
      tools: request.tools,
    });
  } catch (error) {
    // Log failed request
    await db.createLLMAuditLog({
      organizationId: request.organizationId,
      userId: request.userId,
      modelName: selectedModel,
      purpose: request.purpose,
      inputTokens: 0,
      outputTokens: 0,
      cost: 0,
      latencyMs: Date.now() - startTime,
      success: false,
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }

  const latencyMs = Date.now() - startTime;

  // 6. Calculate cost
  const inputTokens = response.usage?.prompt_tokens || 0;
  const outputTokens = response.usage?.completion_tokens || 0;
  const cost = calculateCost(selectedModel, inputTokens, outputTokens);

  // 7. Log the request in audit trail
  const auditLogId = await db.createLLMAuditLog({
    organizationId: request.organizationId,
    userId: request.userId,
    modelName: selectedModel,
    purpose: request.purpose,
    inputTokens,
    outputTokens,
    cost,
    latencyMs,
    success: true,
  });

  // 8. Extract content from response
  const content = response.choices[0]?.message?.content || "";

  return {
    content: typeof content === 'string' ? content : JSON.stringify(content),
    model: selectedModel,
    inputTokens,
    outputTokens,
    cost,
    redactedFields,
    auditLogId,
  };
}

/**
 * Select the appropriate model based on purpose and organization settings
 */
function selectModel(
  purpose: string,
  orgSettings?: {
    allowedProviders?: string[];
    deniedProviders?: string[];
    preferredModel?: string;
  }
): string {
  // Default model selection based on purpose
  const purposeModelMap: Record<string, string> = {
    prediction: "gpt-4-turbo",
    debate: "claude-3-sonnet",
    compliance_check: "gpt-4-turbo",
    document_analysis: "claude-3-sonnet",
    general: "gpt-3.5-turbo",
  };

  let selectedModel = purposeModelMap[purpose] || "gpt-3.5-turbo";

  // Override with organization preference if set
  if (orgSettings?.preferredModel) {
    selectedModel = orgSettings.preferredModel;
  }

  // Check provider allowlist/denylist
  if (orgSettings) {
    const provider = getProviderFromModel(selectedModel);
    
    if (orgSettings.deniedProviders?.includes(provider)) {
      // Find alternative model from allowed providers
      selectedModel = findAlternativeModel(orgSettings.allowedProviders || []);
    }
    
    if (
      orgSettings.allowedProviders &&
      orgSettings.allowedProviders.length > 0 &&
      !orgSettings.allowedProviders.includes(provider)
    ) {
      // Use first allowed provider's default model
      selectedModel = findAlternativeModel(orgSettings.allowedProviders);
    }
  }

  return selectedModel;
}

/**
 * Get provider name from model name
 */
function getProviderFromModel(model: string): string {
  if (model.startsWith("gpt")) return "openai";
  if (model.startsWith("claude")) return "anthropic";
  if (model.startsWith("gemini")) return "google";
  return "unknown";
}

/**
 * Find alternative model from allowed providers
 */
function findAlternativeModel(allowedProviders: string[]): string {
  const providerDefaults: Record<string, string> = {
    openai: "gpt-3.5-turbo",
    anthropic: "claude-3-haiku",
    google: "gemini-pro",
  };

  for (const provider of allowedProviders) {
    if (providerDefaults[provider]) {
      return providerDefaults[provider];
    }
  }

  return "gpt-3.5-turbo"; // Fallback
}

/**
 * Enforce budget limits at request, user, and organization levels
 */
async function enforeBudgetLimits(
  organizationId: string,
  userId: string,
  model: string
): Promise<void> {
  // Estimate cost for this request (conservative estimate)
  const estimatedCost = 0.5; // $0.50 per request as conservative estimate

  // Check per-request limit
  if (estimatedCost > BUDGET_LIMITS.perRequest) {
    throw new Error(
      `Request exceeds per-request budget limit of $${BUDGET_LIMITS.perRequest}`
    );
  }

  // Check user daily limit
  const userDailyCost = await db.getUserDailyLLMCost(userId);
  if (userDailyCost + estimatedCost > BUDGET_LIMITS.perUserPerDay) {
    throw new Error(
      `User has exceeded daily budget limit of $${BUDGET_LIMITS.perUserPerDay}`
    );
  }

  // Check organization daily limit
  const orgDailyCost = await db.getOrganizationDailyLLMCost(organizationId);
  if (orgDailyCost + estimatedCost > BUDGET_LIMITS.perOrgPerDay) {
    throw new Error(
      `Organization has exceeded daily budget limit of $${BUDGET_LIMITS.perOrgPerDay}`
    );
  }
}

/**
 * Calculate cost based on token usage
 */
function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const costs = MODEL_COSTS[model as keyof typeof MODEL_COSTS] || {
    input: 1,
    output: 2,
  };

  const inputCost = (inputTokens / 1_000_000) * costs.input;
  const outputCost = (outputTokens / 1_000_000) * costs.output;

  return inputCost + outputCost;
}

/**
 * Redact sensitive content from messages
 */
function redactSensitiveContent(messages: Message[]): {
  redactedMessages: Message[];
  redactedFields: string[];
} {
  const redactedFields: string[] = [];

  const redactedMessages = messages.map((message) => {
    if (typeof message.content === "string") {
      let content = message.content;

      for (const pattern of SENSITIVE_PATTERNS) {
        if (pattern.pattern.test(content)) {
          content = content.replace(pattern.pattern, pattern.replacement);
          if (!redactedFields.includes(pattern.name)) {
            redactedFields.push(pattern.name);
          }
        }
      }

      return {
        ...message,
        content,
      };
    }

    // For array content (multimodal), only redact text parts
    if (Array.isArray(message.content)) {
      const redactedContent = message.content.map((part: any) => {
        if (part.type === "text" && typeof part.text === "string") {
          let text = part.text;
          for (const pattern of SENSITIVE_PATTERNS) {
            if (pattern.pattern.test(text)) {
              text = text.replace(pattern.pattern, pattern.replacement);
              if (!redactedFields.includes(pattern.name)) {
                redactedFields.push(pattern.name);
              }
            }
          }
          return { ...part, text };
        }
        return part;
      });

      return {
        ...message,
        content: redactedContent as any,
      };
    }

    return message;
  });

  return { redactedMessages, redactedFields };
}

/**
 * Get budget usage summary for an organization
 */
export async function getBudgetUsage(organizationId: string): Promise<{
  orgDailyCost: number;
  orgDailyLimit: number;
  orgDailyRemaining: number;
  topUsers: Array<{ userId: string; userName: string; cost: number }>;
}> {
  const orgDailyCost = await db.getOrganizationDailyLLMCost(organizationId);
  const topUsers = await db.getTopLLMUsersByOrganization(organizationId, 10);

  return {
    orgDailyCost,
    orgDailyLimit: BUDGET_LIMITS.perOrgPerDay,
    orgDailyRemaining: Math.max(0, BUDGET_LIMITS.perOrgPerDay - orgDailyCost),
    topUsers,
  };
}
