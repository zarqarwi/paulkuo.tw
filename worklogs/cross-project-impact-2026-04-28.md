# 跨專案影響掃描 — 2026-04-28

**掃描時間**：2026-04-28 (近 24 小時，2026-04-27 00:00:00Z → 2026-04-28 23:59:59Z)
**監測 repos**：zarqarwi/paulkuo.tw（main）、zarqarwi/get-biji-notes（master）
**共用檔案來源**：`docs/shared-files.json` + `docs/shared-file-impact-map.md`

---

## 掃描範圍

| Repo | 24h commits | 是否掃描 |
|------|-------------|---------|
| zarqarwi/paulkuo.tw | 48 | ✅ 全掃 |
| zarqarwi/get-biji-notes | 0 | — 無 commits 跳過 |

共用檔案清單（從 `docs/shared-files.json` 載入）：

- **critical** (10)：`worker/src/index.js`、`worker/src/config.js`、`worker/src/utils.js`、`worker/src/auth.js`、`src/layouts/BaseLayout.astro`、`src/components/NavBar.astro`、`src/components/SiteHead.astro`、`src/components/SiteFooter.astro`、`src/components/I18nClient.astro`、`src/data/siteSchema.ts`
- **shared_modules** (4)：`worker/src/translator.js`、`worker/src/scorecard.js`、`worker/src/status.js`、`worker/src/youtube-ingest.js`
- **ai_ready_auto** (4)：`public/llms.txt`、`public/mcp.json`、`public/.well-known/agent-card.json`、`public/robots.txt`

---

## 掃描結果

✅ **本次 24 小時內 0 個 commits 觸碰共用檔案。** 無漏標注、無漏測試警示。

paulkuo.tw 48 個 commits 集中在以下範圍（皆為子專案專屬，未觸及 shared 清單）：

- LLM Wiki Phase 4（Step A → F batch 1）：derived_from 反向索引、UI、validator、prebuild、frontmatter backfill — 影響 `scripts/wiki-*`、`src/components/wiki/*`、`src/pages/wiki/*`、`src/content/wiki/**`
- wiki ingest 周邊：`scripts/wiki_corpus_lib.py`、`scripts/wiki-enrich.cjs`（gray-matter 重構）、`scripts/wiki-quarantine-classify.py`（fast-path）、`data/wiki/youtube_blocklist`
- 自動化 chore：SEO indexed URLs（github-actions[bot]）、external eval temporal baseline（ai-ready-bot）、daily scanner audit、wiki-daily 報告
- 治理：前一日 governance metrics + impact 報告 commit

> 註：`scripts/wiki_dialogue_lib.py` 與 `scripts/wiki_visibility.py` 列在 impact map 但目前 24h 內無修改。

---

## 警示

✅ **無警示**
