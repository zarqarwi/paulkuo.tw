# Code Handoff — Formosa Post-Event Issues 批次修復

> **來源**：Cowork 巡查，彙整 Issue #155 Formosa 區塊 + 6 個 open issues
> **日期**：2026-04-16
> **Task Size**：L（預估 3-4 小時，分 3 批處理）
> **建議模型**：Opus 4.6 + High（跨多檔案、需理解 formosa.js 全貌）
> **信心等級**：中——個別修復明確，但交互作用需驗證

---

## 🚧 Impact Fence — 活動期間程式碼圍籬

> **Formosa ESG 2026 活動進行中（4/12 起駕）。**
> 任何改動不得影響正在服務中的使用者。

### 分類原則

每個 Batch 按「是否碰到 production 使用者看得到的東西」分成兩區：

| 區域 | 定義 | 可做的事 | 不可做的事 |
|------|------|---------|-----------|
| 🟢 **Safe Zone** | 不碰 Worker / 不碰前端 / 不觸發 deploy | CI/CD workflow 修改、文件、測試 | — |
| 🔴 **Live Zone** | 碰到 `worker/src/`、`src/pages/projects/formosa-esg-2026/`、或需要 `wrangler deploy` | — | **活動期間禁止 deploy** |

### 各 Batch Impact 評級

| 批次 | 碰到的檔案 | 需要 deploy? | Impact 區域 | 活動期間可執行？ |
|------|-----------|-------------|------------|----------------|
| Batch 1 | `.github/workflows/feedback-auto-close.yml` | ❌ 不需要 | 🟢 Safe | ✅ **現在就能做** |
| Batch 2 | `src/pages/projects/formosa-esg-2026/*.astro` + `worker/src/formosa.js` | ✅ 前端 + Worker | 🔴 Live | ⛔ **feature branch only，活動後 merge + deploy** |
| Batch 3 | `worker/src/formosa.js` + `src/pages/projects/formosa-esg-2026/*.astro` | ✅ 前端 + Worker | 🔴 Live | ⛔ **feature branch only，活動後 merge + deploy** |

### 執行策略

**Batch 1（🟢 Safe）**：直接在 `main` 上開發 → commit → push。
CI/CD workflow 改動 push 進 main 不會觸發 Cloudflare deploy，使用者零感知。

**Batch 2 & 3（🔴 Live）**：走 feature branch 隔離。

```bash
# 開 feature branch，所有 Live Zone 改動都在這裡
git checkout -b fix/formosa-post-event

# Batch 2 + Batch 3 的改動全在這個 branch
# 每個 issue 仍然分開 commit（方便 review）
# 但統一不 merge 回 main

# 活動結束後（Paul 確認）：
git checkout main
git merge fix/formosa-post-event
# deploy
npm run build && wrangler deploy && cd worker && wrangler deploy --config wrangler.toml
```

### 圍籬違規檢查（Code 必讀）

開發過程中，每次 `git add` 前自問：

1. **這個檔案在 `src/pages/projects/formosa-esg-2026/` 下嗎？** → 🔴 不能進 main
2. **這個檔案在 `worker/src/formosa*.js` 嗎？** → 🔴 不能進 main
3. **改完後 Cloudflare Pages 會自動重建嗎？** → push to main 會觸發 build，如果改了 `src/` 下的東西就會影響前端
4. **這是純 CI/CD / docs / worklogs 嗎？** → 🟢 安全

**如果不確定，停下來問 Paul。寧可多問一次，不要活動期間搞壞線上系統。**

---

## TL;DR

Formosa ESG 2026 活動期間累積 6 個 open issues，全標 post-event。
**分三批處理**，但 Batch 2 & 3 走 feature branch，活動結束後才 merge + deploy。

| 批次 | Issues | 優先 | 估時 | Impact | 何時可做 |
|------|--------|------|------|--------|---------|
| Batch 1 | #175 auto-close.yml injection | P2 CI/CD | 30 min | 🟢 Safe | **現在** |
| Batch 2 | #177 + #178 GPS/LIFF 資源管理 | P1 | 90 min | 🔴 Live | 寫 code now → **deploy 活動後** |
| Batch 3 | #173 + #174 + #179 Dashboard定位 + AuthGate + 拍照 | P1+P2 | 90 min | 🔴 Live | 寫 code now → **deploy 活動後** |

