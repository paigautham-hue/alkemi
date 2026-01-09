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
} from "../drizzle/schema";
import { ENV } from './_core/env';

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
