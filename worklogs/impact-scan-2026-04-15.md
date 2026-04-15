# 跨專案影響掃描報告（2026-04-15）

## 掃描範圍
- 時間：近 3 天（2026-04-12 ~ 2026-04-15）
- 共掃描 35 個 commits
- 共用檔案清單來源：docs/shared-files.json
- 專案清單來源：worklogs/governance/projects.json

## 發現的問題

無異常

---

## 掃描細節（參考）

近 3 天的 commits 主要集中在：
- `src/pages/governance/index.astro`（governance dashboard 改版，Phase A）
- `src/pages/projects/formosa-esg-2026/**`（formosa 個人足跡 bug fix、mazu crown、dual identity）
- `worker/src/formosa.js`（formosa 推播頻率、GPS fallback）
- `src/content/wiki/raw/clips/**` + `src/content/wiki/sources/**`（wiki 批次 ingest）
- `worklogs/**` + `handoffs/**`（文件類）
- `public/governance/*.html`（Harness 文件庫）

以上檔案皆不在 `docs/shared-files.json` 的 critical / shared_modules / ai_ready_auto 清單中，
因此沒有任何 commit 需要補標注 `[影響: ...]` 或補跨子專案 smoke test。
