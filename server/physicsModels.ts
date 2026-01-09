/**
 * Physics-Based Models for Formulation Property Prediction
 * 
 * Implements fundamental chemistry and physics principles for calculating
 * formulation properties from component properties and compositions.
 * 
 * Based on ALKEMI v5.1 Specification §20: Physics Constraints Library
 */

export interface Material {
  id: string;
  name: string;
  code: string;
  // Hansen Solubility Parameters
  hansenD?: number | null; // Dispersion
  hansenP?: number | null; // Polar
  hansenH?: number | null; // Hydrogen bonding
  // Physical properties
  viscosity?: number | null; // mPa·s at 25°C
  density?: number | null; // g/cm³
  refractiveIndex?: number | null;
  glassTransitionTemp?: number | null; // °C
  molecularWeight?: number | null; // g/mol
}

export interface FormulationComponent {
  materialId: string;
  percentage: number; // 0-100
  material?: Material;
}

export interface PhysicsPredictionResult {
  property: string;
  value: number;
  unit: string;
  method: string;
  confidence: 'high' | 'medium' | 'low';
  notes?: string;
}

/**
 * Calculate Hansen Solubility Parameter (HSP) distance between two materials
 * 
 * Formula: Ra = sqrt(4*(δD1-δD2)² + (δP1-δP2)² + (δH1-δH2)²)
 * 
 * Interpretation:
 * - Ra < 5: Highly compatible (will dissolve/mix well)
 * - Ra 5-10: Moderately compatible
 * - Ra > 10: Incompatible (likely phase separation)
 */
export function calculateHSPDistance(materialA: Material, materialB: Material): number | null {
  if (!materialA.hansenD || !materialA.hansenP || !materialA.hansenH ||
      !materialB.hansenD || !materialB.hansenP || !materialB.hansenH) {
    return null;
  }

  const deltaD = materialA.hansenD - materialB.hansenD;
  const deltaP = materialA.hansenP - materialB.hansenP;
  const deltaH = materialA.hansenH - materialB.hansenH;

  return Math.sqrt(4 * deltaD ** 2 + deltaP ** 2 + deltaH ** 2);
}

/**
 * Calculate average Hansen Solubility Parameters for a formulation
 * 
 * Uses weighted average based on volume fractions
 */
export function calculateFormulationHSP(components: FormulationComponent[]): {
  hansenD: number;
  hansenP: number;
  hansenH: number;
} | null {
  const validComponents = components.filter(c => 
    c.material?.hansenD && c.material?.hansenP && c.material?.hansenH
  );

  if (validComponents.length === 0) {
    return null;
  }

  const totalPercentage = validComponents.reduce((sum, c) => sum + c.percentage, 0);

  if (totalPercentage === 0) {
    return null;
  }

  const hansenD = validComponents.reduce((sum, c) => 
    sum + (c.material!.hansenD! * c.percentage / totalPercentage), 0
  );

  const hansenP = validComponents.reduce((sum, c) => 
    sum + (c.material!.hansenP! * c.percentage / totalPercentage), 0
  );

  const hansenH = validComponents.reduce((sum, c) => 
    sum + (c.material!.hansenH! * c.percentage / totalPercentage), 0
  );

  return { hansenD, hansenP, hansenH };
}

/**
 * Predict formulation viscosity using log-mixing rule
 * 
 * Formula: ln(η_mix) = Σ(φi * ln(ηi))
 * where φi is volume fraction and ηi is component viscosity
 * 
 * This is more accurate than linear mixing for viscosity
 */
export function predictViscosityLogMixing(components: FormulationComponent[]): PhysicsPredictionResult | null {
  const validComponents = components.filter(c => 
    c.material?.viscosity && c.material.viscosity > 0
  );

  if (validComponents.length === 0) {
    return null;
  }

  const totalPercentage = validComponents.reduce((sum, c) => sum + c.percentage, 0);

  if (totalPercentage === 0) {
    return null;
  }

  // Calculate log-weighted average
  const logViscositySum = validComponents.reduce((sum, c) => {
    const fraction = c.percentage / totalPercentage;
    return sum + fraction * Math.log(c.material!.viscosity!);
  }, 0);

  const predictedViscosity = Math.exp(logViscositySum);

  // Confidence based on data completeness
  const confidence = validComponents.length === components.length ? 'high' : 'medium';

  return {
    property: 'viscosity',
    value: Math.round(predictedViscosity * 10) / 10,
    unit: 'mPa·s at 25°C',
    method: 'Log-mixing rule',
    confidence,
    notes: `Based on ${validComponents.length} of ${components.length} components`
  };
}

