import * as db from "./db";
import { suppliers, materials, formulationComponents, formulationVersions } from "../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";

/**
 * Supplier Risk Assessment Service
 * Calculates risk scores based on qualification status, geographic factors, and performance
 */

export interface RiskFactor {
  category: string;
  factor: string;
  score: number; // 0-100, higher is riskier
  severity: "low" | "medium" | "high" | "critical";
  description: string;
}

export interface SupplierRiskAssessment {
  supplierId: string;
  supplierName: string;
  overallRiskScore: number; // 0-100, higher is riskier
  riskLevel: "low" | "medium" | "high" | "critical";
  riskFactors: RiskFactor[];
  qualificationStatus: string;
  country: string;
  materialsSupplied: number;
  formulationsImpacted: number;
  lastAssessmentDate: number; // Unix timestamp
}

export interface SupplierAlternative {
  supplierId: string;
  supplierName: string;
  similarityScore: number; // 0-100, higher is more similar
  qualificationStatus: string;
  country: string;
  riskScore: number;
  commonMaterials: string[];
  advantages: string[];
}

/**
 * Geographic risk factors by country/region
 */
const GEOGRAPHIC_RISK: Record<string, number> = {
  // Low risk (0-20)
  "United States": 10,
  "Germany": 10,
  "Japan": 10,
  "Switzerland": 5,
  "Netherlands": 10,
  "United Kingdom": 15,
  
  // Medium risk (21-50)
  "China": 35,
  "India": 40,
  "Brazil": 35,
  "Mexico": 30,
  "South Korea": 25,
  
  // High risk (51-80)
  "Russia": 70,
  "Turkey": 60,
  "Vietnam": 55,
  "Thailand": 50,
  
  // Critical risk (81-100)
  "Unknown": 90,
};

/**
 * Qualification status risk scores
 */
const QUALIFICATION_RISK: Record<string, number> = {
  qualified: 10,
  under_review: 40,
  pending: 60,
  disqualified: 100,
};

/**
 * Calculate overall risk score for a supplier
 */
export async function assessSupplierRisk(
  supplierId: string,
  organizationId: string
): Promise<SupplierRiskAssessment> {
  // Get supplier details
  const database = await db.getDb();
  if (!database) throw new Error("Database connection failed");
  const [supplier] = await database
    .select()
    .from(suppliers)
    .where(and(eq(suppliers.id, supplierId), eq(suppliers.organizationId, organizationId)));

  if (!supplier) {
    throw new Error("Supplier not found");
  }

  // Get materials supplied by this supplier
  const materialsSupplied = await database
    .select()
    .from(materials)
    .where(and(eq(materials.supplierId, supplierId), eq(materials.organizationId, organizationId)));

  // Get formulations impacted (using these materials)
  const materialIds = materialsSupplied.map((m: typeof materials.$inferSelect) => m.id);
  const formulationsImpacted = materialIds.length > 0
    ? await database
        .selectDistinct({ versionId: formulationComponents.versionId })
        .from(formulationComponents)
        .innerJoin(formulationVersions, eq(formulationComponents.versionId, formulationVersions.id))
        .where(
          and(
            sql`${formulationComponents.materialId} IN ${materialIds}`,
            eq(formulationVersions.organizationId, organizationId)
          )
        )
    : [];

  // Calculate risk factors
  const riskFactors: RiskFactor[] = [];

  // 1. Qualification status risk
  const qualificationRisk = QUALIFICATION_RISK[supplier.qualificationStatus] || 50;
  riskFactors.push({
    category: "Qualification",
    factor: "Supplier Qualification Status",
    score: qualificationRisk,
    severity: qualificationRisk > 60 ? "critical" : qualificationRisk > 40 ? "high" : qualificationRisk > 20 ? "medium" : "low",
    description: `Supplier is ${supplier.qualificationStatus}`,
  });

  // 2. Geographic risk
  const geoRisk = GEOGRAPHIC_RISK[supplier.country || "Unknown"] || 50;
  riskFactors.push({
    category: "Geographic",
    factor: "Country Risk",
    score: geoRisk,
    severity: geoRisk > 60 ? "critical" : geoRisk > 40 ? "high" : geoRisk > 20 ? "medium" : "low",
    description: `Supplier located in ${supplier.country}`,
  });

  // 3. Single source risk (if many formulations depend on this supplier)
  const singleSourceRisk = formulationsImpacted.length > 5 ? 60 : formulationsImpacted.length > 2 ? 40 : 20;
  riskFactors.push({
    category: "Dependency",
    factor: "Single Source Risk",
    score: singleSourceRisk,
    severity: singleSourceRisk > 60 ? "critical" : singleSourceRisk > 40 ? "high" : singleSourceRisk > 20 ? "medium" : "low",
    description: `${formulationsImpacted.length} formulations depend on this supplier`,
  });

  // 4. Material diversity risk (if supplier provides only one material type)
  const diversityRisk = materialsSupplied.length === 1 ? 50 : materialsSupplied.length === 2 ? 30 : 10;
  riskFactors.push({
    category: "Diversification",
    factor: "Material Diversity",
    score: diversityRisk,
    severity: diversityRisk > 60 ? "critical" : diversityRisk > 40 ? "high" : diversityRisk > 20 ? "medium" : "low",
    description: `Supplier provides ${materialsSupplied.length} material type(s)`,
  });

  // Calculate overall risk score (weighted average)
  const overallRiskScore = Math.round(
    (qualificationRisk * 0.4 + geoRisk * 0.3 + singleSourceRisk * 0.2 + diversityRisk * 0.1)
  );

  const riskLevel =
    overallRiskScore > 70 ? "critical" : overallRiskScore > 50 ? "high" : overallRiskScore > 30 ? "medium" : "low";

  return {
    supplierId: supplier.id,
    supplierName: supplier.name,
    overallRiskScore,
    riskLevel,
    riskFactors,
    qualificationStatus: supplier.qualificationStatus,
    country: supplier.country || "Unknown",
    materialsSupplied: materialsSupplied.length,
    formulationsImpacted: formulationsImpacted.length,
    lastAssessmentDate: Date.now(),
  };
}

