import {
  bigint,
  boolean,
  date,
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
  refractiveIndex: decimal("refractive_index", { precision: 10, scale: 6 }),
  glassTransitionTemp: decimal("glass_transition_temp", { precision: 10, scale: 2 }),
  
  // Hansen Solubility Parameters
  hansenD: decimal("hansen_d", { precision: 10, scale: 4 }),
  hansenP: decimal("hansen_p", { precision: 10, scale: 4 }),
  hansenH: decimal("hansen_h", { precision: 10, scale: 4 }),
  hansenR0: decimal("hansen_r0", { precision: 10, scale: 4 }), // interaction radius (sphere), MPa^0.5

  // Materials v2 — first-principles inputs (Phase 2)
  // Function taxonomy key from the domain pack (binder, photoinitiator, pigment, …).
  // Stored as varchar (not DB enum) because taxonomies are pack-defined per domain.
  materialFunction: varchar("material_function", { length: 50 }),
  subFunction: varchar("sub_function", { length: 100 }),
  solidsContent: decimal("solids_content", { precision: 5, scale: 2 }),   // % non-volatile
  vocContent: decimal("voc_content", { precision: 8, scale: 2 }),         // g/L
  functionality: decimal("functionality", { precision: 5, scale: 2 }),    // reactive groups per molecule
  equivalentWeight: decimal("equivalent_weight", { precision: 10, scale: 2 }), // g/eq (acrylate EW, EEW, AHEW…)
  particleSizeD50: decimal("particle_size_d50", { precision: 10, scale: 4 }), // µm
  oilAbsorption: decimal("oil_absorption", { precision: 6, scale: 2 }),   // g oil / 100 g pigment (CPVC input)
  hlb: decimal("hlb", { precision: 4, scale: 1 }),
  surfaceTension: decimal("surface_tension", { precision: 6, scale: 2 }), // mN/m at 25°C
  molarVolume: decimal("molar_volume", { precision: 10, scale: 2 }),      // cm³/mol (volume-fraction HSP)
  smiles: text("smiles"),
  inchiKey: varchar("inchi_key", { length: 27 }),
  pubchemCid: varchar("pubchem_cid", { length: 20 }),

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

/**
 * Qualified, provenance-tracked property values (Materials v2).
 * The typed columns on `materials` are the hot-path defaults; this table
 * holds temperature/shear-qualified values, alternative sources, and the
 * audit trail of where every number came from.
 */
export const materialProperties = mysqlTable("material_properties", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  materialId: varchar("material_id", { length: 36 }).notNull().references(() => materials.id, { onDelete: "cascade" }),
  propertyName: varchar("property_name", { length: 64 }).notNull(),
  value: decimal("value", { precision: 20, scale: 6 }).notNull(),
  unit: varchar("unit", { length: 32 }),
  // Qualifiers — a viscosity without temperature/shear rate is ambiguous
  temperatureC: decimal("temperature_c", { precision: 6, scale: 2 }),
  shearRate: decimal("shear_rate", { precision: 10, scale: 2 }), // 1/s
  method: varchar("method", { length: 128 }), // e.g. "ASTM D2196", "DSC 10K/min"
  // Provenance
  source: mysqlEnum("source", [
    "measured",
    "supplier_tds",
    "pubchem",
    "hspip",
    "group_contribution",
    "llm_extracted",
    "manual",
  ]).notNull(),
  sourceDocumentId: varchar("source_document_id", { length: 36 }),
  uncertainty: decimal("uncertainty", { precision: 20, scale: 6 }), // ± in the property's unit
  confidence: decimal("confidence", { precision: 3, scale: 2 }).default("0.80"),
  isPreferred: boolean("is_preferred").notNull().default(false), // human-approved
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  materialPropIdx: index("idx_matprops_material_prop").on(table.materialId, table.propertyName),
}));

/**
 * Reference HSP dataset (HSPiP import + literature). Keyed by CAS/InChIKey,
 * org-independent — enrichment joins materials to this by identifier.
 */
