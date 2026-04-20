---
title: 工作環境定義 — Chat / Cowork / Code 三方職責與源頭事實規範
version: rev2.2
date: 2026-04-18
author: Cowork
status: Accepted（Paul 拍板 Q-WE-1 ~ Q-WE-9，rev2.1 / rev2.2 為實戰補註非新決策）
supersedes: rev1（未 commit，2026-04-18 同日）
amendments:
  - rev2.1 (2026-04-18 同日實戰補註)：§1.2 表格拆分 repo 記憶 / session 記憶 / PENDING.md 三列；新增 §1.3.1「兩層記憶系統路徑區分」。補註依據：本日 handoff §2.3 誤寫 `.auto-memory/`，Code 落地時才發現應指 session memory 路徑。屬實戰踩坑補邊角案例，非推翻 Q-WE-1 ~ Q-WE-9 任何拍板。
  - rev2.2 (2026-04-20 T-3 事故配套)：§1.2 表格新增「物理寫入 `.claude/skills/**` / `scripts/**` / `worker/src/**`」一列（Cowork 物理寫不到）；新增 §1.3.2「Cowork sandbox 寫入邊界」——明確列出 sandbox 物理寫不到的路徑、錯誤流程對照（T-3 事故）、未來候選硬檢查。補註依據：2026-04-20 T-3 事故（空中樓閣 N=3 + sandbox 寫入邊界誤判）第二個 root cause 的護欄，配套於 session-handoff v5.5 + auto-memory `feedback_adr_clause_before_listing.md`。屬實戰踩坑補邊角案例，非推翻任何拍板。
  - rev2.2 (2026-04-20 R3 CLAUDE.md 上限策略)：§4.2 F-ID 表格更新為 rev2.2（F1 621 行 / F4 200 行 / F5 181 行 新增）；§4.3 擴充「新規則該寫哪裡判斷樹」—— 3 問樹 + 反例 + 正例 + 抽離候選清單。CLAUDE.md L188 過時警告（「~220 行」）修正為當前 200 行 + 指向 §4.3 判斷樹 hyperlink。補註依據：CLAUDE.md 剛好卡 200 行軟上限，前置攔截勝於被動處置。屬維運補邊角案例，非推翻任何拍板。
upstream:
  - docs/governance/retrospective-2026-04-18-v5-split-reversal.md
  - handoffs/cowork--session-handoff-v5-split-reassessment-2026-04-18.md
  - CLAUDE.md（paulkuo.tw 根目錄）
external_references:
  - https://platform.claude.com/docs/en/managed-agents/multi-agent.md
  - https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk
  - https://code.claude.com/docs/en/skills
  - https://docs.anthropic.com/en/docs/claude-code/memory
  - https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions
  - https://sre.google/sre-book/postmortem-culture/
sources_of_truth_manifest: §7 附錄 A
verified_by: Code-verified
verification_date: 2026-04-18
purpose: 定義三視窗職責邊界 + 規劃文件源頭事實規範 + handoff ADR 欄位，止 2026-04-18「1085 vs 522」踩坑的血
implements: adr-collaboration-constitution-v0.2
constitutional_mapping:
  §1: "第三條（權責分工原則）"
  §2: "第一條（SSoT 原則）實施細則"
  §3: "第三條實施細則（Handoff ADR 欄位）"
  §4: "獨立（長度管制，無直接對應條文）"
---

# 工作環境定義 — Chat / Cowork / Code 三方職責與源頭事實規範（rev2.2）

## 0. 為什麼有這份文件

2026-04-18，session-handoff skill v5.0 規劃在 rev3 拍板「拆 skill 成三份」，Cowork 動工前核對源檔發現：規劃依據的 1085 行數字從未存在於 git 史——實際 522 行（現 553 行，加 §0 + frontmatter 後）。這個錯誤在 Chat → Cowork → Cowork 三個視窗接力傳遞過程中無人驗。

根因不是單一視窗失職，是三個視窗的**職責邊界、資料來源規範、cite 格式沒有共識**。本文件整合：

1. 我們自己的踩坑經驗
2. Anthropic 官方 multi-agent / skill / memory 規範
3. 業界 agentic workflow（LangGraph / CrewAI / Devin / 學術論文）經驗
4. 傳統工程規範（SSOT / ADR / RFC / Blameless Postmortem）

落地成：

