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
      country: "United States",
      qualificationStatus: "qualified",
    });

    const supplier2 = await db.createSupplier({
      organizationId,
      name: "Dow Chemical Company",
      code: "DOW-002",
      contactEmail: "orders@dow-demo.com",
      country: "United States",
      qualificationStatus: "qualified",
    });

    const supplier3 = await db.createSupplier({
      organizationId,
      name: "Evonik Industries",
      code: "EVONIK-003",
      contactEmail: "contact@evonik-demo.com",
      country: "Germany",
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

    console.log("✅ Demo data seeding completed!");
    console.log(`Created: 3 suppliers, 5 materials, 3 formulations`);

    return {
      success: true,
      message: "Demo data created successfully! You now have 3 suppliers, 5 materials, and 3 formulation families to explore.",
    };
  } catch (error) {
    console.error("❌ Error seeding demo data:", error);
    return {
      success: false,
      message: `Failed to seed demo data: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
