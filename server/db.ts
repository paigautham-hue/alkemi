import { and, desc, eq, inArray, like, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  organizations,
  InsertOrganization,
  materials,
  InsertMaterial,
  Material,
  suppliers,
  InsertSupplier,
  Supplier,
  domains,
  InsertDomain,
  Domain,
  organizationDomains,
  formulationFamilies,
  InsertFormulationFamily,
  FormulationFamily,
  formulationVersions,
  InsertFormulationVersion,
  FormulationVersion,
  formulationComponents,
  InsertFormulationComponent,
  FormulationComponent,
  testConditionSets,
  testConditionParameters,
  predictions,
  predictionFeatures,
  llmAuditLog,
  approvalRequests,
  approvalReviews,
  debateSessions,
  documents,
} from "../drizzle/schema";
import { ENV } from './_core/env';
import { nanoid } from 'nanoid';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ==========================================================
// USER & ORGANIZATION MANAGEMENT
// ==========================================================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  if (!user.organizationId) {
    throw new Error("User organizationId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
      organizationId: user.organizationId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Get or create an organization for a user.
 * Automatically creates a personal organization for each new user.
 */
export async function getOrCreateOrganizationForUser(userOpenId: string, userName: string | null): Promise<string> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Check if user already has an organization
  const existingUser = await getUserByOpenId(userOpenId);
  if (existingUser?.organizationId) {
    return existingUser.organizationId;
  }

  // Check if this is the owner
  const isOwner = userOpenId === ENV.ownerOpenId;

  if (isOwner) {
    // For owner, get or create default organization
    const orgSlug = "default-org";
    const existingOrgs = await db.select().from(organizations).where(eq(organizations.slug, orgSlug)).limit(1);
    
    if (existingOrgs.length > 0) {
      return existingOrgs[0]!.id;
    }

    // Create default organization with UUID
    const orgId = crypto.randomUUID();
    const newOrg: InsertOrganization = {
      id: orgId,
      name: userName ? `${userName}'s Organization` : "Default Organization",
      slug: orgSlug,
      settings: {},
    };

    await db.insert(organizations).values(newOrg);
    return orgId;
  }

  // For non-owner users, create a personal organization automatically
  const orgId = crypto.randomUUID();
  const orgSlug = `user-${userOpenId.substring(0, 8)}-${Date.now()}`;
  const newOrg: InsertOrganization = {
    id: orgId,
    name: userName ? `${userName}'s Workspace` : "My Workspace",
    slug: orgSlug,
    settings: {},
  };

  await db.insert(organizations).values(newOrg);
  return orgId;
}

// ==========================================================
// MATERIALS
// ==========================================================

export async function getMaterials(organizationId: string, filters?: {
  search?: string;
  category?: string;
  domainId?: string;
  supplierId?: string;
  isActive?: boolean;
}) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(materials.organizationId, organizationId)];

  if (filters?.search) {
    conditions.push(
      or(
        like(materials.name, `%${filters.search}%`),
        like(materials.code, `%${filters.search}%`),
        like(materials.casNumber, `%${filters.search}%`)
      )!
    );
  }

  if (filters?.category) {
    conditions.push(eq(materials.category, filters.category));
  }

  if (filters?.domainId) {
    conditions.push(eq(materials.domainId, filters.domainId));
  }

  if (filters?.supplierId) {
    conditions.push(eq(materials.supplierId, filters.supplierId));
  }

  if (filters?.isActive !== undefined) {
    conditions.push(eq(materials.isActive, filters.isActive));
  }

  return db
    .select()
    .from(materials)
    .where(and(...conditions))
    .orderBy(desc(materials.createdAt));
}

export async function getMaterialById(id: string, organizationId: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(materials)
    .where(and(eq(materials.id, id), eq(materials.organizationId, organizationId)))
    .limit(1);

  return result[0];
}

export async function createMaterial(material: InsertMaterial) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const id = crypto.randomUUID();
  const now = new Date();
  
  // CRITICAL: Drizzle ORM with MySQL inserts SQL DEFAULT keyword for columns not in values object.
  // MySQL doesn't support DEFAULT as a value in INSERT statements like PostgreSQL does.
  // We MUST provide explicit values (or null) for ALL columns to prevent DEFAULT keyword.
  await db.insert(materials).values({
    id,
    organizationId: material.organizationId,
    domainId: material.domainId,
    code: material.code,
    name: material.name,
    // Nullable columns must be explicitly set to null or a value
    tradeName: material.tradeName || null,
    category: material.category || null,
    casNumber: material.casNumber || null,
    supplierId: material.supplierId || null,
    supplierProductCode: material.supplierProductCode || null,
    density: material.density || null,
    viscosity: material.viscosity || null,
    molecularWeight: material.molecularWeight || null,
    refractiveIndex: material.refractiveIndex || null,
    glassTransitionTemp: material.glassTransitionTemp || null,
    hansenD: material.hansenD || null,
    hansenP: material.hansenP || null,
    hansenH: material.hansenH || null,
    regulatoryStatus: material.regulatoryStatus || null,
    costPerKg: material.costPerKg || null,
    currency: material.currency || "USD",
    metadata: material.metadata || null,
    isActive: material.isActive !== undefined ? material.isActive : true,
    // Timestamps must be explicitly set
    createdAt: now,
    updatedAt: now,
  });
  return id;
}

