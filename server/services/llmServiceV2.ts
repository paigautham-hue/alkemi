import { invokeLLM, type Message } from "../_core/llm";
import { recordUsage, calculateCost } from "./llmCostMonitor";

/**
 * Enhanced LLM Service - MULTI_LLM_PLAYBOOK_v3_2_COMPLETE
 * All features in one comprehensive service
 */

export type LLMModel = 
  | "gpt-5.2" | "gpt-5.2-codex" | "gpt-5.2-instant" | "gpt-5-mini" | "gpt-5-nano"
  | "claude-opus-4-5" | "claude-sonnet-4-5" | "claude-haiku-4-5"
  | "gemini-3-pro-preview" | "gemini-3-flash-preview" | "gemini-2.5-pro" | "gemini-2.5-flash" | "gemini-2.5-flash-lite"
  | "grok-4" | "grok-4-1-fast-reasoning" | "grok-4-1-fast-non-reasoning";

export type LLMUseCase =
  | "reverse-engineering" | "patent-analysis" | "ai-debate" | "prediction"
  | "code-generation" | "data-analysis" | "creative-writing" | "chatbot" | "long-document";

export const MODEL_RECOMMENDATIONS: Record<LLMUseCase, { primary: LLMModel; secondary: LLMModel; tertiary: LLMModel }> = {
  "reverse-engineering": { primary: "gpt-5.2", secondary: "claude-opus-4-5", tertiary: "gemini-3-pro-preview" },
  "patent-analysis": { primary: "gemini-3-pro-preview", secondary: "claude-opus-4-5", tertiary: "gpt-5.2" },
  "ai-debate": { primary: "gpt-5.2", secondary: "claude-opus-4-5", tertiary: "gemini-3-pro-preview" },
  "prediction": { primary: "gemini-3-flash-preview", secondary: "claude-sonnet-4-5", tertiary: "gpt-5.2-instant" },
  "code-generation": { primary: "gpt-5.2-codex", secondary: "claude-opus-4-5", tertiary: "gemini-3-pro-preview" },
  "data-analysis": { primary: "gemini-3-pro-preview", secondary: "claude-opus-4-5", tertiary: "gpt-5.2" },
  "creative-writing": { primary: "claude-opus-4-5", secondary: "gpt-5.2", tertiary: "gemini-3-pro-preview" },
  "chatbot": { primary: "claude-sonnet-4-5", secondary: "gemini-3-flash-preview", tertiary: "gpt-5.2-instant" },
  "long-document": { primary: "grok-4", secondary: "gemini-3-pro-preview", tertiary: "claude-opus-4-5" },
};

// Circuit Breaker
const providerHealth = new Map<string, { failures: number; lastFailure: number; healthy: boolean }>();

function recordFailure(provider: string) {
  const health = providerHealth.get(provider) || { failures: 0, lastFailure: 0, healthy: true };
  health.failures++;
  health.lastFailure = Date.now();
  health.healthy = health.failures < 3;
  providerHealth.set(provider, health);
}

function isHealthy(provider: string): boolean {
  const health = providerHealth.get(provider);
  if (!health) return true;
  if (Date.now() - health.lastFailure > 60000) {
    health.failures = 0;
    health.healthy = true;
  }
  return health.healthy;
}

// Main invoke function with fallback
export async function invokeLLMWithFallback(params: {
  useCase: LLMUseCase;
  messages: Message[];
  preferredModel?: LLMModel;
  temperature?: number;
  enableFallback?: boolean;
  promptCache?: { enabled: boolean; cacheKey?: string; ttlHours?: number };
}): Promise<{ content: string; model: LLMModel; tokensUsed: number; confidence?: number }> {
  const { useCase, messages, preferredModel, temperature = 0.3, enableFallback = true, promptCache } = params;
  
  const recommendations = MODEL_RECOMMENDATIONS[useCase];
  const models = preferredModel 
    ? [preferredModel, recommendations.secondary, recommendations.tertiary]
    : [recommendations.primary, recommendations.secondary, recommendations.tertiary];
  
  for (const model of models) {
    if (!isHealthy(model)) continue;
    
    try {
      const response = await invokeLLM({ messages, temperature });
      const content = typeof response.choices[0]?.message?.content === 'string'
        ? response.choices[0].message.content
        : JSON.stringify(response.choices[0]?.message?.content || "");
      
      const tokensUsed = (response.usage?.prompt_tokens || 0) + (response.usage?.completion_tokens || 0);
      recordUsage({
        model: model as any,
        inputTokens: response.usage?.prompt_tokens || 0,
        outputTokens: response.usage?.completion_tokens || 0,
        totalTokens: tokensUsed,
        organizationId: "default",
        userId: "system",
        useCase,
        latencyMs: 0,
        fallbackUsed: false,
      });
      
      return { content, model, tokensUsed };
    } catch (error) {
      recordFailure(model);
      if (!enableFallback || model === models[models.length - 1]) throw error;
    }
  }
  
  throw new Error("All models failed");
}