export const hspReference = mysqlTable("hsp_reference", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  casNumber: varchar("cas_number", { length: 32 }),
  inchiKey: varchar("inchi_key", { length: 27 }),
  name: text("name"),
  hansenD: decimal("hansen_d", { precision: 10, scale: 4 }).notNull(),
  hansenP: decimal("hansen_p", { precision: 10, scale: 4 }).notNull(),
  hansenH: decimal("hansen_h", { precision: 10, scale: 4 }).notNull(),
  r0: decimal("r0", { precision: 10, scale: 4 }),
  molarVolume: decimal("molar_volume", { precision: 10, scale: 2 }),
  source: varchar("source", { length: 32 }).notNull().default("hspip"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  casIdx: index("idx_hspref_cas").on(table.casNumber),
  inchiIdx: index("idx_hspref_inchi").on(table.inchiKey),
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


// ==========================================================
// TEST CONDITIONS (First-Class Entities)
// ==========================================================

export const testConditionSets = mysqlTable("test_condition_sets", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: varchar("organization_id", { length: 36 }).notNull().references(() => organizations.id, { onDelete: "cascade" }),
  domainId: varchar("domain_id", { length: 36 }).notNull().references(() => domains.id, { onDelete: "restrict" }),
  name: text("name").notNull(),
  description: text("description"),
  isStandard: boolean("is_standard").notNull().default(false),
  createdBy: varchar("created_by", { length: 36 }).notNull().references(() => users.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
}, (table) => ({
  orgIdx: index("idx_test_cond_sets_org").on(table.organizationId),
  domainIdx: index("idx_test_cond_sets_domain").on(table.domainId),
}));

export const testConditionParameters = mysqlTable("test_condition_parameters", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  testConditionSetId: varchar("test_condition_set_id", { length: 36 }).notNull().references(() => testConditionSets.id, { onDelete: "cascade" }),
  parameterName: varchar("parameter_name", { length: 255 }).notNull(),
  parameterValue: text("parameter_value").notNull(),
  unit: varchar("unit", { length: 64 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  setIdx: index("idx_test_cond_params_set").on(table.testConditionSetId),
}));

// ==========================================================
// PREDICTIONS & AI
// ==========================================================

export const predictions = mysqlTable("predictions", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: varchar("organization_id", { length: 36 }).notNull().references(() => organizations.id, { onDelete: "cascade" }),
  formulationVersionId: varchar("formulation_version_id", { length: 36 }).notNull().references(() => formulationVersions.id, { onDelete: "cascade" }),
  testConditionSetId: varchar("test_condition_set_id", { length: 36 }).notNull().references(() => testConditionSets.id, { onDelete: "restrict" }),
  propertyName: varchar("property_name", { length: 255 }).notNull(),
  predictedValue: decimal("predicted_value", { precision: 20, scale: 6 }).notNull(),
  unit: varchar("unit", { length: 64 }),
  // Uncertainty quantification
  uncertaintyLower: decimal("uncertainty_lower", { precision: 20, scale: 6 }),
  uncertaintyUpper: decimal("uncertainty_upper", { precision: 20, scale: 6 }),
  confidenceLevel: decimal("confidence_level", { precision: 5, scale: 4 }).default("0.95"),
  probabilityInSpec: decimal("probability_in_spec", { precision: 5, scale: 4 }),
  // Model metadata
  modelName: varchar("model_name", { length: 255 }),
  modelVersion: varchar("model_version", { length: 64 }),
  // Provenance — where the number and its σ came from (Phase 1 fusion)
  predictionBasis: varchar("prediction_basis", { length: 32 }),
  physicsValue: decimal("physics_value", { precision: 20, scale: 6 }),
  llmRawValue: decimal("llm_raw_value", { precision: 20, scale: 6 }),
  sigmaSource: varchar("sigma_source", { length: 32 }),
  provenance: text("provenance"),
  // Audit
  requestedBy: varchar("requested_by", { length: 36 }).notNull().references(() => users.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  orgIdx: index("idx_predictions_org").on(table.organizationId),
  formulationIdx: index("idx_predictions_formulation").on(table.formulationVersionId),
  testCondIdx: index("idx_predictions_test_cond").on(table.testConditionSetId),
}));

export const predictionFeatures = mysqlTable("prediction_features", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  predictionId: varchar("prediction_id", { length: 36 }).notNull().references(() => predictions.id, { onDelete: "cascade" }),
  featureName: varchar("feature_name", { length: 255 }).notNull(),
  importance: decimal("importance", { precision: 10, scale: 6 }).notNull(),
  contribution: decimal("contribution", { precision: 20, scale: 6 }),
}, (table) => ({
  predictionIdx: index("idx_pred_features_prediction").on(table.predictionId),
}));

// ==========================================================
// LLM MODELS & AUDIT
// ==========================================================

export const llmModels = mysqlTable("llm_models", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: varchar("organization_id", { length: 36 }).references(() => organizations.id, { onDelete: "cascade" }),
  providerName: varchar("provider_name", { length: 64 }).notNull(),
  providerModelId: varchar("provider_model_id", { length: 255 }).notNull(),
  displayName: varchar("display_name", { length: 255 }).notNull(),
  // Capabilities
  supportsStreaming: boolean("supports_streaming").notNull().default(false),
  supportsVision: boolean("supports_vision").notNull().default(false),
  supportsTools: boolean("supports_tools").notNull().default(false),
  maxTokens: int("max_tokens").notNull().default(4096),
  // Cost per million tokens
  costPerMillionInputTokens: decimal("cost_per_million_input_tokens", { precision: 10, scale: 2 }),
  costPerMillionOutputTokens: decimal("cost_per_million_output_tokens", { precision: 10, scale: 2 }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
}, (table) => ({
  orgIdx: index("idx_llm_models_org").on(table.organizationId),
  providerIdx: index("idx_llm_models_provider").on(table.providerName),
}));

export const llmAuditLog = mysqlTable("llm_audit_log", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: varchar("organization_id", { length: 36 }).notNull().references(() => organizations.id, { onDelete: "cascade" }),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "restrict" }),
  llmModelId: varchar("llm_model_id", { length: 36 }).references(() => llmModels.id, { onDelete: "set null" }),
  // Request details
  promptHash: varchar("prompt_hash", { length: 64 }).notNull(),
  promptTokens: int("prompt_tokens").notNull(),
  completionTokens: int("completion_tokens").notNull(),
  totalTokens: int("total_tokens").notNull(),
  // Cost tracking
  estimatedCost: decimal("estimated_cost", { precision: 10, scale: 6 }),
  // Context
  feature: varchar("feature", { length: 255 }),
  metadata: json("metadata").$type<Record<string, any>>(),
  // Timing
  latencyMs: int("latency_ms"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  orgIdx: index("idx_llm_audit_org").on(table.organizationId),
  userIdx: index("idx_llm_audit_user").on(table.userId),
  createdIdx: index("idx_llm_audit_created").on(table.createdAt),
}));

// ==========================================================
// DOCUMENTS & RAG
// ==========================================================

export const documents = mysqlTable("documents", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: varchar("organization_id", { length: 36 }).notNull().references(() => organizations.id, { onDelete: "cascade" }),
  sourceType: mysqlEnum("source_type", ["tds", "msds", "pds", "sop", "report", "lab_notebook", "other"]).notNull(),
  title: text("title").notNull(),
  filename: varchar("filename", { length: 512 }),
  s3Key: varchar("s3_key", { length: 512 }).notNull(),
  s3Url: text("s3_url").notNull(),
  mimeType: varchar("mime_type", { length: 128 }),
  fileSizeBytes: bigint("file_size_bytes", { mode: "number" }),
  // Metadata
  relatedMaterialId: varchar("related_material_id", { length: 36 }).references(() => materials.id, { onDelete: "set null" }),
  relatedSupplierId: varchar("related_supplier_id", { length: 36 }).references(() => suppliers.id, { onDelete: "set null" }),
  relatedFormulationId: varchar("related_formulation_id", { length: 36 }).references(() => formulationVersions.id, { onDelete: "set null" }),
  // Ingestion status
  ingestionStatus: mysqlEnum("ingestion_status", ["pending", "processing", "completed", "failed"]).notNull().default("pending"),
  ingestionError: text("ingestion_error"),
  // Audit
  uploadedBy: varchar("uploaded_by", { length: 36 }).notNull().references(() => users.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
}, (table) => ({
  orgIdx: index("idx_documents_org").on(table.organizationId),
  materialIdx: index("idx_documents_material").on(table.relatedMaterialId),
  supplierIdx: index("idx_documents_supplier").on(table.relatedSupplierId),
}));

