/**
 * Supplier Intelligence Service
 * 
 * Provides:
 * - Material alternative suggestions based on property similarity
 * - Supplier risk assessment
 * - Supply chain resilience analysis
 * 
 * Based on ALKEMI v5.1 Specification §17: Supplier Intelligence
 */

import * as db from "./db";

export interface MaterialAlternative {
  materialId: string;
  materialCode: string;
  materialName: string;
  tradeName?: string;
  supplierId?: string;
  supplierName?: string;
  similarityScore: number;
  propertyMatches: Record<string, {
    original: number | null;
    alternative: number | null;
    difference: number | null;
  }>;
  costComparison?: {
    originalCost: number | null;
    alternativeCost: number | null;
    savings: number | null;
    savingsPercent: number | null;
  };
  riskFactors: string[];
}

export interface SupplierRiskAssessment {
  supplierId: string;
  supplierName: string;
  overallRiskScore: number; // 0-100, higher is riskier
  riskLevel: "low" | "medium" | "high" | "critical";
  factors: {
    geographic: {
      score: number;
      country: string;
      issues: string[];
    };
    qualification: {
      score: number;
      status: string;
      lastAudit?: Date;
    };
    performance: {
      score: number;
      onTimeDelivery?: number;
      qualityIssues?: number;
    };
    concentration: {
      score: number;
      materialsSupplied: number;
      dependencyLevel: string;
    };
  };
  recommendations: string[];
}

/**
 * Find alternative materials based on property similarity
 */
export async function findMaterialAlternatives(
  materialId: string,
  organizationId: string,
  options: {
    minSimilarity?: number;
    maxResults?: number;
    domainId?: string;
  } = {}
): Promise<MaterialAlternative[]> {
  const minSimilarity = options.minSimilarity || 0.7;
  const maxResults = options.maxResults || 5;
  
  // Get original material
  const original = await db.getMaterialById(materialId, organizationId);
  if (!original) {
    throw new Error("Material not found");
  }
  
  // Get all materials in the same domain
  const allMaterials = await db.getMaterials(organizationId, {
    domainId: options.domainId || original.domainId,
  });
  
  // Calculate similarity scores
  const alternatives: MaterialAlternative[] = [];
  
  for (const candidate of allMaterials) {
    if (candidate.id === materialId) continue; // Skip self
    if (!candidate.isActive) continue; // Skip inactive materials
    
    const similarity = calculateMaterialSimilarity(original, candidate);
    
    if (similarity.score >= minSimilarity) {
      // Get supplier info if available
      let supplierName: string | undefined;
      if (candidate.supplierId) {
        const supplier = await db.getSupplierById(candidate.supplierId, organizationId);
        supplierName = supplier?.name;
      }
      
      // Calculate cost comparison
      let costComparison: MaterialAlternative["costComparison"];
      if (original.costPerKg && candidate.costPerKg) {
        const originalCost = parseFloat(original.costPerKg);
        const alternativeCost = parseFloat(candidate.costPerKg);
        const savings = originalCost - alternativeCost;
        const savingsPercent = (savings / originalCost) * 100;
        
        costComparison = {
          originalCost,
          alternativeCost,
          savings,
          savingsPercent,
        };
      }
      
      // Identify risk factors
      const riskFactors: string[] = [];
      if (!candidate.supplierId) {
        riskFactors.push("No supplier assigned");
      }
      if (!candidate.casNumber) {
        riskFactors.push("Missing CAS number");
      }
      if (similarity.score < 0.85) {
        riskFactors.push("Moderate property differences");
      }
      
      alternatives.push({
        materialId: candidate.id,
        materialCode: candidate.code,
        materialName: candidate.name,
        tradeName: candidate.tradeName || undefined,
        supplierId: candidate.supplierId || undefined,
        supplierName,
        similarityScore: similarity.score,
        propertyMatches: similarity.properties,
        costComparison,
        riskFactors,
      });
    }
  }
  
  // Sort by similarity score descending
  alternatives.sort((a, b) => b.similarityScore - a.similarityScore);
  
  return alternatives.slice(0, maxResults);
}

/**
 * Calculate similarity between two materials based on properties
 */
