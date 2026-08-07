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
import {
  fusePrediction,
  matchPhysicsProperty,
  computeHardBounds,
  type FusionResult,
  type PredictionBasis,
  type PhysicsAgreement,
} from "./prediction/fusion";
import { getSigmaCalibrated, type SigmaSource } from "./services/calibrationService";
import { detectExtrapolation } from "./services/extrapolationDetector";
import { resolveMaterials } from "./services/materialResolver";
import { predictExtendedProperties, parseConditions } from "./physics/index";

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
  // Provenance — where the number and its uncertainty actually came from
  predictionBasis?: PredictionBasis;
  physicsValue?: number;
  llmRawValue?: number;
  appliedAdjustmentPercent?: number;
  sigmaSource?: SigmaSource;
  sigmaNote?: string;
  provenance?: string;
  extrapolation?: {
    isExtrapolation: boolean;
    severity: "none" | "moderate" | "severe";
    note: string;
  };
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

  // 3.7 Extended physics (Materials v2): suspension rheology, PVC/CPVC,
  // crosslink density, UV cure depth. Uses the resolver so every input
  // carries provenance; models that lack inputs simply don't run.
  try {
    const totalPct = materialsWithProperties.reduce(
      (s, mp) => s + parseFloat(mp.component.percentage), 0
    );
    if (totalPct > 0) {
      const views = await resolveMaterials(
        materialsWithProperties.map(mp => mp.material).filter(Boolean)
      );
      const viewById = new Map(views.map(v => [v.id, v]));
      const extendedComponents = materialsWithProperties
        .filter(mp => mp.material && viewById.has(mp.material.id))
        .map(mp => ({
          massFraction: parseFloat(mp.component.percentage) / totalPct,
          view: viewById.get(mp.material!.id)!,
        }));
      const extended = predictExtendedProperties(
        extendedComponents,
        parseConditions(testConditions.parameters || [])
      );
      // Extended models supersede the naive mixing rule for the same
      // property (e.g. Krieger-Dougherty replaces log-mix when particles
      // are present).
      for (const p of extended.predictions) {
        const idx = physicsResults.predictions.findIndex(existing => existing.property === p.property);
        if (idx >= 0) physicsResults.predictions[idx] = p;
        else physicsResults.predictions.push(p);
      }
      if (extended.warnings.length > 0) {
        physicsValidation.warnings.push(...extended.warnings);
      }
    }
  } catch (error) {
    console.warn("[PredictionEngine] Extended physics failed (non-fatal):", error);
  }

  // 4. Build context for LLM — INCLUDING the computed physics estimates.
  // The LLM must see the physics numbers so it can anchor to them; it
  // previously predicted blind while the physics sat unused in the response.
  const formulationContext = buildFormulationContext(
    formulation,
    materialsWithProperties,
    testConditions,
    physicsResults
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

  // 6. Fuse physics and LLM: physics anchors where it applies, the LLM's
  // role is a bounded residual correction. The stored value is the fused
  // value, with full provenance.
  const canonicalProperty = matchPhysicsProperty(request.propertyName);
  const matchingPhysics = canonicalProperty
    ? physicsResults.predictions.find(p => p.property === canonicalProperty)
    : undefined;
  const hardBounds = computeHardBounds(
    canonicalProperty,
    physicsComponents.map(c => c.material?.density)
  );

  const fusion: FusionResult = fusePrediction(
    request.propertyName,
    matchingPhysics,
    {
      predictedValue: prediction.predictedValue,
      physicsAgreement: prediction.physicsAgreement,
      residualAdjustmentPercent: prediction.residualAdjustmentPercent,
      adjustmentJustification: prediction.adjustmentJustification,
    },
    hardBounds
  );

  // 6.5 Extrapolation: how far is this composition from anything trialed?
  let extrapolation: Awaited<ReturnType<typeof detectExtrapolation>> | undefined;
  try {
    extrapolation = await detectExtrapolation(request.organizationId, request.formulationVersionId);
  } catch (error) {
    console.warn("[PredictionEngine] extrapolation detection failed (non-fatal):", error);
  }

  // 7. Honest σ from the calibration service — NOT reverse-engineered from
  // LLM-asserted bounds. Ladder: physics band / floored LLM interval (cold
  // start) → conformal residual quantiles as matched trials accumulate.
  // Widened when the formulation is outside trialed composition space.
  const sigmaResult = await getSigmaCalibrated({
    propertyName: request.propertyName,
    predictedValue: fusion.finalValue,
    basis: fusion.basis,
    llmUncertaintyLower: prediction.uncertaintyLower,
    llmUncertaintyUpper: prediction.uncertaintyUpper,
    organizationId: request.organizationId,
    extrapolationInflation: extrapolation?.sigmaInflation,
  });
  const uncertaintyLower = fusion.finalValue - 1.96 * sigmaResult.sigma;
  const uncertaintyUpper = fusion.finalValue + 1.96 * sigmaResult.sigma;

  // 8. Probability-in-spec from the honest σ
  let probabilityInSpec: number | undefined;
  let uncertaintyBreakdown: any;

  if (request.targetSpec && request.targetSpec.min !== undefined && request.targetSpec.max !== undefined) {
    const uqResult = uncertaintyQuantifier.quantify(
      fusion.finalValue,
      sigmaResult.sigma,
      {
        minValue: request.targetSpec.min,
        maxValue: request.targetSpec.max,
        unit: request.targetSpec.unit || '',
      },
      {
        modelConfidence: prediction.confidenceLevel,
        dataQuality: 0.85, // Heuristic — future: derive from resolver provenance coverage
        isExtrapolation: extrapolation?.isExtrapolation ?? true,
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
    predictedValue: fusion.finalValue,
    uncertaintyLower,
    uncertaintyUpper,
    probabilityInSpec,
    uncertaintyBreakdown,
    predictionBasis: fusion.basis,
    physicsValue: fusion.physicsValue,
    llmRawValue: fusion.llmRawValue,
    appliedAdjustmentPercent: fusion.appliedAdjustmentPercent,
    sigmaSource: sigmaResult.sigmaSource,
    sigmaNote: sigmaResult.note,
    provenance: fusion.provenance,
    extrapolation: extrapolation
      ? {
          isExtrapolation: extrapolation.isExtrapolation,
          severity: extrapolation.severity,
          note: extrapolation.note,
        }
      : undefined,
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
  testConditions: any,
  physicsResults?: ReturnType<typeof physics.predictAllProperties>
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

  // Render the deterministic physics estimates so the LLM anchors to them
  // instead of predicting blind.
  let physicsSection = "";
  if (physicsResults && physicsResults.predictions.length > 0) {
    const lines = physicsResults.predictions.map(p =>
      `- ${p.property}: ${p.value} ${p.unit} (method: ${p.method}; confidence: ${p.confidence}${p.notes ? `; ${p.notes}` : ""})`
    );
    physicsSection = `\n\n## Computed Physics Estimates (deterministic, from mixing rules)\n\n${lines.join("\n")}`;

    if (physicsResults.hsp) {
      physicsSection += `\n\nFormulation Hansen parameters (${physicsResults.hsp.basis} weighted): δD=${physicsResults.hsp.hansenD.toFixed(1)}, δP=${physicsResults.hsp.hansenP.toFixed(1)}, δH=${physicsResults.hsp.hansenH.toFixed(1)}`;
    }
    if (physicsResults.compatibility) {
      const c = physicsResults.compatibility;
      physicsSection += `\nCompatibility assessment: ${c.level} (score ${c.score}/100)${c.warnings.length ? `; warnings: ${c.warnings.join(" | ")}` : ""}`;
    }
  }

  return `
# Formulation Details

**Formulation Code:** ${formulation.versionCode}
**Description:** ${formulation.description || "No description"}
**Branch Type:** ${formulation.branchType}

## Components (Total: ${components.length})

${componentsList}

## Test Conditions

${testConditionsList}${physicsSection}

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
): Promise<Omit<PredictionResult, "probabilityInSpec"> & {
  physicsAgreement?: PhysicsAgreement;
  residualAdjustmentPercent?: number;
  adjustmentJustification?: string;
  memorySources?: Array<{ id: number; fact: string; confidence: number }>;
}> {
  const specContext = targetSpec
    ? `\n\nTarget Specification:\n- Min: ${targetSpec.min !== undefined ? targetSpec.min : "N/A"}\n- Max: ${targetSpec.max !== undefined ? targetSpec.max : "N/A"}\n- Unit: ${targetSpec.unit || "N/A"}`
    : "";

  const systemPrompt = `You are an expert formulation chemist with deep knowledge of material science, polymer chemistry, and predictive modeling. Your task is to predict the value of a specific property for a given formulation based on its composition, material properties, and test conditions.

You must provide:
1. A predicted value for the property
2. Uncertainty bounds (lower and upper confidence limits at 95% confidence level)
3. Feature importance scores showing which components/factors contribute most
4. Clear reasoning explaining your prediction

IMPORTANT — Computed Physics Estimates protocol:
If the context contains a "Computed Physics Estimates" section with a deterministic estimate for the requested property, that value is the ANCHOR. Your job is not to re-derive it but to judge what the ideal-mixing model misses (thickener networks, pigment-binder interactions, hydrogen bonding, synergies):
- Set physicsAgreement to "agree" if the physics estimate is sound as-is.
- Set it to "adjust_up"/"adjust_down" with residualAdjustmentPercent (a signed percentage correction to the PHYSICS value, e.g. +12 means physics × 1.12) and a concrete adjustmentJustification naming the physical effect the mixing rule ignores.
- Set it to "no_physics_available" if the section has no estimate for this property; then predictedValue is your own best estimate.
Large corrections require strong justification; corrections are clamped to the physics model's documented error band.

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
              physicsAgreement: {
                type: "string",
                enum: ["agree", "adjust_up", "adjust_down", "no_physics_available"],
                description:
                  "Whether you agree with the Computed Physics Estimate for this property, want to correct it, or no physics estimate exists",
              },
              residualAdjustmentPercent: {
                type: "number",
                description:
                  "Signed % correction to apply to the physics value (e.g. +12 = physics × 1.12). Use 0 when agreeing or when no physics estimate exists.",
              },
              adjustmentJustification: {
                type: "string",
                description:
                  "The concrete physical effect the mixing rule misses that justifies the adjustment (empty string if agreeing or no physics)",
              },
            },
            required: [
              "predictedValue",
              "unit",
              "uncertaintyLower",
              "uncertaintyUpper",
              "featureImportance",
              "reasoning",
              "physicsAgreement",
              "residualAdjustmentPercent",
              "adjustmentJustification",
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
      physicsAgreement: parsed.physicsAgreement as PhysicsAgreement | undefined,
      residualAdjustmentPercent: parsed.residualAdjustmentPercent,
      adjustmentJustification: parsed.adjustmentJustification,
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
    predictionBasis: result.predictionBasis,
    physicsValue: result.physicsValue,
    llmRawValue: result.llmRawValue,
    sigmaSource: result.sigmaSource,
    provenance: result.provenance,
    requestedBy: request.requestedBy,
    featureImportance: result.featureImportance,
  });
}