export const documentChunks = mysqlTable("document_chunks", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  documentId: varchar("document_id", { length: 36 }).notNull().references(() => documents.id, { onDelete: "cascade" }),
  chunkIndex: int("chunk_index").notNull(),
  content: text("content").notNull(),
  // Vector embedding (stored as JSON array of floats for MySQL compatibility)
  embedding: json("embedding").$type<number[]>(),
  // Metadata for retrieval
  pageNumber: int("page_number"),
  metadata: json("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  documentIdx: index("idx_doc_chunks_document").on(table.documentId),
  chunkIdx: index("idx_doc_chunks_chunk").on(table.documentId, table.chunkIndex),
}));

// ==========================================================
// COMPLIANCE ENGINE (Versioned)
// ==========================================================

export const complianceSources = mysqlTable("compliance_sources", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: varchar("organization_id", { length: 36 }).notNull().references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  sourceType: varchar("source_type", { length: 128 }).notNull(),
  jurisdiction: varchar("jurisdiction", { length: 128 }),
  url: text("url"),
  version: varchar("version", { length: 64 }),
  effectiveDate: timestamp("effective_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
}, (table) => ({
  orgIdx: index("idx_compliance_sources_org").on(table.organizationId),
}));

export const complianceDatasets = mysqlTable("compliance_datasets", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: varchar("organization_id", { length: 36 }).notNull().references(() => organizations.id, { onDelete: "cascade" }),
  sourceId: varchar("source_id", { length: 36 }).notNull().references(() => complianceSources.id, { onDelete: "cascade" }),
  datasetName: varchar("dataset_name", { length: 255 }).notNull(),
  datasetType: varchar("dataset_type", { length: 128 }).notNull(),
  data: json("data").$type<Record<string, any>>().notNull(),
  version: varchar("version", { length: 64 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  orgIdx: index("idx_compliance_datasets_org").on(table.organizationId),
  sourceIdx: index("idx_compliance_datasets_source").on(table.sourceId),
}));

export const complianceRules = mysqlTable("compliance_rules", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: varchar("organization_id", { length: 36 }).notNull().references(() => organizations.id, { onDelete: "cascade" }),
  datasetId: varchar("dataset_id", { length: 36 }).notNull().references(() => complianceDatasets.id, { onDelete: "cascade" }),
  ruleName: varchar("rule_name", { length: 255 }).notNull(),
  ruleType: varchar("rule_type", { length: 128 }).notNull(),
  ruleLogic: json("rule_logic").$type<Record<string, any>>().notNull(),
  severity: mysqlEnum("severity", ["info", "warning", "error", "critical"]).notNull().default("warning"),
  isActive: boolean("is_active").notNull().default(true),
  version: varchar("version", { length: 64 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
}, (table) => ({
  orgIdx: index("idx_compliance_rules_org").on(table.organizationId),
  datasetIdx: index("idx_compliance_rules_dataset").on(table.datasetId),
}));

// ==========================================================
// APPROVAL WORKFLOW
// ==========================================================

export const approvalRequests = mysqlTable("approval_requests", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: varchar("organization_id", { length: 36 }).notNull().references(() => organizations.id, { onDelete: "cascade" }),
  formulationVersionId: varchar("formulation_version_id", { length: 36 }).notNull().references(() => formulationVersions.id, { onDelete: "cascade" }),
  status: mysqlEnum("status", [
    "draft",
    "submitted",
    "in_review",
    "revision_requested",
    "approved",
    "rejected"
  ]).notNull().default("draft"),
  requestedBy: varchar("requested_by", { length: 36 }).notNull().references(() => users.id, { onDelete: "restrict" }),
  assignedTo: varchar("assigned_to", { length: 36 }).references(() => users.id, { onDelete: "set null" }),
  submittedAt: timestamp("submitted_at"),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
}, (table) => ({
  orgIdx: index("idx_approval_requests_org").on(table.organizationId),
  formulationIdx: index("idx_approval_requests_formulation").on(table.formulationVersionId),
  statusIdx: index("idx_approval_requests_status").on(table.status),
}));

export const approvalReviews = mysqlTable("approval_reviews", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  approvalRequestId: varchar("approval_request_id", { length: 36 }).notNull().references(() => approvalRequests.id, { onDelete: "cascade" }),
  reviewerId: varchar("reviewer_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "restrict" }),
  decision: mysqlEnum("decision", ["approve", "reject", "request_revision"]).notNull(),
  comments: text("comments"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  requestIdx: index("idx_approval_reviews_request").on(table.approvalRequestId),
  reviewerIdx: index("idx_approval_reviews_reviewer").on(table.reviewerId),
}));

// ==========================================================
// TRIALS (Experimental Results)
// ==========================================================

export const trials = mysqlTable("trials", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: varchar("organization_id", { length: 36 }).notNull().references(() => organizations.id, { onDelete: "cascade" }),
  formulationVersionId: varchar("formulation_version_id", { length: 36 }).notNull().references(() => formulationVersions.id, { onDelete: "cascade" }),
  testConditionSetId: varchar("test_condition_set_id", { length: 36 }).notNull().references(() => testConditionSets.id, { onDelete: "restrict" }),
  trialCode: varchar("trial_code", { length: 128 }).notNull(),
  conductedBy: varchar("conducted_by", { length: 36 }).notNull().references(() => users.id, { onDelete: "restrict" }),
  conductedAt: timestamp("conducted_at").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
}, (table) => ({
  orgIdx: index("idx_trials_org").on(table.organizationId),
  formulationIdx: index("idx_trials_formulation").on(table.formulationVersionId),
  testCondIdx: index("idx_trials_test_cond").on(table.testConditionSetId),
  codeIdx: uniqueIndex("idx_trials_code").on(table.organizationId, table.trialCode),
}));