function calculateMaterialSimilarity(
  material1: any,
  material2: any
): {
  score: number;
  properties: Record<string, { original: number | null; alternative: number | null; difference: number | null }>;
} {
  const properties = [
    "density",
    "viscosity",
    "molecularWeight",
    "hansenD",
    "hansenP",
    "hansenH",
    "refractiveIndex",
    "glassTransitionTemp",
  ];
  
  let totalWeight = 0;
  let weightedSum = 0;
  const propertyMatches: Record<string, any> = {};
  
  for (const prop of properties) {
    const val1 = material1[prop] ? parseFloat(material1[prop]) : null;
    const val2 = material2[prop] ? parseFloat(material2[prop]) : null;
    
    propertyMatches[prop] = {
      original: val1,
      alternative: val2,
      difference: null,
    };
    
    if (val1 !== null && val2 !== null) {
      // Calculate normalized difference (0 = identical, 1 = very different)
      const avgValue = (val1 + val2) / 2;
      const difference = Math.abs(val1 - val2);
      const normalizedDiff = avgValue > 0 ? difference / avgValue : 0;
      
      // Convert to similarity (1 = identical, 0 = very different)
      const similarity = Math.max(0, 1 - normalizedDiff);
      
      // Weight based on property importance
      let weight = 1.0;
      if (prop === "density" || prop === "viscosity") {
        weight = 1.5; // More important properties
      } else if (prop.startsWith("hansen")) {
        weight = 1.3; // Hansen parameters are important for compatibility
      }
      
      weightedSum += similarity * weight;
      totalWeight += weight;
      
      propertyMatches[prop].difference = difference;
    }
  }
  
  // Calculate overall similarity score
  const score = totalWeight > 0 ? weightedSum / totalWeight : 0;
  
  return {
    score,
    properties: propertyMatches,
  };
}

/**
 * Assess supplier risk based on multiple factors
 */
export async function assessSupplierRisk(
  supplierId: string,
  organizationId: string
): Promise<SupplierRiskAssessment> {
  const supplier = await db.getSupplierById(supplierId, organizationId);
  if (!supplier) {
    throw new Error("Supplier not found");
  }
  
  // Get materials supplied by this supplier
  const materials = await db.getMaterials(organizationId, { supplierId });
  
  // Calculate geographic risk
  const geographicRisk = calculateGeographicRisk(supplier.country);
  
  // Calculate qualification risk
  const qualificationRisk = calculateQualificationRisk(supplier.qualificationStatus);
  
  // Calculate performance risk (if data available)
  const performanceRisk = calculatePerformanceRisk(supplier.riskScore);
  
  // Calculate concentration risk
  const concentrationRisk = calculateConcentrationRisk(materials.length);
  
  // Calculate overall risk score (weighted average)
  const overallRiskScore = Math.round(
    geographicRisk.score * 0.3 +
    qualificationRisk.score * 0.3 +
    performanceRisk.score * 0.2 +
    concentrationRisk.score * 0.2
  );
  
  // Determine risk level
  let riskLevel: "low" | "medium" | "high" | "critical";
  if (overallRiskScore < 25) {
    riskLevel = "low";
  } else if (overallRiskScore < 50) {
    riskLevel = "medium";
  } else if (overallRiskScore < 75) {
    riskLevel = "high";
  } else {
    riskLevel = "critical";
  }
  
  // Generate recommendations
  const recommendations: string[] = [];
  
  if (geographicRisk.score > 50) {
    recommendations.push("Consider diversifying to suppliers in lower-risk regions");
  }
  
  if (qualificationRisk.score > 50) {
    recommendations.push("Update supplier qualification status and conduct audit");
  }
  
  if (performanceRisk.score > 50) {
    recommendations.push("Review supplier performance metrics and address quality issues");
  }
  
  if (concentrationRisk.score > 60) {
    recommendations.push("High dependency on this supplier - identify backup sources");
  }
  
  if (overallRiskScore > 60) {
    recommendations.push("Develop contingency plan for supply disruption");
  }
  
  return {
    supplierId: supplier.id,
    supplierName: supplier.name,
    overallRiskScore,
    riskLevel,
    factors: {
      geographic: geographicRisk,
      qualification: qualificationRisk,
      performance: performanceRisk,
      concentration: concentrationRisk,
    },
    recommendations,
  };
}

