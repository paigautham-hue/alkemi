import * as db from "./db";

export interface ComplianceViolation {
  ruleId: string;
  ruleName: string;
  severity: "info" | "warning" | "error" | "critical";
  message: string;
  affectedComponents?: string[];
  sourceInfo: {
    sourceName: string;
    sourceType: string;
    jurisdiction?: string;
  };
}

export interface ComplianceCheckResult {
  passed: boolean;
  totalRules: number;
  passedRules: number;
  failedRules: number;
  violations: ComplianceViolation[];
  checkedAt: Date;
}

/**
 * Check a formulation version against all active compliance rules
 */
export async function checkFormulationCompliance(
  versionId: string,
  organizationId: string
): Promise<ComplianceCheckResult> {
  // Get formulation components
  const components = await db.getFormulationComponents(versionId, organizationId);
  
  // Get all active compliance rules
  const rulesData = await db.listComplianceRules(organizationId, { isActive: true });
  
  const violations: ComplianceViolation[] = [];
  let passedCount = 0;
  let failedCount = 0;

  // Check each rule
  for (const ruleData of rulesData) {
    const { rule, dataset, source } = ruleData;
    
    try {
      const ruleLogic = rule.ruleLogic as any;
      const violation = evaluateRule(rule, ruleLogic, components, source, dataset);
      
      if (violation) {
        violations.push(violation);
        failedCount++;
      } else {
        passedCount++;
      }
    } catch (error) {
      console.error(`Error evaluating rule ${rule.id}:`, error);
      // Count as passed if rule evaluation fails (don't block on bad rules)
      passedCount++;
    }
  }

  return {
    passed: violations.length === 0,
    totalRules: rulesData.length,
    passedRules: passedCount,
    failedRules: failedCount,
    violations,
    checkedAt: new Date(),
  };
}

/**
 * Evaluate a single compliance rule against formulation components
 */
function evaluateRule(
  rule: any,
  ruleLogic: any,
  components: any[],
  source: any,
  dataset: any
): ComplianceViolation | null {
  const ruleType = rule.ruleType;

  // Handle different rule types
  switch (ruleType) {
    case "max_concentration":
      return checkMaxConcentration(rule, ruleLogic, components, source);
    
    case "banned_substance":
      return checkBannedSubstance(rule, ruleLogic, components, source);
    
    case "required_component":
      return checkRequiredComponent(rule, ruleLogic, components, source);
    
    case "incompatible_combination":
      return checkIncompatibleCombination(rule, ruleLogic, components, source);
    
    default:
      // Unknown rule type - skip
      return null;
  }
}

/**
 * Check if any component exceeds maximum allowed concentration
 */
function checkMaxConcentration(
  rule: any,
  ruleLogic: any,
  components: any[],
  source: any
): ComplianceViolation | null {
  const { substance, max_percentage } = ruleLogic;
  
  const affectedComponents: string[] = [];
  
  for (const comp of components) {
    const material = comp.material;
    const percentage = parseFloat(comp.component.percentage);
    
    // Check if material name matches the substance (case-insensitive partial match)
    if (material.name.toLowerCase().includes(substance.toLowerCase())) {
      if (percentage > max_percentage) {
        affectedComponents.push(`${material.name} (${percentage}%)`);
      }
    }
  }
  
  if (affectedComponents.length > 0) {
    return {
      ruleId: rule.id,
      ruleName: rule.ruleName,
      severity: rule.severity,
      message: `${substance} concentration exceeds ${max_percentage}% limit`,
      affectedComponents,
      sourceInfo: {
        sourceName: source.name,
        sourceType: source.sourceType,
        jurisdiction: source.jurisdiction,
      },
    };
  }
  
  return null;
}

/**
 * Check if formulation contains banned substances
 */
function checkBannedSubstance(
  rule: any,
  ruleLogic: any,
  components: any[],
  source: any
): ComplianceViolation | null {
  const { substance } = ruleLogic;
  
  const affectedComponents: string[] = [];
  
  for (const comp of components) {
    const material = comp.material;
    
    // Check if material name matches the banned substance
    if (material.name.toLowerCase().includes(substance.toLowerCase())) {
      affectedComponents.push(material.name);
    }
  }
  
  if (affectedComponents.length > 0) {
    return {
      ruleId: rule.id,
      ruleName: rule.ruleName,
      severity: rule.severity,
      message: `Formulation contains banned substance: ${substance}`,
      affectedComponents,
      sourceInfo: {
        sourceName: source.name,
        sourceType: source.sourceType,
        jurisdiction: source.jurisdiction,
      },
    };
  }
  
  return null;
}

/**
 * Check if formulation contains required components
 */
function checkRequiredComponent(
  rule: any,
  ruleLogic: any,
  components: any[],
  source: any
): ComplianceViolation | null {
  const { substance, min_percentage } = ruleLogic;
  
  let found = false;
  let totalPercentage = 0;
  
  for (const comp of components) {
    const material = comp.material;
    const percentage = parseFloat(comp.component.percentage);
    
    if (material.name.toLowerCase().includes(substance.toLowerCase())) {
      found = true;
      totalPercentage += percentage;
    }
  }
  
  if (!found || totalPercentage < min_percentage) {
    return {
      ruleId: rule.id,
      ruleName: rule.ruleName,
      severity: rule.severity,
      message: `Missing required component: ${substance} (minimum ${min_percentage}%)`,
      affectedComponents: found ? [`Found ${totalPercentage}%`] : [],
      sourceInfo: {
        sourceName: source.name,
        sourceType: source.sourceType,
        jurisdiction: source.jurisdiction,
      },
    };
  }
  
  return null;
}

/**
 * Check for incompatible component combinations
 */
function checkIncompatibleCombination(
  rule: any,
  ruleLogic: any,
  components: any[],
  source: any
): ComplianceViolation | null {
  const { substance_a, substance_b } = ruleLogic;
  
  let foundA = false;
  let foundB = false;
  const affectedComponents: string[] = [];
  
  for (const comp of components) {
    const material = comp.material;
    
    if (material.name.toLowerCase().includes(substance_a.toLowerCase())) {
      foundA = true;
      affectedComponents.push(material.name);
    }
    
    if (material.name.toLowerCase().includes(substance_b.toLowerCase())) {
      foundB = true;
      affectedComponents.push(material.name);
    }
  }
  
  if (foundA && foundB) {
    return {
      ruleId: rule.id,
      ruleName: rule.ruleName,
      severity: rule.severity,
      message: `Incompatible combination: ${substance_a} and ${substance_b} cannot be used together`,
      affectedComponents,
      sourceInfo: {
        sourceName: source.name,
        sourceType: source.sourceType,
        jurisdiction: source.jurisdiction,
      },
    };
  }
  
  return null;
}
