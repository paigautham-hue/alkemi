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
  {
    id: "reach-svhc-restrictions",
    name: "REACH SVHC Restrictions",
    jurisdiction: "European Union",
    description: "REACH Regulation (EC) 1907/2006 - Substances of Very High Concern (SVHC) restrictions",
    sourceUrl: "https://echa.europa.eu/candidate-list-table",
    rules: [
      {
        ruleName: "Bis(2-ethylhexyl) phthalate (DEHP) Ban",
        ruleType: "banned_substance",
        ruleLogic: {
          substanceCAS: "117-81-7",
          substanceName: "DEHP",
        },
        severity: "error",
        explanation: "DEHP is an SVHC and restricted under REACH Annex XVII for consumer products",
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
        explanation: "BPA is an SVHC with restrictions in thermal paper and food contact materials",
      },
      {
        ruleName: "Cadmium Compounds Ban",
        ruleType: "banned_substance",
        ruleLogic: {
          substanceName: "Cadmium",
          casPattern: "7440-43-9",
        },
        severity: "error",
        explanation: "Cadmium and its compounds are restricted in mixtures and articles under REACH Annex XVII",
      },
    ],
  },
  {
    id: "voc-limits-coatings",
    name: "VOC Limits for Coatings",
    jurisdiction: "United States",
    description: "EPA VOC content limits for architectural and industrial maintenance coatings (40 CFR Part 59)",
    sourceUrl: "https://www.epa.gov/stationary-sources-air-pollution/architectural-coatings",
    rules: [
      {
        ruleName: "Flat Coating VOC Limit",
        ruleType: "total_limit",
        ruleLogic: {
          productCategory: "Flat Coating",
          maxVOC: 50,
          unit: "g/L",
        },
        severity: "error",
        explanation: "Flat coatings must not exceed 50 g/L VOC content (EPA Rule 2008)",
      },
      {
        ruleName: "Industrial Maintenance Coating VOC Limit",
        ruleType: "total_limit",
        ruleLogic: {
          productCategory: "Industrial Maintenance",
          maxVOC: 340,
          unit: "g/L",
        },
        severity: "error",
        explanation: "Industrial maintenance coatings must not exceed 340 g/L VOC content",
      },
      {
        ruleName: "High-Temperature Coating VOC Limit",
        ruleType: "total_limit",
        ruleLogic: {
          productCategory: "High-Temperature Coating",
          maxVOC: 420,
          unit: "g/L",
        },
        severity: "warning",
        explanation: "High-temperature coatings should not exceed 420 g/L VOC content",
      },
    ],
  },
  {
    id: "heavy-metals-restrictions",
    name: "Heavy Metals Restrictions",
    jurisdiction: "Global",
    description: "Comprehensive heavy metal restrictions for consumer products based on RoHS, CPSIA, and other regulations",
    sourceUrl: "https://www.cpsc.gov/Business--Manufacturing/Business-Education/Lead",
    rules: [
      {
        ruleName: "Lead Content Limit (CPSIA)",
        ruleType: "concentration_limit",
        ruleLogic: {
          substanceCAS: "7439-92-1",
          substanceName: "Lead",
          maxConcentration: 0.009,
          unit: "percent",
        },
        severity: "error",
        explanation: "Lead content in children's products must not exceed 100 ppm (0.01%) under CPSIA",
      },
      {
        ruleName: "Hexavalent Chromium Ban (RoHS)",
        ruleType: "banned_substance",
        ruleLogic: {
          substanceCAS: "18540-29-9",
          substanceName: "Chromium VI",
        },
        severity: "error",
        explanation: "Hexavalent chromium is restricted under RoHS Directive (EU) 2015/863",
      },
      {
        ruleName: "Mercury Content Limit",
        ruleType: "concentration_limit",
        ruleLogic: {
          substanceCAS: "7439-97-6",
          substanceName: "Mercury",
          maxConcentration: 0.0001,
          unit: "percent",
        },
        severity: "error",
        explanation: "Mercury content must not exceed 1 ppm in most consumer products",
      },
    ],
  },
  {
    id: "automotive-coatings-oem",
    name: "Automotive OEM Coating Standards",
    jurisdiction: "Global",
    description: "Industry standards for automotive original equipment manufacturer coatings",
    sourceUrl: "https://www.sae.org/standards/",
    rules: [
      {
        ruleName: "Corrosion Resistance Requirement",
        ruleType: "required_component",
        ruleLogic: {
          requiredProperty: "corrosion_resistance",
          minValue: 1000,
          unit: "hours_salt_spray",
        },
        severity: "warning",
        explanation: "Automotive coatings should pass 1000+ hours salt spray test per ASTM B117",
      },
      {
        ruleName: "Silicone Contamination Warning",
        ruleType: "incompatible_combination",
        ruleLogic: {
          substanceClass: "Silicone",
          incompatibleWith: "Automotive Clearcoat",
        },
        severity: "warning",
        explanation: "Silicone additives may cause cratering defects in automotive clearcoats",
      },
    ],
  },
  {
    id: "eupia-exclusion-2024",
    name: "EuPIA Exclusion Policy (Printing Inks)",
    jurisdiction: "European Union",
    description:
      "EuPIA Exclusion Policy for printing inks and related products: substances excluded from ink formulations, with emphasis on food-packaging (low-migration) applications",
    sourceUrl: "https://www.eupia.org/our-commitment/exclusion-policy/",
    rules: [
      {
        ruleName: "Michler's Ketone Ban",
        ruleType: "banned_substance",
        ruleLogic: {
          substanceCAS: "90-94-8",
          substanceName: "Michler's ketone",
        },
        severity: "error",
        explanation: "4,4'-Bis(dimethylamino)benzophenone is a CMR 1B carcinogen excluded under the EuPIA Exclusion Policy",
      },
      {
        ruleName: "Benzidine-based Colorants Ban",
        ruleType: "banned_substance",
        ruleLogic: {
          substanceName: "Benzidine",
          substanceCAS: "92-87-5",
        },
        severity: "error",
        explanation: "Benzidine and benzidine-based azo colorants are excluded (CMR; EuPIA Exclusion Policy §2)",
      },
      {
        ruleName: "ITX in Food Packaging Inks",
        ruleType: "banned_substance",
        ruleLogic: {
          substanceCAS: "5495-84-1",
          substanceName: "isopropylthioxanthone",
        },
        severity: "warning",
        explanation:
          "ITX is migration-notorious (2005 Nestlé infant-milk incidents). Not formally banned, but avoid in food-packaging inks; Swiss Ordinance SML applies. Flag any use for review.",
      },
      {
        ruleName: "Benzophenone in Food Packaging Inks",
        ruleType: "concentration_limit",
        ruleLogic: {
          substanceCAS: "119-61-9",
          substanceName: "Benzophenone",
          maxConcentration: 0.1,
          unit: "percent",
        },
        severity: "warning",
        explanation:
          "Benzophenone has an SML of 0.6 mg/kg food (with 4-MBP, EU 10/2011 + Swiss Ordinance). Screening threshold: any loading above 0.1% in food-packaging inks requires a migration assessment.",
      },
      {
        ruleName: "Toluene in Food Packaging Inks",
        ruleType: "banned_substance",
        ruleLogic: {
          substanceCAS: "108-88-3",
          substanceName: "Toluene",
        },
        severity: "error",
        explanation: "Toluene is banned in food-grade printing inks by FSSAI (India, 2021) and restricted under EuPIA guidance for food packaging",
      },
    ],
  },
  {
    id: "swiss-ordinance-annex10",
    name: "Swiss Ordinance Annex 10 (Food Packaging Inks)",
    jurisdiction: "Switzerland / EU food packaging",
    description:
      "SR 817.023.21 Annex 10: the positive list regime for food-packaging ink substances. Non-listed substances must not migrate at detectable levels (0.01 mg/kg). Screening rules for the highest-risk photoinitiators.",
    sourceUrl: "https://www.blv.admin.ch/",
    rules: [
      {
        ruleName: "Non-evaluated Photoinitiator Screening (4-MBP)",
        ruleType: "banned_substance",
        ruleLogic: {
          substanceCAS: "134-84-9",
          substanceName: "4-Methylbenzophenone",
        },
        severity: "warning",
        explanation: "4-MBP: 2009 cereal-packaging migration incidents; SML shared with benzophenone (0.6 mg/kg). Requires migration assessment for any food-contact use.",
      },
      {
        ruleName: "EDAB Migration Screening",
        ruleType: "concentration_limit",
        ruleLogic: {
          substanceCAS: "10287-53-3",
          substanceName: "ethyl 4-dimethylaminobenzoate",
          maxConcentration: 5,
          unit: "percent",
        },
        severity: "warning",
        explanation: "Amine synergist EDAB is Annex-10 listed with migration limits; loadings above ~5% typically fail low-migration targets without barrier",
      },
      {
        ruleName: "BPA-based Materials in Food Contact",
        ruleType: "banned_substance",
        ruleLogic: {
          substanceCAS: "80-05-7",
          substanceName: "Bisphenol A",
        },
        severity: "error",
        explanation: "BPA is banned in food-contact materials in several jurisdictions (EU 2024/3190 phase-out); avoid BPA-based raw materials in food-packaging coatings",
      },
    ],
  },
  {
    id: "mocra-2024",
    name: "US MoCRA Cosmetics Requirements",
    jurisdiction: "United States",
    description:
      "Modernization of Cosmetics Regulation Act (2022): facility registration, product listing, safety substantiation, fragrance allergen labeling. Ingredient screening rules for common MoCRA/FDA concerns.",
    sourceUrl: "https://www.fda.gov/cosmetics/cosmetics-laws-regulations/modernization-cosmetics-regulation-act-2022-mocra",
    rules: [
      {
        ruleName: "Formaldehyde in Hair Products (proposed ban)",
        ruleType: "banned_substance",
        ruleLogic: {
          substanceCAS: "50-00-0",
          substanceName: "Formaldehyde",
        },
        severity: "warning",
        explanation: "FDA has proposed banning formaldehyde and formaldehyde-releasing ingredients in hair-smoothing products under MoCRA authority",
      },
      {
        ruleName: "Methylene Glycol Screening",
        ruleType: "banned_substance",
        ruleLogic: {
          substanceCAS: "463-57-0",
          substanceName: "Methylene glycol",
        },
        severity: "warning",
        explanation: "Formaldehyde-releaser targeted by the same proposed MoCRA rule",
      },
      {
        ruleName: "DBP in Cosmetics",
        ruleType: "banned_substance",
        ruleLogic: {
          substanceCAS: "84-74-2",
          substanceName: "Dibutyl phthalate",
        },
        severity: "error",
        explanation: "DBP is banned in EU cosmetics and a US state-level restricted substance (e.g. CA Toxic-Free Cosmetics Act); avoid for any US/EU-market product",
      },
      {
        ruleName: "Lead Acetate Ban",
        ruleType: "banned_substance",
        ruleLogic: {
          substanceCAS: "301-04-2",
          substanceName: "Lead acetate",
        },
        severity: "error",
        explanation: "FDA repealed the lead acetate color-additive approval for hair dyes (2018); banned",
      },
      {
        ruleName: "PFAS Screening in Cosmetics",
        ruleType: "banned_substance",
        ruleLogic: {
          substanceName: "PFAS",
          substanceClass: "fluoro",
        },
        severity: "warning",
        explanation: "MoCRA mandates an FDA PFAS-in-cosmetics assessment; several states ban intentionally-added PFAS in cosmetics from 2025",
      },
    ],
  },
  {
    id: "food-contact-fda-fcn",
    name: "FDA Food Contact Notifications",
    jurisdiction: "United States",
    description: "FDA regulations for food contact substances (21 CFR 170-189)",
    sourceUrl: "https://www.fda.gov/food/food-ingredients-packaging/food-contact-substances-fcs",
    rules: [
      {
        ruleName: "BPA in Food Contact Ban",
        ruleType: "banned_substance",
        ruleLogic: {
          substanceCAS: "80-05-7",
          substanceName: "Bisphenol A",
          applicationArea: "Food Contact",
        },
        severity: "error",
        explanation: "BPA is banned in baby bottles and sippy cups (21 CFR 177.1580)",
      },
      {
        ruleName: "PFAS Restriction in Food Packaging",
        ruleType: "banned_substance",
        ruleLogic: {
          substanceClass: "PFAS",
          applicationArea: "Food Contact",
        },
        severity: "error",
        explanation: "Per- and polyfluoroalkyl substances (PFAS) are being phased out of food contact materials",
      },
      {
        ruleName: "Migration Limit for Coatings",
        ruleType: "total_limit",
        ruleLogic: {
          testType: "Overall Migration",
          maxMigration: 60,
          unit: "mg/kg",
        },
        severity: "warning",
        explanation: "Overall migration from food contact coatings should not exceed 60 mg/kg (EU 10/2011)",
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
