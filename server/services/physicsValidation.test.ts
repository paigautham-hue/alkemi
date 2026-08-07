/**
 * Physics Validation Service Tests
 * 
 * Tests for physics-based formulation validation
 */

import { describe, it, expect } from 'vitest';
import { physicsValidator, physicsModels } from './physicsValidation';

describe('PhysicsModels', () => {
  describe('logMixingViscosity', () => {
    it('should calculate viscosity using log-mixing rule', () => {
      const components = [
        { materialId: '1', materialName: 'Resin A', percentage: 50, viscosity: 1000 },
        { materialId: '2', materialName: 'Solvent B', percentage: 50, viscosity: 10 },
      ];
      
      const result = physicsModels.logMixingViscosity(components);
      
      // log(η_mix) = 0.5 * log(1000) + 0.5 * log(10) = 0.5 * 3 + 0.5 * 1 = 2
      // η_mix = 10^2 = 100 cP
      expect(result).toBeCloseTo(100, 0);
    });
    
    it('should return null if no viscosity data available', () => {
      const components = [
        { materialId: '1', materialName: 'Material A', percentage: 100 },
      ];
      
      const result = physicsModels.logMixingViscosity(components);
      expect(result).toBeNull();
    });
    
    it('should return null if insufficient data (<50% coverage)', () => {
      const components = [
        { materialId: '1', materialName: 'Resin A', percentage: 40, viscosity: 1000 },
        { materialId: '2', materialName: 'Unknown B', percentage: 60 },
      ];
      
      const result = physicsModels.logMixingViscosity(components);
      expect(result).toBeNull();
    });
  });
  
  describe('hansenDistance', () => {
    it('should calculate Hansen solubility distance', () => {
      const comp1 = { hansen_d: 18.0, hansen_p: 10.0, hansen_h: 8.0 };
      const comp2 = { hansen_d: 16.0, hansen_p: 12.0, hansen_h: 10.0 };
      
      const distance = physicsModels.hansenDistance(comp1, comp2);
      
      // Ra = √(4*(18-16)² + (10-12)² + (8-10)²)
      // Ra = √(4*4 + 4 + 4) = √24 ≈ 4.9
      expect(distance).toBeCloseTo(4.9, 1);
    });
    
    it('should return null if Hansen parameters missing', () => {
      const comp1 = { hansen_d: 18.0 };
      const comp2 = { hansen_d: 16.0, hansen_p: 12.0, hansen_h: 10.0 };
      
      const distance = physicsModels.hansenDistance(comp1, comp2);
      expect(distance).toBeNull();
    });
  });
  
  describe('checkSolubilityCompatibility', () => {
    it('should identify incompatible pairs (distance > 8)', () => {
      const components = [
        { materialId: '1', materialName: 'Polar Solvent', percentage: 50, hansen_d: 18.0, hansen_p: 16.0, hansen_h: 12.0 },
        { materialId: '2', materialName: 'Nonpolar Resin', percentage: 50, hansen_d: 16.0, hansen_p: 2.0, hansen_h: 2.0 },
      ];
      
      const result = physicsModels.checkSolubilityCompatibility(components);
      
      expect(result.maxDistance).toBeGreaterThan(8);
      expect(result.incompatiblePairs).toHaveLength(1);
      expect(result.incompatiblePairs[0].comp1).toBe('Polar Solvent');
      expect(result.incompatiblePairs[0].comp2).toBe('Nonpolar Resin');
    });
    
    it('should return empty array for compatible components', () => {
      const components = [
        { materialId: '1', materialName: 'Resin A', percentage: 50, hansen_d: 18.0, hansen_p: 10.0, hansen_h: 8.0 },
        { materialId: '2', materialName: 'Resin B', percentage: 50, hansen_d: 17.5, hansen_p: 10.5, hansen_h: 8.5 },
      ];
      
      const result = physicsModels.checkSolubilityCompatibility(components);
      
      expect(result.maxDistance).toBeLessThan(8);
      expect(result.incompatiblePairs).toHaveLength(0);
    });
  });
});

describe('PhysicsValidator', () => {
  describe('validate', () => {
    it('should pass validation for valid formulation', async () => {
      const formulation = {
        id: 'test-1',
        name: 'Test Formulation',
        components: [
          { materialId: '1', materialName: 'Resin A', percentage: 60, viscosity: 5000 },
          { materialId: '2', materialName: 'Solvent B', percentage: 40, viscosity: 5 },
        ],
      };
      
      const result = await physicsValidator.validate(formulation);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.calculations?.totalPercentage).toBe(100);
      expect(result.calculations?.predictedViscosity).toBeGreaterThan(0);
    });
    
    it('should fail validation for mass balance error', async () => {
      const formulation = {
        id: 'test-2',
        name: 'Invalid Formulation',
        components: [
          { materialId: '1', materialName: 'Resin A', percentage: 60 },
          { materialId: '2', materialName: 'Solvent B', percentage: 30 },
        ],
      };
      
      const result = await physicsValidator.validate(formulation);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(expect.arrayContaining([expect.stringContaining('Mass balance error')]));
      expect(result.calculations?.totalPercentage).toBe(90);
    });
    
    it('should error for extremely high viscosity', async () => {
      const formulation = {
        id: 'test-3',
        name: 'High Viscosity Formulation',
        components: [
          { materialId: '1', materialName: 'Very Thick Resin', percentage: 100, viscosity: 10_000_000 },
        ],
      };
      
      const result = await physicsValidator.validate(formulation);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(expect.arrayContaining([expect.stringContaining('too high')]));
    });
    
    it('should warn for moderately high viscosity', async () => {
      const formulation = {
        id: 'test-4',
        name: 'Moderate Viscosity Formulation',
        components: [
          { materialId: '1', materialName: 'Thick Resin', percentage: 100, viscosity: 150_000 },
        ],
      };
      
      const result = await physicsValidator.validate(formulation);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toEqual(expect.arrayContaining([expect.stringContaining('high')]));
    });
    
    it('should warn for incompatible Hansen parameters', async () => {
      const formulation = {
        id: 'test-5',
        name: 'Incompatible Formulation',
        components: [
          { materialId: '1', materialName: 'Polar', percentage: 50, hansen_d: 18.0, hansen_p: 16.0, hansen_h: 12.0 },
          { materialId: '2', materialName: 'Nonpolar', percentage: 50, hansen_d: 16.0, hansen_p: 2.0, hansen_h: 2.0 },
        ],
      };
      
      const result = await physicsValidator.validate(formulation);
      
      expect(result.isValid).toBe(true); // Warnings don't fail validation
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('incompatible');
      expect(result.warnings[0]).toContain('phase separation');
    });
    
    it('should fail for empty formulation', async () => {
      const formulation = {
        id: 'test-6',
        name: 'Empty Formulation',
        components: [],
      };
      
      const result = await physicsValidator.validate(formulation);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Formulation must have at least one component.');
    });
    
    it('should warn for very complex formulations', async () => {
      const components = Array.from({ length: 60 }, (_, i) => ({
        materialId: `${i}`,
        materialName: `Component ${i}`,
        percentage: 100 / 60,
      }));
      
      const formulation = {
        id: 'test-7',
        name: 'Complex Formulation',
        components,
      };
      
      const result = await physicsValidator.validate(formulation);
      
      expect(result.warnings).toEqual(expect.arrayContaining([expect.stringContaining('complex')]));
    });
  });
});
