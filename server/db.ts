import { and, desc, eq, like, or, sql } from "drizzle-orm";
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
 * For the owner (first user), creates a default organization.
 * For other users, they must be invited to an existing organization.
 */
export async function getOrCreateOrganizationForUser(userOpenId: string, userName: string | null): Promise<string> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
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

  // For non-owner users, they must already have an organization assigned
  // This will be handled through invitation flow later
  throw new Error("User must be invited to an organization");
}

// ==========================================================
// MATERIALS
// ==========================================================

export async function getMaterials(organizationId: string, filters?: {
  search?: string;
  category?: string;
  domainId?: string;
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
  await db.insert(materials).values({ ...material, id });
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
  await db.insert(suppliers).values({ ...supplier, id });
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
  await db.insert(formulationFamilies).values({ ...family, id });
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
  await db.insert(formulationVersions).values({ ...version, id });
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
  await db.insert(formulationComponents).values({ ...component, id });
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
  
  await db.insert(testConditionSets).values({
    id: testConditionSetId,
    organizationId: data.organizationId,
    domainId: data.domainId,
    name: data.name,
    description: data.description,
    isStandard: data.isStandard,
    createdBy: data.createdBy,
  });

  if (data.parameters.length > 0) {
    await db.insert(testConditionParameters).values(
      data.parameters.map(param => ({
        id: nanoid(),
        testConditionSetId,
        parameterName: param.parameterName,
        parameterValue: param.parameterValue,
        unit: param.unit,
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

  await db.insert(predictions).values({
    id: predictionId,
    organizationId: data.organizationId,
    formulationVersionId: data.formulationVersionId,
    testConditionSetId: data.testConditionSetId,
    propertyName: data.propertyName,
    predictedValue: data.predictedValue.toString(),
    unit: data.unit,
    uncertaintyLower: data.uncertaintyLower?.toString(),
    uncertaintyUpper: data.uncertaintyUpper?.toString(),
    confidenceLevel: data.confidenceLevel?.toString(),
    probabilityInSpec: data.probabilityInSpec?.toString(),
    modelName: data.modelName,
    modelVersion: data.modelVersion,
    requestedBy: data.requestedBy,
  });

  if (data.featureImportance.length > 0) {
    await db.insert(predictionFeatures).values(
      data.featureImportance.map((feature) => ({
        id: nanoid(),
        predictionId,
        featureName: feature.featureName,
        importance: feature.importance.toString(),
        contribution: feature.contribution.toString(),
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
