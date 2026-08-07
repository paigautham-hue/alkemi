import { invokeLLM } from "../_core/llm";
import { recordUsage, calculateCost } from "./llmCostMonitor";

/**
 * LLM Service with Multi-Model Support and Fallback Chains
 * Based on COMPREHENSIVE_MANUS_LLM_INTEGRATION_PROMPT_v1.7_FINAL
 */

export type LLMModel = 
  | "gpt-5.2"           // OpenAI Frontier - Superior reasoning, math, science
  | "gpt-5.2-codex"     // OpenAI Codex - Specialized for agentic coding
  | "gpt-5.2-instant"   // OpenAI Balanced - Fast and cost-effective
  | "claude-opus-4-5"   // Anthropic Premium - Excellent for nuanced writing
  | "claude-sonnet-4-5" // Anthropic Balanced - Great balance of speed/cost/quality
  | "claude-haiku-4-5"  // Anthropic Budget - High-volume, simple tasks
  | "gemini-3-pro"      // Google Premium - Strong reasoning, native search
  | "gemini-3-flash"    // Google Balanced - Speed optimization, 1M context
  | "gemini-2.5-flash"; // Google Budget - Cost-effective

export type LLMUseCase =
  | "reverse-engineering"    // Product formulation analysis
  | "patent-analysis"        // Patent and literature research
  | "ai-debate"              // Multi-model expert consultation
  | "prediction"             // Property prediction
  | "code-generation"        // Code generation tasks
  | "data-analysis"          // Data interpretation
  | "creative-writing"       // Document generation
  | "chatbot";               // General conversation

/**
 * Model selection based on use case
 * Following recommendations from LLM Integration Guide v1.7
 */
export const MODEL_RECOMMENDATIONS: Record<LLMUseCase, {
  primary: LLMModel;
  secondary: LLMModel;
  tertiary: LLMModel;
}> = {
  "reverse-engineering": {
    primary: "gpt-5.2",           // Superior reasoning for complex analysis
    secondary: "claude-opus-4-5",  // Excellent for nuanced interpretation
    tertiary: "gemini-3-pro",      // Strong data analysis capabilities
  },
  "patent-analysis": {
    primary: "gemini-3-pro",       // Native Google Search integration
    secondary: "claude-opus-4-5",  // Direct PDF processing
    tertiary: "gpt-5.2",           // Fallback for complex reasoning
  },
  "ai-debate": {
    primary: "gpt-5.2",            // Frontier reasoning
    secondary: "claude-opus-4-5",  // Nuanced perspectives
    tertiary: "gemini-3-pro",      // Data-driven insights
  },
  "prediction": {
    primary: "claude-sonnet-4-5",  // Balanced speed/quality
    secondary: "gemini-3-flash",   // Fast response times
    tertiary: "gpt-5.2-instant",   // Cost-effective fallback
  },
  "code-generation": {
    primary: "gpt-5.2-codex",      // Specialized for coding
    secondary: "claude-opus-4-5",  // Excellent code quality
    tertiary: "gemini-3-pro",      // Strong reasoning
  },
  "data-analysis": {
    primary: "gemini-3-pro",       // Strong data interpretation
    secondary: "claude-opus-4-5",  // Nuanced analysis
    tertiary: "gpt-5.2",           // Complex reasoning
  },
  "creative-writing": {
    primary: "claude-opus-4-5",    // Sophisticated writing
    secondary: "gpt-5.2",          // Creative capabilities
    tertiary: "gemini-3-pro",      // Structured output
  },
  "chatbot": {
    primary: "claude-sonnet-4-5",  // Great balance
    secondary: "gemini-3-flash",   // Fast responses
    tertiary: "gpt-5.2-instant",   // Cost-effective
  },
};

export interface LLMRequest {
  useCase: LLMUseCase;
  messages: Array<{
    role: "system" | "user" | "assistant";
    content: string | Array<any>;
  }>;
  temperature?: number;
  maxTokens?: number;
  enableFallback?: boolean;
  preferredModel?: LLMModel;
}

export interface LLMResponse {
  content: string;
  model: LLMModel;
  tokensUsed: number;
  latencyMs: number;
  fallbackUsed: boolean;
}

/**
 * Invoke LLM with automatic fallback chain
 */
