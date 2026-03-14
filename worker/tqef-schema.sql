-- TQEF Admin Phase 1 Schema
-- 2026-03-14

CREATE TABLE IF NOT EXISTS tqef_corpus (
  id TEXT PRIMARY KEY,
  domain TEXT NOT NULL,
  source_lang TEXT DEFAULT 'ja',
  target_lang TEXT DEFAULT 'zh-TW',
  source_text TEXT NOT NULL,
  reference_translation TEXT,
  has_audio INTEGER DEFAULT 0,
  audio_r2_key TEXT,
  audio_source TEXT,
  ground_truth_transcript TEXT,
  stt_raw_output TEXT,
  stt_errors_detected TEXT,
  stt_provider TEXT,
  prompt_version_at_creation TEXT,
  calibration_stt_provider TEXT,
  source_origin TEXT DEFAULT 'manual',
  source_ref TEXT,
  context TEXT,
  difficulty TEXT DEFAULT 'medium',
  tags TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_by TEXT DEFAULT 'paul'
);

CREATE TABLE IF NOT EXISTS tqef_corpus_versions (
  version_id INTEGER PRIMARY KEY AUTOINCREMENT,
  snapshot TEXT NOT NULL,
  sentence_count INTEGER,
  created_at TEXT DEFAULT (datetime('now')),
  note TEXT
);

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

CREATE TABLE IF NOT EXISTS tqef_rounds (
  round_id TEXT PRIMARY KEY,
  eval_mode TEXT NOT NULL DEFAULT 'translation_only',
  corpus_version_id INTEGER,
  prompt_version TEXT,
  eval_prompt_version TEXT,
  translation_model TEXT DEFAULT 'claude-haiku-4-5',
  temperature REAL DEFAULT 0,
  stt_providers TEXT,
  started_at TEXT,
  completed_at TEXT,
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
  feedback_analysis TEXT,
  feedback_actions TEXT,
  metadata TEXT,
  FOREIGN KEY (corpus_version_id) REFERENCES tqef_corpus_versions(version_id)
);

CREATE TABLE IF NOT EXISTS tqef_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  round_id TEXT NOT NULL,
  sentence_id TEXT NOT NULL,
  stt_provider TEXT,
  stt_output TEXT,
  l1_wer REAL,
  l1_cer REAL,
  l1_term_hits TEXT,
  l1_lite_errors TEXT,
  l1_lite_confidence TEXT,
  eval_type TEXT DEFAULT 'standard',
  input_source TEXT DEFAULT 'ground_truth',
  translation TEXT,
  l2_term REAL,
  l2_fluency REAL,
  l2_context REAL,
  l2_format REAL,
  is_critical_error INTEGER DEFAULT 0,
  error_type TEXT,
  notes TEXT,
  FOREIGN KEY (round_id) REFERENCES tqef_rounds(round_id),
  FOREIGN KEY (sentence_id) REFERENCES tqef_corpus(id)
);

CREATE TABLE IF NOT EXISTS tqef_stt_benchmarks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  round_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  language TEXT NOT NULL,
  avg_wer REAL,
  avg_cer REAL,
  term_recognition_rate REAL,
  punctuation_accuracy REAL,
  latency_p50_ms INTEGER,
  latency_p95_ms INTEGER,
  sample_count INTEGER,
  FOREIGN KEY (round_id) REFERENCES tqef_rounds(round_id)
);

CREATE TABLE IF NOT EXISTS tqef_feedback (
  id TEXT PRIMARY KEY,
  session_id TEXT,
  timestamp TEXT,
  source_text TEXT NOT NULL,
  original_translation TEXT NOT NULL,
  suggested_correction TEXT NOT NULL,
  error_type TEXT,
  stt_provider TEXT,
  prompt_version TEXT,
  domain_detected TEXT,
  user_id TEXT,
  status TEXT DEFAULT 'pending',
  review_note TEXT,
  reviewed_at TEXT,
  corpus_id TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_feedback_status ON tqef_feedback(status);

CREATE TABLE IF NOT EXISTS tqef_meeting_exports (
  id TEXT PRIMARY KEY,
  session_id TEXT,
  meeting_date TEXT,
  stt_provider TEXT,
  prompt_version TEXT,
  source_lang TEXT,
  target_lang TEXT,
  default_domain TEXT,
  total_entries INTEGER,
  selected_entries INTEGER,
  l1_lite_error_count INTEGER,
  l1_lite_error_rate REAL,
  l1_lite_analysis TEXT,
  status TEXT DEFAULT 'pending',
  reviewed_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  notes TEXT
);

CREATE TABLE IF NOT EXISTS tqef_meeting_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  export_id TEXT NOT NULL,
  entry_index INTEGER,
  timestamp TEXT,
  source_lang TEXT,
  stt_output TEXT NOT NULL,
  translation TEXT NOT NULL,
  l1_lite_errors TEXT,
  corrected_text TEXT,
  is_selected INTEGER DEFAULT 0,
  domain TEXT,
  corpus_id TEXT,
  FOREIGN KEY (export_id) REFERENCES tqef_meeting_exports(id)
);

CREATE INDEX IF NOT EXISTS idx_meeting_entries_export ON tqef_meeting_entries(export_id);

CREATE TABLE IF NOT EXISTS tqef_audio_uploads (
  id TEXT PRIMARY KEY,
  total_files INTEGER,
  calibrated_files INTEGER DEFAULT 0,
  default_domain TEXT,
  default_lang TEXT,
  stt_provider_used TEXT,
  source_description TEXT,
  has_transcript INTEGER DEFAULT 0,
  transcript_ref TEXT,
  status TEXT DEFAULT 'uploading',
  created_at TEXT DEFAULT (datetime('now')),
  notes TEXT
);

CREATE TABLE IF NOT EXISTS tqef_audio_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  upload_id TEXT NOT NULL,
  filename TEXT NOT NULL,
  r2_key TEXT,
  duration_seconds REAL,
  source_lang TEXT,
  domain TEXT,
  stt_raw_output TEXT,
  stt_provider TEXT,
  stt_timestamp TEXT,
  ground_truth TEXT,
  calibrated_at TEXT,
  auto_wer REAL,
  auto_cer REAL,
  status TEXT DEFAULT 'pending_stt',
  corpus_id TEXT,
  FOREIGN KEY (upload_id) REFERENCES tqef_audio_uploads(id)
);

CREATE INDEX IF NOT EXISTS idx_audio_files_upload ON tqef_audio_files(upload_id);
CREATE INDEX IF NOT EXISTS idx_audio_files_status ON tqef_audio_files(status);

CREATE TABLE IF NOT EXISTS tqef_yt_sources (
  video_id TEXT PRIMARY KEY,
  title TEXT,
  url TEXT,
  language TEXT,
  subtitle_type TEXT,
  duration_seconds INTEGER,
  total_sentences INTEGER,
  active_sentences INTEGER,
  default_domain TEXT,
  imported_at TEXT DEFAULT (datetime('now')),
  imported_by TEXT DEFAULT 'paul',
  notes TEXT
);