- §1 Chat / Cowork / Code 職責邊界 + 禁止事項
- §2 源頭事實清單規範（含硬編碼禁令）
- §3 Handoff ADR 欄位升級
- §4 Skill / CLAUDE.md 長度管制（對齊官方軟上限）
- §5 外部共識對照表
- §6 rev2 落地動作
- §7 附錄（源頭事實清單、Exit Gate）

---

## §1 職責邊界（Chat / Cowork / Code）

### 1.1 三方角色定位

| 角色 | 主要職責 | 工作介質 | 動不動真實檔案 |
|------|---------|---------|--------------|
| **Chat** | 規劃、brainstorm、方向發想、跨視窗收斂問題 | 對話 + 文字草稿 | **不動**（只產出文字，不 commit） |
| **Cowork** | 跨 session 記憶、dashboard 同步、handoff 撰寫、Code 成果驗收、狀態 reconcile、verifier | Apple / Desktop App + sandbox | **有限動**（可寫文件類，不 commit 程式碼、不 deploy） |
| **Code** | 真的動檔案、commit、deploy、跑指令、寫程式 | Claude Code CLI + 本機 repo | **全動** |

### 1.2 三方能做 vs 不能做

| 動作 | Chat | Cowork | Code |
|------|:----:|:------:|:----:|
| 產出規劃文件 rev1/rev2 | ✅ | ⚠️（次選，Chat 優先） | ❌ |
| 寫 handoff 文件 | ❌ | ✅ | ❌ |
| 驗 git 實際狀態（wc / grep / git log） | ❌ | ✅（sandbox 副本） | ✅（本機 ground truth） |
| 下「事實判定」結論 | ❌ | ⚠️（涉及量化指標需 Code 第三方驗證） | ✅ |
| 寫 commit / push | ❌ | ⚠️（僅白名單路徑，見 §1.5） | ✅ |
| 動 skill / 腳本 / schema | ❌ | ❌（意圖層） | ✅ |
| 物理寫入 `.claude/skills/**` / `scripts/**` / `worker/src/**` | ❌ | ❌（sandbox 物理寫不到，見 §1.3.2） | ✅ |
| 寫 worklog 三維度 | ❌ | ✅（結 session 時） | ✅（Code 日報） |
| 更新 repo MEMORY.md（`.auto-memory/`）| ❌ | ✅ | ⚠️（可寫但 Cowork 為主） |
| 更新 session memory（Code session 記憶）| ❌ | ❌（無法寫入 Mac 本機）| ✅ |
| 更新 `worklogs/PENDING.md` | ❌ | ✅ | ✅ |
| 跑 lint / 跑測試 | ❌ | ⚠️（僅 sandbox 端） | ✅（ground truth） |
| deploy 到 Cloudflare | ❌ | ❌ | ✅（或 Paul 手動） |
| 推翻已拍板決策 | ❌ | ❌（見 §1.3 Cowork 禁止事項） | ❌ |
| 作為 verifier 同時改規劃文件內容 | ❌ | ❌（Q-WE-7） | ❌ |

### 1.3 禁止事項清單

**Chat 禁止**：
- ❌ 直接在規劃文件引用「實測」「驗證」「已確認」等詞而無指令佐證（參 §2）
- ❌ 基於訓練知識估算檔案行數 / 函式複雜度（這類數字必須由 Cowork / Code 實測）
- ❌ 拍板「拆檔案 / 刪檔案 / 重構架構」級的決策而未先要求 Code 第三方驗證

**Cowork 禁止**：
- ❌ 基於 sandbox 副本下「ground truth 判定」（sandbox ≠ Mac 本機）
- ❌ 單邊推翻已拍板決策而不發 Code 驗證
- ❌ **作為 verifier 同時寫進規劃文件內容**（Q-WE-7 混合版）——可寫「reassessment」或「verifier 觀察」，但必須標註「verifier 視角，待 planner 採納」，不得直接進工程或標為 rev2
- ❌ 動程式碼 commit（見 §1.5 白名單）
- ❌ 省略 worklog 三維度（沒有也要寫「無」）

**Code 禁止**：
- ❌ 自行寫 handoff 給下個視窗（handoff 是 Cowork 的事）
- ❌ 自行決定 skill / 治理規範的結構性改動（需有 Cowork handoff 為根據）
- ❌ 跳過 commit message `[影響: xxx]` 標注（影響共用模組時強制）

### 1.3.1 兩層記憶系統的路徑區分（2026-04-18 補註）

寫 handoff 時「更新 MEMORY.md」要先釐清是哪一層，否則 Code 會找不到檔案：

