# 多 Session 協作狀態管理 SOP v4.7

Paul 同時使用 Code 和 Cowork 兩種 session 協作。
Code 是主力戰場（程式碼、部署、工程），Cowork 是管家中樞（管理決策、文件、同步、自動化）。
這份 SOP 確保狀態不會在交接時遺失或重複。

> **v4.7 變更**：Worklog 格式升級為三維度必填（做了什麼/決策紀錄/阻礙與踩坑）。
> 與 CLAUDE.md 同步。原「技術備忘」區塊拆分為「決策紀錄」和「阻礙與踩坑」兩個獨立區塊。
>
> **v4.6 變更（2026-04-10）**：Handoff 文件必備區塊新增「Integration Checklist」（第 8 項）。
> 解決 Code 未對齊 codebase 現有 pattern 導致 API_BASE 錯誤、CORS 遺漏的問題（4/09 事故）。
>
> **v4.5 更新（2026-04-09）：** 新增 metrics 收集步驟 + 專案治理框架（governance）

> **v4.4 更新（2026-04-09）：**
> - Issue #155 自動同步：編輯 `worklogs/issue-155-body.md` → push → `sync-dashboard` Action 自動 PATCH Issue body
> - `worklogs/PENDING.md` 新增「跨專案備忘」section，所有 Cowork 專案開場掃這個
> - Handoff 文件必須標注**建議模型**（Opus/Sonnet/Haiku），這是跨所有專案的硬規則
> - Cowork session 一律 Opus 4.6；Code session 依 handoff 標注選模型
> - GitHub MCP `get_issue`/`update_issue` 有 issue_number 型別 bug，讀 Issue 用 `search_issues`，寫 Issue 用 sync-dashboard Action

> **v4.3 更新（2026-04-09）：** 儀表板從 Apple Notes 遷移至 GitHub Issue #155。
> Apple Notes 9,000+ 筆導致 MCP 嚴重卡頓（list_notes 60s timeout、get_note_content 不穩定）。
> GitHub Issue 透過 GitHub MCP 讀寫秒回，且原生支援 Markdown checkbox。

> **v4.2 更新（2026-04-06）：** 新增 Cowork 鐵律 #10「Sandbox ≠ Repo」+ 開場 Step 0 偵察。
> 源自 Wiki Phase 4 事故：Cowork sandbox 掛載的 concepts/ 只有 10 個，實際 repo 有 17 個，
> 導致整份 Cross-Pillar 分析基於錯誤資料，建了 3 個跟 repo 已有概念重疊的頁面。

> **v4.1 更新（2026-04-05）：** Cowork 開場 Checklist 新增「步驟 3.5 抽查 remote」。
> 源自 RFC #100 事故：worklog 聲稱完成但程式碼從未 push 到 main。

> **v4 更新（2026-04-04）：** 新增 Reconcile 步驟、Worklog「狀態變更」區塊、記憶寫法慣例。
> 源自三項待辦全標未完成但實際已結案的事故（Feedback #5 / mazu.today 根目錄 / Worker 名稱）。

> **v3 更新（2026-04-04）：** Cowork 工作邊界、狀態驗證規則、context 衰減管理。
> 源自碳排係數重複列辦事故 + 幻值事件 + RFC #100 誤判事件。

---

## 狀態同步三原則（v4 新增）

1. **Worklog 是上游，記憶是下游。** Code 寫 worklog → Cowork 消化 → 更新記憶 + 儀表板。資料只從上游往下流，不倒灌。
2. **線上狀態才是真相。** 記憶是快取，API 回應 / 瀏覽器驗證 / git log 才是源頭。有衝突時信線上。
3. **狀態變更要顯式宣告。** Code 的 worklog 要標記哪些 issue / 待辦因為這次工作而改變狀態，包括間接解決的副作用。

---

## Cowork 工作邊界（v3）

### 鐵律

1. **程式碼修改一律交 Code。** Cowork 不直接改程式碼，超過 5KB 的 GitHub 檔案操作不碰（2026-03-31 截斷事故教訓）。

2. **含程式碼常數的文件，流程是 Code dump → Cowork 排版。** Cowork 不自己讀 code 來填常數。等級門檻、碳排係數、rate limit 數值等，一律由 Code 先匯出，Cowork 只負責排版成文件。如果必須引用常數，標註「待 Code 驗證」直到確認。

