-- Migration 0002: Prediction provenance columns (Phase 1 physics fusion)
--
-- Every stored prediction now records where its value came from:
--   prediction_basis: physics_anchored | llm_physics_informed | llm_only
--   physics_value:    the deterministic mixing-rule value (when one existed)
--   llm_raw_value:    the LLM's uncorrected estimate
--   sigma_source:     physics_band | llm_heuristic | conformal
--   provenance:       human-readable derivation for display and audit
--
-- Idempotent (TiDB supports ADD COLUMN IF NOT EXISTS); all columns nullable
-- so existing rows and the running app are unaffected.

ALTER TABLE `predictions` ADD COLUMN IF NOT EXISTS `prediction_basis` VARCHAR(32);
--> statement-breakpoint
ALTER TABLE `predictions` ADD COLUMN IF NOT EXISTS `physics_value` DECIMAL(20,6);
--> statement-breakpoint
ALTER TABLE `predictions` ADD COLUMN IF NOT EXISTS `llm_raw_value` DECIMAL(20,6);
--> statement-breakpoint
ALTER TABLE `predictions` ADD COLUMN IF NOT EXISTS `sigma_source` VARCHAR(32);
--> statement-breakpoint
ALTER TABLE `predictions` ADD COLUMN IF NOT EXISTS `provenance` TEXT;
