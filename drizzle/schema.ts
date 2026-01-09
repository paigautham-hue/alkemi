import {
  bigint,
  boolean,
  decimal,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
  index,
} from "drizzle-orm/mysql-core";

/**
 * ALKEMI™ v5.1 Database Schema - Phase 1
 * Core tables for multi-tenant formulation management
 * 
 * CRITICAL: All queries MUST filter by organizationId to ensure tenant isolation
 */

// ==========================================================
// ORGANIZATIONS & USERS
// ==========================================================

export const organizations = mysqlTable("organizations", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  settings: json("settings").$type<Record<string, any>>(),
  // LLM provider configuration
  allowedLlmProviders: json("allowed_llm_providers").$type<string[]>(),
  deniedLlmProviders: json("denied_llm_providers").$type<string[]>(),
  // Cost budgets
  dailyCostBudget: decimal("daily_cost_budget", { precision: 10, scale: 2 }).default("100.00"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

export const users = mysqlTable("users", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: varchar("organization_id", { length: 36 }).notNull().references(() => organizations.id, { onDelete: "cascade" }),
  // Manus OAuth fields
  openId: varchar("open_id", { length: 64 }).notNull().unique(),
  email: varchar("email", { length: 320 }),
  name: text("name"),
  loginMethod: varchar("login_method", { length: 64 }),
  // ALKEMI-specific fields
  role: mysqlEnum("role", [
    "admin",
    "manager",
    "chemist",
    "senior_chemist",
    "production",
    "procurement",
    "viewer"
  ]).notNull().default("chemist"),
  // SSO fields for Azure AD
  ssoProvider: varchar("sso_provider", { length: 64 }),
  ssoSubject: varchar("sso_subject", { length: 255 }),
  preferences: json("preferences").$type<Record<string, any>>(),
  isActive: boolean("is_active").notNull().default(true),
  dailyCostBudget: decimal("daily_cost_budget", { precision: 10, scale: 2 }).default("10.00"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
  lastSignedIn: timestamp("last_signed_in").notNull().defaultNow(),
}, (table) => ({
  orgIdx: index("idx_users_org").on(table.organizationId),
  emailIdx: index("idx_users_email").on(table.email),
  orgEmailIdx: uniqueIndex("idx_users_org_email").on(table.organizationId, table.email),
}));

// ==========================================================
// DOMAINS (Chemistry Domain Packs)
// ==========================================================

export const domains = mysqlTable("domains", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  key: varchar("key", { length: 64 }).notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  version: varchar("version", { length: 32 }).notNull().default("1.0.0"),
  config: json("config").$type<Record<string, any>>(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const organizationDomains = mysqlTable("organization_domains", {
  organizationId: varchar("organization_id", { length: 36 }).notNull().references(() => organizations.id, { onDelete: "cascade" }),
  domainId: varchar("domain_id", { length: 36 }).notNull().references(() => domains.id, { onDelete: "restrict" }),
  settings: json("settings").$type<Record<string, any>>(),
  enabledAt: timestamp("enabled_at").notNull().defaultNow(),
}, (table) => ({
  pk: uniqueIndex("pk_org_domains").on(table.organizationId, table.domainId),
}));

// ==========================================================
// SUPPLIERS
// ==========================================================

export const suppliers = mysqlTable("suppliers", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: varchar("organization_id", { length: 36 }).notNull().references(() => organizations.id, { onDelete: "cascade" }),
  code: varchar("code", { length: 64 }).notNull(),
  name: text("name").notNull(),
  country: varchar("country", { length: 2 }),
  contactEmail: varchar("contact_email", { length: 320 }),
  contactPhone: varchar("contact_phone", { length: 32 }),
  address: text("address"),
  riskScore: decimal("risk_score", { precision: 5, scale: 2 }).default("0.00"),
  qualificationStatus: mysqlEnum("qualification_status", [
    "pending",
    "qualified",
    "disqualified",
    "under_review"
  ]).notNull().default("pending"),
  notes: text("notes"),
  metadata: json("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
}, (table) => ({
  orgIdx: index("idx_suppliers_org").on(table.organizationId),
  orgCodeIdx: uniqueIndex("idx_suppliers_org_code").on(table.organizationId, table.code),
}));

// ==========================================================
// MATERIALS
// ==========================================================

export const materials = mysqlTable("materials", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: varchar("organization_id", { length: 36 }).notNull().references(() => organizations.id, { onDelete: "cascade" }),
  domainId: varchar("domain_id", { length: 36 }).notNull().references(() => domains.id, { onDelete: "restrict" }),
  
  // Identification
  code: varchar("code", { length: 64 }).notNull(),
  name: text("name").notNull(),
  tradeName: text("trade_name"),
  category: varchar("category", { length: 64 }),
  casNumber: varchar("cas_number", { length: 32 }),
  
  // Supplier info
  supplierId: varchar("supplier_id", { length: 36 }).references(() => suppliers.id, { onDelete: "set null" }),
  supplierProductCode: varchar("supplier_product_code", { length: 128 }),
  
  // Physical properties
  density: decimal("density", { precision: 10, scale: 4 }),
  viscosity: decimal("viscosity", { precision: 10, scale: 2 }),
  molecularWeight: decimal("molecular_weight", { precision: 10, scale: 2 }),
  
  // Hansen Solubility Parameters
  hansenD: decimal("hansen_d", { precision: 10, scale: 4 }),
  hansenP: decimal("hansen_p", { precision: 10, scale: 4 }),
  hansenH: decimal("hansen_h", { precision: 10, scale: 4 }),
  
  // Regulatory
  regulatoryStatus: json("regulatory_status").$type<Record<string, any>>(),
  
  // Cost
  costPerKg: decimal("cost_per_kg", { precision: 10, scale: 2 }),
  currency: varchar("currency", { length: 3 }).default("USD"),
  
  // Metadata
  metadata: json("metadata").$type<Record<string, any>>(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
}, (table) => ({
  orgIdx: index("idx_materials_org").on(table.organizationId),
  domainIdx: index("idx_materials_domain").on(table.domainId),
  orgCodeIdx: uniqueIndex("idx_materials_org_code").on(table.organizationId, table.code),
}));

// ==========================================================
// FORMULATIONS
// ==========================================================

export const formulationFamilies = mysqlTable("formulation_families", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: varchar("organization_id", { length: 36 }).notNull().references(() => organizations.id, { onDelete: "cascade" }),
  domainId: varchar("domain_id", { length: 36 }).notNull().references(() => domains.id, { onDelete: "restrict" }),
  code: varchar("code", { length: 64 }).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  targetApplication: text("target_application"),
  confidentialityLevel: mysqlEnum("confidentiality_level", [
    "public",
    "internal",
    "confidential",
    "restricted"
  ]).notNull().default("internal"),
  metadata: json("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
}, (table) => ({
  orgIdx: index("idx_formulation_families_org").on(table.organizationId),
  orgCodeIdx: uniqueIndex("idx_formulation_families_org_code").on(table.organizationId, table.code),
}));

export const formulationVersions = mysqlTable("formulation_versions", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: varchar("organization_id", { length: 36 }).notNull().references(() => organizations.id, { onDelete: "cascade" }),
  familyId: varchar("family_id", { length: 36 }).notNull().references(() => formulationFamilies.id, { onDelete: "cascade" }),
  
  // Version control
  versionNumber: varchar("version_number", { length: 32 }).notNull(),
  parentVersionId: varchar("parent_version_id", { length: 36 }),
  branchType: mysqlEnum("branch_type", [
    "revision",
    "variant",
    "cost_reduction",
    "customer_specific",
    "experimental"
  ]),
  
  // Status
  status: mysqlEnum("status", [
    "draft",
    "submitted",
    "in_review",
    "revision_requested",
    "approved",
    "production",
    "rejected",
    "archived"
  ]).notNull().default("draft"),
  
  // Authorship
  createdBy: varchar("created_by", { length: 36 }).notNull().references(() => users.id, { onDelete: "restrict" }),
  approvedBy: varchar("approved_by", { length: 36 }).references(() => users.id, { onDelete: "set null" }),
  approvedAt: timestamp("approved_at"),
  
  // Properties
  targetProperties: json("target_properties").$type<Record<string, any>>(),
  notes: text("notes"),
  changeReason: text("change_reason"),
  
  metadata: json("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
}, (table) => ({
  orgIdx: index("idx_formulation_versions_org").on(table.organizationId),
  familyIdx: index("idx_formulation_versions_family").on(table.familyId),
  statusIdx: index("idx_formulation_versions_status").on(table.status),
}));

export const formulationComponents = mysqlTable("formulation_components", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: varchar("organization_id", { length: 36 }).notNull().references(() => organizations.id, { onDelete: "cascade" }),
  versionId: varchar("version_id", { length: 36 }).notNull().references(() => formulationVersions.id, { onDelete: "cascade" }),
  materialId: varchar("material_id", { length: 36 }).notNull().references(() => materials.id, { onDelete: "restrict" }),
  
  percentage: decimal("percentage", { precision: 10, scale: 6 }).notNull(),
  role: varchar("role", { length: 64 }),
  notes: text("notes"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  orgIdx: index("idx_formulation_components_org").on(table.organizationId),
  versionIdx: index("idx_formulation_components_version").on(table.versionId),
}));

// ==========================================================
// TYPE EXPORTS
// ==========================================================

export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = typeof organizations.$inferInsert;

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type Domain = typeof domains.$inferSelect;
export type InsertDomain = typeof domains.$inferInsert;

export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = typeof suppliers.$inferInsert;

export type Material = typeof materials.$inferSelect;
export type InsertMaterial = typeof materials.$inferInsert;

export type FormulationFamily = typeof formulationFamilies.$inferSelect;
export type InsertFormulationFamily = typeof formulationFamilies.$inferInsert;

export type FormulationVersion = typeof formulationVersions.$inferSelect;
export type InsertFormulationVersion = typeof formulationVersions.$inferInsert;

export type FormulationComponent = typeof formulationComponents.$inferSelect;
export type InsertFormulationComponent = typeof formulationComponents.$inferInsert;
