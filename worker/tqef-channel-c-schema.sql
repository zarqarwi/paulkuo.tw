-- TQEF Channel C: Corpus Intake Schema
-- 2026-03-15
-- Note: tqef_corpus already exists (Phase 1), Channel C writes to it with source_origin='intake_audio'/'intake_text'

-- Per-file audio upload tracking for Channel C intake flow
CREATE TABLE IF NOT EXISTS tqef_intake_audio (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  duration_seconds REAL,
  language TEXT NOT NULL,
  domain TEXT NOT NULL DEFAULT 'general',
  stt_engine TEXT,
  stt_status TEXT DEFAULT 'pending',
  stt_task_id TEXT,
  stt_raw TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_intake_audio_status ON tqef_intake_audio(stt_status);

-- Temp tokens for R2 audio proxy (Qwen filetrans needs a fetchable URL)
CREATE TABLE IF NOT EXISTS tqef_intake_audio_tokens (
  token TEXT PRIMARY KEY,
  r2_key TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);
