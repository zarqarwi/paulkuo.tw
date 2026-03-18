-- Phase 4: Scorecard evaluations table for social sharing
CREATE TABLE IF NOT EXISTS scorecard_evaluations (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  project_name TEXT NOT NULL,
  project_desc TEXT,
  input_type TEXT,
  stage TEXT NOT NULL,
  mode TEXT DEFAULT 'quick',
  dim_scores TEXT,
  signal_scores TEXT,
  github_meta TEXT,
  veto_triggered TEXT,
  total_score REAL,
  verdict TEXT,
  ai_advice TEXT,
  is_public INTEGER DEFAULT 0,
  lang TEXT DEFAULT 'zh-TW',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_evaluations_public
  ON scorecard_evaluations(is_public, created_at DESC);