export async function updateMaterial(id: string, organizationId: string, updates: Partial<Material>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(materials)
    .set(updates)
    .where(and(eq(materials.id, id), eq(materials.organizationId, organizationId)));
}

export async function deleteMaterial(id: string, organizationId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .delete(materials)
    .where(and(eq(materials.id, id), eq(materials.organizationId, organizationId)));
}

// ==========================================================
// SUPPLIERS
// ==========================================================

export async function getSuppliers(organizationId: string, filters?: {
  search?: string;
  qualificationStatus?: string;
}) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(suppliers.organizationId, organizationId)];

  if (filters?.search) {
    conditions.push(
      or(
        like(suppliers.name, `%${filters.search}%`),
        like(suppliers.code, `%${filters.search}%`)
      )!
    );
  }

  if (filters?.qualificationStatus) {
    conditions.push(eq(suppliers.qualificationStatus, filters.qualificationStatus as any));
  }

  return db
    .select()
    .from(suppliers)
    .where(and(...conditions))
    .orderBy(desc(suppliers.createdAt));
}

export async function getSupplierById(id: string, organizationId: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(suppliers)
    .where(and(eq(suppliers.id, id), eq(suppliers.organizationId, organizationId)))
    .limit(1);

  return result[0];
}

export async function createSupplier(supplier: InsertSupplier) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const id = crypto.randomUUID();
  const now = new Date();
  
  // CRITICAL: Drizzle ORM with MySQL inserts SQL DEFAULT keyword for columns not in values object.
  // MySQL doesn't support DEFAULT as a value in INSERT statements like PostgreSQL does.
  // We MUST provide explicit values (or null) for ALL columns to prevent DEFAULT keyword.
  await db.insert(suppliers).values({
    id,
    organizationId: supplier.organizationId,
    code: supplier.code,
    name: supplier.name,
    // Nullable columns must be explicitly set to null or a value
    country: supplier.country || null,
    contactEmail: supplier.contactEmail || null,
    contactPhone: supplier.contactPhone || null,
    address: supplier.address || null,
    riskScore: supplier.riskScore || "0.00",
    qualificationStatus: supplier.qualificationStatus || "pending",
    notes: supplier.notes || null,
    metadata: supplier.metadata || null,
    // Timestamps must be explicitly set
    createdAt: now,
    updatedAt: now,
  });
  return id;
}

export async function updateSupplier(id: string, organizationId: string, updates: Partial<Supplier>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(suppliers)
    .set(updates)
    .where(and(eq(suppliers.id, id), eq(suppliers.organizationId, organizationId)));
}

export async function deleteSupplier(id: string, organizationId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .delete(suppliers)
    .where(and(eq(suppliers.id, id), eq(suppliers.organizationId, organizationId)));
}

// ==========================================================
// DOMAINS
// ==========================================================

export async function getDomains() {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(domains).where(eq(domains.isActive, true));
}

/**
 * Get or create a default domain for demo data seeding.
 * This ensures materials and formulations have a valid domain reference.
 */
export async function getOrCreateDefaultDomain(organizationId: string): Promise<string> {
  const database = await getDb();
  if (!database) throw new Error("Database not available");

  // First check if organization already has a domain
  const existingDomains = await database
    .select({ domainId: organizationDomains.domainId })
    .from(organizationDomains)
    .where(eq(organizationDomains.organizationId, organizationId))
    .limit(1);

  if (existingDomains.length > 0) {
    return existingDomains[0].domainId;
  }

  // Check if default domain exists
  const defaultDomain = await database
    .select()
    .from(domains)
    .where(eq(domains.key, "default"))
    .limit(1);

  let domainId: string;
  const now = new Date();

  if (defaultDomain.length > 0) {
    domainId = defaultDomain[0].id;
  } else {
    // Create default domain
    domainId = nanoid();
    await database.insert(domains).values({
      id: domainId,
      key: "default",
      name: "General Chemistry",
      description: "Default domain for general formulation work",
      version: "1.0.0",
      config: null,
      isActive: true,
      createdAt: now,
    });
  }

  // Link domain to organization
  await database.insert(organizationDomains).values({
    organizationId,
    domainId,
    settings: null,
    enabledAt: now,
  });

  return domainId;
}

export async function getOrganizationDomains(organizationId: string) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select({
      domain: domains,
      settings: organizationDomains.settings,
      enabledAt: organizationDomains.enabledAt,
    })
    .from(organizationDomains)
    .innerJoin(domains, eq(organizationDomains.domainId, domains.id))
    .where(eq(organizationDomains.organizationId, organizationId));
}

