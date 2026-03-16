-- Channel D: YouTube 字幕進件 — 新增 source_url 欄位
-- source_origin 已存在（會用 'youtube' 作為新值）
ALTER TABLE tqef_corpus ADD COLUMN source_url TEXT;
