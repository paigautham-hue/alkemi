/**
 * Emulsion physics — HLB matching and Stokes creaming/settling.
 *
 * HLB (spec §20.4): the emulsifier blend's weighted HLB should match the
 * oil phase's required HLB (±1.5 typical window) for a stable O/W emulsion.
 *   blend HLB = Σ(wᵢ·HLBᵢ) / Σwᵢ  over emulsifiers
 *
 * Stokes (spec §20.5): creaming/settling velocity of droplets/particles
 *   v = 2 r² Δρ g / (9 η)
 * Positive v = settling (denser dispersed phase), negative = creaming.
 */

export interface HlbInput {
  emulsifiers: Array<{ name: string; massFraction: number; hlb: number }>;
  /** Required HLB of the oil phase (weighted by oil mass) if known */
  requiredHlb?: number;
  tolerance?: number; // default ±1.5
}

export interface HlbResult {
  blendHlb: number;
  requiredHlb?: number;
  deltaHlb?: number;
  matched?: boolean;
  emulsionTypeHint: "w/o" | "o/w" | "solubilizer";
  warnings: string[];
}

export function hlbMatch(input: HlbInput): HlbResult | null {
  const withHlb = input.emulsifiers.filter(e => Number.isFinite(e.hlb) && e.massFraction > 0);
  if (withHlb.length === 0) return null;

  const totalMass = withHlb.reduce((s, e) => s + e.massFraction, 0);
  const blendHlb = withHlb.reduce((s, e) => s + e.massFraction * e.hlb, 0) / totalMass;

  const warnings: string[] = [];
  const emulsionTypeHint = blendHlb < 7 ? "w/o" : blendHlb <= 14 ? "o/w" : "solubilizer";

  let deltaHlb: number | undefined;
  let matched: boolean | undefined;
  if (input.requiredHlb !== undefined) {
    deltaHlb = blendHlb - input.requiredHlb;
    const tol = input.tolerance ?? 1.5;
    matched = Math.abs(deltaHlb) <= tol;
    if (!matched) {
      warnings.push(
        `Emulsifier blend HLB ${blendHlb.toFixed(1)} vs required ${input.requiredHlb.toFixed(1)} (Δ=${deltaHlb.toFixed(1)}, window ±${tol}) — emulsion stability risk; adjust the ${deltaHlb > 0 ? "low" : "high"}-HLB emulsifier ratio`
      );
    }
  }

  return {
    blendHlb: Math.round(blendHlb * 10) / 10,
    requiredHlb: input.requiredHlb,
    deltaHlb: deltaHlb !== undefined ? Math.round(deltaHlb * 10) / 10 : undefined,
    matched,
    emulsionTypeHint,
    warnings,
  };
}

export interface StokesInput {
  /** droplet/particle radius, µm */
  radiusUm: number;
  /** dispersed-phase density, g/cm³ */
  dispersedDensity: number;
  /** continuous-phase density, g/cm³ */
  continuousDensity: number;
  /** continuous-phase viscosity, mPa·s */
  continuousViscosity: number;
}

export interface StokesResult {
  /** velocity magnitude, µm/day; direction in `mode` */
  velocityUmPerDay: number;
  mode: "settling" | "creaming" | "neutral";
  /** time to move 1 cm, days (∞-ish when neutral) */
  daysPerCm: number | null;
  warnings: string[];
}

const G = 9.81; // m/s²

export function stokesVelocity(input: StokesInput): StokesResult | null {
  const { radiusUm, dispersedDensity, continuousDensity, continuousViscosity } = input;
  if (!(radiusUm > 0) || !(continuousViscosity > 0) || !(dispersedDensity > 0) || !(continuousDensity > 0)) {
    return null;
  }

  const r = radiusUm * 1e-6; // m
  const deltaRho = (dispersedDensity - continuousDensity) * 1000; // kg/m³
  const eta = continuousViscosity * 1e-3; // Pa·s

  const v = (2 * r * r * deltaRho * G) / (9 * eta); // m/s, + = settling
  const velocityUmPerDay = Math.abs(v) * 1e6 * 86400;

  const mode: StokesResult["mode"] =
    Math.abs(deltaRho) < 1 ? "neutral" : v > 0 ? "settling" : "creaming";

  const warnings: string[] = [];
  const daysPerCm = velocityUmPerDay > 0 ? 10000 / velocityUmPerDay : null;
  if (daysPerCm !== null && daysPerCm < 30 && mode !== "neutral") {
    warnings.push(
      `Stokes ${mode} ≈ ${velocityUmPerDay.toFixed(0)} µm/day (1 cm in ${daysPerCm.toFixed(0)} days) — shelf-stability risk; reduce droplet size, thicken the continuous phase, or density-match`
    );
  }

  return {
    velocityUmPerDay: Math.round(velocityUmPerDay * 10) / 10,
    mode,
    daysPerCm: daysPerCm !== null ? Math.round(daysPerCm * 10) / 10 : null,
    warnings,
  };
}
