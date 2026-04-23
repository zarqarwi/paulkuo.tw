---
target: code
project: session-handoff skill v5.1 — B 護欄編號系統首建
purpose: 將 SKILL.md 現有 11 條無編號鐵律改寫為 13 條編號系統（A2 / B4 / C5 / D2），並新增「命名規則」子節
date: 2026-04-18
author: Cowork（本視窗）
upstream:
  - handoffs/cowork--session-handoff-v5-1-planning-rev2-2026-04-18.md（rev2 §3.2 本任務來源）
  - handoffs/code--v5-1-D-cross-cowork-retro-2026-04-18.md（前置任務，Exit Gate 已 PASS，commit 0609f16）
blocks: v5.1-E 抽 changelog（B 完成後才發）
confidence: 高（§3 提供逐字 diff，Code 只做機械替換）
estimated_effort: 15-20 分鐘（含 skill-schema-lint 驗證）
model_suggestion: Sonnet 4.6 + Medium（需精確套用分組表，驗證 skill-schema-lint PASS）
status: Proposed
consequences: |
  本任務直接改動 session-handoff skill 的核心規範。Code 的工作是精確套用 §3 的 diff，
  不做規則內容判斷。若套用後 skill-schema-lint 報錯，停下回報 Cowork，不要自行調整規則文字。
  若發現 §3 的 diff 本身有誤（例如行號不對、原文有變），停下回報 Cowork，不要猜。
---

# Code Handoff：v5.1-B 護欄編號系統首建

## 0. 任務來源

v5.1 規劃 rev2 §3.2。11 條鐵律首次建立編號系統 + 新增 2 條 = 13 條。分組依 rev2 §3.2.3 表格：

| 主題 | 條數 | 代碼範圍 |
|------|-----|---------|
| A 委託原則 | 2 | A1, A2 |
| B 工具失真 | 4 | B1, B2, B3, B4 |
| C 驗證原則 | 5 | C1, C2, C3, C4, C5 |
| D Context 管理 | 2 | D1, D2 |
| **總計** | **13** | |

前置 D 已完成（commit 0609f16，含 push）。現可安全動 SKILL.md。

---

## 1. 工作目錄

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw
```

---

## 2. 任務清單

### 2.1 改寫 SKILL.md 第 86-108 行「鐵律」節

**目標檔案**：`.claude/skills/session-handoff/SKILL.md`

**動作**：將現有第 86-108 行（`### 鐵律` heading + 11 條規則）替換為 §3 的新內容（13 條編號規則 + 新增「命名規則」子節）。

**關鍵邊界**：
- 替換起點：第 86 行 `### 鐵律`
- 替換終點：第 108 行（原第 11 條「絕對不使用 Apple Notes…」結尾）
- **不動第 82-85 行**（上方 `---` + `## Cowork 工作邊界（v3）` heading + 空行 + `### 鐵律` 前的空行）
- **不動第 109 行以下**（原 `### Cowork 適合做的` heading + 後續內容）

### 2.2 skill-schema-lint 驗證

改完後跑：

```bash
# 假設 lint 工具路徑（若實際路徑不同，依 repo 現況調整）
bash scripts/skill-schema-lint.sh .claude/skills/session-handoff/SKILL.md 2>&1 | tee /tmp/v51-b-lint.log
```

預期輸出：`PASS` 或等效成功訊息。

**若 lint 報錯**：停下回報 Cowork，不要自行調整規則文字。

### 2.3 追加 worklog

在 `worklogs/worklog-2026-04-18.md` 的「完成日誌（最新在上）」區塊頂部追加：

```markdown
- {HH:MM} v5.1-B 護欄編號系統首建（13 條：A2 / B4 / C5 / D2）({commit hash}) Code
```

### 2.4 Commit + push

```bash
git add .claude/skills/session-handoff/SKILL.md worklogs/worklog-2026-04-18.md
git commit -m "chore(skills): v5.1-B guardrail numbering system (13 rules) [影響: session-handoff skill only]"
git push origin main
```

---

## 3. SKILL.md 第 86-108 行完整替換內容

### 3.1 逐字替換塊（Code 貼此段取代原第 86-108 行）

以下為 13 條編號系統 + 命名規則子節的完整內容。**從下一行的 `### 鐵律` 開始到本節結尾 `---` 分隔符號前**，完整替換原第 86-108 行。

---

### 鐵律

護欄依主題分四組：**A 委託原則** / **B 工具失真** / **C 驗證原則** / **D Context 管理**。命名規則見本節末。

#### A 委託原則

1. **A1 — 程式碼修改一律交 Code。** Cowork 不直接改程式碼，超過 5KB 的 GitHub 檔案操作不碰。（2026-03-31 截斷事故教訓）

