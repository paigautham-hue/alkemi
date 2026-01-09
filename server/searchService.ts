/**
 * Advanced Search Service
 * 
 * Full-text search across materials, formulations, and documents
 * with property filters, supplier filters, and compliance status
 */

import * as db from "./db";
import { materials, formulationFamilies, documents } from "../drizzle/schema";
import { like, or, and, gte, lte, eq, sql } from "drizzle-orm";

export interface SearchFilters {
  query?: string;
  category?: string;
  supplierId?: string;
  minViscosity?: number;
  maxViscosity?: number;
  minDensity?: number;
  maxDensity?: number;
  complianceStatus?: "compliant" | "non-compliant" | "unknown";
}

export interface MaterialSearchResult {
  id: string;
  type: "material";
  name: string;
  code: string;
  casNumber: string | null;
  category: string | null;
  supplierName: string | null;
  viscosity: string | null;
  density: string | null;
  matchReason: string;
}

export interface FormulationSearchResult {
  id: string;
  type: "formulation";
  name: string;
  code: string;
  description: string | null;
  targetApplication: string | null;
  confidentialityLevel: string | null;
  matchReason: string;
}

export interface DocumentSearchResult {
  id: string;
  type: "document";
  title: string;
  filename: string | null;
  sourceType: string | null;
  createdAt: Date;
  matchReason: string;
}

export type SearchResult = MaterialSearchResult | FormulationSearchResult | DocumentSearchResult;

export interface SearchResponse {
  results: SearchResult[];
  totalCount: number;
  materials: MaterialSearchResult[];
  formulations: FormulationSearchResult[];
  documents: DocumentSearchResult[];
}

/**
 * Search materials with filters
 */
export async function searchMaterials(
  organizationId: string,
  filters: SearchFilters
): Promise<MaterialSearchResult[]> {
  const database = await db.getDb();
  if (!database) throw new Error("Database not available");

  const conditions = [eq(materials.organizationId, organizationId)];

  // Full-text search across name, code, CAS number, category
  if (filters.query) {
    const searchPattern = `%${filters.query}%`;
    conditions.push(
      or(
        like(materials.name, searchPattern),
        like(materials.code, searchPattern),
        like(materials.casNumber, searchPattern),
        like(materials.category, searchPattern)
      )!
    );
  }

  // Category filter
  if (filters.category) {
    conditions.push(eq(materials.category, filters.category));
  }

  // Supplier filter
  if (filters.supplierId) {
    conditions.push(eq(materials.supplierId, filters.supplierId));
  }

  // Viscosity range filter
  if (filters.minViscosity !== undefined) {
    conditions.push(sql`CAST(${materials.viscosity} AS DECIMAL) >= ${filters.minViscosity}`);
  }
  if (filters.maxViscosity !== undefined) {
    conditions.push(sql`CAST(${materials.viscosity} AS DECIMAL) <= ${filters.maxViscosity}`);
  }

  // Density range filter
  if (filters.minDensity !== undefined) {
    conditions.push(sql`CAST(${materials.density} AS DECIMAL) >= ${filters.minDensity}`);
  }
  if (filters.maxDensity !== undefined) {
    conditions.push(sql`CAST(${materials.density} AS DECIMAL) <= ${filters.maxDensity}`);
  }

  const results = await database
    .select({
      id: materials.id,
      name: materials.name,
      code: materials.code,
      casNumber: materials.casNumber,
      category: materials.category,
      supplierId: materials.supplierId,
      viscosity: materials.viscosity,
      density: materials.density,
    })
    .from(materials)
    .where(and(...conditions))
    .limit(50);

  // Get supplier names
  const materialResults: MaterialSearchResult[] = [];
  for (const material of results) {
    let supplierName = null;
    if (material.supplierId) {
      const supplier = await db.getSupplierById(material.supplierId, organizationId);
      supplierName = supplier?.name || null;
    }

    let matchReason = "Material";
    if (filters.query) {
      if (material.name.toLowerCase().includes(filters.query.toLowerCase())) {
        matchReason = `Name matches "${filters.query}"`;
      } else if (material.code.toLowerCase().includes(filters.query.toLowerCase())) {
        matchReason = `Code matches "${filters.query}"`;
      } else if (material.casNumber?.toLowerCase().includes(filters.query.toLowerCase())) {
        matchReason = `CAS number matches "${filters.query}"`;
      }
    }

    materialResults.push({
      id: material.id,
      type: "material",
      name: material.name,
      code: material.code,
      casNumber: material.casNumber,
      category: material.category,
      supplierName,
      viscosity: material.viscosity,
      density: material.density,
      matchReason,
    });
  }

  return materialResults;
}

