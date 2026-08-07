/**
 * Compliance Engine
 * 
 * Evaluates formulations against regulatory rules and compliance datasets
 */

import * as db from "./db";

export interface ComplianceRule {
  id: string;
  ruleName: string;
  ruleType: string;
  ruleLogic: Record<string, any>;
  severity: "info" | "warning" | "error" | "critical";
  isActive: boolean;
  version: string;
}

export interface ComplianceViolation {
  ruleId: string;
  ruleName: string;
  severity: "info" | "warning" | "error" | "critical";
  message: string;
  affectedComponents?: string[];
}

export interface ComplianceCheckResult {
  formulationVersionId: string;
  isCompliant: boolean;
  overallStatus: "compliant" | "warning" | "non_compliant";
  violations: ComplianceViolation[];
  checkedAt: Date;
  rulesChecked: number;
}

/**
 * Check formulation compliance against active rules
 */
export async function checkFormulationCompliance(
  organizationId: string,
  formulationVersionId: string
): Promise<ComplianceCheckResult> {
  const dbConn = await db.getDb();
  if (!dbConn) {
    throw new Error("Database connection not available");
  }

  const { 
    complianceRules, 
    complianceDatasets,
    formulationVersions,
    formulationComponents,
    materials 
  } = await import("../drizzle/schema");
  const { eq, and } = await import("drizzle-orm");

  // Get active compliance rules
  const rules = await dbConn
    .select()
    .from(complianceRules)
    .innerJoin(complianceDatasets, eq(complianceRules.datasetId, complianceDatasets.id))
    .where(
      and(
        eq(complianceRules.organizationId, organizationId),
        eq(complianceRules.isActive, true)
      )
    );

  // Get formulation details
  const [formulation] = await dbConn
    .select()
    .from(formulationVersions)
    .where(
      and(
        eq(formulationVersions.id, formulationVersionId),
        eq(formulationVersions.organizationId, organizationId)
      )
    );

  if (!formulation) {
    throw new Error("Formulation not found");
  }

  // Get formulation components with material details
  const components = await dbConn
    .select()
    .from(formulationComponents)
    .innerJoin(materials, eq(formulationComponents.materialId, materials.id))
    .where(eq(formulationComponents.versionId, formulationVersionId));

  const violations: ComplianceViolation[] = [];

  // Evaluate each rule
  for (const ruleRow of rules) {
    const rule = ruleRow.compliance_rules;
    const dataset = ruleRow.compliance_datasets;

    try {
      const violation = evaluateRule(rule, dataset, formulation, components);
      if (violation) {
        violations.push(violation);
      }
    } catch (error) {
      console.error(`Error evaluating rule ${rule.id}:`, error);
    }
  }

  // Determine overall status
  let overallStatus: "compliant" | "warning" | "non_compliant" = "compliant";
  const hasError = violations.some(v => v.severity === "error" || v.severity === "critical");
  const hasWarning = violations.some(v => v.severity === "warning");

  if (hasError) {
    overallStatus = "non_compliant";
  } else if (hasWarning) {
    overallStatus = "warning";
  }

  return {
    formulationVersionId,
    isCompliant: overallStatus === "compliant",
    overallStatus,
    violations,
    checkedAt: new Date(),
    rulesChecked: rules.length,
  };
}

/**
 * Evaluate a single compliance rule
 *
 * Exported for testing: the template↔engine contract test in
 * complianceEngine.test.ts evaluates every shipped template rule through this.
 */
export function evaluateRule(
  rule: any,
  dataset: any,
  formulation: any,
  components: any[]
): ComplianceViolation | null {
  const ruleLogic = rule.ruleLogic;

  switch (rule.ruleType) {
    case "banned_substance":
      return checkBannedSubstance(rule, ruleLogic, components);
    
    case "concentration_limit":
      return checkConcentrationLimit(rule, ruleLogic, components);
    
    case "total_limit":
      return checkTotalLimit(rule, ruleLogic, components);
    
    case "required_component":
      return checkRequiredComponent(rule, ruleLogic, components);
    
    case "incompatible_combination":
      return checkIncompatibleCombination(rule, ruleLogic, components);
    
    default:
      return null;
  }
}

