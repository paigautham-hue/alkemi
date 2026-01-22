/**
 * Uncertainty Quantification Service Tests
 * 
 * Tests for probability-in-spec calculations and UQ
 */

import { describe, it, expect } from 'vitest';
import { uncertaintyQuantifier } from './uncertaintyQuantification';

describe('UncertaintyQuantifier', () => {
  describe('calculateProbabilityInSpec', () => {
    it('should return 1.0 for prediction well within spec', () => {
      const prob = uncertaintyQuantifier.calculateProbabilityInSpec(
        2500, // prediction
        50,   // uncertainty (std dev)
        2300, // spec min
        2700  // spec max
      );
      
      // Prediction is 2500 ± 50, spec is [2300, 2700]
      // 4 standard deviations from each limit → very high probability
      expect(prob).toBeGreaterThan(0.99);
    });
    
    it('should return ~0.5 for prediction at spec center with wide uncertainty', () => {
      const prob = uncertaintyQuantifier.calculateProbabilityInSpec(
        2500, // prediction
        200,  // uncertainty
        2300, // spec min
        2700  // spec max
      );
      
      // Prediction at center, but uncertainty spans most of spec range
      // Should be around 68% (1 sigma)
      expect(prob).toBeGreaterThan(0.6);
      expect(prob).toBeLessThan(0.8);
    });
    
    it('should return low probability for prediction near spec edge', () => {
      const prob = uncertaintyQuantifier.calculateProbabilityInSpec(
        2300, // prediction at lower limit
        100,  // uncertainty
        2300, // spec min
        2700  // spec max
      );
      
      // Half the distribution is below spec min
      expect(prob).toBeLessThan(0.6);
    });
    
    it('should return 0.0 for prediction outside spec with no uncertainty', () => {
      const prob = uncertaintyQuantifier.calculateProbabilityInSpec(
        2800, // prediction above spec
        0,    // no uncertainty
        2300, // spec min
        2700  // spec max
      );
      
      expect(prob).toBe(0.0);
    });
    
    it('should return 1.0 for prediction inside spec with no uncertainty', () => {
      const prob = uncertaintyQuantifier.calculateProbabilityInSpec(
        2500, // prediction inside spec
        0,    // no uncertainty
        2300, // spec min
        2700  // spec max
      );
      
      expect(prob).toBe(1.0);
    });
  });
  
  describe('calculate95CI', () => {
    it('should calculate 95% confidence interval', () => {
      const [lower, upper] = uncertaintyQuantifier.calculate95CI(100, 10);
      
      // 95% CI = mean ± 1.96 * std
      expect(lower).toBeCloseTo(100 - 1.96 * 10, 1);
      expect(upper).toBeCloseTo(100 + 1.96 * 10, 1);
    });
  });
  
  describe('decomposeUncertainty', () => {
    it('should decompose uncertainty into sources', () => {
      const sources = uncertaintyQuantifier.decomposeUncertainty(100, {
        modelConfidence: 0.8,
        dataQuality: 0.9,
        isExtrapolation: false,
      });
      
      expect(sources.model).toBeGreaterThan(0);
      expect(sources.data).toBeGreaterThan(0);
      expect(sources.extrapolation).toBe(0); // Not extrapolating
      
      // Total should approximately equal input uncertainty
      const total = sources.model + sources.data + sources.extrapolation;
      expect(total).toBeCloseTo(100, 0);
    });
    
    it('should include extrapolation uncertainty when extrapolating', () => {
      const sources = uncertaintyQuantifier.decomposeUncertainty(100, {
        modelConfidence: 0.8,
        dataQuality: 0.9,
        isExtrapolation: true,
      });
      
      expect(sources.extrapolation).toBeGreaterThan(0);
    });
  });
  
  describe('quantify', () => {
    it('should return complete UQ result', () => {
      const result = uncertaintyQuantifier.quantify(
        2500, // prediction
        100,  // uncertainty
        { minValue: 2300, maxValue: 2700, unit: 'cP' },
        { modelConfidence: 0.85 }
      );
      
      expect(result.value).toBe(2500);
      expect(result.uncertainty).toBe(100);
      expect(result.confidenceInterval95).toHaveLength(2);
      expect(result.probabilityInSpec).toBeGreaterThan(0);
      expect(result.probabilityInSpec).toBeLessThanOrEqual(1);
      expect(result.uncertaintySources).toHaveProperty('model');
      expect(result.uncertaintySources).toHaveProperty('data');
      expect(result.uncertaintySources).toHaveProperty('extrapolation');
    });
  });
  
  describe('formatPrediction', () => {
    it('should format prediction with probability', () => {
      const pred = uncertaintyQuantifier.quantify(
        2500,
        100,
        { minValue: 2300, maxValue: 2700, unit: 'cP' }
      );
      
      const formatted = uncertaintyQuantifier.formatPrediction(pred, 'cP');
      
      expect(formatted).toContain('2500 cP');
      expect(formatted).toContain('± 100 cP');
      expect(formatted).toContain('probability of meeting spec');
    });
  });
  
  describe('getRiskLevel', () => {
    it('should return low risk for >95% probability', () => {
      const risk = uncertaintyQuantifier.getRiskLevel(0.96);
      
      expect(risk.level).toBe('low');
      expect(risk.color).toBe('green');
      expect(risk.recommendation).toContain('Proceed with confidence');
    });
    
    it('should return moderate risk for 80-95% probability', () => {
      const risk = uncertaintyQuantifier.getRiskLevel(0.85);
      
      expect(risk.level).toBe('moderate');
      expect(risk.color).toBe('yellow');
      expect(risk.recommendation).toContain('some risk');
    });
    
    it('should return high risk for 50-80% probability', () => {
      const risk = uncertaintyQuantifier.getRiskLevel(0.65);
      
      expect(risk.level).toBe('high');
      expect(risk.color).toBe('orange');
      expect(risk.recommendation).toContain('Moderate risk');
    });
    
    it('should return very high risk for <50% probability', () => {
      const risk = uncertaintyQuantifier.getRiskLevel(0.30);
      
      expect(risk.level).toBe('very_high');
      expect(risk.color).toBe('red');
      expect(risk.recommendation).toContain('High risk');
    });
  });
});
