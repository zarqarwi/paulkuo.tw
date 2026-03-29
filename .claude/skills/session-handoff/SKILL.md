---
name: session-handoff
description: >
  Paul 的多 session 協作狀態管理 SOP。當 Claude 在任何 session（Chat/Code/Cowork）
  完成一項任務、修復一個 bug、部署一次程式碼、或結束一輪工作時，必須觸發此 skill。
  也在 session 開場時觸發——用來檢查儀表板避免重複執行已完成的工作。
  關鍵觸發詞：handoff、交接、結案、部署完成、驗證通過、bug 修好了、
  開始新一輪、繼續上次、接手、狀態確認。
  即使沒有明確觸發詞，只要 session 涉及跨 session 的工作（例如 Chat 規劃完要交給 Code 執行），
  也應該觸發此 skill。
---

# 多 Session 協作狀態管理 SOP v2

Paul 同時使用 Code 和 Cowork 兩種 session 協作。
Code 是主力戰場（程式碼、部署、工程），Cowork 是管家中樞（Apple Notes、文件、同步、自動化）。
這份 SOP 確保狀態不會在交接時遺失或重複。

---

## 核心架構

```
Code 衝刺做事 → 自動寫 worklogs/ → Paul 開 Cowork → Cowork 同步到 Apple Notes 儀表板
```

**單一事實來源**：Apple Notes「🎛️ 專案狀態儀表板」。
**中繼站**：repo 內 `worklogs/worklog-{date}.md`（Code 自動產出，Cowork 自動消化）。

---

## Apple Notes 儀表板存取 SOP

Apple Notes 的 `get_note_content` 需要用**完整的筆記名稱**來查詢，而 Apple Notes 會自動把筆記內容的第一行當作名稱。這代表如果第一行包含動態內容（例如時間戳），筆記名稱每次更新都會變，導致下次用固定名稱查詢時找不到。

### 讀取流程（兩步驟）

每次需要讀取儀表板時，按照以下順序操作：

1. **先列出筆記清單**：呼叫 `list_notes`，在結果中搜尋包含「專案狀態儀表板」的筆記
2. **用完整名稱讀取**：拿到完整名稱後，呼叫 `get_note_content(完整名稱)` 讀取內容

不要直接用 `get_note_content("🎛️ 專案狀態儀表板")` 硬查——名稱可能因為上次更新而改變。

### 寫入格式規則

更新儀表板內容時：

- **第一行**以 `🎛️ 專案狀態儀表板` 開頭
- **「最後更新」時間戳放在筆記最後一行**，格式：`最後更新：YYYY-MM-DD HH:MM by {session 類型}（{摘要}）`

⚠️ **已知限制**：Apple Notes MCP 的 `update_note_content` 用純文字模式寫入，Apple Notes 會把前面好幾行都吃進筆記名稱裡，無法透過換行來控制。所以**不要假設名稱是乾淨的**——讀取時一律走兩步驟流程。

---

## Session 角色與分工

| Session | 角色定位 | 核心能力 | 限制 |
|---------|---------|---------|------|
| Code | **主力戰場** | 大量程式碼修改、Git、測試、終端機、MCP、web search | 無法寫 Apple Notes、無法 wrangler deploy（網路限制） |
| Cowork | **管家中樞** | Apple Notes 讀寫、AppleScript/Chrome、Skills、排程任務、文件產出 | 不適合深度程式碼修改 |

### Code 的職責
- 程式碼開發、修復、重構
- Git commit / push / PR
- 跑測試、lint、build
- **自動產出 worklog**（寫到 `worklogs/worklog-{date}.md`）
- 需要 deploy 時，產出指令讓 Paul 在本機跑

### Cowork 的職責
- **開場同步**：讀 `worklogs/`，將新條目寫入 Apple Notes 儀表板
- Apple Notes 儀表板維護（狀態更新、待辦管理）
- 文件類 skill（文章撰寫、社群貼文、簡報、PDF）
- 排程任務管理
- Chrome / AppleScript 自動化
- 跨專案狀態盤點

---

## Cowork 開場 Checklist

每次 Cowork session 開場或 Paul 提到「同步」「狀態確認」時，自動執行：

### 1. 掃 worklogs/

透過 GitHub MCP 讀取 repo 的 `worklogs/` 目錄，
找出儀表板最後更新日期之後的所有 worklog 檔案。

### 2. 同步到 Apple Notes 儀表板

依照「Apple Notes 儀表板存取 SOP」的兩步驟流程讀取儀表板，然後：

- 將新的完成日誌條目插入儀表板的「完成日誌」區塊（最新在上）
- 根據 worklog 的待辦快照，更新對應專案的狀態區塊
- 更新最後一行的「最後更新」時間戳（記得第一行維持不變）

### 3. 狀態確認

- 如果 worklog 提到需要 Paul 手動操作（deploy、設定變更等），主動提醒
- 如果有卡住的項目，標記並討論

---

## Worklog 格式（Code 端產出）

CLAUDE.md 已指示 Code 自動寫入 `worklogs/worklog-{YYYY-MM-DD}.md`：

```markdown
# Worklog {YYYY-MM-DD}

## 完成日誌（最新在上）
- {HH:MM} {做了什麼} ({commit hash}) Code

## 待辦快照
### 高優先 🔴
- [ ] ...
### 中優先 🟡
- [ ] ...

## 技術備忘
- {踩坑紀錄、關鍵發現}
```

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
| 程式碼狀態 | `grep -rn` |
| Git 歷史 | `git log --oneline -20` |
| 上次工作 | `worklogs/` 最新檔案 |

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
