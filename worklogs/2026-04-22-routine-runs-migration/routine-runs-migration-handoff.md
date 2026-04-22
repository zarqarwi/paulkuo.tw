# Scheduled Tasks → Routine Runs 遷移計畫 Handoff

> **建立時間**：2026-04-22
> **最後更新**：2026-04-22（採路徑 1：get_筆記 推 private repo，scanner 可搬雲端）
> **來源 session**：Cowork（本次對話）
> **目標 session**：LLM Wiki 專案下新開的 Cowork session
> **處理者**：Paul + Claude（新 session）
> **狀態**：待 get_筆記 repo 化 → 待合併 → 待 probe → 待搬遷

---

## 一、Context：為什麼要做這件事

Paul 最近升級 Claude desktop app，發現 **Settings → Usage → Additional features** 有一個新功能「**Daily included routine runs**」，每日 15 次獨立配額（不吃 Max/Sonnet 額度）。

目前 Paul 用的是 MCP 工具 `scheduled-tasks`（存在本機 `/Users/apple/Documents/Claude/Scheduled/`），觸發需要 Mac app 開著。Paul 評估過他大多數 schedule 需求都**不需要綁本機**，所以想把能搬的搬到雲端 routine runs。

**但搬之前要先合併。** LLM Wiki 光 schedule 就吃掉 5 個（每日觸發 4 次、週三 5 次），管理成本已經超過優化效益。散搬到雲端只會把問題帶到雲端，沒解決根本。

**兩者差異：**

| 項目 | `scheduled-tasks`（現況）| Routine runs（目標）|
|---|---|---|
| 儲存 | 本機 `/Users/apple/Documents/Claude/Scheduled/` | Claude 雲端 |
| 觸發 | Mac app（要開著）| Anthropic 伺服器 |
| 計費 | 走 Max / extra usage | 獨立 15 次/日配額 |
| 建立方式 | MCP 工具 | Claude app UI（目前無 MCP）|

**關鍵限制：** Routine runs 目前沒有 MCP 工具可程式化建立，必須在 Claude app UI 手動建立。

---

## 二、現況盤點：目前所有 scheduled tasks

（來源：`mcp__scheduled-tasks__list_scheduled_tasks` @ 2026-04-22）

### 🟢 啟用中、需要搬遷或合併（8 個）

| # | taskId | 描述 | Cron | 依賴 | 搬雲端可行性 |
|---|---|---|---|---|---|
| 1 | `gsc-monitor-gmail` | 掃 Gmail 中 GSC 通知信，分析並修程式碼 | `0 9 * * 1,4` 週一/四 09:04 | Gmail MCP, 本機 repo, git | ⚠️ 需拆分 |
| 2 | `gsc-api-deep-check` | GSC 網頁版深度檢查，產出報告 | `0 10 1,15 * *` 每月 1、15 號 10:00 | GSC（可能需瀏覽器）| ⚠️ 待驗證 |
| 3 | `wiki-ingest-scanner` | 掃 get_筆記 新增內容，產出 wiki ingest 待處理清單 | `0 10 * * *` 每日 10:02 | ~~Apple Notes MCP~~ → **get_筆記 GitHub private repo**, wiki repo | ✅ 可搬（經路徑 1 重構）|
| 4 | `wiki-knowledge-digest` | 每週三掃 wiki 近期變化，產出知識摘要 | `0 10 * * 3` 週三 10:07 | wiki repo（讀取）| ✅ 可搬 |
| 5 | `wiki-web-collector` | 每日搜 pillar 關鍵字，存入 wiki/raw/clips/ | `30 9 * * *` 每日 09:37 | Web search, wiki repo | ✅ 可搬（需改 GitHub API 寫入）|
| 6 | `wiki-youtube-pull` | 每日從 KV 拉 YouTube pending，寫入 wiki/sources/ | `10 10 * * *` 每日 10:19 | Cloudflare KV API, wiki repo, 本機 cjs script | ⚠️ 需改寫 |
| 7 | `governance-metrics-collector` | 收集各專案 GitHub 活動，commit JSON 到 repo | `30 10 * * *` 每日 10:33 | GitHub API, git push | ✅ 可搬（需改 GitHub API 寫入）|
| 8 | `cross-project-impact-scanner` | 掃近期 git commits 是否動到共用檔案但漏標注 | `30 10 * * *` 每日 10:33 | GitHub API 或本機 git | ✅ 可搬 |

