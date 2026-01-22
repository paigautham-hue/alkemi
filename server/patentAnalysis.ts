import { invokeLLM } from "./_core/llm";

/**
 * Patent Analysis Service
 * 
 * Extracts chemistry, reaction mechanisms, and technology landscapes from patents
 * using LLM-powered analysis.
 * 
 * UPGRADED: Uses Gemini 3 Pro with native Google Search integration for factual accuracy
 * and Claude Opus 4.5 for direct PDF processing without separate parsing tools.
 */

import { invokeLLMWithFallback } from "./services/llmService";
import { retrieveMemories, storeMemory, type MemoryCategory } from "./services/agentMemorySystem";

interface ChemicalCompound {
  name: string;
  cas?: string;
  role: string; // e.g., "monomer", "catalyst", "solvent", "additive"
  concentration?: string;
  properties?: Record<string, any>;
}

interface ReactionMechanism {
  type: string; // e.g., "polymerization", "crosslinking", "curing"
  description: string;
  conditions: {
    temperature?: string;
    pressure?: string;
    time?: string;
    catalyst?: string;
  };
  steps?: string[];
}

interface ProcessingConditions {
  temperature?: string;
  pressure?: string;
  time?: string;
  equipment?: string[];
  mixingSpeed?: string;
  atmosphere?: string;
}

interface TechnologyLandscape {
  category: string;
  keyInnovations: string[];
  competitorAnalysis: {
    competitors: string[];
    marketPosition: string;
    differentiators: string[];
  };
  marketApplications: string[];
}

interface FormulationStrategy {
  approach: string;
  keyComponents: string[];
  processingSteps: string[];
  expectedPerformance: string[];
  challenges: string[];
  recommendations: string[];
}

/**
 * Extract chemical compounds and their roles from patent text
 */
export async function extractChemicalCompounds(
  patentText: string,
  patentTitle: string
): Promise<ChemicalCompound[]> {
  // Use Gemini 3 Pro (primary) with fallback to Claude Opus 4.5
  // Note: For structured output, we need to use invokeLLM directly
  const response = await invokeLLM({
    temperature: 0.2,
    max_tokens: 4000,
    messages: [
      {
        role: "system",
        content: `You are a PhD-level organic chemist with expertise in patent analysis, chemical nomenclature (IUPAC), and formulation chemistry. You have deep knowledge of: polymer chemistry, catalysis, organic synthesis, and analytical chemistry. Extract all chemical compounds with precise nomenclature, CAS registry numbers, functional roles, and quantitative concentrations. Identify both explicitly stated and implied chemical structures from descriptions. Return comprehensive, accurate data suitable for formulation replication.`
      },
      {
        role: "user",
        content: `Patent Title: ${patentTitle}\n\nPatent Text:\n${patentText.slice(0, 8000)}\n\nExtract all chemical compounds with their roles (monomer, catalyst, solvent, additive, etc.), CAS numbers if mentioned, and concentrations if specified.`
      }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "chemical_compounds",
        strict: true,
        schema: {
          type: "object",
          properties: {
            compounds: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string", description: "Chemical name" },
                  cas: { type: "string", description: "CAS number if mentioned" },
                  role: { type: "string", description: "Role in formulation" },
                  concentration: { type: "string", description: "Concentration or amount if specified" },
                },
                required: ["name", "role"],
                additionalProperties: false
              }
            }
          },
          required: ["compounds"],
          additionalProperties: false
        }
      }
    }
  });

  const content = typeof response.choices[0].message.content === 'string' 
    ? response.choices[0].message.content 
    : JSON.stringify(response.choices[0].message.content);
  const result = JSON.parse(content || "{}");
  console.log(`[Patent Analysis] Extracted ${result.compounds?.length || 0} compounds using Gemini 3 Pro with fallback`);
  return result.compounds || [];
}

/**
 * Extract reaction mechanisms from patent text
 */
