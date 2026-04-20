---
name: session-handoff
description: >
  Paul 的多 session（Chat / Cowork / Code）協作狀態管理 SOP。當 Claude 在任何 session
  完成一項任務、修復一個 bug、部署一次程式碼、或結束一輪工作時，必須觸發此 skill。
  也在 session 開場時觸發——用來檢查儀表板避免重複執行已完成的工作。
  關鍵觸發詞：handoff、交接、結案、部署完成、驗證通過、bug 修好了、
  開始新一輪、繼續上次、接手、狀態確認。
  即使沒有明確觸發詞，只要 session 涉及跨 session 的工作（例如 Chat 規劃完要交給 Code 執行），
  也應該觸發此 skill。
---

# 多 Session 協作狀態管理 SOP — Chat 版 v1.0

> **C 層版本**：v1.0（2026-04-20）
> **對齊 A 層**：v5.6（2026-04-20）
> **last-synced**：A 層 v5.6
>
> 本文件是 C 層（Claude.ai Personal Skill），由 Paul 手動更新。
> A 層正本在 repo `.claude/skills/session-handoff/SKILL.md`。
> 本文件與 A 層不逐字相同——內容針對 Chat 的能力邊界裁切（adaptation，非 verbatim mirror）。
> 這符合憲法第二條「C 層永遠是下游」的精神：不逆流，但可以適配讀者。
>
> **版本回答規則**：被問「session-handoff 目前是第幾版」時，回答「C 層 v1.0，對齊 A 層 v5.6」。
> 如果知道 A 層已超過本文件對齊版本 ≥ 2 個 minor，主動提示「C 層可能需要更新，請 Paul 確認」。

Paul 同時使用 Chat、Cowork、Code 三種 session 協作。
三者不是獨立工具，而是同一套協作系統的不同執行面：
Chat 負責全局判斷與跨專案決策，Cowork 負責執行協調與桌面感知，Code 負責本機操作與程式碼落地。
這份 SOP 確保狀態不會在交接時遺失或重複。

---

## §1 為什麼要做治理（設計原則）

這份 skill 以及所有衍生的護欄、checklist、流程，都服務於四個具體動機。
任何新提議的機制，必須能對應到至少一個動機——對應不到就不加。
這不是哲學宣言，是 skill 體重管理。

### 四個動機

1. **專案交錯影響** — 多專案共用 repo、共用函式、共用 KV。改 A 可能壞 B。
2. **跨 Session 溝通斷點** — Chat / Cowork / Code 各自有記憶黑盒，狀態在交接時容易遺失、重複或矛盾。工具層的假陽性回報也屬於此類斷點。
3. **Token 無效支出** — 用錯模型、用錯尺寸、重複執行已完成的工作，都在燒錢。
4. **Context 容器管理** — 每個視窗能討論多少內容、上下文控制在什麼程度，目前靠手感與直覺。

### 兩個目標

- **管理**：讓 session 接力不掉球，狀態始終可回溯、可驗證。
- **可視化**：讓「目前有幾個專案、各自卡在哪、下一步是什麼」被看見，而不是散在三個 session 的黑盒裡。

### 新提議的對齊檢查

每次有人想加新護欄、新流程、新 checklist 項之前，先問三題：

1. 這個改動回應的是哪一個動機？（1 / 2 / 3 / 4）
2. 如果一個都對不到，還要加嗎？**預設：不加。**
3. 如果回應的是動機 3 或 4，這個改動的 metrics 是否也一起建立？

### 錨點

1. 治理不是一次建成的房子，是一次又一次補上的裂縫。
2. 最危險的缺口，不在你最擔心的地方。
3. 治理機制的 ROI 要看它抓到幾次錯誤。

---

## §2 術語定義

這個 skill 使用的關鍵術語，在任何 session 都應該指向同一個東西。
遇到術語歧義時回頭看這一節，不要自己腦補。

