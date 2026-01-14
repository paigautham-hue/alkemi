import { invokeLLM } from "./_core/llm";

/**
 * Patent Analysis Service
 * 
 * Extracts chemistry, reaction mechanisms, and technology landscapes from patents
 * using LLM-powered analysis.
 */

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
  const response = await invokeLLM({
    model: "claude-opus-4-5",
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
 * Complete patent analysis workflow
 */
export async function analyzePatent(
  patentId: string,
  patentTitle: string,
  patentAbstract: string,
  patentText: string
): Promise<{
  compounds: ChemicalCompound[];
  mechanisms: ReactionMechanism[];
  processingConditions: ProcessingConditions;
  technologyLandscape: TechnologyLandscape;
  formulationStrategies: FormulationStrategy[];
}> {
  // Run analyses in parallel for efficiency
  const [compounds, mechanisms, processingConditions, technologyLandscape] = await Promise.all([
    extractChemicalCompounds(patentText, patentTitle),
    extractReactionMechanisms(patentText, patentTitle),
    extractProcessingConditions(patentText, patentTitle),
    analyzeTechnologyLandscape(patentText, patentTitle, patentAbstract),
  ]);

  // Generate formulation strategies based on the analysis
  const formulationStrategies = await generateFormulationStrategies(
    compounds,
    mechanisms,
    processingConditions,
    technologyLandscape
  );

  return {
    compounds,
    mechanisms,
    processingConditions,
    technologyLandscape,
    formulationStrategies,
  };
}
