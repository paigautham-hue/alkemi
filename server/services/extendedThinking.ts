import { invokeLLM } from "../_core/llm";

/**
 * Extended Thinking Service - MULTI_LLM_PLAYBOOK_v3_2
 * Transparent reasoning for explainability and trust
 */

export interface ExtendedThinkingResult {
  reasoning: string;
  answer: string;
  tokensUsed: number;
  model: string;
}

export async function invokeWithExtendedThinking(params: {
  systemPrompt: string;
  userPrompt: string;
  thinkingLevel?: "low" | "medium" | "high";
}): Promise<ExtendedThinkingResult> {
  const { systemPrompt, userPrompt, thinkingLevel = "medium" } = params;
  
  const enhancedSystem = `${systemPrompt}

IMPORTANT: You must structure your response as follows:
<reasoning>
[Your step-by-step reasoning process here. Think through the problem carefully.]
</reasoning>

<answer>
[Your final answer here]
</answer>`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: enhancedSystem },
      { role: "user", content: userPrompt }
    ],
    temperature: thinkingLevel === "high" ? 0.4 : thinkingLevel === "medium" ? 0.3 : 0.2,
  });
  
  const content = typeof response.choices[0]?.message?.content === 'string'
    ? response.choices[0].message.content : "";
  
  const reasoningMatch = content.match(/<reasoning>([\s\S]*?)<\/reasoning>/);
  const answerMatch = content.match(/<answer>([\s\S]*?)<\/answer>/);
  
  return {
    reasoning: reasoningMatch ? reasoningMatch[1].trim() : "No reasoning provided",
    answer: answerMatch ? answerMatch[1].trim() : content,
    tokensUsed: response.usage?.total_tokens || 0,
    model: "default",
  };
}

export function formatReasoningForDisplay(reasoning: string): string {
  const lines = reasoning.split("\n").filter(l => l.trim());
  return lines.map((line, i) => `${i + 1}. ${line.trim()}`).join("\n");
}

export function extractKeyInsights(reasoning: string): string[] {
  const insights: string[] = [];
  const patterns = [
    /therefore[,:]?\s*(.+?)(?:\.|$)/gi,
    /this means[,:]?\s*(.+?)(?:\.|$)/gi,
    /key finding[,:]?\s*(.+?)(?:\.|$)/gi,
    /important[,:]?\s*(.+?)(?:\.|$)/gi,
    /conclude[,:]?\s*(.+?)(?:\.|$)/gi,
  ];
  
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(reasoning)) !== null) {
      if (match[1] && match[1].length > 10) {
        insights.push(match[1].trim());
      }
    }
  }
  
  return Array.from(new Set(insights)).slice(0, 5);
}
