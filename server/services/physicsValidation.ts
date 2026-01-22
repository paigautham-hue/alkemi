/**
 * Physics Validation Service
 * 
 * Validates formulations against physical laws and chemistry principles.
 * Prevents LLM hallucinations by enforcing physics constraints.
 * 
 * Based on Claude Opus 4.5 recommendations (Critical Issue #2)
 */

export interface PhysicsValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  calculations?: {
    predictedViscosity?: number;
    maxHansenDistance?: number;
    totalPercentage?: number;
  };
}

export interface Component {
  materialId: string;
  materialName: string;
  percentage: number;
  viscosity?: number; // cP
  hansen_d?: number;
  hansen_p?: number;
  hansen_h?: number;
}

export interface Formulation {
  id: string;
  name: string;
  components: Component[];
}

/**
 * Physics Models Service
 * Implements chemistry physics calculations
 */
export class PhysicsModels {
  /**
   * Log-Mixing Rule for Viscosity Prediction
   * 
   * Formula: log(η_mix) = Σ(x_i * log(η_i))
   * where x_i = volume fraction, η_i = component viscosity
   * 
   * Reference: "Viscosity of Liquid Mixtures" - Kendall & Monroe (1917)
   */
  logMixingViscosity(components: Component[]): number | null {
    const componentsWithViscosity = components.filter(c => c.viscosity && c.viscosity > 0);
    
    if (componentsWithViscosity.length === 0) {
      return null; // Cannot calculate without viscosity data
    }
    
    // Assume mass fraction ≈ volume fraction for simplicity
    // (In production, would use density to convert)
    let logViscositySum = 0;
    let totalFraction = 0;
    
    for (const comp of componentsWithViscosity) {
      const fraction = comp.percentage / 100;
      logViscositySum += fraction * Math.log10(comp.viscosity!);
      totalFraction += fraction;
    }
    
    if (totalFraction < 0.5) {
      return null; // Not enough data for reliable prediction
    }
    
    const predictedLogViscosity = logViscositySum / totalFraction;
    return Math.pow(10, predictedLogViscosity);
  }
  
  /**
   * Hansen Solubility Parameter Distance
   * 
   * Formula: Ra = √(4(δD1-δD2)² + (δP1-δP2)² + (δH1-δH2)²)
   * 
   * Interpretation:
   * - Ra < 5: Highly compatible (will mix)
   * - Ra 5-8: Borderline compatibility
   * - Ra > 8: Incompatible (will separate)
   * 
   * Reference: Hansen, C.M. (2007). "Hansen Solubility Parameters: A User's Handbook"
   */
  hansenDistance(
    comp1: { hansen_d?: number; hansen_p?: number; hansen_h?: number },
    comp2: { hansen_d?: number; hansen_p?: number; hansen_h?: number }
  ): number | null {
    if (!comp1.hansen_d || !comp1.hansen_p || !comp1.hansen_h ||
        !comp2.hansen_d || !comp2.hansen_p || !comp2.hansen_h) {
      return null; // Missing Hansen parameters
    }
    
    const dD = comp1.hansen_d - comp2.hansen_d;
    const dP = comp1.hansen_p - comp2.hansen_p;
    const dH = comp1.hansen_h - comp2.hansen_h;
    
    return Math.sqrt(4 * dD * dD + dP * dP + dH * dH);
  }
  
  /**
   * Check all pairwise Hansen distances in formulation
   */
  checkSolubilityCompatibility(components: Component[]): {
    maxDistance: number | null;
    incompatiblePairs: Array<{ comp1: string; comp2: string; distance: number }>;
  } {
    const incompatiblePairs: Array<{ comp1: string; comp2: string; distance: number }> = [];
    let maxDistance: number | null = null;
    
    for (let i = 0; i < components.length; i++) {
      for (let j = i + 1; j < components.length; j++) {
        const distance = this.hansenDistance(components[i], components[j]);
        
        if (distance !== null) {
          if (maxDistance === null || distance > maxDistance) {
            maxDistance = distance;
          }
          
          if (distance > 8) {
            incompatiblePairs.push({
              comp1: components[i].materialName,
              comp2: components[j].materialName,
              distance: Math.round(distance * 10) / 10,
            });
          }
        }
      }
    }
    
    return { maxDistance, incompatiblePairs };
  }
}

/**
 * Physics Validation Service
 * Main validation entry point
 */
export class PhysicsValidator {
  private physics: PhysicsModels;
  
  constructor() {
    this.physics = new PhysicsModels();
  }
  
  /**
   * Validate formulation against physics constraints
   */
  async validate(formulation: Formulation): Promise<PhysicsValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const calculations: PhysicsValidationResult['calculations'] = {};
    
    // 1. Mass Balance Check (Critical)
    const totalPercentage = formulation.components.reduce(
      (sum, c) => sum + c.percentage,
      0
    );
    calculations.totalPercentage = Math.round(totalPercentage * 100) / 100;
    
    if (Math.abs(totalPercentage - 100) > 0.1) {
      errors.push(
        `Mass balance error: ${calculations.totalPercentage}% ≠ 100%. ` +
        `Formulation must sum to exactly 100%.`
      );
    }
    
    // 2. Viscosity Prediction (Warning if too high)
    const predictedViscosity = this.physics.logMixingViscosity(formulation.components);
    if (predictedViscosity !== null) {
      calculations.predictedViscosity = Math.round(predictedViscosity);
      
      if (predictedViscosity > 1_000_000) {
        errors.push(
          `Predicted viscosity ${calculations.predictedViscosity.toLocaleString()} cP is too high for processing. ` +
          `Consider adding solvents or reducing high-viscosity components.`
        );
      } else if (predictedViscosity > 100_000) {
        warnings.push(
          `Predicted viscosity ${calculations.predictedViscosity.toLocaleString()} cP is very high. ` +
          `May require heating or specialized equipment.`
        );
      }
    }
    
    // 3. Hansen Solubility Compatibility (Warning if incompatible)
    const compatibility = this.physics.checkSolubilityCompatibility(formulation.components);
    if (compatibility.maxDistance !== null) {
      calculations.maxHansenDistance = Math.round(compatibility.maxDistance * 10) / 10;
    }
    
    for (const pair of compatibility.incompatiblePairs) {
      warnings.push(
        `Solubility warning: ${pair.comp1} and ${pair.comp2} may be incompatible ` +
        `(Hansen distance ${pair.distance} > 8). Risk of phase separation.`
      );
    }
    
    // 4. Component Count Check
    if (formulation.components.length === 0) {
      errors.push('Formulation must have at least one component.');
    }
    
    if (formulation.components.length > 50) {
      warnings.push(
        `Formulation has ${formulation.components.length} components. ` +
        `Very complex formulations are difficult to optimize and manufacture.`
      );
    }
    
    // 5. Individual Component Percentage Checks
    for (const comp of formulation.components) {
      if (comp.percentage < 0) {
        errors.push(`${comp.materialName}: Percentage cannot be negative.`);
      }
      if (comp.percentage > 100) {
        errors.push(`${comp.materialName}: Percentage cannot exceed 100%.`);
      }
      if (comp.percentage < 0.01 && comp.percentage > 0) {
        warnings.push(
          `${comp.materialName}: ${comp.percentage}% is very low. ` +
          `May be difficult to measure accurately.`
        );
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      calculations,
    };
  }
}

// Export singleton instance
export const physicsValidator = new PhysicsValidator();
export const physicsModels = new PhysicsModels();