### 🔴 已停用、不用搬（7 個，建議之後清掉）

- `formosa-canary-health-check` — 已廢棄（EGRESS_BLOCKED），改用 GitHub Actions
- `formosa-health-check` — 已廢棄，同上
- `formosa-feedback-triage` — 4/21 已結案
- `formosa-412-cron-reminder` — one-time 已觸發
- `formosa-verification-final-update` — one-time 已觸發
- `formosa-worker-deploy` — one-time 已觸發
- `formosa-clear-test-data` — one-time 已觸發

---

## 三、原始 handoff 的三個盲點（2026-04-22 補）

這份 handoff 第一版有三個關鍵盲點，必須在動手前先釐清。

### 盲點 1：Apple Notes 是**規格債**，scanner 其實可以搬雲端

原版 handoff 寫「scanner 綁 Apple Notes 永遠不能搬」，這是錯的。

**實際調查（2026-04-22）：**
- get_筆記內容不在 Apple Notes，而在本機 `~/Desktop/01_專案進行中/get_筆記/notes/`
- 有獨立 Python 管線 `sync_notes.py` 每晚 23:00 cron 打得到 API 抓回 md
- 9 個 visibility 資料夾結構都在本機 notes/ 下，每個 md 的 frontmatter 已有 note_id / tags
- scanner 原本寫「呼叫 Apple Notes MCP」是**過時的規格**（早期可能走 iCloud 同步到 Apple Notes，後來改直接打 API 抓本機）

**Paul 已確認採路徑 1：**
- 把 `~/Desktop/01_專案進行中/get_筆記/` 推 GitHub **private** repo
- scanner 改讀 GitHub API（而非 Apple Notes MCP）
- 整個 `wiki-daily-pipeline` 因此可搬雲端

**詳細執行清單** 見 `wiki-schedule-merge-design-2026-04-22.md` 第七節。重要前置：

- ⚠️ `sync_notes.py` hardcode 了得到 API 金鑰，**必須先搬 .env 再 git init**
- ⚠️ 建議旋轉金鑰（現有金鑰歷史上只在本機，但趁機換掉較安全）
- private repo 建立後立即檢查 settings，避免意外轉 public

### 盲點 2：Routine runs 產出要存哪裡？Enrichment 在哪跑？

原版 handoff 只說「改成 GitHub API 直接 commit」，沒處理中間的 LLM 處理環節。

**wiki ingest 實際流程不是單純「搬檔案」：**

```
原始素材 → LLM enrichment（concept 提取、entity 提取、frontmatter 補齊、中文 slug）→ commit
```

**必須驗證：**
1. Routine runs 內的 Claude session 能不能呼叫 Anthropic API 做 enrichment？還是只能做「搬運工」不能做「加工」？
2. 若只能搬運，雲端 routine 就只能 commit raw 內容，enrichment 要等本機 session 處理
3. 若能加工，整條管線可以雲端一條龍

**Phase 0 probe 必須測的項目：**
- [ ] Routine run 內能否呼叫 `fetch` 或 SDK 做額外 LLM inference
- [ ] 能否讀寫 Cloudflare KV（MCP 是否可用）
- [ ] GitHub API commit 後 Actions 會不會觸發（影響 governance Dashboard）

### 盲點 3：合併優先於搬遷（本文件新重點）

原版 handoff 把 8 個 task 散著搬，沒處理「本來就該合併」的問題。Paul 已確認**這週治理工程的關鍵是把散落的管線整合**。

**新順序：**

1. **先合併**：把 5 個 wiki-related task 合併成 3 個（見 `wiki-schedule-merge-design-2026-04-22.md`）
2. **再搬遷**：合併穩定後，只搬「不依賴本機資源」的 task
3. **保留本機**：依賴 Apple Notes / 本機腳本的 task 留在本機

---

## 四、風險與必須先釐清的疑慮

### ⚠️ 風險 1：15 次/日配額會不會爆？

**合併後**每日雲端觸發次數（路徑 1 後三個 wiki task 都搬雲端）：

- 每日：`wiki-daily-pipeline`(1) + `cross-project-governance`(1) = 2 次/日
- 週三加：`wiki-weekly-digest`(+1) = 3 次
- 週一/四加：`gsc-monitor-gmail`(+1) = 3 次
- 每月 1、15 加：`gsc-api-deep-check`(+1) = 3 次

