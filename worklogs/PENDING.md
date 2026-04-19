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

- [x] 🟢 跑 `node scripts/governance-kv-seed.cjs` 補 Dashboard 數字 → ✅ 已完成 (2026-04-18)
  - 完整 handoff：`handoffs/cowork--governance-kv-reseed-2026-04-18.md`
  - seed 結果：Projects: 6, Automation coverage: 70%
  - KV 數字：paulkuo-main 461 / formosa-esg 78 / llm-wiki 53 / acp 3 / ai-ready 14 / agora 1
  - 次要 follow-up：classifier 對 `.github/workflows/` 路徑分類待整理（paulkuo-main 461 vs 549、acp/ai-ready 數字偏移）

- [x] 🟢 Commit design system 文件 + worklog 變更 → ✅ 已完成 (8363e60, 2026-04-14 18:11)

- [x] 🟢 分批 commit 累積變更（~100 檔案）→ ✅ 已完成 5 批 commits (453b20a→abb6390, 2026-04-14 18:20)

- [x] 🟢 Commit `scripts/mcp-register-global.sh` → ✅ 已完成 (b823890, 2026-04-14)
  - 完整 handoff：`handoffs/code--commit-mcp-register-script-2026-04-14.md`
  - 單一 commit，含 handoff 本身；不 push

- [x] 🟡 Commit + push + deploy `src/pages/governance/index.astro` quick fix → ✅ 已完成 (aa225cd, 2026-04-14)

- [x] 🟢 Governance Dashboard Phase A — ✅ 已完成 (6246e03, 2026-04-15)
  - commit + push + deploy 完成；build 534 pages pass；smoke test 200 OK
  - Task size：S (< 30 min，純 review + commit + deploy)，信心等級：高
  - Smoke test 必用**無痕視窗**（sessionStorage 干擾）
  - 視覺參考：Stitch projects/3520595413095137436 v1 screen 594fcba83743439d958f1dcd3b4bab60
  - Phase B (Worker API 擴充 weekly/delta/last_deploy 欄位) + Phase C (稽核 actionable table) 另案

- [x] 🔴 Scanner 自動化 workflow 建置 → ✅ 已完成（cd9ebd9, auto scanner daily 2026-04-16 正常運行中）

- [x] 🟡 Harness Engineering 文件庫上架 → ✅ 已完成 (70ad07a, 2026-04-14)
  - 完整 handoff：`worklogs/code--harness-docs-upload-2026-04-14.md`
  - 兩份 HTML 已在 `public/governance/` 就位；只需改 `src/pages/governance/index.astro` 加文件庫區塊
  - ⚠️ 關鍵：文件庫**必須放在 token gate 外部**（governance 是 token-protected dashboard，放錯地方訪客就看不到）
  - Push 前告知 Paul

- [x] 🟡 治理框架 Phase 3：Dashboard 整合 scanner 稽核結果 → ✅ 已完成 (851dd58)
  - 6 步全 pass，automation coverage 66.7% → 70%
  - ⚠️ 待 Paul 手動部署：`npm run build && wrangler deploy && cd worker && wrangler deploy --config wrangler.toml`

- [x] 治理框架 Phase 2：API + KV seed + Dashboard 頁面 → ✅ 已完成 (ceb67d2, e2fcd8f, b09d00c)
  - ✅ 2026-04-11 17:07 Paul 已部署前端 + Worker + 設定 GOVERNANCE_TOKEN secret

- [x] 🔴 修 governance-kv-seed.cjs `--remote` 參數 → ✅ 已完成 (be42206)

## 待 Cowork 執行

- ~~用 Stitch「Homepage Redesign」比對 paulkuo.tw 線上首頁~~ → **已擱置** (2026-04-14 17:20)
  - Paul 決定過去測試的 Stitch 專案不再延續，Stitch 轉為「產新稿」而非「比對舊稿」
  - 取而代之的是 `docs/design-system.md`（單一事實來源）+ 未來 Stitch Web UI 手動貼 designMd 流程

## 跨專案備忘

> 這個 section 給所有 Cowork 專案共用。
> 不管綁哪個資料夾，開場都應該透過 GitHub MCP 的 `get_file_contents` 讀這個檔案。

