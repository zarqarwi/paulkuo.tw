# worklogs/PENDING.md — 跨 Session 待辦佇列

> 這個檔案是 Code ↔ Cowork 的直接溝通管道。
> Paul 不需要手動傳遞——兩個 session 開場時都應該先掃這個檔案。

## 使用規則

- **Code 寫**：需要 Cowork 接手的事項（狀態同步、文件產出、Issue 更新）
- **Cowork 寫**：需要 Code 執行的事項（deploy、DB migration、腳本跑測試）
- 完成後把該項目刪掉或標記 `[x]`，保持這個檔案乾淨
- 每項格式：`- [ ] {做什麼} → {給誰} ({日期})`

---

## 待 Code 執行

- [x] 治理框架 Phase 2：API + KV seed + Dashboard 頁面 → ✅ 已完成 (ceb67d2, e2fcd8f, b09d00c)
  - Dashboard 路徑：/governance/（原 /dashboard/ 有路由衝突）
  - ⚠️ 待 Paul 手動：wrangler deploy + 設定 GOVERNANCE_TOKEN secret

- [x] 🔴 修 governance-kv-seed.cjs `--remote` 參數 → ✅ 已完成 (be42206)

## 待 Cowork 執行

_（目前無待辦）_

## 跨專案備忘

> 這個 section 給所有 Cowork 專案共用。
> 不管綁哪個資料夾，開場都應該透過 GitHub MCP 的 `get_file_contents` 讀這個檔案。

- 2026-04-09：Issue #155 新增自動同步機制（sync-dashboard Action），以後更新儀表板改 `worklogs/issue-155-body.md` 即可，push 到 main 會自動 PATCH
- 2026-04-09：Cowork session 一律 Opus 4.6；所有 handoff 必須標注建議模型（跨所有專案）
- 2026-04-09：GitHub MCP 的 `get_issue`/`update_issue` 有 issue_number 型別 bug，暫時不可用。讀 Issue 用 `search_issues`，寫 Issue 用 sync-dashboard Action
- 2026-04-10：專案治理框架 Phase 1+2 完成。Dashboard 在 /governance/（非 /dashboard/，因路由衝突）。API 4 支 endpoint：/api/governance/{summary,projects,metrics/:id,automation}。Auth 用 GOVERNANCE_TOKEN Bearer token

---

## 格式說明

```
待 Code / Cowork 執行：
- [ ] {做什麼} → {給誰} / {建議模型} ({日期})

跨專案備忘：
- {日期}：{決策或狀態變更}
```
