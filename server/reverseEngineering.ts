/**
 * Reverse Engineering Service
 * 
 * Provides AI-powered competitor product analysis and formulation strategy generation.
 * Helps R&D teams translate marketing claims into technical parameters and generate
 * Target Product Profiles (TPP) for new formulation development.
 */

import { invokeLLM } from "./_core/llm";
import * as db from "./db";

export interface PerformanceTranslationResult {
  technicalParameters: Record<string, { value: string; unit: string; confidence: number }>;
  testMethods: string[];
  specifications: Record<string, { min?: number; max?: number; target?: number }>;
  criticalProperties: string[];
}

export interface FormulationStrategyResult {
  recommendedApproach: string;
  keyIngredientCategories: Array<{
    category: string;
    purpose: string;
    typicalPercentage: string;
    examples: string[];
  }>;
  processingConsiderations: string[];
  potentialChallenges: string[];
  alternativeApproaches: string[];
}

export interface TargetProductProfileResult {
  productName: string;
  targetMarket: string;
  performanceRequirements: Record<string, any>;
  physicalProperties: Record<string, any>;
  chemicalProperties: Record<string, any>;
  applicationProperties: Record<string, any>;
  regulatoryRequirements: string[];
  costTarget: string;
  competitiveAdvantages: string[];
}

/**
 * Translate marketing performance claims into measurable technical parameters
 */
export async function translatePerformanceClaims(
  productName: string,
  manufacturer: string,
  marketingClaims: string[],
  domain: string,
  observedProperties?: Record<string, any>
): Promise<PerformanceTranslationResult> {
  const prompt = `You are an expert formulation chemist specializing in ${domain}. 

Analyze the following competitor product and translate its marketing claims into specific, measurable technical parameters:

Product: ${productName} by ${manufacturer}
Marketing Claims:
${marketingClaims.map((claim, i) => `${i + 1}. ${claim}`).join("\n")}

${observedProperties ? `\nObserved Properties:\n${JSON.stringify(observedProperties, null, 2)}` : ""}

Provide a detailed technical translation including:
1. Specific technical parameters with values, units, and confidence levels
2. Standard test methods (ASTM, ISO, etc.) to measure these parameters
3. Quantitative specifications (min/max/target values)
4. Critical properties that define the product's performance

Format your response as JSON with the following structure:
{
  "technicalParameters": {
    "parameterName": {
      "value": "estimated value",
      "unit": "unit of measurement",
      "confidence": 0.0-1.0
    }
  },
  "testMethods": ["ASTM D...", "ISO ..."],
  "specifications": {
    "propertyName": {
      "min": number,
      "max": number,
      "target": number
    }
  },
  "criticalProperties": ["property1", "property2"]
}`;

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: "You are an expert formulation chemist with deep knowledge of material science, analytical chemistry, and product development. Provide precise, quantitative technical analysis.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "performance_translation",
        strict: true,
        schema: {
          type: "object",
          properties: {
            technicalParameters: {
              type: "object",
              additionalProperties: {
                type: "object",
                properties: {
                  value: { type: "string" },
                  unit: { type: "string" },
                  confidence: { type: "number" },
                },
                required: ["value", "unit", "confidence"],
                additionalProperties: false,
              },
            },
            testMethods: {
              type: "array",
              items: { type: "string" },
            },
            specifications: {
              type: "object",
              additionalProperties: {
                type: "object",
                properties: {
                  min: { type: "number" },
                  max: { type: "number" },
                  target: { type: "number" },
                },
                additionalProperties: false,
              },
            },
            criticalProperties: {
              type: "array",
              items: { type: "string" },
            },
          },
          required: ["technicalParameters", "testMethods", "specifications", "criticalProperties"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0].message.content;
  if (typeof content !== 'string') {
    throw new Error('Invalid LLM response format');
  }
  return JSON.parse(content);
}

/**
 * Generate formulation strategy to match or exceed competitor product
 */
export async function generateFormulationStrategy(
  productName: string,
  manufacturer: string,
  technicalParameters: Record<string, any>,
  domain: string,
  availableMaterials?: Array<{ name: string; type: string; properties: Record<string, any> }>
): Promise<FormulationStrategyResult> {
  const prompt = `You are an expert formulation chemist specializing in ${domain}.

Generate a comprehensive formulation strategy to match or exceed this competitor product:

Product: ${productName} by ${manufacturer}

Technical Parameters:
${JSON.stringify(technicalParameters, null, 2)}

${availableMaterials ? `\nAvailable Materials in Library:\n${availableMaterials.map(m => `- ${m.name} (${m.type})`).join("\n")}` : ""}

Provide a detailed formulation strategy including:
1. Recommended formulation approach (e.g., solvent-based, water-based, hybrid)
2. Key ingredient categories with purposes, typical percentages, and examples
3. Processing considerations (mixing order, temperature, time, equipment)
4. Potential challenges and mitigation strategies
5. Alternative approaches if the primary strategy fails

Format your response as JSON.`;

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: "You are an expert formulation chemist with extensive experience in product development, material selection, and process optimization.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "formulation_strategy",
        strict: true,
        schema: {
          type: "object",
          properties: {
            recommendedApproach: { type: "string" },
            keyIngredientCategories: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  category: { type: "string" },
                  purpose: { type: "string" },
                  typicalPercentage: { type: "string" },
                  examples: {
                    type: "array",
                    items: { type: "string" },
                  },
                },
                required: ["category", "purpose", "typicalPercentage", "examples"],
                additionalProperties: false,
              },
            },
            processingConsiderations: {
              type: "array",
              items: { type: "string" },
            },
            potentialChallenges: {
              type: "array",
              items: { type: "string" },
            },
            alternativeApproaches: {
              type: "array",
              items: { type: "string" },
            },
          },
          required: [
            "recommendedApproach",
            "keyIngredientCategories",
            "processingConsiderations",
            "potentialChallenges",
            "alternativeApproaches",
          ],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0].message.content;
  if (typeof content !== 'string') {
    throw new Error('Invalid LLM response format');
  }
  return JSON.parse(content);
}

