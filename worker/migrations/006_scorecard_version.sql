-- Phase 5b: Add version column for version comparison feature
ALTER TABLE scorecard_evaluations ADD COLUMN version INTEGER DEFAULT 1;