export const trialMeasurements = mysqlTable("trial_measurements", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  trialId: varchar("trial_id", { length: 36 }).notNull().references(() => trials.id, { onDelete: "cascade" }),
  propertyName: varchar("property_name", { length: 255 }).notNull(),
  measuredValue: decimal("measured_value", { precision: 20, scale: 6 }).notNull(),
  unit: varchar("unit", { length: 64 }),
  measurementError: decimal("measurement_error", { precision: 20, scale: 6 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  trialIdx: index("idx_trial_measurements_trial").on(table.trialId),
}));

// ==========================================================
// TYPE EXPORTS
// ==========================================================

export type TestConditionSet = typeof testConditionSets.$inferSelect;
export type InsertTestConditionSet = typeof testConditionSets.$inferInsert;

export type TestConditionParameter = typeof testConditionParameters.$inferSelect;
export type InsertTestConditionParameter = typeof testConditionParameters.$inferInsert;

export type Prediction = typeof predictions.$inferSelect;
export type InsertPrediction = typeof predictions.$inferInsert;

export type PredictionFeature = typeof predictionFeatures.$inferSelect;
export type InsertPredictionFeature = typeof predictionFeatures.$inferInsert;

export type LlmModel = typeof llmModels.$inferSelect;
export type InsertLlmModel = typeof llmModels.$inferInsert;

export type LlmAuditLog = typeof llmAuditLog.$inferSelect;
export type InsertLlmAuditLog = typeof llmAuditLog.$inferInsert;

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

export type DocumentChunk = typeof documentChunks.$inferSelect;
export type InsertDocumentChunk = typeof documentChunks.$inferInsert;

export type ComplianceSource = typeof complianceSources.$inferSelect;
export type InsertComplianceSource = typeof complianceSources.$inferInsert;

export type ComplianceDataset = typeof complianceDatasets.$inferSelect;
export type InsertComplianceDataset = typeof complianceDatasets.$inferInsert;

export type ComplianceRule = typeof complianceRules.$inferSelect;
export type InsertComplianceRule = typeof complianceRules.$inferInsert;

export type ApprovalRequest = typeof approvalRequests.$inferSelect;
export type InsertApprovalRequest = typeof approvalRequests.$inferInsert;

export type ApprovalReview = typeof approvalReviews.$inferSelect;
export type InsertApprovalReview = typeof approvalReviews.$inferInsert;

export type Trial = typeof trials.$inferSelect;
export type InsertTrial = typeof trials.$inferInsert;

export type TrialMeasurement = typeof trialMeasurements.$inferSelect;
export type InsertTrialMeasurement = typeof trialMeasurements.$inferInsert;


// Debate Sessions Table
export const debateSessions = mysqlTable("debate_sessions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  organizationId: varchar("organization_id", { length: 36 }).notNull().references(() => organizations.id),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
  question: text("question").notNull(),
  context: text("context"),
  domain: varchar("domain", { length: 255 }),
  numParticipants: int("num_participants").notNull(),
  result: json("result").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type DebateSession = typeof debateSessions.$inferSelect;
export type InsertDebateSession = typeof debateSessions.$inferInsert;


// ==========================================================
// REVERSE ENGINEERING & COMPETITOR ANALYSIS
// ==========================================================

export const competitorProducts = mysqlTable("competitor_products", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: varchar("organization_id", { length: 36 }).notNull().references(() => organizations.id, { onDelete: "cascade" }),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
  
  // Product identification
  productName: text("product_name").notNull(),
  manufacturer: text("manufacturer").notNull(),
  productCode: varchar("product_code", { length: 255 }),
  category: varchar("category", { length: 255 }),
  domainId: varchar("domain_id", { length: 36 }).references(() => domains.id),
  
  // Product information
  marketingClaims: json("marketing_claims").$type<string[]>(),
  technicalDataSheet: text("technical_data_sheet"),
  msdsData: text("msds_data"),
  observedProperties: json("observed_properties").$type<Record<string, any>>(),
  
  // Analysis results
  extractedParameters: json("extracted_parameters").$type<Record<string, any>>(),
  suggestedFormulationStrategy: text("suggested_formulation_strategy"),
  targetProductProfile: json("target_product_profile").$type<Record<string, any>>(),
  confidenceScore: decimal("confidence_score", { precision: 5, scale: 2 }),
  
  // Metadata
  analysisStatus: mysqlEnum("analysis_status", ["pending", "analyzing", "completed", "failed"]).default("pending"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
}, (table) => ({
  orgIdx: index("idx_competitor_products_org").on(table.organizationId),
  domainIdx: index("idx_competitor_products_domain").on(table.domainId),
}));

export const reverseEngineeringAnalyses = mysqlTable("reverse_engineering_analyses", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: varchar("organization_id", { length: 36 }).notNull().references(() => organizations.id, { onDelete: "cascade" }),
  competitorProductId: varchar("competitor_product_id", { length: 36 }).notNull().references(() => competitorProducts.id, { onDelete: "cascade" }),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
  
  // Analysis inputs
  analysisType: mysqlEnum("analysis_type", [
    "performance_translation",
    "formulation_strategy",
    "tpp_generation",
    "cost_analysis",
    "regulatory_comparison"
  ]).notNull(),
  inputData: json("input_data").$type<Record<string, any>>().notNull(),
  
  // Analysis outputs
  results: json("results").$type<Record<string, any>>().notNull(),
  recommendations: json("recommendations").$type<string[]>(),
  alternativeMaterials: json("alternative_materials").$type<Array<{materialId: string, similarity: number, rationale: string}>>(),
  estimatedCost: decimal("estimated_cost", { precision: 10, scale: 2 }),
  feasibilityScore: decimal("feasibility_score", { precision: 5, scale: 2 }),
  
  // LLM tracking
  llmModelUsed: varchar("llm_model_used", { length: 255 }),
  tokensUsed: int("tokens_used"),
  costUsd: decimal("cost_usd", { precision: 10, scale: 4 }),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  orgIdx: index("idx_re_analyses_org").on(table.organizationId),
  productIdx: index("idx_re_analyses_product").on(table.competitorProductId),
}));