/**
 * Read a component's concentration (wt%) from the formulation_components row.
 * The schema column is `percentage`; returns NaN-safe number or null when absent.
 */
function componentPercentage(c: any): number | null {
  const raw = c.formulation_components?.percentage;
  if (raw === undefined || raw === null) return null;
  const value = parseFloat(raw);
  return Number.isFinite(value) ? value : null;
}

/**
 * Check for banned substances
 *
 * Accepts both rule vocabularies:
 * - legacy engine form: { bannedCAS: string[], bannedNames: string[] }
 * - template form: { substanceCAS: string, substanceName: string, casPattern?: string, substanceClass?: string }
 */
function checkBannedSubstance(
  rule: any,
  ruleLogic: any,
  components: any[]
): ComplianceViolation | null {
  const bannedCAS: string[] = [
    ...(Array.isArray(ruleLogic.bannedCAS) ? ruleLogic.bannedCAS : []),
    ...(typeof ruleLogic.substanceCAS === "string" ? [ruleLogic.substanceCAS] : []),
    ...(typeof ruleLogic.casPattern === "string" ? [ruleLogic.casPattern] : []),
  ];
  const bannedNames: string[] = [
    ...(Array.isArray(ruleLogic.bannedNames) ? ruleLogic.bannedNames : []),
    ...(typeof ruleLogic.substanceName === "string" ? [ruleLogic.substanceName] : []),
    ...(typeof ruleLogic.substanceClass === "string" ? [ruleLogic.substanceClass] : []),
  ];

  // Rule shapes with no material-level identifier (e.g. cmrCategory) cannot be
  // evaluated against component data — skip rather than silently pass/fail.
  if (bannedCAS.length === 0 && bannedNames.length === 0) return null;

  const violatingComponents = components.filter(c => {
    const material = c.materials;
    return (material.casNumber && bannedCAS.includes(material.casNumber)) ||
           bannedNames.some((name: string) => material.name?.toLowerCase().includes(name.toLowerCase()));
  });

  if (violatingComponents.length > 0) {
    return {
      ruleId: rule.id,
      ruleName: rule.ruleName,
      severity: rule.severity,
      message: `Banned substance detected: ${violatingComponents.map((c: any) => c.materials.name).join(", ")}`,
      affectedComponents: violatingComponents.map((c: any) => c.materials.name),
    };
  }

  return null;
}

/**
 * Check concentration limits for specific substances
 */
function checkConcentrationLimit(
  rule: any,
  ruleLogic: any,
  components: any[]
): ComplianceViolation | null {
  const { substanceCAS, substanceName, substanceClass, maxConcentration } = ruleLogic;

  // Without a numeric limit or any substance identifier the rule cannot be evaluated.
  if (maxConcentration === undefined || maxConcentration === null) return null;
  if (!substanceCAS && !substanceName && !substanceClass) return null;

  const violatingComponents = components.filter(c => {
    const material = c.materials;
    const matches =
      (substanceCAS && material.casNumber === substanceCAS) ||
      (substanceName && material.name?.toLowerCase().includes(substanceName.toLowerCase())) ||
      (substanceClass && (
        material.name?.toLowerCase().includes(substanceClass.toLowerCase()) ||
        material.category?.toLowerCase().includes(substanceClass.toLowerCase())
      ));
    if (!matches) return false;
    const concentration = componentPercentage(c);
    return concentration !== null && concentration > maxConcentration;
  });

  if (violatingComponents.length > 0) {
    return {
      ruleId: rule.id,
      ruleName: rule.ruleName,
      severity: rule.severity,
      message: `Concentration limit exceeded: ${violatingComponents.map((c: any) =>
        `${c.materials.name} (${c.formulation_components.percentage}% > ${maxConcentration}%)`
      ).join(", ")}`,
      affectedComponents: violatingComponents.map((c: any) => c.materials.name),
    };
  }

  return null;
}

/**
 * Check total concentration limits for a class of substances
 */
