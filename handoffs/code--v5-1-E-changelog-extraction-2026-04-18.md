---
target: code
project: session-handoff skill v5.1 — E 抽 changelog 成獨立 CHANGELOG.md
purpose: 將 SKILL.md 頂部 10 段 changelog 註記（v3 → v4.8）抽離，新增 CHANGELOG.md 收納，SKILL.md 改為一行指引
date: 2026-04-18
author: Cowork（本視窗）
upstream:
  - handoffs/cowork--session-handoff-v5-1-planning-rev2-2026-04-18.md（rev2 §3.3 本任務來源）
  - handoffs/code--v5-1-B-guardrail-numbering-2026-04-18.md（前置任務，Exit Gate PASS，commit 8b75f2e）
blocks: v5.1 結案（E 完成後才由 Cowork 更新 Issue #155 + 寫 retrospective）
confidence: 高（純文件搬家，無判斷、無技術風險）
estimated_effort: 15-20 分鐘（含 skill-schema-lint 驗證）
model_suggestion: Sonnet 4.6 + Low（純文件搬家）
status: Proposed
consequences: |
  本任務將 SKILL.md changelog 歷史抽離到獨立檔案。Cowork 在 §3 提供 CHANGELOG.md 完整內容草稿
  與 SKILL.md 替換區塊。Code 的工作是逐字套用 + skill-schema-lint PASS + commit + push。
  若發現 SKILL.md 頂部 changelog 範圍已被其他 commit 改動（與本 handoff §2.1 行號不符），
  停下回報 Cowork，不要自行猜。
notes_on_rev2_drift:
  - rev2 §3.3 原提「38 行 changelog」「七段」，實際為第 13-47 行共 10 段（v4.8 / v4.7 / v4.6 / v4.5 / v4.4 / v4.3 / v4.2 / v4.1 / v4 / v3）。
  - 本 handoff 以 SKILL.md 現況（B 完成後：commit 8b75f2e）為 ground truth，CHANGELOG.md 草稿已依實際 10 段 + v5.0 + v5.1 編排。
  - 無影響 scope 或 Exit Gate，僅修正 rev2 的估算偏差，符合 working-environment.md §2.6 源頭事實規範。
---

# Code Handoff：v5.1-E 抽 changelog 成獨立 CHANGELOG.md

## 0. 任務來源

v5.1 規劃 rev2 §3.3 第三項 scope，v5.1 最後一項。前置 B 已完成（commit 8b75f2e，skill-schema-lint PASS）。

**理由採「治理一致性」**（rev2 Q-V51-5 拍板）：
- 不是為了省 token（skill loader 載入整份）
- 不是為了縮行數（6.9% 無感）
- **是**為了讓 skill 本體只講「當前規則」，歷史歸檔到專屬位置
- **是**收尾 rev3 §7「附錄 A 抽離 v3-v4.x changelog」的遺留項

---

## 1. 工作目錄

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw
```

---

## 2. 任務清單

### 2.1 改寫 SKILL.md 第 13-47 行

**目標檔案**：`.claude/skills/session-handoff/SKILL.md`

**動作**：刪除第 13-47 行 10 段 changelog 註記，替換為一行指引。

**關鍵邊界**（B 完成後的現況，commit 8b75f2e）：
- 替換起點：第 13 行 `> **v4.8 變更**：移除所有 Apple Notes 引用...`
- 替換終點：第 47 行 `> 源自碳排係數重複列辦事故 + 幻值事件 + RFC #100 誤判事件。`
- **保留第 1-12 行**（frontmatter + `# 多 Session 協作狀態管理 SOP v4.8` heading + 開頭三行說明 + 空行）
- **保留第 49 行** `---` 分隔符
- **不動第 50 行以下**

**替換後的第 13 行（單行）**：

```markdown
> **版本歷史**：完整版本歷史（v3 → v5.1）見 [CHANGELOG.md](./CHANGELOG.md)。
```

### 2.2 新增 CHANGELOG.md

**目標路徑**：`.claude/skills/session-handoff/CHANGELOG.md`

**內容**：直接複製本 handoff §3 的完整內容（從 `# session-handoff skill — Changelog` 標題開始到結尾），逐字寫入。

### 2.3 skill-schema-lint 驗證

改完後跑（同 B 任務的路徑）：

```bash
SKILLS_DIR=.claude/skills bash scripts/skill-schema-lint.sh 2>&1 | tee /tmp/v51-e-lint.log
```

預期：`5 files scanned, 5 pass, 0 warn, 0 fail`。

**若 lint 報錯**：停下回報 Cowork，不要自行調整內容解決 lint 錯誤。

### 2.4 追加 worklog

在 `worklogs/worklog-2026-04-18.md` 的「完成日誌（最新在上）」區塊頂部追加：

```markdown
- {HH:MM} v5.1-E 抽 changelog 成獨立 CHANGELOG.md（10 段歷史 + v5.0 + v5.1）({commit hash}) Code
```

### 2.5 Commit + push

