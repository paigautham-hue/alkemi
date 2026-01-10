/**
 * Simplified Demo Data Seeding
 * 
 * Creates basic demo data to showcase platform features
 */

import * as db from "./db";

export async function seedDemoDataSimple(organizationId: string, userId: string): Promise<{ success: boolean; message: string }> {
  try {
    console.log("🌱 Starting simplified demo data seeding...");

    // 0. Get or create default domain
    console.log("🏷️ Setting up domain...");
    const domainId = await db.getOrCreateDefaultDomain(organizationId);
    console.log(`Using domain: ${domainId}`);

    // 1. Seed Suppliers (5 companies)
    console.log("📦 Seeding suppliers...");
    const supplier1 = await db.createSupplier({
      organizationId,
      name: "BASF Chemical Solutions",
      code: "BASF-001",
      contactEmail: "sales@basf-demo.com",
      country: "US",
      qualificationStatus: "qualified",
    });

    const supplier2 = await db.createSupplier({
      organizationId,
      name: "Dow Chemical Company",
      code: "DOW-002",
      contactEmail: "orders@dow-demo.com",
      country: "US",
      qualificationStatus: "qualified",
    });

    const supplier3 = await db.createSupplier({
      organizationId,
      name: "Evonik Industries",
      code: "EVONIK-003",
      contactEmail: "contact@evonik-demo.com",
      country: "DE",
      qualificationStatus: "qualified",
    });

    // 2. Seed Materials (20+ items)
    console.log("🧪 Seeding materials...");
    const material1 = await db.createMaterial({
      organizationId,
      domainId,
      name: "Epoxy Resin DER 331",
      code: "RESIN-EP-001",
      casNumber: "25068-38-6",
      category: "Resin",
      supplierId: supplier1,
      viscosity: "12000",
      density: "1.16",
    });

    const material2 = await db.createMaterial({
      organizationId,
      domainId,
      name: "Acrylic Resin AC-2000",
      code: "RESIN-AC-002",
      casNumber: "25133-97-5",
      category: "Resin",
      supplierId: supplier2,
      viscosity: "5000",
      density: "1.05",
    });

    const material3 = await db.createMaterial({
      organizationId,
      domainId,
      name: "Titanium Dioxide R-706",
      code: "PIG-TIO2-001",
      casNumber: "13463-67-7",
      category: "Pigment",
      supplierId: supplier3,
      density: "4.23",
    });

    const material4 = await db.createMaterial({
      organizationId,
      domainId,
      name: "Butyl Acetate",
      code: "SOLV-BA-001",
      casNumber: "123-86-4",
      category: "Solvent",
      supplierId: supplier1,
      viscosity: "0.7",
      density: "0.88",
    });

    const material5 = await db.createMaterial({
      organizationId,
      domainId,
      name: "BYK-333 Wetting Agent",
      code: "ADD-WET-001",
      casNumber: "proprietary",
      category: "Additive",
      supplierId: supplier2,
      viscosity: "150",
      density: "0.95",
    });

    // 3. Seed Formulation Families (3 families)
    console.log("⚗️ Seeding formulations...");
    const family1 = await db.createFormulationFamily({
      organizationId,
      domainId,
      name: "Industrial Epoxy Coating",
      code: "IND-EP-100",
      description: "High-performance epoxy coating for industrial equipment",
      targetApplication: "Industrial equipment, metal structures",
      confidentialityLevel: "internal",
    });

    const family2 = await db.createFormulationFamily({
      organizationId,
      domainId,
      name: "Architectural Acrylic Paint",
      code: "ARCH-AC-200",
      description: "Water-based acrylic paint for walls",
      targetApplication: "Residential and commercial buildings",
      confidentialityLevel: "public",
    });

    const family3 = await db.createFormulationFamily({
      organizationId,
      domainId,
      name: "Automotive Clear Coat",
      code: "AUTO-PU-300",
      description: "High-gloss polyurethane clear coat",
      targetApplication: "Automotive refinishing",
      confidentialityLevel: "confidential",
    });

    // 4. Create formulation versions
    console.log("⚙️ Seeding formulation versions...");
    const version1 = await db.createFormulationVersion({
      organizationId,
      familyId: family1,
      versionNumber: "1.0",
      branchType: null,
      status: "approved",
      createdBy: userId,
    });

    const version2 = await db.createFormulationVersion({
      organizationId,
      familyId: family2,
      versionNumber: "1.0",
      branchType: null,
      status: "approved",
      createdBy: userId,
    });

    const version3 = await db.createFormulationVersion({
      organizationId,
      familyId: family3,
      versionNumber: "1.0",
      branchType: null,
      status: "draft",
      createdBy: userId,
    });

    // Add version 2.0 for Industrial Epoxy Coating (for comparison testing)
    const version1_v2 = await db.createFormulationVersion({
      organizationId,
      familyId: family1, // Industrial Epoxy Coating family (family1)
      versionNumber: "2.0",
      parentVersionId: version1,
      branchType: "revision",
      status: "draft",
      createdBy: userId,
    });

    // 4.5 Add formulation components (materials in each formulation)
    console.log("🧪 Seeding formulation components...");
    // Industrial Epoxy Coating composition
    await db.createFormulationComponent({
      organizationId,
      versionId: version1,
      materialId: material1, // Epoxy Resin DER 331
      percentage: "60.0",
      role: "base",
    });
    await db.createFormulationComponent({
      organizationId,
      versionId: version1,
      materialId: material3, // Titanium Dioxide R-706
      percentage: "15.0",
      role: "pigment",
    });
    await db.createFormulationComponent({
      organizationId,
      versionId: version1,
      materialId: material4, // Butyl Acetate
      percentage: "20.0",
      role: "solvent",
    });
    await db.createFormulationComponent({
      organizationId,
      versionId: version1,
      materialId: material5, // BYK-333 Wetting Agent
      percentage: "5.0",
      role: "additive",
    });

    // Architectural Acrylic Paint composition
    await db.createFormulationComponent({
      organizationId,
      versionId: version2,
      materialId: material2, // Acrylic Resin AC-2000
      percentage: "50.0",
      role: "base",
    });
    await db.createFormulationComponent({
      organizationId,
      versionId: version2,
      materialId: material3, // Titanium Dioxide R-706
      percentage: "25.0",
      role: "pigment",
    });
    await db.createFormulationComponent({
      organizationId,
      versionId: version2,
      materialId: material5, // BYK-333 Wetting Agent
      percentage: "2.0",
      role: "additive",
    });
    await db.createFormulationComponent({
      organizationId,
      versionId: version2,
      materialId: material4, // Butyl Acetate
      percentage: "23.0",
      role: "solvent",
    });

    // Automotive Clear Coat composition (draft - incomplete)
    await db.createFormulationComponent({
      organizationId,
      versionId: version3,
      materialId: material1, // Epoxy Resin DER 331
      percentage: "70.0",
      role: "base",
    });
    await db.createFormulationComponent({
      organizationId,
      versionId: version3,
      materialId: material4, // Butyl Acetate
      percentage: "30.0",
      role: "solvent",
    });

    // Industrial Epoxy Coating v2.0 composition (modified formulation)
    await db.createFormulationComponent({
      organizationId,
      versionId: version1_v2,
      materialId: material1, // Epoxy Resin DER 331 - increased from 60% to 65%
      percentage: "65.0",
      role: "base",
    });
    await db.createFormulationComponent({
      organizationId,
      versionId: version1_v2,
      materialId: material3, // Titanium Dioxide R-706 - reduced from 15% to 10%
      percentage: "10.0",
      role: "pigment",
    });
    await db.createFormulationComponent({
      organizationId,
      versionId: version1_v2,
      materialId: material4, // Butyl Acetate - reduced from 20% to 18%
      percentage: "18.0",
      role: "solvent",
    });
    await db.createFormulationComponent({
      organizationId,
      versionId: version1_v2,
      materialId: material5, // BYK-333 Wetting Agent - increased from 5% to 7%
      percentage: "7.0",
      role: "additive",
    });

    // 5. Add multiple test condition sets
    console.log("🧪 Seeding test conditions...");
    const testConditionSet1 = await db.createTestConditionSet({
      organizationId,
      domainId,
      name: "Standard Testing Conditions",
      description: "Room temperature testing",
      isStandard: true,
      createdBy: userId,
      parameters: [
        { parameterName: "temperature", parameterValue: "25", unit: "°C" },
        { parameterName: "humidity", parameterValue: "50", unit: "%" },
      ],
    });

    const testConditionSet2 = await db.createTestConditionSet({
      organizationId,
      domainId,
      name: "UV Exposure Testing",
      description: "Accelerated weathering with UV exposure",
      isStandard: false,
      createdBy: userId,
      parameters: [
        { parameterName: "uv_intensity", parameterValue: "340", unit: "nm" },
        { parameterName: "exposure_time", parameterValue: "1000", unit: "hours" },
        { parameterName: "temperature", parameterValue: "60", unit: "°C" },
      ],
    });

    const testConditionSet3 = await db.createTestConditionSet({
      organizationId,
      domainId,
      name: "High Temperature Testing",
      description: "Thermal stability testing",
      isStandard: false,
      createdBy: userId,
      parameters: [
        { parameterName: "temperature", parameterValue: "80", unit: "°C" },
        { parameterName: "duration", parameterValue: "168", unit: "hours" },
      ],
    });

    // 6. Add predictions for formulations
    console.log("🔮 Seeding predictions...");
    // Standard conditions predictions for version1
    await db.createPrediction({
      organizationId,
      formulationVersionId: version1,
      testConditionSetId: testConditionSet1,
      propertyName: "viscosity",
      predictedValue: 2500,
      unit: "cP",
      confidenceLevel: 0.92,
      uncertaintyLower: 2300,
      uncertaintyUpper: 2700,
      modelName: "hybrid_model",
      modelVersion: "1.0",
      requestedBy: userId,
      featureImportance: [
        { featureName: "resin_content", importance: 0.45, contribution: 112.5 },
        { featureName: "solvent_ratio", importance: 0.32, contribution: 80.0 },
        { featureName: "temperature", importance: 0.23, contribution: 57.5 },
      ],
    });

    await db.createPrediction({
      organizationId,
      formulationVersionId: version1,
      testConditionSetId: testConditionSet1,
      propertyName: "density",
      predictedValue: 1.05,
      unit: "g/cm³",
      confidenceLevel: 0.88,
      uncertaintyLower: 1.02,
      uncertaintyUpper: 1.08,
      modelName: "physics_model",
      modelVersion: "1.0",
      requestedBy: userId,
      featureImportance: [
        { featureName: "component_density", importance: 0.78, contribution: 0.82 },
        { featureName: "mixing_ratio", importance: 0.22, contribution: 0.23 },
      ],
    });

    // UV exposure predictions for version1
    await db.createPrediction({
      organizationId,
      formulationVersionId: version1,
      testConditionSetId: testConditionSet2,
      propertyName: "color_retention",
      predictedValue: 85,
      unit: "%",
      confidenceLevel: 0.76,
      uncertaintyLower: 78,
      uncertaintyUpper: 92,
      modelName: "ml_predictor",
      modelVersion: "2.1",
      requestedBy: userId,
      featureImportance: [
        { featureName: "pigment_type", importance: 0.52, contribution: 44.2 },
        { featureName: "uv_stabilizer", importance: 0.31, contribution: 26.4 },
        { featureName: "resin_type", importance: 0.17, contribution: 14.4 },
      ],
    });

    // Standard conditions predictions for version2
    await db.createPrediction({
      organizationId,
      formulationVersionId: version2,
      testConditionSetId: testConditionSet1,
      propertyName: "viscosity",
      predictedValue: 1800,
      unit: "cP",
      confidenceLevel: 0.94,
      uncertaintyLower: 1700,
      uncertaintyUpper: 1900,
      modelName: "hybrid_model",
      modelVersion: "1.0",
      requestedBy: userId,
      featureImportance: [
        { featureName: "acrylic_content", importance: 0.51, contribution: 918.0 },
        { featureName: "solvent_type", importance: 0.29, contribution: 522.0 },
        { featureName: "additive_ratio", importance: 0.20, contribution: 360.0 },
      ],
    });

    // High temperature predictions for version2
    await db.createPrediction({
      organizationId,
      formulationVersionId: version2,
      testConditionSetId: testConditionSet3,
      propertyName: "thermal_stability",
      predictedValue: 92,
      unit: "%",
      confidenceLevel: 0.81,
      uncertaintyLower: 87,
      uncertaintyUpper: 97,
      modelName: "thermal_model",
      modelVersion: "1.5",
      requestedBy: userId,
      featureImportance: [
        { featureName: "resin_tg", importance: 0.62, contribution: 57.0 },
        { featureName: "crosslink_density", importance: 0.38, contribution: 35.0 },
      ],
    });

    // 7. Add trials with measurements
    console.log("📊 Seeding trials...");
    // Trial 1: Standard conditions for version1 - PASS
    await db.createTrial({
      organizationId,
      formulationVersionId: version1,
      testConditionSetId: testConditionSet1,
      trialCode: "TRIAL-001",
      conductedBy: userId,
      conductedAt: new Date(Date.now() - 86400000),
      notes: "Excellent agreement with predictions. All properties within spec.",
      measurements: [
        {
          propertyName: "viscosity",
          measuredValue: "2480",
          unit: "cP",
        },
        {
          propertyName: "density",
          measuredValue: "1.052",
          unit: "g/cm³",
        },
      ],
    });

    // Trial 2: UV exposure for version1 - PASS
    await db.createTrial({
      organizationId,
      formulationVersionId: version1,
      testConditionSetId: testConditionSet2,
      trialCode: "TRIAL-002",
      conductedBy: userId,
      conductedAt: new Date(Date.now() - 172800000),
      notes: "Good UV resistance. Color retention within acceptable range.",
      measurements: [
        {
          propertyName: "color_retention",
          measuredValue: "87",
          unit: "%",
        },
      ],
    });

    // Trial 3: Standard conditions for version2 - PASS
    await db.createTrial({
      organizationId,
      formulationVersionId: version2,
      testConditionSetId: testConditionSet1,
      trialCode: "TRIAL-003",
      conductedBy: userId,
      conductedAt: new Date(Date.now() - 259200000),
      notes: "Acrylic formulation performs as expected.",
      measurements: [
        {
          propertyName: "viscosity",
          measuredValue: "1820",
          unit: "cP",
        },
      ],
    });

    // Trial 4: High temperature for version2 - FAIL (needs revision)
    await db.createTrial({
      organizationId,
      formulationVersionId: version2,
      testConditionSetId: testConditionSet3,
      trialCode: "TRIAL-004",
      conductedBy: userId,
      conductedAt: new Date(Date.now() - 345600000),
      notes: "Thermal stability below target. Recommend adding heat stabilizer.",
      measurements: [
        {
          propertyName: "thermal_stability",
          measuredValue: "84",
          unit: "%",
          measurementError: "8",
        },
      ],
    });

    // 8. Activate compliance template
    console.log("🛡️ Activating compliance rules...");
    const { activateComplianceTemplate } = await import("./complianceTemplates");
    const complianceResult = await activateComplianceTemplate("fda-cosmetics-2024", organizationId);

    console.log("✅ Demo data seeding completed!");
    console.log(`Created: 3 suppliers, 5 materials, 3 formulations with components, 3 test condition sets, 5 predictions, 4 trials, ${complianceResult.rulesCreated} compliance rules`);

    return {
      success: true,
      message: `Comprehensive demo data created! Includes 3 suppliers, 5 materials, 3 formulations with realistic compositions (totaling 100%), 3 test condition sets (standard, UV, high-temp), 5 predictions with confidence intervals, 4 trials with measurements, and ${complianceResult.rulesCreated} FDA compliance rules.`,
    };
  } catch (error) {
    console.error("❌ Error seeding demo data:", error);
    return {
      success: false,
      message: `Failed to seed demo data: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
