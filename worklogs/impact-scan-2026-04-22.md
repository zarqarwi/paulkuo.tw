# 跨專案影響掃描報告（2026-04-22）

## 掃描範圍
- 時間：近 3 天（2026-04-19 ~ 2026-04-22）
- 共掃描 63 個 commits
- 共用檔案清單來源：docs/shared-files.json
- 專案清單來源：worklogs/governance/projects.json

## 共用檔案清單（docs/shared-files.json）

### critical（影響全部子專案）
- worker/src/index.js
- worker/src/config.js
- worker/src/utils.js
- worker/src/auth.js
- src/layouts/BaseLayout.astro
- src/components/NavBar.astro
- src/components/SiteHead.astro
- src/components/SiteFooter.astro
- src/components/I18nClient.astro
- src/data/siteSchema.ts

### shared_modules
- worker/src/translator.js（影響：llm-wiki, paulkuo-main, agora）
- worker/src/scorecard.js（影響：formosa-esg, paulkuo-main）
- worker/src/status.js（影響：全部）
- worker/src/youtube-ingest.js（影響：paulkuo-main, llm-wiki）

### ai_ready_auto
- public/llms.txt
- public/mcp.json
- public/.well-known/agent-card.json
- public/robots.txt

## 備註

本次掃描注意到以下「邊界案例」（不計入問題，僅供參考）：

- **worker/src/visitors.js**（commit `131eacf`）— 修正 dashboard 訪客數據路徑 + 降低 analytics 節流至 3h。此檔案在 `worker/src/` 目錄下，但**不在** `docs/shared-files.json` 的共用清單中，因此不計入掃描範圍。如果日後確認此檔案有跨子專案影響，建議將其加入 JSON 清單。

- **functions/.well-known/agent-card.json.js 和 mcp.json.js**（commits `f404682`, `cc1df59`）— 這是 Pages Function 包裝層，路徑為 `functions/.well-known/`，而 JSON 清單記錄的是 `public/.well-known/agent-card.json`（靜態資源路徑）。兩者邏輯上相關但路徑不同，不觸發掃描規則。

## 無異常

近 3 天（2026-04-19 ~ 2026-04-22）共 63 個 commits 中，沒有任何 commit 觸及 `docs/shared-files.json` 定義的共用檔案。