**結論：雲端日常 2~3 次，遠低於 15 次上限。** ✅

另有一個**每晚本機 cron**（不吃雲端配額）：
- 23:00 `sync_notes.py` → get_筆記 API → 寫本機 → auto git push

但要注意：**每次 routine run 內部若觸發子任務或重試，可能會燒掉多個額度**（待 Phase 0 probe 驗證 routine run 的計費粒度）。

### ⚠️ 風險 2：Routine runs 的沙盒能力邊界未知

大多數 task 需要：
- **git push 到 repo** → routine run 雲端能做嗎？必須改用 GitHub API，且要處理 Token 管理
- **寫入本機 wiki/ 資料夾** → 雲端不存在這個路徑，必須改成 GitHub API 直接 commit
- **讀取 get_筆記** → ✅ 路徑 1 後改讀 GitHub private repo，雲端可用
- **外部網路 egress** → Paul 備註「沙盒 EGRESS_BLOCKED」，Formosa 健康檢查因此廢棄。routine runs 是否有同樣限制？**必須 probe**

### ⚠️ 風險 3：MCP 可用性

Routine runs 可以用哪些 MCP？目前用的 MCP 包括：
- Gmail（a5de322a...）
- GitHub（含 private repo 讀寫）
- Cloudflare（含 KV）
- Web search / Brave search

**必須先驗證**這些 MCP 在 routine runs 裡面是否可用、怎麼授權。Apple Notes 已從依賴清單移除。

### ⚠️ 風險 4：成本

Paul 這個月 extra usage 已經 $1,313（88%）。雖然 routine runs 有獨立 15 次/日免費配額，但**若超過 15 次會不會回落到 extra usage 計費？** 需確認。

### ⚠️ 風險 5：GitHub API commit 能否觸發 Actions

`governance-metrics-collector` 依賴 git push → Actions → KV seed → Dashboard 更新這條鏈。

**若改用 GitHub API commit：**
- 一般 PAT commit 預設**會**觸發 Actions
- 但若用 GitHub App Token，預設**不會**觸發（避免 workflow 無限循環）
- 必須在 Phase 0 probe 確認 routine runs 用的是哪種身份

---

## 五、建議的搬遷策略（分階段，採路徑 1 後的版本）

### Phase 0：get_筆記 repo 化（必做，路徑 1 前置）

**目標：把 scanner 的上游從 Apple Notes 假依賴，換成 GitHub private repo。**

詳見 `wiki-schedule-merge-design-2026-04-22.md` 第七節。摘要：

- 金鑰搬 `.env` + 建立 `.gitignore`
- `git init` + 建 `zarqarwi/get-biji-notes` private repo + 首次 push
- 改 `sync_notes.py` 加自動 `git push`
- 觀察 3 晚 cron 穩定後才往下走

### Phase A：合併（本機 scheduled-tasks 內完成）

**目標：降低訊息干擾、讓管線看得懂，再決定搬什麼。**

依據 `wiki-schedule-merge-design-2026-04-22.md`：

1. 建立 `wiki-daily-pipeline`（每日 09:30，取代 web-collector + ingest-scanner + youtube-pull）
2. Task 1 scanner 先用**本機 filesystem 版**測試邏輯（讀 `~/Desktop/01_專案進行中/get_筆記/notes/`），避開 Apple Notes MCP
3. 建立 `wiki-weekly-digest`（週三 10:00，取代 wiki-knowledge-digest）
4. 建立 `cross-project-governance`(每日 10:30，取代 governance-metrics + cross-project-impact)
5. 測試三個新 task 穩定一週
6. 停用舊的 5 個 wiki/governance task（保留 enabled=false 兩週做為 rollback）

### Phase B：Routine runs 沙盒驗證

**目標：找出 routine runs 沙盒的能力邊界。**

在 Claude app 手動建立一個測試 routine：**`routine-sandbox-probe`**

Prompt 必測項目：
- [ ] 列出可用 MCP（特別是 GitHub / Cloudflare / Brave / Gmail / web fetch）
- [ ] 測試能否對外 egress（Formosa 被擋過，routine runs 呢？）
- [ ] 測試能否呼叫 Anthropic API 做額外 LLM 處理（影響 enrichment 能否雲端做）
- [ ] GitHub commit 用什麼身份？能否觸發 Actions？
- [ ] 能否讀 private repo（讀 get-biji-notes 是 scanner 雲端化的關鍵）
- [ ] 測試 routine 內部呼叫多個 MCP 是否各算一次配額，還是整個 routine 算一次
- [ ] 回報 sandbox 環境資訊（OS、Node/Python 版本、可用 bash 指令）

