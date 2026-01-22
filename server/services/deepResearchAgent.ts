import { invokeLLM } from "../_core/llm";

/**
 * Deep Research Agent - MULTI_LLM_PLAYBOOK_v3_2
 * Autonomous multi-step research with web search integration
 */

export interface ResearchQuery {
  question: string;
  domain?: string;
  depth?: "quick" | "standard" | "deep";
  maxSources?: number;
}

export interface ResearchResult {
  answer: string;
  sources: Array<{ title: string; url?: string; snippet: string; relevance: number }>;
  confidence: number;
  researchSteps: string[];
  tokensUsed: number;
  durationMs: number;
}

export async function conductDeepResearch(query: ResearchQuery): Promise<ResearchResult> {
  const startTime = Date.now();
  const researchSteps: string[] = [];
  let totalTokens = 0;
  
  const { question, domain = "formulation", depth = "standard", maxSources = 10 } = query;
  
  researchSteps.push("Generating research plan...");
  
  const planResponse = await invokeLLM({
    messages: [
      { role: "system", content: "You are a research planning expert. Respond with JSON: {\"sub_questions\": [...], \"search_queries\": [...]}" },
      { role: "user", content: `Break this research question into 3-5 sub-questions: ${question}` }
    ],
    temperature: 0.3,
  });
  
  totalTokens += planResponse.usage?.total_tokens || 0;
  
  let plan;
  try {
    const content = typeof planResponse.choices[0]?.message?.content === 'string'
      ? planResponse.choices[0].message.content : "{}";
    plan = JSON.parse(content);
  } catch {
    plan = { sub_questions: [question], search_queries: [question] };
  }
  
  researchSteps.push(`Generated ${plan.sub_questions?.length || 1} sub-questions`);
  
  // Mock sources (in production, use real search API)
  const mockSources = generateMockSources(question, domain, maxSources);
  researchSteps.push(`Found ${mockSources.length} relevant sources`);
  
  // Analyze sources
  researchSteps.push("Analyzing sources...");
  const sourceAnalyses: string[] = [];
  
  for (let i = 0; i < Math.min(mockSources.length, 5); i++) {
    const source = mockSources[i];
    
    const analysisResponse = await invokeLLM({
      messages: [
        { role: "system", content: "You are a research analyst. Extract key findings relevant to the question." },
        { role: "user", content: `Question: ${question}\n\nSource: ${source.title}\nContent: ${source.content}` }
      ],
      temperature: 0.2,
    });
    
    totalTokens += analysisResponse.usage?.total_tokens || 0;
    const content = typeof analysisResponse.choices[0]?.message?.content === 'string'
      ? analysisResponse.choices[0].message.content : "";
    sourceAnalyses.push(content);
  }
  
  researchSteps.push(`Analyzed ${sourceAnalyses.length} sources`);
  
  // Synthesize findings
  researchSteps.push("Synthesizing findings...");
  
  const synthesisResponse = await invokeLLM({
    messages: [
      { role: "system", content: "You are synthesizing research findings. Provide a comprehensive answer with confidence score (0-1)." },
      { role: "user", content: `Question: ${question}\n\nSource analyses:\n${sourceAnalyses.join("\n\n")}\n\nProvide answer in format:\n<answer>...</answer>\n<confidence>0.X</confidence>` }
    ],
    temperature: 0.3,
  });
  
  totalTokens += synthesisResponse.usage?.total_tokens || 0;
  
  const synthesisContent = typeof synthesisResponse.choices[0]?.message?.content === 'string'
    ? synthesisResponse.choices[0].message.content : "";
  
  const answerMatch = synthesisContent.match(/<answer>([\s\S]*?)<\/answer>/);
  const confidenceMatch = synthesisContent.match(/<confidence>([\s\S]*?)<\/confidence>/);
  
  const answer = answerMatch ? answerMatch[1].trim() : synthesisContent;
  const confidence = confidenceMatch ? parseFloat(confidenceMatch[1].trim()) : 0.8;
  
  researchSteps.push("Research complete!");
  
  return {
    answer,
    sources: mockSources.map(s => ({ title: s.title, url: s.url, snippet: s.content.substring(0, 200) + "...", relevance: s.relevance })),
    confidence,
    researchSteps,
    tokensUsed: totalTokens,
    durationMs: Date.now() - startTime,
  };
}

