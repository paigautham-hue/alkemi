-- ALKEMI™ v5.1 - Add AI and Advanced Feature Tables
-- This script adds new tables without modifying existing ones

-- Test Conditions
CREATE TABLE IF NOT EXISTS `test_condition_sets` (
  `id` VARCHAR(36) PRIMARY KEY,
  `organization_id` VARCHAR(36) NOT NULL,
  `domain_id` VARCHAR(36) NOT NULL,
  `name` TEXT NOT NULL,
  `description` TEXT,
  `is_standard` TINYINT(1) NOT NULL DEFAULT 0,
  `created_by` VARCHAR(36) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`domain_id`) REFERENCES `domains`(`id`) ON DELETE RESTRICT,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT,
  INDEX `idx_test_cond_sets_org` (`organization_id`),
  INDEX `idx_test_cond_sets_domain` (`domain_id`)
);

CREATE TABLE IF NOT EXISTS `test_condition_parameters` (
  `id` VARCHAR(36) PRIMARY KEY,
  `test_condition_set_id` VARCHAR(36) NOT NULL,
  `parameter_name` VARCHAR(255) NOT NULL,
  `parameter_value` TEXT NOT NULL,
  `unit` VARCHAR(64),
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`test_condition_set_id`) REFERENCES `test_condition_sets`(`id`) ON DELETE CASCADE,
  INDEX `idx_test_cond_params_set` (`test_condition_set_id`)
);

-- Predictions
CREATE TABLE IF NOT EXISTS `predictions` (
  `id` VARCHAR(36) PRIMARY KEY,
  `organization_id` VARCHAR(36) NOT NULL,
  `formulation_version_id` VARCHAR(36) NOT NULL,
  `test_condition_set_id` VARCHAR(36) NOT NULL,
  `property_name` VARCHAR(255) NOT NULL,
  `predicted_value` DECIMAL(20, 6) NOT NULL,
  `unit` VARCHAR(64),
  `uncertainty_lower` DECIMAL(20, 6),
  `uncertainty_upper` DECIMAL(20, 6),
  `confidence_level` DECIMAL(5, 4) DEFAULT 0.95,
  `probability_in_spec` DECIMAL(5, 4),
  `model_name` VARCHAR(255),
  `model_version` VARCHAR(64),
  `requested_by` VARCHAR(36) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`formulation_version_id`) REFERENCES `formulation_versions`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`test_condition_set_id`) REFERENCES `test_condition_sets`(`id`) ON DELETE RESTRICT,
  FOREIGN KEY (`requested_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT,
  INDEX `idx_predictions_org` (`organization_id`),
  INDEX `idx_predictions_formulation` (`formulation_version_id`),
  INDEX `idx_predictions_test_cond` (`test_condition_set_id`)
);

CREATE TABLE IF NOT EXISTS `prediction_features` (
  `id` VARCHAR(36) PRIMARY KEY,
  `prediction_id` VARCHAR(36) NOT NULL,
  `feature_name` VARCHAR(255) NOT NULL,
  `importance` DECIMAL(10, 6) NOT NULL,
  `contribution` DECIMAL(20, 6),
  FOREIGN KEY (`prediction_id`) REFERENCES `predictions`(`id`) ON DELETE CASCADE,
  INDEX `idx_pred_features_prediction` (`prediction_id`)
);

-- LLM Models & Audit
CREATE TABLE IF NOT EXISTS `llm_models` (
  `id` VARCHAR(36) PRIMARY KEY,
  `organization_id` VARCHAR(36),
  `provider_name` VARCHAR(64) NOT NULL,
  `provider_model_id` VARCHAR(255) NOT NULL,
  `display_name` VARCHAR(255) NOT NULL,
  `supports_streaming` TINYINT(1) NOT NULL DEFAULT 0,
  `supports_vision` TINYINT(1) NOT NULL DEFAULT 0,
  `supports_tools` TINYINT(1) NOT NULL DEFAULT 0,
  `max_tokens` INT NOT NULL DEFAULT 4096,
  `cost_per_million_input_tokens` DECIMAL(10, 2),
  `cost_per_million_output_tokens` DECIMAL(10, 2),
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE CASCADE,
  INDEX `idx_llm_models_org` (`organization_id`),
  INDEX `idx_llm_models_provider` (`provider_name`)
);

CREATE TABLE IF NOT EXISTS `llm_audit_log` (
  `id` VARCHAR(36) PRIMARY KEY,
  `organization_id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `llm_model_id` VARCHAR(36),
  `prompt_hash` VARCHAR(64) NOT NULL,
  `prompt_tokens` INT NOT NULL,
  `completion_tokens` INT NOT NULL,
  `total_tokens` INT NOT NULL,
  `estimated_cost` DECIMAL(10, 6),
  `feature` VARCHAR(255),
  `metadata` JSON,
  `latency_ms` INT,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT,
  FOREIGN KEY (`llm_model_id`) REFERENCES `llm_models`(`id`) ON DELETE SET NULL,
  INDEX `idx_llm_audit_org` (`organization_id`),
  INDEX `idx_llm_audit_user` (`user_id`),
  INDEX `idx_llm_audit_created` (`created_at`)
);

