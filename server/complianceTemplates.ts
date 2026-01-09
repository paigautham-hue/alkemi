/**
 * Compliance Rule Templates
 * 
 * Pre-configured compliance rules for major regulations
 */

export interface ComplianceTemplate {
  id: string;
  name: string;
  jurisdiction: string;
  description: string;
  sourceUrl: string;
  rules: Array<{
    ruleName: string;
    ruleType: "banned_substance" | "concentration_limit" | "total_limit" | "required_component" | "incompatible_combination";
    ruleLogic: any;
    severity: "error" | "warning" | "info";
    explanation: string;
  }>;
}

export const COMPLIANCE_TEMPLATES: ComplianceTemplate[] = [
  {
    id: "fda-cosmetics-2024",
    name: "FDA Cosmetics Regulations",
    jurisdiction: "United States",
    description: "FDA regulations for cosmetic products including prohibited ingredients and labeling requirements",
    sourceUrl: "https://www.fda.gov/cosmetics",
    rules: [
      {
        ruleName: "Lead Acetate Ban",
        ruleType: "banned_substance",
        ruleLogic: {
          substanceCAS: "301-04-2",
          substanceName: "Lead Acetate",
        },
        severity: "error",
        explanation: "Lead acetate is prohibited in cosmetics except as a color additive in hair dyes (21 CFR 73.2396)",
      },
      {
        ruleName: "Mercury Compounds Ban",
        ruleType: "banned_substance",
        ruleLogic: {
          substanceName: "Mercury",
          casPattern: "7439-97-6",
        },
        severity: "error",
        explanation: "Mercury compounds are prohibited except as preservatives in eye area cosmetics at ≤65 ppm (21 CFR 700.13)",
      },
      {
        ruleName: "Methanol Limit",
        ruleType: "concentration_limit",
        ruleLogic: {
          substanceCAS: "67-56-1",
          substanceName: "Methanol",
          maxConcentration: 0.2,
          unit: "percent",
        },
        severity: "error",
        explanation: "Methanol limited to 0.2% as denaturant in alcohol-based products",
      },
      {
        ruleName: "Formaldehyde Limit",
        ruleType: "concentration_limit",
        ruleLogic: {
          substanceCAS: "50-00-0",
          substanceName: "Formaldehyde",
          maxConcentration: 0.2,
          unit: "percent",
        },
        severity: "warning",
        explanation: "Formaldehyde as preservative should not exceed 0.2% (0.074% free formaldehyde)",
      },
    ],
  },
  {
    id: "eu-cosmetics-1223-2009",
    name: "EU Cosmetics Regulation 1223/2009",
    jurisdiction: "European Union",
    description: "EU Cosmetics Regulation including Annex II (prohibited substances) and Annex III (restricted substances)",
    sourceUrl: "https://ec.europa.eu/growth/sectors/cosmetics/legislation_en",
    rules: [
      {
        ruleName: "Phthalates Ban (Annex II)",
        ruleType: "banned_substance",
        ruleLogic: {
          substanceCAS: "84-74-2",
          substanceName: "Dibutyl Phthalate (DBP)",
        },
        severity: "error",
        explanation: "DBP and other phthalates (DEHP, BBP, DIBP) are banned in cosmetics under Annex II",
      },
      {
        ruleName: "Parabens Restriction (Annex V)",
        ruleType: "concentration_limit",
        ruleLogic: {
          substanceClass: "Paraben",
          maxConcentration: 0.4,
          unit: "percent",
        },
        severity: "warning",
        explanation: "Individual parabens limited to 0.4%, mixtures to 0.8% (as acid)",
      },
      {
        ruleName: "Hydroquinone Ban (Annex II)",
        ruleType: "banned_substance",
        ruleLogic: {
          substanceCAS: "123-31-9",
          substanceName: "Hydroquinone",
        },
        severity: "error",
        explanation: "Hydroquinone prohibited except in professional hair products ≤0.3% with warnings",
      },
      {
        ruleName: "Triclosan Restriction",
        ruleType: "concentration_limit",
        ruleLogic: {
          substanceCAS: "3380-34-5",
          substanceName: "Triclosan",
          maxConcentration: 0.3,
          unit: "percent",
        },
        severity: "warning",
        explanation: "Triclosan limited to 0.3% as preservative (Annex V)",
      },
      {
        ruleName: "Nanomaterials Declaration",
        ruleType: "required_component",
        ruleLogic: {
          propertyCheck: "nanomaterial",
          requiresLabeling: true,
        },
        severity: "info",
        explanation: "Products containing nanomaterials must be notified 6 months before marketing (Article 16)",
      },
      {
        ruleName: "CMR Substances Ban",
        ruleType: "banned_substance",
        ruleLogic: {
          cmrCategory: ["1A", "1B"],
        },
        severity: "error",
        explanation: "Carcinogenic, Mutagenic, or Reprotoxic (CMR) category 1A/1B substances are prohibited (Article 15)",
      },
    ],
  },
  {
    id: "reach-svhc-2024",
    name: "REACH SVHC Candidate List",
    jurisdiction: "European Union",
    description: "Substances of Very High Concern (SVHC) requiring authorization under REACH Regulation",
    sourceUrl: "https://echa.europa.eu/candidate-list-table",
    rules: [
      {
        ruleName: "SVHC Concentration Threshold",
        ruleType: "concentration_limit",
        ruleLogic: {
          svhcList: true,
          maxConcentration: 0.1,
          unit: "percent",
        },
        severity: "warning",
        explanation: "SVHC substances >0.1% w/w require communication in supply chain (Article 33)",
      },
      {
        ruleName: "Lead Compounds Restriction",
        ruleType: "concentration_limit",
        ruleLogic: {
          substanceName: "Lead",
          elementSymbol: "Pb",
          maxConcentration: 0.05,
          unit: "percent",
        },
        severity: "error",
        explanation: "Lead and compounds restricted in consumer products (Annex XVII Entry 63)",
      },
      {
        ruleName: "Cadmium Ban",
        ruleType: "banned_substance",
        ruleLogic: {
          substanceName: "Cadmium",
          elementSymbol: "Cd",
        },
        severity: "error",
        explanation: "Cadmium and compounds prohibited in mixtures for consumer use (Annex XVII Entry 23)",
      },
      {
        ruleName: "Chromium VI Ban",
        ruleType: "banned_substance",
        ruleLogic: {
          substanceName: "Chromium VI",
          casPattern: "18540-29-9",
        },
        severity: "error",
        explanation: "Hexavalent chromium compounds prohibited in articles contacting skin (Annex XVII Entry 47)",
      },
      {
        ruleName: "Bisphenol A (BPA) Restriction",
        ruleType: "concentration_limit",
        ruleLogic: {
          substanceCAS: "80-05-7",
          substanceName: "Bisphenol A",
          maxConcentration: 0.02,
          unit: "percent",
        },
        severity: "warning",
        explanation: "BPA restricted in thermal paper >0.02% w/w (Annex XVII Entry 66)",
      },
      {
        ruleName: "Phthalates in Consumer Products",
        ruleType: "concentration_limit",
        ruleLogic: {
          substanceClass: "Phthalate",
          maxConcentration: 0.1,
          unit: "percent",
        },
        severity: "error",
        explanation: "DEHP, DBP, BBP restricted >0.1% in consumer articles (Annex XVII Entry 51)",
      },
    ],
  },
  {
    id: "reach-restricted-substances",
    name: "REACH Annex XVII Restrictions",
    jurisdiction: "European Union",
    description: "Restrictions on manufacturing, placing on market and use of certain dangerous substances",
    sourceUrl: "https://echa.europa.eu/substances-restricted-under-reach",
    rules: [
      {
        ruleName: "Asbestos Complete Ban",
        ruleType: "banned_substance",
        ruleLogic: {
          substanceName: "Asbestos",
          casPattern: "1332-21-4",
        },
        severity: "error",
        explanation: "All forms of asbestos fibers completely banned (Annex XVII Entry 6)",
      },
      {
        ruleName: "Benzene Limit",
        ruleType: "concentration_limit",
        ruleLogic: {
          substanceCAS: "71-43-2",
          substanceName: "Benzene",
          maxConcentration: 0.1,
          unit: "percent",
        },
        severity: "error",
        explanation: "Benzene restricted to <0.1% w/w in substances and mixtures (Annex XVII Entry 5)",
      },
      {
        ruleName: "Nickel Release Limit",
        ruleType: "concentration_limit",
        ruleLogic: {
          substanceName: "Nickel",
          releaseRate: 0.5,
          unit: "μg/cm²/week",
        },
        severity: "warning",
        explanation: "Nickel release from articles in prolonged skin contact limited (Annex XVII Entry 27)",
      },
    ],
  },
  {
    id: "california-prop65",
    name: "California Proposition 65",
    jurisdiction: "California, USA",
    description: "Safe Drinking Water and Toxic Enforcement Act - chemicals known to cause cancer or reproductive harm",
    sourceUrl: "https://oehha.ca.gov/proposition-65",
    rules: [
      {
        ruleName: "Lead Warning Threshold",
        ruleType: "concentration_limit",
        ruleLogic: {
          substanceName: "Lead",
          maxConcentration: 0.5,
          unit: "μg/day",
        },
        severity: "warning",
        explanation: "Lead exposure >0.5 μg/day requires Prop 65 warning label",
      },
      {
        ruleName: "Formaldehyde Warning",
        ruleType: "concentration_limit",
        ruleLogic: {
          substanceCAS: "50-00-0",
          substanceName: "Formaldehyde",
          maxConcentration: 40,
          unit: "μg/day",
        },
        severity: "warning",
        explanation: "Formaldehyde exposure >40 μg/day requires warning (known carcinogen)",
      },
      {
        ruleName: "Phthalates Warning",
        ruleType: "concentration_limit",
        ruleLogic: {
          substanceClass: "Phthalate",
          maxConcentration: 1000,
          unit: "ppm",
        },
        severity: "warning",
        explanation: "Phthalates (DEHP, DBP, BBP, DIDP, DnHP) >1000 ppm require reproductive harm warning",
      },
    ],
  },
];

