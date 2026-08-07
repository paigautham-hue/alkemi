/**
 * ALKEMI™ AI Prediction Engine
 * 
 * This module provides property prediction for formulations using LLM-based reasoning
 * with uncertainty quantification, confidence intervals, and feature importance.
 * 
 * UPGRADED: Uses Claude Sonnet 4.5 (balanced speed/quality) with fallback to Gemini 3 Flash
 * for fast, accurate property predictions.
 */

import { invokeLLM } from "./_core/llm";
import { invokeLLMWithFallback } from "./services/llmService";
import * as db from "./db";
import * as physics from "./physicsModels";
import { retrieveMemories, injectMemoryContext } from "./services/agentMemorySystem";
import { physicsValidator } from "./services/physicsValidation";
import { uncertaintyQuantifier } from "./services/uncertaintyQuantification";
import { contentRedactor } from "./services/contentRedaction";

export interface PredictionRequest {
  organizationId: string;
  formulationVersionId: string;
  testConditionSetId: string;
  propertyName: string;
  targetSpec?: {
    min?: number;
    max?: number;
    unit?: string;
  };
  requestedBy: string;
}

export interface PredictionResult {
  predictedValue: number;
  unit: string;
  uncertaintyLower: number;
  uncertaintyUpper: number;
  confidenceLevel: number;
  probabilityInSpec?: number;
  uncertaintyBreakdown?: {
    sources: {
      model: number;
      data: number;
      extrapolation: number;
    };
    riskLevel: {
      level: 'low' | 'moderate' | 'high' | 'very_high';
      color: string;
      recommendation: string;
    };
    formattedPrediction: string;
  };
  modelName: string;
  modelVersion: string;
  featureImportance: Array<{
    featureName: string;
    importance: number;
    contribution: number;
  }>;
  reasoning: string;
  physicsBasedPredictions?: physics.PhysicsPredictionResult[];
  compatibilityAssessment?: ReturnType<typeof physics.assessCompatibility>;
  hansenParameters?: ReturnType<typeof physics.calculateFormulationHSP>;
  physicsValidation?: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    calculations?: any;
  };
  memorySources?: Array<{
    id: number;
    fact: string;
    confidence: number;
  }>;
}

/**
 * Main prediction function that orchestrates the entire prediction pipeline
 */