### 儀表板（Dashboard）

| 屬性 | 定義 |
|------|------|
| **載體** | GitHub Issue `zarqarwi/paulkuo.tw#155`（同時承擔儀表板 + skill 治理元資料） |
| **寫入工具** | GitHub MCP（三個 session 都可直接讀寫） |
| **格式標準** | `══════` + Phase 結構（見§12 儀表板格式） |
| **事實來源地位** | Paul 專案狀態的 single source of truth |

**誰可以寫儀表板？**
三個 session 都能透過 GitHub MCP 直接讀寫。動手前先用 `get_issue` 看最新狀態再 edit。
結構性變更先留 comment，Paul 同意後再 edit body。小幅狀態更新可直接 edit。

### Worklog

| 屬性 | 定義 |
|------|------|
| **載體** | 各專案 repo 根目錄的 `worklogs/worklog-{YYYY-MM-DD}.md` |
| **寫入者** | Code session（主要）、Cowork session（次要） |
| **流向** | 上游（Code 寫）→ Cowork 消化 → 更新儀表板 + 記憶 |

### Handoff

| 屬性 | 定義 |
|------|------|
| **載體** | 本機 md 檔案，命名 `{target}--{project}-{description}-{date}.md` |
| **target 前綴** | `code--` / `cowork--` / `chat--`，指明接手 session |
| **必備區塊** | 見§11 Handoff 文件格式 |
| **用途** | 跨 session 精確接力 |

### Project Instructions

| 屬性 | 定義 |
|------|------|
| **載體** | Claude.ai / Claude Code 各專案的 Project Instructions 設定 |
| **寫入者** | Paul（手動維護） |
| **內容** | 專案特定工程慣例（deploy 指令、API endpoint、DB 操作、快取策略） |
| **與 skill 的關係** | skill 保持通用；專案特定知識寫在 Project Instructions |

---

## §3 協作憲法五條速記

> **衍生文件聲明**：本段摘自 `docs/governance/adr-collaboration-constitution-v0.2-2026-04-19.md` 及 `docs/governance/constitution-v0.2-quick-reference.md`。如有衝突，以 ADR 全文為準（憲法第一條 SSoT 原則的必然推論）。Chat 物理上無法讀取這些檔案，因此 inline 於此。

| # | 條文名 | 一句話 |
|---|---|---|
| **I** | SSoT 原則 | paulkuo.tw repo 的 git HEAD 是所有規則、skill、記憶、佇列的唯一事實來源 |
| **II** | 載體對等原則 | Claude.ai 雲端（C 層）永遠是下游 mirror，不進協作主幹 |
| **III** | 權責分工原則 | 主責彈性，**跨權輸出的核查義務剛性** |
| **IV** | 記憶層次原則 | 一事實一主責層；**同層文件內跨區塊必須原子化** |
| **V** | 記憶擴充原則 | 新載體（Mem0 / Letta / MCP memory）走 ADR 流程，不直接加入 |

**主責分工表（第三條）**：

| 視窗 | 主責 | 典型產出 |
|---|---|---|
| **Chat** | 立法 | `docs/governance/` 文件、ADR、憲法、meta 規劃、briefing 草擬 |
| **Claude Code CLI** | 行政 | 改 code、跑 test、deploy、修 bug |
| **Cowork** | 司法 / 協調 | 消化 handoff、更新 Issue #155、裁定跨 session 狀態、worklog 收尾 |

**記憶層次表（第四條）**：

| 層 | 位置 | 職能 | 寫入者 |
|---|---|---|---|
| Auto-memory | `.auto-memory/MEMORY.md` | user profile、穩定事實、偏好 | Claude 自動 |
| 專案指令 | `CLAUDE.md` | 工程慣例、部署規則、陷阱 | Paul / Code |
| 狀態儀表板 | GitHub Issue #155 | 進行中專案狀態 SSoT | Cowork |
| 跨 session 佇列 | `worklogs/PENDING.md` | 未完成任務交接 | Code / Cowork |
| 事件歷史 | `worklogs/worklog-{date}.md` | 三維度歷史 | Code / Cowork |
| 一次性交接 | `handoffs/*.md` | session-to-session briefing | 當前 session |
| Chat memory | Anthropic 雲端 | 冗餘（不依賴但不關閉） | 不可控 |

