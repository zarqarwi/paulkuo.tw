# 跨專案影響掃描報告（2026-04-18）

## 掃描範圍
- 時間：近 3 天（2026-04-15 ~ 2026-04-18）
- 共掃描 66 個 commits
- 共用檔案清單來源：docs/shared-files.json
- 專案清單來源：worklogs/governance/projects.json

## 發現的問題

### 缺少影響標注
（無。本週期內唯一動到共用檔案的 commit 已自行標注 `[影響: Wiki]`，雖未完全對齊 projects.json 的 id，但已具備影響範圍提示。）

### 缺少 Smoke Test
- 5c58ee0 `fix: YouTube transcript pipeline — yt-dlp + Whisper fallback, backfill 4/23 sources [影響: Wiki]` — 動到 `worker/src/youtube-ingest.js`（shared_modules，affects: llm-wiki, paulkuo-main），但 worklog-2026-04-16.md 中未找到對應的 Smoke Test 記錄
  - 建議驗證指令（llm-wiki + paulkuo-main）：
    - `curl -s -o /dev/null -w '%{http_code}' 'https://api.paulkuo.tw/api/wiki/search?q=LLM'`
    - `curl -s -o /dev/null -w '%{http_code}' https://paulkuo.tw/`

## 動到共用檔案的 commits（清單）

| Commit | 訊息 | 共用檔案 | Affects | 有標注？ | 有 Smoke Test？ |
|--------|------|----------|---------|----------|----------------|
| 5c58ee0 | fix: YouTube transcript pipeline — yt-dlp + Whisper fallback | worker/src/youtube-ingest.js | llm-wiki, paulkuo-main | ✅（[影響: Wiki]） | ❌ |

## 參考備註
- 標注格式未來可統一對齊 projects.json 的 id（如 `[影響: llm-wiki, paulkuo-main]`），以便自動化工具直接比對。
- 5c58ee0 同時動到 `worker/src/tqef-api.js`，但此檔案不在 shared-files.json 清單內，不計入本次掃描。