3. **對話超過 30-40 輪來回，或一次交叉比對超過 5 份文件，準備開新視窗。** Context 衰減會讓早期的精確資訊變模糊，增加幻覺風險。把結論寫進 worklog 或 memory，讓新視窗接手。

4. **任何「完成/未完成」的狀態判斷，一律現場查 git log，不從記憶回答。** Memory 只記「為什麼」和「怎麼做」，不記「做了沒有」。完成與否，每次現場查。

5. **Cowork 不做自我驗證迴圈。** Cowork 產出的文件 A，不能拿文件 A 當基準去驗證文件 B。要驗就查原始碼或交 Code 驗。（2026-04-04 幻值事件根因）

6. **Cowork 視窗切換時必須持久化。** 收到 Code 的完成回報後，立刻寫進 worklog 或更新 memory。不能只在對話裡確認就算 — 下一個視窗看不到這個對話。

7. **偵察先行，行動在後。** Cowork 開給 Code 的工單，第一步永遠是 Step 0 偵察（grep / git log / PRAGMA），不是直接改 code。

8. **GitHub MCP 大檔案截斷風險。** Cowork 用 GitHub MCP 讀超過 1000 行的檔案可能被截斷。如果搜尋結果是「找不到」，不能判定為「不存在」，要標記為「未確認，需 Code 用本機 grep 驗證」。（2026-04-04 RFC #100 誤判事件教訓）

9. **GitHub API 回傳結果要確認語義。（v4.1 新增）** API 有回傳結果 ≠ 結果的意思是你想的。例如 `list_commits(path=某檔案)` 回傳的是「tree 包含該檔案的 commits」，不是「改動該檔案的 commits」。要確認因果關係，必須查 diff。（2026-04-05 事故教訓）

10. **Sandbox ≠ Repo，涉及 repo 檔案一律用 filesystem MCP 讀 Paul 電腦。（v4.2 新增）** Cowork 的 sandbox 掛載可能是 repo 的子集或過期快照。在開始任何涉及 repo 檔案的分析或編輯前，必須用 `mcp__filesystem__read_file` 或 `mcp__filesystem__list_directory` 讀取 Paul 電腦上的實際 repo（路徑見各專案 Project Instructions）。**絕對不要基於 sandbox 的檔案列表做判斷。**（2026-04-06 Wiki Phase 4 事故教訓：sandbox 只有 10 個 concept，repo 有 17 個，導致整份分析無效）

### Cowork 適合做的
- 文件產出（但常數由 Code 提供）
- 排程管理
- GitHub Issue #155 同步
- Chrome 瀏覽器驗證
- 開工單給 Code
- 盤點狀態（先查 git log 再回答）
- 跨專案協調

### Cowork 不適合做的
- 直接修改程式碼
- 超過 5KB 的 GitHub 檔案推送
- 獨立填寫程式碼常數（沒經 Code 驗證的數值）

### 灰色地帶
- 技術參考文件 — 看起來像文件工作，但內容全是程式碼常數。正確流程：Code dump 常數 → Cowork 排版。

---

## 核心架構

```
Code 衝刺做事 → 自動寫 worklogs/ → ⭐ 收集 metrics → Paul 開 Cowork → Cowork 更新 issue-155-body.md → push → Action 自動同步 Issue #155
```

**單一事實來源**：GitHub Issue #155「🎛️ 專案狀態儀表板」（zarqarwi/paulkuo.tw）。
**Repo 內版本**：`worklogs/issue-155-body.md`（push 到 main 自動 PATCH Issue #155）。
**中繼站**：repo 內 `worklogs/worklog-{date}.md`（Code 自動產出，Cowork 自動消化）。
**跨 session 佇列**：`worklogs/PENDING.md`（Code ↔ Cowork 直接溝通 + 跨專案備忘）。
**指標儲存**：`worklogs/metrics/{project_id}/{date}-{session_type}.json`（每次 session 自動產出）。
**治理登記**：`worklogs/governance/projects.json`（6 專案）+ `worklogs/governance/automation-registry.json`（自動化覆蓋率）。

---

## Session 角色與分工

