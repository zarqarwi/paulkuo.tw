---
title: Wiki Daily Pipeline — 2026-04-24
date: 2026-04-24
pipeline: wiki-daily-pipeline
status: partial
---

# Wiki Daily Pipeline — 2026-04-24

排程任務 `wiki-daily-pipeline` 本日執行結果。Step 1 完成、Step 3 以雲端部分掃描交付，Step 2 因 MCP 工具面限制未能執行，列入明日重試清單。

---

## Step 1 — Web clips（Brave Search → raw/clips/）

**狀態：完成**

依 `data/wiki-pillar-keywords.json` 對五個 pillar 關鍵字執行 24 小時新鮮度搜尋，去重後 commit 到 `wiki/raw/clips/2026-04-24/*.md`。

- 合計 **13 份 clip**，五個 pillar 皆有覆蓋（ai / circular / life / startup / faith）
- Frontmatter 齊全（url / title / source_domain / pillar / fetched_at / visibility=internal）
- 全部標記 `visibility: internal`，等人工審查後才會進入 ingest 流程

下一步：Paul 審 clip，決定哪些值得升級到 `wiki/sources/`。

---

## Step 2 — YouTube transcripts（Cloudflare KV → wiki/sources/）

**狀態：阻塞，明日重試**

原計畫：讀 `TICKER_KV` 的 `youtube-pending` key，把待 ingest 的 videoId + transcript commit 到 `wiki/sources/youtube-{videoId}.md`，處理完從 KV 移除。

**阻塞點**：目前 session 接到的 Cloudflare MCP 工具面只暴露 namespace 層級操作（list / get / create / delete / update namespace），**沒有 key-value 讀寫能力**。Workspace 環境也沒有 CF token 或 wrangler CLI。

**處理**：
- 今日跳過此步驟，無 commit
- 加入明日重試清單
- 如持續無法從雲端 MCP 讀 KV，建議改為本機跑 `scripts/wiki-youtube-ingest.cjs` 走 wrangler / API token 路線

---

## Step 3 — get-biji-notes 掃描（→ worklogs/wiki-ingest-pending.md）

**狀態：雲端部分掃描交付，完整比對交棒本機 scanner**

今日透過 GitHub API 對 `zarqarwi/get-biji-notes`（master branch）`notes/` 目錄做雲端盤點，產出 `worklogs/wiki-ingest-pending.md`（commit `766da28`）。

**已完成**：
- 盤點 `wiki/sources/` 現有規模：**260 md**（以 search_code total_count 取得）
- 逐資料夾列出 01 / 02 / 03 / 05 / 08 的 md 檔清單
- 01_專欄文章 的 7 個子系列全部列出（OpenClaw / _duplicates / 共读_人比AI凶 / 共读_预测之书 / 快刀青衣_AI龙虾十日谈 / 快刀青衣_專欄 / 萬維鋼_現代思維工具100講）

**覆蓋缺口（已在 pending 報告中標注）**：
- `04_AI與科技` 和 `06_個人成長與學習` 目錄超過 MCP 單次回應長度上限，被截斷寫入 host 暫存檔，未能在雲端完整枚舉
- 未逐檔讀 frontmatter，因此未能做 `raw_note_id` 比對（哪些已 ingest、哪些未 ingest）
- 錄音卡筆記降級規則（04 中的錄音 → internal；05 中的錄音 → private）未套用，因為沒讀到 tags

**交棒**：完整比對交給本機 `scripts/build_wiki_ingest_report.py` 執行，該腳本走本機 filesystem，沒有 25k/250k char 回應上限，可以逐檔讀 frontmatter 做權威性掃描。

---

## Step 4 — Daily 報告

**狀態：本檔即 Step 4 deliverable。**

---

## 明日重試清單（→ 2026-04-25）

1. **Step 2 Cloudflare KV 讀取** — 確認 MCP 工具面是否補上 KV key-value 操作；若仍無，改走本機 wrangler 路線
2. **get-biji-notes 04 / 06 目錄** — 由本機 scanner 接手，不再嘗試從雲端枚舉
3. **13 份 clip 審查** — Paul 人工決定哪些 clip 升級到 wiki/sources/

---

## 備註

- 所有 commit 直推 main，無 PR（符合 wiki-daily-pipeline 規約）
- 本次 session 中段因 context 滿而重置，Step 4 在續接 session 中完成
- Issue #157（Wiki 儀表板）未在本次更新；待 Paul 確認 Step 2 阻塞處理方式後再同步
