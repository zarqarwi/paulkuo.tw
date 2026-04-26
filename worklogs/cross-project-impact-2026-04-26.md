# 跨專案影響掃描 — 2026-04-26

> 自動產出：cross-project-governance scheduled task
> 視窗：rolling 24h ending 2026-04-26T02:36:14Z
> 來源：docs/shared-file-impact-map.md（含 13 個高/中風險共用檔案）

## 掃描結果

**結論：本視窗內無共用檔案命中。**

近 24 小時 paulkuo.tw 的 20 個 commit 內容集中在：

- 治理文件（ADR / handoff / PENDING / worklog）
- wiki-daily 自動化產出（clips / scanner / report）
- wiki-youtube ingest 腳本拆機（scripts/wiki-youtube-ingest.cjs，非共用模組）
- audit-results / external eval 自動 baseline

均未動到下列高風險共用檔案：

- worker/src/{index,config,utils,auth,translator,scorecard,status}.js
- src/layouts/BaseLayout.astro
- src/components/{NavBar,SiteHead,SiteFooter,I18nClient}.astro
- src/data/siteSchema.ts

`zarqarwi/get-biji-notes` 24h 無 commit。
`zarqarwi/formosa-esg-2026` repo 在 zarqarwi user 下找不到，整段跳過。

## 觀察項（非警示）

下列 commit 未帶 `[影響: ...]` 標注，但內容均為非共用檔案，本視窗不列入「漏標注警示」：

- `a84ad4e7` `[wiki-daily] report: 2026-04-26 完成` — worklogs/wiki-daily-*.md
- `48225c19` `[wiki-daily] scanner: 82 則待 ingest` — worklogs/wiki-ingest-pending.md
- `b8b73a9c` `[wiki-daily] clips: 新增 14 則` — raw/clips/*
- `c6a2db4e` `feat(wiki-youtube): add --write-log flag + local cron setup (Issue #186)` — scripts/wiki-youtube-ingest.cjs（非共用）
- `344b7eb5` `auto(scanner): daily audit 2026-04-25` — audit-results/* （bot）
- `20c4a5a9` `chore: external eval temporal baseline 2026-04-25` — eval baseline（bot）

## 警示

✅ 本視窗無「漏標注」/ 「漏測試」警示。