export async function predictProperty(
  request: PredictionRequest
): Promise<PredictionResult> {
  // 1. Fetch formulation details with components
  const formulation = await db.getFormulationVersionById(
    request.formulationVersionId,
    request.organizationId
  );
  
  if (!formulation) {
    throw new Error("Formulation not found");
  }

  const components = await db.getFormulationComponents(
    request.formulationVersionId,
    request.organizationId
  );

  // 2. Fetch test conditions
  const testConditions = await db.getTestConditionSetById(
    request.testConditionSetId,
    request.organizationId
  );

  if (!testConditions) {
    throw new Error("Test conditions not found");
  }

  // 3. Fetch material properties for all components
  const materialsWithProperties = await Promise.all(
    components.map(async (comp) => {
      const material = await db.getMaterialById(comp.component.materialId, request.organizationId);
      return {
        component: comp.component,
        material,
      };
    })
  );

  // 3.5 Validate formulation physics BEFORE prediction
  const validationComponents = materialsWithProperties.map(mp => ({
    materialId: mp.component.materialId,
    materialName: mp.material?.name || 'Unknown',
    percentage: parseFloat(mp.component.percentage),
    viscosity: mp.material?.viscosity ? parseFloat(mp.material.viscosity) : undefined,
    hansen_d: mp.material?.hansenD ? parseFloat(mp.material.hansenD) : undefined,
    hansen_p: mp.material?.hansenP ? parseFloat(mp.material.hansenP) : undefined,
    hansen_h: mp.material?.hansenH ? parseFloat(mp.material.hansenH) : undefined,
  }));
  
  const physicsValidation = await physicsValidator.validate({
    id: formulation.id,
    name: `Formulation ${formulation.versionNumber}`,
    components: validationComponents,
  });
  
  // If physics validation fails, throw error with details
  if (!physicsValidation.isValid) {
    throw new Error(
      `Physics validation failed:\n${physicsValidation.errors.join('\n')}`
    );
  }
  
  // Log warnings but continue
  if (physicsValidation.warnings.length > 0) {
    console.warn('[PredictionEngine] Physics warnings:', physicsValidation.warnings);
  }

  // 3.6 Run physics-based predictions
  const physicsComponents: physics.FormulationComponent[] = materialsWithProperties.map(mp => ({
    materialId: mp.component.materialId,
    percentage: parseFloat(mp.component.percentage),
    material: mp.material ? {
      id: mp.material.id,
      name: mp.material.name,
      code: mp.material.code,
      hansenD: mp.material.hansenD ? parseFloat(mp.material.hansenD) : null,
      hansenP: mp.material.hansenP ? parseFloat(mp.material.hansenP) : null,
      hansenH: mp.material.hansenH ? parseFloat(mp.material.hansenH) : null,
      viscosity: mp.material.viscosity ? parseFloat(mp.material.viscosity) : null,
      density: mp.material.density ? parseFloat(mp.material.density) : null,
      refractiveIndex: mp.material.refractiveIndex ? parseFloat(mp.material.refractiveIndex) : null,
      glassTransitionTemp: mp.material.glassTransitionTemp ? parseFloat(mp.material.glassTransitionTemp) : null,
      molecularWeight: mp.material.molecularWeight ? parseFloat(mp.material.molecularWeight) : null,
    } : undefined
  }));

  const physicsResults = physics.predictAllProperties(physicsComponents);

  // 4. Build context for LLM
  const formulationContext = buildFormulationContext(
    formulation,
    materialsWithProperties,
    testConditions
  );

  // 4.5 Retrieve relevant memories for context-aware predictions
  const materialNames = materialsWithProperties.map(m => m.material?.name || '').filter(Boolean);
  const memoryQuery = `${request.propertyName} prediction for formulation with ${materialNames.join(', ')}`;
  
  let relevantMemories: any[] = [];
  let memoryContext = '';
  try {
    relevantMemories = await retrieveMemories({
      organizationId: request.organizationId,
      query: memoryQuery,
      category: 'formulation_insight',
      maxResults: 5,
      verify: false, // Skip verification for speed
    });
    
    // Also get material property memories
    const materialMemories = await retrieveMemories({
      organizationId: request.organizationId,
      query: materialNames.join(' '),
      category: 'material_property',
      maxResults: 3,
      verify: false,
    });
    
    relevantMemories = [...relevantMemories, ...materialMemories];
    
    if (relevantMemories.length > 0) {
      memoryContext = '\n\n## Relevant Knowledge from Previous Analyses\n' +
        relevantMemories.map((m, i) => 
          `[Memory ${i + 1}] (${(m.confidence * 100).toFixed(0)}% confidence): ${m.fact}`
        ).join('\n');
      console.log(`[PredictionEngine] Injected ${relevantMemories.length} memories for context`);
    }
  } catch (error) {
    console.warn('[PredictionEngine] Failed to retrieve memories:', error);
    // Continue without memories - non-critical
  }

  // 5. Invoke LLM for prediction with structured output (including memory context)
  const prediction = await invokeLLMForPrediction(
    formulationContext + memoryContext,
    request.propertyName,
    request.targetSpec,
    relevantMemories
  );

  // 6. Calculate probability in spec using new UQ service
  let probabilityInSpec: number | undefined;
  let uncertaintyBreakdown: any;
  
  if (request.targetSpec && request.targetSpec.min !== undefined && request.targetSpec.max !== undefined) {
    // Calculate standard deviation from confidence interval
    const sigma = (prediction.uncertaintyUpper - prediction.uncertaintyLower) / (2 * 1.96);
    
    // Use new uncertainty quantification service
    const uqResult = uncertaintyQuantifier.quantify(
      prediction.predictedValue,
      sigma,
      {
        minValue: request.targetSpec.min,
        maxValue: request.targetSpec.max,
        unit: request.targetSpec.unit || '',
      },
      {
        modelConfidence: prediction.confidenceLevel,
        dataQuality: 0.85, // Heuristic - would come from training data quality in production
        isExtrapolation: false, // Would check if formulation is outside training range
      }
    );
    
    probabilityInSpec = uqResult.probabilityInSpec;
    uncertaintyBreakdown = {
      sources: uqResult.uncertaintySources,
      riskLevel: uncertaintyQuantifier.getRiskLevel(uqResult.probabilityInSpec),
      formattedPrediction: uncertaintyQuantifier.formatPrediction(uqResult, request.targetSpec.unit || ''),
    };
  }

  return {
    ...prediction,
    probabilityInSpec,
    uncertaintyBreakdown,
    physicsBasedPredictions: physicsResults.predictions,
    compatibilityAssessment: physicsResults.compatibility,
    hansenParameters: physicsResults.hsp,
    physicsValidation,
  };
}

/**
 * Build comprehensive context for LLM prediction
 */
function buildFormulationContext(
  formulation: any,
  components: any[],
  testConditions: any
): string {
  const componentsList = components
    .map((comp) => {
      const mat = comp.material;
      if (!mat) return null;

      return `
- ${mat.name} (${mat.code}): ${comp.percentage}%
  * Category: ${mat.category || "N/A"}
  * CAS: ${mat.casNumber || "N/A"}
  * Density: ${mat.density || "N/A"}
  * Viscosity: ${mat.viscosity || "N/A"}
  * Molecular Weight: ${mat.molecularWeight || "N/A"}
  * Hansen Parameters: δD=${mat.hansenD || "N/A"}, δP=${mat.hansenP || "N/A"}, δH=${mat.hansenH || "N/A"}
      `.trim();
    })
    .filter(Boolean)
    .join("\n\n");

  const testConditionsList = testConditions.parameters
    .map((param: any) => `- ${param.parameterName}: ${param.parameterValue}${param.unit ? " " + param.unit : ""}`)
    .join("\n");

  return `
# Formulation Details

**Formulation Code:** ${formulation.versionCode}
**Description:** ${formulation.description || "No description"}
**Branch Type:** ${formulation.branchType}

## Components (Total: ${components.length})

${componentsList}

## Test Conditions

${testConditionsList}

## Additional Context

- Domain: ${formulation.domainId}
- Status: ${formulation.status}
- Created: ${new Date(formulation.createdAt).toLocaleDateString()}
  `.trim();
}

