/**
 * Reverse Engineering Service
 * 
 * Provides AI-powered competitor product analysis and formulation strategy generation.
 * Helps R&D teams translate marketing claims into technical parameters and generate
 * Target Product Profiles (TPP) for new formulation development.
 * 
 * Uses a two-phase LLM approach for robust technical parameter extraction:
 * 1. Phase 1: Get detailed text analysis from claude-sonnet-4-5 (best for technical analysis)
 * 2. Phase 2: Structure the text into JSON using gpt-5.2 (best for JSON extraction)
 * 3. Fallback: Regex extraction if JSON parsing fails
 */

import { invokeLLM } from "./_core/llm";
import * as db from "./db";
import { invokeLLMWithFallback } from "./services/llmService";
import { storeMemory } from "./services/agentMemorySystem";

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
 * Extract test methods and critical properties from text using regex
 */
function extractParametersFromText(text: string): {
  testMethods: string[];
  criticalProperties: string[];
  technicalParameters: Record<string, { value: string; unit: string; confidence: number }>;
} {
  // Extract ASTM, ISO, EPA test methods
  const testMethodPatterns = [
    /ASTM\s+[A-Z]?\d+(?:-\d+)?/gi,
    /ISO\s+\d+(?:-\d+)?/gi,
    /EPA\s+Method\s+\d+/gi,
    /DIN\s+\d+/gi,
    /EN\s+\d+/gi,
  ];
  
  const testMethods = new Set<string>();
  for (const pattern of testMethodPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(m => testMethods.add(m.toUpperCase().replace(/\s+/g, ' ')));
    }
  }

  // Extract critical properties (common coating/material properties)
  const propertyKeywords = [
    'Corrosion Resistance', 'Adhesion', 'Hardness', 'Gloss', 'VOC',
    'Cure Time', 'Flexibility', 'Impact Resistance', 'Chemical Resistance',
    'UV Resistance', 'Weathering', 'Abrasion Resistance', 'Salt Spray',
    'Humidity Resistance', 'Temperature Resistance'
  ];
  
  const criticalProperties: string[] = [];
  for (const prop of propertyKeywords) {
    if (text.toLowerCase().includes(prop.toLowerCase())) {
      criticalProperties.push(prop);
    }
  }

  // Extract technical parameters with values (pattern: "Parameter: value unit")
  const technicalParameters: Record<string, { value: string; unit: string; confidence: number }> = {};
  const paramPattern = /([A-Z][a-zA-Z\s]+):\s*([\d<>≤≥±.,-]+)\s*([a-zA-Z%°/²³]+(?:\s*[a-zA-Z%°/²³]+)*)/g;
  let match;
  while ((match = paramPattern.exec(text)) !== null) {
    const name = match[1].trim();
    const value = match[2].trim();
    const unit = match[3].trim();
    if (name.length > 3 && name.length < 50 && !technicalParameters[name]) {
      technicalParameters[name] = { value, unit, confidence: 0.7 };
    }
  }

  return {
    testMethods: Array.from(testMethods),
    criticalProperties,
    technicalParameters
  };
}

/**
 * Translate marketing performance claims into measurable technical parameters
 * Uses a two-phase approach for robust extraction
 */
