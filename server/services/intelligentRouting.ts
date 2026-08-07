import { invokeLLM } from "../_core/llm";

/**
 * Intelligent Model Routing - MULTI_LLM_PLAYBOOK_v3_2
 * Automatic model selection based on complexity for 40-60% cost savings
 */

export type BudgetMode = "cost-optimized" | "balanced" | "performance";

export interface RoutingDecision {
  model: string;
  reason: string;
  estimatedCost: number;
  confidence: number;
}

export interface QueryComplexity {
  score: number;
  factors: {
    length: number;
    technicalTerms: number;
    multiStep: boolean;
    domainSpecific: boolean;
    creative: boolean;
  };
}

export function analyzeComplexity(query: string): QueryComplexity {
  const length = query.length;
  
  const technicalTerms = [
    /viscosity/gi, /rheology/gi, /photoinitiator/gi, /hansen\s+solubility/gi,
    /glass\s+transition/gi, /molecular\s+weight/gi, /crosslink/gi, /polymerization/gi,
    /surfactant/gi, /emulsion/gi, /dispersion/gi, /compatibility/gi, /formulation/gi,
  ];
  
  const technicalCount = technicalTerms.reduce((count, pattern) => {
    const matches = query.match(pattern);
    return count + (matches ? matches.length : 0);
  }, 0);
  
  const multiStepIndicators = [/first.*then/i, /step\s+\d+/i, /analyze.*then.*predict/i, /compare.*and.*recommend/i];
  const multiStep = multiStepIndicators.some(p => p.test(query));
  
  const domainSpecific = technicalCount > 2;
  
  const creativeIndicators = [/design/i, /create/i, /innovate/i, /novel/i, /alternative/i, /brainstorm/i];
  const creative = creativeIndicators.some(p => p.test(query));
  
  let score = 0;
  score += Math.min(length / 5000, 0.2);
  score += Math.min(technicalCount / 10, 0.3);
  if (multiStep) score += 0.2;
  if (domainSpecific) score += 0.2;
  if (creative) score += 0.1;
  
  return {
    score: Math.min(score, 1.0),
    factors: { length, technicalTerms: technicalCount, multiStep, domainSpecific, creative },
  };
}

export function routeToOptimalModel(query: string, budgetMode: BudgetMode = "balanced"): RoutingDecision {
  const complexity = analyzeComplexity(query);
  
  if (budgetMode === "cost-optimized") {
    if (complexity.score < 0.3) return { model: "gemini-flash", reason: "Simple query, ultra-fast model", estimatedCost: 0.001, confidence: 0.95 };
    if (complexity.score < 0.6) return { model: "gpt-mini", reason: "Moderate complexity, balanced model", estimatedCost: 0.005, confidence: 0.85 };
    return { model: "claude-sonnet", reason: "High complexity, capable model", estimatedCost: 0.015, confidence: 0.90 };
  }
  
  if (budgetMode === "performance") {
    if (complexity.score < 0.4) return { model: "claude-sonnet", reason: "High-quality model for reliability", estimatedCost: 0.015, confidence: 0.95 };
    return { model: "claude-opus", reason: "Complex query, most capable model", estimatedCost: 0.075, confidence: 0.98 };
  }
  
  // Balanced mode
  if (complexity.score < 0.2) return { model: "gemini-flash", reason: "Very simple query", estimatedCost: 0.001, confidence: 0.95 };
  if (complexity.score < 0.4) return { model: "gpt-mini", reason: "Simple query", estimatedCost: 0.005, confidence: 0.90 };
  if (complexity.score < 0.6) return { model: "claude-sonnet", reason: "Moderate complexity", estimatedCost: 0.015, confidence: 0.92 };
  if (complexity.score < 0.8) return { model: "gpt-5.2", reason: "High complexity", estimatedCost: 0.030, confidence: 0.95 };
  return { model: "claude-opus", reason: "Very complex query", estimatedCost: 0.075, confidence: 0.98 };
}

export async function invokeWithIntelligentRouting(params: {
  query: string;
  systemPrompt?: string;
  budgetMode?: BudgetMode;
  temperature?: number;
}): Promise<{ content: string; routing: RoutingDecision }> {
  const { query, systemPrompt = "You are a helpful assistant.", budgetMode = "balanced", temperature = 0.3 } = params;
  
  const routing = routeToOptimalModel(query, budgetMode);
  console.log(`[Intelligent Routing] Selected ${routing.model}: ${routing.reason}`);

  // Map routing shorthand to gateway model ids; unknown ids fall back to the
  // default chain inside invokeLLM.
  const MODEL_ID_MAP: Record<string, string> = {
    "claude-opus": "claude-opus-4-5",
    "claude-sonnet": "claude-sonnet-4-5",
    "gemini-flash": "gemini-2.5-flash",
    "gpt-mini": "gpt-4.1-mini",
    "gpt-5.2": "gpt-5.2",
  };

  const response = await invokeLLM({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: query }
    ],
    model: MODEL_ID_MAP[routing.model] ?? routing.model,
    temperature,
  });
  
  const content = typeof response.choices[0]?.message?.content === 'string'
    ? response.choices[0].message.content : "";
  
  return { content, routing };
}

export interface BatchRequest {
  id: string;
  query: string;
  systemPrompt?: string;
}

export interface BatchResult {
  id: string;
  content: string;
  error?: string;
}

export async function processBatch(requests: BatchRequest[]): Promise<BatchResult[]> {
  console.log(`[Batch Processing] Processing ${requests.length} requests...`);
  
  const results: BatchResult[] = [];
  
  for (const request of requests) {
    try {
      const response = await invokeLLM({
        messages: [
          { role: "system", content: request.systemPrompt || "You are a helpful assistant." },
          { role: "user", content: request.query }
        ],
        temperature: 0.3,
      });
      
      const content = typeof response.choices[0]?.message?.content === 'string'
        ? response.choices[0].message.content : "";
      
      results.push({ id: request.id, content });
    } catch (error) {
      results.push({ id: request.id, content: "", error: error instanceof Error ? error.message : "Unknown error" });
    }
  }
  
  return results;
}

export function estimateCostSavings(
  totalRequests: number,
  complexityDistribution: { simple: number; moderate: number; complex: number }
): { withoutRouting: number; withRouting: number; savings: number; savingsPercent: number } {
  const costs = { simple: 0.1, moderate: 0.5, complex: 3.0 };
  
  const withoutRouting = totalRequests * costs.complex;
  const withRouting = 
    (totalRequests * complexityDistribution.simple * costs.simple) +
    (totalRequests * complexityDistribution.moderate * costs.moderate) +
    (totalRequests * complexityDistribution.complex * costs.complex);
  
  const savings = withoutRouting - withRouting;
  const savingsPercent = (savings / withoutRouting) * 100;
  
  return { withoutRouting, withRouting, savings, savingsPercent };
}