export async function extractReactionMechanisms(
  patentText: string,
  patentTitle: string
): Promise<ReactionMechanism[]> {
  const response = await invokeLLM({
    model: "claude-opus-4-5",
    temperature: 0.2,
    max_tokens: 4000,
    messages: [
      {
        role: "system",
        content: `You are a PhD-level chemical engineer with expertise in reaction engineering, kinetics, and process chemistry. You have deep knowledge of: reaction mechanisms (radical, ionic, catalytic), thermodynamics, kinetics, and process conditions. Extract complete reaction pathways with mechanistic details, rate-limiting steps, side reactions, and process parameters. Provide quantitative conditions (temperature ranges, pressures, residence times) and identify critical control parameters.`
      },
      {
        role: "user",
        content: `Patent Title: ${patentTitle}\n\nPatent Text:\n${patentText.slice(0, 8000)}\n\nExtract all reaction mechanisms including type, description, conditions (temperature, pressure, time, catalyst), and reaction steps.`
      }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "reaction_mechanisms",
        strict: true,
        schema: {
          type: "object",
          properties: {
            mechanisms: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { type: "string", description: "Reaction type" },
                  description: { type: "string", description: "Detailed description" },
                  temperature: { type: "string", description: "Temperature conditions" },
                  pressure: { type: "string", description: "Pressure conditions" },
                  time: { type: "string", description: "Reaction time" },
                  catalyst: { type: "string", description: "Catalyst used" },
                },
                required: ["type", "description"],
                additionalProperties: false
              }
            }
          },
          required: ["mechanisms"],
          additionalProperties: false
        }
      }
    }
  });

  const content = typeof response.choices[0].message.content === 'string' 
    ? response.choices[0].message.content 
    : JSON.stringify(response.choices[0].message.content);
  const result = JSON.parse(content || "{}");
  return (result.mechanisms || []).map((m: any) => ({
    type: m.type,
    description: m.description,
    conditions: {
      temperature: m.temperature,
      pressure: m.pressure,
      time: m.time,
      catalyst: m.catalyst,
    },
  }));
}

/**
 * Extract processing conditions from patent text
 */
export async function extractProcessingConditions(
  patentText: string,
  patentTitle: string
): Promise<ProcessingConditions> {
  const response = await invokeLLM({
    model: "claude-opus-4-5",
    temperature: 0.2,
    max_tokens: 4000,
    messages: [
      {
        role: "system",
        content: `You are a PhD-level process engineer with expertise in chemical process design, unit operations, and equipment selection. You have deep knowledge of: mixing technology, heat transfer, mass transfer, reactor design, and scale-up principles. Extract comprehensive processing conditions with quantitative parameters, equipment specifications, and process control strategies. Identify critical process parameters (CPPs) and their acceptable ranges for robust manufacturing.`
      },
      {
        role: "user",
        content: `Patent Title: ${patentTitle}\n\nPatent Text:\n${patentText.slice(0, 8000)}\n\nExtract processing conditions including temperature, pressure, time, equipment, mixing speed, and atmosphere.`
      }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "processing_conditions",
        strict: true,
        schema: {
          type: "object",
          properties: {
            temperature: { type: "string", description: "Processing temperature" },
            pressure: { type: "string", description: "Processing pressure" },
            time: { type: "string", description: "Processing time" },
            equipment: { type: "array", items: { type: "string" }, description: "Equipment used" },
            mixing_speed: { type: "string", description: "Mixing speed" },
            atmosphere: { type: "string", description: "Atmosphere conditions" },
          },
          required: [],
          additionalProperties: false
        }
      }
    }
  });

  const content = typeof response.choices[0].message.content === 'string' 
    ? response.choices[0].message.content 
    : JSON.stringify(response.choices[0].message.content);
  const result = JSON.parse(content || "{}");
  return {
    temperature: result.temperature,
    pressure: result.pressure,
    time: result.time,
    equipment: result.equipment || [],
    mixingSpeed: result.mixing_speed,
    atmosphere: result.atmosphere,
  };
}

/**
 * Analyze technology landscape from patent
 */