/**
 * Activate a compliance template by creating all its rules in the database
 */
export async function activateComplianceTemplate(
  templateId: string,
  organizationId: string
): Promise<{ success: boolean; message: string; rulesCreated: number }> {
  const template = COMPLIANCE_TEMPLATES.find((t) => t.id === templateId);
  
  if (!template) {
    return {
      success: false,
      message: `Template ${templateId} not found`,
      rulesCreated: 0,
    };
  }

  try {
    const { getDb } = await import("./db");
    const dbConn = await getDb();
    if (!dbConn) {
      throw new Error("Database not available");
    }

    const { complianceSources, complianceDatasets, complianceRules } = await import("../drizzle/schema");

    // Create compliance source
    const sourceId = crypto.randomUUID();
    await dbConn.insert(complianceSources).values({
      id: sourceId,
      organizationId,
      name: template.name,
      sourceType: "regulation",
      jurisdiction: template.jurisdiction,
      url: template.sourceUrl,
      version: "2024.1",
      effectiveDate: new Date(),
    });

    // Create compliance dataset
    const datasetId = crypto.randomUUID();
    await dbConn.insert(complianceDatasets).values({
      id: datasetId,
      organizationId,
      sourceId: sourceId,
      datasetName: `${template.name} Rules`,
      datasetType: "regulation",
      data: {
        description: template.description,
        templateId: template.id,
      },
      version: "2024.1",
    });

    // Create all rules from template
    const ruleValues = template.rules.map((rule) => ({
      id: crypto.randomUUID(),
      organizationId,
      datasetId: datasetId,
      ruleName: rule.ruleName,
      ruleType: rule.ruleType,
      ruleLogic: rule.ruleLogic,
      severity: rule.severity,
      isActive: true,
      version: "1.0",
      metadata: {
        explanation: rule.explanation,
        templateId: template.id,
      },
    }));

    await dbConn.insert(complianceRules).values(ruleValues);

    return {
      success: true,
      message: `Successfully activated ${template.name} with ${template.rules.length} rules`,
      rulesCreated: template.rules.length,
    };
  } catch (error) {
    console.error("Error activating compliance template:", error);
    return {
      success: false,
      message: `Failed to activate template: ${error instanceof Error ? error.message : String(error)}`,
      rulesCreated: 0,
    };
  }
}

/**
 * Get all available compliance templates
 */
export function getAvailableTemplates(): ComplianceTemplate[] {
  return COMPLIANCE_TEMPLATES;
}