| Session | 角色定位 | 核心能力 | 限制 |
|---------|---------|---------|------|
| Code | **主力戰場** | 大量程式碼修改、Git、測試、終端機、MCP、web search | 無法 wrangler deploy（網路限制） |
| Cowork | **管家中樞（Opus 4.6）** | 管理決策、Issue #155 維護、Skills、排程任務、文件產出 | 不適合深度程式碼修改，GitHub MCP 有截斷風險 |

### Code 的職責
- 程式碼開發、修復、重構
- Git commit / push / PR
- 跑測試、lint、build
- **自動產出 worklog**（寫到 `worklogs/worklog-{date}.md`），含「狀態變更」區塊
- 需要 deploy 時，產出指令讓 Paul 在本機跑
- **常數匯出**：Cowork 需要程式碼常數時，由 Code grep 匯出

### Cowork 的職責
- **開場同步**：讀 `worklogs/` + `PENDING.md` → reconcile 記憶 → 抽查 remote → 更新 `issue-155-body.md`
- Issue #155 儀表板維護（編輯 `worklogs/issue-155-body.md` → push → Action 自動同步）
- 文件類 skill（文章撰寫、社群貼文、簡報、PDF）
- 排程任務管理
- Chrome / AppleScript 自動化
- 跨專案狀態盤點（透過 PENDING.md 跨專案備忘 section）

---

## 狀態驗證規則（v3）

### 盤點任務時的三層比對

Cowork 判斷任務狀態時，永遠不信任記憶快照，一律現場驗證：

| 層級 | 驗證什麼 | 工具 | 判定 |
|------|----------|------|------|
| 1. 聲稱層 | Memory / worklog 說了什麼 | 讀 memory + worklogs/ | 這只是聲稱 |
| 2. 程式碼層 | git log 有沒有對應 commit | `list_commits` / GitHub MCP | commit 在 main = 程式碼已寫 |
| 3. 部署層 | 線上版本有沒有生效 | Chrome MCP / curl | 前端：commit 在 main 即部署（Pages auto-build）；Worker：需確認 Paul 已跑 wrangler deploy |

只有三層都吻合，才標「✅ 已完成」。任何一層不吻合就標出差異，回報給 Paul。

### Cowork 驗證的已知盲區

- GitHub MCP 讀大檔案（>1000 行）可能截斷 → 搜尋「找不到」≠「不存在」
- GitHub API `list_commits + path` 回傳語義可能誤導 → 要查 diff 才能確認因果（v4.1）
- Worker 部署狀態 git 查不到 → 需看 worklog 或 curl API 驗
- CDN 快取 max-age=3600 → 部署後最多 1 小時才生效

遇到盲區時，標記「未確認」並交 Code 或 Paul 驗證，不自行下結論。

---

## Cowork 開場 Checklist

每次 Cowork session 開場或 Paul 提到「同步」「狀態確認」時，自動執行：

### 0. 確認 repo 實際狀態（v4.2 新增）

如果本次 session 會涉及 repo 的檔案（分析、編輯、盤點），先用 filesystem MCP 確認關鍵目錄的實際內容：

```
mcp__filesystem__list_directory → {repo_path}/src/content/  （或相關目錄）
```

比對 sandbox 掛載的內容。如果有差異 → 以 Paul 電腦上的版本為準，sandbox 版本不可信。
如果本次 session 只做文件產出或 Apple Notes 同步（不碰 repo 檔案），可跳過。

### 1. 掃 worklogs/ + PENDING.md

透過 GitHub MCP 讀取 repo 的 `worklogs/` 目錄，
找出儀表板最後更新日期之後的所有 worklog 檔案。

同時讀 `worklogs/PENDING.md`（用 `get_file_contents`），確認：
- 有沒有待 Cowork 執行的項目
- 跨專案備忘 section 有沒有新決策
- 有沒有待 Code 執行的項目 → 彙整成一句話摘要，讓 Paul 直接貼給 Code

### 2. 查 git log

跑 `list_commits` 取得最近 20-30 筆 commit，比對 worklogs 和 memory 的聲稱。

### 3. Reconcile：比對 worklog 與記憶（v4 新增）

Worklog 是上游事實來源，記憶是下游快取。