頻率：one-time 或手動觸發

### Phase C：搬雲端（三個 wiki task 全搬 + 其他）

1. `wiki-weekly-digest`（週三）— 最安全，優先
2. `cross-project-governance`（每日）— 全部走 GitHub API
3. `wiki-daily-pipeline`（每日）— scanner 改讀 get-biji-notes GitHub repo
4. `gsc-monitor-gmail` — 拆成「偵測 + 通知 Paul 開 Code session」兩段
5. `gsc-api-deep-check` — 若需瀏覽器互動，用 Claude in Chrome MCP

### Phase D：收尾

1. Phase C 雲端 task 跑穩兩週後，停用本機對應項目
2. 清掉 🔴 標記的 7 個已廢棄 task
3. 留一份「scheduled-tasks 保留清單」作為備援（防 routine runs 失效，例如 get_筆記 sync 這條保留本機）
4. 更新 Issue #157，列出最終 task 清單與 ownership（本機/雲端）

---

## 六、新 Session 要做的事（Action Items）

**給 LLM Wiki Cowork session 的任務清單：**

- [ ] 讀完本 handoff + `wiki-schedule-merge-design-2026-04-22.md`
- [ ] **Phase 0 優先**：get_筆記 repo 化（搬金鑰、git init、建 private repo、改 sync_notes.py 自動 push）
- [ ] Phase 0 觀察 3 晚 cron 穩定後才往下
- [ ] **Phase A 合併**：實作 3 個新 task，scanner 先用本機 filesystem 版，穩定一週
- [ ] **Phase B probe**：手動在 Claude app 建立 `routine-sandbox-probe`，跑完回報能力邊界
- [ ] 根據 probe 結果，把 task prompt 改寫為 routine run 版本（純 GitHub API 路徑）
- [ ] 把改寫後的 prompt 整理成「複製貼上包」，Paul 手動建立在 Claude app UI
- [ ] 建立追蹤表（artifact 或 wiki 頁面）：每個 task 的狀態、驗證結果、首次跑完結果
- [ ] Phase C 跑一週後，決定是否 Phase D 收尾
- [ ] 全部搬完後，disable 對應的 `scheduled-tasks`，更新 Issue #157

---

## 七、參考資料

- 現有 scheduled-tasks 清單：見本文件第二節
- **合併設計稿**：`worklogs/2026-04-22-routine-runs-migration/wiki-schedule-merge-design-2026-04-22.md`
- Claude desktop app 升級後的 Routine runs 位置：Settings → Usage → Additional features → Daily included routine runs（15 次/日）
- Paul 本月 extra usage：$1,313.93 / $1,500（88%）— 搬遷後觀察是否下降
- 跨專案治理背景：本週治理工程重點，詳見 Issue #155 總覽儀表板

---

## 八、交接給新 Session 的開場建議

到 LLM Wiki 專案新開 Cowork session 後，貼這段作為開場：

```
我要處理 scheduled-tasks 合併 + routine runs 搬遷（採路徑 1：get_筆記 repo 化）。
先看兩份文件（已 push 到 paulkuo.tw repo）：
1. worklogs/2026-04-22-routine-runs-migration/wiki-schedule-merge-design-2026-04-22.md
2. worklogs/2026-04-22-routine-runs-migration/routine-runs-migration-handoff.md

順序：
Phase 0（get_筆記 推 private repo，必做前置）
→ Phase A（合併，本機 scheduled-tasks）
→ Phase B（雲端 probe）
→ Phase C（三個 wiki task 全搬雲端 + GSC 兩個）
→ Phase D（收尾 + 更新 Issue #157）

⚠️ Phase 0 第一步必須先把 sync_notes.py 的 API 金鑰搬 .env，再 git init。
直接 git init push 會把金鑰寫進 GitHub commit 歷史，即使刪也難救。

建議模型：
- Phase 0 / A / C 程式改寫：Sonnet 4.6（中度推理 + 工具使用）
- Phase B probe：Haiku 4.5（單一任務、回報為主）
- Phase D 收尾：Haiku 4.5（盤點 + 文檔更新）
```

---

**結束。新 session 接手時請先問 Paul 有沒有補充或修正。**
