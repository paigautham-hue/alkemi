/**
 * Physics Validation Service
 *
 * Validates formulations against physical laws and chemistry principles.
 * Prevents LLM hallucinations by enforcing physics constraints.
 *
 * Based on Claude Opus 4.5 recommendations (Critical Issue #2)
 *
 * All physics math delegates to the canonical implementations in
 * ../physicsModels — this file owns validation policy (thresholds, error
 * vs warning), not equations.
 */

import {
  calculateHSPDistance,
  predictViscosityLogMixing,
  HSP_INCOMPATIBILITY_THRESHOLD,
  type FormulationComponent,
} from "../physicsModels";

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
 * Map a validation Component onto the canonical physicsModels shapes.
 */
function toFormulationComponent(c: Component): FormulationComponent {
  return {
    materialId: c.materialId,
    percentage: c.percentage,
    material: {
      id: c.materialId,
      name: c.materialName,
      code: c.materialId,
      hansenD: c.hansen_d ?? null,
      hansenP: c.hansen_p ?? null,
      hansenH: c.hansen_h ?? null,
      viscosity: c.viscosity ?? null,
    },
  };
}

/**
 * Physics Models Service — thin adapter over the canonical implementations
 * in ../physicsModels (single source of truth for equations and thresholds).
 */
export class PhysicsModels {
  /**
   * Log-Mixing Rule for Viscosity Prediction (delegates to physicsModels).
   *
   * Keeps this service's coverage rule: returns null when components with
   * viscosity data account for < 50% of the formulation mass, because a
   * prediction from a minority of the mass is not reliable enough to gate on.
   */
  logMixingViscosity(components: Component[]): number | null {
    const withViscosity = components.filter(c => c.viscosity && c.viscosity > 0);
    const coverage = withViscosity.reduce((sum, c) => sum + c.percentage, 0) / 100;
    if (coverage < 0.5) {
      return null;
    }
    const result = predictViscosityLogMixing(components.map(toFormulationComponent));
    return result ? result.value : null;
  }

  /**
   * Hansen Solubility Parameter Distance (delegates to physicsModels).
   */
  hansenDistance(
    comp1: { hansen_d?: number; hansen_p?: number; hansen_h?: number },
    comp2: { hansen_d?: number; hansen_p?: number; hansen_h?: number }
  ): number | null {
    const asMaterial = (c: typeof comp1) => ({
      id: '',
      name: '',
      code: '',
      hansenD: c.hansen_d ?? null,
      hansenP: c.hansen_p ?? null,
      hansenH: c.hansen_h ?? null,
    });
    return calculateHSPDistance(asMaterial(comp1), asMaterial(comp2));
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

          if (distance > HSP_INCOMPATIBILITY_THRESHOLD) {
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
        `(Hansen distance ${pair.distance} > ${HSP_INCOMPATIBILITY_THRESHOLD}). Risk of phase separation.`
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