/**
 * Calculate geographic risk based on country
 */
function calculateGeographicRisk(country?: string | null): {
  score: number;
  country: string;
  issues: string[];
} {
  if (!country) {
    return {
      score: 50,
      country: "Unknown",
      issues: ["Country not specified"],
    };
  }
  
  // Risk scores by region (simplified)
  const highRiskCountries = ["CN", "RU", "VE", "IR", "KP"];
  const mediumRiskCountries = ["IN", "BR", "MX", "TR", "ZA"];
  const lowRiskCountries = ["US", "DE", "JP", "GB", "FR", "CA", "AU", "CH", "NL", "SE"];
  
  const issues: string[] = [];
  let score = 30; // Default medium-low risk
  
  if (highRiskCountries.includes(country)) {
    score = 75;
    issues.push("High geopolitical risk");
    issues.push("Potential trade restrictions");
  } else if (mediumRiskCountries.includes(country)) {
    score = 45;
    issues.push("Moderate political stability concerns");
  } else if (lowRiskCountries.includes(country)) {
    score = 15;
  }
  
  return {
    score,
    country,
    issues,
  };
}

/**
 * Calculate qualification risk
 */
function calculateQualificationRisk(status?: string | null): {
  score: number;
  status: string;
} {
  const statusMap: Record<string, number> = {
    qualified: 10,
    under_review: 40,
    pending: 60,
    disqualified: 90,
  };
  
  const score = status ? (statusMap[status] || 50) : 50;
  
  return {
    score,
    status: status || "unknown",
  };
}

/**
 * Calculate performance risk
 */
function calculatePerformanceRisk(riskScore?: string | null): {
  score: number;
  onTimeDelivery?: number;
  qualityIssues?: number;
} {
  // If supplier has a risk score, use it
  if (riskScore) {
    const score = parseFloat(riskScore);
    return {
      score: isNaN(score) ? 50 : score,
    };
  }
  
  // Default to medium risk if no data
  return {
    score: 50,
  };
}

/**
 * Calculate concentration risk based on number of materials supplied
 */
function calculateConcentrationRisk(materialCount: number): {
  score: number;
  materialsSupplied: number;
  dependencyLevel: string;
} {
  let score = 0;
  let dependencyLevel = "low";
  
  if (materialCount >= 20) {
    score = 80;
    dependencyLevel = "critical";
  } else if (materialCount >= 10) {
    score = 60;
    dependencyLevel = "high";
  } else if (materialCount >= 5) {
    score = 40;
    dependencyLevel = "medium";
  } else {
    score = 20;
    dependencyLevel = "low";
  }
  
  return {
    score,
    materialsSupplied: materialCount,
    dependencyLevel,
  };
}

/**
 * Find backup suppliers for a material
 */
export async function findBackupSuppliers(
  materialId: string,
  organizationId: string
): Promise<Array<{
  alternative: MaterialAlternative;
  supplier: SupplierRiskAssessment | null;
}>> {
  // Find alternative materials
  const alternatives = await findMaterialAlternatives(materialId, organizationId, {
    minSimilarity: 0.75,
    maxResults: 10,
  });
  
  // Get risk assessment for each supplier
  const results = [];
  
  for (const alt of alternatives) {
    let supplierRisk: SupplierRiskAssessment | null = null;
    
    if (alt.supplierId) {
      try {
        supplierRisk = await assessSupplierRisk(alt.supplierId, organizationId);
      } catch (error) {
        // Supplier not found or error
        console.error(`Failed to assess supplier ${alt.supplierId}:`, error);
      }
    }
    
    results.push({
      alternative: alt,
      supplier: supplierRisk,
    });
  }
  
  // Sort by combined score (similarity + supplier risk)
  results.sort((a, b) => {
    const scoreA = a.alternative.similarityScore * 0.7 + (a.supplier ? (100 - a.supplier.overallRiskScore) / 100 * 0.3 : 0);
    const scoreB = b.alternative.similarityScore * 0.7 + (b.supplier ? (100 - b.supplier.overallRiskScore) / 100 * 0.3 : 0);
    return scoreB - scoreA;
  });
  
  return results;
}
