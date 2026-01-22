/**
 * Content Redaction Service
 * 
 * Protects sensitive data before sending to external LLM providers.
 * Prevents leakage of proprietary formulation details, supplier names, and pricing.
 * 
 * Based on Claude Opus 4.5 recommendations (Significant Issue #9)
 */

export interface RedactionResult {
  redactedContent: string;
  redactions: Array<{
    type: 'material_code' | 'supplier_name' | 'pricing' | 'cas_number' | 'custom';
    original: string;
    replacement: string;
  }>;
  wasRedacted: boolean;
}

export interface RedactionOptions {
  redactMaterialCodes?: boolean;
  redactSupplierNames?: boolean;
  redactPricing?: boolean;
  redactCASNumbers?: boolean;
  customRedactions?: Array<{ pattern: RegExp; replacement: string }>;
}

/**
 * Content Redaction Service
 */
export class ContentRedactor {
  /**
   * Redact sensitive information from content
   * 
   * Replaces sensitive data with generic placeholders while preserving
   * semantic meaning for LLM understanding.
   */
  redact(
    content: string,
    options: RedactionOptions = {}
  ): RedactionResult {
    const {
      redactMaterialCodes = true,
      redactSupplierNames = true,
      redactPricing = true,
      redactCASNumbers = false, // CAS numbers are public, but some orgs want them redacted
      customRedactions = [],
    } = options;
    
    let redactedContent = content;
    const redactions: RedactionResult['redactions'] = [];
    
    // 1. Redact Material Codes (e.g., "MAT-12345", "CHEM-ABC-001")
    if (redactMaterialCodes) {
      const materialCodePattern = /\b[A-Z]{2,6}-[A-Z0-9]{3,10}\b/g;
      const matches = content.match(materialCodePattern) || [];
      
      for (let i = 0; i < matches.length; i++) {
        const original = matches[i];
        const replacement = `MATERIAL_${i + 1}`;
        redactedContent = redactedContent.replace(original, replacement);
        redactions.push({
          type: 'material_code',
          original,
          replacement,
        });
      }
    }
    
    // 2. Redact Supplier Names (common chemical suppliers)
    if (redactSupplierNames) {
      const supplierPatterns = [
        /\b(BASF|Dow|DuPont|Evonik|Clariant|Huntsman|Arkema|Solvay|Eastman|Covestro)\b/gi,
        /\b(Sigma-Aldrich|Merck|TCI|Alfa Aesar|Fisher Scientific)\b/gi,
      ];
      
      let supplierIndex = 1;
      for (const pattern of supplierPatterns) {
        const matches = content.match(pattern) || [];
        
        for (const original of matches) {
          const replacement = `SUPPLIER_${supplierIndex++}`;
          redactedContent = redactedContent.replace(new RegExp(original, 'g'), replacement);
          redactions.push({
            type: 'supplier_name',
            original,
            replacement,
          });
        }
      }
    }
    
    // 3. Redact Pricing (currency amounts)
    if (redactPricing) {
      const pricingPatterns = [
        /\$\s*\d+(?:,\d{3})*(?:\.\d{2})?/g, // $1,234.56
        /\d+(?:,\d{3})*(?:\.\d{2})?\s*(?:USD|EUR|GBP|CNY)/gi, // 1234.56 USD
        /\d+(?:,\d{3})*(?:\.\d{2})?\s*(?:dollars?|euros?|pounds?)/gi, // 1234 dollars
      ];
      
      for (const pattern of pricingPatterns) {
        const matches = redactedContent.match(pattern) || [];
        
        for (const original of matches) {
          const replacement = '[PRICE_REDACTED]';
          redactedContent = redactedContent.replace(original, replacement);
          redactions.push({
            type: 'pricing',
            original,
            replacement,
          });
        }
      }
    }
    
    // 4. Redact CAS Numbers (e.g., "123-45-6")
    if (redactCASNumbers) {
      const casPattern = /\b\d{2,7}-\d{2}-\d\b/g;
      const matches = content.match(casPattern) || [];
      
      for (let i = 0; i < matches.length; i++) {
        const original = matches[i];
        const replacement = `CAS_${i + 1}`;
        redactedContent = redactedContent.replace(original, replacement);
        redactions.push({
          type: 'cas_number',
          original,
          replacement,
        });
      }
    }
    
    // 5. Custom Redactions (organization-specific)
    for (const custom of customRedactions) {
      const matches = content.match(custom.pattern) || [];
      
      for (const original of matches) {
        redactedContent = redactedContent.replace(original, custom.replacement);
        redactions.push({
          type: 'custom',
          original,
          replacement: custom.replacement,
        });
      }
    }
    
    return {
      redactedContent,
      redactions,
      wasRedacted: redactions.length > 0,
    };
  }
  
  /**
   * Unredact content (restore original values)
   * 
   * Used to restore redacted content in LLM responses
   */
  unredact(
    redactedContent: string,
    redactions: RedactionResult['redactions']
  ): string {
    let unredactedContent = redactedContent;
    
    // Apply redactions in reverse order to avoid conflicts
    for (const redaction of redactions.reverse()) {
      unredactedContent = unredactedContent.replace(
        new RegExp(redaction.replacement, 'g'),
        redaction.original
      );
    }
    
    return unredactedContent;
  }
  
  /**
   * Get redaction summary for audit logging
   */
  getRedactionSummary(result: RedactionResult): string {
    if (!result.wasRedacted) {
      return 'No redactions applied';
    }
    
    const counts: Record<string, number> = {};
    for (const redaction of result.redactions) {
      counts[redaction.type] = (counts[redaction.type] || 0) + 1;
    }
    
    const summary = Object.entries(counts)
      .map(([type, count]) => `${count} ${type}(s)`)
      .join(', ');
    
    return `Redacted: ${summary}`;
  }
}

// Export singleton instance
export const contentRedactor = new ContentRedactor();
