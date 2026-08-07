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
import { hlbMatch, stokesVelocity } from "./emulsion";
import { viscosityAtTemperature } from "./thermal";

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

  // --- HLB matching (emulsion systems) ---
  const emulsifiers = components
    .filter(c => c.view.materialFunction === "surfactant_emulsifier" && c.view.hlb)
    .map(c => ({ name: c.view.name, massFraction: c.massFraction, hlb: c.view.hlb! }));
  if (emulsifiers.length > 0) {
    // Required HLB: mass-weighted over oil-phase components carrying an
    // hlb value used as required-HLB (emollient convention in the pack)
    const oils = components.filter(c => c.view.materialFunction === "emollient");
    const oilsWithReq = oils.filter(c => c.view.hlb);
    let requiredHlb: number | undefined;
    if (oilsWithReq.length > 0) {
      const totalOil = oilsWithReq.reduce((s, c) => s + c.massFraction, 0);
      requiredHlb = oilsWithReq.reduce((s, c) => s + c.massFraction * c.view.hlb!, 0) / totalOil;
    }
    const hlb = hlbMatch({ emulsifiers, requiredHlb });
    if (hlb) {
      warnings.push(...hlb.warnings);
      predictions.push({
        property: "hlb_blend",
        value: hlb.blendHlb,
        unit: "HLB",
        method: "Mass-weighted emulsifier HLB",
        confidence: "high",
        notes: `${hlb.emulsionTypeHint.toUpperCase()} system hint${hlb.requiredHlb !== undefined ? `; required HLB ${hlb.requiredHlb.toFixed(1)} (Δ=${hlb.deltaHlb})` : "; oil-phase required HLB unknown"}`,
      });
    }
  }

  // --- Stokes creaming/settling (screening; needs particle size + densities) ---
  const dispersed = components.find(
    c => c.view.materialFunction && PARTICLE_FUNCTIONS.has(c.view.materialFunction) && c.view.particleSizeD50 && c.view.density
  );
  if (dispersed) {
    const continuous = components.filter(
      c => c !== dispersed && c.view.density && c.view.viscosity
    );
    if (continuous.length > 0) {
      const totalMass = continuous.reduce((s, c) => s + c.massFraction, 0);
      const contDensity = 1 / continuous.reduce((s, c) => s + c.massFraction / totalMass / c.view.density!, 0);
      const contViscosity = Math.exp(
        continuous.reduce((s, c) => s + (c.massFraction / totalMass) * Math.log(c.view.viscosity!), 0)
      );
      const stokes = stokesVelocity({
        radiusUm: dispersed.view.particleSizeD50! / 2,
        dispersedDensity: dispersed.view.density!,
        continuousDensity: contDensity,
        continuousViscosity: contViscosity,
      });
      if (stokes) {
        warnings.push(...stokes.warnings);
        predictions.push({
          property: "stokes_velocity",
          value: stokes.velocityUmPerDay,
          unit: "µm/day",
          method: "Stokes law (screening)",
          confidence: "low",
          notes: `${stokes.mode}${stokes.daysPerCm ? `; 1 cm in ${stokes.daysPerCm} days` : ""} — ${dispersed.view.name} in vehicle (η=${contViscosity.toFixed(0)} mPa·s)`,
        });
      }
    }
  }

  // --- Viscosity at test temperature (Arrhenius/WLF) ---
  if (conditions.temperatureC !== undefined && Math.abs(conditions.temperatureC - 25) > 2) {
    const visc25 = predictions.find(p => p.property === "viscosity");
    if (visc25) {
      const tgPred = components.every(c => c.view.glassTransitionTemp === undefined)
        ? undefined
        : undefined; // formulation Tg handled upstream by Fox; conservative: Arrhenius only
      const atT = viscosityAtTemperature({
        viscosityAtRef: visc25.value,
        refTempC: 25,
        targetTempC: conditions.temperatureC,
        glassTransitionC: tgPred,
      });
      if (atT) {
        predictions.push({
          property: "viscosity_at_test_temp",
          value: atT.viscosity,
          unit: `mPa·s at ${conditions.temperatureC}°C`,
          method: atT.note,
          confidence: "medium",
          notes: `Derived from 25°C prediction ${visc25.value} mPa·s`,
        });
      }
    }
  }

  return { predictions, warnings, notes };
}
