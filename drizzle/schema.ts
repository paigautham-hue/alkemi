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