/**
 * Generate Target Product Profile (TPP) for new formulation development
 */
export async function generateTargetProductProfile(
  productName: string,
  manufacturer: string,
  marketingClaims: string[],
  technicalParameters: Record<string, any>,
  domain: string,
  targetMarket?: string
): Promise<TargetProductProfileResult> {
  const prompt = `You are an expert formulation chemist and product development manager specializing in ${domain}.

Generate a comprehensive Target Product Profile (TPP) based on this competitor product analysis:

Product: ${productName} by ${manufacturer}
Target Market: ${targetMarket || "General market"}

Marketing Claims:
${marketingClaims.map((claim, i) => `${i + 1}. ${claim}`).join("\n")}

Technical Parameters:
${JSON.stringify(technicalParameters, null, 2)}

Create a detailed TPP that defines:
1. Product name and target market segment
2. Performance requirements (quantitative targets)
3. Physical properties (appearance, viscosity, density, etc.)
4. Chemical properties (pH, solids content, VOC, etc.)
5. Application properties (coverage, drying time, adhesion, etc.)
6. Regulatory requirements (VOC limits, hazard classifications, etc.)
7. Cost target (relative to competitor)
8. Competitive advantages to differentiate from competitor

Format your response as JSON.`;

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: "You are an expert in product development with deep knowledge of market requirements, technical specifications, and competitive positioning.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "target_product_profile",
        strict: true,
        schema: {
          type: "object",
          properties: {
            productName: { type: "string" },
            targetMarket: { type: "string" },
            performanceRequirements: { type: "object", additionalProperties: true },
            physicalProperties: { type: "object", additionalProperties: true },
            chemicalProperties: { type: "object", additionalProperties: true },
            applicationProperties: { type: "object", additionalProperties: true },
            regulatoryRequirements: {
              type: "array",
              items: { type: "string" },
            },
            costTarget: { type: "string" },
            competitiveAdvantages: {
              type: "array",
              items: { type: "string" },
            },
          },
          required: [
            "productName",
            "targetMarket",
            "performanceRequirements",
            "physicalProperties",
            "chemicalProperties",
            "applicationProperties",
            "regulatoryRequirements",
            "costTarget",
            "competitiveAdvantages",
          ],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0].message.content;
  if (typeof content !== 'string') {
    throw new Error('Invalid LLM response format');
  }
  return JSON.parse(content);
}

/**
 * Find alternative materials from the materials library that could be used
 * to replicate the competitor product
 */
