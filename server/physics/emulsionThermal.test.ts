/**
 * Emulsion (HLB, Stokes) and thermal (Arrhenius/WLF) physics tests.
 */
import { describe, it, expect } from "vitest";
import { hlbMatch, stokesVelocity } from "./emulsion";
import { viscosityAtTemperature } from "./thermal";

describe("hlbMatch", () => {
  it("computes the mass-weighted blend HLB (classic Span/Tween pair)", () => {
    // 40% Span 60 (4.7) + 60% Tween 60 (14.9) → 0.4·4.7 + 0.6·14.9 = 10.82
    const r = hlbMatch({
      emulsifiers: [
        { name: "Span 60", massFraction: 0.4, hlb: 4.7 },
        { name: "Tween 60", massFraction: 0.6, hlb: 14.9 },
      ],
      requiredHlb: 10.5,
    });
    expect(r!.blendHlb).toBeCloseTo(10.8, 1);
    expect(r!.matched).toBe(true);
    expect(r!.emulsionTypeHint).toBe("o/w");
  });

  it("warns on HLB mismatch", () => {
    const r = hlbMatch({
      emulsifiers: [{ name: "Span 60", massFraction: 1, hlb: 4.7 }],
      requiredHlb: 11,
    });
    expect(r!.matched).toBe(false);
    expect(r!.warnings[0]).toContain("stability risk");
    expect(r!.emulsionTypeHint).toBe("w/o");
  });

  it("returns null with no emulsifier HLB data", () => {
    expect(hlbMatch({ emulsifiers: [] })).toBeNull();
  });
});

describe("stokesVelocity", () => {
  it("matches hand-computed settling velocity", () => {
    // r=1µm, Δρ=1000 kg/m³ (2.0 vs 1.0), η=100 mPa·s = 0.1 Pa·s
    // v = 2·(1e-6)²·1000·9.81/(9·0.1) = 2.18e-8 m/s = 21.8 nm/s... wait:
    // 2·1e-12·1000·9.81/0.9 = 2.18e-8 m/s → ×1e6 µm ×86400 s = 1883.5 µm/day
    const r = stokesVelocity({
      radiusUm: 1,
      dispersedDensity: 2.0,
      continuousDensity: 1.0,
      continuousViscosity: 100,
    });
    expect(r!.mode).toBe("settling");
    expect(r!.velocityUmPerDay).toBeCloseTo(1883.5, 0);
    expect(r!.warnings.length).toBeGreaterThan(0); // fast settling → warning
  });

  it("identifies creaming for lighter dispersed phase", () => {
    const r = stokesVelocity({
      radiusUm: 2,
      dispersedDensity: 0.92, // oil droplet
      continuousDensity: 1.0,
      continuousViscosity: 500,
    });
    expect(r!.mode).toBe("creaming");
  });

  it("small droplets in thick media are stable (no warning)", () => {
    const r = stokesVelocity({
      radiusUm: 0.15,
      dispersedDensity: 0.92,
      continuousDensity: 1.0,
      continuousViscosity: 5000,
    });
    expect(r!.warnings.length).toBe(0);
  });
});

describe("viscosityAtTemperature", () => {
  it("Arrhenius: viscosity drops with heating", () => {
    const r = viscosityAtTemperature({ viscosityAtRef: 1000, refTempC: 25, targetTempC: 60 });
    expect(r!.method).toBe("arrhenius");
    expect(r!.viscosity).toBeLessThan(1000);
    // Ea=20kJ/mol, 25→60°C: exp(2405.6·(1/333.15−1/298.15)) = exp(−0.8479) ≈ 0.4283
    expect(r!.viscosity).toBeCloseTo(1000 * Math.exp((20000 / 8.314) * (1 / 333.15 - 1 / 298.15)), 0);
  });

  it("Arrhenius: viscosity rises with cooling", () => {
    const r = viscosityAtTemperature({ viscosityAtRef: 1000, refTempC: 25, targetTempC: 5 });
    expect(r!.viscosity).toBeGreaterThan(1000);
  });

  it("switches to WLF near Tg", () => {
    const r = viscosityAtTemperature({
      viscosityAtRef: 100000,
      refTempC: 25,
      targetTempC: 60,
      glassTransitionC: 10,
    });
    expect(r!.method).toBe("wlf");
    expect(r!.viscosity).toBeLessThan(100000);
  });

  it("returns null on invalid input", () => {
    expect(viscosityAtTemperature({ viscosityAtRef: 0, refTempC: 25, targetTempC: 60 })).toBeNull();
  });
});