**為什麼這個順序**：#175 是 CI/CD 修復，不影響前端也不需 deploy Worker，風險最低先做。#177/#178 共享 Vivo OriginOS 省電根因，合併處理效率高。#173/#174/#179 各自獨立但都是前端+API 修改。

---

## 0. 開場偵察

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw
git pull origin main
git status --short
git log --oneline -5

# 確認 formosa.js 最新狀態
wc -l worker/src/formosa.js
grep -n "handleFormosa\|track/sync\|geofence\|pushHours\|visibilitychange" worker/src/formosa.js | head -20

# 確認目前線上 Worker 版本
curl -s https://api.paulkuo.tw/api/formosa/checkin/health
```

---

## Batch 1 — #175 auto-close.yml Expression Injection（30 min）

### 背景

`feedback-auto-close.yml` 用 `${{ github.event.issue.body }}` 在 shell heredoc 裡展開，
Issue body 含特殊字元（code block、backtick、`$`）時 shell 解析失敗，導致 PATCH 靜默失敗。
Issue #172 的詳細 body 就觸發了這個 bug。

### 修法

把 expression injection 改成 runtime `gh api` 呼叫，不在 shell 裡展開 Issue body。

### Step 0 偵察

```bash
cat .github/workflows/feedback-auto-close.yml
# 找到 ${{ github.event.issue.body }} 出現的位置
grep -n "github.event.issue" .github/workflows/feedback-auto-close.yml
```

### 具體修改

1. 找到 heredoc 裡嵌入 `${{ ... }}` 的地方
2. 改成用 `gh api` + `--field` 參數傳 body，避免 shell 展開：

```yaml
# 舊（有 injection 風險）
- name: Update feedback
  run: |
    BODY="${{ github.event.issue.body }}"
    curl -X PATCH ...

# 新（安全）
- name: Update feedback
  env:
    GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    ISSUE_NUMBER: ${{ github.event.issue.number }}
  run: |
    # 用 gh api 讀 issue body，不在 shell 展開
    BODY=$(gh api repos/${{ github.repository }}/issues/${ISSUE_NUMBER} --jq '.body')
    # ... 後續處理用變數引用
```

### 驗證

```bash
# commit 後 push，然後手動 close 一個測試 issue 觸發 workflow
gh workflow list | grep auto-close
# 看 Actions log 確認沒有 shell parse error
```

### Commit

```bash
git add .github/workflows/feedback-auto-close.yml
git commit -m "fix(ci): 修正 auto-close.yml expression injection (#175)

Issue body 含特殊字元時 shell heredoc 解析失敗，
改用 gh api + env var 避免 shell 展開。

