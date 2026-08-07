-- Migration 0004: Calibration loop + staged historical-data ingestion
--
-- prediction_residuals: matched (prediction, measurement) pairs
-- calibration_stats:    residual quantiles per (org, property, basis) — σ source once n ≥ 8
-- ingestion_jobs / extracted_records: LLM-extraction staging with a
--   human validation gate (records are never auto-committed)
--
-- Idempotent; TiDB-safe.

CREATE TABLE IF NOT EXISTS `prediction_residuals` (
  `id` VARCHAR(36) PRIMARY KEY,
  `organization_id` VARCHAR(36) NOT NULL,
  `domain_id` VARCHAR(36),
  `property_name` VARCHAR(255) NOT NULL,
  `prediction_id` VARCHAR(36) NOT NULL,
  `trial_measurement_id` VARCHAR(36) NOT NULL,
  `formulation_version_id` VARCHAR(36) NOT NULL,
  `predicted_value` DECIMAL(20,6) NOT NULL,
  `measured_value` DECIMAL(20,6) NOT NULL,
  `rel_residual` DECIMAL(12,6) NOT NULL,
  `prediction_basis` VARCHAR(32),
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_residuals_org_prop` (`organization_id`, `property_name`),
  UNIQUE KEY `idx_residuals_pair` (`prediction_id`, `trial_measurement_id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `calibration_stats` (
  `id` VARCHAR(36) PRIMARY KEY,
  `organization_id` VARCHAR(36) NOT NULL,
  `property_name` VARCHAR(255) NOT NULL,
  `domain_id` VARCHAR(36),
  `prediction_basis` VARCHAR(32),
  `n` INT NOT NULL,
  `median_abs_rel` DECIMAL(12,6),
  `q80_abs_rel` DECIMAL(12,6),
  `q95_abs_rel` DECIMAL(12,6),
  `bias` DECIMAL(12,6),
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `idx_calstats_key` (`organization_id`, `property_name`, `prediction_basis`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `ingestion_jobs` (
  `id` VARCHAR(36) PRIMARY KEY,
  `organization_id` VARCHAR(36) NOT NULL,
  `created_by` VARCHAR(36) NOT NULL,
  `source_type` ENUM('batch_card','lab_notebook','qc_log','trial_report','spreadsheet','other') NOT NULL,
  `source_description` TEXT,
  `status` ENUM('extracting','pending_review','partially_committed','committed','rejected','failed') NOT NULL DEFAULT 'extracting',
  `raw_text` TEXT,
  `error` TEXT,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_ingestion_org` (`organization_id`, `status`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `extracted_records` (
  `id` VARCHAR(36) PRIMARY KEY,
  `job_id` VARCHAR(36) NOT NULL,
  `organization_id` VARCHAR(36) NOT NULL,
  `record_type` ENUM('formulation','trial_results','formulation_with_results') NOT NULL,
  `payload` JSON NOT NULL,
  `confidence` DECIMAL(3,2),
  `status` ENUM('pending_review','approved','rejected','committed','commit_failed') NOT NULL DEFAULT 'pending_review',
  `reviewed_by` VARCHAR(36),
  `review_notes` TEXT,
  `committed_refs` JSON,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_extracted_job` (`job_id`),
  INDEX `idx_extracted_org_status` (`organization_id`, `status`)
);