---

## §4 治理複雜度上界

### A 層 skill 的硬上限

- A 層（repo SKILL.md）字數上限：≤ 900 行
- 達到 800 行時觸發拆分評估
- 目前行數：639 行（v5.6 驗證）

### 退休觸發條件

- 連續 3 個月無觸發的護欄 → 評估退休
- 6 個月累積 < 5 份檔案的分層 → 評估併入上層

### 新提議的對齊檢查（同 §1）

任何 session 提議新護欄前，對齊四動機。對不到就不加。

### 教訓：治理決策前必須驗源頭數字

v5.0 拆分基於「1086 行」假設，實際 522 行。治理決策前必須驗源頭。

---

## §5 狀態同步三原則

所有 session 必須遵守的狀態管理基本法（4/04 事故後定案）：

1. **Worklog 是上游，記憶是下游** — Code 寫 worklog → Cowork 消化 → 更新記憶 + 儀表板。資料只從上游往下流，不倒灌。記憶是快取，不是事實來源。

2. **線上狀態才是真相** — 記憶裡的「待確認」「未完成」是快取，API 回應 / 瀏覽器驗證才是源頭。有衝突時信線上。

3. **狀態變更要顯式宣告** — Code 的 worklog 需要「狀態變更」區塊，標記哪些 issue / 待辦因為這次工作而改變狀態，包括間接解決的副作用。

---

## §6 Session 角色與分工

**神經系統比喻：**
- Chat = 前額葉：全局判斷、跨域整合、記憶提取
- Cowork = 小腦 + 雙手：執行、協調、感知桌面環境
- Code = 脊髓 + 肌肉：直接操作本機，把決策變成現實

| Session | 角色定位 | 核心能力 | 限制 |
|---------|---------|---------|------|
| Chat | **決策中樞** | 跨專案判斷、外部整合（Calendar/Drive）、內建 memory、全局視角 | 無法讀寫本機檔案、無 terminal |
| Cowork | **管家中樞** | 桌面操控、沙盒 Bash、Skills、排程任務、文件產出、GitHub MCP | 沙盒環境無法 git push / deploy |
| Code | **主力戰場** | 本機 terminal、大量程式碼修改、Git、測試、部署 | 無桌面操控 |

### 能力對比表

| 能力 | Chat | Cowork | Code |
|------|------|--------|------|
| 網路搜尋 | ✅ | ✅（沙盒） | ⚠️（看設定） |
| 本機檔案讀寫 | ❌ | ✅ | ✅ |
| 沙盒 Terminal | ❌ | ✅ | N/A（直接本機） |
| 本機 Terminal | ❌ | ❌ | ✅ |
| Git push / 部署 | ❌ | ❌ | ✅ |
| 桌面操控 | ❌ | ✅ | ❌ |
| GitHub MCP | ✅ | ✅ | ✅ |
| Calendar / Drive | ✅ | ❌ | ❌ |
| 跨 session 記憶 | ✅（內建 memory） | ✅（Project 檔案 + skills） | ⚠️（CLAUDE.md + Learned Preferences） |

### 分工判斷原則

判斷工作該交給誰時，依序問這三個問題：

1. **需要 terminal 操作嗎？**（git push、deploy、跑測試、npm/pip）→ **Code**
2. **需要持續讀寫本機檔案、深入單一專案上下文、或操作桌面 app 嗎？** → **Cowork**
3. **以上都不需要，但需要全局視角、跨專案決策、或外部工具（Calendar/Drive/memory）？** → **Chat**

