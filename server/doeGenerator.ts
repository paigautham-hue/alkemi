/**
 * Design of Experiments (DOE) Generator
 * 
 * Provides:
 * - Latin Hypercube Sampling (LHS)
 * - Full Factorial Design
 * - Fractional Factorial Design
 * - Central Composite Design
 * 
 * Based on ALKEMI v5.1 Specification §18: DOE Generator
 */

export interface Factor {
  name: string;
  min: number;
  max: number;
  unit?: string;
}

export interface DesignPoint {
  runNumber: number;
  factors: Record<string, number>;
}

export interface DOEResult {
  designType: string;
  factors: Factor[];
  designPoints: DesignPoint[];
  totalRuns: number;
  metadata: {
    seed?: number;
    resolution?: string;
    centerPoints?: number;
  };
}

/**
 * Generate Latin Hypercube Sampling design
 * 
 * LHS ensures good space-filling properties with fewer runs than full factorial
 */
export function generateLatinHypercube(
  factors: Factor[],
  numSamples: number,
  seed?: number
): DOEResult {
  const rng = createSeededRandom(seed);
  const designPoints: DesignPoint[] = [];
  
  // Generate Latin Hypercube
  const lhs: number[][] = [];
  
  for (let i = 0; i < factors.length; i++) {
    // Create permutation of intervals
    const intervals = Array.from({ length: numSamples }, (_, j) => j);
    shuffleArray(intervals, rng);
    
    // Sample within each interval
    const samples = intervals.map(interval => {
      const lower = interval / numSamples;
      const upper = (interval + 1) / numSamples;
      return lower + rng() * (upper - lower);
    });
    
    lhs.push(samples);
  }
  
  // Convert to design points
  for (let i = 0; i < numSamples; i++) {
    const factorValues: Record<string, number> = {};
    
    for (let j = 0; j < factors.length; j++) {
      const factor = factors[j];
      const normalized = lhs[j][i];
      const value = factor.min + normalized * (factor.max - factor.min);
      factorValues[factor.name] = parseFloat(value.toFixed(4));
    }
    
    designPoints.push({
      runNumber: i + 1,
      factors: factorValues,
    });
  }
  
  return {
    designType: "Latin Hypercube Sampling",
    factors,
    designPoints,
    totalRuns: numSamples,
    metadata: { seed },
  };
}

/**
 * Generate Full Factorial Design
 * 
 * Tests all possible combinations of factor levels
 */
export function generateFullFactorial(
  factors: Factor[],
  levelsPerFactor: number = 2
): DOEResult {
  const totalRuns = Math.pow(levelsPerFactor, factors.length);
  const designPoints: DesignPoint[] = [];
  
  // Generate all combinations
  for (let i = 0; i < totalRuns; i++) {
    const factorValues: Record<string, number> = {};
    let runIndex = i;
    
    for (let j = 0; j < factors.length; j++) {
      const factor = factors[j];
      const level = runIndex % levelsPerFactor;
      runIndex = Math.floor(runIndex / levelsPerFactor);
      
      // Map level to actual value
      const value = factor.min + (level / (levelsPerFactor - 1)) * (factor.max - factor.min);
      factorValues[factor.name] = parseFloat(value.toFixed(4));
    }
    
    designPoints.push({
      runNumber: i + 1,
      factors: factorValues,
    });
  }
  
  return {
    designType: `Full Factorial (${levelsPerFactor}^${factors.length})`,
    factors,
    designPoints,
    totalRuns,
    metadata: {},
  };
}

/**
 * Generate Fractional Factorial Design
 * 
 * Reduces number of runs by confounding higher-order interactions
 */
