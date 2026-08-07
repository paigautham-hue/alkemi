-- Migration 0001: Agentic memory tables + semantic embedding column
--
-- The four memory tables were originally created via ad-hoc SQL outside the
-- migration system (see .manus/db history). This migration makes them
-- reproducible on fresh databases and adds the `embedding` column used for
-- relevance-ranked memory retrieval.
--
-- Idempotent: IF NOT EXISTS on every statement (TiDB supports it on
-- ADD COLUMN as well), safe to run against the existing production DB.

CREATE TABLE IF NOT EXISTS `agent_memories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `organization_id` VARCHAR(255) NOT NULL,
  `open_id` VARCHAR(255),
  `fact` TEXT NOT NULL,
  `rationale` TEXT,
  `category` VARCHAR(50) NOT NULL DEFAULT 'formulation_insight',
  `confidence` DECIMAL(3,2) DEFAULT 0.80,
  `citations` JSON,
  `tags` JSON,
  `source_hash` VARCHAR(64),
  `embedding` JSON,
  `verified_at` TIMESTAMP NULL,
  `is_valid` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_org_category` (`organization_id`, `category`),
  INDEX `idx_valid` (`is_valid`)
);
--> statement-breakpoint
ALTER TABLE `agent_memories` ADD COLUMN IF NOT EXISTS `embedding` JSON;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `memory_verification_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `memory_id` INT NOT NULL,
  `verified_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `verification_result` VARCHAR(20) NOT NULL,
  `old_confidence` DECIMAL(3,2),
  `new_confidence` DECIMAL(3,2),
  `verification_notes` TEXT,
  INDEX `idx_memory` (`memory_id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `memory_usage_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `memory_id` INT NOT NULL,
  `used_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `use_case` VARCHAR(100),
  `was_helpful` BOOLEAN,
  INDEX `idx_memory` (`memory_id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `memory_feedback` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `memory_id` INT NOT NULL,
  `open_id` VARCHAR(255) NOT NULL,
  `organization_id` VARCHAR(255) NOT NULL,
  `rating` ENUM('helpful', 'not_helpful') NOT NULL,
  `context` VARCHAR(500),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_memory_id` (`memory_id`),
  INDEX `idx_org_memory` (`organization_id`, `memory_id`),
  UNIQUE KEY `unique_user_memory` (`memory_id`, `open_id`)
);