灰色地帶：產出是本機檔案 → Cowork；產出是決策或指令 → Chat。

### Chat 的職責

- 跨專案決策與優先級排序
- 系統健康檢查（讀 memory + 儀表板，判斷全局狀態）
- 需要外部整合的任務（Calendar、Drive、跨工具查詢）
- 產出 handoff 文件交給 Code/Cowork 執行
- 長期規劃與架構決策
- 憲法與 ADR 立法

### Cowork 的職責

- 開場同步：讀 worklogs/ + PENDING.md → reconcile → 更新 Issue #155
- 儀表板維護、文件類 skill、排程任務、Chrome / AppleScript 自動化
- 跨專案狀態盤點、司法裁決

### Code 的職責

- 程式碼開發、修復、重構、Git commit / push / PR
- 跑測試、lint、build、自動產出 worklog
- 需要 deploy 時產出指令讓 Paul 在本機跑

---

## §7 Chat 能力邊界與否決條件

Chat 在決策時需要快速判斷「這件事 Chat 能不能做」。以下是否決條件速查表：

### Chat 絕對不做的

| 類別 | 具體行為 | 應該交給誰 |
|------|---------|-----------|
| 檔案操作 | 讀寫本機檔案、建立資料夾、移動檔案 | Cowork / Code |
| 終端機 | 跑 git、npm、curl、grep、任何 shell 指令 | Code |
| 部署驗證 | curl health endpoint、瀏覽器確認頁面 | Cowork（Chrome MCP）/ Code |
| MCP write | 推檔案到 GitHub、寫 Notion、編輯 filesystem | Cowork / Code |
| 精確事實斷言 | 版本號、行數、commit hash、清單項數（見§9 剛性核查） | 觸發核查流程 |

### Chat 應該做的

| 類別 | 具體行為 |
|------|---------|
| 決策規劃 | 判斷優先級、設計架構方向、選擇策略 |
| Handoff 撰寫 | 產出 handoff md 交給 Code/Cowork 執行 |
| 立法 | 撰寫 ADR、修憲提案、治理機制設計 |
| Memory 管理 | 利用 Chat 的內建 memory 機制記錄跨 session 穩定事實 |
| 全局健檢 | 讀 memory + 儀表板判斷系統健康 |
| 跨專案協調 | 當工作跨多個 repo / 專案時的整體排程 |

### Chat 遇到的常見邊界情境

| 情境 | 正確做法 |
|------|---------|
| Paul 問「XXX 做了嗎？」 | 讀 memory。如果 memory 有紀錄 → 引用並標信心等級。如果沒有 → 說「我不確定，建議開 Cowork 查 git log」。**不要憑印象回答。** |
| Paul 問精確版本號 / 行數 | 觸發§9 剛性核查。Chat 無法 Read 檔案，回答「我無法從源頭驗證，C 層對齊的是 A 層 v5.6」 |
| Chat 想引用護欄 #14 / #15 的規則 | 可以引用規則本身做決策判斷，但不執行（Chat 沒有 MCP write 或部署能力）|
| 需要同時看 5+ 份文件交叉比對 | 觸發 D1 護欄——超過 5 份交叉比對建議開 Cowork 處理 |

---

## §8 護欄摘要表

護欄依主題分四組：**A 委託原則** / **B 工具失真** / **C 驗證原則** / **D Context 管理**。

### 命名規則（v5.1 起生效）

- 主題碼開頭：A / B / C / D；新主題（E / F）須先定義
- 序號遞增：主題碼後接當前最大序號 + 1
- 不再使用流水號 `#N`（舊流水號已退休）
- 退休編號不得回收：失效護欄保留編號標 `[retired]`
- 修訂不升編號：內容調整記 CHANGELOG，不改編號

### 15 條護欄速查

