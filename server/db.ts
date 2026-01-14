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
  assignedTo?: string | null;
  submittedAt?: Date | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const now = new Date();
  const submittedAtValue = data.submittedAt || now;

  await db.insert(approvalRequests).values({
    id: data.id,
    organizationId: data.organizationId,
    formulationVersionId: data.formulationVersionId,
    requestedBy: data.requestedBy,
    status: data.status as any,
    assignedTo: data.assignedTo || null,
    submittedAt: submittedAtValue,
    createdAt: now,
    updatedAt: now,
  });

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

export async function completeApprovalRequest(id: string, reviewedAt: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.execute(
    sql`UPDATE approval_requests SET reviewed_at = ${reviewedAt}, updated_at = NOW() WHERE id = ${id}`
  );
}

export async function createApprovalReview(data: {
  id: string;
  approvalRequestId: string;
  reviewerId: string;
  decision: string;
  comments?: string | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const now = new Date();

  await db.insert(approvalReviews).values({
    id: data.id,
    approvalRequestId: data.approvalRequestId,
    reviewerId: data.reviewerId,
    decision: data.decision as any,
    comments: data.comments || null,
    createdAt: now,
  });

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
  userId?: string
) {
  const db = await getDb();
  if (!db) return [];

  let query = sql`SELECT ar.*, 
                         fv.version_number as formulation_version_name,
                         ff.name as formulation_product_name,
                         u.name as requested_by_name
                  FROM approval_requests ar
                  LEFT JOIN formulation_versions fv ON ar.formulation_version_id = fv.id
                  LEFT JOIN formulation_families ff ON fv.family_id = ff.id
                  LEFT JOIN users u ON ar.requested_by = u.id
                  WHERE ar.organization_id = ${organizationId}
                  AND ar.status IN ('submitted', 'in_review', 'revision_requested')`;

  if (userId) {
    query = sql`${query} AND (ar.assigned_to = ${userId} OR ar.assigned_to IS NULL)`;
  }

  query = sql`${query} ORDER BY ar.submitted_at DESC`;

  const result = await db.execute(query);

  return result as any[];
}

export async function getMyApprovalRequests(
  organizationId: string,
  userId: string
) {
  const db = await getDb();
  if (!db) return [];

  const result = await db.execute(
    sql`SELECT ar.*, 
               fv.version_number as formulation_version_name,
               ff.name as formulation_product_name,
               u.name as requested_by_name
        FROM approval_requests ar
        LEFT JOIN formulation_versions fv ON ar.formulation_version_id = fv.id
        LEFT JOIN formulation_families ff ON fv.family_id = ff.id
        LEFT JOIN users u ON ar.requested_by = u.id
        WHERE ar.organization_id = ${organizationId}
        AND ar.requested_by = ${userId}
        ORDER BY ar.submitted_at DESC`
  );

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



// ==========================================================
// REVERSE ENGINEERING & COMPETITOR ANALYSIS
// ==========================================================

export async function createCompetitorProduct(data: {
  organizationId: string;
  userId: string;
  productName: string;
  manufacturer: string;
  productCode?: string;
  category?: string;
  domainId?: string;
  marketingClaims?: string[];
  technicalDataSheet?: string;
  msdsData?: string;
  observedProperties?: Record<string, any>;
  notes?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { competitorProducts } = await import("../drizzle/schema");

  const id = crypto.randomUUID();
  await db.insert(competitorProducts).values({
    id,
    organizationId: data.organizationId,
    userId: data.userId,
    productName: data.productName,
    manufacturer: data.manufacturer,
    productCode: data.productCode,
    category: data.category,
    domainId: data.domainId,
    marketingClaims: data.marketingClaims,
    technicalDataSheet: data.technicalDataSheet,
    msdsData: data.msdsData,
    observedProperties: data.observedProperties,
    notes: data.notes,
    analysisStatus: "pending",
  });

  return id;
}

export async function listCompetitorProducts(
  organizationId: string,
  filters?: { domainId?: string; category?: string; search?: string }
) {
  const db = await getDb();
  if (!db) return [];

  const { competitorProducts } = await import("../drizzle/schema");

  const conditions = [eq(competitorProducts.organizationId, organizationId)];

  if (filters?.domainId) {
    conditions.push(eq(competitorProducts.domainId, filters.domainId));
  }

  if (filters?.category) {
    conditions.push(eq(competitorProducts.category, filters.category));
  }

  if (filters?.search) {
    conditions.push(
      or(
        like(competitorProducts.productName, `%${filters.search}%`),
        like(competitorProducts.manufacturer, `%${filters.search}%`)
      )!
    );
  }

  return db
    .select()
    .from(competitorProducts)
    .where(and(...conditions))
    .orderBy(desc(competitorProducts.createdAt));
}

export async function getCompetitorProductById(id: string, organizationId: string) {
  const db = await getDb();
  if (!db) return null;

  const { competitorProducts } = await import("../drizzle/schema");

  const results = await db
    .select()
    .from(competitorProducts)
    .where(and(eq(competitorProducts.id, id), eq(competitorProducts.organizationId, organizationId)))
    .limit(1);

  return results[0] || null;
}

export async function updateCompetitorProduct(
  id: string,
  organizationId: string,
  updates: {
    extractedParameters?: Record<string, any>;
    suggestedFormulationStrategy?: string;
    targetProductProfile?: Record<string, any>;
    confidenceScore?: string;
    analysisStatus?: "pending" | "analyzing" | "completed" | "failed";
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { competitorProducts } = await import("../drizzle/schema");

  await db
    .update(competitorProducts)
    .set(updates)
    .where(and(eq(competitorProducts.id, id), eq(competitorProducts.organizationId, organizationId)));
}

export async function deleteCompetitorProduct(id: string, organizationId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { competitorProducts } = await import("../drizzle/schema");

  await db
    .delete(competitorProducts)
    .where(and(eq(competitorProducts.id, id), eq(competitorProducts.organizationId, organizationId)));
}

export async function createReverseEngineeringAnalysis(data: {
  organizationId: string;
  competitorProductId: string;
  userId: string;
  analysisType: "performance_translation" | "formulation_strategy" | "tpp_generation" | "cost_analysis" | "regulatory_comparison";
  inputData: Record<string, any>;
  results: Record<string, any>;
  recommendations?: string[];
  alternativeMaterials?: Array<{ materialId: string; similarity: number; rationale: string }>;
  estimatedCost?: string;
  feasibilityScore?: string;
  llmModelUsed?: string;
  tokensUsed?: number;
  costUsd?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { reverseEngineeringAnalyses } = await import("../drizzle/schema");

  const id = crypto.randomUUID();
  await db.insert(reverseEngineeringAnalyses).values({
    id,
    ...data,
  });

  return id;
}

export async function listReverseEngineeringAnalyses(
  organizationId: string,
  competitorProductId?: string
) {
  const db = await getDb();
  if (!db) return [];

  const { reverseEngineeringAnalyses } = await import("../drizzle/schema");

  const conditions = [eq(reverseEngineeringAnalyses.organizationId, organizationId)];

  if (competitorProductId) {
    conditions.push(eq(reverseEngineeringAnalyses.competitorProductId, competitorProductId));
  }

  return db
    .select()
    .from(reverseEngineeringAnalyses)
    .where(and(...conditions))
    .orderBy(desc(reverseEngineeringAnalyses.createdAt));
}

export async function getReverseEngineeringAnalysisById(id: string, organizationId: string) {
  const db = await getDb();
  if (!db) return null;

  const { reverseEngineeringAnalyses } = await import("../drizzle/schema");

  const results = await db
    .select()
    .from(reverseEngineeringAnalyses)
    .where(
      and(
        eq(reverseEngineeringAnalyses.id, id),
        eq(reverseEngineeringAnalyses.organizationId, organizationId)
      )
    )
    .limit(1);

  return results[0] || null;
}


// ==================== Patent & Literature Analysis ====================

export async function createPatent(data: {
  organizationId: string;
  title: string;
  patentNumber?: string;
  publicationDate?: string;
  inventors?: string[];
  assignee?: string;
  abstract?: string;
  fullText?: string;
  pdfUrl?: string;
  sourceUrl?: string;
  uploadedBy: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const { patents } = await import("../drizzle/schema");
  const id = crypto.randomUUID();

  await db.insert(patents).values({
    id,
    organizationId: data.organizationId,
    title: data.title,
    patentNumber: data.patentNumber || null,
    publicationDate: data.publicationDate || null,
    inventors: data.inventors ? JSON.stringify(data.inventors) : null,
    assignee: data.assignee || null,
    abstract: data.abstract || null,
    fullText: data.fullText || null,
    pdfUrl: data.pdfUrl || null,
    sourceUrl: data.sourceUrl || null,
    uploadedBy: data.uploadedBy,
    createdAt: new Date().toISOString(),
  });

  return id;
}

export async function listPatents(organizationId: string) {
  const db = await getDb();
  if (!db) return [];

  const { patents } = await import("../drizzle/schema");

  return db
    .select()
    .from(patents)
    .where(eq(patents.organizationId, organizationId))
    .orderBy(desc(patents.createdAt));
}

export async function getPatentById(id: string, organizationId: string) {
  const db = await getDb();
  if (!db) return null;

  const { patents } = await import("../drizzle/schema");

  const results = await db
    .select()
    .from(patents)
    .where(
      and(
        eq(patents.id, id),
        eq(patents.organizationId, organizationId)
      )
    )
    .limit(1);

  return results[0] || null;
}

export async function deletePatent(id: string, organizationId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const { patents } = await import("../drizzle/schema");

  await db
    .delete(patents)
    .where(
      and(
        eq(patents.id, id),
        eq(patents.organizationId, organizationId)
      )
    );
}

export async function createPatentAnalysis(data: {
  patentId: string;
  organizationId: string;
  chemicalCompounds?: any[];
  reactionMechanisms?: any[];
  processingConditions?: any;
  technologyCategory?: string;
  keyInnovations?: string[];
  competitorAnalysis?: any;
  marketApplications?: string[];
  formulationStrategies?: any[];
  materialSuggestions?: any[];
  processOptimizations?: any[];
  analyzedBy?: string;
  confidence?: string;
  notes?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const { patent_analyses } = await import("../drizzle/schema");
  const id = crypto.randomUUID();

  await db.insert(patent_analyses).values({
    id,
    patentId: data.patentId,
    organizationId: data.organizationId,
    chemicalCompounds: data.chemicalCompounds ? JSON.stringify(data.chemicalCompounds) : null,
    reactionMechanisms: data.reactionMechanisms ? JSON.stringify(data.reactionMechanisms) : null,
    processingConditions: data.processingConditions ? JSON.stringify(data.processingConditions) : null,
    technologyCategory: data.technologyCategory || null,
    keyInnovations: data.keyInnovations ? JSON.stringify(data.keyInnovations) : null,
    competitorAnalysis: data.competitorAnalysis ? JSON.stringify(data.competitorAnalysis) : null,
    marketApplications: data.marketApplications ? JSON.stringify(data.marketApplications) : null,
    formulationStrategies: data.formulationStrategies ? JSON.stringify(data.formulationStrategies) : null,
    materialSuggestions: data.materialSuggestions ? JSON.stringify(data.materialSuggestions) : null,
    processOptimizations: data.processOptimizations ? JSON.stringify(data.processOptimizations) : null,
    analysisDate: new Date().toISOString(),
    analyzedBy: data.analyzedBy || null,
    confidence: data.confidence || null,
    notes: data.notes || null,
  });

  return id;
}

export async function getPatentAnalysisByPatentId(patentId: string, organizationId: string) {
  const db = await getDb();
  if (!db) return null;

  const { patent_analyses } = await import("../drizzle/schema");

  const results = await db
    .select()
    .from(patent_analyses)
    .where(
      and(
        eq(patent_analyses.patentId, patentId),
        eq(patent_analyses.organizationId, organizationId)
      )
    )
    .orderBy(desc(patent_analyses.analysisDate))
    .limit(1);

  return results[0] || null;
}

export async function createLiteraturePaper(data: {
  organizationId: string;
  title: string;
  authors?: string[];
  journal?: string;
  publicationYear?: string;
  doi?: string;
  abstract?: string;
  fullText?: string;
  pdfUrl?: string;
  sourceUrl?: string;
  keywords?: string[];
  uploadedBy: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const { literature_papers } = await import("../drizzle/schema");
  const id = crypto.randomUUID();

  await db.insert(literature_papers).values({
    id,
    organizationId: data.organizationId,
    title: data.title,
    authors: data.authors ? JSON.stringify(data.authors) : null,
    journal: data.journal || null,
    publicationYear: data.publicationYear || null,
    doi: data.doi || null,
    abstract: data.abstract || null,
    fullText: data.fullText || null,
    pdfUrl: data.pdfUrl || null,
    sourceUrl: data.sourceUrl || null,
    keywords: data.keywords ? JSON.stringify(data.keywords) : null,
    uploadedBy: data.uploadedBy,
    createdAt: new Date().toISOString(),
  });

  return id;
}

export async function listLiteraturePapers(organizationId: string) {
  const db = await getDb();
  if (!db) return [];

  const { literature_papers } = await import("../drizzle/schema");

  return db
    .select()
    .from(literature_papers)
    .where(eq(literature_papers.organizationId, organizationId))
    .orderBy(desc(literature_papers.createdAt));
}

export async function getLiteraturePaperById(id: string, organizationId: string) {
  const db = await getDb();
  if (!db) return null;

  const { literature_papers } = await import("../drizzle/schema");

  const results = await db
    .select()
    .from(literature_papers)
    .where(
      and(
        eq(literature_papers.id, id),
        eq(literature_papers.organizationId, organizationId)
      )
    )
    .limit(1);

  return results[0] || null;
}

export async function deleteLiteraturePaper(id: string, organizationId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const { literature_papers } = await import("../drizzle/schema");

  await db
    .delete(literature_papers)
    .where(
      and(
        eq(literature_papers.id, id),
        eq(literature_papers.organizationId, organizationId)
      )
    );
}


// ============================================================================
// Equipment Management
// ============================================================================

export async function createEquipment(data: {
  organizationId: string;
  name: string;
  equipmentType: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  location?: string;
  capacity?: { value: number; unit: string };
  operatingTemperatureRange?: { min: number; max: number; unit: string };
  operatingPressureRange?: { min: number; max: number; unit: string };
  mixingSpeedRange?: { min: number; max: number; unit: string };
  powerRating?: { value: number; unit: string };
  compatibleMaterialTypes?: string[];
  incompatibleMaterials?: string[];
  materialContactSurfaces?: string[];
  supportedProcesses?: string[];
  cleaningRequirements?: string;
  changeoverTime?: string;
  status?: "operational" | "maintenance" | "offline" | "decommissioned";
  lastMaintenanceDate?: Date;
  nextMaintenanceDate?: Date;
  maintenanceNotes?: string;
  notes?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const { equipment } = await import("../drizzle/schema");

  const [result] = await db.insert(equipment).values(data);
  return result;
}

export async function listEquipment(organizationId: string, filters?: {
  equipmentType?: string;
  status?: string;
}) {
  const db = await getDb();
  if (!db) return [];

  const { equipment } = await import("../drizzle/schema");

  const conditions = [eq(equipment.organizationId, organizationId)];

  if (filters?.equipmentType) {
    conditions.push(eq(equipment.equipmentType, filters.equipmentType));
  }

  if (filters?.status) {
    conditions.push(eq(equipment.status, filters.status as any));
  }

  const results = await db
    .select()
    .from(equipment)
    .where(and(...conditions))
    .orderBy(desc(equipment.createdAt));
    
  return results;
}

export async function getEquipmentById(id: string, organizationId: string) {
  const db = await getDb();
  if (!db) return null;

  const { equipment } = await import("../drizzle/schema");

  const results = await db
    .select()
    .from(equipment)
    .where(
      and(
        eq(equipment.id, id),
        eq(equipment.organizationId, organizationId)
      )
    )
    .limit(1);

  return results[0] || null;
}

export async function updateEquipment(
  id: string,
  organizationId: string,
  data: Partial<{
    name: string;
    equipmentType: string;
    manufacturer: string;
    model: string;
    serialNumber: string;
    location: string;
    capacity: { value: number; unit: string };
    operatingTemperatureRange: { min: number; max: number; unit: string };
    operatingPressureRange: { min: number; max: number; unit: string };
    mixingSpeedRange: { min: number; max: number; unit: string };
    powerRating: { value: number; unit: string };
    compatibleMaterialTypes: string[];
    incompatibleMaterials: string[];
    materialContactSurfaces: string[];
    supportedProcesses: string[];
    cleaningRequirements: string;
    changeoverTime: string;
    status: "operational" | "maintenance" | "offline" | "decommissioned";
    lastMaintenanceDate: Date;
    nextMaintenanceDate: Date;
    maintenanceNotes: string;
    notes: string;
  }>
) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const { equipment } = await import("../drizzle/schema");

  await db
    .update(equipment)
    .set(data)
    .where(
      and(
        eq(equipment.id, id),
        eq(equipment.organizationId, organizationId)
      )
    );
}

export async function deleteEquipment(id: string, organizationId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const { equipment } = await import("../drizzle/schema");

  await db
    .delete(equipment)
    .where(
      and(
        eq(equipment.id, id),
        eq(equipment.organizationId, organizationId)
      )
    );
}

// ============================================================================
// Equipment Compatibility Analysis
// ============================================================================

export async function createCompatibilityAnalysis(data: {
  organizationId: string;
  formulationVersionId: string;
  equipmentId: string;
  isCompatible: boolean;
  compatibilityScore?: string;
  incompatibilityReasons?: string[];
  requiredModifications?: string[];
  processingConstraints?: Record<string, any>;
  analyzedBy?: string;
  notes?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const { formulation_equipment_compatibility } = await import("../drizzle/schema");

  const [result] = await db.insert(formulation_equipment_compatibility).values(data);
  return result;
}

export async function getCompatibilityAnalysis(
  formulationVersionId: string,
  equipmentId: string,
  organizationId: string
) {
  const db = await getDb();
  if (!db) return null;

  const { formulation_equipment_compatibility } = await import("../drizzle/schema");

  const results = await db
    .select()
    .from(formulation_equipment_compatibility)
    .where(
      and(
        eq(formulation_equipment_compatibility.formulationVersionId, formulationVersionId),
        eq(formulation_equipment_compatibility.equipmentId, equipmentId),
        eq(formulation_equipment_compatibility.organizationId, organizationId)
      )
    )
    .orderBy(desc(formulation_equipment_compatibility.analyzedAt))
    .limit(1);

  return results[0] || null;
}

export async function listCompatibilityAnalyses(
  formulationVersionId: string,
  organizationId: string
) {
  const db = await getDb();
  if (!db) return [];

  const { formulation_equipment_compatibility, equipment } = await import("../drizzle/schema");

  const results = await db
    .select({
      id: formulation_equipment_compatibility.id,
      formulationVersionId: formulation_equipment_compatibility.formulationVersionId,
      equipmentId: formulation_equipment_compatibility.equipmentId,
      equipmentName: equipment.name,
      equipmentType: equipment.equipmentType,
      isCompatible: formulation_equipment_compatibility.isCompatible,
      compatibilityScore: formulation_equipment_compatibility.compatibilityScore,
      incompatibilityReasons: formulation_equipment_compatibility.incompatibilityReasons,
      requiredModifications: formulation_equipment_compatibility.requiredModifications,
      processingConstraints: formulation_equipment_compatibility.processingConstraints,
      analyzedAt: formulation_equipment_compatibility.analyzedAt,
      notes: formulation_equipment_compatibility.notes,
    })
    .from(formulation_equipment_compatibility)
    .leftJoin(equipment, eq(formulation_equipment_compatibility.equipmentId, equipment.id))
    .where(
      and(
        eq(formulation_equipment_compatibility.formulationVersionId, formulationVersionId),
        eq(formulation_equipment_compatibility.organizationId, organizationId)
      )
    )
    .orderBy(desc(formulation_equipment_compatibility.analyzedAt));

  return results;
}


// ============================================================================
// Scale-Up Risk Analysis
// ============================================================================

export async function createScaleUpAnalysis(data: {
  organizationId: string;
  formulationVersionId: string;
  labScale: { volume: number; unit: string };
  pilotScale: { volume: number; unit: string };
  targetScale?: { volume: number; unit: string };
  reactionType: string;
  rateConstant: number;
  activationEnergy: number;
  reactionOrder: number;
  heatGenerationRate: number;
  coolingCapacityLab: number;
  coolingCapacityPilot: number;
  temperatureRisePrediction: number;
  mixingTimeLab: number;
  mixingTimePilot: number;
  reynoldsNumberLab: number;
  reynoldsNumberPilot: number;
  powerPerVolumeLab: number;
  powerPerVolumePilot: number;
  overallRiskScore: number;
  riskLevel: string;
  identifiedRisks: Array<any>;
  processModifications: string[];
  equipmentRecommendations: string[];
  controlStrategyChanges: string[];
  additionalTestingNeeded: string[];
  analyzedBy: string;
  notes?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const { scaleup_analyses } = await import("../drizzle/schema");

  const [result] = await db.insert(scaleup_analyses).values({
    ...data,
    rateConstant: data.rateConstant.toString(),
    activationEnergy: data.activationEnergy.toString(),
    reactionOrder: data.reactionOrder.toString(),
    heatGenerationRate: data.heatGenerationRate.toString(),
    coolingCapacityLab: data.coolingCapacityLab.toString(),
    coolingCapacityPilot: data.coolingCapacityPilot.toString(),
    temperatureRisePrediction: data.temperatureRisePrediction.toString(),
    mixingTimeLab: data.mixingTimeLab.toString(),
    mixingTimePilot: data.mixingTimePilot.toString(),
    reynoldsNumberLab: data.reynoldsNumberLab.toString(),
    reynoldsNumberPilot: data.reynoldsNumberPilot.toString(),
    powerPerVolumeLab: data.powerPerVolumeLab.toString(),
    powerPerVolumePilot: data.powerPerVolumePilot.toString(),
    overallRiskScore: data.overallRiskScore.toString(),
  });
  return result;
}

export async function listScaleUpAnalyses(
  formulationVersionId: string,
  organizationId: string
) {
  const db = await getDb();
  if (!db) return [];

  const { scaleup_analyses } = await import("../drizzle/schema");

  return db
    .select()
    .from(scaleup_analyses)
    .where(
      and(
        eq(scaleup_analyses.formulationVersionId, formulationVersionId),
        eq(scaleup_analyses.organizationId, organizationId)
      )
    )
    .orderBy(desc(scaleup_analyses.analyzedAt));
}

export async function getScaleUpAnalysisById(id: string, organizationId: string) {
  const db = await getDb();
  if (!db) return null;

  const { scaleup_analyses } = await import("../drizzle/schema");

  const results = await db
    .select()
    .from(scaleup_analyses)
    .where(
      and(
        eq(scaleup_analyses.id, id),
        eq(scaleup_analyses.organizationId, organizationId)
      )
    )
    .limit(1);

  return results[0] || null;
}

export async function deleteScaleUpAnalysis(id: string, organizationId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const { scaleup_analyses } = await import("../drizzle/schema");

  await db
    .delete(scaleup_analyses)
    .where(
      and(
        eq(scaleup_analyses.id, id),
        eq(scaleup_analyses.organizationId, organizationId)
      )
    );
}

export async function createScaleUpScenario(data: {
  organizationId: string;
  analysisId: string;
  scenarioName: string;
  description?: string;
  temperature?: number;
  pressure?: number;
  mixingSpeed?: number;
  additionRate?: number;
  holdTime?: number;
  predictedYield?: number;
  predictedQuality?: string;
  predictedCycleTime?: number;
  predictedCost?: number;
  successProbability?: number;
  confidenceLevel?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const { scaleup_scenarios } = await import("../drizzle/schema");

  const [result] = await db.insert(scaleup_scenarios).values({
    ...data,
    temperature: data.temperature?.toString(),
    pressure: data.pressure?.toString(),
    mixingSpeed: data.mixingSpeed?.toString(),
    additionRate: data.additionRate?.toString(),
    holdTime: data.holdTime?.toString(),
    predictedYield: data.predictedYield?.toString(),
    predictedCycleTime: data.predictedCycleTime?.toString(),
    predictedCost: data.predictedCost?.toString(),
    successProbability: data.successProbability?.toString(),
    confidenceLevel: data.confidenceLevel?.toString(),
  });
  return result;
}

export async function listScaleUpScenarios(analysisId: string, organizationId: string) {
  const db = await getDb();
  if (!db) return [];

  const { scaleup_scenarios } = await import("../drizzle/schema");

  return db
    .select()
    .from(scaleup_scenarios)
    .where(
      and(
        eq(scaleup_scenarios.analysisId, analysisId),
        eq(scaleup_scenarios.organizationId, organizationId)
      )
    )
    .orderBy(desc(scaleup_scenarios.createdAt));
}


// Manufacturing Documentation Functions
export async function createManufacturingDocument(data: {
  formulationVersionId: string;
  organizationId: string;
  documentType: "sop" | "batch_process" | "process_flow_diagram" | "tech_transfer_package";
  title: string;
  batchSize?: number;
  batchUnit?: string;
  equipmentIds?: string[];
  safetyPrecautions?: string[];
  qualityCheckpoints?: string[];
  generatedContent?: string;
  createdBy: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const { manufacturing_documents } = await import("../drizzle/schema");

  const values: any = {
    organizationId: data.organizationId,
    formulationVersionId: data.formulationVersionId,
    documentType: data.documentType,
    title: data.title,
    createdBy: data.createdBy,
  };

  if (data.batchSize !== undefined) values.batchSize = data.batchSize.toString();
  if (data.batchUnit) values.batchUnit = data.batchUnit;
  if (data.equipmentIds) values.equipmentIds = data.equipmentIds;
  if (data.safetyPrecautions) values.safetyPrecautions = data.safetyPrecautions;
  if (data.qualityCheckpoints) values.qualityCheckpoints = data.qualityCheckpoints;
  if (data.generatedContent) values.generatedContent = data.generatedContent;

  const [result] = await db.insert(manufacturing_documents).values(values);
  return result;
}

export async function getManufacturingDocumentById(id: string, organizationId: string) {
  const db = await getDb();
  if (!db) return undefined;

  const { manufacturing_documents } = await import("../drizzle/schema");

  const [result] = await db
    .select()
    .from(manufacturing_documents)
    .where(
      and(
        eq(manufacturing_documents.id, id),
        eq(manufacturing_documents.organizationId, organizationId)
      )
    );
  return result;
}

export async function listManufacturingDocuments(organizationId: string, documentType?: string) {
  const db = await getDb();
  if (!db) return [];

  const { manufacturing_documents } = await import("../drizzle/schema");

  const conditions = [eq(manufacturing_documents.organizationId, organizationId)];
  if (documentType) {
    conditions.push(eq(manufacturing_documents.documentType, documentType as any));
  }

  return db
    .select()
    .from(manufacturing_documents)
    .where(and(...conditions))
    .orderBy(desc(manufacturing_documents.createdAt));
}

export async function createManufacturingStep(data: {
  documentId: string;
  stepNumber: number;
  stepName: string;
  description?: string;
  duration?: number;
  temperature?: number;
  temperatureUnit?: string;
  pressure?: number;
  pressureUnit?: string;
  mixingSpeed?: number;
  mixingSpeedUnit?: string;
  equipmentId?: string;
  criticalParameters?: Record<string, any>;
  safetyNotes?: string;
  qualityChecks?: string[];
}) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const { manufacturing_steps } = await import("../drizzle/schema");

  const values: any = {
    documentId: data.documentId,
    stepNumber: data.stepNumber,
    stepName: data.stepName,
  };

  if (data.description) values.description = data.description;
  if (data.duration !== undefined) values.duration = data.duration;
  if (data.temperature !== undefined) values.temperature = data.temperature.toString();
  if (data.temperatureUnit) values.temperatureUnit = data.temperatureUnit;
  if (data.pressure !== undefined) values.pressure = data.pressure.toString();
  if (data.pressureUnit) values.pressureUnit = data.pressureUnit;
  if (data.mixingSpeed !== undefined) values.mixingSpeed = data.mixingSpeed.toString();
  if (data.mixingSpeedUnit) values.mixingSpeedUnit = data.mixingSpeedUnit;
  if (data.equipmentId) values.equipmentId = data.equipmentId;
  if (data.criticalParameters) values.criticalParameters = data.criticalParameters;
  if (data.safetyNotes) values.safetyNotes = data.safetyNotes;
  if (data.qualityChecks) values.qualityChecks = data.qualityChecks;

  const [result] = await db.insert(manufacturing_steps).values(values);
  return result;
}

export async function listManufacturingSteps(documentId: string) {
  const db = await getDb();
  if (!db) return [];

  const { manufacturing_steps } = await import("../drizzle/schema");

  return db
    .select()
    .from(manufacturing_steps)
    .where(eq(manufacturing_steps.documentId, documentId))
    .orderBy(manufacturing_steps.stepNumber);
}


// ============================================================================
// Issue Tracking & Improvement System
// ============================================================================

export async function createIssue(data: {
  organizationId: string;
  formulationVersionId?: string;
  trialId?: string;
  issueType: string;
  severity: string;
  title: string;
  description: string;
  reportedBy: string;
  affectedBatches?: string[];
  costImpact?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const { issues } = await import("../drizzle/schema");

  const values: any = {
    organizationId: data.organizationId,
    issueType: data.issueType,
    severity: data.severity,
    title: data.title,
    description: data.description,
    reportedBy: data.reportedBy,
  };

  if (data.formulationVersionId) values.formulationVersionId = data.formulationVersionId;
  if (data.trialId) values.trialId = data.trialId;
  if (data.affectedBatches) values.affectedBatches = data.affectedBatches;
  if (data.costImpact !== undefined) values.costImpact = data.costImpact.toString();

  const [result] = await db.insert(issues).values(values);
  return result;
}

export async function getIssueById(issueId: string, organizationId: string) {
  const db = await getDb();
  if (!db) return null;

  const { issues } = await import("../drizzle/schema");

  const [issue] = await db
    .select()
    .from(issues)
    .where(and(eq(issues.id, issueId), eq(issues.organizationId, organizationId)));

  return issue;
}

export async function listIssues(organizationId: string, filters?: {
  status?: string;
  severity?: string;
  issueType?: string;
}) {
  const db = await getDb();
  if (!db) return [];

  const { issues } = await import("../drizzle/schema");

  const conditions = [eq(issues.organizationId, organizationId)];

  if (filters?.status) {
    conditions.push(eq(issues.status, filters.status as any));
  }
  if (filters?.severity) {
    conditions.push(eq(issues.severity, filters.severity as any));
  }
  if (filters?.issueType) {
    conditions.push(eq(issues.issueType, filters.issueType as any));
  }

  return db
    .select()
    .from(issues)
    .where(and(...conditions))
    .orderBy(desc(issues.reportedAt));
}

export async function updateIssue(
  issueId: string,
  organizationId: string,
  data: {
    status?: string;
    rootCause?: string;
    correctiveAction?: string;
    preventiveAction?: string;
    assignedTo?: string;
    resolvedBy?: string;
    resolvedAt?: Date;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const { issues } = await import("../drizzle/schema");

  const values: any = {};
  if (data.status) values.status = data.status;
  if (data.rootCause) values.rootCause = data.rootCause;
  if (data.correctiveAction) values.correctiveAction = data.correctiveAction;
  if (data.preventiveAction) values.preventiveAction = data.preventiveAction;
  if (data.assignedTo) values.assignedTo = data.assignedTo;
  if (data.resolvedBy) values.resolvedBy = data.resolvedBy;
  if (data.resolvedAt) values.resolvedAt = data.resolvedAt;

  await db
    .update(issues)
    .set(values)
    .where(and(eq(issues.id, issueId), eq(issues.organizationId, organizationId)));

  return getIssueById(issueId, organizationId);
}

export async function deleteIssue(issueId: string, organizationId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const { issues } = await import("../drizzle/schema");

  await db
    .delete(issues)
    .where(and(eq(issues.id, issueId), eq(issues.organizationId, organizationId)));

  return true;
}

export async function createIssueAnalysis(data: {
  issueId: string;
  analysisType: string;
  findings: string;
  recommendations?: string[];
  similarIssues?: Array<{ issueId: string; similarity: number; title: string }>;
  preventionStrategies?: string[];
  confidence?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const { issue_analysis } = await import("../drizzle/schema");

  const values: any = {
    issueId: data.issueId,
    analysisType: data.analysisType,
    findings: data.findings,
  };

  if (data.recommendations) values.recommendations = data.recommendations;
  if (data.similarIssues) values.similarIssues = data.similarIssues;
  if (data.preventionStrategies) values.preventionStrategies = data.preventionStrategies;
  if (data.confidence !== undefined) values.confidence = data.confidence.toString();

  const [result] = await db.insert(issue_analysis).values(values);
  return result;
}

export async function getIssueAnalyses(issueId: string) {
  const db = await getDb();
  if (!db) return [];

  const { issue_analysis } = await import("../drizzle/schema");

  return db
    .select()
    .from(issue_analysis)
    .where(eq(issue_analysis.issueId, issueId))
    .orderBy(desc(issue_analysis.analyzedAt));
}

export async function createImprovementAction(data: {
  organizationId: string;
  issueId?: string;
  actionType: string;
  title: string;
  description: string;
  priority: string;
  createdBy: string;
  expectedImpact?: string;
  estimatedCost?: number;
  assignedTo?: string;
  dueDate?: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const { improvement_actions } = await import("../drizzle/schema");

  const values: any = {
    organizationId: data.organizationId,
    actionType: data.actionType,
    title: data.title,
    description: data.description,
    priority: data.priority,
    createdBy: data.createdBy,
  };

  if (data.issueId) values.issueId = data.issueId;
  if (data.expectedImpact) values.expectedImpact = data.expectedImpact;
  if (data.estimatedCost !== undefined) values.estimatedCost = data.estimatedCost.toString();
  if (data.assignedTo) values.assignedTo = data.assignedTo;
  if (data.dueDate) values.dueDate = data.dueDate;

  const [result] = await db.insert(improvement_actions).values(values);
  return result;
}

export async function listImprovementActions(organizationId: string, filters?: {
  status?: string;
  priority?: string;
  issueId?: string;
}) {
  const db = await getDb();
  if (!db) return [];

  const { improvement_actions } = await import("../drizzle/schema");

  const conditions = [eq(improvement_actions.organizationId, organizationId)];

  if (filters?.status) {
    conditions.push(eq(improvement_actions.status, filters.status as any));
  }
  if (filters?.priority) {
    conditions.push(eq(improvement_actions.priority, filters.priority as any));
  }
  if (filters?.issueId) {
    conditions.push(eq(improvement_actions.issueId, filters.issueId));
  }

  return db
    .select()
    .from(improvement_actions)
    .where(and(...conditions))
    .orderBy(desc(improvement_actions.createdAt));
}

export async function updateImprovementAction(
  actionId: string,
  organizationId: string,
  data: {
    status?: string;
    actualImpact?: string;
    actualCost?: number;
    completedAt?: Date;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const { improvement_actions } = await import("../drizzle/schema");

  const values: any = {};
  if (data.status) values.status = data.status;
  if (data.actualImpact) values.actualImpact = data.actualImpact;
  if (data.actualCost !== undefined) values.actualCost = data.actualCost.toString();
  if (data.completedAt) values.completedAt = data.completedAt;

  await db
    .update(improvement_actions)
    .set(values)
    .where(
      and(
        eq(improvement_actions.id, actionId),
        eq(improvement_actions.organizationId, organizationId)
      )
    );

  return true;
}