| 層 | 路徑 | 用途 | 誰寫 |
|---|------|------|------|
| **Repo 記憶** | `.auto-memory/MEMORY.md`（repo 內）| 跨專案、進 git、隨 repo 搬遷 | Cowork / Code 都可 |
| **Session 記憶** | `/Users/apple/.claude/projects/-Users-apple-Desktop/memory/`（Mac 本機，非 repo）| Code session 跨對話記憶 | 只有 Code 可（Cowork sandbox 無法寫入本機 Claude 設定目錄）|

**Cowork 寫 Code handoff 時的判斷**：
- 要「Code 在本機 session 記住這件事」→ 指 session memory 路徑
- 要「下一個 Cowork / 跨專案的 Chat 也看得到」→ 指 repo `.auto-memory/`
- 兩者都要 → handoff 分兩步寫清楚

**本輪踩坑**：`handoffs/cowork--working-environment-deployment-2026-04-18.md` §2.3 原寫 `.auto-memory/` 但 Code 發現那應該寫 session memory 路徑（因為目的是讓 Code 跨對話記住），Code 在本機自行修正。未來寫類似 handoff 時明確寫「session memory」或「repo .auto-memory」，不要只寫「MEMORY.md」。

### 1.3.2 Cowork sandbox 寫入邊界（2026-04-20 T-3 事故配套）

§1.2「動 skill / 腳本 / schema」把 Cowork 列 ❌ 是**意圖層**的規範（憲法第三條權責分工）。但 Cowork sandbox 還有**物理層**的寫入邊界——即使 Cowork 想寫、或受指示 cp 檔案，sandbox 也會拒絕。這兩層是分開的，不要混。

#### Cowork sandbox 可寫 vs 物理寫不到

| 路徑範圍 | Cowork 可寫？ | 備註 |
|---|:---:|---|
| `worklogs/**` | ✅ | §1.5 白名單 |
| `handoffs/**` | ✅ | §1.5 白名單 |
| `docs/governance/**` | ✅ | §1.5 白名單 |
| `docs/decisions/**` | ✅ | §1.5 白名單（若未來建立） |
| `.auto-memory/**` | ✅ | Cowork sandbox 原生可寫區，同步走 Claude.ai 雲端 |
| `.claude/skills/**` | ❌ | **物理寫不到**——sandbox 對 repo 下 `.claude/` 目錄僅讀 |
| `scripts/**` | ❌ | **物理寫不到** |
| `worker/src/**` | ❌ | **物理寫不到** |
| `src/**`（前端原始碼）| ❌ | **物理寫不到** |
| `.git/**` | ❌ | **物理寫不到**——commit/push 必須 Paul 跑 |

⚠️ 實務觀察：`cp -r` / `mkdir` 類操作若目標在物理寫不到的路徑，會出現「部分成功」的半成品（空目錄建出來但內容 cp 不進去），Cowork 甚至可能誤判為「已完成」。**cp 完必須驗內容**，不要只看指令 exit code。

#### 應對流程（當 Cowork 需要改動物理寫不到的路徑時）

**正確流程**：
1. Cowork 確認議題需要動 `.claude/skills/` / `scripts/` / `worker/src/` 等路徑
2. 產出 handoff → 寫進 `worklogs/PENDING.md` 「待 Code 執行」區塊
3. 交給 Paul 在 Claude Code CLI / 終端機直接執行
4. **不要**在 Cowork 裡直接 `cp -r`、`mv`、`rm -rf` 這些路徑，即使指令「看起來成功」

**錯誤流程**（T-3 事故模式）：
1. Cowork 誤判需要新增 4 個 skill 到 A 層（憑印象推測 ADR 指名，見 `feedback_adr_clause_before_listing.md`）
2. 直接給 Paul cp 指令建議
3. Paul 拍板 → 執行觸發 sandbox 權限錯誤 / 部分失敗（空目錄殘留）
4. Paul 手動 `rm -rf` 清理，才收場

#### 為何不直接把白名單做成 sandbox hard check

目前 sandbox 的寫入邊界是 Cowork infra 層決定，Cowork session 內無法自我檢查「這個路徑我能不能寫」——只能事後從錯誤訊息反推。短期靠這份文件 + `feedback_adr_clause_before_listing.md` 的護欄並行防禦；長期若再發生 2 次以上類似事故，考慮在 session-handoff skill 裡加一條「Cowork 動 cp/mv/rm 前必須先 `test -w` 目標路徑」的硬檢查（候選 v5.6 升級）。