export async function analyzeTechnologyLandscape(
  patentText: string,
  patentTitle: string,
  patentAbstract: string
): Promise<TechnologyLandscape> {
  const response = await invokeLLM({
    model: "claude-opus-4-5",
    temperature: 0.3,
    max_tokens: 4000,
    messages: [
      {
        role: "system",
        content: `You are a senior technology strategist with PhD in chemistry and MBA, specializing in intellectual property analysis, competitive intelligence, and market assessment. You have expertise in: patent landscape analysis, freedom-to-operate (FTO) assessment, technology maturity evaluation, and commercialization strategy. Analyze patents to identify breakthrough innovations, competitive positioning, white space opportunities, and market potential. Consider technical merit, commercial viability, and strategic value.`
      },
      {
        role: "user",
        content: `Patent Title: ${patentTitle}\n\nAbstract: ${patentAbstract}\n\nPatent Text:\n${patentText.slice(0, 6000)}\n\nProvide a technology landscape analysis including category, key innovations, competitor analysis, and market applications.`
      }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "technology_landscape",
        strict: true,
        schema: {
          type: "object",
          properties: {
            category: { type: "string", description: "Technology category" },
            key_innovations: { type: "array", items: { type: "string" }, description: "Key innovations" },
            competitors: { type: "array", items: { type: "string" }, description: "Competitor companies" },
            market_position: { type: "string", description: "Market position" },
            differentiators: { type: "array", items: { type: "string" }, description: "Key differentiators" },
            market_applications: { type: "array", items: { type: "string" }, description: "Market applications" },
          },
          required: ["category", "key_innovations", "market_applications"],
          additionalProperties: false
        }
      }
    }
  });

  const content = typeof response.choices[0].message.content === 'string' 
    ? response.choices[0].message.content 
    : JSON.stringify(response.choices[0].message.content);
  const result = JSON.parse(content || "{}");
  return {
    category: result.category,
    keyInnovations: result.key_innovations || [],
    competitorAnalysis: {
      competitors: result.competitors || [],
      marketPosition: result.market_position || "",
      differentiators: result.differentiators || [],
    },
    marketApplications: result.market_applications || [],
  };
}

/**
 * Generate formulation strategies based on patent analysis
 */
export async function generateFormulationStrategies(
  compounds: ChemicalCompound[],
  mechanisms: ReactionMechanism[],
  processingConditions: ProcessingConditions,
  technologyLandscape: TechnologyLandscape
): Promise<FormulationStrategy[]> {
  const response = await invokeLLM({
    model: "claude-opus-4-5",
    temperature: 0.3,
    max_tokens: 4000,
    messages: [
      {
        role: "system",
        content: `You are a PhD-level formulation scientist with 20+ years of R&D experience in product development and competitive analysis. You have expertise in: formulation design, material selection, process optimization, and intellectual property navigation. Generate actionable formulation strategies that achieve similar performance while avoiding patent infringement. Consider design-around approaches, alternative chemistries, and process modifications. Provide specific recommendations with technical justifications and risk assessments.`
      },
      {
        role: "user",
        content: `Patent Analysis Summary:

Chemical Compounds: ${JSON.stringify(compounds, null, 2)}

Reaction Mechanisms: ${JSON.stringify(mechanisms, null, 2)}

Processing Conditions: ${JSON.stringify(processingConditions, null, 2)}

Technology Landscape: ${JSON.stringify(technologyLandscape, null, 2)}

Generate 2-3 practical formulation strategies that could achieve similar or better performance, including key components, processing steps, expected performance, challenges, and recommendations.`
      }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "formulation_strategies",
        strict: true,
        schema: {
          type: "object",
          properties: {
            strategies: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  approach: { type: "string", description: "Strategy approach" },
                  key_components: { type: "array", items: { type: "string" }, description: "Key components" },
                  processing_steps: { type: "array", items: { type: "string" }, description: "Processing steps" },
                  expected_performance: { type: "array", items: { type: "string" }, description: "Expected performance" },
                  challenges: { type: "array", items: { type: "string" }, description: "Challenges" },
                  recommendations: { type: "array", items: { type: "string" }, description: "Recommendations" },
                },
                required: ["approach", "key_components", "processing_steps"],
                additionalProperties: false
              }
            }
          },
          required: ["strategies"],
          additionalProperties: false
        }
      }
    }
  });

  const content = typeof response.choices[0].message.content === 'string' 
    ? response.choices[0].message.content 
    : JSON.stringify(response.choices[0].message.content);
  const result = JSON.parse(content || "{}");
  return (result.strategies || []).map((s: any) => ({
    approach: s.approach,
    keyComponents: s.key_components || [],
    processingSteps: s.processing_steps || [],
    expectedPerformance: s.expected_performance || [],
    challenges: s.challenges || [],
    recommendations: s.recommendations || [],
  }));
}