export async function invokeLLMWithFallback(
  request: LLMRequest
): Promise<LLMResponse> {
  const startTime = Date.now();
  const recommendations = MODEL_RECOMMENDATIONS[request.useCase];
  
  // Determine model priority order
  const modelPriority: LLMModel[] = request.preferredModel
    ? [request.preferredModel, recommendations.primary, recommendations.secondary, recommendations.tertiary]
    : [recommendations.primary, recommendations.secondary, recommendations.tertiary];

  // Remove duplicates
  const uniqueModels = Array.from(new Set(modelPriority));

  let lastError: Error | null = null;
  let fallbackUsed = false;

  for (let i = 0; i < uniqueModels.length; i++) {
    const model = uniqueModels[i];
    
    if (i > 0) {
      fallbackUsed = true;
      console.warn(`[LLM Fallback] Attempting fallback to ${model} after ${i} failed attempts`);
    }

    try {
      // Pass the selected model — previously computed and then discarded,
      // so every call silently used the default fallback chain and the cost
      // log billed against a model that was never used.
      const response = await invokeLLM({
        messages: request.messages,
        model,
        temperature: request.temperature,
        max_tokens: request.maxTokens,
      });

      const content = typeof response.choices[0]?.message?.content === 'string' 
        ? response.choices[0].message.content 
        : JSON.stringify(response.choices[0]?.message?.content || "");
      const tokensUsed = response.usage?.total_tokens || 0;
      const latencyMs = Date.now() - startTime;

      const estimatedCost = calculateCost(model, tokensUsed * 0.6, tokensUsed * 0.4);
      console.log(`[LLM Success] Model: ${model}, Tokens: ${tokensUsed}, Latency: ${latencyMs}ms, Cost: $${estimatedCost.toFixed(4)}, Fallback: ${fallbackUsed}`);

      // TODO: Record usage with organization/user context
      // recordUsage({ ... });

      return {
        content,
        model,
        tokensUsed,
        latencyMs,
        fallbackUsed,
      };
    } catch (error) {
      lastError = error as Error;
      console.error(`[LLM Error] Model ${model} failed:`, error);

      // If fallback is disabled or this is the last model, throw
      if (!request.enableFallback || i === uniqueModels.length - 1) {
        break;
      }

      // Otherwise, continue to next model in fallback chain
      continue;
    }
  }

  // All models failed
  throw new Error(
    `All LLM models failed for use case "${request.useCase}". Last error: ${lastError?.message}`
  );
}

/**
 * Invoke multiple LLMs in parallel for multi-model debate
 */
export async function invokeMultiModelDebate(
  request: Omit<LLMRequest, "useCase">
): Promise<Array<LLMResponse & { model: LLMModel }>> {
  const models: LLMModel[] = ["gpt-5.2", "claude-opus-4-5", "gemini-3-pro"];
  
  const promises = models.map(async (model) => {
    try {
      return await invokeLLMWithFallback({
        ...request,
        useCase: "ai-debate",
        preferredModel: model,
        enableFallback: false, // No fallback for debate - we want specific models
      });
    } catch (error) {
      console.error(`[Multi-Model Debate] Model ${model} failed:`, error);
      return null;
    }
  });

  const results = await Promise.all(promises);
  return results.filter((r): r is LLMResponse => r !== null);
}

/**
 * Batch processing for non-urgent tasks (50% cost reduction)
 */
export interface BatchRequest {
  id: string;
  request: LLMRequest;
}

export async function submitBatchRequests(
  requests: BatchRequest[]
): Promise<{ batchId: string; estimatedCompletionTime: Date }> {
  // TODO: Implement batch API integration
  // For now, return mock response
  console.log(`[Batch Processing] Submitted ${requests.length} requests for batch processing`);
  
  const estimatedCompletionTime = new Date();
  estimatedCompletionTime.setHours(estimatedCompletionTime.getHours() + 24);

  return {
    batchId: `batch_${Date.now()}`,
    estimatedCompletionTime,
  };
}

/**
 * Prompt caching for repeated contexts (24h retention)
 */
export function buildCachedPrompt(
  systemContext: string,
  userQuery: string
): Array<{ role: "system" | "user"; content: string | Array<any> }> {
  // TODO: Implement prompt caching with cache control headers
  // For now, return standard message array
  return [
    { role: "system", content: systemContext },
    { role: "user", content: userQuery },
  ];
}