- 讀 worklog 的「狀態變更」區塊，比對 `.auto-memory/` 裡標為待辦的項目
- 如果 worklog 標記某項為已完成 → 更新對應記憶，結案該待辦
- 如果記憶裡有「待確認」項目附帶驗證指令 → 跑驗證（curl / API / 瀏覽器）
- 沒有「狀態變更」區塊的舊 worklog → 用 git log + 線上驗證補判
- **原則：有衝突時信線上，不信記憶。**

完成後向 Paul 報告：哪些待辦被自動結案、哪些驗證通過/失敗、哪些需要人工確認。

### 3.5 抽查 remote：worklog 聲稱的關鍵變更真的在 main 上嗎？（v4.1 新增）

**Worklog 說「做完了」≠ 程式碼在 GitHub main 上。**

只查**會影響 build 或 runtime 的關鍵變更**，不查 CSS 微調、文案修改等不影響建構的項目。需要抽查的類型：

- **新增 import / export**：有 import 但 export 不存在 → build 直接炸（這次 RFC #100 就是這樣）
- **新增檔案**：worklog 說建了 `sw.js`、`offline.html` → 確認檔案在 repo 裡
- **Schema 變更**：D1 migration、KV key 格式改動 → 不在就 runtime error
- **Worker 路由 / handler**：`handleScheduled`、新 API endpoint → 不在就 cron 或請求失敗

用 `get_file_contents` 或 `search_code` 確認。驗不過 → 標記「⚠️ worklog 聲稱完成但 remote 未確認」，不直接標 ✅。

> **為什麼加這步：** 2026-04-05 事故。RFC #100 worklog 寫「三項全完成」，Cowork 照抄標完成，
> 結果 `handleFormosaHealthAlert` 從未 push 到 main，直到 wrangler deploy 失敗才發現。
> Memory 有「線上狀態才是真相」的規則，但 checklist 沒有強制執行，導致知道卻沒做到。

### 4. 同步到 Issue #155（透過 issue-155-body.md）

- 編輯 `worklogs/issue-155-body.md`，將新的完成日誌條目插入「完成日誌」區塊（最新在上）
- 根據 worklog 的待辦快照，更新對應專案的狀態區塊
- 更新「最後更新」時間戳
- **不需要手動 PATCH Issue**——push 到 main 後 `sync-dashboard` Action 自動同步
- ⚠️ GitHub MCP 的 `get_issue`/`update_issue` 有 issue_number 型別 bug，讀 Issue 用 `search_issues`

### 5. 狀態確認

- 如果 worklog 提到需要 Paul 手動操作（deploy、設定變更等），主動提醒
- 如果有卡住的項目，標記並討論

---

## Worklog 格式（Code 端產出）——三維度必填

CLAUDE.md 已指示 Code 自動寫入 `worklogs/worklog-{YYYY-MM-DD}.md`。

Worklog 必須涵蓋三個維度，缺一不可：
- **做了什麼**（完成日誌 + 狀態變更）
- **為什麼這樣決定**（決策紀錄）
- **遇到什麼阻礙**（阻礙與踩坑）

```markdown
# Worklog {YYYY-MM-DD}

## 完成日誌（最新在上）
- {HH:MM} {做了什麼} ({commit hash}) Code

## 狀態變更
- {Issue/待辦名稱}：{之前狀態} → {現在狀態}（{原因}）

## 決策紀錄
- {決策}：{為什麼選 A 不選 B}（影響範圍：{哪些模組/專案}）

## 阻礙與踩坑
- {問題描述} → {怎麼解決的 / 還沒解決}

## 待辦快照
### 高優先 🔴
- [ ] ...
### 中優先 🟡
- [ ] ...

## 待 Paul 執行
- [ ] {操作描述} → 驗證: {驗證方法或「問 Paul」}
```

**決策紀錄**：只記「有其他選項但我們選了這個」的情況。沒有特殊決策就寫「無特殊決策」，但不能省略。
**阻礙與踩坑**：記已解決的（給未來參考）和未解決的（給下個 session 接手）。沒有阻礙就寫「無阻礙」，但不能省略。

### 狀態變更範例

```markdown
## 狀態變更
- Issue #90 mazu.today 根目錄 redirect：未完成 → 已解決（formosaRoutes 更新，Worker deploy 後生效）
- Feedback #5 品牌名稱：等 Paul 定案 → fixed（已 PATCH 更新 admin_note）
- FORMOSA_ALERT_USER_ID secret：待確認 → 已確認（Paul 確認 encrypted ✅）
```