/**
 * Find alternative suppliers for a given material
 */
export async function findAlternativeSuppliers(
  materialId: string,
  organizationId: string,
  limit: number = 5
): Promise<SupplierAlternative[]> {
  // Get the material details
  const database = await db.getDb();
  if (!database) throw new Error("Database connection failed");
  const [material] = await database
    .select()
    .from(materials)
    .where(and(eq(materials.id, materialId), eq(materials.organizationId, organizationId)));

  if (!material) {
    throw new Error("Material not found");
  }

  // Get current supplier
  const currentSupplierId = material.supplierId;

  // Get all other suppliers in the organization
  const allSuppliers = await database
    .select()
    .from(suppliers)
    .where(and(eq(suppliers.organizationId, organizationId), sql`${suppliers.id} != ${currentSupplierId}`));

  // Get materials from each supplier
  const alternatives: SupplierAlternative[] = [];

  for (const supplier of allSuppliers) {
    const supplierMaterials = await database
      .select()
      .from(materials)
      .where(and(eq(materials.supplierId, supplier.id), eq(materials.organizationId, organizationId)));

    // Calculate similarity based on material properties
    const commonMaterials = supplierMaterials
      .filter((m: typeof materials.$inferSelect) => m.domainId === material.domainId)
      .map((m: typeof materials.$inferSelect) => m.name);

    // Similarity score based on:
    // - Same domain (40 points)
    // - Common materials (30 points)
    // - Qualification status (30 points)
    const domainMatch = supplierMaterials.some((m: typeof materials.$inferSelect) => m.domainId === material.domainId) ? 40 : 0;
    const commonMaterialsScore = Math.min(commonMaterials.length * 10, 30);
    const qualificationScore = supplier.qualificationStatus === "qualified" ? 30 : supplier.qualificationStatus === "under_review" ? 20 : 10;

    const similarityScore = domainMatch + commonMaterialsScore + qualificationScore;

    // Get risk assessment for this supplier
    const riskAssessment = await assessSupplierRisk(supplier.id, organizationId);

    // Determine advantages
    const advantages: string[] = [];
    if (supplier.qualificationStatus === "qualified") {
      advantages.push("Fully qualified supplier");
    }
    if (riskAssessment.overallRiskScore < 30) {
      advantages.push("Low risk profile");
    }
    if (GEOGRAPHIC_RISK[supplier.country || "Unknown"] < 20) {
      advantages.push("Low geographic risk");
    }
    if (commonMaterials.length > 0) {
      advantages.push(`Supplies ${commonMaterials.length} similar material(s)`);
    }

    alternatives.push({
      supplierId: supplier.id,
      supplierName: supplier.name,
      similarityScore,
      qualificationStatus: supplier.qualificationStatus,
      country: supplier.country || "Unknown",
      riskScore: riskAssessment.overallRiskScore,
      commonMaterials,
      advantages,
    });
  }

  // Sort by similarity score (descending) and return top N
  return alternatives
    .sort((a, b) => b.similarityScore - a.similarityScore)
    .slice(0, limit);
}

/**
 * Get risk assessment for all suppliers in an organization
 */
export async function assessAllSuppliers(organizationId: string): Promise<SupplierRiskAssessment[]> {
  const database = await db.getDb();
  if (!database) throw new Error("Database connection failed");
  const allSuppliers = await database
    .select()
    .from(suppliers)
    .where(eq(suppliers.organizationId, organizationId));

  const assessments: SupplierRiskAssessment[] = [];

  for (const supplier of allSuppliers) {
    const assessment = await assessSupplierRisk(supplier.id, organizationId);
    assessments.push(assessment);
  }

  // Sort by risk score (descending) - highest risk first
  return assessments.sort((a, b) => b.overallRiskScore - a.overallRiskScore);
}
