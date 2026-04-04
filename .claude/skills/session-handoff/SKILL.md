# 多 Session 協作狀態管理 SOP v4

Paul 同時使用 Code 和 Cowork 兩種 session 協作。
Code 是主力戰場（程式碼、部署、工程），Cowork 是管家中樞（Apple Notes、文件、同步、自動化）。
這份 SOP 確保狀態不會在交接時遺失或重複。

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

### Cowork 適合做的
- 文件產出（但常數由 Code 提供）
- 排程管理
- Apple Notes 同步
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
Code 衝刺做事 → 自動寫 worklogs/ → Paul 開 Cowork → Cowork 同步到 Apple Notes 儀表板
```

**單一事實來源**：Apple Notes「🎛️ 專案狀態儀表板」。
**中繼站**：repo 內 `worklogs/worklog-{date}.md`（Code 自動產出，Cowork 自動消化）。

---

## Session 角色與分工

| Session | 角色定位 | 核心能力 | 限制 |
|---------|---------|---------|------|
| Code | **主力戰場** | 大量程式碼修改、Git、測試、終端機、MCP、web search | 無法寫 Apple Notes、無法 wrangler deploy（網路限制） |
| Cowork | **管家中樞** | Apple Notes 讀寫、AppleScript/Chrome、Skills、排程任務、文件產出 | 不適合深度程式碼修改，GitHub MCP 有截斷風險 |

### Code 的職責
- 程式碼開發、修復、重構
- Git commit / push / PR
- 跑測試、lint、build
- **自動產出 worklog**（寫到 `worklogs/worklog-{date}.md`），含「狀態變更」區塊
- 需要 deploy 時，產出指令讓 Paul 在本機跑
- **常數匯出**：Cowork 需要程式碼常數時，由 Code grep 匯出

### Cowork 的職責
- **開場同步**：讀 `worklogs/` → reconcile 記憶 → 同步 Apple Notes 儀表板
- Apple Notes 儀表板維護（狀態更新、待辦管理）
- 文件類 skill（文章撰寫、社群貼文、簡報、PDF）
- 排程任務管理
- Chrome / AppleScript 自動化
- 跨專案狀態盤點

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
- Worker 部署狀態 git 查不到 → 需看 worklog 或 curl API 驗
- CDN 快取 max-age=3600 → 部署後最多 1 小時才生效

遇到盲區時，標記「未確認」並交 Code 或 Paul 驗證，不自行下結論。

---

## Cowork 開場 Checklist

每次 Cowork session 開場或 Paul 提到「同步」「狀態確認」時，自動執行：

### 1. 掃 worklogs/

透過 GitHub MCP 讀取 repo 的 `worklogs/` 目錄，
找出儀表板最後更新日期之後的所有 worklog 檔案。

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

### 4. 同步到 Apple Notes 儀表板

- 將新的完成日誌條目插入儀表板的「完成日誌」區塊（最新在上）
- 根據 worklog 的待辦快照，更新對應專案的狀態區塊
- 更新「最後更新」時間戳

### 5. 狀態確認

- 如果 worklog 提到需要 Paul 手動操作（deploy、設定變更等），主動提醒
- 如果有卡住的項目，標記並討論

---

## Worklog 格式（Code 端產出）

CLAUDE.md 已指示 Code 自動寫入 `worklogs/worklog-{YYYY-MM-DD}.md`：

```markdown
# Worklog {YYYY-MM-DD}

## 完成日誌（最新在上）
- {HH:MM} {做了什麼} ({commit hash}) Code

## 狀態變更（v4 新增）
- {Issue/待辦名稱}：{之前狀態} → {現在狀態}（{原因}）

## 待辦快照
### 高優先 🔴
- [ ] ...
### 中優先 🟡
- [ ] ...

## 技術備忘
- {踩坑紀錄、關鍵發現}
```

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

1. **背景**：為什麼要做這件事（一段話）
2. **Step 0 偵察**：先查再改，列出 grep/PRAGMA 等偵察指令
3. **具體步驟**：每步有明確的指令和預期結果
4. **驗證方式**：怎麼確認做完了
5. **注意事項**：已知陷阱
6. **回報格式**：完成後要回報什麼

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

## 工程慣例速查

- Worker deploy：`wrangler deploy --config worker/wrangler.toml`（**必須帶 --config**）
- 前端 deploy：`git push` → CI/CD
- D1 查詢：`wrangler d1 execute paulkuo-auth --remote --config worker/wrangler.toml --command "..."`
- 部署前必查：`grep -rn "<<<<<<" worker/src/`
- KV 操作必帶 `--remote`
- commit + push 要原子操作（cron 每 10 分鐘跑 git stash/pop）
- CDN 快取 max-age=3600，新部署最多等 1hr 生效
- Semver: MAJOR=架構, MINOR=功能, PATCH=修復
