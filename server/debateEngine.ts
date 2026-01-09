/**
 * ALKEMI™ Multi-LLM Debate Engine
 * 
 * This module implements a sophisticated debate system where multiple LLMs with
 * different personas discuss complex chemistry questions, critique each other's
 * responses, and synthesize a final answer with confidence scoring.
 */

import { routeLLMRequest } from "./llmRouter";
import type { Message } from "./_core/llm";

export interface DebateRequest {
  organizationId: string;
  userId: string;
  question: string;
  context?: string; // Additional context like formulation details
  domain?: string; // Chemistry domain (UV Inks, Coatings, etc.)
  numParticipants?: number; // Number of LLM personas (default: 3)
}

export interface DebateParticipant {
  persona: string;
  role: string;
  initialResponse: string;
  critique: string;
  finalPosition: string;
}

export interface DebateResult {
  question: string;
  participants: DebateParticipant[];
  synthesis: string;
  confidenceScore: number; // 0-1, based on consensus
  keyInsights: string[];
  disagreements: string[];
  recommendations: string[];
  auditLogIds: string[];
}

/**
 * Persona templates for different expertise areas
 */
const PERSONA_TEMPLATES = [
  {
    role: "Senior Formulation Chemist",
    expertise: "20+ years in formulation development, specializing in polymer chemistry and material interactions",
    approach: "Practical, experience-driven, focuses on real-world performance and manufacturability",
  },
  {
    role: "Research Scientist",
    expertise: "PhD in Physical Chemistry, expert in thermodynamics and molecular interactions",
    approach: "Theoretical, data-driven, emphasizes fundamental principles and scientific rigor",
  },
  {
    role: "Quality Assurance Manager",
    expertise: "15+ years in quality control, regulatory compliance, and failure analysis",
    approach: "Risk-focused, conservative, prioritizes safety, consistency, and compliance",
  },
  {
    role: "Process Engineer",
    expertise: "Expert in scale-up, manufacturing processes, and cost optimization",
    approach: "Pragmatic, cost-conscious, focuses on scalability and production feasibility",
  },
  {
    role: "Materials Scientist",
    expertise: "Specialist in material properties, characterization techniques, and structure-property relationships",
    approach: "Analytical, detail-oriented, emphasizes material behavior and testing methodologies",
  },
];

/**
 * Main debate orchestration function
 */
export async function conductDebate(
  request: DebateRequest
): Promise<DebateResult> {
  const numParticipants = Math.min(request.numParticipants || 3, 5);
  
  // Select personas for this debate
  const selectedPersonas = selectPersonas(numParticipants, request.domain);

  // Phase 1: Initial responses from each persona
  console.log("[DebateEngine] Phase 1: Collecting initial responses...");
  const initialResponses = await collectInitialResponses(
    request,
    selectedPersonas
  );

  // Phase 2: Cross-critique - each persona critiques others
  console.log("[DebateEngine] Phase 2: Conducting cross-critique...");
  const critiques = await conductCrossCritique(
    request,
    initialResponses
  );

  // Phase 3: Final positions after considering critiques
  console.log("[DebateEngine] Phase 3: Collecting final positions...");
  const finalPositions = await collectFinalPositions(
    request,
    initialResponses,
    critiques
  );

  // Phase 4: Synthesize all perspectives
  console.log("[DebateEngine] Phase 4: Synthesizing final answer...");
  const synthesis = await synthesizeDebate(
    request,
    finalPositions
  );

  // Calculate confidence based on consensus
  const confidenceScore = calculateConsensus(finalPositions);

  // Collect all audit log IDs
  const auditLogIds = [
    ...initialResponses.map((r) => r.auditLogId),
    ...critiques.map((c) => c.auditLogId),
    ...finalPositions.map((f) => f.auditLogId),
    synthesis.auditLogId,
  ];

  return {
    question: request.question,
    participants: finalPositions.map((fp, idx) => ({
      persona: selectedPersonas[idx].role,
      role: selectedPersonas[idx].role,
      initialResponse: initialResponses[idx].response,
      critique: critiques[idx].critique,
      finalPosition: fp.position,
    })),
    synthesis: synthesis.answer,
    confidenceScore,
    keyInsights: synthesis.keyInsights,
    disagreements: synthesis.disagreements,
    recommendations: synthesis.recommendations,
    auditLogIds,
  };
}

