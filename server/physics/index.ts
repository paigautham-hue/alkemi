/**
 * Extended physics orchestrator — runs the pigmented/reactive-system models
 * that need Materials-v2 inputs (function taxonomy, oil absorption,
 * equivalent weight, particle data) on top of the base mixing rules in
 * physicsModels.ts.
 *
 * Output shape matches PhysicsPredictionResult so fusion, storage, and the
 * UI handle these predictions identically to the mixing-rule ones.
 */
import type { PhysicsPredictionResult } from "../physicsModels";
import type { MaterialView } from "../services/materialResolver";
import { suspensionViscosity, particleVolumeFraction, PARTICLE_FUNCTIONS } from "./suspension";
import { computePVC } from "./pvc";
import { uvCureDepth } from "./uvCure";
import { crosslinkAnalysis } from "./crosslink";

export interface ExtendedComponent {
  massFraction: number; // 0–1
  view: MaterialView;
}

export interface TestConditionInput {
  /** Parsed from test_condition_parameters where available */
  uvDoseMjCm2?: number;
  filmThicknessUm?: number;
  temperatureC?: number;
}

export interface ExtendedPhysicsOutput {
  predictions: PhysicsPredictionResult[];
  warnings: string[];
  notes: string[];
}

/**
 * Parse the extended-physics-relevant values out of free-text test condition
 * parameters ({parameterName, parameterValue, unit} rows).
 */
export function parseConditions(parameters: Array<{ parameterName: string; parameterValue: string; unit?: string | null }>): TestConditionInput {
  const out: TestConditionInput = {};
  for (const p of parameters || []) {
    const name = p.parameterName.toLowerCase();
    const value = parseFloat(p.parameterValue);
    if (!Number.isFinite(value)) continue;
    if (/uv.?dose|dose|energy/.test(name)) out.uvDoseMjCm2 = value;
    else if (/film.?thickness|dft|coating.?thickness/.test(name)) out.filmThicknessUm = value;
    else if (/temp/.test(name)) out.temperatureC = value;
  }
  return out;
}