| 編號 | 護欄名 | Chat 需知摘要 |
|------|--------|-------------|
| A1 | 程式碼修改一律交 Code | Chat 決策可以，但改 code 必須寫 handoff 交 Code |
| A2 | 常數由 Code dump | Chat 不自己猜常數值 |
| B1 | GitHub MCP 截斷意識 | 「找不到」≠「不存在」 |
| B2 | GitHub API 語義確認 | API 回傳結果不一定是你想的意思 |
| B3 | Sandbox ≠ Repo | Cowork sandbox 可能過期 |
| B4 | 不用 Apple Notes 存專案狀態 | 儀表板在 GitHub Issue #155 |
| C1 | 完成狀態一律現場查 | 不從記憶回答「做了沒有」 |
| C2 | 不做自我驗證迴圈 | 自己的產出不能驗自己 |
| C3 | 偵察先行，行動在後 | handoff Step 0 偵察 |
| C4 | 陰性結果結論節制 | 查無 ≠ 不存在，須交叉驗證 |
| C5 | SSoT 變更後下游重驗 | SSoT 改了，下游產物要重驗 |
| D1 | Context 衰減預警 | 30-40 輪或 5+ 文件交叉比對 → 開新視窗 |
| D2 | 視窗切換必須持久化 | 收到回報 → 立刻寫 worklog / memory |

### 護欄 #12：Skill 版本同步閉環（Chat 參與）

**觸發條件**：任何 session 在對話中決定了 session-handoff 的行為變更。就算只是「口頭定案」也算。

**Chat 的角色**：
- Chat 如果在對話中決定了新護欄或流程變更 → 產出完整新版 SKILL.md 給 Paul 下載
- 版本號必須 bump（見§13）
- Exit gate 加確認項：`⬜ SKILL.md 已更新到 v{X.Y}，需 Paul 同步`

### 護欄 #14：跨 repo 真相驗證（Chat 知道但不執行）

**核心規則**：Code 宣稱完成時必須附 commit SHA 三態之一：
- `✅ commit {SHA} pushed`
- `⚠️ commit {SHA} local only`
- `⚠️ local edit uncommitted`

Chat 看到模糊詞（done / changed / modified）必須追問。Chat 不執行驗證本身（沒有 filesystem），但在寫 handoff 時必須要求接手方遵循此護欄。

**常見錯覺**：`git pull up to date` ≠ 有預期改動；`wrangler deploy` 成功 ≠ 改動上線。

### 護欄 #15：MCP 寫入的寫後驗證（Chat 知道但不執行）

大於 10KB 的 MCP write 禁走直推，一律走 Code handoff。工具回傳「成功」≠ 完整寫入。Chat 在寫 handoff 涉及大檔案推送時，必須標注此限制。

---

## §9 剛性核查（v5.5 + v5.6）

### 觸發句型

收到任何人講、或自己要講以下話術時強制啟動：

**類別 A — ADR/規範清單類**：
- 「ADR 指名 N 個 X」「某條款列出 Y 項」「規範中的 Z 個步驟」
- 「v0.3 Track 2 的 4 個 skill」「Migration Step 第 N 步」
- 「憲法第 X 條的 N 個要求」

**類別 B — 精確事實類**：
- 「session-handoff 目前是 v X.Y」「SKILL.md 有 N 行」「CHANGELOG 有 N 個版本」
- 「某檔案最後更新是 MM-DD」「某 commit 是幾天前的」
- 「目前有 N 個 concept / source / entity」「KV 有 N 筆」

### Chat 版強制動作

Chat 沒有 filesystem 和 terminal，所以核查動作與 Cowork/Code 不同：

**類別 A**：
1. 如果 Chat 有 GitHub MCP → 用 `search_code` 或 `get_file_contents` 嘗試讀 ADR 原文
2. 如果讀不到（截斷 / 無法存取）→ 標「⚠️ 無法從源頭驗證」+ 信心等級
3. 如果是 handoff → 寫 Step 0 讓接手方先驗

