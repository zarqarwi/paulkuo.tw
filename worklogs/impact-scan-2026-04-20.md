# 跨專案影響掃描報告（2026-04-20）

## 掃描範圍
- 時間：近 3 天（2026-04-17 ~ 2026-04-20）
- 共掃描 73 個 commits
- 共用檔案清單來源：docs/shared-files.json（18 個檔案）
- 專案清單來源：worklogs/governance/projects.json（6 個專案）

## 發現的問題

無異常

近 3 天沒有任何 commit 動到 docs/shared-files.json 所定義的共用檔案清單（critical / shared_modules / ai_ready_auto 三組共 18 個檔案）。

### 補充說明

- 近 3 天觸及的檔案總數：155 個，主要集中在治理文件（docs/governance/、handoffs/、worklogs/）、Wiki sources（src/content/wiki/sources/）、Astro 頁面與腳本。
- 唯一進到 `src/components/` 的新檔案是 `src/components/GlobeHeroBg.astro`（新增的地球動畫共用組件），不在共用清單監控範圍。
- 唯一進到 `src/pages/` 共用區的修改是四語系首頁的 Globe hero 整合（commit `e303a86`），只動 `src/pages/{index,en,ja,zh-cn}/index.astro`，未觸及 BaseLayout / NavBar / SiteHead / SiteFooter / I18nClient。
- Worker 端近 3 天完全無修改（`worker/src/` 下 0 個檔案變動）。
- `public/` 下四個 AI Ready 自動檔案（llms.txt / mcp.json / agent-card.json / robots.txt）近 3 天也沒有 commit 動到。

## 無異常
