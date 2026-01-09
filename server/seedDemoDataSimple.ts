/**
 * Simplified Demo Data Seeding
 * 
 * Creates basic demo data to showcase platform features
 */

import * as db from "./db";

export async function seedDemoDataSimple(organizationId: string, userId: string): Promise<{ success: boolean; message: string }> {
  try {
    console.log("🌱 Starting simplified demo data seeding...");

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
      domainId: "default",
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
      domainId: "default",
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
      domainId: "default",
      name: "Titanium Dioxide R-706",
      code: "PIG-TIO2-001",
      casNumber: "13463-67-7",
      category: "Pigment",
      supplierId: supplier3,
      density: "4.23",
    });

    const material4 = await db.createMaterial({
      organizationId,
      domainId: "default",
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
      domainId: "default",
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
      domainId: "default",
      name: "Industrial Epoxy Coating",
      code: "IND-EP-100",
      description: "High-performance epoxy coating for industrial equipment",
      targetApplication: "Industrial equipment, metal structures",
      confidentialityLevel: "internal",
    });

    const family2 = await db.createFormulationFamily({
      organizationId,
      domainId: "default",
      name: "Architectural Acrylic Paint",
      code: "ARCH-AC-200",
      description: "Water-based acrylic paint for walls",
      targetApplication: "Residential and commercial buildings",
      confidentialityLevel: "public",
    });

    const family3 = await db.createFormulationFamily({
      organizationId,
      domainId: "default",
      name: "Automotive Clear Coat",
      code: "AUTO-PU-300",
      description: "High-gloss polyurethane clear coat",
      targetApplication: "Automotive refinishing",
      confidentialityLevel: "confidential",
    });

    // 4. Create formulation versions
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

    // 5. Add test condition set
    console.log("🧪 Seeding test conditions...");
    const testConditionSet1 = await db.createTestConditionSet({
      organizationId,
      domainId: "default",
      name: "Standard Testing Conditions",
      description: "Room temperature testing",
      isStandard: true,
      createdBy: userId,
      parameters: [
        { parameterName: "temperature", parameterValue: "25", unit: "°C" },
        { parameterName: "humidity", parameterValue: "50", unit: "%" },
      ],
    });

    // 6. Add predictions for formulations
    console.log("🔮 Seeding predictions...");
    await db.createPrediction({
      organizationId,
      formulationVersionId: version1,
      testConditionSetId: testConditionSet1,
      propertyName: "viscosity",
      predictedValue: 2500,
      unit: "cP",
      modelName: "hybrid_model",
      modelVersion: "1.0",
      requestedBy: userId,
      featureImportance: [],
    });

    await db.createPrediction({
      organizationId,
      formulationVersionId: version1,
      testConditionSetId: testConditionSet1,
      propertyName: "density",
      predictedValue: 1.05,
      unit: "g/cm³",
      modelName: "physics_model",
      modelVersion: "1.0",
      requestedBy: userId,
      featureImportance: [],
    });

    // 7. Add trials with measurements
    console.log("📊 Seeding trials...");
    await db.createTrial({
      organizationId,
      formulationVersionId: version1,
      testConditionSetId: testConditionSet1,
      trialCode: "TRIAL-001",
      conductedBy: "Demo User",
      conductedAt: new Date(Date.now() - 86400000),
      notes: "Demo trial showing excellent agreement with predictions",
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

    // 8. Activate compliance template
    console.log("🛡️ Activating compliance rules...");
    const { activateComplianceTemplate } = await import("./complianceTemplates");
    const complianceResult = await activateComplianceTemplate("fda-cosmetics-2024", organizationId);

    console.log("✅ Demo data seeding completed!");
    console.log(`Created: 3 suppliers, 5 materials, 3 formulations, 1 test condition set, 2 predictions, 1 trial, ${complianceResult.rulesCreated} compliance rules`);

    return {
      success: true,
      message: `Demo data created successfully! Includes 3 suppliers, 5 materials, 3 formulations, predictions, trials, and ${complianceResult.rulesCreated} FDA compliance rules.`,
    };
  } catch (error) {
    console.error("❌ Error seeding demo data:", error);
    return {
      success: false,
      message: `Failed to seed demo data: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
