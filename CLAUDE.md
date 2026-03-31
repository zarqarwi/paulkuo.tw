# CLAUDE.md — paulkuo.tw 專案指令集

Claude Code 開啟此 repo 時自動讀取。這是 Paul 與 Claude 協作的核心規則。

---

## 專案概覽

- 網站：https://paulkuo.tw（Astro + Cloudflare Pages）
- Worker API：`worker/` 目錄（Cloudflare Workers + D1）
- 子專案：Formosa ESG 2026（進香 tracker）、Builder's Scorecard、TQEF 翻譯器
- Repo 路徑：`~/Desktop/01_專案進行中/paulkuo.tw`

---

## Worklog 自動記錄（必遵守）

### 規則

每完成一項有意義的工作（commit、bug 修復、功能完成、部署），**自動追加一行到 `worklogs/worklog-{YYYY-MM-DD}.md`**。

不需要 Paul 提醒。做完就記，就像寫 git log 一樣自然。

### 格式

```markdown
# Worklog {YYYY-MM-DD}

## 完成日誌（最新在上）
- {HH:MM} {做了什麼} ({commit hash}) Code
- {HH:MM} {做了什麼} ({commit hash}) Code
```

### Session 結束時

當 Paul 說「結束」、「收工」、「今天到這」、或明確結束對話時，在 worklog 底部補上：

```markdown
## 待辦快照
### 高優先 🔴
- [ ] ...
### 中優先 🟡
- [ ] ...
### 低優先 🟢
- [ ] ...

## 技術備忘
- {本次發現的重要資訊、踩坑紀錄、關鍵決策}
```

### 隱式結束

如果 Paul 沒有明確說結束，但已經超過 30 分鐘沒有新指令，
下一次收到指令時先把上一段工作的 worklog 補完，再開始新工作。

---

## 工程慣例

### 部署

```bash
# 前端（Astro 靜態站 → Cloudflare Pages）
npm run build && wrangler deploy

# Worker API（必須帶 --config）
cd worker && wrangler deploy --config wrangler.toml

# 一次全部
npm run build && wrangler deploy && cd worker && wrangler deploy --config wrangler.toml
```

✅ Code session 可直接跑 `wrangler deploy` 和 `wrangler d1 execute`（2026-03-27 驗證通過）。

### 部署後驗證（每次 deploy 必做）

每次跑完 `wrangler deploy` 後，**立刻跑 Level 1 Smoke Test**，結果寫進 worklog。

驗證方式：用 `curl` 或瀏覽器確認頁面能載入、關鍵功能正常。

**Level 1 驗證項目（只驗這次改動碰到的區塊）：**

| 區塊 | 驗證方式 |
|------|---------|
| 進入流程 | 密碼解鎖正常、頁面能載入 |
| GPS | banner 出現、打卡按鈕可按 |
| 公仔/等級 | 圖片大小正常（120×120px）、等級名稱有顯示 |
| 問卷 | 卡片能翻頁、進度條更新 |
| 獎勵卡 | 公仔大小正常（150×150px）、統計有帶入 |
| 碳足跡 | 展開/收合正常、欄位可填 |
| 足跡頁 | /my/ 能載入、地圖有渲染 |

**Worklog 記錄格式：**
```markdown
## Smoke Test
- ✅ 進入流程：密碼解鎖正常
- ✅ 公仔/等級：圖片 120×120px 正常
- ❌ 獎勵卡：分享按鈕無反應 → 開 issue 追蹤
```

任何 fail 項目 → 當場修 → 重新 deploy → 再驗一次。不要留著等下次。

### Git

- commit + push 要原子操作（cron 每 10 分鐘跑 git stash/pop，避免衝突）
- 部署前必查：`grep -rn "<<<<<<" worker/src/`
- Semver：MAJOR=架構, MINOR=功能, PATCH=修復
- 一個 commit 只做一件事，不要混改 CSS + JS 邏輯 + HTML 結構

### D1 / KV

- D1 查詢：`wrangler d1 execute paulkuo-auth --remote --config worker/wrangler.toml --command "..."`
- KV 操作必帶 `--remote`
- Migration 用 `CREATE TABLE IF NOT EXISTS`，避免重複執行問題

### Wrangler 陷阱

- 根目錄 `wrangler.jsonc`（paulkuo-tw 靜態站）會覆蓋 `worker/wrangler.toml`（paulkuo-ticker API）
- 部署 Worker 時**必須**帶 `--config wrangler.toml`

### Astro 陷阱

- `<style>` 預設是 scoped，動態產生的 DOM 元素匹配不到 → 被 JS innerHTML 建立的元素要用 `:global()` 或 `is:inline`
- AuthGate 頁面的 DOM 操作必須延遲到 `formosa-unlocked` 事件

### CDN

- `max-age=3600`，新部署最多等 1 小時生效
- 驗證時務必 hard refresh（Ctrl+Shift+R / Cmd+Shift+R）

---

## 跨 Session 協作

### 狀態管理

Apple Notes「🎛️ 專案狀態儀表板」是所有專案狀態的**單一事實來源**。
Code 無法直接寫 Apple Notes，所以用 `worklogs/` 作為中繼：

```
Code 做事 → 自動寫 worklogs/ → Paul 開 Cowork → Cowork 讀 worklogs/ 同步到 Apple Notes
```

### 黃金法則

如果不確定某件事有沒有做過，**先查（grep / curl / git log / PRAGMA），不要直接重做**。

### Session 開場

1. 讀 `worklogs/` 最新檔案，確認上次做到哪裡
2. 如果有 `worklogs/` 裡的待辦快照，從那裡接續
3. 不確定就問 Paul

---

## 子專案速查

### Formosa ESG 2026（進香 Tracker）
- 路徑：`src/pages/projects/formosa-esg-2026/` + `worker/`
- Tracker：https://paulkuo.tw/projects/formosa-esg-2026/tracker/
- LINE Bot：@539fkwjd / LIFF ID: 2009588321-rXVntTKg
- 4/12 起駕

### Builder's Scorecard
- 路徑：`src/pages/builders-scorecard/`
- Phase 5 執行中

### TQEF 翻譯器
- Worker 路徑：`worker/src/`
- D1：paulkuo-auth
