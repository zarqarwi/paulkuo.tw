# session-handoff skill — Changelog

> 本檔記錄 session-handoff skill 的版本歷史。當前規則見 `SKILL.md`。
> 新增條目依時序倒序排列（最新在上）。

---

## v5.2（2026-04-19）

**主題**：Handoff 偵察路徑必須考慮接手方 MCP 能力。

- **Step 0 偵察項目擴充**：八區塊第 3 項「Step 0 偵察」明列 MCP 工具為合法偵察路徑（原本只寫 grep/PRAGMA），並要求產出方優先選接手方最低 token 路徑。

**觸發事故**：2026-04-19 workspace 警訊處理事件。Chat 寫 handoff 時套用 grep/curl + Apple Notes + worklogs 三路偵察，但 Cowork 手上有 `scheduled-tasks` MCP 可一 call 命中答案（兩個閒置 session 其實是 scheduled tasks），導致 ~10× token 無效支出。診斷見 `worklogs/cowork--workspace-cleanup-diagnostic-2026-04-19.md`，工作流優化 handoff 見 `worklogs/chat--cowork-warning-workflow-optimization-2026-04-19.md`。對齊 v4.11 設計原則動機 3（Token 無效支出）。

**Metrics**：未來 3 個月內跨 session handoff 未再出現「偵察路徑繞過接手方 MCP」即為有效。

---

## v5.1（2026-04-18）

**主題**：將已發生但未資產化的治理產物，收進正確位置。

- **B（護欄編號系統首建）**：11 條鐵律首次建立編號系統，新增 2 條（C4 陰性結果結論節制、C5 SSoT 變更後下游重驗）= 13 條（A2 / B4 / C5 / D2 精確分組）。命名規則寫進 SKILL.md 「鐵律」節末。
- **D（跨 Cowork 撞車 retro 歸檔）**：2026-04-17 兩個 Cowork 視窗撞車事件歸檔至 `worklogs/investigations/2026-04-18-cross-cowork-session-collision.md`。直接對策延 v5.2 觀察。
- **E（changelog 抽離）**：SKILL.md 頂部 10 段版本歷史抽離成獨立 `CHANGELOG.md`，規範與歷史分離。

**治理 meta**：首次落地 working-environment.md §2.6「源頭事實清單規範」。規劃 rev1 前由 Code 驗證源頭事實（commit 734c476），避免 v5.0「1086 行幻值」事故重演。rev3 §7 的「17 條編號系統」被驗證為空中樓閣（rev3 引用 #1-#15 從未在 SKILL.md 存在），rev2 依實際 11 條源檔重建為 13 條。

---

## v5.0（2026-04-18）

**主題**：治理複雜度上界建立 + route C''（不拆只整理）。

- 新增 §0 治理複雜度上界：SKILL.md ≤ 900 行硬界 / 800 觸發拆分評估 / 200 預警。
- 補 3 個 skill frontmatter（cross-project-impact / formosa-feedback-triage / wiki-ingest），skill-schema-lint Exit Gate 5/5 PASS。
- 決策 route C''（不拆只整理），推翻 rev3 拆三份決策。觸發因素：Cowork 動工前核對發現 SKILL.md 實際 522 行（非 rev3 假設的 1086 行），拆分前提不成立。
- 衍生產出：`docs/governance/working-environment.md`（三視窗職責邊界、源頭事實清單規範、Handoff ADR 欄位升級）。
- Retro：`docs/governance/retrospective-2026-04-18-v5-split-reversal.md`。

---

## v4.8（2026-04-1x）

移除所有 Apple Notes 引用。儀表板一律使用 GitHub Issue（#155 或各專案指定）。原因：Apple Notes 9,000+ 筆導致 MCP 嚴重卡頓，且 token 浪費嚴重，已完全棄用。各 session 絕對不要嘗試用 Apple Notes MCP 讀寫任何專案狀態。

---

## v4.7（2026-04-1x）

Worklog 格式升級為三維度必填（做了什麼 / 決策紀錄 / 阻礙與踩坑）。與 CLAUDE.md 同步。原「技術備忘」區塊拆分為「決策紀錄」和「阻礙與踩坑」兩個獨立區塊。

---

## v4.6（2026-04-10）

Handoff 文件必備區塊新增「Integration Checklist」（第 8 項）。解決 Code 未對齊 codebase 現有 pattern 導致 API_BASE 錯誤、CORS 遺漏的問題（4/09 事故）。

---

## v4.5（2026-04-09）

新增 metrics 收集步驟 + 專案治理框架（governance）。

---

## v4.4（2026-04-09）

- Issue #155 自動同步：編輯 `worklogs/issue-155-body.md` → push → `sync-dashboard` Action 自動 PATCH Issue body。
- `worklogs/PENDING.md` 新增「跨專案備忘」section，所有 Cowork 專案開場掃這個。
- Handoff 文件必須標注**建議模型**（Opus/Sonnet/Haiku），這是跨所有專案的硬規則。
- Cowork session 一律 Opus 4.6；Code session 依 handoff 標注選模型。
- GitHub MCP `get_issue` / `update_issue` 有 issue_number 型別 bug，讀 Issue 用 `search_issues`，寫 Issue 用 sync-dashboard Action。

---

## v4.3（2026-04-09）

儀表板從 Apple Notes 遷移至 GitHub Issue #155（永久）。Apple Notes 9,000+ 筆導致 MCP 嚴重卡頓（list_notes 60s timeout、get_note_content 不穩定）。GitHub Issue 透過 GitHub MCP 讀寫秒回，且原生支援 Markdown checkbox。

---

## v4.2（2026-04-06）

新增 Cowork 鐵律 #10「Sandbox ≠ Repo」+ 開場 Step 0 偵察。源自 Wiki Phase 4 事故：Cowork sandbox 掛載的 concepts/ 只有 10 個，實際 repo 有 17 個，導致整份 Cross-Pillar 分析基於錯誤資料，建了 3 個跟 repo 已有概念重疊的頁面。

> v5.1 註：該條於 v5.1-B 重編為 **B3**。

---

## v4.1（2026-04-05）

Cowork 開場 Checklist 新增「步驟 3.5 抽查 remote」。源自 RFC #100 事故：worklog 聲稱完成但程式碼從未 push 到 main。

---

## v4（2026-04-04）

新增 Reconcile 步驟、Worklog「狀態變更」區塊、記憶寫法慣例。源自三項待辦全標未完成但實際已結案的事故（Feedback #5 / mazu.today 根目錄 / Worker 名稱）。

---

## v3（2026-04-04）

Cowork 工作邊界、狀態驗證規則、context 衰減管理。源自碳排係數重複列辦事故 + 幻值事件 + RFC #100 誤判事件。

---

**歷史結束。更早版本（v2 及以前）已併入 v3 基線，不單獨列示。**
