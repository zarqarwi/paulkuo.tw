-- TQEF Phase 1 Schema — 5 core tables
-- Run: wrangler d1 execute paulkuo-auth --file=worker/tqef-schema.sql --config worker/wrangler.toml

-- ===== 語料庫 =====
CREATE TABLE IF NOT EXISTS tqef_corpus (
  id TEXT PRIMARY KEY,
  domain TEXT NOT NULL,
  source_lang TEXT DEFAULT 'ja',
  target_lang TEXT DEFAULT 'zh-TW',
  source_text TEXT NOT NULL,
  reference_translation TEXT,
  difficulty TEXT DEFAULT 'medium',
  focus TEXT,                            -- JSON array
  critical_terms TEXT,                   -- JSON object
  critical_numbers TEXT,                 -- JSON array
  glossary TEXT,                         -- JSON array
  has_audio INTEGER DEFAULT 0,
  source_origin TEXT DEFAULT 'manual',
  source_ref TEXT,
  context TEXT,
  tags TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_by TEXT DEFAULT 'paul'
);

-- 語料庫版本快照
CREATE TABLE IF NOT EXISTS tqef_corpus_versions (
  version_id INTEGER PRIMARY KEY AUTOINCREMENT,
  snapshot TEXT NOT NULL,
  sentence_count INTEGER,
  created_at TEXT DEFAULT (datetime('now')),
  note TEXT
);

-- ===== Prompt 版本 =====
CREATE TABLE IF NOT EXISTS tqef_prompts (
  version TEXT NOT NULL,
  prompt_type TEXT NOT NULL DEFAULT 'translation',
  prompts TEXT NOT NULL,
  context_injection TEXT,
  changelog TEXT,
  triggered_by_round TEXT,
  verified_in_round TEXT,
  verification_status TEXT DEFAULT 'pending',
  created_at TEXT DEFAULT (datetime('now')),
  created_by TEXT DEFAULT 'paul',
  PRIMARY KEY (version, prompt_type)
);

-- ===== 評估 Round =====
CREATE TABLE IF NOT EXISTS tqef_rounds (
  round_id TEXT PRIMARY KEY,
  eval_mode TEXT NOT NULL,
  corpus_version_id INTEGER,
  prompt_version TEXT,
  eval_prompt_version TEXT,
  translation_model TEXT,
  temperature REAL DEFAULT 0,
  stt_providers TEXT,
  started_at TEXT,
  completed_at TEXT,
  corpus_size INTEGER,
  evaluated_count INTEGER,
  l1_avg_wer REAL,
  l1_avg_cer REAL,
  l1_term_recognition_rate REAL,
  l2_overall REAL,
  l2_term REAL,
  l2_fluency REAL,
  l2_context REAL,
  l2_format REAL,
  l2_critical_errors INTEGER DEFAULT 0,
  e2e_score REAL,
  industry_breakdown TEXT,              -- JSON
  feedback_analysis TEXT,
  feedback_actions TEXT,
  metadata TEXT,
  FOREIGN KEY (corpus_version_id) REFERENCES tqef_corpus_versions(version_id)
);

-- ===== 逐句評估結果 =====
CREATE TABLE IF NOT EXISTS tqef_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  round_id TEXT NOT NULL,
  sentence_id TEXT NOT NULL,
  domain TEXT,
  difficulty TEXT,
  source_text TEXT,
  reference_translation TEXT,
  translation TEXT,
  input_source TEXT DEFAULT 'ground_truth',
  l2_term REAL,
  l2_fluency REAL,
  l2_context REAL,
  l2_format REAL,
  weighted_total REAL,
  is_critical_error INTEGER DEFAULT 0,
  error_type TEXT,
  errors TEXT,                           -- JSON array
  notes TEXT,
  FOREIGN KEY (round_id) REFERENCES tqef_rounds(round_id),
  FOREIGN KEY (sentence_id) REFERENCES tqef_corpus(id)
);

CREATE INDEX IF NOT EXISTS idx_tqef_results_round ON tqef_results(round_id);
CREATE INDEX IF NOT EXISTS idx_tqef_results_sentence ON tqef_results(sentence_id);