重點：間接解決的副作用也要標記，不要只記直接完成的任務。

---

## 記憶寫法慣例（v4 新增）

### 「待確認」項目必須附驗證指令

記憶裡標為「待確認」的項目，附上一個可執行的驗證方式，讓下次 session 開場時直接跑：

```markdown
**待確認：** FORMOSA_ALERT_USER_ID secret 是否已設定
**驗證：** 問 Paul，或檢查 Cloudflare Dashboard → paulkuo-ticker → Settings → Variables
```

### 記憶只記「為什麼」和「怎麼做」

完成與否的狀態不存記憶（會過時），每次現場查 git log / API。
記憶記的是：決策理由、技術陷阱、工作流程規則。

---

## 儀表板格式標準

每個專案區塊統一格式：

```
══════════════════════════════
{專案名稱}
══════════════════════════════
- 關鍵資訊（URL、ID 等）

Phase N ✅ {已完成的階段}
Phase N ⏳ {進行中的階段}
  - [x] 已完成項目
  - [ ] 待辦項目

Phase N 🟡 {未來階段}
  - [ ] 待辦項目

- {備註}
```

待辦直接寫在 Phase 的 `[ ]` 裡，不另外維護獨立清單。
進度和待辦綁定在一起，不會散落各處。

---

## 完成日誌格式

```
- {MM-DD} {HH:MM} {做了什麼} ({commit hash 或驗證方式}) {session 類型}
```

範例：
```
- 03-25 03:37 碳足跡樹木換算公式統一 (414a30c) Code
- 03-25 02:15 Dashboard 地圖重設計 (dbd1807) Code
- 03-24 12:xx Formosa Phase 1 UX 重構 (e2d3855) Code
```

---

## Handoff 文件（需要時才用）

大多數情況下，worklog 自動流轉就夠了。
只有工作**需要跨 session 精確接力**（例如 Cowork 規劃了多步驟方案要 Code 執行）時，
才需要正式的 handoff 文件。

### 檔案命名

`{target}--{project}-{description}-{date}.md`

- `code--` → 給 Code session
- `cowork--` → 給 Cowork session

### Handoff 文件必備區塊

0. **建議模型**：`建議模型: Sonnet` 或 `建議模型: Opus`（寫在檔案最上方，這是硬規則，適用所有專案）
1. **背景**：為什麼要做這件事（一段話）
2. **Step 0 偵察**：先查再改，列出 grep/PRAGMA 等偵察指令
3. **具體步驟**：每步有明確的指令和預期結果
4. **驗證方式**：怎麼確認做完了
5. **注意事項**：已知陷阱
6. **回報格式**：完成後要回報什麼（**必須包含驗證結果**，不要把驗證工作留給 Cowork）
7. **本輪 metrics**：一行摘要，如 `5 commits, 12 files, +340/-87 lines, 1 deploy`
8. **Integration Checklist**（涉及跨系統整合時必填）：
   - **API base URL**：明確寫出要打的域名（本 repo 的 Worker API 是 `api.paulkuo.tw`，Pages 靜態站是 `paulkuo.tw`）
   - **認證模式**：Bearer / Cookie / X-Admin-Token？首次使用新模式時標注對 CORS `Allow-Headers` 的影響
   - **CORS 需求**：跨域回應是否需帶 `corsHeaders(request)`？建議用 `jsonResponse()` 以自動帶入，若用 `new Response()` 必須手動加
   - **現有 pattern 參考**：指出「參考 `src/components/XXX` 或 `worker/src/YYY.js` 的寫法」，降低偏離現有慣例的機率

### 模型選擇指引（v4.4 新增）

| 場景 | 建議模型 |
|------|----------|
| 明確步驟的執行（commit、deploy、ingest、YAML 撰寫）| Sonnet |
| 架構決策、複雜 debug、跨專案影響分析 | Opus |
| 狀態確認、讀檔回報、簡單翻譯 | Haiku |

Cowork session 本身一律 Opus 4.6，不需要在 handoff 裡標注。

### Code 回報原則（v4.4 新增，v4.5 補充）

**Code 回報時必須包含驗證結果，不要把驗證工作留給 Cowork。**