#### 關聯

- 憲法第三條（權責分工）：意圖層規範，動 skill/schema 屬 Code 主責
- `feedback_adr_clause_before_listing.md`（auto-memory）：空中樓閣第 3 類，T-3 事故的第一個 root cause
- session-handoff SKILL.md v5.5「引用 ADR 清單時的剛性核查」：第一個 root cause 的護欄
- **本節（§1.3.2）**：T-3 事故的第二個 root cause「不知道沙盒寫不到哪裡」的護欄

---

### 1.4 跨視窗交接的三個關鍵點

**Chat → Cowork**：Chat 產出規劃文件後，Cowork 讀完先做「源頭事實核對」（§2）。核對失敗則回 Chat 修 rev，不直接進工程。

**Cowork → Code**：Cowork 寫 handoff 給 Code 時，必須含「驗證指令 + 預期輸出」，Code 跑完有落差要回報 Cowork，不自行調整。

**Code → Cowork**：Code 完工後產出「成果回報」（commit hash + 檔案清單 + Exit Gate 結果），Cowork 負責 reconcile 到 worklog / Issue #155 / MEMORY.md。

### 1.5 Cowork 可 commit 的白名單（Q-WE-1 選 C）

Cowork 可直接 commit + push 的路徑：

```
worklogs/**
handoffs/**
docs/governance/**
docs/decisions/**（若未來建立）
```

其他一律透過 PENDING.md 請 Code 處理。若白名單路徑與非白名單路徑混在同一 commit，整個 commit 必須請 Code 處理。

---

## §2 源頭事實清單（Sources of Truth Manifest）

> 跨視窗速記：[constitution-v0.2-quick-reference.md](./constitution-v0.2-quick-reference.md)（含情境舉例，跨 session 開場可快速載入憲法五條）

### 2.1 什麼時候需要附

**必附**：
- 任何 major version 規劃文件的 rev1（v5.0、v6.0 等）
- 任何「因為 X 所以 Y」的治理論點（X 必須可驗）
- 任何主張「拆 / 合 / 刪 / 重構」的決策文件
- 引用量化指標（行數、size、百分比、檔案數、耗時）的任何文件

**選附**：
- 小修小補的 handoff（例如 commit 一行 CSS）
- 純文字對齊用的討論稿

### 2.2 清單格式

```markdown
## 附錄 X：源頭事實清單

| 論點 ID | 論點內容 | 驗證指令 | 指令輸出 | 驗證者 | 驗證時間 |
|--------|---------|---------|---------|-------|---------|
| F1 | SKILL.md 553 行 | `wc -l .claude/skills/session-handoff/SKILL.md` | `553 .claude/skills/session-handoff/SKILL.md` | Code / Sonnet 4.6 | 2026-04-18 12:34 |
```

**強制欄位**：論點 ID（F1/F2...）、驗證指令、指令原始輸出（不濃縮）、驗證者、驗證時間。

### 2.3 硬編碼事實數字規則（Q-WE-6 選 C）

**小數字（<1000 的計數，如項目數、行數低於 1000）**：正文可直接寫數字，但必須附 F-ID。
- ✅ 「SKILL.md 553 行（F1）」
- ❌ 「SKILL.md 553 行」（無 F-ID）

**大決策數字（涉及閾值、比例、效能、成本）**：正文必須改寫成「指令 + 時間戳」形式，數字放附錄。
- ✅ 「SKILL.md 行數（見 F1，2026-04-18 驗）超過官方 200 行軟上限」
- ❌ 「SKILL.md 553 行，超過 200 行軟上限」（直接寫數字做決策論據）

**百分比 / 比較值**：一律需附 F-ID 且驗證時間 < 7 天。
- ✅ 「自動化覆蓋率 70%（F5，2026-04-17 驗）」
- ❌ 「自動化覆蓋率 70%」

### 2.4 驗證鏈的兩層防線

**第一層（Cowork sandbox）**：Cowork 讀 Chat rev1 後在 sandbox 跑驗證，把指令輸出貼回文件。能擋「Chat 估算錯誤」。

**第二層（Code 第三方驗證）**：涉及「既有檔案的量化指標（行數、大小、複雜度）」時強制觸發（Q-WE-2 選 C），Code 本機跑一次，輸出獨立紀錄到 `worklogs/investigations/{YYYY-MM-DD}-{topic}.md`。