/**
 * Predict formulation density using volume-weighted mixing
 * 
 * Formula: ρ_mix = Σ(wi * ρi) where wi is weight fraction
 * 
 * Assumes ideal mixing (no volume change on mixing)
 */
export function predictDensity(components: FormulationComponent[]): PhysicsPredictionResult | null {
  const validComponents = components.filter(c => 
    c.material?.density && c.material.density > 0
  );

  if (validComponents.length === 0) {
    return null;
  }

  const totalPercentage = validComponents.reduce((sum, c) => sum + c.percentage, 0);

  if (totalPercentage === 0) {
    return null;
  }

  // Weight-weighted average (assuming weight percentages)
  const predictedDensity = validComponents.reduce((sum, c) => {
    const fraction = c.percentage / totalPercentage;
    return sum + fraction * c.material!.density!;
  }, 0);

  const confidence = validComponents.length === components.length ? 'high' : 'medium';

  return {
    property: 'density',
    value: Math.round(predictedDensity * 1000) / 1000,
    unit: 'g/cm³',
    method: 'Weight-weighted mixing',
    confidence,
    notes: `Based on ${validComponents.length} of ${components.length} components`
  };
}

/**
 * Predict formulation refractive index using Lorentz-Lorenz mixing rule
 * 
 * Formula: (n²-1)/(n²+2) = Σ(φi * (ni²-1)/(ni²+2))
 * where φi is volume fraction and ni is component refractive index
 * 
 * More accurate than linear mixing for optical properties
 */
export function predictRefractiveIndex(components: FormulationComponent[]): PhysicsPredictionResult | null {
  const validComponents = components.filter(c => 
    c.material?.refractiveIndex && c.material.refractiveIndex > 0
  );

  if (validComponents.length === 0) {
    return null;
  }

  const totalPercentage = validComponents.reduce((sum, c) => sum + c.percentage, 0);

  if (totalPercentage === 0) {
    return null;
  }

  // Calculate Lorentz-Lorenz weighted average
  const llSum = validComponents.reduce((sum, c) => {
    const fraction = c.percentage / totalPercentage;
    const n = c.material!.refractiveIndex!;
    const ll = (n ** 2 - 1) / (n ** 2 + 2);
    return sum + fraction * ll;
  }, 0);

  // Solve for n: n² = (1 + 2*LL) / (1 - LL)
  const nSquared = (1 + 2 * llSum) / (1 - llSum);
  const predictedRI = Math.sqrt(nSquared);

  const confidence = validComponents.length === components.length ? 'high' : 'medium';

  return {
    property: 'refractive_index',
    value: Math.round(predictedRI * 10000) / 10000,
    unit: 'nD at 25°C',
    method: 'Lorentz-Lorenz mixing rule',
    confidence,
    notes: `Based on ${validComponents.length} of ${components.length} components`
  };
}

/**
 * Predict glass transition temperature using Fox equation
 * 
 * Formula: 1/Tg_mix = Σ(wi / Tgi)
 * where wi is weight fraction and Tgi is component Tg in Kelvin
 * 
 * Widely used for polymer blends
 */
export function predictGlassTransitionTemp(components: FormulationComponent[]): PhysicsPredictionResult | null {
  const validComponents = components.filter(c => 
    c.material?.glassTransitionTemp !== null && c.material?.glassTransitionTemp !== undefined
  );

  if (validComponents.length === 0) {
    return null;
  }

  const totalPercentage = validComponents.reduce((sum, c) => sum + c.percentage, 0);

  if (totalPercentage === 0) {
    return null;
  }

  // Convert Celsius to Kelvin and apply Fox equation
  const foxSum = validComponents.reduce((sum, c) => {
    const fraction = c.percentage / totalPercentage;
    const tgKelvin = c.material!.glassTransitionTemp! + 273.15;
    return sum + fraction / tgKelvin;
  }, 0);

  const predictedTgKelvin = 1 / foxSum;
  const predictedTgCelsius = predictedTgKelvin - 273.15;

  const confidence = validComponents.length === components.length ? 'high' : 'medium';

  return {
    property: 'glass_transition_temp',
    value: Math.round(predictedTgCelsius * 10) / 10,
    unit: '°C',
    method: 'Fox equation',
    confidence,
    notes: `Based on ${validComponents.length} of ${components.length} components`
  };
}