-- Documents & RAG
CREATE TABLE IF NOT EXISTS `documents` (
  `id` VARCHAR(36) PRIMARY KEY,
  `organization_id` VARCHAR(36) NOT NULL,
  `source_type` ENUM('tds', 'msds', 'pds', 'sop', 'report', 'lab_notebook', 'other') NOT NULL,
  `title` TEXT NOT NULL,
  `filename` VARCHAR(512),
  `s3_key` VARCHAR(512) NOT NULL,
  `s3_url` TEXT NOT NULL,
  `mime_type` VARCHAR(128),
  `file_size_bytes` BIGINT,
  `related_material_id` VARCHAR(36),
  `related_supplier_id` VARCHAR(36),
  `related_formulation_id` VARCHAR(36),
  `ingestion_status` ENUM('pending', 'processing', 'completed', 'failed') NOT NULL DEFAULT 'pending',
  `ingestion_error` TEXT,
  `uploaded_by` VARCHAR(36) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`related_material_id`) REFERENCES `materials`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`related_supplier_id`) REFERENCES `suppliers`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`related_formulation_id`) REFERENCES `formulation_versions`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT,
  INDEX `idx_documents_org` (`organization_id`),
  INDEX `idx_documents_material` (`related_material_id`),
  INDEX `idx_documents_supplier` (`related_supplier_id`)
);

CREATE TABLE IF NOT EXISTS `document_chunks` (
  `id` VARCHAR(36) PRIMARY KEY,
  `document_id` VARCHAR(36) NOT NULL,
  `chunk_index` INT NOT NULL,
  `content` TEXT NOT NULL,
  `embedding` JSON,
  `page_number` INT,
  `metadata` JSON,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`document_id`) REFERENCES `documents`(`id`) ON DELETE CASCADE,
  INDEX `idx_doc_chunks_document` (`document_id`),
  INDEX `idx_doc_chunks_chunk` (`document_id`, `chunk_index`)
);

-- Compliance Engine
CREATE TABLE IF NOT EXISTS `compliance_sources` (
  `id` VARCHAR(36) PRIMARY KEY,
  `organization_id` VARCHAR(36) NOT NULL,
  `name` TEXT NOT NULL,
  `source_type` VARCHAR(128) NOT NULL,
  `jurisdiction` VARCHAR(128),
  `url` TEXT,
  `version` VARCHAR(64),
  `effective_date` TIMESTAMP,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE CASCADE,
  INDEX `idx_compliance_sources_org` (`organization_id`)
);

CREATE TABLE IF NOT EXISTS `compliance_datasets` (
  `id` VARCHAR(36) PRIMARY KEY,
  `organization_id` VARCHAR(36) NOT NULL,
  `source_id` VARCHAR(36) NOT NULL,
  `dataset_name` VARCHAR(255) NOT NULL,
  `dataset_type` VARCHAR(128) NOT NULL,
  `data` JSON NOT NULL,
  `version` VARCHAR(64) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`source_id`) REFERENCES `compliance_sources`(`id`) ON DELETE CASCADE,
  INDEX `idx_compliance_datasets_org` (`organization_id`),
  INDEX `idx_compliance_datasets_source` (`source_id`)
);

