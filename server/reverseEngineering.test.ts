/**
 * Reverse Engineering Service Tests
 * 
 * Tests for the AI-powered competitor product analysis functionality.
 * Tests the core logic and data transformation, with LLM calls mocked.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Create a mock function that we can control
const mockInvokeLLM = vi.fn();

// Mock the LLM module before any imports
vi.mock('./_core/llm', () => ({
  invokeLLM: (...args: any[]) => mockInvokeLLM(...args)
}));

// Mock the database module
vi.mock('./db', () => ({
  getMaterials: vi.fn().mockResolvedValue([]),
  getCompetitorProductById: vi.fn(),
  updateCompetitorProduct: vi.fn().mockResolvedValue(undefined),
  createReverseEngineeringAnalysis: vi.fn().mockResolvedValue({ id: 'test-analysis-id' })
}));

describe('Reverse Engineering Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('translatePerformanceClaims', () => {
    it('should throw error when marketing claims array is empty', async () => {
      // Import fresh module after mocks are set up
      const { translatePerformanceClaims } = await import('./reverseEngineering');
      
      await expect(
        translatePerformanceClaims(
          'TestProduct',
          'TestManufacturer',
          [], // Empty claims
          'industrial-coatings'
        )
      ).rejects.toThrow('Cannot translate performance claims: marketing claims array is empty');
    });

    it('should call LLM twice for two-phase approach', async () => {
      // Phase 1: Text analysis response
      mockInvokeLLM.mockResolvedValueOnce({
        choices: [{
          message: {
            content: `**1. Superior corrosion resistance:**
- Salt Spray Resistance: 1000 hours (ASTM B117) [Confidence: 0.85]

**Test Methods:** ASTM B117
**Critical Properties:** Corrosion Resistance`
          }
        }]
      });

      // Phase 2: JSON structuring response
      mockInvokeLLM.mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify({
              parameters: [
                { name: 'Salt Spray Resistance', value: '1000', unit: 'hours (ASTM B117)', confidence: 0.85 }
              ],
              testMethods: ['ASTM B117'],
              specifications: [],
              criticalProperties: ['Corrosion Resistance']
            })
          }
        }]
      });

      const { translatePerformanceClaims } = await import('./reverseEngineering');
      
      const result = await translatePerformanceClaims(
        'DuraCoat Pro 5000',
        'AkzoNobel',
        ['Superior corrosion resistance'],
        'industrial-coatings'
      );

      // Verify LLM was called twice (two-phase approach)
      expect(mockInvokeLLM).toHaveBeenCalledTimes(2);
      
      // Verify result structure
      expect(result).toHaveProperty('technicalParameters');
      expect(result).toHaveProperty('testMethods');
      expect(result).toHaveProperty('specifications');
      expect(result).toHaveProperty('criticalProperties');
    });

    it('should convert array parameters to object format', async () => {
      // Phase 1: Text response
      mockInvokeLLM.mockResolvedValueOnce({
        choices: [{
          message: { content: 'Technical analysis text' }
        }]
      });

      // Phase 2: Array-based JSON response
      mockInvokeLLM.mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify({
              parameters: [
                { name: 'Param1', value: '100', unit: 'units', confidence: 0.9 },
                { name: 'Param2', value: '200', unit: 'units', confidence: 0.8 }
              ],
              testMethods: ['ASTM A1'],
              specifications: [
                { name: 'Spec1', min: 50, max: 150, target: 100 }
              ],
              criticalProperties: ['Property1']
            })
          }
        }]
      });

      const { translatePerformanceClaims } = await import('./reverseEngineering');
      
      const result = await translatePerformanceClaims(
        'TestProduct',
        'TestManufacturer',
        ['Test claim'],
        'test-domain'
      );

      // Verify array was converted to object
      expect(typeof result.technicalParameters).toBe('object');
      expect(Array.isArray(result.technicalParameters)).toBe(false);
      expect(result.technicalParameters['Param1']).toBeDefined();
      expect(result.technicalParameters['Param1'].value).toBe('100');
      expect(result.technicalParameters['Param2'].value).toBe('200');

      // Verify specifications converted to object
      expect(typeof result.specifications).toBe('object');
      expect(result.specifications['Spec1']).toBeDefined();
      expect(result.specifications['Spec1'].target).toBe(100);
    });

    it('should use regex fallback when JSON parsing fails', async () => {
      // Phase 1: Text with extractable test methods
      mockInvokeLLM.mockResolvedValueOnce({
        choices: [{
          message: {
            content: `Analysis using ASTM B117 and ASTM D3359 test methods.
Critical Properties: Corrosion Resistance, Adhesion`
          }
        }]
      });

      // Phase 2: Invalid JSON
      mockInvokeLLM.mockResolvedValueOnce({
        choices: [{
          message: { content: 'Invalid JSON {' }
        }]
      });

      const { translatePerformanceClaims } = await import('./reverseEngineering');
      
      const result = await translatePerformanceClaims(
        'TestProduct',
        'TestManufacturer',
        ['Test claim'],
        'test-domain'
      );

      // Should still return valid structure with regex-extracted data
      expect(result).toHaveProperty('technicalParameters');
      expect(result).toHaveProperty('testMethods');
      expect(result).toHaveProperty('criticalProperties');
      
      // Should have extracted ASTM methods via regex
      expect(result.testMethods.some(m => m.includes('B117'))).toBe(true);
    });
  });

  describe('generateFormulationStrategy', () => {
    it('should return properly structured formulation strategy', async () => {
      mockInvokeLLM.mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify({
              recommendedApproach: 'Use epoxy-polyamide system',
              keyIngredientCategories: [
                {
                  category: 'Binder',
                  purpose: 'Film formation',
                  typicalPercentage: '30-40%',
                  examples: ['Epoxy resin']
                }
              ],
              processingConsiderations: ['Mix ratio critical'],
              potentialChallenges: ['Yellowing'],
              alternativeApproaches: ['Consider polyurethane']
            })
          }
        }]
      });

      const { generateFormulationStrategy } = await import('./reverseEngineering');
      
      const result = await generateFormulationStrategy(
        'DuraCoat Pro 5000',
        'AkzoNobel',
        { 'Salt Spray Resistance': { value: '1000', unit: 'hours' } },
        'industrial-coatings'
      );

      expect(result).toHaveProperty('recommendedApproach');
      expect(result).toHaveProperty('keyIngredientCategories');
      expect(result.keyIngredientCategories.length).toBeGreaterThan(0);
      expect(result.keyIngredientCategories[0]).toHaveProperty('category');
      expect(result.keyIngredientCategories[0]).toHaveProperty('examples');
    });
  });

  describe('generateTargetProductProfile', () => {
    it('should return properly structured TPP', async () => {
      mockInvokeLLM.mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify({
              productName: 'NextGen Coating',
              targetMarket: 'Industrial',
              performanceRequirements: { 'Salt Spray': '>1200 hours' },
              physicalProperties: { 'Gloss': '>85 GU' },
              chemicalProperties: { 'VOC': '<100 g/L' },
              applicationProperties: { 'Pot Life': '6-8 hours' },
              regulatoryRequirements: ['EPA VOC limits'],
              costTarget: '10-15% lower',
              competitiveAdvantages: ['Better UV stability']
            })
          }
        }]
      });

      const { generateTargetProductProfile } = await import('./reverseEngineering');
      
      const result = await generateTargetProductProfile(
        'DuraCoat Pro 5000',
        'AkzoNobel',
        ['Superior corrosion resistance'],
        { 'Salt Spray Resistance': { value: '1000', unit: 'hours' } },
        'industrial-coatings'
      );

      expect(result).toHaveProperty('productName');
      expect(result).toHaveProperty('targetMarket');
      expect(result).toHaveProperty('performanceRequirements');
      expect(result).toHaveProperty('regulatoryRequirements');
      expect(result.regulatoryRequirements.length).toBeGreaterThan(0);
      expect(result).toHaveProperty('competitiveAdvantages');
    });
  });
});
