/**
 * Pigmented-system physics — validation against hand-computed and
 * literature values.
 */
import { describe, it, expect } from "vitest";
import { suspensionViscosity, particleVolumeFraction } from "./suspension";
import { computePVC } from "./pvc";
import { uvCureDepth } from "./uvCure";
import { crosslinkAnalysis } from "./crosslink";

describe("suspensionViscosity", () => {
  it("Einstein regime for dilute suspensions (φ=0.02)", () => {
    const r = suspensionViscosity({ mediumViscosity: 100, particleVolumeFraction: 0.02 });
    expect(r!.method).toBe("einstein");
    expect(r!.relativeViscosity).toBeCloseTo(1.05, 4); // 1 + 2.5·0.02
  });

  it("Krieger-Dougherty at φ=0.3, φmax=0.64: ηr = (1−0.46875)^(−1.6) ≈ 2.75", () => {
    const r = suspensionViscosity({ mediumViscosity: 100, particleVolumeFraction: 0.3 });
    expect(r!.method).toBe("krieger_dougherty");
    // (1 − 0.3/0.64)^(−2.5·0.64) = (0.53125)^(−1.6)
    const expected = Math.pow(0.53125, -1.6);
    expect(r!.relativeViscosity).toBeCloseTo(expected, 4);
    expect(r!.viscosity).toBeCloseTo(100 * expected, 2);
  });

  it("diverges at maximum packing", () => {
    const r = suspensionViscosity({ mediumViscosity: 100, particleVolumeFraction: 0.64 });
    expect(r!.viscosity).toBe(Infinity);
    expect(r!.warnings[0]).toContain("packing");
  });

  it("particleVolumeFraction: 20wt% TiO2 in 80wt% vehicle", () => {
    const result = particleVolumeFraction([
      { massFraction: 0.2, density: 4.23, materialFunction: "pigment" },
      { massFraction: 0.8, density: 1.1, materialFunction: "binder" },
    ]);
    // V_p = .2/4.23 = 0.047281; V_b = .8/1.1 = 0.727273; φ = 0.06105
    expect(result!.phi).toBeCloseTo(0.0611, 3);
  });
});

describe("computePVC", () => {
  it("computes PVC and CPVC for a TiO2/binder paint", () => {
    // TiO2 R-706-class: ρ=4.0, OA≈14
    const r = computePVC([
      { massFraction: 0.25, density: 4.0, materialFunction: "pigment", oilAbsorption: 14 },
      { massFraction: 0.35, density: 1.1, materialFunction: "binder" },
      { massFraction: 0.4, density: 0.9, materialFunction: "solvent" },
    ]);
    expect(r).not.toBeNull();
    // V_pig = .25/4 = 0.0625; V_bind = .35/1.1 = 0.31818; PVC = 0.1642
    expect(r!.pvc).toBeCloseTo(0.1642, 3);
    // CPVC = (100/4)/((100/4) + 14/0.935) = 25/(25+14.973) = 0.6254
    expect(r!.cpvc).toBeCloseTo(0.6254, 3);
    expect(r!.regime).toBe("binder_rich");
  });

  it("flags above-CPVC formulations", () => {
    const r = computePVC([
      { massFraction: 0.6, density: 2.7, materialFunction: "filler_extender", oilAbsorption: 20 },
      { massFraction: 0.1, density: 1.1, materialFunction: "binder" },
      { massFraction: 0.3, density: 1.0, materialFunction: "solvent" },
    ]);
    expect(r!.lambda).toBeGreaterThan(1.05);
    expect(r!.regime).toBe("above_cpvc");
    expect(r!.warnings[0]).toContain("above CPVC");
  });

  it("returns null without pigment or binder", () => {
    expect(computePVC([{ massFraction: 1, density: 1, materialFunction: "solvent" }])).toBeNull();
  });
});