2. **A2 — 含程式碼常數的文件，流程是 Code dump → Cowork 排版。** Cowork 不自己讀 code 來填常數。等級門檻、碳排係數、rate limit 數值等，一律由 Code 先匯出，Cowork 只負責排版成文件。如果必須引用常數，標註「待 Code 驗證」直到確認。

#### B 工具失真

3. **B1 — GitHub MCP 大檔案截斷意識。** Cowork 用 GitHub MCP 讀超過 1000 行的檔案可能被截斷。如果搜尋結果是「找不到」，不能判定為「不存在」，要標記為「未確認，需 Code 用本機 grep 驗證」。（2026-04-04 RFC #100 誤判事件教訓）

4. **B2 — GitHub API 回傳結果要確認語義。** API 有回傳結果 ≠ 結果的意思是你想的。例如 `list_commits(path=某檔案)` 回傳的是「tree 包含該檔案的 commits」，不是「改動該檔案的 commits」。要確認因果關係，必須查 diff。（2026-04-05 事故教訓）

5. **B3 — Sandbox ≠ Repo，涉及 repo 檔案一律用 filesystem MCP 讀 Paul 電腦。** Cowork 的 sandbox 掛載可能是 repo 的子集或過期快照。在開始任何涉及 repo 檔案的分析或編輯前，必須用 `mcp__filesystem__read_file` 或 `mcp__filesystem__list_directory` 讀取 Paul 電腦上的實際 repo（路徑見各專案 Project Instructions）。**絕對不要基於 sandbox 的檔案列表做判斷。**（2026-04-06 Wiki Phase 4 事故教訓：sandbox 只有 10 個 concept，repo 有 17 個，導致整份分析無效）

6. **B4 — 絕對不使用 Apple Notes 存取任何專案狀態。** 儀表板已永久遷移至 GitHub Issue。Apple Notes MCP 僅在非專案用途（個人筆記）時才可使用。

#### C 驗證原則

7. **C1 — 任何「完成/未完成」的狀態判斷，一律現場查 git log，不從記憶回答。** Memory 只記「為什麼」和「怎麼做」，不記「做了沒有」。完成與否，每次現場查。

8. **C2 — Cowork 不做自我驗證迴圈。** Cowork 產出的文件 A，不能拿文件 A 當基準去驗證文件 B。要驗就查原始碼或交 Code 驗。（2026-04-04 幻值事件根因）

9. **C3 — 偵察先行，行動在後。** Cowork 開給 Code 的工單，第一步永遠是 Step 0 偵察（grep / git log / PRAGMA），不是直接改 code。

10. **C4 — 陰性結果結論節制。（v5.1 新增）** 查無 ≠ 不存在。grep / search / list 回傳空結果時，不可直接下「X 不存在」結論，須交叉驗證（換工具 / 換關鍵字 / 換資料源）或標「未確認」。（2026-04-17 Wiki KV seed 誤判事件教訓）

11. **C5 — SSoT 變更後下游重驗。（v5.1 新增）** Single Source of Truth 被修改後，所有依賴該 SSoT 的下游產物（報告、dashboard、衍生文件）必須重新驗證，不得沿用舊結論。（2026-04-17 SSoT 變更案教訓）

#### D Context 管理

12. **D1 — 對話超過 30-40 輪來回，或一次交叉比對超過 5 份文件，準備開新視窗。** Context 衰減會讓早期的精確資訊變模糊，增加幻覺風險。把結論寫進 worklog 或 memory，讓新視窗接手。

13. **D2 — Cowork 視窗切換時必須持久化。** 收到 Code 的完成回報後，立刻寫進 worklog 或更新 memory。不能只在對話裡確認就算——下一個視窗看不到這個對話。

#### 命名規則（v5.1 起生效）

從 v5.1 起，新增或調整護欄編號必須遵循：

- **主題碼開頭**：A / B / C / D 擇一；若開新主題（例如 E / F），須在本節先定義主題代碼與涵義
- **序號遞增**：主題碼後接該主題當前最大序號 + 1
- **不再使用流水號** `#N`（舊流水號已全面退休）
- **退休編號不得回收**：若某條護欄失效，保留編號但標 `[retired]`，不得將該編號指派給新條目
- **修訂不升編號**：同一條規則的內容調整不改變編號，只在 CHANGELOG.md 記錄修訂

---

### 3.2 Diff 語義檢查（Code 貼完後自查）

套用後的檔案應滿足：

- [ ] `### 鐵律` heading 仍在同位置（原第 86 行）
- [ ] 規則編號從 A1 開始，依序 A1, A2, B1-B4, C1-C5, D1-D2，無跳號
- [ ] 共 13 條規則
- [ ] 新增 `#### 命名規則（v5.1 起生效）` 子節
- [ ] 原「### Cowork 適合做的」heading 仍在（應為改後新行號，但 heading 文字不變）
- [ ] 行數變化：原 23 行（86-108）→ 新內容約 50-55 行，整份 SKILL.md 增加約 30 行，從 553 → 約 583