/**
 * Complete patent analysis workflow with memory integration
 */
export async function analyzePatent(
  patentId: string,
  patentTitle: string,
  patentAbstract: string,
  patentText: string,
  organizationId?: string
): Promise<{
  compounds: ChemicalCompound[];
  mechanisms: ReactionMechanism[];
  processingConditions: ProcessingConditions;
  technologyLandscape: TechnologyLandscape;
  formulationStrategies: FormulationStrategy[];
  memorySources?: Array<{ id: number; fact: string; confidence: number; category: string }>;
}> {
  // Phase 0: Retrieve relevant memories for context-aware analysis
  let relevantMemories: any[] = [];
  let memoryContext = '';
  
  if (organizationId) {
    try {
      console.log("[PatentAnalysis] Retrieving relevant memories...");
      
      // Get compliance and regulatory memories
      const complianceMemories = await retrieveMemories({
        organizationId,
        query: `${patentTitle} compliance regulatory requirements`,
        category: 'compliance_rule',
        maxResults: 5,
        verify: false,
      });
      
      // Get formulation insights related to patent topic
      const formulationMemories = await retrieveMemories({
        organizationId,
        query: `${patentTitle} ${patentAbstract.slice(0, 200)}`,
        category: 'formulation_insight',
        maxResults: 5,
        verify: false,
      });
      
      // Get material property memories
      const materialMemories = await retrieveMemories({
        organizationId,
        query: patentTitle,
        category: 'material_property',
        maxResults: 3,
        verify: false,
      });
      
      // Get process parameter memories
      const processMemories = await retrieveMemories({
        organizationId,
        query: patentTitle,
        category: 'process_parameter',
        maxResults: 3,
        verify: false,
      });
      
      relevantMemories = [
        ...complianceMemories,
        ...formulationMemories,
        ...materialMemories,
        ...processMemories,
      ];
      
      if (relevantMemories.length > 0) {
        memoryContext = '\n\n## Organizational Knowledge Context\n' +
          'The following insights from your organization may be relevant:\n\n' +
          relevantMemories.map((m, i) => 
            `[${m.category.replace(/_/g, ' ')}] (${(m.confidence * 100).toFixed(0)}% confidence):\n${m.fact}`
          ).join('\n\n');
        console.log(`[PatentAnalysis] Injected ${relevantMemories.length} memories for context`);
      }
    } catch (error) {
      console.warn('[PatentAnalysis] Failed to retrieve memories:', error);
      // Continue without memories - non-critical
    }
  }

  // Enhance patent text with memory context for analysis
  const enhancedPatentText = patentText + memoryContext;

  // Run analyses in parallel for efficiency
  const [compounds, mechanisms, processingConditions, technologyLandscape] = await Promise.all([
    extractChemicalCompounds(enhancedPatentText, patentTitle),
    extractReactionMechanisms(enhancedPatentText, patentTitle),
    extractProcessingConditions(enhancedPatentText, patentTitle),
    analyzeTechnologyLandscape(enhancedPatentText, patentTitle, patentAbstract),
  ]);

  // Generate formulation strategies based on the analysis
  const formulationStrategies = await generateFormulationStrategies(
    compounds,
    mechanisms,
    processingConditions,
    technologyLandscape
  );

  // Store key insights as new memories (if organizationId provided)
  if (organizationId) {
    await storePatentAnalysisMemories(organizationId, patentId, patentTitle, {
      compounds,
      mechanisms,
      processingConditions,
      technologyLandscape,
      formulationStrategies,
    });
  }

  // Build memory sources for UI display
  const memorySources = relevantMemories.map(m => ({
    id: m.id,
    fact: m.fact,
    confidence: m.confidence,
    category: m.category,
  }));

  return {
    compounds,
    mechanisms,
    processingConditions,
    technologyLandscape,
    formulationStrategies,
    memorySources: memorySources.length > 0 ? memorySources : undefined,
  };
}