/**
 * Select appropriate personas for the debate
 */
function selectPersonas(count: number, domain?: string): typeof PERSONA_TEMPLATES {
  // Always include Senior Formulation Chemist as primary
  const selected = [PERSONA_TEMPLATES[0]];

  // Add Research Scientist for scientific rigor
  if (count >= 2) selected.push(PERSONA_TEMPLATES[1]);

  // Add QA Manager for risk assessment
  if (count >= 3) selected.push(PERSONA_TEMPLATES[2]);

  // Add Process Engineer for practical considerations
  if (count >= 4) selected.push(PERSONA_TEMPLATES[3]);

  // Add Materials Scientist for deep material knowledge
  if (count >= 5) selected.push(PERSONA_TEMPLATES[4]);

  return selected.slice(0, count);
}

/**
 * Phase 1: Collect initial responses from all personas
 */
async function collectInitialResponses(
  request: DebateRequest,
  personas: typeof PERSONA_TEMPLATES
): Promise<Array<{ response: string; auditLogId: string }>> {
  const responses = await Promise.all(
    personas.map(async (persona) => {
      const systemPrompt = `You are a ${persona.role} with the following background:
${persona.expertise}

Your approach: ${persona.approach}

You are participating in a multi-expert discussion about a chemistry question. Provide your professional opinion based on your expertise and experience. Be specific, cite relevant principles or experiences, and explain your reasoning clearly.`;

      const userPrompt = `Question: ${request.question}

${request.context ? `Context:\n${request.context}\n\n` : ""}${request.domain ? `Domain: ${request.domain}\n\n` : ""}Please provide your expert analysis and recommendations.`;

      const messages: Message[] = [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ];

      const result = await routeLLMRequest({
        organizationId: request.organizationId,
        userId: request.userId,
        messages,
        purpose: "debate_initial",
        maxTokens: 1000,
      });

      return {
        response: result.content,
        auditLogId: result.auditLogId,
      };
    })
  );

  return responses;
}

/**
 * Phase 2: Each persona critiques the other responses
 */
async function conductCrossCritique(
  request: DebateRequest,
  initialResponses: Array<{ response: string; auditLogId: string }>
): Promise<Array<{ critique: string; auditLogId: string }>> {
  const personas = selectPersonas(initialResponses.length, request.domain);

  const critiques = await Promise.all(
    personas.map(async (persona, idx) => {
      // Get all other responses
      const otherResponses = initialResponses
        .filter((_, i) => i !== idx)
        .map((r, i) => {
          const otherPersona = personas.filter((_, pi) => pi !== idx)[i];
          return `**${otherPersona.role}:**\n${r.response}`;
        })
        .join("\n\n---\n\n");

      const systemPrompt = `You are a ${persona.role}. You've provided your initial response, and now you're reviewing responses from other experts. 

Your role is to:
1. Identify strengths in their arguments
2. Point out potential weaknesses or oversights
3. Highlight areas of agreement or disagreement
4. Suggest additional considerations they may have missed

Be constructive but critical. Focus on improving the overall quality of the discussion.`;

      const userPrompt = `Here are the responses from other experts:

${otherResponses}

Please provide your critique of these perspectives. What do they get right? What might they be missing? Where do you agree or disagree?`;

      const messages: Message[] = [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ];

      const result = await routeLLMRequest({
        organizationId: request.organizationId,
        userId: request.userId,
        messages,
        purpose: "debate_critique",
        maxTokens: 800,
      });

      return {
        critique: result.content,
        auditLogId: result.auditLogId,
      };
    })
  );

  return critiques;
}

/**
 * Phase 3: Collect final positions after considering critiques
 */
