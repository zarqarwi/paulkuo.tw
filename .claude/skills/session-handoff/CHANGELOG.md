# session-handoff skill — Changelog

> 本檔記錄 session-handoff skill 的版本歷史。當前規則見 `SKILL.md`。
> 新增條目依時序倒序排列（最新在上）。

---

## v5.6（2026-04-20）

**主題**：R1 剛性核查觸發句型擴充——從「ADR 清單類」擴展到「版本號 / 清單 / 時序狀態」全類精確事實。

- **SKILL.md「引用 ADR 清單時的剛性核查」章節更名**為「引用版本號 / 清單 / 時序狀態時的剛性核查」，觸發句型新增「類別 B — 精確事實類」（版本號、行數、最後更新日期、數量統計等），強制動作新增類別 B 流程（Read 目標檔 → git log 核查 → sandbox vs A 層不一致時以 A 層為準）。
- **歷史 N 計數新增「跨載體精確事實分裂」新類別**（N=1）：2026-04-20 實戰驗收，同一問題「session-handoff 第幾版」跨 8 查詢點得 5 答案，Code 唯一正確（v5.5），Chat×3 答 v4.7（雲端記憶殘影），Cowork 答 v4.13（sandbox C 層 mirror）。主線 ADR 清單類 N=3 維持不變。
- **Cowork 驗證盲區條目更新**：「ADR 指名 N 個項目」擴充為「版本號 / 清單項數 / 時序狀態類精確事實」。
- **配套議題 H1~H5**：H1（C 層同步機制）、H2（Chat 精確事實能力上限）歸 Chat 立法；H3（auto-memory 跨視窗不對稱）、H4（Cowork 剛性核查補強）歸 Cowork 司法；均已寫入 PENDING.md。

**觸發事件**：Paul 於 2026-04-20 夜間在 Chat / Cowork / Code 各開新 session 問「session-handoff 第幾版」，收集 8 個查詢點的回答。結果：唯一答對的只有 Code（主動 Read A/B 層），Chat×3 答 v4.7（雲端記憶殘影，比 C 層 v4.13 更舊），Cowork 新 session 答 v4.13（讀 sandbox mirror 就收工，未觸發剛性核查）。「治理工程寫進文件不等於治理生效」——同一問題跨六查詢點得出五答案就是鐵證。

**對齊憲法**：第一條（SSoT）——A 層 git HEAD 是事實來源，sandbox / 雲端記憶 / C 層 Personal Skill 都是下游快取；第三條（權責分工，剛性核查）——即使 sandbox 看到答案也要核查 A 層。

**Metrics**：未來 2 個月內若再出現「版本號 / 行數 / 時序狀態」類精確事實問題被 Cowork 或 Chat 憑快取回答（未核查 A 層），跨載體新類別 N 升至 N=2，觸發 SKILL.md 開場 checklist 新增版本號自動核查步驟。

---

## v5.5（2026-04-20）

**主題**：「ADR 指名 N 個項目」類話術剛性核查——空中樓閣第 3 類實例升格為正式護欄。

- **SKILL.md 新增「引用 ADR 清單時的剛性核查」章節**（插入於「Cowork 驗證的已知盲區」之後）：定義觸發句型（話術含「ADR 指名 N 個 X」「某條款列出 Y 項」「規範中的 Z 個步驟」等）、強制流程（grep 原文 clause → 貼清單 → 比對 repo 現況 → 建議中必附 clause 編號 + 逐字引用 + 比對結果）、空中樓閣三次歷史實例（N=1 / N=2 / N=3）。
- **Cowork 驗證盲區補一條**：「ADR 指名 N 個項目」類話術憑印象推測列為已知盲區第 N 項，交叉連結至下方剛性核查章節。
- **配套產物**：`docs/governance/constitution-v0.2-quick-reference.md` rev1 新增情境 7（跨視窗速記版）+ 違憲自檢清單第 6 項；auto-memory `feedback_adr_clause_before_listing.md` 同步建立。