export type CompetitorProduct = typeof competitorProducts.$inferSelect;
export type InsertCompetitorProduct = typeof competitorProducts.$inferInsert;
export type ReverseEngineeringAnalysis = typeof reverseEngineeringAnalyses.$inferSelect;
export type InsertReverseEngineeringAnalysis = typeof reverseEngineeringAnalyses.$inferInsert;


// Patent & Literature Analysis Tables
export const patents = mysqlTable("patents", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text("organization_id").notNull(),
  title: text("title").notNull(),
  patentNumber: text("patent_number"),
  publicationDate: text("publication_date"),
  inventors: text("inventors"), // JSON array
  assignee: text("assignee"),
  abstract: text("abstract"),
  fullText: text("full_text"),
  pdfUrl: text("pdf_url"),
  sourceUrl: text("source_url"),
  uploadedBy: text("uploaded_by").notNull(),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
});

export const patent_analyses = mysqlTable("patent_analyses", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  patentId: text("patent_id").notNull().references(() => patents.id, { onDelete: "cascade" }),
  organizationId: text("organization_id").notNull(),
  
  // Extracted Chemistry
  chemicalCompounds: text("chemical_compounds"), // JSON array of {name, cas, role, concentration}
  reactionMechanisms: text("reaction_mechanisms"), // JSON array of {type, description, conditions}
  processingConditions: text("processing_conditions"), // JSON {temperature, pressure, time, equipment}
  
  // Technology Landscape
  technologyCategory: text("technology_category"),
  keyInnovations: text("key_innovations"), // JSON array
  competitorAnalysis: text("competitor_analysis"), // JSON
  marketApplications: text("market_applications"), // JSON array
  
  // Formulation Insights
  formulationStrategies: text("formulation_strategies"), // JSON array
  materialSuggestions: text("material_suggestions"), // JSON array
  processOptimizations: text("process_optimizations"), // JSON array
  
  // Metadata
  analysisDate: text("analysis_date").$defaultFn(() => new Date().toISOString()),
  analyzedBy: text("analyzed_by"),
  confidence: text("confidence"), // decimal as string
  notes: text("notes"),
});

export const literature_papers = mysqlTable("literature_papers", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text("organization_id").notNull(),
  title: text("title").notNull(),
  authors: text("authors"), // JSON array
  journal: text("journal"),
  publicationYear: text("publication_year"),
  doi: text("doi"),
  abstract: text("abstract"),
  fullText: text("full_text"),
  pdfUrl: text("pdf_url"),
  sourceUrl: text("source_url"),
  keywords: text("keywords"), // JSON array
  uploadedBy: text("uploaded_by").notNull(),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
});

export const literature_analyses = mysqlTable("literature_analyses", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  paperId: text("paper_id").notNull().references(() => literature_papers.id, { onDelete: "cascade" }),
  organizationId: text("organization_id").notNull(),
  
  // Research Findings
  keyFindings: text("key_findings"), // JSON array
  methodologies: text("methodologies"), // JSON array
  experimentalConditions: text("experimental_conditions"), // JSON
  results: text("results"), // JSON
  
  // Chemistry Insights
  chemicalCompounds: text("chemical_compounds"), // JSON array
  reactionMechanisms: text("reaction_mechanisms"), // JSON array
  formulationInsights: text("formulation_insights"), // JSON array
  
  // Relevance
  relevanceScore: text("relevance_score"), // decimal as string
  applicability: text("applicability"),
  recommendations: text("recommendations"), // JSON array
  
  // Metadata
  analysisDate: text("analysis_date").$defaultFn(() => new Date().toISOString()),
  analyzedBy: text("analyzed_by"),
  notes: text("notes"),
});


// Equipment Database Tables
export const equipment = mysqlTable("equipment", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: varchar("organization_id", { length: 36 }).notNull().references(() => organizations.id, { onDelete: "cascade" }),
  
  // Equipment identification
  name: text("name").notNull(),
  equipmentType: varchar("equipment_type", { length: 255 }).notNull(), // mixer, reactor, extruder, coater, etc.
  manufacturer: text("manufacturer"),
  model: varchar("model", { length: 255 }),
  serialNumber: varchar("serial_number", { length: 255 }),
  location: text("location"), // plant, building, room
  
  // Technical specifications
  capacity: json("capacity").$type<{ value: number; unit: string }>(), // e.g., {value: 500, unit: "L"}
  operatingTemperatureRange: json("operating_temperature_range").$type<{ min: number; max: number; unit: string }>(),
  operatingPressureRange: json("operating_pressure_range").$type<{ min: number; max: number; unit: string }>(),
  mixingSpeedRange: json("mixing_speed_range").$type<{ min: number; max: number; unit: string }>(),
  powerRating: json("power_rating").$type<{ value: number; unit: string }>(),
  
  // Material compatibility
  compatibleMaterialTypes: json("compatible_material_types").$type<string[]>(), // solvents, polymers, pigments, etc.
  incompatibleMaterials: json("incompatible_materials").$type<string[]>(),
  materialContactSurfaces: json("material_contact_surfaces").$type<string[]>(), // stainless steel, glass-lined, PTFE, etc.
  
  // Process capabilities
  supportedProcesses: json("supported_processes").$type<string[]>(), // mixing, heating, cooling, vacuum, etc.
  cleaningRequirements: text("cleaning_requirements"),
  changeoverTime: decimal("changeover_time", { precision: 10, scale: 2 }), // hours
  
  // Status and maintenance
  status: mysqlEnum("status", ["operational", "maintenance", "offline", "decommissioned"]).default("operational"),
  lastMaintenanceDate: timestamp("last_maintenance_date"),
  nextMaintenanceDate: timestamp("next_maintenance_date"),
  maintenanceNotes: text("maintenance_notes"),
  
  // Metadata
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
}, (table) => ({
  orgIdx: index("idx_equipment_org").on(table.organizationId),
  typeIdx: index("idx_equipment_type").on(table.equipmentType),
}));

