/**
 * Crosslink density and gelation for reactive (UV/thermoset) systems.
 *
 * C=C (or reactive-group) concentration:
 *   [C=C] = Σ wᵢ / EWᵢ            (mol/kg, from equivalent weight)
 *         or Σ wᵢ·fᵢ / MWᵢ · 1000 (from functionality + MW)
 *
 * Flory–Stockmayer gel-point conversion for a homogeneous mixture:
 *   p_gel = 1 / (f_w − 1),  f_w = weight-average functionality of reactive species
 *
 * Volumetric shrinkage estimate for acrylates: ~23 cm³ per mol of reacted
 * C=C (ΔV ≈ 23·[C=C]·ρ/1000 %, at full conversion).
 *
 * Higher [C=C] → faster cure, higher hardness/crosslink density, but more
 * shrinkage (adhesion stress) and brittleness — the core UV formulation
 * trade-off.
 */

export interface ReactiveComponent {
  massFraction: number; // 0–1 of total formulation
  /** g/eq of reactive group (acrylate EW); preferred input */
  equivalentWeight?: number;
  /** alternative: functionality + molecular weight */
  functionality?: number;
  molecularWeight?: number; // g/mol
}

export interface CrosslinkResult {
  /** mol reactive groups per kg of formulation */
  reactiveGroupConcentration: number;
  /** weight-average functionality of the reactive fraction */
  weightAverageFunctionality: number | null;
  /** Flory–Stockmayer critical conversion (null if f_w ≤ 1, i.e. no network) */
  gelPointConversion: number | null;
  /** % volumetric shrinkage at full conversion (needs density) */
  shrinkagePercent: number | null;
  reactiveMassFraction: number;
  warnings: string[];
  notes: string[];
}

/** Molar volume shrinkage per reacted acrylate C=C, cm³/mol */
const SHRINKAGE_PER_MOL_CC = 23;

export function crosslinkAnalysis(
  components: ReactiveComponent[],
  formulationDensity?: number // g/cm³, for shrinkage
): CrosslinkResult | null {
  const reactive = components.filter(
    c =>
      (c.equivalentWeight && c.equivalentWeight > 0) ||
      (c.functionality && c.functionality > 0 && c.molecularWeight && c.molecularWeight > 0)
  );
  if (reactive.length === 0) return null;

  const warnings: string[] = [];
  const notes: string[] = [];

  // mol of reactive groups per kg formulation
  let molPerKg = 0;
  let fwNumerator = 0; // Σ wᵢ·fᵢ (for weight-average functionality)
  let fwKnownMass = 0;
  for (const c of reactive) {
    let eq: number;
    if (c.equivalentWeight && c.equivalentWeight > 0) {
      eq = c.equivalentWeight;
    } else {
      eq = c.molecularWeight! / c.functionality!;
    }
    molPerKg += (c.massFraction * 1000) / eq;

    if (c.functionality && c.functionality > 0) {
      fwNumerator += c.massFraction * c.functionality;
      fwKnownMass += c.massFraction;
    }
  }

  const reactiveMassFraction = reactive.reduce((s, c) => s + c.massFraction, 0);

  const fw = fwKnownMass > 0 ? fwNumerator / fwKnownMass : null;
  let gelPoint: number | null = null;
  if (fw !== null) {
    if (fw > 1) {
      gelPoint = 1 / (fw - 1);
      if (gelPoint >= 1) {
        gelPoint = null;
        warnings.push(
          `Weight-average functionality ${fw.toFixed(2)} ≤ 2 — system cannot form a network (only chain extension)`
        );
      }
    } else {
      warnings.push("Weight-average functionality ≤ 1 — no polymerization network possible");
    }
  } else {
    notes.push("Functionality unknown for all reactive components — gel point not computable");
  }

  let shrinkage: number | null = null;
  if (formulationDensity && formulationDensity > 0) {
    // ΔV% = [C=C](mol/kg) · 23(cm³/mol) · ρ(g/cm³) / 1000(g/kg) · 100
    shrinkage = ((molPerKg * SHRINKAGE_PER_MOL_CC * formulationDensity) / 1000) * 100;
    if (shrinkage > 12) {
      warnings.push(
        `Predicted shrinkage ${shrinkage.toFixed(1)}% at full conversion is high — expect adhesion stress/curl; consider higher-EW oligomers or monofunctional diluent`
      );
    }
  } else {
    notes.push("Formulation density unknown — shrinkage not computable");
  }

  if (molPerKg > 6) {
    warnings.push(
      `Reactive group concentration ${molPerKg.toFixed(1)} mol/kg is very high — fast, hard, brittle cure profile`
    );
  }

  return {
    reactiveGroupConcentration: molPerKg,
    weightAverageFunctionality: fw,
    gelPointConversion: gelPoint,
    shrinkagePercent: shrinkage,
    reactiveMassFraction,
    warnings,
    notes,
  };
}
