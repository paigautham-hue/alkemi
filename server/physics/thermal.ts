/**
 * Temperature dependence of viscosity — the first physics that actually
 * consumes stored test-condition temperatures.
 *
 * - Arrhenius (solvents/oligomer melts, T far above Tg):
 *     η(T) = η(Tref) · exp(Ea/R · (1/T − 1/Tref))
 *   Default activation energy ≈ 20 kJ/mol (typical small-molecule liquids;
 *   oligomers run higher — callers may override).
 *
 * - WLF (within ~100 K above Tg, universal constants C1=17.44, C2=51.6):
 *     log10(η(T)/η(Tg-ref)) = −C1·(T−Tref) / (C2 + T−Tref)
 *   Used when Tg is known and T − Tg < 100 K.
 */

const R = 8.314; // J/mol·K

export interface ViscosityAtTInput {
  viscosityAtRef: number; // mPa·s
  refTempC: number; // typically 25
  targetTempC: number;
  /** activation energy J/mol (Arrhenius); default 20000 */
  activationEnergy?: number;
  /** glass transition °C — switches to WLF when T−Tg < 100K */
  glassTransitionC?: number;
}

export interface ViscosityAtTResult {
  viscosity: number; // mPa·s at targetTempC
  method: "arrhenius" | "wlf";
  note: string;
}

export function viscosityAtTemperature(input: ViscosityAtTInput): ViscosityAtTResult | null {
  const { viscosityAtRef, refTempC, targetTempC } = input;
  if (!(viscosityAtRef > 0)) return null;

  const tK = targetTempC + 273.15;
  const refK = refTempC + 273.15;
  if (tK <= 0 || refK <= 0) return null;

  // WLF regime when close to Tg
  if (input.glassTransitionC !== undefined && targetTempC - input.glassTransitionC < 100 && targetTempC > input.glassTransitionC) {
    const C1 = 17.44;
    const C2 = 51.6;
    // Shift both T and Tref relative to Tg-anchored reference
    const shift = (T: number) => (-C1 * (T - input.glassTransitionC!)) / (C2 + (T - input.glassTransitionC!));
    const logShift = shift(targetTempC) - shift(refTempC);
    const viscosity = viscosityAtRef * Math.pow(10, logShift);
    return {
      viscosity: Math.round(viscosity * 100) / 100,
      method: "wlf",
      note: `WLF (universal constants) with Tg=${input.glassTransitionC}°C, ${refTempC}→${targetTempC}°C`,
    };
  }

  const ea = input.activationEnergy ?? 20000;
  const viscosity = viscosityAtRef * Math.exp((ea / R) * (1 / tK - 1 / refK));
  return {
    viscosity: Math.round(viscosity * 100) / 100,
    method: "arrhenius",
    note: `Arrhenius (Ea=${(ea / 1000).toFixed(0)} kJ/mol), ${refTempC}→${targetTempC}°C`,
  };
}