// ==========================================================
// FORMULATIONS
// ==========================================================

export async function getFormulationFamilies(organizationId: string, filters?: {
  search?: string;
  domainId?: string;
}) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(formulationFamilies.organizationId, organizationId)];

  if (filters?.search) {
    conditions.push(
      or(
        like(formulationFamilies.name, `%${filters.search}%`),
        like(formulationFamilies.code, `%${filters.search}%`)
      )!
    );
  }

  if (filters?.domainId) {
    conditions.push(eq(formulationFamilies.domainId, filters.domainId));
  }

  return db
    .select()
    .from(formulationFamilies)
    .where(and(...conditions))
    .orderBy(desc(formulationFamilies.createdAt));
}

export async function getFormulationFamilyById(id: string, organizationId: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(formulationFamilies)
    .where(and(eq(formulationFamilies.id, id), eq(formulationFamilies.organizationId, organizationId)))
    .limit(1);

  return result[0];
}

export async function createFormulationFamily(family: InsertFormulationFamily) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const id = crypto.randomUUID();
  const now = new Date();
  
  // CRITICAL: Drizzle ORM with MySQL inserts SQL DEFAULT keyword for columns not in values object.
  // We MUST provide explicit values (or null) for ALL columns to prevent DEFAULT keyword.
  await db.insert(formulationFamilies).values({
    id,
    organizationId: family.organizationId,
    domainId: family.domainId,
    code: family.code,
    name: family.name,
    description: family.description || null,
    targetApplication: family.targetApplication || null,
    confidentialityLevel: family.confidentialityLevel || "internal",
    metadata: family.metadata || null,
    createdAt: now,
    updatedAt: now,
  });
  return id;
}

export async function getFormulationVersions(familyId: string, organizationId: string) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(formulationVersions)
    .where(and(eq(formulationVersions.familyId, familyId), eq(formulationVersions.organizationId, organizationId)))
    .orderBy(desc(formulationVersions.createdAt));
}

export async function getFormulationVersionById(id: string, organizationId: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(formulationVersions)
    .where(and(eq(formulationVersions.id, id), eq(formulationVersions.organizationId, organizationId)))
    .limit(1);

  return result[0];
}

export async function createFormulationVersion(version: InsertFormulationVersion) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const id = crypto.randomUUID();
  const now = new Date();
  
  // CRITICAL: Drizzle ORM with MySQL inserts SQL DEFAULT keyword for columns not in values object.
  // We MUST provide explicit values (or null) for ALL columns to prevent DEFAULT keyword.
  await db.insert(formulationVersions).values({
    id,
    organizationId: version.organizationId,
    familyId: version.familyId,
    versionNumber: version.versionNumber,
    branchType: version.branchType || null,
    parentVersionId: version.parentVersionId || null,
    status: version.status || "draft",
    createdBy: version.createdBy,
    approvedBy: version.approvedBy || null,
    approvedAt: version.approvedAt || null,
    targetProperties: version.targetProperties || null,
    notes: version.notes || null,
    changeReason: version.changeReason || null,
    metadata: version.metadata || null,
    createdAt: now,
    updatedAt: now,
  });
  return id;
}

export async function getFormulationComponents(versionId: string, organizationId: string) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select({
      component: formulationComponents,
      material: materials,
    })
    .from(formulationComponents)
    .innerJoin(materials, eq(formulationComponents.materialId, materials.id))
    .where(and(eq(formulationComponents.versionId, versionId), eq(formulationComponents.organizationId, organizationId)))
    .orderBy(desc(formulationComponents.createdAt));
}

export async function createFormulationComponent(component: InsertFormulationComponent) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const id = crypto.randomUUID();
  const now = new Date();
  
  // Explicitly set all fields to avoid Drizzle DEFAULT keyword issue with MySQL
  await db.insert(formulationComponents).values({
    id,
    organizationId: component.organizationId,
    versionId: component.versionId,
    materialId: component.materialId,
    percentage: component.percentage,
    role: component.role,
    notes: component.notes,
    createdAt: now,
  });
  return id;
}

export async function deleteFormulationComponent(id: string, organizationId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .delete(formulationComponents)
    .where(and(eq(formulationComponents.id, id), eq(formulationComponents.organizationId, organizationId)));
}


// ==========================================================
// TEST CONDITIONS MANAGEMENT
// ==========================================================

