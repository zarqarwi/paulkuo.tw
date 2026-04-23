# 跨專案影響掃描報告（2026-04-21）

## 掃描範圍
- 時間：近 3 天（2026-04-18 ~ 2026-04-21）
- 共掃描 62 個 commits
- 共用檔案清單來源：docs/shared-files.json
- 專案清單來源：worklogs/governance/projects.json

## 無異常

近 3 天（2026-04-18 ~ 2026-04-21）的 62 個 commits 中，
無任何 commit 動到 docs/shared-files.json 所定義的 18 個共用檔案。

### 共用檔案清單（本次均未異動）
#### critical（極高風險）
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

#### shared_modules（跨專案共用模組）
- worker/src/translator.js
- worker/src/scorecard.js
- worker/src/status.js
- worker/src/youtube-ingest.js

#### ai_ready_auto（AI Ready 自動修改）
- public/llms.txt
- public/mcp.json
- public/.well-known/agent-card.json
- public/robots.txt

### 值得注意的近期變更（非共用檔案）
以下檔案有改動但不在共用清單，僅供參考：
- `src/pages/index.astro` + `src/components/GlobeHeroBg.astro`（commits: `e303a86`, `c971cc4`）— 首頁加入地球旋轉動畫，不影響其他子專案

---
_掃描器版本：scheduled-task v1.0_
_心跳檔：worklogs/governance/last-scan.json_
