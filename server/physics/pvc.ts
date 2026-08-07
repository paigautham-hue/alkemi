/**
 * Pigment Volume Concentration (PVC) and Critical PVC (CPVC).
 *
 *   PVC  = V_pigment / (V_pigment + V_binder)
 *   CPVC = 1 / (1 + OA·ρ_pigment / (93.5·ρ_binder_factor))
 *
 * The classical CPVC estimate from linseed-oil absorption (OA, g oil per
 * 100 g pigment; oil density 0.935 g/cm³):
 *   CPVC = (100/ρ_pigment) / (100/ρ_pigment + OA/0.935)
 *
 * Λ = PVC/CPVC governs film morphology:
 *   Λ < 0.85 : binder-rich — glossy, low porosity, good barrier
 *   0.85–1.05: transition — properties change steeply
 *   Λ > 1.05 : above CPVC — porous film, flat sheen, poor barrier,
 *              dry hiding increases
 */

export interface PvcComponent {
  massFraction: number; // of total formulation
  density?: number; // g/cm³
  materialFunction?: string | null;
  oilAbsorption?: number; // g/100g, pigments only
}

const PIGMENT_FUNCTIONS = new Set(["pigment", "filler_extender", "opacifier", "matting_agent"]);
const BINDER_FUNCTIONS = new Set(["binder", "oligomer", "resin", "monomer_diluent", "polymer"]);

export interface PvcResult {
  pvc: number; // 0–1
  cpvc: number | null; // 0–1, null when no pigment has oil absorption data
  lambda: number | null; // PVC/CPVC
  regime: "binder_rich" | "transition" | "above_cpvc" | null;
  warnings: string[];
  notes: string[];
}

export function computePVC(components: PvcComponent[]): PvcResult | null {
  const pigments = components.filter(
    c => c.materialFunction && PIGMENT_FUNCTIONS.has(c.materialFunction) && c.density && c.density > 0
  );
  const binders = components.filter(
    c => c.materialFunction && BINDER_FUNCTIONS.has(c.materialFunction) && c.density && c.density > 0
  );

  if (pigments.length === 0 || binders.length === 0) return null;

  const vPigment = pigments.reduce((s, c) => s + c.massFraction / c.density!, 0);
  const vBinder = binders.reduce((s, c) => s + c.massFraction / c.density!, 0);
  if (vPigment + vBinder <= 0) return null;

  const pvc = vPigment / (vPigment + vBinder);

  // CPVC from oil absorption, volume-weighted over pigments that carry OA
  const withOA = pigments.filter(c => c.oilAbsorption && c.oilAbsorption > 0);
  let cpvc: number | null = null;
  const notes: string[] = [];
  if (withOA.length > 0) {
    // Weighted CPVC: for each pigment, CPVC_i = (100/ρ)/(100/ρ + OA/0.935);
    // combine by pigment volume share (approximation for blends).
    const totalV = withOA.reduce((s, c) => s + c.massFraction / c.density!, 0);
    cpvc = withOA.reduce((s, c) => {
      const vShare = c.massFraction / c.density! / totalV;
      const specVol = 100 / c.density!;
      const cpvcI = specVol / (specVol + c.oilAbsorption! / 0.935);
      return s + vShare * cpvcI;
    }, 0);
    if (withOA.length < pigments.length) {
      notes.push(
        `CPVC estimated from ${withOA.length}/${pigments.length} pigments with oil-absorption data`
      );
    }
  } else {
    notes.push("No pigment carries oil-absorption data — CPVC unavailable");
  }

  const lambda = cpvc ? pvc / cpvc : null;
  let regime: PvcResult["regime"] = null;
  const warnings: string[] = [];
  if (lambda !== null) {
    if (lambda < 0.85) regime = "binder_rich";
    else if (lambda <= 1.05) {
      regime = "transition";
      warnings.push(
        `Λ = PVC/CPVC = ${lambda.toFixed(2)} — in the CPVC transition zone; gloss, porosity and barrier properties change steeply here`
      );
    } else {
      regime = "above_cpvc";
      warnings.push(
        `Λ = PVC/CPVC = ${lambda.toFixed(2)} — above CPVC: expect porous film, low gloss, reduced barrier/corrosion protection`
      );
    }
  }

  return { pvc, cpvc, lambda, regime, warnings, notes };
}