export async function createTestConditionSet(data: {
  organizationId: string;
  domainId: string;
  name: string;
  description?: string;
  isStandard: boolean;
  createdBy: string;
  parameters: Array<{ parameterName: string; parameterValue: string; unit?: string }>;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const testConditionSetId = nanoid();
  
  const now = new Date();
  
  // CRITICAL: Drizzle ORM with MySQL inserts SQL DEFAULT keyword for columns not in values object.
  // We MUST provide explicit values (or null) for ALL columns to prevent DEFAULT keyword.
  await db.insert(testConditionSets).values({
    id: testConditionSetId,
    organizationId: data.organizationId,
    domainId: data.domainId,
    name: data.name,
    description: data.description || null,
    isStandard: data.isStandard,
    createdBy: data.createdBy,
    createdAt: now,
    updatedAt: now,
  });

  if (data.parameters.length > 0) {
    await db.insert(testConditionParameters).values(
      data.parameters.map(param => ({
        id: nanoid(),
        testConditionSetId,
        parameterName: param.parameterName,
        parameterValue: param.parameterValue,
        createdAt: now,
        unit: param.unit || null,
      }))
    );
  }

  return testConditionSetId;
}

export async function getTestConditionSets(organizationId: string, domainId?: string) {
  const db = await getDb();
  if (!db) return [];

  if (domainId) {
    return await db
      .select()
      .from(testConditionSets)
      .where(
        and(
          eq(testConditionSets.organizationId, organizationId),
          eq(testConditionSets.domainId, domainId)
        )
      );
  }

  return await db
    .select()
    .from(testConditionSets)
    .where(eq(testConditionSets.organizationId, organizationId));
}

export async function getTestConditionSetById(id: string, organizationId: string) {
  const db = await getDb();
  if (!db) return undefined;

  const sets = await db
    .select()
    .from(testConditionSets)
    .where(
      and(
        eq(testConditionSets.id, id),
        eq(testConditionSets.organizationId, organizationId)
      )
    )
    .limit(1);

  if (sets.length === 0) return undefined;

  const parameters = await db
    .select()
    .from(testConditionParameters)
    .where(eq(testConditionParameters.testConditionSetId, id));

  return {
    ...sets[0],
    parameters,
  };
}

export async function getTestConditionParameters(testConditionSetId: string) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(testConditionParameters)
    .where(eq(testConditionParameters.testConditionSetId, testConditionSetId));
}

export async function deleteTestConditionSet(id: string, organizationId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .delete(testConditionSets)
    .where(
      and(
        eq(testConditionSets.id, id),
        eq(testConditionSets.organizationId, organizationId)
      )
    );
}


// ==========================================================
// PREDICTIONS
// ==========================================================

export async function createPrediction(data: {
  organizationId: string;
  formulationVersionId: string;
  testConditionSetId: string;
  propertyName: string;
  predictedValue: number;
  unit: string;
  uncertaintyLower?: number;
  uncertaintyUpper?: number;
  confidenceLevel?: number;
  probabilityInSpec?: number;
  modelName: string;
  modelVersion: string;
  requestedBy: string;
  featureImportance: Array<{
    featureName: string;
    importance: number;
    contribution: number;
  }>;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const predictionId = nanoid();
  const now = new Date();

  // CRITICAL: Drizzle ORM with MySQL inserts SQL DEFAULT keyword for columns not in values object.
  // We MUST provide explicit values (or null) for ALL columns to prevent DEFAULT keyword.
  await db.insert(predictions).values({
    id: predictionId,
    organizationId: data.organizationId,
    formulationVersionId: data.formulationVersionId,
    testConditionSetId: data.testConditionSetId,
    propertyName: data.propertyName,
    predictedValue: data.predictedValue.toString(),
    unit: data.unit || null,
    uncertaintyLower: data.uncertaintyLower?.toString() || null,
    uncertaintyUpper: data.uncertaintyUpper?.toString() || null,
    confidenceLevel: data.confidenceLevel?.toString() || "0.95",
    probabilityInSpec: data.probabilityInSpec?.toString() || null,
    modelName: data.modelName || null,
    modelVersion: data.modelVersion || null,
    requestedBy: data.requestedBy,
    createdAt: now,
  });

  if (data.featureImportance.length > 0) {
    await db.insert(predictionFeatures).values(
      data.featureImportance.map((feature) => ({
        id: nanoid(),
        predictionId,
        featureName: feature.featureName,
        importance: feature.importance.toString(),
        contribution: feature.contribution?.toString() || null,
      }))
    );
  }

  return predictionId;
}

export async function getPredictions(
  organizationId: string,
  formulationVersionId?: string
) {
  const db = await getDb();
  if (!db) return [];

  if (formulationVersionId) {
    return await db
      .select()
      .from(predictions)
      .where(
        and(
          eq(predictions.organizationId, organizationId),
          eq(predictions.formulationVersionId, formulationVersionId)
        )
      )
      .orderBy(desc(predictions.createdAt));
  }

  return await db
    .select()
    .from(predictions)
    .where(eq(predictions.organizationId, organizationId))
    .orderBy(desc(predictions.createdAt));
}

export async function getPredictionById(id: string, organizationId: string) {
  const db = await getDb();
  if (!db) return undefined;

  const preds = await db
    .select()
    .from(predictions)
    .where(
      and(
        eq(predictions.id, id),
        eq(predictions.organizationId, organizationId)
      )
    )
    .limit(1);

  if (preds.length === 0) return undefined;

  const features = await db
    .select()
    .from(predictionFeatures)
    .where(eq(predictionFeatures.predictionId, id));

  return {
    ...preds[0],
    features,
  };
}


// ==========================================================
// LLM AUDIT AND BUDGET TRACKING
// ==========================================================

export async function createLLMAuditLog(data: {
  organizationId: string;
  userId: string;
  modelName: string;
  purpose: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  latencyMs: number;
  success: boolean;
  errorMessage?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const id = nanoid();

  await db.insert(llmAuditLog).values({
    id,
    organizationId: data.organizationId,
    userId: data.userId,
    llmModelId: null,
    promptHash: nanoid(16),
    promptTokens: data.inputTokens,
    completionTokens: data.outputTokens,
    totalTokens: data.inputTokens + data.outputTokens,
    estimatedCost: data.cost.toString(),
    feature: data.purpose,
    metadata: data.errorMessage ? { error: data.errorMessage, success: data.success } : { success: data.success },
    latencyMs: data.latencyMs,
  });

  return id;
}

export async function getUserDailyLLMCost(userId: string): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const logs = await db
    .select()
    .from(llmAuditLog)
    .where(
      and(
        eq(llmAuditLog.userId, userId),
        sql`${llmAuditLog.createdAt} >= ${today.toISOString()}`
      )
    );

  return logs.reduce((sum, log) => sum + parseFloat(log.estimatedCost || "0"), 0);
}

export async function getOrganizationDailyLLMCost(
  organizationId: string
): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const logs = await db
    .select()
    .from(llmAuditLog)
    .where(
      and(
        eq(llmAuditLog.organizationId, organizationId),
        sql`${llmAuditLog.createdAt} >= ${today.toISOString()}`
      )
    );

  return logs.reduce((sum, log) => sum + parseFloat(log.estimatedCost || "0"), 0);
}