**何時跳第二層**：論點已在 48 小時內被 Code 驗過；或透過 git log 確認該檔案自上次驗證後無變動（Q-WE-4 選 C，變更偵測取代固定過期）。

**Chat 一律經 Cowork 驗證的觸發條件**（Q-WE-3 選 B）：Chat rev1 含「具體數字 / 檔案狀態引用」時觸發；純決策論述 / 純 brainstorm 不觸發。

### 2.5 cite 規範

✅ 正確：「SKILL.md 實測 553 行（F1），歷史峰值從未超過 600 行（F2），拆 skill 的 token 節省前提不成立。」

❌ 錯誤：「SKILL.md 實測約 1085 行，拆 skill 能節省 token。」（無 F-ID、無指令、無輸出）

❌ 錯誤：「SKILL.md 太長了應該拆。」（「太長」無定義、無閾值、無對照）

### 2.6 規劃文件 frontmatter 新欄位

未來 major version 規劃文件的 rev1 Markdown frontmatter 必須含：

```yaml
---
version: rev1
sources_of_truth_manifest: 附錄 X（或 worklogs/investigations/{date}-{topic}.md）
verified_by: [Cowork-sandbox | Code-verified]
verification_date: YYYY-MM-DD
---
```

`verified_by` 若只是 `Cowork-sandbox` 且文件含「拆/合/刪/重構」級決策或量化指標，status 標為 `rev1-draft`，拍板前必須升級為 `Code-verified`。

---

## §3 Handoff ADR 欄位升級（Q-WE-8 選 C）

### 3.1 現行 handoff 缺口

比對 Michael Nygard ADR 5 欄位（Title / Status / Context / Decision / Consequences），我們現行 handoff 缺 **Status** 和 **Consequences**。

### 3.2 rev2 後所有 handoff 強制兩個新欄位

**Status**（frontmatter 新欄位）：
```yaml
status: [Draft | Accepted | Superseded | Deprecated]
superseded_by: handoffs/xxx.md（若 Superseded）
```

被取代的 handoff 必須在文件**頂部**加一行：`> SUPERSEDED BY [新 handoff 路徑]（YYYY-MM-DD）`，避免未來讀者誤取舊決策。

**Consequences**（文件末必加一節）：
```markdown
## §N. Consequences

- **若決策正確**：...（預期收益）
- **若決策錯誤的連鎖影響**：...（哪些下游文件 / 程式碼 / 工作流會受影響）
- **可逆性**：可逆 / 部分可逆 / 不可逆
- **驗證收斂條件**：...（什麼時候能確認這個決策是對的）
```

### 3.3 不強制 5 欄位全上的理由

Title + Context + Decision 在現行 handoff 已隱含（目的章節 + 背景章節 + 任務章節），不另立欄位。Status + Consequences 是真正的缺口，只加這兩個。

### 3.4 既有 handoff 不追溯

rev2 前的既有 handoff 不回頭補（成本過高）。新規則從 rev2 commit 後生效。

---

## §4 Skill / CLAUDE.md 長度管制（Q-WE-9 選 C）

### 4.1 三層長度規則

| 規則 | 行數 | 動作 |
|------|------|------|
| 官方軟上限（預警）| 200 行 | 通知但不觸發拆檔；在 worklog 記錄「已達預警，追蹤趨勢」 |
| 內部觸發點 | 800 行 | 觸發「是否拆分」討論 procedure（不自動拆） |
| 硬界 | 900 行 | 強制啟動拆分，不得拖延 |

### 4.2 當前狀態（F-ID 化，rev2.2 更新 2026-04-20）

| F-ID | 檔案 | 行數 | 軟上限 200 相對值 | 內部觸發 800 相對值 | 備註 |
|---|---|---|---|---|---|
| F1 | `.claude/skills/session-handoff/SKILL.md` | **621** | 310% | 77% | 逼近觸發點，下次 major 升級前評估拆分 |
| F4 | `CLAUDE.md`（根目錄） | **200** | 100%（剛好卡線） | — | 剛好卡在軟上限，新規則不再往內塞（見 §4.3 判斷樹） |
| F5 | `docs/governance/constitution-v0.2-quick-reference.md` | 181 | 91% | — | 速記卡 rev1（含情境 7），接近軟上限 |
| — | 其他 skill（wiki-ingest / wiki-lint 等） | < 200 | — | — | 軟上限內，免觀察 |