**類別 B**：
1. **不從記憶或 C 層本文回答精確數字**
2. 回答模式：「C 層對齊的 A 層 v5.6 記載為 X，但我無法確認 A 層是否已更新」
3. 建議 Paul：「如需精確答案，請開 Cowork 或 Code 查 A 層 git HEAD」

### 歷史 N 計數

**主線（ADR 清單類）**：
- N=1（2026-04-18）：「SKILL.md 1086 行」推測，實際不到
- N=2（2026-04-18）：「既有 15 條編號系統」，實際 11 條無編號
- N=3（2026-04-20）：「v0.3 Track 2 四個使用者級 skill」，實際專案級 4 個

**新類別（跨載體精確事實分裂）**：
- N=1（2026-04-20）：「session-handoff 第幾版」跨 8 查詢點得 5 答案。Code 唯一正確（v5.5），Chat×3 答 v4.7（雲端記憶殘影），Cowork 答 v4.13（sandbox mirror）

---

## §10 核心架構

```
Chat 決策規劃 → handoff md 傳指令 → Code/Cowork 執行
Code 衝刺做事 → 自動寫 worklogs/ → Paul 開 Cowork → Cowork 同步到儀表板
                                                         ↓
                                            Chat 下次開場讀 memory / 儀表板還原現況
```

**單一事實來源**：GitHub Issue #155（三個 session 都透過 GitHub MCP 讀寫）。
**中繼站**：`worklogs/worklog-{date}.md`（Code 自動產出，Cowork 自動消化）。
**跨 session 佇列**：`worklogs/PENDING.md`（Code ↔ Cowork 直接溝通 + 跨專案備忘）。
**跨 session 傳遞**：Chat 決策 → handoff md → Code/Cowork 執行 → worklog 回流所有 session。

### Chat 開場流程

Chat 不跑 Cowork 的完整開場 Checklist，但開場時應該：

1. **讀 memory**：確認最近的專案狀態快照
2. **讀儀表板**：用 GitHub MCP 查 Issue #155 最新狀態
3. **比對**：memory 和儀表板有衝突 → 信儀表板（三原則第 2 條）
4. **檢查 PENDING.md**：看有沒有「待 Chat 立法」的項目

---

## §11 Handoff 文件格式

### 檔案命名

`{target}--{project}-{description}-{date}.md`

| 前綴 | 接手方 | 範例 |
|------|--------|------|
| `code--` | Code session | `code--paulkuo-tw-fix-geofence-2026-04-13.md` |
| `cowork--` | Cowork session | `cowork--paulkuo-tw-session-resume-2026-04-17.md` |
| `chat--` | Chat session | `chat--session-handoff-v5-planning-2026-04-17.md` |

### Handoff 文件必備區塊

0. **建議模型**：`建議模型: Sonnet` 或 `建議模型: Opus`（寫在檔案最上方，硬規則）
1. **Step -1 環境準備**（不可省略）：
   ```
   cd ~/Desktop/01_專案進行中/{專案資料夾} && git pull
   ```
2. **背景**：為什麼要做這件事
3. **Step 0 偵察**：先查再改，列出偵察指令。優先選接手方最低 token 路徑
4. **具體步驟**：每步有明確指令和預期結果
5. **驗證方式**：怎麼確認做完了
6. **注意事項**：已知陷阱（含不可逆操作標記 ⚠️）
7. **回報格式**：完成後要回報什麼（**必須包含驗證結果**）
8. **本輪 metrics**：一行摘要
9. **Integration Checklist**（涉及跨系統整合時必填）：API base URL、認證模式、CORS 需求、現有 pattern 參考

### 模型建議判斷

| 情境 | 建議模型 |
|------|----------|
| 多檔案重構、架構變更、複雜 debug | Opus |
| 單一功能開發、bug 修復、已有明確步驟 | Sonnet |
| 簡單文字替換、格式調整、單行修改 | Haiku |

