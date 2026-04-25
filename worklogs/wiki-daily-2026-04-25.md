---
title: Wiki Daily Pipeline — 2026-04-25
date: 2026-04-25
pipeline: wiki-daily-pipeline
status: partial
---

# Wiki 每日管線報告 2026-04-25

排程任務 `wiki-daily-pipeline` 本日執行結果。Step 1 完成、Step 3 雲端部分掃描（同昨日）、Step 2 維持阻塞。

---

## Web clips: 新增 13 則

依 `data/wiki-pillar-keywords.json` 對 5 個 pillar 用 Brave 搜尋，去重後 commit 到 `wiki/raw/clips/2026-04-25/`。Brave MCP 沒暴露嚴格 24h freshness 參數，本次採取「2026 年內且 pillar 高相關」的保守標準（明日重試清單會建議改善）。

| # | Title | Pillar |
|---|-------|--------|
| 1 | AI agent trends 2026 report (Google Cloud) | ai |
| 2 | NeoCognition $40M seed (TechCrunch, 2026-04-21) | ai |
| 3 | One Year of MCP — 2025-11 spec release | ai |
| 4 | 全球AI治理新闻 No.23（2026-04-06~04-13） | ai |
| 5 | 史丹佛 2026 AI Index — AI 主權框架 | ai |
| 6 | 2026 ESG 永續台灣高峰會 | circular |
| 7 | 2026 ESG 6 大趨勢（businesstoday） | circular |
| 8 | CEITA 循環經濟韌性能源 | circular |
| 9 | 半導體工業廢棄物處理趨勢（SEMI） | circular |
| 10 | 廢 PCB 黃金回收 — 優勝奈米濕式剝金 | circular |
| 11 | 2026 OPC 一人公司爆發（36kr） | startup |
| 12 | AI 超級個體 OPC（stcn） | startup |
| 13 | AI 信仰危機與機遇（CSDN 神學/倫理對話） | faith |

> 全部 frontmatter 齊全（url / title / source_domain / pillar / fetched_at / visibility=internal），等 Paul 審查後升級到 `wiki/sources/`。

Commit: `[wiki-daily] clips: 新增 13 則`（push_files 一次性提交）

---

## YouTube: 新增 0 支（阻塞）

**狀態：阻塞，列入明日重試清單。**

跟昨日同樣的問題：本 session 接到的 Cloudflare MCP 工具面只暴露 namespace 層級操作（list / get / create / delete / update namespace），**沒有 KV key-value 讀寫能力**。Workspace 環境也沒有 CF token 或 wrangler CLI。

→ 沒辦法讀 `TICKER_KV` 的 `youtube-pending` key，也沒辦法 commit 後從 KV 移除已處理項目。今日完全跳過。

---

## 待 ingest 筆記: 雲端部分掃出（同昨日狀態）

掃 `zarqarwi/get-biji-notes`（master）notes/ 結果寫到 `worklogs/wiki-ingest-pending.md`。

| 資料夾 | visibility | 雲端列檔狀態 | 雲端可見檔數 |
|--------|------------|--------------|--------------|
| 01_專欄文章 | public | 列子目錄（7 個系列） | — |
| 02_醫療健康 | internal | 完整 | ~30 |
| 03_環保循環經濟 | public | 完整 | 13 |
| 04_AI與科技 | public（錄音卡 → internal） | **未列檔，超 MCP 上限** | — |
| 05_商務會議 | internal（錄音卡 → private） | 完整 | ~21 |
| 06_個人成長與學習 | internal | **未列檔，超 MCP 上限** | — |
| 07_生活雜記 | private | 跳過 | — |
| 08_其他 | internal | 完整 | ~38 |
| 09_會議錄音 | private | 跳過 | — |

**雲端 scanner 沒讀檔內 frontmatter** → `raw_note_id` 比對和 tag-based 錄音卡降級規則套用都無法在雲端做。完整的 public N 則 / internal M 則統計需要本機 `scripts/build_wiki_ingest_report.py` 接手。

Commit: `[wiki-daily] scanner: 雲端部分掃描 — 02/03/05/08 列檔，01 列子目錄，04/06 待本機接手`

---

## 建議行動

1. **Paul 人工審 13 份新 clip** — 決定哪些升級到 `wiki/sources/`（這部分可在 Cowork 直接做）
2. **本機 scanner 接手 04 / 06 列檔 + tag 降級 + raw_note_id 比對** — 跑 `scripts/build_wiki_ingest_report.py` 取得權威 pending 清單
3. **Step 2 KV 阻塞處理** — 二選一：
   - 等 Cowork 的 Cloudflare MCP 補上 KV key-value 操作；或
   - 接受改用本機 wrangler CLI 跑 `scripts/wiki-youtube-ingest.cjs`，並把 wiki-daily-pipeline 的 Step 2 拆出去到本機排程
4. **Brave freshness** — 確認 Brave MCP 能否暴露 freshness=pd 參數，否則 Step 1 的「近 24 小時」不可能嚴格執行；目前用 pillar relevance 為主、年份 (2026) 為輔的篩選

---

## 明日重試清單（→ 2026-04-26）

1. **Step 2 Cloudflare KV 讀取** — 同昨日，仍待解（建議 Paul 抉擇本機路線）
2. **04 / 06 完整列檔** — 由本機 scanner 接手
3. **Brave freshness 嚴格 24h 過濾** — 工具面確認

---

## 備註

- 所有 commit 直推 `main`，無 PR（符合 wiki-daily-pipeline 規約）
- 本日總 commit 數 = 3（clips + pending + 本報告）
- Issue #157（Wiki 儀表板）未在本次更新；待 Paul 確認 Step 2 阻塞處理方式後再同步
- 模型建議：Sonnet（Effort: medium）— Step 1/3 是大量 listing + dedup，不需 Opus；Step 4 報告 narrative 也是 Sonnet 量級