/**
 * Assess formulation compatibility based on HSP analysis
 * 
 * Returns compatibility score and warnings
 */
export function assessCompatibility(components: FormulationComponent[]): {
  score: number; // 0-100
  level: 'excellent' | 'good' | 'fair' | 'poor';
  warnings: string[];
  details: string[];
} {
  const warnings: string[] = [];
  const details: string[] = [];

  // Check if we have HSP data
  const componentsWithHSP = components.filter(c => 
    c.material?.hansenD && c.material?.hansenP && c.material?.hansenH
  );

  if (componentsWithHSP.length < 2) {
    return {
      score: 50,
      level: 'fair',
      warnings: ['Insufficient Hansen Solubility Parameter data for compatibility assessment'],
      details: ['Add HSP data to materials for better compatibility predictions']
    };
  }

  // Calculate pairwise HSP distances
  const distances: number[] = [];
  for (let i = 0; i < componentsWithHSP.length; i++) {
    for (let j = i + 1; j < componentsWithHSP.length; j++) {
      const distance = calculateHSPDistance(
        componentsWithHSP[i].material!,
        componentsWithHSP[j].material!
      );
      if (distance !== null) {
        distances.push(distance);
        
        if (distance > 10) {
          warnings.push(
            `High HSP distance (${distance.toFixed(1)}) between ${componentsWithHSP[i].material!.name} and ${componentsWithHSP[j].material!.name} - risk of phase separation`
          );
        } else if (distance > 5) {
          details.push(
            `Moderate HSP distance (${distance.toFixed(1)}) between ${componentsWithHSP[i].material!.name} and ${componentsWithHSP[j].material!.name}`
          );
        } else {
          details.push(
            `Good compatibility (HSP distance ${distance.toFixed(1)}) between ${componentsWithHSP[i].material!.name} and ${componentsWithHSP[j].material!.name}`
          );
        }
      }
    }
  }

  if (distances.length === 0) {
    return {
      score: 50,
      level: 'fair',
      warnings: ['Could not calculate HSP distances'],
      details: []
    };
  }

  // Calculate average distance and score
  const avgDistance = distances.reduce((sum, d) => sum + d, 0) / distances.length;
  const maxDistance = Math.max(...distances);

  // Score: 100 for avgDistance=0, 0 for avgDistance=15
  let score = Math.max(0, Math.min(100, 100 - (avgDistance / 15) * 100));

  // Penalize heavily if any pair has very high distance
  if (maxDistance > 15) {
    score = Math.min(score, 30);
  } else if (maxDistance > 10) {
    score = Math.min(score, 60);
  }

  let level: 'excellent' | 'good' | 'fair' | 'poor';
  if (score >= 80) level = 'excellent';
  else if (score >= 60) level = 'good';
  else if (score >= 40) level = 'fair';
  else level = 'poor';

  return {
    score: Math.round(score),
    level,
    warnings,
    details
  };
}

/**
 * Run all physics-based predictions for a formulation
 */
export function predictAllProperties(components: FormulationComponent[]): {
  predictions: PhysicsPredictionResult[];
  compatibility: ReturnType<typeof assessCompatibility>;
  hsp: ReturnType<typeof calculateFormulationHSP>;
} {
  const predictions: PhysicsPredictionResult[] = [];

  const viscosity = predictViscosityLogMixing(components);
  if (viscosity) predictions.push(viscosity);

  const density = predictDensity(components);
  if (density) predictions.push(density);

  const refractiveIndex = predictRefractiveIndex(components);
  if (refractiveIndex) predictions.push(refractiveIndex);

  const tg = predictGlassTransitionTemp(components);
  if (tg) predictions.push(tg);

  const compatibility = assessCompatibility(components);
  const hsp = calculateFormulationHSP(components);

  return {
    predictions,
    compatibility,
    hsp
  };
}