export async function getTopLLMUsersByOrganization(
  organizationId: string,
  limit: number = 10
): Promise<Array<{ userId: string; userName: string; cost: number }>> {
  const db = await getDb();
  if (!db) return [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const logs = await db
    .select()
    .from(llmAuditLog)
    .where(
      and(
        eq(llmAuditLog.organizationId, organizationId),
        sql`${llmAuditLog.createdAt} >= ${today.toISOString()}`
      )
    );

  // Group by user and sum costs
  const userCosts = new Map<string, number>();
  logs.forEach((log) => {
    const current = userCosts.get(log.userId) || 0;
    userCosts.set(log.userId, current + parseFloat(log.estimatedCost || "0"));
  });

  // Get user names
  const userIds = Array.from(userCosts.keys());
  const usersData = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.organizationId, organizationId),
        sql`${users.id} IN (${userIds.join(",")})`
      )
    );

  const userMap = new Map(usersData.map((u) => [u.id, u.name || "Unknown"]));

  // Sort by cost and limit
  return Array.from(userCosts.entries())
    .map(([userId, cost]) => ({
      userId,
      userName: userMap.get(userId) || "Unknown",
      cost,
    }))
    .sort((a, b) => b.cost - a.cost)
    .slice(0, limit);
}

export async function getOrganizationLLMSettings(organizationId: string): Promise<{
  allowedProviders?: string[];
  deniedProviders?: string[];
  preferredModel?: string;
} | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const orgs = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, organizationId))
    .limit(1);

  if (orgs.length === 0) return undefined;

  const org = orgs[0];

  // Parse settings from organization metadata or return defaults
  return {
    allowedProviders: undefined, // Could be stored in org settings
    deniedProviders: undefined,
    preferredModel: undefined,
  };
}

export async function getLLMAuditLogs(
  organizationId: string,
  options?: {
    userId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }
) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(llmAuditLog.organizationId, organizationId)];

  if (options?.userId) {
    conditions.push(eq(llmAuditLog.userId, options.userId));
  }

  if (options?.startDate) {
    conditions.push(sql`${llmAuditLog.createdAt} >= ${options.startDate.toISOString()}`);
  }

  if (options?.endDate) {
    conditions.push(sql`${llmAuditLog.createdAt} <= ${options.endDate.toISOString()}`);
  }

  const logs = await db
    .select()
    .from(llmAuditLog)
    .where(and(...conditions))
    .orderBy(desc(llmAuditLog.createdAt))
    .limit(options?.limit || 100);

  return logs;
}


// ==========================================================
// DEBATE SESSIONS
// ==========================================================

