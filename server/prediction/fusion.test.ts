/**
 * Prediction fusion — arbitration logic tests
 */
import { describe, it, expect } from "vitest";
import {
  fusePrediction,
  matchPhysicsProperty,
  computeHardBounds,
  PHYSICS_MODEL_BANDS,
} from "./fusion";
import type { PhysicsPredictionResult } from "../physicsModels";

function physicsResult(overrides: Partial<PhysicsPredictionResult>): PhysicsPredictionResult {
  return {
    property: "viscosity",
    value: 1000,
    unit: "mPa·s at 25°C",
    method: "Log-mixing rule (volume fraction)",
    confidence: "high",
    ...overrides,
  };
}

describe("matchPhysicsProperty", () => {
  it("maps free-text names to canonical keys", () => {
    expect(matchPhysicsProperty("Viscosity @ 25C")).toBe("viscosity");
    expect(matchPhysicsProperty("density")).toBe("density");
    expect(matchPhysicsProperty("Specific Gravity")).toBe("density");
    expect(matchPhysicsProperty("Refractive Index")).toBe("refractive_index");
    expect(matchPhysicsProperty("Glass Transition Temperature")).toBe("glass_transition_temp");
    expect(matchPhysicsProperty("Tg")).toBe("glass_transition_temp");
  });

  it("returns null for properties with no physics model", () => {
    expect(matchPhysicsProperty("gloss at 60 degrees")).toBeNull();
    expect(matchPhysicsProperty("adhesion rating")).toBeNull();
  });
});

describe("fusePrediction — physics_anchored (branch A)", () => {
  it("uses the physics value when the LLM agrees", () => {
    const result = fusePrediction("viscosity", physicsResult({ value: 1000 }), {
      predictedValue: 1500, // LLM's blind guess is ignored as the final value
      physicsAgreement: "agree",
      residualAdjustmentPercent: 0,
    });
    expect(result.basis).toBe("physics_anchored");
    expect(result.finalValue).toBe(1000);
    expect(result.llmRawValue).toBe(1500);
    expect(result.physicsValue).toBe(1000);
  });

  it("applies a bounded LLM residual correction", () => {
    const result = fusePrediction("viscosity", physicsResult({ value: 1000 }), {
      predictedValue: 1200,
      physicsAgreement: "adjust_up",
      residualAdjustmentPercent: 20, // within viscosity band ±35%
      adjustmentJustification: "associative thickener network",
    });
    expect(result.finalValue).toBeCloseTo(1200, 6);
    expect(result.appliedAdjustmentPercent).toBeCloseTo(20, 6);
    expect(result.adjustmentWasClamped).toBe(false);
    expect(result.provenance).toContain("associative thickener network");
  });

  it("clamps corrections to the model band", () => {
    const result = fusePrediction("density", physicsResult({ property: "density", value: 1.5, unit: "g/cm³", method: "Ideal mixing" }), {
      predictedValue: 2.5,
      physicsAgreement: "adjust_up",
      residualAdjustmentPercent: 50, // density band is ±2%
    });
    expect(result.finalValue).toBeCloseTo(1.5 * 1.02, 6);
    expect(result.adjustmentWasClamped).toBe(true);
  });

  it("clamps negative corrections symmetrically", () => {
    const result = fusePrediction("viscosity", physicsResult({ value: 1000 }), {
      predictedValue: 100,
      physicsAgreement: "adjust_down",
      residualAdjustmentPercent: -90, // band ±35%
    });
    expect(result.finalValue).toBeCloseTo(650, 6);
    expect(result.adjustmentWasClamped).toBe(true);
  });
});

describe("fusePrediction — llm_physics_informed (branch B)", () => {
  it("keeps the LLM value when physics confidence is low", () => {
    const result = fusePrediction(
      "viscosity",
      physicsResult({ value: 800, confidence: "low" }),
      { predictedValue: 1100, physicsAgreement: "adjust_up", residualAdjustmentPercent: 10 }
    );
    expect(result.basis).toBe("llm_physics_informed");
    expect(result.finalValue).toBe(1100);
    expect(result.physicsValue).toBe(800);
  });

  it("clamps the LLM value to hard physical bounds", () => {
    const result = fusePrediction(
      "density",
      physicsResult({ property: "density", value: 1.4, confidence: "low", unit: "g/cm³", method: "Ideal mixing" }),
      { predictedValue: 5.0 },
      { min: 0.88, max: 4.23, rationale: "component density range" }
    );
    expect(result.finalValue).toBe(4.23);
    expect(result.valueWasClamped).toBe(true);
    expect(result.provenance).toContain("component density range");
  });
});

describe("fusePrediction — llm_only (branch C)", () => {
  it("labels predictions with no physics model", () => {
    const result = fusePrediction("gloss at 60°", undefined, { predictedValue: 85 });
    expect(result.basis).toBe("llm_only");
    expect(result.finalValue).toBe(85);
    expect(result.provenance).toContain("no physics model");
  });

  it("labels physics-model-exists-but-no-data as llm_only with explanation", () => {
    const result = fusePrediction("viscosity", undefined, { predictedValue: 500 });
    expect(result.basis).toBe("llm_only");
    expect(result.provenance).toContain("lacked input data");
  });
});

describe("computeHardBounds", () => {
  it("bounds density by component min/max", () => {
    const bounds = computeHardBounds("density", [4.23, 0.88, 1.16, null, undefined]);
    expect(bounds).toEqual({
      min: 0.88,
      max: 4.23,
      rationale: expect.stringContaining("component densities"),
    });
  });

  it("returns undefined for other properties or missing data", () => {
    expect(computeHardBounds("viscosity", [1, 2])).toBeUndefined();
    expect(computeHardBounds("density", [null, undefined])).toBeUndefined();
    expect(computeHardBounds(null, [1])).toBeUndefined();
  });
});

describe("PHYSICS_MODEL_BANDS", () => {
  it("declares a band for every canonical property", () => {
    for (const prop of ["density", "viscosity", "refractive_index", "glass_transition_temp"]) {
      const band = PHYSICS_MODEL_BANDS[prop];
      expect(band, prop).toBeDefined();
      expect(band.rel !== undefined || band.abs !== undefined).toBe(true);
    }
  });
});