⚠️ F1 = 621 行（77% 達觸發點）是近期最需監控的對象。v5.5 commit `3f457f0` 後新增「引用 ADR 清單時的剛性核查」章節，預計 v5.6/v5.7 仍有增長壓力——若再加兩個等量章節就會觸發 800 行拆分討論。

### 4.3 CLAUDE.md 越界處置與「新規則該寫哪裡」判斷樹（rev2.2 擴充）

#### 現況（2026-04-20）

CLAUDE.md 目前 200 行剛好卡軟上限。與其等「越界 → 被動處置」，不如前置攔截：**新規則入檔前先跑判斷樹**，從源頭控制增長。

#### 判斷樹：新規則該進 CLAUDE.md 還是子文件？

```
新規則 / 新段落
  │
  ├─ 問 1：是否為「Claude Code 開 repo 的第一層必讀指令」？
  │     （例：commit message 格式、部署指令、Smoke Test 必做）
  │     │
  │     YES → 考慮 CLAUDE.md，但先問 2
  │     NO  → 直接進 docs/governance/ 或 skill，**不進 CLAUDE.md**
  │
  ├─ 問 2：是否超過 5 行才講得清楚？
  │     YES → 寫 docs/governance/{topic}.md，CLAUDE.md 放一行 hyperlink
  │     NO  → 可進 CLAUDE.md（但仍走問 3）
  │
  └─ 問 3：是否已經有可擴寫的相鄰子文件？
        （例：憲法、WE、rollback-protocol、speed reference）
        │
        YES → 併入相鄰子文件，CLAUDE.md 不重複
        NO  → 可進 CLAUDE.md（最後防線）
```

#### 反例（禁止寫進 CLAUDE.md）

- ❌ 「某次事故的 retro 與對策」→ 進 `docs/governance/retrospective-*.md` 或 skill
- ❌ 「某個護欄的詳細觸發條件 + 歷史 N 計數」→ 進 `session-handoff SKILL.md` / 速記卡
- ❌ 「某個規範的完整選項比較」→ 進 ADR
- ❌ 「某個功能的工程細節 > 3 行」→ 進子專案 CLAUDE.md / runbook

#### 正例（可進 CLAUDE.md）

- ✅ 「新 clone 後必跑 `bash scripts/install-hooks.sh`」（1 行指令 + 1 行理由）
- ✅ 「部署指令必帶 `--config wrangler.toml`」（一行陷阱警告）
- ✅ 「跨層引用：憲法全文見 X，實施細則見 Y」（hyperlink 導覽）

#### 何時反悔重構 CLAUDE.md

- 觸發 1：CLAUDE.md 越過 200 行 → 啟動「抽離候選清單」（見下方）
- 觸發 2：同一主題在 CLAUDE.md 和子文件都有（違憲第四條同層原子化）
- 觸發 3：下次 major version 規劃時順手盤點

#### 抽離候選清單（當 CLAUDE.md 真的越界時優先抽離）

依優先序（越前面越容易搬走、越獨立）：

1. 「Rollback Protocol」一行（L47-L49）→ 已有 `docs/governance/rollback-protocol.md`，CLAUDE.md 該段已是 hyperlink，無可抽
2. 「部署」指令塊（L51-L62）→ 可抽成 `docs/runbooks/deploy.md`，CLAUDE.md 留一行
3. 「部署後驗證」規則（L64-L86）→ 可抽成 `docs/runbooks/smoke-test.md`
4. 「D1 / KV」「Wrangler 陷阱」「Astro 陷阱」「CDN」（L104-L125）→ 可抽成 `docs/engineering-pitfalls.md`

**預估**：把第 2-4 抽離約可瘦身 50-70 行，CLAUDE.md 降到 130-150 行舒適區。目前 200 行還沒越界，不急做，列為候選。

### 4.4 為何不照官方 200 硬拆

官方建議是針對「通用 skill」語境（例如寫 Python 的 skill），我們的 session-handoff 本質是「跨 session 協作規範」，先天較長。200 行當預警燈（通知）而非拆檔觸發點，800 行才觸發拆分討論。

---

## §5 外部共識對照表

| 共識 | 官方來源 (A) | 業界 (B) | 傳統工程 (C) | 已落入 rev2 哪一節 |
|------|:-----------:|:--------:|:------------:|--------------------|
| Mechanical verification > LLM self-check | A5 | B2 | C1 | §2.3 硬編碼規則 |
| Handoff 顯式 artifact | A1 | B1 | C2 | §3 ADR 升級 |
| Role 禁止事項 | A1 | B5 | C3 | §1.3 禁止事項 |
| Skill 200 行軟上限 | A3 | — | — | §4.1 三層長度規則 |
| CLAUDE.md 200 行軟上限 | A4 | — | — | §4.2 F4 驗證 |
| Contributing Factors > Root Cause | — | — | C4 | §6.3 retro 模板改動 |

