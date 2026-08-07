/**
 * Suspension rheology — viscosity of particle-filled systems.
 *
 * The log-mixing rule only applies to miscible liquids. Pigmented/filled
 * systems (most of coatings and inks) need particle-loading models:
 *
 * - Einstein (dilute, φ < 0.05):        η = η₀(1 + 2.5φ)
 * - Mooney (moderate):                  η = η₀·exp(2.5φ / (1 − φ/φmax))
 * - Krieger–Dougherty (general):        η = η₀(1 − φ/φmax)^(−[η]·φmax)
 *
 * φ    = total particle volume fraction
 * φmax = maximum packing fraction (~0.64 random close packing for
 *        monodisperse spheres; higher for broad PSD, lower for flocculated
 *        or high-aspect particles)
 * [η]  = intrinsic viscosity (2.5 for rigid spheres)
 */

export interface SuspensionInput {
  /** Continuous-phase (vehicle) viscosity, mPa·s */
  mediumViscosity: number;
  /** Total particle volume fraction (0–1) */
  particleVolumeFraction: number;
  /** Maximum packing fraction; default 0.64 (random close packing) */
  phiMax?: number;
  /** Intrinsic viscosity; default 2.5 (rigid spheres) */
  intrinsicViscosity?: number;
}

export interface SuspensionResult {
  viscosity: number; // mPa·s
  relativeViscosity: number;
  method: "einstein" | "krieger_dougherty";
  phi: number;
  phiMax: number;
  warnings: string[];
}

export function suspensionViscosity(input: SuspensionInput): SuspensionResult | null {
  const { mediumViscosity } = input;
  const phi = input.particleVolumeFraction;
  const phiMax = input.phiMax ?? 0.64;
  const intrinsic = input.intrinsicViscosity ?? 2.5;

  if (!Number.isFinite(mediumViscosity) || mediumViscosity <= 0) return null;
  if (!Number.isFinite(phi) || phi < 0) return null;

  const warnings: string[] = [];

  if (phi >= phiMax) {
    // At/above maximum packing the suspension is not a liquid
    return {
      viscosity: Infinity,
      relativeViscosity: Infinity,
      method: "krieger_dougherty",
      phi,
      phiMax,
      warnings: [
        `Particle volume fraction ${(phi * 100).toFixed(1)}% ≥ maximum packing ${(phiMax * 100).toFixed(1)}% — system is above the packing limit and will not flow`,
      ],
    };
  }

  if (phi < 0.05) {
    const relative = 1 + intrinsic * phi;
    return {
      viscosity: mediumViscosity * relative,
      relativeViscosity: relative,
      method: "einstein",
      phi,
      phiMax,
      warnings,
    };
  }

  const relative = Math.pow(1 - phi / phiMax, -intrinsic * phiMax);
  if (phi / phiMax > 0.9) {
    warnings.push(
      `φ/φmax = ${(phi / phiMax).toFixed(2)} — close to the packing limit; prediction highly sensitive to φmax and PSD`
    );
  }

  return {
    viscosity: mediumViscosity * relative,
    relativeViscosity: relative,
    method: "krieger_dougherty",
    phi,
    phiMax,
    warnings,
  };
}

/**
 * Compute particle volume fraction from component weight fractions.
 * Particles = components whose materialFunction marks them as solid
 * dispersed phase (pigment, filler_extender, opacifier, matting_agent).
 */
export const PARTICLE_FUNCTIONS = new Set(["pigment", "filler_extender", "opacifier", "matting_agent"]);

export function particleVolumeFraction(
  components: Array<{ massFraction: number; density?: number; materialFunction?: string | null }>
): { phi: number; coverage: number } | null {
  // All components need density to convert to volume
  const withDensity = components.filter(c => c.density && c.density > 0);
  if (withDensity.length === 0) return null;
  const coverage = withDensity.reduce((s, c) => s + c.massFraction, 0);

  const totalVolume = withDensity.reduce((s, c) => s + c.massFraction / c.density!, 0);
  if (totalVolume <= 0) return null;
  const particleVolume = withDensity
    .filter(c => c.materialFunction && PARTICLE_FUNCTIONS.has(c.materialFunction))
    .reduce((s, c) => s + c.massFraction / c.density!, 0);

  return { phi: particleVolume / totalVolume, coverage };
}
