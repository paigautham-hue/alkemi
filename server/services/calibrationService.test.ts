/**
 * Calibration service — σ source tests
 */
import { describe, it, expect } from "vitest";
import { getSigma } from "./calibrationService";

describe("getSigma", () => {
  it("physics_anchored viscosity uses the ±35% model band", () => {
    const result = getSigma({
      propertyName: "viscosity",
      predictedValue: 1000,
      basis: "physics_anchored",
    });
    expect(result.sigmaSource).toBe("physics_band");
    expect(result.halfWidth95).toBeCloseTo(350, 6);
    expect(result.sigma).toBeCloseTo(350 / 1.96, 4);
  });

  it("physics_anchored Tg uses the absolute ±8°C band (not relative)", () => {
    // Near 0°C a relative band would collapse to nothing — must be absolute
    const result = getSigma({
      propertyName: "glass transition temperature",
      predictedValue: 2,
      basis: "physics_anchored",
    });
    expect(result.sigmaSource).toBe("physics_band");
    expect(result.halfWidth95).toBe(8);
  });

  it("llm_only floors narrow LLM intervals at ±25%", () => {
    const result = getSigma({
      propertyName: "gloss",
      predictedValue: 100,
      basis: "llm_only",
      llmUncertaintyLower: 98,
      llmUncertaintyUpper: 102, // ±2% — overconfident
    });
    expect(result.sigmaSource).toBe("llm_heuristic");
    expect(result.halfWidth95).toBeCloseTo(25, 6);
    expect(result.note).toContain("floor");
  });

  it("llm_only keeps LLM intervals wider than the floor", () => {
    const result = getSigma({
      propertyName: "gloss",
      predictedValue: 100,
      basis: "llm_only",
      llmUncertaintyLower: 60,
      llmUncertaintyUpper: 140, // ±40%
    });
    expect(result.halfWidth95).toBeCloseTo(40, 6);
    expect(result.sigmaSource).toBe("llm_heuristic");
  });

  it("llm_physics_informed is treated as uncalibrated LLM output", () => {
    const result = getSigma({
      propertyName: "viscosity",
      predictedValue: 1000,
      basis: "llm_physics_informed",
      llmUncertaintyLower: 900,
      llmUncertaintyUpper: 1100,
    });
    expect(result.sigmaSource).toBe("llm_heuristic");
    // floor: 25% of 1000 = 250 > llm half-width 100
    expect(result.halfWidth95).toBeCloseTo(250, 6);
  });
});
