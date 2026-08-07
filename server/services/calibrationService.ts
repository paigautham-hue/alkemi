/**
 * Calibration Service — the single source of σ (prediction uncertainty).
 *
 * Replaces the former fabricated σ, which was reverse-engineered from
 * whatever interval the LLM felt like emitting ((upper−lower)/3.92).
 *
 * Maturity ladder:
 * - COLD START (now): σ from documented physics model-error bands when the
 *   prediction is physics-anchored; for LLM-based predictions, the LLM's own
 *   interval is honored but floor-widened to a minimum ±25% so intervals are
 *   never overconfident. Every σ carries its source label.
 * - FEW/MANY TRIALS (Phase 4): split-conformal quantiles on empirical
 *   residuals per (property, domain, basis) from prediction_residuals,
 *   blending toward pure empirical intervals as n grows.
 */
import type { PredictionBasis } from "../prediction/fusion";
import { PHYSICS_MODEL_BANDS, matchPhysicsProperty } from "../prediction/fusion";

export type SigmaSource =
  | "physics_band"        // documented model error band of the physics predictor
  | "llm_heuristic"       // LLM-asserted interval, floor-widened; NOT empirically calibrated
  | "conformal";          // empirical residual quantiles (Phase 4)

export interface SigmaResult {
  sigma: number;
  sigmaSource: SigmaSource;
  /** 95% half-width used to derive sigma (for display) */
  halfWidth95: number;
  note: string;
}

/** Minimum relative 95% half-width for uncalibrated LLM intervals */
const LLM_INTERVAL_FLOOR_REL = 0.25;

const Z_95 = 1.96;

export interface GetSigmaParams {
  propertyName: string;
  predictedValue: number;
  basis: PredictionBasis;
  /** LLM-asserted 95% bounds, used (floored) for LLM-based predictions */
  llmUncertaintyLower?: number;
  llmUncertaintyUpper?: number;
}

export function getSigma(params: GetSigmaParams): SigmaResult {
  const { propertyName, predictedValue, basis } = params;

  if (basis === "physics_anchored") {
    const canonical = matchPhysicsProperty(propertyName);
    const band = canonical ? PHYSICS_MODEL_BANDS[canonical] : undefined;
    if (band) {
      const halfWidth = band.abs !== undefined ? band.abs : Math.abs(predictedValue) * (band.rel ?? 0.1);
      return {
        sigma: halfWidth / Z_95,
        sigmaSource: "physics_band",
        halfWidth95: halfWidth,
        note: `Documented model error band for ${canonical}: ±${band.abs !== undefined ? `${band.abs} (absolute)` : `${((band.rel ?? 0) * 100).toFixed(0)}%`}`,
      };
    }
  }

  // LLM-based prediction: honor the LLM interval but never allow it to be
  // narrower than the floor. An uncalibrated narrow interval is worse than
  // an honest wide one.
  const llmHalfWidth =
    params.llmUncertaintyLower !== undefined && params.llmUncertaintyUpper !== undefined
      ? Math.abs(params.llmUncertaintyUpper - params.llmUncertaintyLower) / 2
      : 0;
  const floorHalfWidth = Math.abs(predictedValue) * LLM_INTERVAL_FLOOR_REL;
  const halfWidth = Math.max(llmHalfWidth, floorHalfWidth);

  return {
    sigma: halfWidth / Z_95,
    sigmaSource: "llm_heuristic",
    halfWidth95: halfWidth,
    note:
      halfWidth === floorHalfWidth && llmHalfWidth < floorHalfWidth
        ? `LLM interval widened to the ±${(LLM_INTERVAL_FLOOR_REL * 100).toFixed(0)}% floor — no empirical calibration exists for this property yet`
        : "LLM-asserted interval — no empirical calibration exists for this property yet",
  };
}
