# 跨專案影響掃描報告（2026-04-17）

## 掃描範圍
- 時間：近 3 天（2026-04-14 ~ 2026-04-17）
- 共掃描 85 個 commits
- 共用檔案清單來源：docs/shared-files.json
- 專案清單來源：worklogs/governance/projects.json

## 動到共用檔案的 commits

### 5c58ee0 — fix: YouTube transcript pipeline — yt-dlp + Whisper fallback, backfill 4/23 sources [影響: Wiki]
- 動到：`worker/src/youtube-ingest.js`（shared_modules，affects: paulkuo-main + llm-wiki）
- 影響標注：✅ 有 `[影響: Wiki]`（但未涵蓋 paulkuo-main）
- Smoke Test：✅ worklog-2026-04-16.md 已記錄「Wiki search API 200 ✅ / 主站 200 ✅」，且 22:xx 補跑了跨專案 smoke test（主站/Wiki/Formosa/ACP/TQEF 全部 200 OK）

## 發現的問題

### 缺少影響標注
- 無（所有動到共用檔案的 commit 都有 `[影響: ...]` 標注）

### 缺少 Smoke Test
- 無（所有動到共用檔案的 commit 都有對應 smoke test 記錄）

## 次要觀察（不影響防線，僅供參考）
- `5c58ee0` 的影響標注寫 `[影響: Wiki]`，但根據 `docs/shared-files.json`，`worker/src/youtube-ingest.js` 同時影響 `paulkuo-main`（主站）。雖然實際的 smoke test 已驗證主站，但 commit message 的標注不夠完整。
  - 建議標注：`[影響: Wiki + 主站]`
  - 不升級為問題，因為 smoke test 已實際驗證兩個受影響專案。

## 無異常

兩層防線（commit 標注 + worklog smoke test）都正常運作。近 3 天內僅 1 個 commit 動到共用檔案，且兩項檢查都通過。