export async function findAlternativeMaterials(
  organizationId: string,
  technicalParameters: Record<string, any>,
  domain: string
): Promise<Array<{ materialId: string; materialName: string; similarity: number; rationale: string }>> {
  // Get all materials from the organization's library
  const materials = await db.getMaterials(organizationId, {});

  if (materials.length === 0) {
    return [];
  }

  const prompt = `You are an expert formulation chemist specializing in ${domain}.

Analyze these materials from the library and identify which ones could be used to replicate a product with these technical parameters:

Technical Parameters:
${JSON.stringify(technicalParameters, null, 2)}

Available Materials:
${materials.map((m, i) => `${i + 1}. ${m.name} (${m.category || 'Unknown'})`).join("\n\n")}

For each suitable material, provide:
1. Material ID
2. Similarity score (0.0-1.0) indicating how well it matches the requirements
3. Rationale explaining why this material is suitable

Return only materials with similarity >= 0.5.
Format your response as JSON array.`;

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: "You are an expert in material science and formulation chemistry with deep knowledge of material properties and their applications.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "alternative_materials",
        strict: true,
        schema: {
          type: "object",
          properties: {
            materials: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  materialId: { type: "string" },
                  materialName: { type: "string" },
                  similarity: { type: "number" },
                  rationale: { type: "string" },
                },
                required: ["materialId", "materialName", "similarity", "rationale"],
                additionalProperties: false,
              },
            },
          },
          required: ["materials"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0].message.content;
  if (typeof content !== 'string') {
    throw new Error('Invalid LLM response format');
  }
  const result = JSON.parse(content);
  return result.materials;
}

/**
 * Perform complete reverse engineering analysis on a competitor product
 */
export async function performCompleteAnalysis(
  competitorProductId: string,
  organizationId: string,
  userId: string
) {
  // Get the competitor product
  const product = await db.getCompetitorProductById(competitorProductId, organizationId);
  if (!product) {
    throw new Error("Competitor product not found");
  }

  // Update status to analyzing
  await db.updateCompetitorProduct(competitorProductId, organizationId, {
    analysisStatus: "analyzing",
  });

  try {
    // Step 1: Translate performance claims to technical parameters
    const performanceTranslation = await translatePerformanceClaims(
      product.productName,
      product.manufacturer,
      (product.marketingClaims as string[]) || [],
      product.domainId || "general",
      product.observedProperties as Record<string, any>
    );

    // Save performance translation analysis
    await db.createReverseEngineeringAnalysis({
      organizationId,
      competitorProductId,
      userId,
      analysisType: "performance_translation",
      inputData: {
        marketingClaims: product.marketingClaims,
        observedProperties: product.observedProperties,
      },
      results: performanceTranslation,
    });

    // Step 2: Generate formulation strategy
    const materials = await db.getMaterials(organizationId, {});
    const formulationStrategy = await generateFormulationStrategy(
      product.productName,
      product.manufacturer,
      performanceTranslation.technicalParameters,
      product.domainId || "general",
      materials.map((m) => ({
        name: m.name,
        type: m.category || "Unknown",
        properties: {},
      }))
    );

    // Save formulation strategy analysis
    await db.createReverseEngineeringAnalysis({
      organizationId,
      competitorProductId,
      userId,
      analysisType: "formulation_strategy",
      inputData: {
        technicalParameters: performanceTranslation.technicalParameters,
      },
      results: formulationStrategy,
    });

    // Step 3: Generate Target Product Profile
    const tpp = await generateTargetProductProfile(
      product.productName,
      product.manufacturer,
      (product.marketingClaims as string[]) || [],
      performanceTranslation.technicalParameters,
      product.domainId || "general",
      product.category || undefined
    );

    // Save TPP analysis
    await db.createReverseEngineeringAnalysis({
      organizationId,
      competitorProductId,
      userId,
      analysisType: "tpp_generation",
      inputData: {
        marketingClaims: product.marketingClaims,
        technicalParameters: performanceTranslation.technicalParameters,
      },
      results: tpp,
    });

    // Step 4: Find alternative materials
    const alternativeMaterials = await findAlternativeMaterials(
      organizationId,
      performanceTranslation.technicalParameters,
      product.domainId || "general"
    );

    // Update competitor product with analysis results
    await db.updateCompetitorProduct(competitorProductId, organizationId, {
      extractedParameters: performanceTranslation.technicalParameters,
      suggestedFormulationStrategy: formulationStrategy.recommendedApproach,
      targetProductProfile: tpp,
      confidenceScore: "0.85", // Average confidence from analysis
      analysisStatus: "completed",
    });

    return {
      performanceTranslation,
      formulationStrategy,
      targetProductProfile: tpp,
      alternativeMaterials,
    };
  } catch (error) {
    // Update status to failed
    await db.updateCompetitorProduct(competitorProductId, organizationId, {
      analysisStatus: "failed",
    });
    throw error;
  }
}