/**
 * Search formulations with filters
 */
export async function searchFormulations(
  organizationId: string,
  filters: SearchFilters
): Promise<FormulationSearchResult[]> {
  const database = await db.getDb();
  if (!database) throw new Error("Database not available");

  const conditions = [eq(formulationFamilies.organizationId, organizationId)];

  // Full-text search across name, code, description, target application
  if (filters.query) {
    const searchPattern = `%${filters.query}%`;
    conditions.push(
      or(
        like(formulationFamilies.name, searchPattern),
        like(formulationFamilies.code, searchPattern),
        like(formulationFamilies.description, searchPattern),
        like(formulationFamilies.targetApplication, searchPattern)
      )!
    );
  }

  const results = await database
    .select({
      id: formulationFamilies.id,
      name: formulationFamilies.name,
      code: formulationFamilies.code,
      description: formulationFamilies.description,
      targetApplication: formulationFamilies.targetApplication,
      confidentialityLevel: formulationFamilies.confidentialityLevel,
    })
    .from(formulationFamilies)
    .where(and(...conditions))
    .limit(50);

  return results.map((formulation) => {
    let matchReason = "Formulation";
    if (filters.query) {
      if (formulation.name.toLowerCase().includes(filters.query.toLowerCase())) {
        matchReason = `Name matches "${filters.query}"`;
      } else if (formulation.code.toLowerCase().includes(filters.query.toLowerCase())) {
        matchReason = `Code matches "${filters.query}"`;
      } else if (formulation.description?.toLowerCase().includes(filters.query.toLowerCase())) {
        matchReason = `Description matches "${filters.query}"`;
      }
    }

    return {
      id: formulation.id,
      type: "formulation" as const,
      name: formulation.name,
      code: formulation.code,
      description: formulation.description,
      targetApplication: formulation.targetApplication,
      confidentialityLevel: formulation.confidentialityLevel,
      matchReason,
    };
  });
}

/**
 * Search documents with filters
 */
export async function searchDocuments(
  organizationId: string,
  filters: SearchFilters
): Promise<DocumentSearchResult[]> {
  const database = await db.getDb();
  if (!database) throw new Error("Database not available");

  const conditions = [eq(documents.organizationId, organizationId)];

  // Full-text search across title and filename
  if (filters.query) {
    const searchPattern = `%${filters.query}%`;
    conditions.push(
      or(
        like(documents.title, searchPattern),
        like(documents.filename, searchPattern)
      )!
    );
  }

  const results = await database
    .select({
      id: documents.id,
      title: documents.title,
      filename: documents.filename,
      sourceType: documents.sourceType,
      createdAt: documents.createdAt,
    })
    .from(documents)
    .where(and(...conditions))
    .limit(50);

  return results.map((document) => ({
    id: document.id,
    type: "document" as const,
    title: document.title,
    filename: document.filename,
    sourceType: document.sourceType,
    createdAt: document.createdAt,
    matchReason: filters.query ? `Document matches "${filters.query}"` : "Document",
  }));
}

/**
 * Unified search across all entity types
 */
export async function unifiedSearch(
  organizationId: string,
  filters: SearchFilters
): Promise<SearchResponse> {
  const [materialResults, formulationResults, documentResults] = await Promise.all([
    searchMaterials(organizationId, filters),
    searchFormulations(organizationId, filters),
    searchDocuments(organizationId, filters),
  ]);

  const allResults: SearchResult[] = [
    ...materialResults,
    ...formulationResults,
    ...documentResults,
  ];

  return {
    results: allResults,
    totalCount: allResults.length,
    materials: materialResults,
    formulations: formulationResults,
    documents: documentResults,
  };
}
