/**
 * Physics models — verification against hand-computed values
 *
 * Regression coverage for:
 * 1. Density mixing used arithmetic Σ(wi·ρi) on weight fractions — wrong
 *    physics. Ideal mixing on weight fractions is harmonic: 1/ρ = Σ(wi/ρi).
 * 2. Viscosity log-mixing used weight fractions where the rule is defined on
 *    volume fractions.
 * 3. Hansen incompatibility threshold differed between physicsModels (10)
 *    and physicsValidation (8).
 */
import { describe, it, expect } from "vitest";
import {
  calculateHSPDistance,
  calculateFormulationHSP,
  predictDensity,
  predictViscosityLogMixing,
  predictRefractiveIndex,
  predictGlassTransitionTemp,
  assessCompatibility,
  HSP_INCOMPATIBILITY_THRESHOLD,
  type FormulationComponent,
  type Material,
} from "./physicsModels";
import { PhysicsModels as ValidationPhysics } from "./services/physicsValidation";

function mat(overrides: Partial<Material>): Material {
  return { id: "m", name: "Material", code: "M", ...overrides };
}

function comp(percentage: number, material: Partial<Material>): FormulationComponent {
  return { materialId: material.id ?? "m", percentage, material: mat(material) };
}

describe("predictDensity (harmonic ideal mixing)", () => {
  it("matches the hand-computed harmonic mean for a 50/50 TiO2/solvent blend", () => {
    // 50 wt% TiO2 (ρ=4.23), 50 wt% butyl acetate (ρ=0.88)
    // Harmonic: 1/ρ = 0.5/4.23 + 0.5/0.88 = 0.118203 + 0.568182 = 0.686385
    // ρ = 1.4569 g/cm³
    const result = predictDensity([
      comp(50, { id: "tio2", name: "TiO2", density: 4.23 }),
      comp(50, { id: "ba", name: "Butyl Acetate", density: 0.88 }),
    ]);
    expect(result).not.toBeNull();
    expect(result!.value).toBeCloseTo(1.457, 2);
    // The old arithmetic formula would have given 2.555 — assert we are far from it
    expect(result!.value).toBeLessThan(2.0);
  });

  it("returns the component density for a single-component system", () => {
    const result = predictDensity([comp(100, { density: 1.2 })]);
    expect(result!.value).toBeCloseTo(1.2, 3);
  });
});

describe("predictViscosityLogMixing (volume-fraction basis)", () => {
  it("uses volume fractions when densities are available", () => {
    // 50/50 by weight, ρA=1.0 η=100, ρB=2.0 η=10
    // vol: A = 0.5/1.0 = 0.5, B = 0.5/2.0 = 0.25, total 0.75 → φA=2/3, φB=1/3
    // ln η = (2/3)ln100 + (1/3)ln10 = (2/3)(4.60517) + (1/3)(2.30259) = 3.83764
    // η = e^3.83764 = 46.42
    const result = predictViscosityLogMixing([
      comp(50, { id: "a", density: 1.0, viscosity: 100 }),
      comp(50, { id: "b", density: 2.0, viscosity: 10 }),
    ]);
    expect(result).not.toBeNull();
    expect(result!.value).toBeCloseTo(46.4, 0);
    expect(result!.method).toContain("volume fraction");
    expect(result!.confidence).toBe("high");
  });

  it("falls back to mass fractions with downgraded confidence when density is missing", () => {
    // Without density: geometric mean of 100 and 10 = 31.62
    const result = predictViscosityLogMixing([
      comp(50, { id: "a", viscosity: 100 }),
      comp(50, { id: "b", viscosity: 10 }),
    ]);
    expect(result).not.toBeNull();
    expect(result!.value).toBeCloseTo(31.6, 0);
    expect(result!.method).toContain("mass-fraction approximation");
    expect(result!.confidence).toBe("medium");
  });
});