CREATE TABLE IF NOT EXISTS `compliance_rules` (
  `id` VARCHAR(36) PRIMARY KEY,
  `organization_id` VARCHAR(36) NOT NULL,
  `dataset_id` VARCHAR(36) NOT NULL,
  `rule_name` VARCHAR(255) NOT NULL,
  `rule_type` VARCHAR(128) NOT NULL,
  `rule_logic` JSON NOT NULL,
  `severity` ENUM('info', 'warning', 'error', 'critical') NOT NULL DEFAULT 'warning',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `version` VARCHAR(64) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`dataset_id`) REFERENCES `compliance_datasets`(`id`) ON DELETE CASCADE,
  INDEX `idx_compliance_rules_org` (`organization_id`),
  INDEX `idx_compliance_rules_dataset` (`dataset_id`)
);

-- Approval Workflow
CREATE TABLE IF NOT EXISTS `approval_requests` (
  `id` VARCHAR(36) PRIMARY KEY,
  `organization_id` VARCHAR(36) NOT NULL,
  `formulation_version_id` VARCHAR(36) NOT NULL,
  `status` ENUM('draft', 'submitted', 'in_review', 'revision_requested', 'approved', 'rejected') NOT NULL DEFAULT 'draft',
  `requested_by` VARCHAR(36) NOT NULL,
  `assigned_to` VARCHAR(36),
  `submitted_at` TIMESTAMP,
  `reviewed_at` TIMESTAMP,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`formulation_version_id`) REFERENCES `formulation_versions`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`requested_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT,
  FOREIGN KEY (`assigned_to`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_approval_requests_org` (`organization_id`),
  INDEX `idx_approval_requests_formulation` (`formulation_version_id`),
  INDEX `idx_approval_requests_status` (`status`)
);

CREATE TABLE IF NOT EXISTS `approval_reviews` (
  `id` VARCHAR(36) PRIMARY KEY,
  `approval_request_id` VARCHAR(36) NOT NULL,
  `reviewer_id` VARCHAR(36) NOT NULL,
  `decision` ENUM('approve', 'reject', 'request_revision') NOT NULL,
  `comments` TEXT,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`approval_request_id`) REFERENCES `approval_requests`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`reviewer_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT,
  INDEX `idx_approval_reviews_request` (`approval_request_id`),
  INDEX `idx_approval_reviews_reviewer` (`reviewer_id`)
);

-- Trials
CREATE TABLE IF NOT EXISTS `trials` (
  `id` VARCHAR(36) PRIMARY KEY,
  `organization_id` VARCHAR(36) NOT NULL,
  `formulation_version_id` VARCHAR(36) NOT NULL,
  `test_condition_set_id` VARCHAR(36) NOT NULL,
  `trial_code` VARCHAR(128) NOT NULL,
  `conducted_by` VARCHAR(36) NOT NULL,
  `conducted_at` TIMESTAMP NOT NULL,
  `notes` TEXT,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`formulation_version_id`) REFERENCES `formulation_versions`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`test_condition_set_id`) REFERENCES `test_condition_sets`(`id`) ON DELETE RESTRICT,
  FOREIGN KEY (`conducted_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT,
  INDEX `idx_trials_org` (`organization_id`),
  INDEX `idx_trials_formulation` (`formulation_version_id`),
  INDEX `idx_trials_test_cond` (`test_condition_set_id`),
  UNIQUE INDEX `idx_trials_code` (`organization_id`, `trial_code`)
);

CREATE TABLE IF NOT EXISTS `trial_measurements` (
  `id` VARCHAR(36) PRIMARY KEY,
  `trial_id` VARCHAR(36) NOT NULL,
  `property_name` VARCHAR(255) NOT NULL,
  `measured_value` DECIMAL(20, 6) NOT NULL,
  `unit` VARCHAR(64),
  `measurement_error` DECIMAL(20, 6),
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`trial_id`) REFERENCES `trials`(`id`) ON DELETE CASCADE,
  INDEX `idx_trial_measurements_trial` (`trial_id`)
);