**觸發事件**：2026-04-20 Cowork 治理盤點階段——處理「v0.3 ADR Track 2 A 層缺 4 個 skill」時，憑印象推測那 4 個是 Anthropic 使用者級 skill 常見的 `consolidate-memory / setup-cowork / schedule / skill-creator`，直接給 Paul cp 建議。實際上 ADR §2.2.1 明確指名的是 `paulkuo-writing / paulkuo-social / formosa-feedback / organize-downloads`（專案級 skill），且上輪 commit `eb91a9e` 已全部完成。Paul 拍板後觸發 sandbox 權限錯誤才被迫重查 ADR，已部分 cp 出的空目錄由 Paul 手動清理收場。此為空中樓閣第 3 次實例，N=3 達到升格正式護欄門檻（規則：N=4 升格為 E2，本次提前一次於治理盤點階段發生，由 Paul 裁定直接升格）。

**對齊憲法**：第一條（SSoT）——ADR 原文是事實來源，記憶中「以為的清單」不是；第三條（權責分工，剛性核查）——行政對自己的前提事實也要先核查，不能拿推測當事實。

**Metrics**：未來 3 個月內若再出現「ADR 指名 N 個項目」類憑印象推測的執行建議，視為本次護欄無效，升格為 commit-msg hook / skill-schema-lint 自動偵測層；反之若零發生，視為護欄已內化。

---

## v5.4（2026-04-20）

**主題**：新增「結案宣告 Close Protocol」——session 三層生命週期狀態管理。

- **SKILL.md 新增「結案宣告 Close Protocol」章節**（插入於「Worklog 格式 → 狀態變更範例」之後、「記憶寫法慣例」之前）：定義 Active 🟢 / Dormant 🟡 / Archived 🔴 三層狀態、結案時必答的三個問題、Cowork 交付訊息必備的 `🏁 Session 狀態` 欄位。
- **Cowork 開場 Checklist 第 5 步補一條**：開場時主動檢查前一 session 是否有結案宣告，缺失則問 Paul 補上。
- **skill 歸屬層級議題未處理**：「session-handoff 是 repo 專屬還是使用者級 skill」這個架構問題本次未動，另開 ADR 草稿（v0.4 候選議題）處理。

**觸發事件**：2026-04-20 Cowork workspace 磁碟警訊事件——9.7 GB 配額剩 381 MB free，三個 178 MB inactive session 卡在「事情做完但沒宣告結案」的半開狀態。Paul 決策繼續深化治理工程，因此配套引入 session 衛生機制，避免 session 數量增長吃掉磁碟。

**對齊憲法**：第三條（權責分工）——session 生命週期由產出方主動宣告，不是等 Cowork 開場盤點時被動判斷。

**Metrics**：未來 4 週內新產出的 worklog 若有 70% 以上包含 `🏁 Session 狀態` 行、且 Cowork workspace 磁碟警訊不再觸發，即視為有效。

---

## v5.3（2026-04-19）

**主題**：C4 邊界固化（來源 vs 方式），收斂「空中樓閣第 3 次」類事故的誤判區間。

- **SKILL.md 新增「C4 邊界」子節**（約 L82-L92）：明列「來源 = 系統/工具層級」「方式 = 同系統不同查詢策略」，並以 🟢 / 🟡 / 🔴 三段及格線替歧義收尾。
- **典型 🔴 案例固化**：Cowork 只從 sandbox snapshot 查 `~/.claude/skills/`，單一來源 + 單一方式 + 絕對結論 → 明確違反，寫入 SKILL.md 備日後 retro 比對。
- **alignment 階段歧義 1**（Code handoff §4.4「來源 vs 方式」）由 Paul 2026-04-19 裁決：換 keyword 同系統 = 🟡 上限、不算免責；同系統再多查詢策略也不能取代跨來源驗證。

**觸發事故**：2026-04-19「空中樓閣第 3 次」——Cowork 僅憑 sandbox snapshot 下「v5.1 護欄不存在」陰性結論，Paul 要求走方案 B 偵察後反轉。Retro 由 Code 產出 `worklogs/code--v5-1-guardrail-retro-report-2026-04-19.md`（🔴 0 / 🟡 4，皆低嚴重度），Cowork 審核確認分流後固化。

**Metrics**：下次若 Cowork 再次 debate「X 是否存在」，偵察記錄須至少兩段（來源 1 + 來源 2），未達者於 retro 中記為 🔴。

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