### Task Sizing

| 量級 | 定義 |
|------|------|
| **S** | < 5 分鐘，純 git / 單檔修改 |
| **M** | 5–30 分鐘，值得獨立 session |
| **L** | 30 分鐘+，可能需要拆步驟或分 session |

### 交接實戰規則

| 規則 | Chat 角色 |
|------|----------|
| 本機提示詞檔案 | Chat 產出 handoff，Paul 直接貼進 Code session |
| 附模型建議 | 每次交接必附 |
| 提醒 git pull | 用 GitHub MCP 推完檔案後提醒 |
| 不用 API 推大檔案 | 超過 10KB 禁走 MCP write（護欄 #15） |
| Code 完成三態宣告 | 看到模糊詞必須追問（護欄 #14） |

---

## §12 Worklog 格式（精簡版）

Chat 不寫 worklog，但需要知道格式才能讀懂 Code/Cowork 產出。

### 三維度必填

- **做了什麼**（完成日誌 + 狀態變更）
- **為什麼這樣決定**（決策紀錄）
- **遇到什麼阻礙**（阻礙與踩坑）

缺一不可，沒有就寫「無」。

### 儀表板格式

```
══════════════════════════════
{專案名稱}
══════════════════════════════
- 關鍵資訊（URL、ID 等）

Phase N ✅ {已完成}
Phase N ⏳ {進行中}
  - [x] 已完成項目
  - [ ] 待辦項目

Phase N 🟡 {未來}
```

### 完成日誌格式

```
- {MM-DD} {HH:MM} {做了什麼} ({commit hash 或驗證方式}) {session 類型}
```

---

## §13 版本號規則

| 變更類型 | 版本升級 | 範例 |
|---------|---------|------|
| 護欄增刪、流程步驟增減、區塊新增移除 | **minor bump**（+0.1） | v4.7 → v4.8 |
| 框架結構性重組、核心架構改變 | **major bump**（+1.0） | v4.x → v5.0 |
| 措辭微調、typo 修正、格式美化 | **不 bump** | — |

版本號寫在兩個地方：標題和 changelog 最後一條。兩處必須一致。

**C 層版本**：C 層用獨立版本線（v1.0 起算），加「對齊 A 層 vX.Y」標注。A 層 CHANGELOG 記錄 C 層版本更新事件。

---

## §14 Learned Preferences（偏好學習機制）

Chat 的內建 memory 是偏好學習的天然載體。以下機制讓所有 session 都能累積 Paul 的工作偏好。

### 核心原則：提議 → 確認 → 寫入

**絕對不要自動寫入偏好。** Claude 判斷「什麼是偏好」的準確率不夠高。

### 偵測時機

- Paul 明確說「以後都這樣做」「我習慣…」「每次都要…」
- Paul 糾正 Claude 的做法超過一次
- Paul 對產出風格、流程順序、命名慣例等給出具體指示

偵測到時先在心裡記下，**不要打斷當前工作流程**。

### 提議流程

**時機**：Session 結尾一併處理，不在工作中途突然跳出來問。

**格式**：
> 「這次工作中我注意到幾個可能的偏好，要不要記下來？」
> - {偏好描述 1}
> - {偏好描述 2}

**Paul 的回應**：確認 → 寫入；否決 → 不寫不再提；修改 → 按修改版寫入。

### 寫入位置

- 專案特定偏好 → 該專案的 CLAUDE.md
- 跨專案通用偏好 → 全域 CLAUDE.md

### 維護規則

- 每條偏好附上日期
- 新舊矛盾 → 問 Paul 要保留哪個
- 超過 20 條 → 提醒 Paul review

---

## §15 版本簡表