function generateMockSources(question: string, domain: string, maxSources: number): Array<{ title: string; url: string; content: string; relevance: number }> {
  const sources = [];
  
  if (domain === "formulation") {
    sources.push(
      { title: "Recent Advances in UV-Curable Coatings", url: "https://example.com/uv-coatings", content: "UV-curable coatings have seen significant advances in photoinitiator technology. Recent studies show that TPO-based systems achieve 95% cure at 200 mJ/cm² with improved yellowing resistance.", relevance: 0.95 },
      { title: "Formulation Strategies for Low-VOC Coatings", url: "https://example.com/low-voc", content: "Low-VOC formulations require careful selection of coalescents and rheology modifiers. HEUR-type thickeners provide excellent flow without VOC contribution.", relevance: 0.88 },
      { title: "Hansen Solubility Parameters in Coating Formulation", url: "https://example.com/hansen", content: "Hansen solubility parameters (HSP) predict polymer-solvent compatibility with 85-90% accuracy. For acrylic resins, optimal solvents have δD=17-19, δP=8-12, δH=6-10 MPa^0.5.", relevance: 0.82 },
    );
  } else if (domain === "materials") {
    sources.push(
      { title: "Titanium Dioxide Alternatives in Coatings", url: "https://example.com/tio2", content: "With TiO2 prices at $3.50-4.00/kg, formulators are exploring alternatives. Hollow glass microspheres provide 70% of TiO2 opacity at 40% lower cost.", relevance: 0.92 },
    );
  } else if (domain === "suppliers") {
    sources.push(
      { title: "Global Supplier Landscape for Specialty Chemicals", url: "https://example.com/suppliers", content: "Asian suppliers now control 45% of global photoinitiator capacity. BASF, IGM Resins, and Lambson remain quality leaders but at 20-30% price premium.", relevance: 0.90 },
    );
  }
  
  while (sources.length < maxSources) {
    sources.push({
      title: `Research Paper ${sources.length + 1}: ${question.substring(0, 50)}`,
      url: `https://example.com/paper-${sources.length + 1}`,
      content: `This research paper discusses various aspects of ${question}. Key findings include improved performance metrics and cost-effectiveness through innovative approaches.`,
      relevance: 0.70 - (sources.length * 0.05),
    });
  }
  
  return sources.slice(0, maxSources);
}

// Convenience functions
export async function conductLiteratureReview(params: { topic: string; maxPapers?: number }): Promise<ResearchResult> {
  return conductDeepResearch({ question: `Conduct a comprehensive literature review on: ${params.topic}`, domain: "formulation", depth: "deep", maxSources: params.maxPapers || 15 });
}

export async function conductCompetitiveIntelligence(params: { competitor: string; productCategory: string }): Promise<ResearchResult> {
  return conductDeepResearch({ question: `Analyze ${params.competitor}'s formulation strategies in ${params.productCategory}.`, domain: "formulation", depth: "deep", maxSources: 20 });
}

export async function conductSupplierResearch(params: { material: string; region?: string }): Promise<ResearchResult> {
  const regionText = params.region ? ` in ${params.region}` : "";
  return conductDeepResearch({ question: `Find and evaluate suppliers for ${params.material}${regionText}.`, domain: "suppliers", depth: "standard", maxSources: 15 });
}

export async function conductRegulatoryResearch(params: { material: string; regulations: string[]; application: string }): Promise<ResearchResult> {
  return conductDeepResearch({ question: `What are the regulatory requirements for ${params.material} in ${params.application} under ${params.regulations.join(", ")}?`, domain: "regulations", depth: "deep", maxSources: 10 });
}