export async function createDebateSession(data: {
  organizationId: string;
  userId: string;
  question: string;
  context?: string;
  domain?: string;
  numParticipants: number;
  result: any;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const id = nanoid();

  // Note: debateSessions table will be imported after schema update
  await db.execute(
    sql`INSERT INTO debate_sessions (id, organization_id, user_id, question, context, domain, num_participants, result, created_at) 
        VALUES (${id}, ${data.organizationId}, ${data.userId}, ${data.question}, ${data.context || null}, ${data.domain || null}, ${data.numParticipants}, ${JSON.stringify(data.result)}, NOW())`
  );

  return id;
}

export async function getDebateSessions(organizationId: string, userId?: string) {
  const db = await getDb();
  if (!db) return [];

  let query = sql`SELECT * FROM debate_sessions WHERE organization_id = ${organizationId}`;
  
  if (userId) {
    query = sql`${query} AND user_id = ${userId}`;
  }

  query = sql`${query} ORDER BY created_at DESC LIMIT 50`;

  const result = await db.execute(query);

  return result as any[];
}


// ==========================================================
// APPROVAL WORKFLOW
// ==========================================================

export async function createApprovalRequest(data: {
  id: string;
  organizationId: string;
  formulationVersionId: string;
  requestedBy: string;
  status: string;
  reviewers: string[];
  submittedAt: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.execute(
    sql`INSERT INTO approval_requests (id, organization_id, formulation_version_id, requested_by, status, reviewers, submitted_at, created_at) 
        VALUES (${data.id}, ${data.organizationId}, ${data.formulationVersionId}, ${data.requestedBy}, ${data.status}, ${JSON.stringify(data.reviewers)}, ${data.submittedAt.getTime()}, ${Date.now()})`
  );

  return data.id;
}

export async function getApprovalRequest(id: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.execute(
    sql`SELECT * FROM approval_requests WHERE id = ${id}`
  );

  return (result as any[])[0] || null;
}

export async function updateApprovalRequestStatus(id: string, status: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.execute(
    sql`UPDATE approval_requests SET status = ${status}, updated_at = NOW() WHERE id = ${id}`
  );
}

export async function completeApprovalRequest(id: string, completedAt: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.execute(
    sql`UPDATE approval_requests SET completed_at = ${completedAt}, updated_at = NOW() WHERE id = ${id}`
  );
}

export async function createApprovalReview(data: {
  id: string;
  approvalRequestId: string;
  reviewerId: string;
  action: string;
  comments: string;
  reviewedAt: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.execute(
    sql`INSERT INTO approval_reviews (id, approval_request_id, reviewer_id, action, comments, reviewed_at, created_at) 
        VALUES (${data.id}, ${data.approvalRequestId}, ${data.reviewerId}, ${data.action}, ${data.comments}, ${data.reviewedAt.getTime()}, ${Date.now()})`
  );

  return data.id;
}

export async function getApprovalReviews(approvalRequestId: string) {
  const db = await getDb();
  if (!db) return [];

  const result = await db.execute(
    sql`SELECT ar.*, u.name as reviewer_name 
        FROM approval_reviews ar 
        LEFT JOIN users u ON ar.reviewer_id = u.id 
        WHERE ar.approval_request_id = ${approvalRequestId} 
        ORDER BY ar.reviewed_at ASC`
  );

  return result as any[];
}

export async function getPendingApprovalRequests(
  organizationId: string,
  reviewerId?: string
) {
  const db = await getDb();
  if (!db) return [];

  let query = sql`SELECT ar.*, 
                         fv.version_name as formulation_version_name,
                         ff.product_name as formulation_product_name,
                         u.name as requested_by_name
                  FROM approval_requests ar
                  LEFT JOIN formulation_versions fv ON ar.formulation_version_id = fv.id
                  LEFT JOIN formulation_families ff ON fv.family_id = ff.id
                  LEFT JOIN users u ON ar.requested_by = u.id
                  WHERE ar.organization_id = ${organizationId}
                  AND ar.status IN ('submitted', 'in_review', 'revision_requested')`;

  if (reviewerId) {
    query = sql`${query} AND JSON_CONTAINS(ar.reviewers, '"${reviewerId}"')`;
  }

  query = sql`${query} ORDER BY ar.submitted_at DESC`;

  const result = await db.execute(query);

  return result as any[];
}

export async function getApprovalRequestsByFormulation(
  formulationVersionId: string
) {
  const db = await getDb();
  if (!db) return [];

  const result = await db.execute(
    sql`SELECT ar.*, u.name as requested_by_name
        FROM approval_requests ar
        LEFT JOIN users u ON ar.requested_by = u.id
        WHERE ar.formulation_version_id = ${formulationVersionId}
        ORDER BY ar.submitted_at DESC`
  );

  return result as any[];
}


// ============================================================================
// Documents Management
// ============================================================================

export async function createDocument(doc: {
  organizationId: string;
  title: string;
  sourceType: "tds" | "msds" | "pds" | "sop" | "report" | "lab_notebook" | "other";
  filename: string;
  s3Key: string;
  s3Url: string;
  mimeType: string;
  fileSizeBytes: number;
  uploadedBy: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(documents).values([doc]);

  return result.insertId;
}

export async function listDocuments(organizationId: string, filters?: { search?: string; sourceType?: string }) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(documents.organizationId, organizationId)];

  if (filters?.search) {
    conditions.push(
      or(
        like(documents.title, `%${filters.search}%`),
        like(documents.filename, `%${filters.search}%`)
      )!
    );
  }

  if (filters?.sourceType) {
    conditions.push(sql`${documents.sourceType} = ${filters.sourceType}`);
  }

  const results = await db
    .select()
    .from(documents)
    .where(and(...conditions))
    .orderBy(desc(documents.createdAt));
    
  return results;
}

export async function getDocumentById(documentId: string, organizationId: string) {
  const db = await getDb();
  if (!db) return null;

  const [doc] = await db
    .select()
    .from(documents)
    .where(and(eq(documents.id, documentId), eq(documents.organizationId, organizationId)))
    .limit(1);

  return doc || null;
}

export async function deleteDocument(documentId: string, organizationId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .delete(documents)
    .where(and(eq(documents.id, documentId), eq(documents.organizationId, organizationId)));
}


// ============================================================================
// Users Management
// ============================================================================

export async function listOrganizationUsers(organizationId: string) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(users)
    .where(eq(users.organizationId, organizationId))
    .orderBy(users.createdAt);
}

export async function updateUserRole(userId: string, role: "admin" | "manager" | "chemist" | "viewer") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(users)
    .set({ role, updatedAt: new Date() })
    .where(eq(users.id, userId));
}

