/**
 * UV cure depth — Jacobs working-curve model.
 *
 *   C_d = D_p · ln(E₀ / E_c)
 *
 *   C_d : cure depth (µm)
 *   D_p : penetration depth of the resin at the working wavelength (µm)
 *   E₀  : surface dose (mJ/cm²)
 *   E_c : critical dose to gel (mJ/cm²)
 *
 * D_p is attenuation-limited: 1/D_p ∝ 2.303·(ε_PI·[PI] + α_pigment).
 * We model it from a clear-resin penetration depth reduced by photoinitiator
 * loading and pigment screening. TiO₂ in particular is a strong UV screen —
 * the classic through-cure failure in white UV systems.
 *
 * This is a screening model: it flags under-cure risk and PI/pigment
 * mismatches; absolute accuracy needs measured working curves (Phase 4 will
 * calibrate against trial data).
 */

export interface UvCureInput {
  /** Surface UV dose, mJ/cm² */
  doseMjCm2: number;
  /** Critical gel dose, mJ/cm² (typical free-radical acrylate: 5–20) */
  criticalDoseMjCm2?: number;
  /** Clear-resin penetration depth at working wavelength, µm (typical 100–600) */
  clearPenetrationDepthUm?: number;
  /** Photoinitiator mass fraction of formulation (0–1) */
  photoinitiatorMassFraction: number;
  /** Pigment volume fraction (0–1) */
  pigmentVolumeFraction: number;
  /** Pigment UV screening strength: TiO2 ≈ 25, carbon black ≈ 40, organics ≈ 8 */
  pigmentScreeningFactor?: number;
  /** Target film thickness, µm */
  filmThicknessUm: number;
}

export interface UvCureResult {
  cureDepthUm: number;
  penetrationDepthUm: number;
  throughCure: boolean;
  cureDepthRatio: number; // cureDepth / filmThickness
  warnings: string[];
  method: "jacobs_working_curve";
}

export function uvCureDepth(input: UvCureInput): UvCureResult | null {
  const {
    doseMjCm2,
    photoinitiatorMassFraction: pi,
    pigmentVolumeFraction: phi,
    filmThicknessUm,
  } = input;
  const ec = input.criticalDoseMjCm2 ?? 12;
  const dpClear = input.clearPenetrationDepthUm ?? 300;
  const screen = input.pigmentScreeningFactor ?? 25;

  if (!Number.isFinite(doseMjCm2) || doseMjCm2 <= 0) return null;
  if (!Number.isFinite(filmThicknessUm) || filmThicknessUm <= 0) return null;

  const warnings: string[] = [];

  // Attenuation: PI absorbs (that's its job — but over-loading self-screens),
  // pigment scatters/absorbs. 1/Dp scales with absorber concentration.
  // Baseline clear resin has its own attenuation 1/dpClear at reference PI
  // loading of 3 wt%.
  const piRef = 0.03;
  const piFactor = pi > 0 ? pi / piRef : 0.3; // no PI → weak inherent absorption but no cure either
  const attenuation = (1 / dpClear) * piFactor + (screen / dpClear) * (phi / 0.1); // φ=10% pigment scales screen× baseline
  const dp = 1 / Math.max(attenuation, 1e-6);

  if (doseMjCm2 <= ec) {
    return {
      cureDepthUm: 0,
      penetrationDepthUm: dp,
      throughCure: false,
      cureDepthRatio: 0,
      warnings: [`Surface dose ${doseMjCm2} mJ/cm² ≤ critical gel dose ${ec} mJ/cm² — no cure`],
      method: "jacobs_working_curve",
    };
  }

  const cureDepth = dp * Math.log(doseMjCm2 / ec);
  const ratio = cureDepth / filmThicknessUm;
  const throughCure = ratio >= 1;

  if (!throughCure) {
    warnings.push(
      `Predicted cure depth ${cureDepth.toFixed(0)} µm < film thickness ${filmThicknessUm} µm — through-cure failure risk${phi > 0.05 ? " (pigment UV screening is the dominant factor)" : ""}`
    );
  }
  if (pi === 0) {
    warnings.push("No photoinitiator in formulation — free-radical UV cure is not possible");
  }
  if (pi > 0.06) {
    warnings.push(
      `Photoinitiator loading ${(pi * 100).toFixed(1)}% is high — surface over-absorption self-screens depth cure and raises migration/cost`
    );
  }

  return {
    cureDepthUm: cureDepth,
    penetrationDepthUm: dp,
    throughCure,
    cureDepthRatio: ratio,
    warnings,
    method: "jacobs_working_curve",
  };
}
