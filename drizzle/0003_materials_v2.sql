-- Migration 0003: Materials v2 — first-principles material data model
--
-- New typed columns on `materials` (function taxonomy + physics inputs that
-- unlock Krieger-Dougherty, PVC/CPVC, cure-depth, crosslink-density and
-- volume-fraction HSP), plus:
--   material_properties: qualified (temperature/shear/method) values with
--                        per-value provenance and confidence
--   hsp_reference:       HSPiP/literature Hansen dataset joined by CAS/InChIKey
--
-- Idempotent (TiDB ADD COLUMN IF NOT EXISTS / CREATE TABLE IF NOT EXISTS);
-- all new columns nullable — zero-downtime, no backfill required.

ALTER TABLE `materials` ADD COLUMN IF NOT EXISTS `hansen_r0` DECIMAL(10,4);
--> statement-breakpoint
ALTER TABLE `materials` ADD COLUMN IF NOT EXISTS `material_function` VARCHAR(50);
--> statement-breakpoint
ALTER TABLE `materials` ADD COLUMN IF NOT EXISTS `sub_function` VARCHAR(100);
--> statement-breakpoint
ALTER TABLE `materials` ADD COLUMN IF NOT EXISTS `solids_content` DECIMAL(5,2);
--> statement-breakpoint
ALTER TABLE `materials` ADD COLUMN IF NOT EXISTS `voc_content` DECIMAL(8,2);
--> statement-breakpoint
ALTER TABLE `materials` ADD COLUMN IF NOT EXISTS `functionality` DECIMAL(5,2);
--> statement-breakpoint
ALTER TABLE `materials` ADD COLUMN IF NOT EXISTS `equivalent_weight` DECIMAL(10,2);
--> statement-breakpoint
ALTER TABLE `materials` ADD COLUMN IF NOT EXISTS `particle_size_d50` DECIMAL(10,4);
--> statement-breakpoint
ALTER TABLE `materials` ADD COLUMN IF NOT EXISTS `oil_absorption` DECIMAL(6,2);
--> statement-breakpoint
ALTER TABLE `materials` ADD COLUMN IF NOT EXISTS `hlb` DECIMAL(4,1);
--> statement-breakpoint
ALTER TABLE `materials` ADD COLUMN IF NOT EXISTS `surface_tension` DECIMAL(6,2);
--> statement-breakpoint
ALTER TABLE `materials` ADD COLUMN IF NOT EXISTS `molar_volume` DECIMAL(10,2);
--> statement-breakpoint
ALTER TABLE `materials` ADD COLUMN IF NOT EXISTS `smiles` TEXT;
--> statement-breakpoint
ALTER TABLE `materials` ADD COLUMN IF NOT EXISTS `inchi_key` VARCHAR(27);
--> statement-breakpoint
ALTER TABLE `materials` ADD COLUMN IF NOT EXISTS `pubchem_cid` VARCHAR(20);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `material_properties` (
  `id` VARCHAR(36) PRIMARY KEY,
  `material_id` VARCHAR(36) NOT NULL,
  `property_name` VARCHAR(64) NOT NULL,
  `value` DECIMAL(20,6) NOT NULL,
  `unit` VARCHAR(32),
  `temperature_c` DECIMAL(6,2),
  `shear_rate` DECIMAL(10,2),
  `method` VARCHAR(128),
  `source` ENUM('measured','supplier_tds','pubchem','hspip','group_contribution','llm_extracted','manual') NOT NULL,
  `source_document_id` VARCHAR(36),
  `uncertainty` DECIMAL(20,6),
  `confidence` DECIMAL(3,2) DEFAULT 0.80,
  `is_preferred` BOOLEAN NOT NULL DEFAULT FALSE,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_matprops_material_prop` (`material_id`, `property_name`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `hsp_reference` (
  `id` VARCHAR(36) PRIMARY KEY,
  `cas_number` VARCHAR(32),
  `inchi_key` VARCHAR(27),
  `name` TEXT,
  `hansen_d` DECIMAL(10,4) NOT NULL,
  `hansen_p` DECIMAL(10,4) NOT NULL,
  `hansen_h` DECIMAL(10,4) NOT NULL,
  `r0` DECIMAL(10,4),
  `molar_volume` DECIMAL(10,2),
  `source` VARCHAR(32) NOT NULL DEFAULT 'hspip',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_hspref_cas` (`cas_number`),
  INDEX `idx_hspref_inchi` (`inchi_key`)
);