export function predictExtendedProperties(
  components: ExtendedComponent[],
  conditions: TestConditionInput = {}
): ExtendedPhysicsOutput {
  const predictions: PhysicsPredictionResult[] = [];
  const warnings: string[] = [];
  const notes: string[] = [];

  const simple = components.map(c => ({
    massFraction: c.massFraction,
    density: c.view.density,
    materialFunction: c.view.materialFunction,
    oilAbsorption: c.view.oilAbsorption,
  }));

  // --- Suspension viscosity (Krieger-Dougherty) for particle-loaded systems ---
  const pvf = particleVolumeFraction(simple);
  const hasParticles = components.some(
    c => c.view.materialFunction && PARTICLE_FUNCTIONS.has(c.view.materialFunction)
  );
  if (hasParticles && pvf && pvf.phi > 0.01) {
    // Continuous phase viscosity: log-mix over non-particle components with viscosity
    const liquid = components.filter(
      c => !(c.view.materialFunction && PARTICLE_FUNCTIONS.has(c.view.materialFunction)) && c.view.viscosity && c.view.viscosity > 0
    );
    if (liquid.length > 0) {
      const totalLiquidMass = liquid.reduce((s, c) => s + c.massFraction, 0);
      const logEta = liquid.reduce(
        (s, c) => s + (c.massFraction / totalLiquidMass) * Math.log(c.view.viscosity!),
        0
      );
      const mediumViscosity = Math.exp(logEta);

      const susp = suspensionViscosity({
        mediumViscosity,
        particleVolumeFraction: pvf.phi,
      });
      if (susp) {
        warnings.push(...susp.warnings);
        if (Number.isFinite(susp.viscosity)) {
          predictions.push({
            property: "viscosity",
            value: Math.round(susp.viscosity * 10) / 10,
            unit: "mPa·s at 25°C",
            method: `Krieger–Dougherty (φ=${(pvf.phi * 100).toFixed(1)}%, φmax=64%) over log-mixed vehicle`,
            confidence: pvf.coverage > 0.9 ? "medium" : "low",
            notes: `Vehicle viscosity ${mediumViscosity.toFixed(1)} mPa·s; relative viscosity ×${susp.relativeViscosity.toFixed(2)}`,
          });
        }
      }
    } else {
      notes.push("Particles present but no vehicle viscosity data — suspension viscosity not computable");
    }
  }

  // --- PVC / CPVC ---
  const pvc = computePVC(simple);
  if (pvc) {
    warnings.push(...pvc.warnings);
    notes.push(...pvc.notes);
    predictions.push({
      property: "pigment_volume_concentration",
      value: Math.round(pvc.pvc * 1000) / 10, // %
      unit: "%",
      method: "PVC from component volume fractions",
      confidence: "high",
      notes: pvc.cpvc
        ? `CPVC ${(pvc.cpvc * 100).toFixed(1)}% (from oil absorption); Λ=${pvc.lambda!.toFixed(2)} → ${pvc.regime}`
        : "CPVC unavailable (no oil-absorption data)",
    });
  }

  // --- Crosslink / reactive analysis ---
  const reactive = components
    .filter(c => c.view.equivalentWeight || (c.view.functionality && c.view.molecularWeight))
    .map(c => ({
      massFraction: c.massFraction,
      equivalentWeight: c.view.equivalentWeight,
      functionality: c.view.functionality,
      molecularWeight: c.view.molecularWeight,
    }));
  if (reactive.length > 0) {
    // Density for shrinkage: harmonic mix over components with density
    const withDensity = components.filter(c => c.view.density && c.view.density > 0);
    let density: number | undefined;
    if (withDensity.length > 0) {
      const totalMass = withDensity.reduce((s, c) => s + c.massFraction, 0);
      const specVol = withDensity.reduce((s, c) => s + c.massFraction / totalMass / c.view.density!, 0);
      density = specVol > 0 ? 1 / specVol : undefined;
    }
    const xl = crosslinkAnalysis(reactive, density);
    if (xl) {
      warnings.push(...xl.warnings);
      notes.push(...xl.notes);
      predictions.push({
        property: "reactive_group_concentration",
        value: Math.round(xl.reactiveGroupConcentration * 100) / 100,
        unit: "mol C=C/kg",
        method: "Σ wᵢ/EWᵢ over reactive components",
        confidence: "high",
        notes: [
          xl.weightAverageFunctionality ? `f̄w=${xl.weightAverageFunctionality.toFixed(2)}` : null,
          xl.gelPointConversion ? `gel point at ${(xl.gelPointConversion * 100).toFixed(0)}% conversion (Flory–Stockmayer)` : null,
          xl.shrinkagePercent ? `est. shrinkage ${xl.shrinkagePercent.toFixed(1)}% at full conversion` : null,
        ]
          .filter(Boolean)
          .join("; "),
      });
    }
  }

  // --- UV cure depth (needs dose + thickness from test conditions) ---
  if (conditions.uvDoseMjCm2 && conditions.filmThicknessUm) {
    const piMass = components
      .filter(c => c.view.materialFunction === "photoinitiator")
      .reduce((s, c) => s + c.massFraction, 0);
    const phi = pvf?.phi ?? 0;

    const cure = uvCureDepth({
      doseMjCm2: conditions.uvDoseMjCm2,
      photoinitiatorMassFraction: piMass,
      pigmentVolumeFraction: phi,
      filmThicknessUm: conditions.filmThicknessUm,
    });
    if (cure) {
      warnings.push(...cure.warnings);
      predictions.push({
        property: "cure_depth",
        value: Math.round(cure.cureDepthUm * 10) / 10,
        unit: "µm",
        method: "Jacobs working curve (screening model)",
        confidence: "low", // screening model until calibrated against working curves
        notes: `Penetration depth ${cure.penetrationDepthUm.toFixed(1)} µm; ${cure.throughCure ? "through-cure OK" : "UNDER-CURE RISK"} at ${conditions.filmThicknessUm} µm film`,
      });
    }
  }

  return { predictions, warnings, notes };
}