Cowork 跑的是 Opus，每一輪對話都很貴。如果 Code 回報「push 完了，你去驗」，Cowork 還要花一輪 Opus 去跑 curl / 查 API——這些 Sonnet 或 Haiku 就能做的事不應該消耗 Opus token。

正確的回報方式：Code 自己做完驗證，回報最終結果。

❌ 不好：「5 commits pushed，請驗證 Action 是否成功」
✅ 正確：「5 commits pushed，sync-dashboard Action 已觸發並成功，Issue #155 updated_at 已刷新為 07:59:06Z」

**v4.5 補充：** 回報需包含 git stat 數據（commits 數、files changed、lines +/-），供 metrics 收集用。

這個原則適用於所有 Cowork 專案，不限 paulkuo.tw。

### 預估量級（v4.4 新增）

Handoff 除了標建議模型，也標預估量級，讓 Paul 判斷是否值得為這件事開新 Code session：

| 量級 | 定義 | Paul 的處理方式 |
|------|------|----------------|
| **S** | < 5 分鐘，純 git / 單檔修改 | 可攢幾個一起丟給 Code，不用每個開新 session |
| **M** | 5–30 分鐘，值得獨立 session | 開一個 Code session 處理 |
| **L** | 30 分鐘+，可能需要拆步驟或分 session | 拆成多份 handoff，或標注哪些步驟可以先做 |

格式範例：
```
建議模型: Sonnet
預估量級: S（< 5 分鐘，純 git 操作）
```

---

## 防重複執行

**黃金法則**：不確定某件事有沒有做過？先查，不要直接重做。

| 查什麼 | 用什麼 |
|--------|--------|
| 線上版本 | `curl` |
| DB schema | `PRAGMA table_info(...)` |
| 程式碼狀態 | `grep -rn`（Code）或 GitHub MCP（Cowork，注意截斷風險） |
| Git 歷史 | `git log --oneline -20` 或 `list_commits` |
| 上次工作 | `worklogs/` 最新檔案 |
| 任務完成狀態 | **一律查 git log，不從 memory 判斷** |

---

## Metrics 收集 SOP（v4.5 新增）

每次 session 結束（handoff 時）必須收集指標，寫入 `worklogs/metrics/{project_id}/{date}-{session_type}.json`。

### Code session 做法

```bash
# 在 handoff 前跑腳本（輸入：project_id、session_type、session 起始 commit hash）
bash scripts/collect-session-metrics.sh paulkuo-main code abc1234

# 腳本自動計算：commits、files_changed、lines_added、lines_removed
# 以下欄位事後手動補（通常只需改 2-3 個數字）：
# - deploys、issues_closed、custom、notes、model、size、handoff_produced
```

### Cowork session 做法

Cowork 不跑 git，用不同方式收集：
- `commits`、`files_changed`、`lines_added/removed`：從 Code 的回報提取（Code 回報原則已要求附帶）
- `deploys`、`issues_closed`：Cowork 自己知道（是 Cowork 開工單給 Code 做的）
- `custom`：根據本次 session 工作內容填入
- Cowork 直接寫 JSON 到 `worklogs/metrics/{project_id}/{date}-{session_type}.json`

### 跨專案 session

一個 session 觸及多個專案（例如改共用模組），產出多份 metrics JSON，每個受影響的 `project_id` 各一份。

### 檔名規則

- 格式：`{YYYY-MM-DD}-{session_type}.json`（例：`2026-04-09-code.json`）
- 同一天同類型多個 session：`{date}-{session_type}-2.json`（腳本自動處理）

### Handoff 文件 metadata 格式（v4.5）

```
建議模型: Sonnet
預估量級: M
本輪 metrics: 5 commits, 12 files, +340/-87 lines, 1 deploy, 2 issues closed
```

---

## 工程慣例速查

- Worker deploy：`wrangler deploy --config worker/wrangler.toml`（**必須帶 --config**）
- 前端 deploy：`git push` → CI/CD
- D1 查詢：`wrangler d1 execute paulkuo-auth --remote --config worker/wrangler.toml --command "..."`
- 部署前必查：`grep -rn "<<<<<<" worker/src/`
- KV 操作必帶 `--remote`
- commit + push 要原子操作（cron 每 10 分鐘跑 git stash/pop）
- CDN 快取 max-age=3600，新部署最多等 1hr 生效
- Semver: MAJOR=架構, MINOR=功能, PATCH=修復
