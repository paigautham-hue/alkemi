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
  /** enables the conformal ladder when provided */
  organizationId?: string;
  /** σ multiplier from the extrapolation detector (≥1) */
  extrapolationInflation?: number;
}

/**
 * Async σ with the full maturity ladder:
 *   n < 8   → cold-start (physics band / floored LLM interval)
 *   8–29    → conformal blend: max(empirical q95, cold-start band)
 *   n ≥ 30  → pure empirical q95 quantile (+ bias note)
 * Falls back to cold start when the DB/stats are unavailable.
 */
export async function getSigmaCalibrated(params: GetSigmaParams): Promise<SigmaResult> {
  const coldStart = getSigma(params);
  if (!params.organizationId) return inflate(coldStart, params.extrapolationInflation);

  try {
    const { getDb } = await import("../db");
    const { and, eq } = await import("drizzle-orm");
    const db = await getDb();
    if (!db) return inflate(coldStart, params.extrapolationInflation);
    const { calibrationStats } = await import("../../drizzle/schema");

    const [stats] = await db
      .select()
      .from(calibrationStats)
      .where(
        and(
          eq(calibrationStats.organizationId, params.organizationId),
          eq(calibrationStats.propertyName, params.propertyName.toLowerCase()),
          eq(calibrationStats.predictionBasis, params.basis)
        )
      );

    if (!stats || stats.n < 8 || !stats.q95AbsRel) {
      return inflate(coldStart, params.extrapolationInflation);
    }

    const q95 = parseFloat(String(stats.q95AbsRel));
    const empiricalHalfWidth = Math.abs(params.predictedValue) * q95;
    const bias = stats.bias ? parseFloat(String(stats.bias)) : 0;

    if (stats.n < 30) {
      // Conformal blend: never narrower than the cold-start band at low n
      const halfWidth = Math.max(empiricalHalfWidth, coldStart.halfWidth95);
      return inflate(
        {
          sigma: halfWidth / Z_95,
          sigmaSource: "conformal",
          halfWidth95: halfWidth,
          note: `Conformal blend from ${stats.n} matched trials (q95 |rel residual| ${(q95 * 100).toFixed(1)}%), floored at the cold-start band`,
        },
        params.extrapolationInflation
      );
    }

    return inflate(
      {
        sigma: empiricalHalfWidth / Z_95,
        sigmaSource: "conformal",
        halfWidth95: empiricalHalfWidth,
        note: `Empirical q95 interval from ${stats.n} matched trials${Math.abs(bias) > 0.05 ? `; systematic bias ${(bias * 100).toFixed(1)}% — investigate` : ""}`,
      },
      params.extrapolationInflation
    );
  } catch (error) {
    console.warn("[Calibration] stats lookup failed, using cold start:", error);
    return inflate(coldStart, params.extrapolationInflation);
  }
}

function inflate(result: SigmaResult, factor?: number): SigmaResult {
  if (!factor || factor <= 1) return result;
  return {
    ...result,
    sigma: result.sigma * factor,
    halfWidth95: result.halfWidth95 * factor,
    note: `${result.note}; widened ×${factor.toFixed(1)} (extrapolation beyond trialed composition space)`,
  };
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