- 2026-04-09：Issue #155 新增自動同步機制（sync-dashboard Action），以後更新儀表板改 `worklogs/issue-155-body.md` 即可，push 到 main 會自動 PATCH
- 2026-04-09：Cowork session 一律 Opus 4.6；所有 handoff 必須標注建議模型（跨所有專案）
- 2026-04-09：GitHub MCP 的 `get_issue`/`update_issue` 有 issue_number 型別 bug，暫時不可用。讀 Issue 用 `search_issues`，寫 Issue 用 sync-dashboard Action
- 2026-04-10：專案治理框架 Phase 1+2 完成。Dashboard 在 /governance/（非 /dashboard/，因路由衝突）。API 4 支 endpoint：/api/governance/{summary,projects,metrics/:id,automation}。Auth 用 GOVERNANCE_TOKEN Bearer token
- 2026-04-11：Phase 2 已部署上線。Phase 3 程式碼完成（851dd58），待 Paul 部署。新增 `/api/governance/audit` endpoint + Dashboard 稽核面板

---

## 格式說明

```
待 Code / Cowork 執行：
- [ ] {做什麼} → {給誰} / {建議模型} ({日期})

跨專案備忘：
- {日期}：{決策或狀態變更}
```

---

- [ ] 🔴 Formosa Post-Event Issues 批次修復 → Code / Opus 4.6 (2026-04-16)
  - 完整 handoff：`worklogs/code--formosa-post-event-batch-2026-04-16.md`
  - Batch 1: #175 auto-close.yml injection (P2, 30min)
  - Batch 2: #177 GPS 彰化以南 + #178 LIFF 常駐 (P1, 90min)
  - Batch 3: #173 Dashboard 定位 + #174 AuthGate + #179 拍照 (P1+P2, 90min)
  - ⚠️ 前提：Formosa 活動已結束或 Paul 確認可 deploy
  - Task Size：L（3-4 hr，分三批獨立 commit + deploy + 驗證）

- [ ] 🟡 YouTube transcript Whisper backfill（19/23 影片）→ Code / Opus 4.6 (2026-04-16)
  - 前提：Paul 提供 `GROQ_API_KEY` 到本機環境（`export GROQ_API_KEY=xxx`）
  - 執行：`node scripts/wiki-youtube-ingest.cjs --backfill`
  - 預估 19 個影片 × Whisper STT，成本約 $0.5-1 USD
  - 1 個影片 (Po6xqJsCook) 已設為 private，無法處理
  - 完成後跑 `node scripts/wiki-kv-seed.cjs` 更新 KV
  - branch: `fix/youtube-transcript-pipeline`，待 merge 到 main

- [ ] 🟡 YouTube transcript Worker deploy → Code (transcript 修復完成後)
  - Worker 的 Innertube 多 client 嘗試改完但 YouTube 全封，實際效果有限
  - 等本機 backfill 跑完確認穩定後再 deploy Worker
  - `cd worker && wrangler deploy --config wrangler.toml`

- [ ] 🟢 `scripts/wiki-youtube-ingest.cjs` 加中間檔清理邏輯 → Code / Sonnet 4.6 (2026-04-19)
  - Whisper transcribe 完成後 `fs.rmSync(tmpDir, { recursive: true, force: true })`，再 commit markdown
  - 目標：Cowork workspace 警訊時間間隔延長 3×（目前 wiki-youtube-pull 產出占 workspace 大宗）
  - **前提**：當前轉檔批次跑完再動（Paul 2026-04-19 明示不要打斷進行中的轉檔）
  - 來源：2026-04-19 workspace 警訊 L3 裁決 / `worklogs/cowork--workspace-cleanup-diagnostic-2026-04-19.md` 建議 A

## Scanner 自動產出（最新在上）

- [x] 🟡 跨專案 smoke test 缺漏：cd2422a, e2fcd8f, 7d7e85d, c0b86b7, 8be165c → ✅ 2026-04-16 Cowork 補驗全部 200 OK（主站/Wiki/Formosa/ACP/TQEF）
- [x] 🟡 跨專案影響待驗：73e3546 → ✅ 2026-04-16 Cowork 補驗，全部子專案 API 正常，近 3 天 scanner 無異常
- [x] 🟡 跨專案 smoke test 缺漏：851dd58 governance Phase 3 → ✅ 已部署，Dashboard 200 OK，scanner daily audit 正常運行
- [ ] 🟡 跨專案 smoke test 缺漏：5c58ee02（paulkuo-main, llm-wiki） → Code (auto-scanner 2026-04-17)
- [ ] 🟡 跨專案 smoke test 缺漏：5c58ee02（paulkuo-main, llm-wiki） → Code (auto-scanner 2026-04-18)
- [ ] 🟡 跨專案 smoke test 缺漏：5c58ee02（paulkuo-main, llm-wiki） → Code (auto-scanner 2026-04-19)
