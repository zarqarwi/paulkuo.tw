# 跨專案影響掃描 — 2026-04-24

> 掃描窗口：2026-04-23T02:36:50Z → 2026-04-24T02:36:50Z
> 監測 repos：zarqarwi/paulkuo.tw、zarqarwi/get-biji-notes
> 共用檔案清單來源：`docs/shared-files.json` + `docs/shared-file-impact-map.md`

## 活動摘要

| Repo | 24h commits | 備註 |
|------|-------------|------|
| zarqarwi/paulkuo.tw | 126 | 主要為 article AI 味修正（88 人類 commits）+ wiki-daily pipeline（21 bot-flow）+ i18n auto-translate（16）+ ai-ready baseline（1） |
| zarqarwi/get-biji-notes | 0 | 窗口內無活動（最後 commit 2026-04-22T15:55Z）|
| zarqarwi/formosa-esg-2026 | N/A | 不存在獨立 repo — 為 paulkuo.tw 子目錄 |

## 共用檔案命中分析

### ⚠️ 掃描侷限

公開 GitHub API（unauth）rate limit 僅 60/hr，逐 commit 拉 `files[]` 的完整比對在掃描約 43 個 commit 後耗盡 quota。剩餘 83 個 commits 採 **commit message 模式判斷**。

### Message pattern 分類（126 commits）

| Pattern | 數量 | 預期影響範圍 |
|---------|------|-------------|
| `fix(article): 去除 AI 味 [slug]` | ~80 | 單篇 `src/content/articles/*.md`（子專案：paulkuo-main） |
| `[wiki-daily] clips: 新增` | 14 | `raw/clips/*`（子專案：llm-wiki）|
| `[wiki-daily] handoff/report/scanner` | 4 | `worklogs/`（子專案：llm-wiki） |
| `github-actions[bot] Auto-translate` | 16 | article i18n 檔（子專案：paulkuo-main，不涉及 I18nClient.astro）|
| `fix(wiki) / feat(wiki) / chore(wiki)` | 4 | wiki 專屬模組 |
| `chore(acp) / docs(acp) / ACP iteration` | 3 | ACP 專屬模組 |
| `chore(dashboard)` | 2 | 儀表板 Issue 同步 |
| `[governance] metrics/impact` | 2 | 僅寫 `data/` 與 `worklogs/` |
| `auto(scanner) / external eval baseline` | 2 | bot-flow，不動共用檔案 |
| `chore: 清理 repo 根目錄雜檔` | 1 | **嫌疑**：可能動共用檔案，需 spot-check |
| `chore(i18n): localize en article tags` | 1 | article frontmatter，不涉及 I18nClient.astro |

### 共用檔案命中結論

**基於 commit message 模式判斷：24h 內無明確命中 critical 共用檔案**。

唯一嫌疑 commit：
- `e8e6651` — `chore: 清理 repo 根目錄雜檔`：根目錄清理，理論上不應觸及 `worker/src/`、`src/layouts/`、`src/components/`，但需下次 rate limit 恢復後 spot-check 確認。

## 警示

### ⚠️ 工具/流程層面（非 commit 警示）

- **[API 額度]** 公開 API rate limit 60/hr 對 126 commits 的完整 diff 掃描不夠用。建議：
  - 使用 GH Token 認證（5000/hr）
  - 或改用 GitHub MCP 的 commit-files endpoint（如果將來新增）
  - 或改為 **增量掃描**（只掃帶 `[affects:` 標注缺失的嫌疑 commits）
- **[清單不符]** `governance-projects.json` 列出的 `zarqarwi/formosa-esg-2026` 為獨立 repo，實際上為 paulkuo.tw 子目錄。建議下一次 Code session 修正清單。
- **[affects 標注採用率]** 目前規模：所有 126 個 commits 無一使用 `[affects: X]` 標注格式。由於主要工作（article 修正、wiki-daily）單純，影響範圍可由 message 前綴推斷；但若未來改動共用模組，此格式應強制推行。

### ✅ 無 commit 層級警示

本次窗口內未發現命中 critical 共用檔案的 commit。

## 下次 scheduled run 建議

1. 考慮加入 GH Token 以解除 rate limit 壓力
2. 修正 projects.json 的 formosa-esg-2026 條目（或保留但標注為「sub-path in paulkuo.tw」）
3. 若 article fix 持續大量產生，建議從 governance 掃描中 exclude `fix(article):` 模式以節省 API quota