export const formulation_equipment_compatibility = mysqlTable("formulation_equipment_compatibility", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: varchar("organization_id", { length: 36 }).notNull().references(() => organizations.id, { onDelete: "cascade" }),
  formulationVersionId: varchar("formulation_version_id", { length: 36 }).notNull().references(() => formulationVersions.id, { onDelete: "cascade" }),
  equipmentId: varchar("equipment_id", { length: 36 }).notNull().references(() => equipment.id, { onDelete: "cascade" }),
  
  // Compatibility assessment
  isCompatible: boolean("is_compatible").notNull(),
  compatibilityScore: decimal("compatibility_score", { precision: 5, scale: 2 }), // 0-100
  
  // Issues and constraints
  incompatibilityReasons: json("incompatibility_reasons").$type<string[]>(),
  requiredModifications: json("required_modifications").$type<string[]>(),
  processingConstraints: json("processing_constraints").$type<Record<string, any>>(),
  
  // Analysis metadata
  analyzedAt: timestamp("analyzed_at").notNull().defaultNow(),
  analyzedBy: varchar("analyzed_by", { length: 36 }),
  notes: text("notes"),
}, (table) => ({
  orgIdx: index("idx_formulation_equipment_org").on(table.organizationId),
  formulationIdx: index("idx_formulation_equipment_formulation").on(table.formulationVersionId),
  equipmentIdx: index("idx_formulation_equipment_equipment").on(table.equipmentId),
}));


// ============================================================================
// Scale-Up Risk Analysis
// ============================================================================