function checkTotalLimit(
  rule: any,
  ruleLogic: any,
  components: any[]
): ComplianceViolation | null {
  const { substanceClass } = ruleLogic;
  const maxTotalConcentration = ruleLogic.maxTotalConcentration ?? ruleLogic.maxConcentration;

  // Product-level total limits (e.g. VOC g/L, migration mg/kg) carry no
  // substanceClass and cannot be evaluated as a component wt% sum — skip.
  if (!substanceClass || maxTotalConcentration === undefined || maxTotalConcentration === null) {
    return null;
  }

  const matchingComponents = components.filter(c => {
    const material = c.materials;
    // Simple keyword matching for substance class
    return material.name?.toLowerCase().includes(substanceClass.toLowerCase()) ||
           (material.category && material.category.toLowerCase().includes(substanceClass.toLowerCase()));
  });

  const totalConcentration = matchingComponents.reduce((sum, c) => {
    return sum + (componentPercentage(c) ?? 0);
  }, 0);

  if (totalConcentration > maxTotalConcentration) {
    return {
      ruleId: rule.id,
      ruleName: rule.ruleName,
      severity: rule.severity,
      message: `Total ${substanceClass} concentration exceeds limit: ${totalConcentration.toFixed(2)}% > ${maxTotalConcentration}%`,
      affectedComponents: matchingComponents.map((c: any) => c.materials.name),
    };
  }

  return null;
}

/**
 * Check for required components
 */
function checkRequiredComponent(
  rule: any,
  ruleLogic: any,
  components: any[]
): ComplianceViolation | null {
  const { requiredCAS, requiredName, minConcentration } = ruleLogic;

  // Property-check shapes (requiredProperty/propertyCheck) reference measured
  // product properties, not components — not evaluable here, skip.
  if (!requiredCAS && !requiredName) return null;

  const hasRequired = components.some(c => {
    const material = c.materials;
    const matches = (requiredCAS && material.casNumber === requiredCAS) ||
                   (requiredName && material.name?.toLowerCase().includes(requiredName.toLowerCase()));

    if (matches && minConcentration) {
      const concentration = componentPercentage(c);
      return concentration !== null && concentration >= minConcentration;
    }

    return matches;
  });

  if (!hasRequired) {
    return {
      ruleId: rule.id,
      ruleName: rule.ruleName,
      severity: rule.severity,
      message: `Required component missing: ${requiredName || requiredCAS}${minConcentration ? ` (min ${minConcentration}%)` : ""}`,
    };
  }

  return null;
}

/**
 * Check for incompatible combinations
 */
function checkIncompatibleCombination(
  rule: any,
  ruleLogic: any,
  components: any[]
): ComplianceViolation | null {
  // Accept legacy pair-array form and the template scalar form
  // ({ substanceClass, incompatibleWith }).
  let incompatiblePairs: Array<[string, string]> = [];
  if (Array.isArray(ruleLogic.incompatiblePairs)) {
    incompatiblePairs = ruleLogic.incompatiblePairs;
  } else if (ruleLogic.substanceClass && ruleLogic.incompatibleWith) {
    incompatiblePairs = [[ruleLogic.substanceClass, ruleLogic.incompatibleWith]];
  }
  if (incompatiblePairs.length === 0) return null;

  for (const pair of incompatiblePairs) {
    const [substance1, substance2] = pair;
    
    const has1 = components.some(c =>
      c.materials.casNumber === substance1 ||
      c.materials.name?.toLowerCase().includes(substance1.toLowerCase())
    );

    const has2 = components.some(c =>
      c.materials.casNumber === substance2 ||
      c.materials.name?.toLowerCase().includes(substance2.toLowerCase())
    );

    if (has1 && has2) {
      return {
        ruleId: rule.id,
        ruleName: rule.ruleName,
        severity: rule.severity,
        message: `Incompatible combination detected: ${substance1} and ${substance2} cannot be used together`,
        affectedComponents: [substance1, substance2],
      };
    }
  }

  return null;
}

/**
 * Get compliance status for multiple formulations
 */
export async function batchCheckCompliance(
  organizationId: string,
  formulationVersionIds: string[]
): Promise<Map<string, ComplianceCheckResult>> {
  const results = new Map<string, ComplianceCheckResult>();

  for (const versionId of formulationVersionIds) {
    try {
      const result = await checkFormulationCompliance(organizationId, versionId);
      results.set(versionId, result);
    } catch (error) {
      console.error(`Error checking compliance for ${versionId}:`, error);
    }
  }

  return results;
}