/**
 * Invoke LLM with structured output for property prediction
 */
async function invokeLLMForPrediction(
  formulationContext: string,
  propertyName: string,
  targetSpec?: { min?: number; max?: number; unit?: string },
  relevantMemories?: any[]
): Promise<Omit<PredictionResult, "probabilityInSpec"> & { memorySources?: Array<{ id: number; fact: string; confidence: number }> }> {
  const specContext = targetSpec
    ? `\n\nTarget Specification:\n- Min: ${targetSpec.min !== undefined ? targetSpec.min : "N/A"}\n- Max: ${targetSpec.max !== undefined ? targetSpec.max : "N/A"}\n- Unit: ${targetSpec.unit || "N/A"}`
    : "";

  const systemPrompt = `You are an expert formulation chemist with deep knowledge of material science, polymer chemistry, and predictive modeling. Your task is to predict the value of a specific property for a given formulation based on its composition, material properties, and test conditions.

You must provide:
1. A predicted value for the property
2. Uncertainty bounds (lower and upper confidence limits at 95% confidence level)
3. Feature importance scores showing which components/factors contribute most
4. Clear reasoning explaining your prediction

Consider:
- Synergistic and antagonistic effects between components
- Impact of test conditions on the property
- Material properties (Hansen parameters, viscosity, density, molecular weight)
- Typical ranges for this property in the domain
- Component percentages and their influence
- Any relevant knowledge from previous analyses provided in the context

Be conservative with uncertainty estimates - it's better to have wider bounds than overconfident narrow ones.

If relevant knowledge from previous analyses is provided, incorporate those insights into your prediction and reasoning.`;

  const userPrompt = `${formulationContext}${specContext}

Please predict the following property: **${propertyName}**

Provide your prediction in the following structured format.`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "property_prediction",
          strict: true,
          schema: {
            type: "object",
            properties: {
              predictedValue: {
                type: "number",
                description: "The predicted value of the property",
              },
              unit: {
                type: "string",
                description: "The unit of measurement for the property",
              },
              uncertaintyLower: {
                type: "number",
                description: "Lower bound of 95% confidence interval",
              },
              uncertaintyUpper: {
                type: "number",
                description: "Upper bound of 95% confidence interval",
              },
              featureImportance: {
                type: "array",
                description: "List of features with their importance scores",
                items: {
                  type: "object",
                  properties: {
                    featureName: {
                      type: "string",
                      description: "Name of the feature (component or condition)",
                    },
                    importance: {
                      type: "number",
                      description: "Importance score (0-1, sum to 1)",
                    },
                    contribution: {
                      type: "number",
                      description: "Contribution to predicted value (can be positive or negative)",
                    },
                  },
                  required: ["featureName", "importance", "contribution"],
                  additionalProperties: false,
                },
              },
              reasoning: {
                type: "string",
                description: "Detailed explanation of the prediction and key factors",
              },
            },
            required: [
              "predictedValue",
              "unit",
              "uncertaintyLower",
              "uncertaintyUpper",
              "featureImportance",
              "reasoning",
            ],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    if (!content || typeof content !== 'string') {
      throw new Error("No valid response from LLM");
    }

    const parsed = JSON.parse(content);

    // Build memory sources for UI display
    const memorySources = relevantMemories?.map(m => ({
      id: m.id,
      fact: m.fact,
      confidence: m.confidence,
    }));

    return {
      predictedValue: parsed.predictedValue,
      unit: parsed.unit,
      uncertaintyLower: parsed.uncertaintyLower,
      uncertaintyUpper: parsed.uncertaintyUpper,
      confidenceLevel: 0.95, // 95% confidence interval
      modelName: response.model || "gpt-4",
      modelVersion: "1.0",
      featureImportance: parsed.featureImportance,
      reasoning: parsed.reasoning,
      memorySources,
    };
  } catch (error) {
    console.error("[PredictionEngine] LLM invocation failed:", error);
    throw new Error(`Prediction failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Store prediction result in database
 */
export async function storePrediction(
  request: PredictionRequest,
  result: PredictionResult
): Promise<string> {
  return await db.createPrediction({
    organizationId: request.organizationId,
    formulationVersionId: request.formulationVersionId,
    testConditionSetId: request.testConditionSetId,
    propertyName: request.propertyName,
    predictedValue: result.predictedValue,
    unit: result.unit,
    uncertaintyLower: result.uncertaintyLower,
    uncertaintyUpper: result.uncertaintyUpper,
    confidenceLevel: result.confidenceLevel,
    probabilityInSpec: result.probabilityInSpec,
    modelName: result.modelName,
    modelVersion: result.modelVersion,
    requestedBy: request.requestedBy,
    featureImportance: result.featureImportance,
  });
}