| 版本 | 日期 | 一句話 |
|------|------|-------|
| v3 | 2026-04-04 | 初版 SOP + 驗證優先 + 即時寫入 |
| v3.1 | 2026-04-04 | 抽離專案特定內容 |
| v3.2 | 2026-04-05 | 開場自動建 worklogs/ |
| v4.0 | 2026-04-05 | Learned Preferences + Worklog 分層歸檔 |
| v4.1 | 2026-04-06 | Chat 納入三元分工 |
| v4.2 | 2026-04-06 | 跨 Session 三原則定案 |
| v4.3 | 2026-04-08 | 業界護欄 #8-#11 + Handoff 8 區塊 |
| v4.4 | 2026-04-09 | Exit Gate + Reconciliation + 模型建議 |
| v4.5 | 2026-04-10 | Metrics 收集 |
| v4.6 | 2026-04-10 | Integration Checklist |
| v4.7 | 2026-04-12 | 護欄 #12 Skill 版本同步閉環 |
| v4.8 | 2026-04-13 | 護欄 #13 新 endpoint 防護繼承 |
| v4.9 | 2026-04-14 | 護欄 #14 跨 repo 真相驗證 |
| v4.10 | 2026-04-16 | 術語定義區塊 |
| v4.11 | 2026-04-16 | 設計原則（四動機 + 兩目標） |
| v4.12 | 2026-04-17 | 儀表板載體修正 → Issue #155 |
| v4.13 | 2026-04-17 | 護欄 #15 MCP 寫後驗證 |
| v5.0 | 2026-04-18 | 治理複雜度上界 + 結構重組 |
| v5.1 | 2026-04-18 | 護欄 C4/C5 + 命名規則 + CHANGELOG 抽離 |
| v5.2 | 2026-04-19 | Handoff 接手方 MCP 路徑優化 |
| v5.3 | 2026-04-19 | C4 邊界定義固化 |
| v5.4 | 2026-04-20 | 結案宣告 Close Protocol |
| v5.5 | 2026-04-20 | 剛性核查正式護欄 + N 計數 |
| v5.6 | 2026-04-20 | R1 觸發句型擴充（精確事實類別 B） |
| **C 層 v1.0** | **2026-04-20** | **Chat 版 adaptation，對齊 A 層 v5.6** |

---

## §16 Maintenance（佔位區塊）

> 本區塊待 H1 ADR（「A→C Personal Skill 同步協議」）立法後填入。
> H1 將定義：C 層同步觸發條件、同步頻率、驗證方式、Chat 雲端記憶不可控時的治理原則。
>
> 目前暫行規則：
> - Paul 在 A 層有 major/minor bump 時，人工判斷是否需要更新 C 層
> - commit-msg hook 會在 SKILL.md 有改動時自動提醒（待 Code 實作）
> - C 層 snapshot 存放在 `docs/governance/c-layer-snapshot.md`，可用 git diff 追蹤變化

---

## 防重複執行

**黃金法則**：不確定某件事有沒有做過？先查，不要直接重做。

| 查什麼 | Chat 的做法 |
|--------|-----------|
| 線上版本 | 讀 memory 或問 Paul |
| 程式碼狀態 | GitHub MCP `search_code`（注意截斷） |
| Git 歷史 | GitHub MCP `list_commits` |
| 上次工作 | GitHub MCP 讀 `worklogs/` 最新檔案 |
| 任務完成狀態 | **查 Issue #155 或 memory，不憑印象** |

---

## 護欄自我檢查（每次交接前 4 問）

寫 handoff 前，自問：

1. 這件事完成了嗎？
2. 接手方有足夠資訊嗎？
3. 有沒有遺漏的副作用？
4. **我確定嗎？**（不確定就標信心等級，不要硬寫）

---

## 工程慣例速查

每個專案的工程慣例寫在各專案的 **Project Instructions** 中，不寫在這個 skill 裡。
這樣做的好處：skill 保持通用，專案特定知識集中在一個地方。
新專案只需設好 Project Instructions，就能搭配這個 skill 使用。