```bash
git add .claude/skills/session-handoff/SKILL.md .claude/skills/session-handoff/CHANGELOG.md worklogs/worklog-2026-04-18.md
git commit -m "chore(skills): v5.1-E extract changelog to CHANGELOG.md [影響: session-handoff skill only]"
git push origin main
```

---

## 3. CHANGELOG.md 完整內容（Code 逐字複製）

以下為 `.claude/skills/session-handoff/CHANGELOG.md` 的完整內容。從下一行的 `# session-handoff skill — Changelog` 開始到本節結尾 `---` 分隔符之前，全部逐字貼入檔案。

---

# session-handoff skill — Changelog

> 本檔記錄 session-handoff skill 的版本歷史。當前規則見 `SKILL.md`。
> 新增條目依時序倒序排列（最新在上）。

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

---

## 4. Integration Checklist

- [x] 工作目錄：`~/Desktop/01_專案進行中/paulkuo.tw`
- [x] 無 API 呼叫、無 CORS 影響、無 deploy
- [x] 無 wrangler.toml / wrangler.jsonc 影響
- [x] 跨子專案影響：僅 session-handoff skill（commit message 已標注）
- [x] 檔案新增：`.claude/skills/session-handoff/CHANGELOG.md`
- [x] 檔案修改：`.claude/skills/session-handoff/SKILL.md`（第 13-47 行替換為一行指引）
- [x] 檔案修改：`worklogs/worklog-2026-04-18.md`（追加一行）

---

## 5. Exit Gate

- [ ] CHANGELOG.md 建立，v3 → v5.1 完整歷史（共 12 段：v3, v4, v4.1, v4.2, v4.3, v4.4, v4.5, v4.6, v4.7, v4.8, v5.0, v5.1）
- [ ] SKILL.md 第 13-47 行替換為一行 `> **版本歷史**：...`
- [ ] SKILL.md 第 49 行 `---` 保留，第 50 行以下不動
- [ ] skill-schema-lint 5/5 PASS
- [ ] `worklog-2026-04-18.md` 追加完成日誌一行
- [ ] commit + push 成功，commit message 含 `[影響: session-handoff skill only]` 標注
- [ ] 回報 Cowork：commit hash + SKILL.md 最終行數 + skill-schema-lint 結果

---

## 6. 明確不要做的

- **不修改 §3 CHANGELOG.md 內容**。逐字複製貼入檔案。
- **不改動 SKILL.md 第 1-12 行**（frontmatter + title + 開頭三行說明）。
- **不改動 SKILL.md 第 50 行以下**（§0 治理複雜度上界及之後）。
- **不動 SKILL.md「鐵律」節**（B 已完成，內容不再碰）。
- **不動 CLAUDE.md**（即使 245 行越界）。
- **不合併 commit**。本任務獨立一個 commit。
- **若 skill-schema-lint 報錯**：停下回報 Cowork。**不要自行調整內容解決 lint 錯誤**。
- **若 SKILL.md 第 13-47 行現況與本 handoff §2.1 描述不符**（例如已被其他 commit 改過），停下回報 Cowork，不要猜。
- **不新增 v5.2 entry** 到 CHANGELOG.md（v5.1 尚未結案，v5.2 還沒發生）。

---

## 7. 模型建議

**Sonnet 4.6 + Low**

理由：
- 純文件搬家
- 無判斷、無決策
- §3 提供逐字 drop-in 內容
- token 成本最低者勝

---

## 8. 預期後續

本任務完成後，v5.1 三項 scope（D → B → E）全部落地。Cowork 接手結案：

1. 更新 Issue #155（v5.1 狀態 In Progress → Done）
2. 寫 v5.1 簡短 retrospective（`docs/governance/retrospective-2026-04-18-v5-1-closure.md` 或併入 v5.0 retro）
3. Worklog 三維度結算（完成日誌 + 狀態變更 + 決策紀錄 + 阻礙與踩坑）
4. Memory 更新（若有新 feedback 或治理模式值得持久化）

---

## 附錄：源頭事實清單

| 論點 | X 源頭 | 驗證出處 |
|------|-------|--------|
| SKILL.md 第 13-47 行 10 段 changelog | Cowork Read tool（commit 8b75f2e 後現況） | 本 handoff 撰寫當下複核 |
| 替換起訖行號 | 同上 | 同上 |
| v5.0 內容 | docs/governance/retrospective-2026-04-18-v5-split-reversal.md + worklog-2026-04-18.md | 現場檔 |
| v5.1 內容 | rev2 §3 scope + 本輪三份 handoff 的 commit 結果 | handoffs/cowork--session-handoff-v5-1-planning-rev2-2026-04-18.md |
| v3 → v4.8 內容 | SKILL.md 現況逐字保留，只調整格式（> 引用塊 → markdown 區塊） | 本 handoff §3 |
| rev2 §3.3「38 行 / 七段」偏差修正 | 實際第 13-47 行 10 段 | 本 handoff frontmatter notes_on_rev2_drift |