export async function translatePerformanceClaims(
  productName: string,
  manufacturer: string,
  marketingClaims: string[],
  domain: string,
  observedProperties?: Record<string, any>
): Promise<PerformanceTranslationResult> {
  // Validate input
  if (!marketingClaims || marketingClaims.length === 0) {
    throw new Error('Cannot translate performance claims: marketing claims array is empty');
  }

  // PHASE 1: Get detailed text analysis
  const textAnalysisPrompt = `You are an expert formulation chemist specializing in ${domain}. 

Analyze the following competitor product and translate its marketing claims into specific, measurable technical parameters:

Product: ${productName} by ${manufacturer}
Marketing Claims:
${marketingClaims.map((claim, i) => `${i + 1}. ${claim}`).join("\n")}

${observedProperties ? `\nObserved Properties:\n${JSON.stringify(observedProperties, null, 2)}` : ""}

For EACH marketing claim, provide:
1. The specific technical parameter(s) it implies
2. Estimated quantitative value with units
3. The standard test method (ASTM, ISO, EPA, etc.) used to measure it
4. Your confidence level (0.0-1.0) based on how directly the claim implies the parameter

IMPORTANT: You MUST provide at least 3-5 specific technical parameters with numerical values.

Example format for each claim:
**1. "Superior corrosion resistance":**
- Salt Spray Resistance: 1000 hours (ASTM B117) [Confidence: 0.85]
- Corrosion Rate: <0.1 mm/year (ASTM G31) [Confidence: 0.75]

At the end, list:
**All Test Methods Used:** ASTM B117, ASTM G31, etc.
**Critical Properties:** Corrosion Resistance, Adhesion, etc.`;

  let textAnalysis: string;
  try {
    // Use upgraded LLM service with GPT-5.2 (superior reasoning) and fallback chain
    const textResponse = await invokeLLMWithFallback({
      useCase: "reverse-engineering",
      enableFallback: true,
      temperature: 0.4,
      maxTokens: 4000,
      messages: [
        {
          role: "system",
          content: "You are a PhD-level formulation chemist with 20+ years of industrial R&D experience. You specialize in translating marketing claims into precise, measurable technical specifications. Always provide specific numerical values, test methods, and confidence levels.",
        },
        {
          role: "user",
          content: textAnalysisPrompt,
        },
      ],
    });
    
    textAnalysis = textResponse.content;
    console.log(`[ReverseEngineering] Phase 1 completed with ${textResponse.model} (${textResponse.latencyMs}ms, ${textResponse.tokensUsed} tokens, fallback: ${textResponse.fallbackUsed})`);
    console.log('[ReverseEngineering] Analysis preview:', textAnalysis.substring(0, 500) + '...');
  } catch (error) {
    console.error('[ReverseEngineering] Phase 1 failed:', error);
    throw new Error('Failed to get text analysis from LLM');
  }

  // PHASE 2: Structure the text into JSON
  const jsonStructuringPrompt = `Convert the following technical analysis into a structured JSON format.

Technical Analysis:
${textAnalysis}

Extract and structure the data as JSON with this EXACT format:
{
  "parameters": [
    { "name": "Parameter Name", "value": "numerical value", "unit": "unit with test method", "confidence": 0.85 }
  ],
  "testMethods": ["ASTM B117", "ASTM D3359", ...],
  "specifications": [
    { "name": "Property Name", "min": 500, "max": 1500, "target": 1000 }
  ],
  "criticalProperties": ["Corrosion Resistance", "Adhesion", ...]
}

IMPORTANT:
- Extract ALL technical parameters mentioned with their values
- Include the test method in the unit field (e.g., "hours (ASTM B117)")
- List ALL test methods mentioned (ASTM, ISO, EPA, DIN, etc.)
- Include ALL critical properties mentioned`;

  let structuredResult: any;
  try {
    const jsonResponse = await invokeLLM({
      model: "gpt-5.2",
      temperature: 0.1,
      max_tokens: 3000,
      messages: [
        {
          role: "system",
          content: "You are a data extraction specialist. Convert technical text into structured JSON. Be thorough and extract ALL data points mentioned.",
        },
        {
          role: "user",
          content: jsonStructuringPrompt,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "structured_parameters",
          strict: false,
          schema: {
            type: "object",
            properties: {
              parameters: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    value: { type: "string" },
                    unit: { type: "string" },
                    confidence: { type: "number" }
                  },
                  required: ["name", "value"]
                }
              },
              testMethods: { type: "array", items: { type: "string" } },
              specifications: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    min: { type: "number" },
                    max: { type: "number" },
                    target: { type: "number" }
                  }
                }
              },
              criticalProperties: { type: "array", items: { type: "string" } }
            },
            required: ["parameters", "testMethods", "criticalProperties"]
          }
        }
      }
    });

    const jsonContent = jsonResponse.choices[0].message.content as string;
    console.log('[ReverseEngineering] Phase 2 JSON response:', jsonContent.substring(0, 500) + '...');
    structuredResult = JSON.parse(jsonContent);
  } catch (error) {
    console.warn('[ReverseEngineering] Phase 2 JSON parsing failed, using regex extraction:', error);
    // Fallback to regex extraction from text analysis
    const extracted = extractParametersFromText(textAnalysis);
    structuredResult = {
      parameters: Object.entries(extracted.technicalParameters).map(([name, data]) => ({
        name,
        value: data.value,
        unit: data.unit,
        confidence: data.confidence
      })),
      testMethods: extracted.testMethods,
      specifications: [],
      criticalProperties: extracted.criticalProperties
    };
  }

  // Convert array-based parameters to object format
  const technicalParameters: Record<string, { value: string; unit: string; confidence: number }> = {};
  if (Array.isArray(structuredResult.parameters)) {
    for (const param of structuredResult.parameters) {
      if (param.name && param.value) {
        technicalParameters[param.name] = {
          value: String(param.value),
          unit: param.unit || '',
          confidence: param.confidence || 0.7
        };
      }
    }
  }

  // Convert array-based specifications to object format
  const specifications: Record<string, { min?: number; max?: number; target?: number }> = {};
  if (Array.isArray(structuredResult.specifications)) {
    for (const spec of structuredResult.specifications) {
      if (spec.name) {
        specifications[spec.name] = {
          min: spec.min,
          max: spec.max,
          target: spec.target
        };
      }
    }
  }

  // Merge with regex-extracted data for completeness
  const regexExtracted = extractParametersFromText(textAnalysis);
  const mergedTestMethods = Array.from(new Set([
    ...(structuredResult.testMethods || []),
    ...regexExtracted.testMethods
  ]));
  const mergedCriticalProperties = Array.from(new Set([
    ...(structuredResult.criticalProperties || []),
    ...regexExtracted.criticalProperties
  ]));

  // Add regex-extracted parameters if not already present
  for (const [name, data] of Object.entries(regexExtracted.technicalParameters)) {
    if (!technicalParameters[name]) {
      technicalParameters[name] = data;
    }
  }

  console.log('[ReverseEngineering] Final result:', {
    parameterCount: Object.keys(technicalParameters).length,
    testMethodCount: mergedTestMethods.length,
    criticalPropertyCount: mergedCriticalProperties.length
  });

  return {
    technicalParameters,
    testMethods: mergedTestMethods,
    specifications,
    criticalProperties: mergedCriticalProperties
  };
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
    model: "claude-opus-4-5",
    temperature: 0.3,
    max_tokens: 4000,
    messages: [
      {
        role: "system",
        content: "You are a PhD-level formulation chemist with expertise in product development, material selection, and process optimization. You have deep knowledge of: raw material sourcing, supplier qualification, cost-performance trade-offs, regulatory compliance (REACH, FDA, EPA), and sustainable chemistry. Provide actionable formulation strategies with specific material recommendations, processing conditions, and expected performance outcomes. Consider technical feasibility, cost constraints, and regulatory requirements.",
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

Create a TPP that:
1. Matches or exceeds the competitor's performance
2. Identifies opportunities for differentiation
3. Considers regulatory requirements
4. Sets realistic cost targets
5. Defines competitive advantages

Format your response as JSON.`;

  const response = await invokeLLM({
    model: "claude-opus-4-5",
    temperature: 0.3,
    max_tokens: 4000,
    messages: [
      {
        role: "system",
        content: "You are a senior product development manager with expertise in market analysis, competitive intelligence, and technical product specification. Create comprehensive Target Product Profiles that balance technical requirements, market needs, regulatory compliance, and commercial viability.",
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
            performanceRequirements: {
              type: "object",
              additionalProperties: { type: "string" },
            },
            physicalProperties: {
              type: "object",
              additionalProperties: { type: "string" },
            },
            chemicalProperties: {
              type: "object",
              additionalProperties: { type: "string" },
            },
            applicationProperties: {
              type: "object",
              additionalProperties: { type: "string" },
            },
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
 * Perform complete analysis on a competitor product
 */
export async function performCompleteAnalysis(
  productId: string,
  organizationId: string,
  userId: string
): Promise<{
  performanceTranslation: PerformanceTranslationResult;
  formulationStrategy: FormulationStrategyResult;
  targetProductProfile: TargetProductProfileResult;
}> {
  // Get the product
  const product = await db.getCompetitorProductById(productId, organizationId);
  if (!product) {
    throw new Error('Product not found');
  }

  // Get available materials for formulation strategy
  const materials = await db.getMaterials(product.organizationId);

  // Extract marketing claims
  const marketingClaims = (product.marketingClaims as string[]) || [];
  if (marketingClaims.length === 0) {
    throw new Error('Cannot analyze product: no marketing claims available');
  }

  console.log('[ReverseEngineering] Starting analysis for:', product.productName);
  console.log('[ReverseEngineering] Marketing claims:', marketingClaims);

  // Perform all analyses
  const performanceTranslation = await translatePerformanceClaims(
    product.productName,
    product.manufacturer,
    marketingClaims,
    product.domainId || "general"
  );

  const formulationStrategy = await generateFormulationStrategy(
    product.productName,
    product.manufacturer,
    performanceTranslation.technicalParameters,
    product.domainId || "general",
    materials.map(m => ({
      name: m.name,
      type: m.category || 'general',
      properties: {} as Record<string, any>
    }))
  );

  const targetProductProfile = await generateTargetProductProfile(
    product.productName,
    product.manufacturer,
    marketingClaims,
    performanceTranslation.technicalParameters,
    product.domainId || "general"
  );

  // Save analyses to database
  await db.createReverseEngineeringAnalysis({
    organizationId: product.organizationId,
    competitorProductId: productId,
    userId,
    analysisType: 'performance_translation',
    inputData: { marketingClaims },
    results: performanceTranslation as any,
  });

  await db.createReverseEngineeringAnalysis({
    organizationId: product.organizationId,
    competitorProductId: productId,
    userId,
    analysisType: 'formulation_strategy',
    inputData: { technicalParameters: performanceTranslation.technicalParameters },
    results: formulationStrategy as any,
  });

  await db.createReverseEngineeringAnalysis({
    organizationId: product.organizationId,
    competitorProductId: productId,
    userId,
    analysisType: 'tpp_generation',
    inputData: { marketingClaims, technicalParameters: performanceTranslation.technicalParameters },
    results: targetProductProfile as any,
  });

  // Update product status
  await db.updateCompetitorProduct(productId, product.organizationId, { analysisStatus: 'completed' });

  // Auto-store key insights as memories
  await storeReverseEngineeringMemories(
    product.organizationId,
    userId,
    product.productName,
    product.manufacturer,
    productId,
    performanceTranslation,
    formulationStrategy,
    targetProductProfile
  );

  console.log('[ReverseEngineering] Analysis complete for:', product.productName);

  return {
    performanceTranslation,
    formulationStrategy,
    targetProductProfile
  };
}

/**
 * Calculate overall confidence from technical parameters
 */
function calculateOverallConfidence(
  technicalParameters: Record<string, { value: string; unit: string; confidence: number }>
): number {
  const confidences = Object.values(technicalParameters).map(p => p.confidence);
  if (confidences.length === 0) return 0.5;
  return confidences.reduce((sum, c) => sum + c, 0) / confidences.length;
}


/**
 * Auto-store key insights from reverse engineering analysis as memories
 */
async function storeReverseEngineeringMemories(
  organizationId: string,
  openId: string,
  productName: string,
  manufacturer: string,
  productId: string,
  performanceTranslation: PerformanceTranslationResult,
  formulationStrategy: FormulationStrategyResult,
  targetProductProfile: TargetProductProfileResult
): Promise<void> {
  const citation = {
    type: "external" as const,
    id: productId,
    title: `${productName} by ${manufacturer} - Reverse Engineering Analysis`,
  };

  try {
    // Store key technical parameters as memories
    const highConfidenceParams = Object.entries(performanceTranslation.technicalParameters)
      .filter(([_, data]) => data.confidence >= 0.7)
      .slice(0, 5); // Top 5 high-confidence parameters

    for (const [paramName, paramData] of highConfidenceParams) {
      await storeMemory({
        organizationId,
        openId,
        fact: `${productName} by ${manufacturer} achieves ${paramName}: ${paramData.value} ${paramData.unit}`,
        rationale: `Extracted from reverse engineering analysis with ${(paramData.confidence * 100).toFixed(0)}% confidence`,
        category: "formulation_insight",
        citations: [citation],
        tags: [manufacturer, productName, paramName.toLowerCase().replace(/\s+/g, '-')],
        confidence: paramData.confidence,
      });
    }

    // Store formulation approach as memory
    if (formulationStrategy.recommendedApproach) {
      await storeMemory({
        organizationId,
        openId,
        fact: `To match ${productName} by ${manufacturer}, recommended approach: ${formulationStrategy.recommendedApproach}`,
        rationale: `Generated formulation strategy based on technical parameter analysis`,
        category: "formulation_insight",
        citations: [citation],
        tags: [manufacturer, productName, 'strategy'],
        confidence: 0.85,
      });
    }

    // Store key ingredient insights
    for (const ingredient of formulationStrategy.keyIngredientCategories.slice(0, 3)) {
      await storeMemory({
        organizationId,
        openId,
        fact: `For ${productName}-like formulation: ${ingredient.category} (${ingredient.typicalPercentage}) - ${ingredient.purpose}`,
        rationale: `Key ingredient category identified during reverse engineering`,
        category: "material_property",
        citations: [citation],
        tags: [manufacturer, productName, ingredient.category.toLowerCase().replace(/\s+/g, '-')],
        confidence: 0.8,
      });
    }

    // Store potential challenges as troubleshooting memories
    for (const challenge of formulationStrategy.potentialChallenges.slice(0, 2)) {
      await storeMemory({
        organizationId,
        openId,
        fact: `Challenge when formulating ${productName}-like product: ${challenge}`,
        rationale: `Potential challenge identified during reverse engineering analysis`,
        category: "troubleshooting",
        citations: [citation],
        tags: [manufacturer, productName, 'challenge'],
        confidence: 0.75,
      });
    }

    // Store competitive advantages as insights
    for (const advantage of targetProductProfile.competitiveAdvantages.slice(0, 2)) {
      await storeMemory({
        organizationId,
        openId,
        fact: `Competitive advantage opportunity vs ${productName}: ${advantage}`,
        rationale: `Identified from Target Product Profile analysis`,
        category: "formulation_insight",
        citations: [citation],
        tags: [manufacturer, productName, 'competitive-advantage'],
        confidence: 0.8,
      });
    }

    // Store regulatory requirements
    for (const requirement of targetProductProfile.regulatoryRequirements.slice(0, 2)) {
      await storeMemory({
        organizationId,
        openId,
        fact: `Regulatory requirement for ${productName}-like product: ${requirement}`,
        rationale: `Regulatory consideration from Target Product Profile`,
        category: "compliance_rule",
        citations: [citation],
        tags: [manufacturer, productName, 'regulatory'],
        confidence: 0.9,
      });
    }

    console.log(`[ReverseEngineering] Stored ${highConfidenceParams.length + 8} memories for ${productName}`);
  } catch (error) {
    console.error('[ReverseEngineering] Error storing memories:', error);
    // Don't throw - memory storage is non-critical
  }
}