export function generateFractionalFactorial(
  factors: Factor[],
  resolution: "III" | "IV" | "V" = "IV"
): DOEResult {
  // For simplicity, implement 2^(k-p) designs
  const k = factors.length;
  let p = 0; // Number of generators
  
  // Determine fraction based on resolution and number of factors
  if (k <= 4) {
    p = 0; // Full factorial for small designs
  } else if (resolution === "III") {
    p = Math.floor(k / 2);
  } else if (resolution === "IV") {
    p = Math.floor(k / 3);
  } else {
    p = Math.floor(k / 4);
  }
  
  const baseFactors = k - p;
  const totalRuns = Math.pow(2, baseFactors);
  const designPoints: DesignPoint[] = [];
  
  // Generate base design
  for (let i = 0; i < totalRuns; i++) {
    const factorValues: Record<string, number> = {};
    const levels: number[] = [];
    
    // Base factors
    for (let j = 0; j < baseFactors; j++) {
      const level = (i >> j) & 1; // Extract bit
      levels.push(level);
      
      const factor = factors[j];
      const value = level === 0 ? factor.min : factor.max;
      factorValues[factor.name] = parseFloat(value.toFixed(4));
    }
    
    // Generated factors (using simple interactions)
    for (let j = baseFactors; j < k; j++) {
      // Use XOR of first two base factors as generator
      const level = levels[0] ^ levels[Math.min(1, levels.length - 1)];
      
      const factor = factors[j];
      const value = level === 0 ? factor.min : factor.max;
      factorValues[factor.name] = parseFloat(value.toFixed(4));
    }
    
    designPoints.push({
      runNumber: i + 1,
      factors: factorValues,
    });
  }
  
  return {
    designType: `Fractional Factorial (2^${k}-${p})`,
    factors,
    designPoints,
    totalRuns,
    metadata: { resolution },
  };
}

/**
 * Generate Central Composite Design
 * 
 * Adds center points and axial points to factorial design for response surface modeling
 */
export function generateCentralComposite(
  factors: Factor[],
  centerPoints: number = 3
): DOEResult {
  const k = factors.length;
  const designPoints: DesignPoint[] = [];
  let runNumber = 1;
  
  // 1. Factorial points (2^k)
  const factorialRuns = Math.pow(2, k);
  for (let i = 0; i < factorialRuns; i++) {
    const factorValues: Record<string, number> = {};
    
    for (let j = 0; j < k; j++) {
      const level = (i >> j) & 1;
      const factor = factors[j];
      const value = level === 0 ? factor.min : factor.max;
      factorValues[factor.name] = parseFloat(value.toFixed(4));
    }
    
    designPoints.push({
      runNumber: runNumber++,
      factors: factorValues,
    });
  }
  
  // 2. Axial points (2*k)
  const alpha = Math.sqrt(k); // Distance from center
  for (let j = 0; j < k; j++) {
    const factor = factors[j];
    const center = (factor.min + factor.max) / 2;
    const range = (factor.max - factor.min) / 2;
    
    // Low axial point
    const lowValues: Record<string, number> = {};
    for (let i = 0; i < k; i++) {
      if (i === j) {
        lowValues[factors[i].name] = parseFloat((center - alpha * range).toFixed(4));
      } else {
        lowValues[factors[i].name] = parseFloat(((factors[i].min + factors[i].max) / 2).toFixed(4));
      }
    }
    designPoints.push({
      runNumber: runNumber++,
      factors: lowValues,
    });
    
    // High axial point
    const highValues: Record<string, number> = {};
    for (let i = 0; i < k; i++) {
      if (i === j) {
        highValues[factors[i].name] = parseFloat((center + alpha * range).toFixed(4));
      } else {
        highValues[factors[i].name] = parseFloat(((factors[i].min + factors[i].max) / 2).toFixed(4));
      }
    }
    designPoints.push({
      runNumber: runNumber++,
      factors: highValues,
    });
  }
  
  // 3. Center points
  for (let i = 0; i < centerPoints; i++) {
    const centerValues: Record<string, number> = {};
    for (const factor of factors) {
      centerValues[factor.name] = parseFloat(((factor.min + factor.max) / 2).toFixed(4));
    }
    designPoints.push({
      runNumber: runNumber++,
      factors: centerValues,
    });
  }
  
  return {
    designType: "Central Composite Design",
    factors,
    designPoints,
    totalRuns: designPoints.length,
    metadata: { centerPoints },
  };
}

/**
 * Seeded random number generator for reproducibility
 */
function createSeededRandom(seed?: number): () => number {
  let state = seed !== undefined ? seed : Date.now();
  
  return function() {
    // Linear congruential generator
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

/**
 * Fisher-Yates shuffle with seeded RNG
 */
function shuffleArray<T>(array: T[], rng: () => number): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

/**
 * Export design to CSV format
 */
export function exportDesignToCSV(design: DOEResult): string {
  const headers = ["Run", ...design.factors.map(f => `${f.name} (${f.unit || "-"})`)];
  const rows = design.designPoints.map(point => [
    point.runNumber.toString(),
    ...design.factors.map(f => point.factors[f.name].toString()),
  ]);
  
  return [
    headers.join(","),
    ...rows.map(row => row.join(",")),
  ].join("\n");
}
