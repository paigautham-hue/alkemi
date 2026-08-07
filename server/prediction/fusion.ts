/**
 * Prediction Fusion — arbitration between computed physics and LLM reasoning.
 *
 * Design principle ("physics anchors, LLM corrects"):
 * - Where a physics model applies with good input coverage, the physics value
 *   is the anchor and the LLM may only apply a bounded residual correction
 *   (for effects the ideal-mixing models miss: thickener networks, pigment
 *   interactions, synergies).
 * - Where physics is partial, the LLM predicts with the physics numbers in
 *   context, hard-clamped to physically possible bounds where they exist.
 * - Where no physics model exists (adhesion, gloss, sensory), the prediction
 *   is honestly labeled llm_only.
 *
 * Every fused prediction carries `basis`, both raw values, and a
 * human-readable provenance string.
 */
import type { PhysicsPredictionResult } from "../physicsModels";

export type PredictionBasis = "physics_anchored" | "llm_physics_informed" | "llm_only";

export type PhysicsAgreement = "agree" | "adjust_up" | "adjust_down" | "no_physics_available";

export interface LlmPredictionInput {
  predictedValue: number;
  physicsAgreement?: PhysicsAgreement;
  residualAdjustmentPercent?: number;
  adjustmentJustification?: string;
}

export interface HardBounds {
  min?: number;
  max?: number;
  rationale?: string;
}

export interface FusionResult {
  finalValue: number;
  basis: PredictionBasis;
  physicsValue?: number;
  physicsMethod?: string;
  llmRawValue: number;
  /** The residual correction actually applied (after clamping), in percent */
  appliedAdjustmentPercent?: number;
  /** True when the LLM asked for a larger correction than the band allows */
  adjustmentWasClamped?: boolean;
  /** True when the LLM value was clamped to hard physical bounds (branch B) */
  valueWasClamped?: boolean;
  /** Human-readable derivation for display and audit */
  provenance: string;
}

/**
 * Documented model-error bands for the physics predictors — the residual
 * correction the LLM may apply is limited to the model's own error band.
 * `rel` is a fraction of the predicted value; `abs` is in the property's unit
 * (used where relative bands are meaningless, e.g. Tg in °C near 0).
 */
export const PHYSICS_MODEL_BANDS: Record<string, { rel?: number; abs?: number }> = {
  density: { rel: 0.02 },
  viscosity: { rel: 0.35 },
  refractive_index: { rel: 0.01 },
  glass_transition_temp: { abs: 8 },
};

/**
 * Map a free-text requested property name onto the canonical key used by the
 * physics predictors. Returns null when no physics model covers the property.
 */
export function matchPhysicsProperty(requestedProperty: string): string | null {
  const name = requestedProperty.toLowerCase();
  if (/viscosity/.test(name)) return "viscosity";
  if (/density|specific gravity/.test(name)) return "density";
  if (/refractive|\bri\b/.test(name)) return "refractive_index";
  if (/glass transition|\btg\b/.test(name)) return "glass_transition_temp";
  return null;
}

function bandHalfWidth(property: string, value: number): number | null {
  const band = PHYSICS_MODEL_BANDS[property];
  if (!band) return null;
  if (band.abs !== undefined) return band.abs;
  if (band.rel !== undefined) return Math.abs(value) * band.rel;
  return null;
}

/**
 * Fuse a physics prediction (if any) with the LLM's prediction.
 *
 * @param requestedProperty the property name as requested by the user
 * @param physicsResult     the matching physics predictor output, if any
 * @param llm               the LLM's structured prediction
 * @param hardBounds        physically possible bounds (e.g. mixture density
 *                          must lie within component min/max), applied in the
 *                          llm_physics_informed branch
 */