### 3.3 原始 11 條 → 新 13 條對應速查

（Code 複核用，非替換內容）

| 原 # | 新代碼 | 名稱 |
|-----|-------|------|
| 1 | A1 | 程式碼修改一律交 Code |
| 2 | A2 | 常數 Code dump → Cowork 排版 |
| 3 | D1 | 對話 30-40 輪換視窗 |
| 4 | C1 | 完成狀態現場查 git log |
| 5 | C2 | 不做自我驗證迴圈 |
| 6 | D2 | 視窗切換必持久化 |
| 7 | C3 | 偵察先行，行動在後 |
| 8 | B1 | GitHub MCP 大檔案截斷 |
| 9 | B2 | GitHub API 語義確認 |
| 10 | B3 | Sandbox ≠ Repo |
| 11 | B4 | 不用 Apple Notes 存專案狀態 |
| 新 | C4 | 陰性結果結論節制 |
| 新 | C5 | SSoT 變更後下游重驗 |

---

## 4. Integration Checklist

- [x] 工作目錄：`~/Desktop/01_專案進行中/paulkuo.tw`
- [x] 無 API 呼叫、無 CORS 影響、無 deploy
- [x] 無 wrangler.toml / wrangler.jsonc 影響
- [x] 跨子專案影響：僅 session-handoff skill（commit message 已標注）
- [x] 檔案修改：`.claude/skills/session-handoff/SKILL.md` 第 86-108 行
- [x] 檔案修改：`worklogs/worklog-2026-04-18.md`（追加一行）

---

## 5. Exit Gate

- [ ] SKILL.md 第 86-108 行改寫為 13 條編號系統 + 命名規則子節
- [ ] 13 條對應 §3.3 表格，無錯位、無漏
- [ ] skill-schema-lint PASS
- [ ] `worklog-2026-04-18.md` 追加完成日誌一行
- [ ] commit + push 成功，commit message 含 `[影響: session-handoff skill only]` 標注
- [ ] 回報 Cowork：commit hash + skill-schema-lint 結果

---

## 6. 明確不要做的

- **不修改 §3 規則內容**。逐字複製貼入檔案，除了將本 handoff 的 markdown 排版原樣搬進。
- **不自行新增 / 刪除規則**。13 條就是 13 條，不多不少。
- **不動第 86-108 行以外的區塊**。上方 heading（`## Cowork 工作邊界（v3）`）與下方（`### Cowork 適合做的`）完全不動。
- **不動 SKILL.md 頂部 changelog**（那是 E 的工作，第三份 handoff）。
- **不動 CLAUDE.md**（即使 245 行越界）。
- **不合併 commit**。本任務獨立一個 commit，不與其他動作混。
- **若 skill-schema-lint 報錯**：停下回報 Cowork。**不要自行調整規則文字解決 lint 錯誤**——可能是 lint 規則本身需配合 v5.1 更新。
- **若發現原第 86-108 行內容與本 handoff §3.3 對應表不符**（例如已被其他 commit 改過），停下回報 Cowork。

---

## 7. 模型建議

**Sonnet 4.6 + Medium**

理由：
- 機械替換為主，但需精確套用分組表（13 條不能錯位）
- 需判讀 skill-schema-lint 結果
- 偏保守選 Medium 而非 Low，確保 lint 報錯時能合理判斷「停下回報」而非「自行修補」

---

## 8. 預期後續

本任務完成後：

1. Code 回報 commit hash + skill-schema-lint 結果
2. Cowork 撰寫第三份 handoff：`handoffs/code--v5-1-E-changelog-extraction-2026-04-18.md`（E 抽 changelog）
3. v5.1 三項 scope 完成 D → **B** → E（E 為最後一項）

---

## 附錄：源頭事實清單

| 論點 | X 源頭 | 驗證出處 |
|------|-------|--------|
| SKILL.md 第 86-108 行為 11 條鐵律 | Cowork Read tool 2026-04-18 | 本 handoff 撰寫當下複核 |
| 11 條主題分組 | Cowork 讀 11 條實際內容分析 | rev2 §3.2.1 |
| 新增 C4 / C5 事故源 | 2026-04-17 另一 Cowork 視窗事件 | rev2 §3.2.2 + rev3 §7 |
| 13 條分布（A2/B4/C5/D2） | rev2 §3.2.3 表格 | handoffs/cowork--session-handoff-v5-1-planning-rev2-2026-04-18.md |
| 命名規則「不回收編號」 | rev2 §3.2.4 | 同上 |