/**
 * Store key insights from patent analysis as memories
 */
async function storePatentAnalysisMemories(
  organizationId: string,
  patentId: string,
  patentTitle: string,
  analysis: {
    compounds: ChemicalCompound[];
    mechanisms: ReactionMechanism[];
    processingConditions: ProcessingConditions;
    technologyLandscape: TechnologyLandscape;
    formulationStrategies: FormulationStrategy[];
  }
): Promise<void> {
  try {
    const citation = {
      type: 'document' as const,
      id: patentId,
      title: patentTitle,
    };

    // Store key compound insights
    const keyCompounds = analysis.compounds.filter(c => c.role && c.concentration);
    if (keyCompounds.length > 0) {
      const compoundFact = `Patent ${patentTitle} uses: ${keyCompounds.slice(0, 5).map(c => 
        `${c.name} (${c.role}${c.concentration ? `, ${c.concentration}` : ''})`
      ).join('; ')}`;
      
      await storeMemory({
        organizationId,
        fact: compoundFact,
        rationale: `Extracted from patent analysis of ${patentId}`,
        category: 'material_property',
        citations: [citation],
        tags: ['patent', 'compounds'],
        confidence: 0.85,
      });
    }

    // Store process parameter insights
    const pc = analysis.processingConditions;
    if (pc.temperature || pc.pressure || pc.time) {
      const processFact = `Patent ${patentTitle} processing: ${[
        pc.temperature && `temp: ${pc.temperature}`,
        pc.pressure && `pressure: ${pc.pressure}`,
        pc.time && `time: ${pc.time}`,
        pc.atmosphere && `atmosphere: ${pc.atmosphere}`,
      ].filter(Boolean).join(', ')}`;
      
      await storeMemory({
        organizationId,
        fact: processFact,
        rationale: `Extracted from patent analysis of ${patentId}`,
        category: 'process_parameter',
        citations: [citation],
        tags: ['patent', 'process'],
        confidence: 0.85,
      });
    }

    // Store key innovation insights
    const innovations = analysis.technologyLandscape.keyInnovations;
    if (innovations && innovations.length > 0) {
      const innovationFact = `Key innovations in ${patentTitle}: ${innovations.slice(0, 3).join('; ')}`;
      
      await storeMemory({
        organizationId,
        fact: innovationFact,
        rationale: `Technology landscape analysis from patent ${patentId}`,
        category: 'formulation_insight',
        citations: [citation],
        tags: ['patent', 'innovation'],
        confidence: 0.8,
      });
    }

    // Store formulation strategy recommendations
    for (const strategy of analysis.formulationStrategies.slice(0, 2)) {
      if (strategy.recommendations && strategy.recommendations.length > 0) {
        const strategyFact = `${strategy.approach}: ${strategy.recommendations.slice(0, 2).join('; ')}`;
        
        await storeMemory({
          organizationId,
          fact: strategyFact,
          rationale: `Formulation strategy from patent ${patentId}`,
          category: 'formulation_insight',
          citations: [citation],
          tags: ['patent', 'strategy'],
          confidence: 0.75,
        });
      }
    }

    console.log(`[PatentAnalysis] Stored memories from patent ${patentId}`);
  } catch (error) {
    console.warn('[PatentAnalysis] Failed to store memories:', error);
    // Non-critical - continue without storing
  }
}