export async function deleteUser(userId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .delete(users)
    .where(eq(users.id, userId));
}

// ============================================================================
// Organizations Management
// ============================================================================

export async function getOrganizationById(organizationId: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, organizationId))
    .limit(1);
  
  return result[0];
}

export async function updateOrganization(organizationId: string, data: { name?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(organizations)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(organizations.id, organizationId));
}

// ============================================================================
// Document Chunks (RAG System)
// ============================================================================

export async function createDocumentChunk(chunk: {
  documentId: string;
  chunkIndex: number;
  content: string;
  embedding?: number[];
  pageNumber?: number;
  metadata?: Record<string, any>;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { documentChunks } = await import("../drizzle/schema");
  
  await db.insert(documentChunks).values({
    id: nanoid(),
    documentId: chunk.documentId,
    chunkIndex: chunk.chunkIndex,
    content: chunk.content,
    embedding: chunk.embedding || undefined,
    pageNumber: chunk.pageNumber || undefined,
    metadata: chunk.metadata || undefined,
  });
}

export async function getDocumentChunks(organizationId: string, documentIds?: string[]) {
  const db = await getDb();
  if (!db) return [];
  
  const { documentChunks } = await import("../drizzle/schema");
  
  // Get all chunks for documents in this organization
  let conditions = [eq(documents.organizationId, organizationId)];
  
  // Filter by specific documents if provided
  if (documentIds && documentIds.length > 0) {
    conditions.push(inArray(documentChunks.documentId, documentIds));
  }
  
  return await db
    .select({
      id: documentChunks.id,
      documentId: documentChunks.documentId,
      chunkIndex: documentChunks.chunkIndex,
      content: documentChunks.content,
      embedding: documentChunks.embedding,
      pageNumber: documentChunks.pageNumber,
      metadata: documentChunks.metadata,
    })
    .from(documentChunks)
    .innerJoin(documents, eq(documentChunks.documentId, documents.id))
    .where(and(...conditions));
}

export async function deleteDocumentChunks(documentId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { documentChunks } = await import("../drizzle/schema");
  
  await db
    .delete(documentChunks)
    .where(eq(documentChunks.documentId, documentId));
}

// ============================================================================
// Trials Management
// ============================================================================

export async function createTrial(trial: {
  organizationId: string;
  formulationVersionId: string;
  testConditionSetId: string;
  trialCode: string;
  conductedBy: string;
  conductedAt: Date;
  notes?: string;
  measurements: Array<{
    propertyName: string;
    measuredValue: string;
    unit?: string;
    measurementError?: string;
  }>;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { trials, trialMeasurements } = await import("../drizzle/schema");
  
  const trialId = nanoid();
  const now = new Date();
  
  // CRITICAL: Drizzle ORM with MySQL inserts SQL DEFAULT keyword for columns not in values object.
  // We MUST provide explicit values (or null) for ALL columns to prevent DEFAULT keyword.
  await db.insert(trials).values({
    id: trialId,
    organizationId: trial.organizationId,
    formulationVersionId: trial.formulationVersionId,
    testConditionSetId: trial.testConditionSetId,
    trialCode: trial.trialCode,
    conductedBy: trial.conductedBy,
    conductedAt: trial.conductedAt,
    notes: trial.notes || null,
    createdAt: now,
    updatedAt: now,
  });
  
  // Insert measurements
  if (trial.measurements.length > 0) {
    await db.insert(trialMeasurements).values(
      trial.measurements.map(m => ({
        id: nanoid(),
        trialId,
        propertyName: m.propertyName,
        measuredValue: m.measuredValue,
        unit: m.unit || null,
        measurementError: m.measurementError || null,
        createdAt: now,
      }))
    );
  }
  
  return trialId;
}

export async function listTrials(organizationId: string, filters?: {
  formulationVersionId?: string;
  testConditionSetId?: string;
}) {
  const db = await getDb();
  if (!db) return [];
  
  const { trials } = await import("../drizzle/schema");
  
  const conditions = [eq(trials.organizationId, organizationId)];
  
  if (filters?.formulationVersionId) {
    conditions.push(eq(trials.formulationVersionId, filters.formulationVersionId));
  }
  
  if (filters?.testConditionSetId) {
    conditions.push(eq(trials.testConditionSetId, filters.testConditionSetId));
  }
  
  return await db
    .select()
    .from(trials)
    .where(and(...conditions))
    .orderBy(desc(trials.conductedAt));
}

export async function getTrialById(trialId: string, organizationId: string) {
  const db = await getDb();
  if (!db) return null;
  
  const { trials } = await import("../drizzle/schema");
  
  const [trial] = await db
    .select()
    .from(trials)
    .where(and(eq(trials.id, trialId), eq(trials.organizationId, organizationId)))
    .limit(1);
  
  return trial;
}

export async function getTrialMeasurements(trialId: string) {
  const db = await getDb();
  if (!db) return [];
  
  const { trialMeasurements } = await import("../drizzle/schema");
  
  return await db
    .select()
    .from(trialMeasurements)
    .where(eq(trialMeasurements.trialId, trialId));
}

export async function deleteTrial(trialId: string, organizationId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { trials } = await import("../drizzle/schema");
  
  await db
    .delete(trials)
    .where(and(eq(trials.id, trialId), eq(trials.organizationId, organizationId)));
}

export async function compareTrialWithPrediction(trialId: string, organizationId: string) {
  const db = await getDb();
  if (!db) return null;
  
  const { trials, predictions: predictionsTable } = await import("../drizzle/schema");
  
  // Get trial with measurements
  const trial = await getTrialById(trialId, organizationId);
  if (!trial) return null;
  
  const measurements = await getTrialMeasurements(trialId);
  
  // Get predictions for the same formulation and test conditions
  const relatedPredictions = await db
    .select()
    .from(predictionsTable)
    .where(
      and(
        eq(predictionsTable.organizationId, organizationId),
        eq(predictionsTable.formulationVersionId, trial.formulationVersionId),
        eq(predictionsTable.testConditionSetId, trial.testConditionSetId)
      )
    );
  
  // Match measurements with predictions
  const comparisons = measurements.map(measurement => {
    const matchingPrediction = relatedPredictions.find(
      p => p.propertyName.toLowerCase() === measurement.propertyName.toLowerCase()
    );
    
    if (!matchingPrediction) {
      return {
        propertyName: measurement.propertyName,
        measuredValue: parseFloat(measurement.measuredValue),
        predictedValue: null,
        error: null,
        percentError: null,
        unit: measurement.unit,
      };
    }
    
    const measured = parseFloat(measurement.measuredValue);
    const predicted = parseFloat(matchingPrediction.predictedValue);
    const error = measured - predicted;
    const percentError = (error / measured) * 100;
    
    return {
      propertyName: measurement.propertyName,
      measuredValue: measured,
      predictedValue: predicted,
      error,
      percentError,
      unit: measurement.unit,
      predictionId: matchingPrediction.id,
    };
  });
  
  return {
    trial,
    measurements,
    comparisons,
  };
}


// ==========================================================
// COMPLIANCE FUNCTIONS
// ==========================================================

export async function listComplianceRules(organizationId: string, filters?: { isActive?: boolean }) {
  const db = await getDb();
  if (!db) return [];

  const { complianceRules, complianceDatasets, complianceSources } = await import("../drizzle/schema");
  
  const conditions = [eq(complianceRules.organizationId, organizationId)];
  if (filters?.isActive !== undefined) {
    conditions.push(eq(complianceRules.isActive, filters.isActive));
  }

  return db
    .select({
      rule: complianceRules,
      dataset: complianceDatasets,
      source: complianceSources,
    })
    .from(complianceRules)
    .innerJoin(complianceDatasets, eq(complianceRules.datasetId, complianceDatasets.id))
    .innerJoin(complianceSources, eq(complianceDatasets.sourceId, complianceSources.id))
    .where(and(...conditions))
    .orderBy(desc(complianceRules.createdAt));
}

export async function getComplianceRuleById(ruleId: string, organizationId: string) {
  const db = await getDb();
  if (!db) return null;

  const { complianceRules, complianceDatasets, complianceSources } = await import("../drizzle/schema");

  const results = await db
    .select({
      rule: complianceRules,
      dataset: complianceDatasets,
      source: complianceSources,
    })
    .from(complianceRules)
    .innerJoin(complianceDatasets, eq(complianceRules.datasetId, complianceDatasets.id))
    .innerJoin(complianceSources, eq(complianceDatasets.sourceId, complianceSources.id))
    .where(and(eq(complianceRules.id, ruleId), eq(complianceRules.organizationId, organizationId)))
    .limit(1);

  return results[0] || null;
}


