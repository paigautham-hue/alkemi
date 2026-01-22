/**
 * Content Redaction Service Tests
 * 
 * Tests for sensitive data redaction before LLM calls
 */

import { describe, it, expect } from 'vitest';
import { contentRedactor } from './contentRedaction';

describe('ContentRedactor', () => {
  describe('redact - Material Codes', () => {
    it('should redact material codes', () => {
      const content = 'Use MAT-12345 and CHEM-ABC-001 in the formulation.';
      
      const result = contentRedactor.redact(content, { redactMaterialCodes: true });
      
      expect(result.wasRedacted).toBe(true);
      expect(result.redactedContent).not.toContain('MAT-12345');
      expect(result.redactedContent).not.toContain('CHEM-ABC-001');
      expect(result.redactedContent).toContain('MATERIAL_1');
      expect(result.redactedContent).toContain('MATERIAL_2');
      expect(result.redactions).toHaveLength(2);
      expect(result.redactions[0].type).toBe('material_code');
    });
    
    it('should not redact when disabled', () => {
      const content = 'Use MAT-12345 in the formulation.';
      
      const result = contentRedactor.redact(content, { redactMaterialCodes: false });
      
      expect(result.wasRedacted).toBe(false);
      expect(result.redactedContent).toContain('MAT-12345');
    });
  });
  
  describe('redact - Supplier Names', () => {
    it('should redact common supplier names', () => {
      const content = 'Purchase from BASF, Dow, and Sigma-Aldrich.';
      
      const result = contentRedactor.redact(content, { redactSupplierNames: true });
      
      expect(result.wasRedacted).toBe(true);
      expect(result.redactedContent).not.toContain('BASF');
      expect(result.redactedContent).not.toContain('Dow');
      expect(result.redactedContent).not.toContain('Sigma-Aldrich');
      expect(result.redactions.some(r => r.type === 'supplier_name')).toBe(true);
    });
    
    it('should handle case-insensitive supplier names', () => {
      const content = 'Purchase from basf and DOW.';
      
      const result = contentRedactor.redact(content, { redactSupplierNames: true });
      
      expect(result.wasRedacted).toBe(true);
      expect(result.redactedContent).not.toContain('basf');
      expect(result.redactedContent).not.toContain('DOW');
    });
  });
  
  describe('redact - Pricing', () => {
    it('should redact dollar amounts', () => {
      const content = 'Cost is $1,234.56 per kg.';
      
      const result = contentRedactor.redact(content, { redactPricing: true });
      
      expect(result.wasRedacted).toBe(true);
      expect(result.redactedContent).not.toContain('$1,234.56');
      expect(result.redactedContent).toContain('[PRICE_REDACTED]');
      expect(result.redactions[0].type).toBe('pricing');
    });
    
    it('should redact currency with unit', () => {
      const content = 'Price: 1234.56 USD and 5000 EUR.';
      
      const result = contentRedactor.redact(content, { redactPricing: true });
      
      expect(result.wasRedacted).toBe(true);
      expect(result.redactedContent).not.toContain('1234.56 USD');
      expect(result.redactedContent).not.toContain('5000 EUR');
    });
  });
  
  describe('redact - CAS Numbers', () => {
    it('should redact CAS numbers when enabled', () => {
      const content = 'CAS 123-45-6 and 7732-18-5 (water).';
      
      const result = contentRedactor.redact(content, { redactCASNumbers: true });
      
      expect(result.wasRedacted).toBe(true);
      expect(result.redactedContent).not.toContain('123-45-6');
      expect(result.redactedContent).not.toContain('7732-18-5');
      expect(result.redactedContent).toContain('CAS_1');
      expect(result.redactedContent).toContain('CAS_2');
    });
    
    it('should not redact CAS numbers by default', () => {
      const content = 'CAS 123-45-6';
      
      const result = contentRedactor.redact(content, { redactCASNumbers: false });
      
      expect(result.wasRedacted).toBe(false);
      expect(result.redactedContent).toContain('123-45-6');
    });
  });
  
  describe('redact - Custom Patterns', () => {
    it('should apply custom redaction rules', () => {
      const content = 'Our proprietary formula XYZ-999 is confidential.';
      
      const result = contentRedactor.redact(content, {
        customRedactions: [
          { pattern: /XYZ-\d+/g, replacement: '[PROPRIETARY]' },
        ],
      });
      
      expect(result.wasRedacted).toBe(true);
      expect(result.redactedContent).not.toContain('XYZ-999');
      expect(result.redactedContent).toContain('[PROPRIETARY]');
      expect(result.redactions[0].type).toBe('custom');
    });
  });
  
  describe('redact - Multiple Types', () => {
    it('should redact multiple types simultaneously', () => {
      const content = 'Use MAT-12345 from BASF at $100 per kg (CAS 123-45-6).';
      
      const result = contentRedactor.redact(content, {
        redactMaterialCodes: true,
        redactSupplierNames: true,
        redactPricing: true,
        redactCASNumbers: true,
      });
      
      expect(result.wasRedacted).toBe(true);
      expect(result.redactions.length).toBeGreaterThan(3);
      expect(result.redactions.some(r => r.type === 'material_code')).toBe(true);
      expect(result.redactions.some(r => r.type === 'supplier_name')).toBe(true);
      expect(result.redactions.some(r => r.type === 'pricing')).toBe(true);
      expect(result.redactions.some(r => r.type === 'cas_number')).toBe(true);
    });
  });
  
  describe('unredact', () => {
    it('should restore original values', () => {
      const original = 'Use MAT-12345 from BASF.';
      
      const redacted = contentRedactor.redact(original, {
        redactMaterialCodes: true,
        redactSupplierNames: true,
      });
      
      const unredacted = contentRedactor.unredact(
        redacted.redactedContent,
        redacted.redactions
      );
      
      expect(unredacted).toBe(original);
    });
  });
  
  describe('getRedactionSummary', () => {
    it('should return summary of redactions', () => {
      const result = contentRedactor.redact(
        'Use MAT-12345 from BASF at $100.',
        {
          redactMaterialCodes: true,
          redactSupplierNames: true,
          redactPricing: true,
        }
      );
      
      const summary = contentRedactor.getRedactionSummary(result);
      
      expect(summary).toContain('material_code');
      expect(summary).toContain('supplier_name');
      expect(summary).toContain('pricing');
    });
    
    it('should return "No redactions" for clean content', () => {
      const result = contentRedactor.redact('Clean content.');
      
      const summary = contentRedactor.getRedactionSummary(result);
      
      expect(summary).toBe('No redactions applied');
    });
  });
});