**不照抄**：AutoGen GroupChat（B 警告）、Judge LLM 自動 rev loop（B 警告）、RFC 10 天 FCP（C3）、ADR Alternatives Considered（C2）。

詳細來源：附錄 B。

---

## §6 rev2 落地動作

### 6.1 立即動作（本 session 完工前）

1. Cowork 將本文件 rev2 commit 到白名單路徑 `docs/governance/` → 交 Code（見 §6.4）
2. 更新 `worklogs/worklog-2026-04-18.md` 三維度
3. 寫 Code handoff（§6.4）

### 6.2 短期動作（本週）

1. 更新根目錄 `CLAUDE.md`：加一段「工作環境定義 → 見 `docs/governance/working-environment.md`」，並標注已達 200 行預警（F4）
2. 更新 `.auto-memory/MEMORY.md` 加一條指向本文件
3. 下一份 handoff（不論 Code / Cowork 寫）套用 §3 Status + Consequences 新欄位（實戰測試）

### 6.3 中期動作（2 週內）

1. 既有 retro 模板升級為 Contributing Factors 格式（C4）
2. 檢視 CLAUDE.md 是否可抽部分內容獨立成 runbook
3. v5.1 規劃啟動時，rev1 套用 §2.6 frontmatter 新欄位（實戰測試）

### 6.4 Code handoff（本 session 產出）

本文件 rev2 commit 後，寫 `handoffs/cowork--working-environment-deployment-2026-04-18.md`，內容：
- Cowork 已 commit `docs/governance/working-environment.md`（hash 由 Code 填）
- Code 負責 push 本 commit + 更新根目錄 CLAUDE.md 加連結段落 + 更新 MEMORY.md
- Exit Gate：CLAUDE.md push 後跑 `wc -l` 確認未再膨脹

---

## §7 本文件 Exit Gate

rev2 拍板條件（Paul 已確認 Q-WE-1 ~ Q-WE-9 採納傾向）：

- [x] Q-WE-1 Cowork 白名單（選 C）→ §1.5
- [x] Q-WE-2 第二層驗證觸發條件（選 C）→ §2.4
- [x] Q-WE-3 Cowork 驗 Chat rev1 觸發條件（選 B）→ §2.4
- [x] Q-WE-4 事實清單過期規則（選 C）→ §2.4
- [x] Q-WE-5 Q4 分工圖擱置（選 C）→ 不在本文件
- [x] Q-WE-6 硬編碼事實數字規則（選 C）→ §2.3
- [x] Q-WE-7 Verifier 禁止同時 act as planner（選 C）→ §1.3
- [x] Q-WE-8 Handoff ADR 欄位（選 C）→ §3
- [x] Q-WE-9 Skill 長度三層規則（選 C）→ §4.1

- [x] 本文件自身符合 §2 規範（引用數字皆有 F-ID，見附錄 A）
- [x] 本文件自身符合 §3 規範（frontmatter 含 status + sources_of_truth_manifest，文件末有 Consequences）

---

## 附錄 A：本文件的源頭事實清單

| 論點 ID | 論點內容 | 驗證指令 | 指令輸出 | 驗證者 | 驗證時間 |
|--------|---------|---------|---------|-------|---------|
| F1 | session-handoff SKILL.md 553 行 | `wc -l .claude/skills/session-handoff/SKILL.md` | `553 .claude/skills/session-handoff/SKILL.md` | Cowork sandbox | 2026-04-18 rev2 |
| F2 | git log 驗證歷史峰值從未 1000+ 行 | 見 `worklogs/investigations/2026-04-18-skill-source-verification.md` F 段 | （完整 raw output） | Code / Sonnet 4.6 | 2026-04-18 |
| F3 | commit 6a32f81 已 push 成功 | `git push origin main`（Paul Mac 端） | `71a07bc..6a32f81  main -> main` | Paul 本人 | 2026-04-18 |
| F4 | 根目錄 CLAUDE.md 233 行 | `wc -l CLAUDE.md` | `233 CLAUDE.md` | Cowork sandbox | 2026-04-18 rev2 |

引用文件：`worklogs/investigations/2026-04-18-skill-source-verification.md`