describe("calculateFormulationHSP", () => {
  it("volume-fraction weights when densities are present", () => {
    // 50/50 wt, ρA=1, ρB=2 → φA=2/3, φB=1/3
    // δD = (2/3)*16 + (1/3)*19 = 17.0
    const result = calculateFormulationHSP([
      comp(50, { id: "a", density: 1, hansenD: 16, hansenP: 8, hansenH: 6 }),
      comp(50, { id: "b", density: 2, hansenD: 19, hansenP: 11, hansenH: 3 }),
    ]);
    expect(result).not.toBeNull();
    expect(result!.basis).toBe("volume_fraction");
    expect(result!.hansenD).toBeCloseTo(17.0, 5);
    expect(result!.hansenP).toBeCloseTo(9.0, 5);
    expect(result!.hansenH).toBeCloseTo(5.0, 5);
  });

  it("falls back to mass fractions and flags the basis", () => {
    const result = calculateFormulationHSP([
      comp(50, { id: "a", hansenD: 16, hansenP: 8, hansenH: 6 }),
      comp(50, { id: "b", hansenD: 19, hansenP: 11, hansenH: 3 }),
    ]);
    expect(result!.basis).toBe("mass_fraction");
    expect(result!.hansenD).toBeCloseTo(17.5, 5);
  });
});

describe("calculateHSPDistance", () => {
  it("computes Ra with the 4x dispersion weighting", () => {
    // ΔD=2, ΔP=3, ΔH=6 → Ra = sqrt(4*4 + 9 + 36) = sqrt(61) = 7.8102
    const a = mat({ hansenD: 18, hansenP: 10, hansenH: 10 });
    const b = mat({ hansenD: 16, hansenP: 7, hansenH: 4 });
    expect(calculateHSPDistance(a, b)).toBeCloseTo(Math.sqrt(61), 4);
  });

  it("returns null when parameters are missing", () => {
    expect(calculateHSPDistance(mat({ hansenD: 18 }), mat({ hansenD: 16 }))).toBeNull();
  });
});

describe("predictRefractiveIndex (Lorentz-Lorenz)", () => {
  it("recovers a single component's RI", () => {
    const result = predictRefractiveIndex([comp(100, { refractiveIndex: 1.5, density: 1.1 })]);
    expect(result!.value).toBeCloseTo(1.5, 4);
  });
});

describe("predictGlassTransitionTemp (Fox)", () => {
  it("matches hand-computed Fox equation value", () => {
    // 50/50 of Tg 100°C (373.15K) and Tg 0°C (273.15K)
    // 1/Tg = 0.5/373.15 + 0.5/273.15 = 0.00134 + 0.0018305 = 0.0031705...
    // Tg = 315.41K = 42.26°C
    const result = predictGlassTransitionTemp([
      comp(50, { id: "a", glassTransitionTemp: 100 }),
      comp(50, { id: "b", glassTransitionTemp: 0 }),
    ]);
    expect(result!.value).toBeCloseTo(42.3, 0);
  });
});

describe("Hansen threshold unification", () => {
  it("single shared threshold of 8", () => {
    expect(HSP_INCOMPATIBILITY_THRESHOLD).toBe(8);
  });

  it("assessCompatibility warns above 8 (not the old 10)", () => {
    // ΔD=0, ΔP=9, ΔH=0 → Ra = 9 → between old (10) and new (8) thresholds
    const result = assessCompatibility([
      comp(50, { id: "a", name: "A", hansenD: 16, hansenP: 1, hansenH: 5 }),
      comp(50, { id: "b", name: "B", hansenD: 16, hansenP: 10, hansenH: 5 }),
    ]);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toContain("phase separation");
  });

  it("validation service delegates to the same canonical math", () => {
    const vp = new ValidationPhysics();
    const distance = vp.hansenDistance(
      { hansen_d: 18, hansen_p: 10, hansen_h: 10 },
      { hansen_d: 16, hansen_p: 7, hansen_h: 4 }
    );
    expect(distance).toBeCloseTo(Math.sqrt(61), 4);
  });

  it("validation viscosity delegates and honors the 50% coverage rule", () => {
    const vp = new ValidationPhysics();
    // 40% coverage → null
    expect(
      vp.logMixingViscosity([
        { materialId: "a", materialName: "A", percentage: 40, viscosity: 100 },
        { materialId: "b", materialName: "B", percentage: 60 },
      ])
    ).toBeNull();
    // 100% coverage → geometric mean (mass-fraction fallback, no densities)
    const value = vp.logMixingViscosity([
      { materialId: "a", materialName: "A", percentage: 50, viscosity: 100 },
      { materialId: "b", materialName: "B", percentage: 50, viscosity: 10 },
    ]);
    expect(value).toBeCloseTo(31.6, 0);
  });
});