export function fusePrediction(
  requestedProperty: string,
  physicsResult: PhysicsPredictionResult | undefined,
  llm: LlmPredictionInput,
  hardBounds?: HardBounds
): FusionResult {
  const canonical = matchPhysicsProperty(requestedProperty);

  // Branch C — no physics model for this property
  if (!canonical || !physicsResult) {
    return {
      finalValue: llm.predictedValue,
      basis: "llm_only",
      llmRawValue: llm.predictedValue,
      provenance: canonical
        ? `LLM estimate (physics model for ${canonical} lacked input data)`
        : `LLM estimate (no physics model covers "${requestedProperty}")`,
    };
  }

  const physicsValue = physicsResult.value;

  // Branch A — physics anchor with bounded LLM residual correction.
  // 'high'/'medium' confidence encodes input coverage from the predictor.
  if (physicsResult.confidence === "high" || physicsResult.confidence === "medium") {
    const half = bandHalfWidth(canonical, physicsValue);
    const maxAdjFraction = half !== null && physicsValue !== 0 ? half / Math.abs(physicsValue) : 0.1;

    const requestedAdjFraction =
      llm.physicsAgreement === "agree" || llm.physicsAgreement === undefined
        ? 0
        : (llm.residualAdjustmentPercent ?? 0) / 100;

    const clampedAdjFraction = Math.max(-maxAdjFraction, Math.min(maxAdjFraction, requestedAdjFraction));
    const finalValue = physicsValue * (1 + clampedAdjFraction);
    const wasClamped = clampedAdjFraction !== requestedAdjFraction;

    const adjPct = clampedAdjFraction * 100;
    const provenanceParts = [
      `${physicsResult.method} → ${physicsValue}`,
      adjPct !== 0
        ? `LLM residual correction ${adjPct > 0 ? "+" : ""}${adjPct.toFixed(1)}%${wasClamped ? ` (clamped to model band ±${(maxAdjFraction * 100).toFixed(0)}%)` : ""}: ${llm.adjustmentJustification || "no justification given"}`
        : "LLM agrees with physics value",
    ];

    return {
      finalValue,
      basis: "physics_anchored",
      physicsValue,
      physicsMethod: physicsResult.method,
      llmRawValue: llm.predictedValue,
      appliedAdjustmentPercent: adjPct,
      adjustmentWasClamped: wasClamped,
      provenance: provenanceParts.join("; "),
    };
  }

  // Branch B — physics exists but low confidence (poor coverage / fallback
  // basis). LLM predicts with physics in context; clamp to hard bounds.
  let finalValue = llm.predictedValue;
  let valueWasClamped = false;
  if (hardBounds) {
    if (hardBounds.min !== undefined && finalValue < hardBounds.min) {
      finalValue = hardBounds.min;
      valueWasClamped = true;
    }
    if (hardBounds.max !== undefined && finalValue > hardBounds.max) {
      finalValue = hardBounds.max;
      valueWasClamped = true;
    }
  }

  return {
    finalValue,
    basis: "llm_physics_informed",
    physicsValue,
    physicsMethod: physicsResult.method,
    llmRawValue: llm.predictedValue,
    valueWasClamped,
    provenance: valueWasClamped
      ? `LLM estimate clamped to physical bounds [${hardBounds?.min ?? "−∞"}, ${hardBounds?.max ?? "∞"}] (${hardBounds?.rationale || "component property range"}); low-confidence physics reference: ${physicsResult.method} → ${physicsValue}`
      : `LLM estimate informed by low-confidence physics reference (${physicsResult.method} → ${physicsValue})`,
  };
}

/**
 * Physically-possible bounds for a property, derived from component data.
 * Currently only density has a rigorous bound: barring strong volume
 * contraction, mixture density must lie within the component min/max range.
 */
export function computeHardBounds(
  canonicalProperty: string | null,
  componentValues: Array<number | null | undefined>
): HardBounds | undefined {
  if (canonicalProperty !== "density") return undefined;
  const values = componentValues.filter((v): v is number => typeof v === "number" && v > 0);
  if (values.length === 0) return undefined;
  return {
    min: Math.min(...values),
    max: Math.max(...values),
    rationale: "mixture density bounded by component densities (ideal mixing)",
  };
}