---

## 附錄 B：外部來源完整連結

**Anthropic 官方（A 路 Agent）**：
- [Multi-agent sessions](https://platform.claude.com/docs/en/managed-agents/multi-agent.md)（A1）
- [Building agents with the Claude Agent SDK](https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk)（A1/A2）
- [Agent Skills Overview](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview)（A2）
- [Extend Claude with skills](https://code.claude.com/docs/en/skills)（A3，200 行軟上限）
- [The Complete Guide to Building Skill for Claude](https://resources.anthropic.com/hubfs/The-Complete-Guide-to-Building-Skill-for-Claude.pdf)（A3）
- [How Claude remembers your project](https://docs.anthropic.com/en/docs/claude-code/memory)（A4）
- [Memory tool](https://platform.claude.com/docs/en/agents-and-tools/tool-use/memory-tool)（A4）
- [Demystifying evals for AI agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)（A5）
- [Best Practices for Claude Code](https://code.claude.com/docs/en/best-practices)（A6）

**業界 / 學術（B 路 Agent）**：
- [AI Agent Systems: Architectures, Applications, and Evaluation](https://arxiv.org/html/2601.01743v1)（B1）
- [Citation-Grounded Code Comprehension](https://arxiv.org/html/2512.12117v1)（B2）
- [HaluGate - vLLM Blog](https://blog.vllm.ai/2025/12/14/halugate.html)（B2）
- [Mitigating LLM Hallucinations Using a Multi-Agent Framework](https://www.mdpi.com/2078-2489/16/7/517)（B2）
- [Cognition: Introducing Devin 2.0](https://cognition.ai/blog/devin-2)（B3）
- [AI Agentic Programming Survey](https://arxiv.org/html/2508.11126v2)（B3）
- [Plan-and-Act](https://arxiv.org/html/2503.09572v3)（B4）
- [PEAR Benchmark](https://arxiv.org/html/2510.07505v4)（B5）
- [DataCamp CrewAI vs LangGraph vs AutoGen](https://www.datacamp.com/tutorial/crewai-vs-langgraph-vs-autogen)（B1）

**傳統工程（C 路 Agent）**：
- [Michael Nygard 原始 ADR 文章 (2011)](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)（C2）
- [ThoughtWorks Radar: Lightweight ADRs](https://www.thoughtworks.com/radar/techniques/lightweight-architecture-decision-records)（C2）
- [IETF RFC 2026](https://www.rfc-editor.org/rfc/rfc2026)（C3）
- [PEP 1](https://peps.python.org/pep-0001/)（C3）
- [Rust RFC process](https://github.com/rust-lang/rfcs/blob/master/0002-rfc-process.md)（C3）
- [Google SRE Book - Postmortem Culture Ch.15](https://sre.google/sre-book/postmortem-culture/)（C4）
- [Wikipedia SSOT](https://en.wikipedia.org/wiki/Single_source_of_truth)（C1）

---

## §8 Consequences

- **若決策正確**：後續 major version 規劃不再踩「1085 vs 522」類的無事實依據踩坑。handoff 有 Status 欄位後，rev 之間的取代關係清楚。CLAUDE.md 越界有警示機制。
- **若決策錯誤的連鎖影響**：§2 硬編碼規則若過嚴，會讓規劃文件可讀性下降（到處是 `wc -l ...` 指令）。若 Cowork 白名單邊界不清，可能仍有模糊帶。Handoff 新欄位若工程上推不動，會形成兩套格式並存的混亂。
- **可逆性**：部分可逆。§1/§2/§3 是規範層，改回來只是改文件；但既有 handoff 若已套用 Status 欄位，改回時需大量修改。
- **驗證收斂條件**：rev2 落地後兩週內，觀察三件事：(1) 下一份 handoff 是否自然套用 Status + Consequences；(2) v5.1 規劃 rev1 是否自然附源頭事實清單；(3) CLAUDE.md 是否無意間又膨脹。三項都達成 → 規範有效。任一未達成 → rev3 修補。

---

**上游**：
- `docs/governance/retrospective-2026-04-18-v5-split-reversal.md`
- `handoffs/cowork--session-handoff-v5-split-reassessment-2026-04-18.md`
- rev1（本檔 2026-04-18 同日草稿，未 commit）

**rev2 → 落地路徑**：Cowork commit 本文件 → 寫 Code handoff → Code push + 更新 CLAUDE.md + 更新 MEMORY.md → 實戰測試