async function collectFinalPositions(
  request: DebateRequest,
  initialResponses: Array<{ response: string; auditLogId: string }>,
  critiques: Array<{ critique: string; auditLogId: string }>
): Promise<Array<{ position: string; auditLogId: string }>> {
  const personas = selectPersonas(initialResponses.length, request.domain);

  const finalPositions = await Promise.all(
    personas.map(async (persona, idx) => {
      const systemPrompt = `You are a ${persona.role}. You've heard critiques from other experts. Now provide your final position on the question, taking into account the feedback you've received.

You may:
- Refine your original position
- Acknowledge valid points from others
- Maintain your stance if you believe it's correct
- Propose a compromise or integrated solution

Be clear about what you're confident about and what remains uncertain.`;

      const userPrompt = `Original Question: ${request.question}

Your Initial Response:
${initialResponses[idx].response}

Critiques from Others:
${critiques.map((c, i) => i !== idx ? c.critique : "").filter(Boolean).join("\n\n")}

Please provide your final position, incorporating insights from the discussion.`;

      const messages: Message[] = [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ];

      const result = await routeLLMRequest({
        organizationId: request.organizationId,
        userId: request.userId,
        messages,
        purpose: "debate_final",
        maxTokens: 1000,
      });

      return {
        position: result.content,
        auditLogId: result.auditLogId,
      };
    })
  );

  return finalPositions;
}

/**
 * Phase 4: Synthesize all perspectives into a final answer
 */
async function synthesizeDebate(
  request: DebateRequest,
  finalPositions: Array<{ position: string; auditLogId: string }>
): Promise<{
  answer: string;
  keyInsights: string[];
  disagreements: string[];
  recommendations: string[];
  auditLogId: string;
}> {
  const personas = selectPersonas(finalPositions.length, request.domain);

  const allPositions = finalPositions
    .map((fp, idx) => `**${personas[idx].role}:**\n${fp.position}`)
    .join("\n\n---\n\n");

  const systemPrompt = `You are a synthesis moderator tasked with creating a comprehensive, balanced answer from multiple expert perspectives.

Your synthesis should:
1. Integrate the strongest points from each expert
2. Resolve contradictions where possible
3. Clearly state areas of consensus and disagreement
4. Provide actionable recommendations
5. Acknowledge uncertainties

Output your synthesis in a structured format.`;

  const userPrompt = `Question: ${request.question}

Expert Perspectives:
${allPositions}

Please synthesize these perspectives into a comprehensive answer with:
1. A clear, integrated response
2. Key insights from the discussion
3. Areas of disagreement (if any)
4. Practical recommendations`;

  const messages: Message[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  const result = await routeLLMRequest({
    organizationId: request.organizationId,
    userId: request.userId,
    messages,
    purpose: "debate_synthesis",
    maxTokens: 1500,
    responseFormat: {
      type: "json_schema",
      json_schema: {
        name: "debate_synthesis",
        strict: true,
        schema: {
          type: "object",
          properties: {
            answer: {
              type: "string",
              description: "The synthesized comprehensive answer",
            },
            keyInsights: {
              type: "array",
              description: "List of key insights from the discussion",
              items: { type: "string" },
            },
            disagreements: {
              type: "array",
              description: "Areas where experts disagreed",
              items: { type: "string" },
            },
            recommendations: {
              type: "array",
              description: "Actionable recommendations",
              items: { type: "string" },
            },
          },
          required: ["answer", "keyInsights", "disagreements", "recommendations"],
          additionalProperties: false,
        },
      },
    },
  });

  const parsed = JSON.parse(result.content);

  return {
    answer: parsed.answer,
    keyInsights: parsed.keyInsights,
    disagreements: parsed.disagreements,
    recommendations: parsed.recommendations,
    auditLogId: result.auditLogId,
  };
}

/**
 * Calculate consensus score based on similarity of final positions
 */
function calculateConsensus(
  finalPositions: Array<{ position: string; auditLogId: string }>
): number {
  // Simple heuristic: if all positions are similar length and don't contain
  // strong disagreement keywords, confidence is higher
  
  const disagreementKeywords = [
    "disagree",
    "incorrect",
    "wrong",
    "however",
    "but",
    "contradicts",
    "concern",
    "risk",
  ];

  let disagreementCount = 0;
  finalPositions.forEach((fp) => {
    const lower = fp.position.toLowerCase();
    disagreementKeywords.forEach((keyword) => {
      if (lower.includes(keyword)) disagreementCount++;
    });
  });

  // More disagreement keywords = lower confidence
  const baseConfidence = 0.85;
  const penalty = Math.min(disagreementCount * 0.05, 0.35);

  return Math.max(0.5, baseConfidence - penalty);
}
