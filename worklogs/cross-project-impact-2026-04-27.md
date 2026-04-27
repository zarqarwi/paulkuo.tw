# Cross-project Impact Scan — 2026-04-27

> 自動產出（cross-project-governance scheduled task）
> 掃描窗口：2026-04-26T02:37:04Z → 2026-04-27T02:37:04Z（近 24h）
> 監測來源：`docs/shared-files.json`（SSOT）

## 監測 repo

- **zarqarwi/paulkuo.tw**（main）— 72 commits in window
- **zarqarwi/get-biji-notes**（master）— 0 commits in window
- ~~zarqarwi/formosa-esg-2026~~（2026-04-26 結案，已 archived 移出監測）

## 共用檔案命中

掃描對照 `docs/shared-files.json` 的 critical / shared_modules / ai_ready_auto 三組共用檔案。

### 命中 1：`scripts/wiki_visibility.py`

| 欄位 | 內容 |
|------|------|
| Commit | `fb3b10c1` |
| Subject | `fix(wiki-visibility): isinstance guard in has_recording_tag for string tags` |
| Affects 標注 | ❌ 漏標注（commit message 無 `[影響:]` / `[affects:]` 標籤）|
| 受影響範圍 | LLM Wiki ingest pipeline — `wiki-quarantine-classify.py`、`wiki-pending-promote.py` 共用 |
| Smoke test 狀態 | ✅ 同窗口內已跑單元測試（commit `c55185b` test(wiki-dialogue): unit tests for lib, promote injection, classify rule 1）|

### 命中 2：`scripts/wiki_dialogue_lib.py`

| 欄位 | 內容 |
|------|------|
| Commit | `7d42a696` |
| Subject | `refactor(wiki-dialogue): extract detect logic to wiki_dialogue_lib.py` |
| Affects 標注 | ❌ 漏標注（commit message 無 `[影響:]` / `[affects:]` 標籤）|
| 受影響範圍 | LLM Wiki ingest pipeline — `wiki-dialogue-detect.py`（CLI）、`wiki-pending-promote.py`、`wiki-quarantine-classify.py` |
| Smoke test 狀態 | ✅ 同窗口內已跑單元測試（commit `c55185b` 涵蓋 lib + promote + classify rule 1）|

### 軟性備註（two-step 同步）

兩支命中的檔案都是在這 24h 窗口內**才被加進** `docs/shared-file-impact-map.md` SSOT 的（commit `c9b4d1a docs(shared-file-impact-map): register wiki_dialogue_lib and wiki_visibility`）。也就是：

- 7d42a69（檔案誕生 / 函式抽取）發生時，檔案還不在 SSOT
- fb3b10c1（修補 isinstance guard）發生時，檔案還不在 SSOT
- c9b4d1a 才把這兩支檔案登記進 SSOT

技術上仍屬「漏標注」（規範要求 commit message 帶 `[影響:]`），但屬於「先做後登記」型節奏問題，不是「動到既知共用檔案沒交代」。**建議下次新增共用模組時走 SSOT 先登記、再動程式碼**的順序，或在當次 commit 直接附上 `[影響: llm-wiki]` 標記。

## 警示總結

### ⚠️ 漏標注（2 件）

1. `fb3b10c1` fix(wiki-visibility): isinstance guard — `scripts/wiki_visibility.py`
2. `7d42a696` refactor(wiki-dialogue): extract detect logic — `scripts/wiki_dialogue_lib.py`

兩件皆屬「先動程式碼、後補 SSOT 登記」節奏；後續 commit `c9b4d1a` 已把檔案登記進 shared-files.json。

### ✅ 漏測試 — 無

兩支命中皆有對應單元測試在同窗口執行（`c55185b`）。

## CI / 部署狀態

paulkuo.tw 最近 5 次 GitHub Actions runs 全部 success：

- Publish to Social Media — success @ 2026-04-27T02:32:59Z
- SEO Index Submit — success @ 2026-04-27T02:32:59Z
- Build & Deploy — success @ 2026-04-27T02:30:29Z
- Wiki Visibility Consistency Check — success @ 2026-04-27T02:30:29Z
- SEO Index Submit — success @ 2026-04-27T02:22:25Z

get-biji-notes 為 private repo，無 GitHub Actions 設定 / 公開 API 不可達，標 `unknown`。
