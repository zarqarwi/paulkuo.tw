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

## 待 Cowork 執行

- [ ] 🟡 H3：auto-memory 跨視窗不對稱寫入 working-environment.md §1.2 → Cowork 司法 (2026-04-20)
  - 問題：Cowork 能寫 `.auto-memory/`，但 Chat 視窗不掛載這個路徑，R1 護欄在 Chat 穿透率 = 0
  - 動作：在 working-environment.md §1.2「跨視窗能力矩陣」明示「auto-memory 只對 Cowork 生效，Chat 不讀」
  - 歸屬：Cowork 司法，工程上無法單邊解決（Chat 不支援 Cowork sandbox 路徑）

- [ ] 🟡 H4：Cowork 新 session 剛性核查補強 → Cowork 司法 (2026-04-20)
  - 問題：Cowork 新 session 答 v4.13，讀 sandbox C 層 mirror 就信，沒觸發憲法第三條剛性核查去 A 層驗
  - 動作：session-handoff SKILL.md「Cowork 驗證盲區」新增一條——版本號/行數/清單項數類問題即使從 sandbox 讀到答案，仍須跑 A 層 git HEAD 核查
  - 歸屬：Cowork 司法（v5.6 已部分處理 R1 觸發句型擴充，但 H4 需要在開場 checklist 也加強制步驟）

## 待 Chat 立法

- [ ] 🔴 H1：憲法第二條 C 層同步機制缺失 → Chat 立法 (2026-04-20)
  - 問題：C 層（Claude.ai Personal Skill）從 2026-04-17 冷凍在 v4.13，repo 已到 v5.5/v5.6。憲法第二條「C 層永遠是下游 mirror」無配套同步機制
  - 建議產出：新 ADR「A→C Personal Skill 同步協議」——誰按 commit / 同步頻率 / 驗證方式 / C2 雲端記憶不可控時的治理原則
  - Cowork 不處理原因：觸及憲法層級立法，Chat 主責

- [ ] 🔴 H2：Chat 視窗精確事實查詢結構性上限 → Chat 立法 (2026-04-20)
  - 問題：Chat 三模型（Opus 4.7 / Sonnet 4.6 / Opus 4.6）同答 v4.7，比 C 層更舊。版本號/行數/commit hash/清單項數/時序狀態類精確事實在 Chat 系統性不可靠
  - 建議產出：憲法實施細則新增——Chat 不回答此類精確事實問題，應引導用 Cowork 查 A 層或 Code Read 核查
  - Cowork 不處理原因：觸及憲法層級立法，Chat 主責

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

## Scanner 自動產出（最新在上）

