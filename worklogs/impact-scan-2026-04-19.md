# 跨專案影響掃描報告（2026-04-19）

## 掃描範圍
- 時間：近 3 天（2026-04-16 ~ 2026-04-19）
- 共掃描 80 個 commits
- 共用檔案清單來源：docs/shared-files.json
- 專案清單來源：worklogs/governance/projects.json

## 發現的問題

### 缺少影響標注
- `5c58ee0` `fix: YouTube transcript pipeline — yt-dlp + Whisper fallback, backfill 4/23 sources [影響: Wiki]` — 動到 `worker/src/youtube-ingest.js`，影響 paulkuo-main、llm-wiki
  - 雖有 `[影響: Wiki]` 標注，但未使用 projects.json 規範的 project id，且漏掉 paulkuo-main
  - 建議標注：`[影響: paulkuo-main, llm-wiki]`

### 缺少 Smoke Test
- `5c58ee0` `fix: YouTube transcript pipeline — yt-dlp + Whisper fallback, backfill 4/23 sources` — 動到 `worker/src/youtube-ingest.js`，但 worklogs/worklog-2026-04-16.md 中未找到對應的 Smoke Test 記錄
  - 建議驗證指令（從 docs/shared-files.json `smoke_tests` 取得）：
    - `curl -s -o /dev/null -w '%{http_code}' 'https://api.paulkuo.tw/api/wiki/search?q=LLM'`（llm-wiki）
    - `curl -s -o /dev/null -w '%{http_code}' https://paulkuo.tw/`（paulkuo-main）

## 摘要
- 共用檔案被動到的 commit：1（`5c58ee0`）
- 缺影響標注規範：1
- 缺 Smoke Test：1