describe("uvCureDepth (Jacobs)", () => {
  it("clear coat cures through at reasonable dose", () => {
    const r = uvCureDepth({
      doseMjCm2: 200,
      photoinitiatorMassFraction: 0.03,
      pigmentVolumeFraction: 0,
      filmThicknessUm: 50,
    });
    // Dp = 300µm (clear, ref PI); Cd = 300·ln(200/12) ≈ 844µm >> 50µm
    expect(r!.throughCure).toBe(true);
    expect(r!.cureDepthUm).toBeCloseTo(300 * Math.log(200 / 12), 0);
  });

  it("TiO2-pigmented white flags through-cure failure", () => {
    const r = uvCureDepth({
      doseMjCm2: 200,
      photoinitiatorMassFraction: 0.03,
      pigmentVolumeFraction: 0.15,
      pigmentScreeningFactor: 25,
      filmThicknessUm: 50,
    });
    // attenuation = 1/300 + (25/300)(0.15/0.1) = 0.00333+0.125 = 0.12833 → Dp≈7.8µm
    expect(r!.penetrationDepthUm).toBeLessThan(10);
    expect(r!.throughCure).toBe(false);
    expect(r!.warnings.some(w => w.includes("through-cure"))).toBe(true);
  });

  it("no cure below critical dose", () => {
    const r = uvCureDepth({
      doseMjCm2: 5,
      criticalDoseMjCm2: 12,
      photoinitiatorMassFraction: 0.03,
      pigmentVolumeFraction: 0,
      filmThicknessUm: 20,
    });
    expect(r!.cureDepthUm).toBe(0);
  });

  it("warns on zero photoinitiator", () => {
    const r = uvCureDepth({
      doseMjCm2: 200,
      photoinitiatorMassFraction: 0,
      pigmentVolumeFraction: 0,
      filmThicknessUm: 50,
    });
    expect(r!.warnings.some(w => w.includes("photoinitiator"))).toBe(true);
  });
});

describe("crosslinkAnalysis", () => {
  it("computes C=C concentration from equivalent weight", () => {
    // TPGDA: MW 300, f=2 → EW 150. 100% TPGDA → 1000/150 = 6.67 mol/kg
    const r = crosslinkAnalysis([{ massFraction: 1.0, equivalentWeight: 150, functionality: 2 }]);
    expect(r!.reactiveGroupConcentration).toBeCloseTo(6.67, 1);
    expect(r!.weightAverageFunctionality).toBe(2);
    // f=2 → p_gel = 1/(2−1) = 1 → no network before full conversion; the
    // implementation nulls it and warns (chain extension only)
    expect(r!.gelPointConversion).toBeNull();
    expect(r!.warnings.some(w => w.includes("network"))).toBe(true);
  });

  it("computes gel point for TMPTA-containing blend", () => {
    // 50% TMPTA (f=3, MW 296) + 50% TPGDA (f=2, MW 300)
    const r = crosslinkAnalysis([
      { massFraction: 0.5, functionality: 3, molecularWeight: 296 },
      { massFraction: 0.5, functionality: 2, molecularWeight: 300 },
    ]);
    // f_w = 2.5 → p_gel = 1/1.5 = 0.667
    expect(r!.weightAverageFunctionality).toBeCloseTo(2.5, 6);
    expect(r!.gelPointConversion).toBeCloseTo(0.667, 2);
  });

  it("computes shrinkage with density", () => {
    const r = crosslinkAnalysis([{ massFraction: 1.0, equivalentWeight: 150 }], 1.1);
    // 6.67 mol/kg · 23 cm³/mol · 1.1 g/cm³ / 1000 · 100 = 16.9%
    expect(r!.shrinkagePercent).toBeCloseTo(16.9, 0);
    expect(r!.warnings.some(w => w.includes("shrinkage"))).toBe(true);
  });

  it("returns null with no reactive components", () => {
    expect(crosslinkAnalysis([{ massFraction: 1.0 }])).toBeNull();
  });
});