Closes #175"
```

---

## Batch 2 — #177 GPS 彰化以南 + #178 LIFF 常駐（90 min）

> 🔴 **Live Zone** — 在 `fix/formosa-post-event` branch 開發，活動結束前不 merge 回 main。

### 背景

兩者共享根因：Vivo OriginOS 省電策略在高耗能 webview（GPS watchPosition）時
主動限制資源配額，導致 (1) GPS tracking 被凍結 (2) LINE 通知被壓。

### Step 0 偵察

```bash
# GPS 相關邏輯
grep -n "watchPosition\|clearWatch\|geolocation\|visibilitychange" src/pages/projects/formosa-esg-2026/*.astro
grep -n "watchPosition\|clearWatch\|geolocation" src/pages/projects/formosa-esg-2026/js/*.js 2>/dev/null

# 現有 #169 修復（背景定時器管理）
git log --oneline --all | grep -i "169\|timer\|background"

# track/sync endpoint（護欄 #13：確認 geofence 繼承）
grep -n "geofence\|ROUTE_BOUNDS\|isWithinBounds" worker/src/formosa.js
```

### #177 修法：GPS 斷點恢復 + watchPosition 韌性

**目標**：即使 OS 凍結 watchPosition，恢復時能自動重啟 + 補傳缺漏段。

1. **加 `visibilitychange` listener**：頁面從 hidden 回 visible 時，重啟 watchPosition
2. **加 heartbeat 偵測**：如果 >60s 沒收到 position update，判定為 OS 凍結，記錄斷點
3. **恢復時補 gap marker**：回來時在軌跡裡插入 `gap: true` 標記，前端繪圖時用虛線連接

```javascript
// 偽碼 — visibilitychange 恢復
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    // 重啟 GPS tracking
    restartWatchPosition();
    // 嘗試 flush 離線佇列
    flushOfflineQueue();
  }
});
```

### #178 修法：LIFF 背景休眠

**目標**：使用者切出 LIFF 時主動暫停 GPS，降低資源佔用，讓 LINE 正常運作。

1. **`visibilitychange` → hidden 時**：`clearWatch()` 停止 GPS，暫停上傳定時器
2. **`visibilitychange` → visible 時**：恢復 watchPosition，flush 離線佇列
3. **加 UX 提示**（非必須但建議）：回到頁面時 toast「GPS 追蹤已恢復」

> ⚠️ #177 和 #178 的 `visibilitychange` 是同一段程式碼，合併實作。

### 護欄 #13 檢查（新 endpoint 防護繼承）

如果這次修改觸及 `/track/sync` 或新增任何 endpoint：
- [ ] 確認繼承 geofence 檢查
- [ ] 確認繼承 accuracy filter
- [ ] 確認繼承 speed outlier filter

### 驗證

```bash
# Worker 部分（如果有改）
curl -s https://api.paulkuo.tw/api/formosa/checkin/health

# 前端部分 — 需要手機實測（護欄 #4）
# 模擬步驟：LINE 打開 LIFF → 開始追蹤 → 切出去（回 LINE 聊天室）→ 等 30s → 切回來
# 預期：GPS 恢復追蹤 + toast 提示
```

### Commit

```bash
git commit -m "fix(formosa): GPS 斷點恢復 + LIFF 背景休眠 (#177, #178)

- visibilitychange 監聽：hidden 暫停 GPS / visible 恢復追蹤
- heartbeat 偵測 OS 凍結（>60s 無 position update）
- 恢復時 flush 離線佇列 + gap marker

根因：Vivo OriginOS 省電策略凍結高耗能 webview GPS。
合併 #169 背景定時器管理邏輯。

Closes #177, Closes #178"
```

---

## Batch 3 — #173 Dashboard 定位 + #174 AuthGate + #179 拍照（90 min）

> 🔴 **Live Zone** — 在 `fix/formosa-post-event` branch 開發，活動結束前不 merge 回 main。

### #173 Dashboard 媽祖定位缺席

**Step 0 偵察**：

```bash
# 確認 PR #119 狀態
gh pr view 119 --json state,mergeCommit,title
# 確認 sedan tracking 邏輯
grep -n "sedan\|crown\|mazu\|皇冠\|fallback" worker/src/formosa.js
grep -n "sedan\|crown\|mazu" src/pages/projects/formosa-esg-2026/*.astro
```

**修法**：
1. 如果 PR #119 未 merge → 先 merge（sedan fallback to vanguard position）
2. 檢查前端 Dashboard 顯示條件是否太嚴格（只顯示 `source === 'sedan'`？）
3. 加 fallback 邏輯：sedan 無資料時，取最近打卡的前鋒隊伍 GPS

### #174 AuthGate Bypass

**Step 0 偵察**：

```bash
grep -n "AuthGate\|authgate\|sessionStorage\|localStorage\|formosa-unlocked" src/pages/projects/formosa-esg-2026/*.astro
# 確認所有入口路徑
grep -rn "formosa-esg-2026" src/pages/ --include="*.astro" | grep -v node_modules
```

**修法**：
1. 檢查所有頁面路由是否都走 AuthGate
2. 統一 token 驗證邏輯（sessionStorage vs localStorage 不一致問題）
3. 阻擋 URL 直接進入的路徑

### #179 拍照入口 + 我的相簿

**Step 0 偵察**：

```bash
grep -n "capture\|photo\|camera\|album\|image.*upload" src/pages/projects/formosa-esg-2026/*.astro
grep -n "photo\|image\|upload" worker/src/formosa.js
```

**修法**：
1. 拍照：拆成兩顆按鈕（相機 + 相簿），分別用 `<input capture="environment">` 和 `<input accept="image/*">`
2. 我的相簿：新增 `GET /api/formosa/photos/mine` endpoint（需 lineUserId）
3. 前端加「我的照片」tab

> ⚠️ 護欄 #13：新增 `/api/formosa/photos/mine` 必須繼承 auth 驗證。

### 驗證

```bash
# Worker
curl -s https://api.paulkuo.tw/api/formosa/checkin/health

# AuthGate — 嘗試不帶 token 直接打頁面
curl -s -o /dev/null -w "%{http_code}" "https://paulkuo.tw/projects/formosa-esg-2026/tracker/"

# Photos endpoint（deploy 後）
curl -s "https://api.paulkuo.tw/api/formosa/photos/mine?lineUserId=test"
```

### Commit（每個 issue 分開 commit）

```bash
git commit -m "fix(formosa): Dashboard 媽祖定位 fallback 邏輯 (#173) [影響: Formosa]"
git commit -m "fix(formosa): AuthGate bypass 路徑封堵 (#174) [影響: Formosa]"
git commit -m "feat(formosa): 拍照按鈕拆分 + 我的相簿 API (#179) [影響: Formosa]"
```

---

## 上游假設（接手方先驗證）

1. Formosa 活動已結束或 Paul 確認可以 deploy（活動期間原則：不動）
2. PR #119 的 sedan tracking 邏輯是正確的（#173 依賴）
3. `formosa.js` 和前端 astro 的最新版本跟 Issue 描述時一致（沒有其他 session 動過）

## Integration Checklist

- [ ] 所有新 endpoint 繼承 auth 驗證
- [ ] 所有 GPS 相關修改繼承 geofence + accuracy + speed filter
- [ ] `visibilitychange` 不影響正在進行的 `sendBeacon` flush
- [ ] AuthGate 修改不影響管理員 token 進入路徑
- [ ] 拍照 UI 修改不影響現有打卡流程

## 不可逆操作

- Worker deploy（每批改完都需要）
- 前端 deploy（Batch 2, 3）

## 完成回報格式

**Batch 1（Safe Zone → main）**：
```
✅ commit {SHA} pushed to main
Batch 1 Issue: #175
Smoke test: Actions workflow 手動觸發驗證
```

**Batch 2 & 3（Live Zone → feature branch）**：
```
⚠️ commit {SHA} pushed to fix/formosa-post-event (NOT main)
Batch {N} Issues: #{a}, #{b}
Code review: {自我檢查通過}
待活動結束後：merge to main → deploy → smoke test
```

### 活動結束後的 merge + deploy checklist

Paul 確認活動結束後，Code 執行：
```bash
git checkout main && git pull origin main
git merge fix/formosa-post-event
# 逐一驗證 merge 結果
npm run build  # 前端 build 通過？
# 確認無衝突後
git push origin main
# 等 Cloudflare Pages 重建完成
cd worker && wrangler deploy --config wrangler.toml
# Smoke test 全部子專案
curl -s https://api.paulkuo.tw/api/formosa/checkin/health
curl -s -o /dev/null -w "%{http_code}" "https://api.paulkuo.tw/api/wiki/search?q=AI"
curl -s -o /dev/null -w "%{http_code}" "https://api.paulkuo.tw/api/scorecard/feed"
```

---

**一句話總結**：6 個 Formosa post-event issues 分三批處理——CI/CD 先修 → GPS/LIFF 資源管理合併修 → Dashboard 定位 + AuthGate + 拍照各別修。每批獨立 commit + deploy + 驗證。