export const scaleup_analyses = mysqlTable("scaleup_analyses", {
  id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: varchar("organization_id", { length: 255 }).notNull(),
  formulationVersionId: varchar("formulation_version_id", { length: 255 }).notNull(),
  labScale: json("lab_scale").$type<{ volume: number; unit: string }>(),
  pilotScale: json("pilot_scale").$type<{ volume: number; unit: string }>(),
  targetScale: json("target_scale").$type<{ volume: number; unit: string }>(),
  
  // Reaction kinetics analysis
  reactionType: varchar("reaction_type", { length: 100 }),
  rateConstant: decimal("rate_constant", { precision: 20, scale: 10 }),
  activationEnergy: decimal("activation_energy", { precision: 20, scale: 10 }),
  reactionOrder: decimal("reaction_order", { precision: 10, scale: 2 }),
  
  // Heat transfer analysis
  heatGenerationRate: decimal("heat_generation_rate", { precision: 20, scale: 10 }),
  coolingCapacityLab: decimal("cooling_capacity_lab", { precision: 20, scale: 10 }),
  coolingCapacityPilot: decimal("cooling_capacity_pilot", { precision: 20, scale: 10 }),
  temperatureRisePrediction: decimal("temperature_rise_prediction", { precision: 10, scale: 2 }),
  
  // Mass transfer analysis
  mixingTimeLab: decimal("mixing_time_lab", { precision: 10, scale: 2 }),
  mixingTimePilot: decimal("mixing_time_pilot", { precision: 10, scale: 2 }),
  reynoldsNumberLab: decimal("reynolds_number_lab", { precision: 20, scale: 2 }),
  reynoldsNumberPilot: decimal("reynolds_number_pilot", { precision: 20, scale: 2 }),
  powerPerVolumeLab: decimal("power_per_volume_lab", { precision: 20, scale: 10 }),
  powerPerVolumePilot: decimal("power_per_volume_pilot", { precision: 20, scale: 10 }),
  
  // Risk assessment
  overallRiskScore: decimal("overall_risk_score", { precision: 5, scale: 2 }),
  riskLevel: varchar("risk_level", { length: 50 }), // low, medium, high, critical
  identifiedRisks: json("identified_risks").$type<Array<{
    category: string;
    description: string;
    severity: string;
    likelihood: string;
    mitigation: string;
  }>>(),
  
  // Recommendations
  processModifications: json("process_modifications").$type<string[]>(),
  equipmentRecommendations: json("equipment_recommendations").$type<string[]>(),
  controlStrategyChanges: json("control_strategy_changes").$type<string[]>(),
  additionalTestingNeeded: json("additional_testing_needed").$type<string[]>(),
  
  // Analysis metadata
  analyzedBy: varchar("analyzed_by", { length: 255 }),
  analyzedAt: timestamp("analyzed_at").defaultNow(),
  notes: text("notes"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const scaleup_scenarios = mysqlTable("scaleup_scenarios", {
  id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: varchar("organization_id", { length: 255 }).notNull(),
  analysisId: varchar("analysis_id", { length: 255 }).notNull(),
  scenarioName: varchar("scenario_name", { length: 255 }).notNull(),
  description: text("description"),
  
  // Process parameters
  temperature: decimal("temperature", { precision: 10, scale: 2 }),
  pressure: decimal("pressure", { precision: 10, scale: 2 }),
  mixingSpeed: decimal("mixing_speed", { precision: 10, scale: 2 }),
  additionRate: decimal("addition_rate", { precision: 10, scale: 2 }),
  holdTime: decimal("hold_time", { precision: 10, scale: 2 }),
  
  // Predicted outcomes
  predictedYield: decimal("predicted_yield", { precision: 5, scale: 2 }),
  predictedQuality: varchar("predicted_quality", { length: 100 }),
  predictedCycleTime: decimal("predicted_cycle_time", { precision: 10, scale: 2 }),
  predictedCost: decimal("predicted_cost", { precision: 15, scale: 2 }),
  
  // Success probability
  successProbability: decimal("success_probability", { precision: 5, scale: 2 }),
  confidenceLevel: decimal("confidence_level", { precision: 5, scale: 2 }),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});


// Manufacturing Documentation Tables
export const manufacturing_documents = mysqlTable("manufacturing_documents", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: varchar("organization_id", { length: 36 }).notNull(),
  formulationVersionId: varchar("formulation_version_id", { length: 36 }).notNull(),
  documentType: mysqlEnum("document_type", ["sop", "batch_process", "process_flow_diagram", "tech_transfer_package"]).notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  batchSize: decimal("batch_size", { precision: 10, scale: 2 }),
  batchUnit: varchar("batch_unit", { length: 50 }),
  equipmentIds: json("equipment_ids").$type<string[]>(),
  safetyPrecautions: json("safety_precautions").$type<string[]>(),
  qualityCheckpoints: json("quality_checkpoints").$type<string[]>(),
  generatedContent: text("generated_content"),
  status: mysqlEnum("status", ["draft", "review", "approved", "obsolete"]).default("draft"),
  version: int("version").default(1),
  createdBy: varchar("created_by", { length: 36 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  approvedBy: varchar("approved_by", { length: 36 }),
  approvedAt: timestamp("approved_at"),
});

export const manufacturing_steps = mysqlTable("manufacturing_steps", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  documentId: varchar("document_id", { length: 36 }).notNull(),
  stepNumber: int("step_number").notNull(),
  stepName: varchar("step_name", { length: 255 }).notNull(),
  description: text("description"),
  duration: int("duration"), // minutes
  temperature: decimal("temperature", { precision: 5, scale: 1 }),
  temperatureUnit: varchar("temperature_unit", { length: 10 }),
  pressure: decimal("pressure", { precision: 8, scale: 2 }),
  pressureUnit: varchar("pressure_unit", { length: 20 }),
  mixingSpeed: decimal("mixing_speed", { precision: 8, scale: 1 }),
  mixingSpeedUnit: varchar("mixing_speed_unit", { length: 20 }),
  equipmentId: varchar("equipment_id", { length: 36 }),
  criticalParameters: json("critical_parameters").$type<Record<string, any>>(),
  safetyNotes: text("safety_notes"),
  qualityChecks: json("quality_checks").$type<string[]>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const process_flow_diagrams = mysqlTable("process_flow_diagrams", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  documentId: varchar("document_id", { length: 36 }).notNull(),
  diagramData: json("diagram_data").$type<Record<string, any>>(), // Mermaid or similar format
  imageUrl: varchar("image_url", { length: 1000 }),
  createdAt: timestamp("created_at").defaultNow(),
});


// Issue Tracking & Improvement System Tables
export const issues = mysqlTable("issues", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: varchar("organization_id", { length: 36 }).notNull(),
  formulationVersionId: varchar("formulation_version_id", { length: 36 }),
  trialId: varchar("trial_id", { length: 36 }),
  issueType: mysqlEnum("issue_type", ["quality_defect", "process_failure", "scale_up_issue", "supplier_issue", "equipment_malfunction", "safety_incident", "compliance_violation", "other"]).notNull(),
  severity: mysqlEnum("severity", ["critical", "high", "medium", "low"]).notNull(),
  status: mysqlEnum("status", ["open", "investigating", "resolved", "closed", "recurring"]).default("open"),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description").notNull(),
  rootCause: text("root_cause"),
  correctiveAction: text("corrective_action"),
  preventiveAction: text("preventive_action"),
  affectedBatches: json("affected_batches").$type<string[]>(),
  costImpact: decimal("cost_impact", { precision: 12, scale: 2 }),
  reportedBy: varchar("reported_by", { length: 36 }).notNull(),
  assignedTo: varchar("assigned_to", { length: 36 }),
  resolvedBy: varchar("resolved_by", { length: 36 }),
  reportedAt: timestamp("reported_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const issue_analysis = mysqlTable("issue_analysis", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  issueId: varchar("issue_id", { length: 36 }).notNull(),
  analysisType: mysqlEnum("analysis_type", ["root_cause", "pattern_detection", "improvement_recommendation", "risk_assessment"]).notNull(),
  findings: text("findings").notNull(),
  recommendations: json("recommendations").$type<string[]>(),
  similarIssues: json("similar_issues").$type<Array<{ issueId: string; similarity: number; title: string }>>(),
  preventionStrategies: json("prevention_strategies").$type<string[]>(),
  confidence: decimal("confidence", { precision: 3, scale: 2 }),
  analyzedAt: timestamp("analyzed_at").defaultNow(),
});

export const improvement_actions = mysqlTable("improvement_actions", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: varchar("organization_id", { length: 36 }).notNull(),
  issueId: varchar("issue_id", { length: 36 }),
  actionType: mysqlEnum("action_type", ["process_change", "training", "equipment_upgrade", "supplier_change", "formulation_modification", "procedure_update", "other"]).notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description").notNull(),
  priority: mysqlEnum("priority", ["critical", "high", "medium", "low"]).notNull(),
  status: mysqlEnum("status", ["planned", "in_progress", "completed", "cancelled"]).default("planned"),
  expectedImpact: text("expected_impact"),
  actualImpact: text("actual_impact"),
  estimatedCost: decimal("estimated_cost", { precision: 12, scale: 2 }),
  actualCost: decimal("actual_cost", { precision: 12, scale: 2 }),
  assignedTo: varchar("assigned_to", { length: 36 }),
  createdBy: varchar("created_by", { length: 36 }).notNull(),
  dueDate: date("due_date"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// ==========================================================
// CALIBRATION & FEEDBACK LOOP (Phase 4)
// ==========================================================

/**
 * One row per matched (prediction, measurement) pair — the raw evidence the
 * calibration ladder is built on.
 */
export const predictionResiduals = mysqlTable("prediction_residuals", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: varchar("organization_id", { length: 36 }).notNull(),
  domainId: varchar("domain_id", { length: 36 }),
  propertyName: varchar("property_name", { length: 255 }).notNull(),
  predictionId: varchar("prediction_id", { length: 36 }).notNull(),
  trialMeasurementId: varchar("trial_measurement_id", { length: 36 }).notNull(),
  formulationVersionId: varchar("formulation_version_id", { length: 36 }).notNull(),
  predictedValue: decimal("predicted_value", { precision: 20, scale: 6 }).notNull(),
  measuredValue: decimal("measured_value", { precision: 20, scale: 6 }).notNull(),
  /** (predicted − measured) / |measured| */
  relResidual: decimal("rel_residual", { precision: 12, scale: 6 }).notNull(),
  predictionBasis: varchar("prediction_basis", { length: 32 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  orgPropIdx: index("idx_residuals_org_prop").on(table.organizationId, table.propertyName),
  pairIdx: uniqueIndex("idx_residuals_pair").on(table.predictionId, table.trialMeasurementId),
}));

/**
 * Aggregated residual quantiles per (org, property, domain, basis) —
 * the conformal-style intervals σ is derived from once n ≥ 8.
 */
export const calibrationStats = mysqlTable("calibration_stats", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: varchar("organization_id", { length: 36 }).notNull(),
  propertyName: varchar("property_name", { length: 255 }).notNull(),
  domainId: varchar("domain_id", { length: 36 }),
  predictionBasis: varchar("prediction_basis", { length: 32 }),
  n: int("n").notNull(),
  medianAbsRel: decimal("median_abs_rel", { precision: 12, scale: 6 }),
  q80AbsRel: decimal("q80_abs_rel", { precision: 12, scale: 6 }),
  q95AbsRel: decimal("q95_abs_rel", { precision: 12, scale: 6 }),
  /** signed median relative residual (systematic bias) */
  bias: decimal("bias", { precision: 12, scale: 6 }),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
}, (table) => ({
  keyIdx: uniqueIndex("idx_calstats_key").on(table.organizationId, table.propertyName, table.predictionBasis),
}));

// ==========================================================
// HISTORICAL DATA INGESTION (staged, human-validated)
// ==========================================================

export const ingestionJobs = mysqlTable("ingestion_jobs", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: varchar("organization_id", { length: 36 }).notNull(),
  createdBy: varchar("created_by", { length: 36 }).notNull(),
  sourceType: mysqlEnum("source_type", ["batch_card", "lab_notebook", "qc_log", "trial_report", "spreadsheet", "other"]).notNull(),
  sourceDescription: text("source_description"),
  status: mysqlEnum("status", ["extracting", "pending_review", "partially_committed", "committed", "rejected", "failed"]).notNull().default("extracting"),
  rawText: text("raw_text"),
  error: text("error"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
}, (table) => ({
  orgIdx: index("idx_ingestion_org").on(table.organizationId, table.status),
}));

/**
 * One extracted record = one candidate formulation (with components and/or
 * measured results). NEVER auto-committed: a human approves each record in
 * the validation gate, which then writes real formulation/trial rows with
 * provenance metadata.
 */
export const extractedRecords = mysqlTable("extracted_records", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  jobId: varchar("job_id", { length: 36 }).notNull(),
  organizationId: varchar("organization_id", { length: 36 }).notNull(),
  recordType: mysqlEnum("record_type", ["formulation", "trial_results", "formulation_with_results"]).notNull(),
  /** LLM-extracted payload: {name, components: [{materialName, casNumber?, percentage}], measurements: [{propertyName, value, unit, conditions?}], date?} */
  payload: json("payload").$type<Record<string, any>>().notNull(),
  /** per-field extraction confidence from the LLM */
  confidence: decimal("confidence", { precision: 3, scale: 2 }),
  status: mysqlEnum("status", ["pending_review", "approved", "rejected", "committed", "commit_failed"]).notNull().default("pending_review"),
  reviewedBy: varchar("reviewed_by", { length: 36 }),
  reviewNotes: text("review_notes"),
  /** ids created on commit, for traceability */
  committedRefs: json("committed_refs").$type<Record<string, string>>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
}, (table) => ({
  jobIdx: index("idx_extracted_job").on(table.jobId),
  orgStatusIdx: index("idx_extracted_org_status").on(table.organizationId, table.status),
}));

// ==========================================================
// AGENTIC MEMORY SYSTEM (Phase 38/40)
// Previously created via ad-hoc SQL in .manus/db — folded into the schema
// so it is reproducible. Column types match the production DDL exactly;
// `embedding` is new (semantic retrieval) and added by migration 0001.
// Note: agentMemorySystem.ts accesses these via raw SQL; the definitions
// here are the source of truth for fresh databases and drizzle-kit.
// ==========================================================

export const agentMemories = mysqlTable("agent_memories", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: varchar("organization_id", { length: 255 }).notNull(),
  openId: varchar("open_id", { length: 255 }),
  fact: text("fact").notNull(),
  rationale: text("rationale"),
  category: varchar("category", { length: 50 }).notNull().default("formulation_insight"),
  confidence: decimal("confidence", { precision: 3, scale: 2 }).default("0.80"),
  citations: json("citations").$type<Array<{ type: string; id: string; title: string; url?: string }>>(),
  tags: json("tags").$type<string[]>(),
  sourceHash: varchar("source_hash", { length: 64 }),
  // Semantic embedding of fact+rationale for relevance-ranked retrieval
  embedding: json("embedding").$type<number[]>(),
  verifiedAt: timestamp("verified_at"),
  isValid: boolean("is_valid").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
}, (table) => ({
  orgCategoryIdx: index("idx_org_category").on(table.organizationId, table.category),
  validIdx: index("idx_valid").on(table.isValid),
}));

export const memoryVerificationLogs = mysqlTable("memory_verification_logs", {
  id: int("id").autoincrement().primaryKey(),
  memoryId: int("memory_id").notNull(),
  verifiedAt: timestamp("verified_at").defaultNow(),
  verificationResult: varchar("verification_result", { length: 20 }).notNull(),
  oldConfidence: decimal("old_confidence", { precision: 3, scale: 2 }),
  newConfidence: decimal("new_confidence", { precision: 3, scale: 2 }),
  verificationNotes: text("verification_notes"),
}, (table) => ({
  memoryIdx: index("idx_memory").on(table.memoryId),
}));

export const memoryUsageLogs = mysqlTable("memory_usage_logs", {
  id: int("id").autoincrement().primaryKey(),
  memoryId: int("memory_id").notNull(),
  usedAt: timestamp("used_at").defaultNow(),
  useCase: varchar("use_case", { length: 100 }),
  wasHelpful: boolean("was_helpful"),
}, (table) => ({
  memoryIdx: index("idx_memory").on(table.memoryId),
}));

export const memoryFeedback = mysqlTable("memory_feedback", {
  id: int("id").autoincrement().primaryKey(),
  memoryId: int("memory_id").notNull(),
  openId: varchar("open_id", { length: 255 }).notNull(),
  organizationId: varchar("organization_id", { length: 255 }).notNull(),
  rating: mysqlEnum("rating", ["helpful", "not_helpful"]).notNull(),
  context: varchar("context", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  memoryIdIdx: index("idx_memory_id").on(table.memoryId),
  orgMemoryIdx: index("idx_org_memory").on(table.organizationId, table.memoryId),
  userMemoryUnique: uniqueIndex("unique_user_memory").on(table.memoryId, table.openId),
}));
