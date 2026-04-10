# Handoff: 恢復「今日善足跡」選填區塊（水瓶 + 住宿）

> **Issue**：#162
> **來源**：Cowork session（4/10）
> **目標**：Code session
> **風險等級**：L2（前端 UI 改動 + Worker SQL 微調，需 PR + preview）
> **模型建議**：Sonnet / High effort
> **優先級**：🔴 高（4/12 起駕前必須上線）

---

## ⚠️ 開始前必做

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw
git pull origin main
```

Cowork 推了這份 handoff 到 main，不 pull 會衝突。

---

## 背景

問卷從 Q13 優化為 Q10 時，舊版的「每日善足跡回報」（dailyReport）UI 被整個移除了。但 Worker 後端的 `handleFormosaDailyReport` handler 和 D1 的 `formosa_daily_reports` 表仍然完整存在且功能正常。

現在的問題：
- 前端沒有入口讓使用者填報水瓶數量和住宿
- Dashboard 的 admin/carbon 撈的是 `formosa_surveys` 表的 `water_bottles` 和 `hotel_nights`，但新版問卷 submit 不寫這兩欄，所以 Dashboard 永遠顯示 0

**目標**：在打卡後提供一個輕量的「今日善足跡」選填區塊，只問水瓶和住宿兩件事。友善選填、不強迫，不填也不影響打卡和等級。

---

## 需要改動的檔案

| 檔案路徑 | 改動內容 |
|---------|---------|
| `src/pages/projects/formosa-esg-2026/tracker/_TrackerPage.astro` | 打卡成功後加入收合式善足跡選填面板 |
| `src/i18n/translations/zh-Hant.ts` | 精簡 dailyReport keys，砍交通相關 |
| `src/i18n/translations/zh-Hans.ts` | 同上（簡體中文） |
| `src/i18n/translations/en.ts` | 同上（英文） |
| `src/i18n/translations/ja.ts` | 同上（日文） |
| `worker/src/formosa.js` — `handleFormosaAdminCarbon`（約第 1092 行） | SQL 改撈 `formosa_daily_reports` |

### 不需要改的檔案

| 檔案路徑 | 原因 |
|---------|------|
| `worker/src/formosa.js` — `handleFormosaDailyReport`（約第 2041 行） | handler 完整且正確，接收欄位和 upsert 邏輯不需要改 |
| `worker/src/formosa.js` — D1 `formosa_daily_reports` 表 schema | 已有所有需要的欄位 |
| `worker/src/formosa.js` — `handleFormosaSubmit`（約第 260 行） | Q1-Q10 問卷流程不動 |
| `worker/src/formosa.js` — `GWP_FACTORS`（約第 2029 行） | 碳排係數不動（water: 0.10974, hotel: 8.85） |
| `worker/src/index.js` — 路由 | `/api/formosa/daily-report` 路由已註冊 |

---

## Step 0：偵察（先跑完再動手）

逐一確認以下六項，把結果貼出來。如果任何一項跟預期不符，**停下來回報，不要硬做**。

```bash
# 1. 確認 handleFormosaDailyReport handler 存在
grep -n "handleFormosaDailyReport" worker/src/formosa.js | head -5
# 預期：找到函式定義（約第 2041 行）

# 2. 確認 D1 表 schema 存在
grep -n "formosa_daily_reports" worker/src/formosa.js | head -10
# 預期：找到 CREATE TABLE IF NOT EXISTS formosa_daily_reports

# 3. 確認前端目前打卡後的 UI 結構（找插入點）
grep -n "checkin-success\|after-checkin\|post-checkin\|dailyReport\|daily-report\|checkin-result" src/pages/projects/formosa-esg-2026/tracker/_TrackerPage.astro | head -20
# 預期：找到打卡成功的區塊標記，這是新 UI 的插入位置

# 4. 確認 admin/carbon 目前的 SQL（要改的目標）
grep -n "water_bottles\|hotel_nights" worker/src/formosa.js | head -15
# 預期：在 handleFormosaAdminCarbon 裡看到從 formosa_surveys 撈資料

# 5. 確認 i18n dailyReport keys 還在
grep -n "dailyReport" src/i18n/translations/zh-Hant.ts | head -10
# 預期：找到 dailyReport 區塊（約第 109-121 行），含 waterBottles、stayed 等 keys

# 6. 確認 API 路由存在
grep -n "daily-report\|dailyReport\|daily_report" worker/src/index.js | head -10
# 預期：找到 POST /api/formosa/daily-report 路由對應 handleFormosaDailyReport
```

**偵察結果確認清單**（六項都 OK 才繼續）：

- [ ] handleFormosaDailyReport handler 存在且完整
- [ ] formosa_daily_reports 表 schema 存在
- [ ] 找到前端打卡成功區塊的插入點
- [ ] admin/carbon 確實從 formosa_surveys 撈 water_bottles/hotel_nights
- [ ] i18n dailyReport keys 四個語系都還在
- [ ] API 路由 /api/formosa/daily-report 已註冊

---

## Step 1：前端 — 加回精簡版 dailyReport UI

**檔案**：`src/pages/projects/formosa-esg-2026/tracker/_TrackerPage.astro`

在打卡成功後的區塊，加入一個**可收合的選填面板**。

### UI 規格

```
┌─────────────────────────────────┐
│ 🌱 今日善足跡（選填）        ▼  │
├─────────────────────────────────┤
│                                 │
│  🍶 瓶裝水                     │
│  今天喝了幾瓶？  [ 0 ] [+][-]  │
│  回收了幾瓶？    [ 0 ] [+][-]  │
│                                 │
│  🏨 住宿                       │
│  昨晚有住宿嗎？  [有] [沒有]   │
│                                 │
│  ───────────────────────────    │
│  ℹ️ 不填也 OK！填了碳足跡更完整 │
│                                 │
│         [ 送出善足跡 ]          │
└─────────────────────────────────┘
```

### 互動規則

| 元件 | 行為 | 預設值 |
|------|------|--------|
| 整個面板 | 預設**收合**，點標題列展開/收合 | 收合 |
| 瓶裝水數量 | 數字 stepper，範圍 0-99 | 0 |
| 回收瓶數 | 數字 stepper，範圍 0-99，**不能大於瓶裝水數** | 0 |
| 住宿 | 兩個按鈕「有」「沒有」 | 未選（null） |
| 送出按鈕 | 呼叫 API，成功後顯示「✅ 已記錄」並收合面板 | — |
| 重複送出 | 同一天可多次送出，後端自動覆蓋更新 | — |

### API 呼叫

```javascript
// POST /api/formosa/daily-report
const res = await fetch(`${API_BASE}/api/formosa/daily-report`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    line_user_id: userId,
    water_bottles: waterCount,       // 整數
    recycle_bottles: recycleCount,   // 整數
    hotel: stayedOvernight ? 1 : 0   // 0 或 1
    // ⚠️ 不送交通欄位！全部走 GPS 自動偵測
  })
});
```

### 關鍵注意

- **交通欄位不要送**。碳足跡的交通計算完全靠 GPS 自動偵測。handler 會把沒送的欄位預設 0，不會出錯，但如果前端送了交通數據會造成重複計算。
- **不影響打卡流程和等級計算**。這個面板是打卡「之後」的附加選填，打卡本身的邏輯完全不碰。
- **LINE in-app browser 相容**：stepper 用自訂 +/- 按鈕比 `<input type="number">` 安全，LINE WebView 對原生 number input 的支援不穩定。

---

## Step 2：i18n 翻譯精簡

**檔案**：`src/i18n/translations/` 下四個語系檔

保留 `dailyReport` 區塊，但**砍掉交通相關 keys**，精簡為：

**`src/i18n/translations/zh-Hant.ts`**：
```javascript
dailyReport: {
  title: '今日善足跡',
  waterBottles: '今天喝了幾瓶瓶裝水？',
  recycled: '回收了幾瓶？',
  stayed: '昨晚有住宿嗎？',
  optional: '不填也 OK！填了碳足跡會更完整',
  submit: '送出善足跡',
  submitted: '已記錄',
},
```

**`src/i18n/translations/zh-Hans.ts`**：
```javascript
dailyReport: {
  title: '今日善足迹',
  waterBottles: '今天喝了几瓶瓶装水？',
  recycled: '回收了几瓶？',
  stayed: '昨晚有住宿吗？',
  optional: '不填也 OK！填了碳足迹会更完整',
  submit: '提交善足迹',
  submitted: '已记录',
},
```

**`src/i18n/translations/en.ts`**：
```javascript
dailyReport: {
  title: 'Daily Footprint',
  waterBottles: 'Bottled water consumed today?',
  recycled: 'Bottles recycled?',
  stayed: 'Did you stay overnight?',
  optional: 'Optional — helps make your carbon report more complete',
  submit: 'Submit footprint',
  submitted: 'Recorded',
},
```

**`src/i18n/translations/ja.ts`**：
```javascript
dailyReport: {
  title: '今日の善フットプリント',
  waterBottles: '今日ペットボトルの水を何本飲みましたか？',
  recycled: '何本リサイクルしましたか？',
  stayed: '昨晩宿泊しましたか？',
  optional: '任意です。記入するとカーボンレポートがより正確になります',
  submit: '送信',
  submitted: '記録済み',
},
```

**要移除的舊 keys**（四個語系都砍）：`transport`、`drove`、`hsr`、`train`、`envImpact`、`autoCalcNote`

---

## Step 3：Worker — 修正 admin/carbon 的 SQL

**檔案**：`worker/src/formosa.js`，`handleFormosaAdminCarbon` 函式（約第 1092 行）

### 目前的問題程式碼

admin/carbon 從 `formosa_surveys` 撈水瓶和住宿：
```sql
SELECT ... water_bottles, hotel_nights ... FROM formosa_surveys
```
但新版問卷 submit 不寫這兩欄，所以永遠是 0。

### 改法

新增一個額外的查詢，從 `formosa_daily_reports` 撈：

```sql
SELECT 
  COALESCE(SUM(water_bottles), 0) as water_total,
  COALESCE(SUM(recycle_bottles), 0) as recycle_total,
  COALESCE(SUM(hotel), 0) as hotel_total
FROM formosa_daily_reports
```

用這個查詢的結果取代回傳中的 `water_bottles_total` 和 `hotel_nights_total`。

**⚠️ 欄位名陷阱**：`formosa_daily_reports` 的住宿欄位叫 `hotel`（值 0 或 1），不是 `hotel_nights`。每天回報一筆，`SUM(hotel)` 就等於總住宿人晚數。

### Dashboard 前端確認

檢查 `src/pages/projects/formosa-esg-2026/dashboard/_DashboardPage.astro`，確認它用的是 admin/carbon 回傳的 `water_bottles_total` 和 `hotel_nights_total` 欄位名。只要回傳的 JSON key 名稱不變，Dashboard 端就不用動。

---

## Step 4：Smoke Test

完成 Step 1-3 後，commit + push，然後逐項驗證：

### 4-1. API 端點測試

```bash
# 測試 daily-report 提交（Worker deploy 前用現有的 endpoint 測，應該本來就能通）
curl -s -X POST https://api.paulkuo.tw/api/formosa/daily-report \
  -H "Content-Type: application/json" \
  -d '{"line_user_id":"smoke_test_cowork","water_bottles":3,"recycle_bottles":1,"hotel":1}'
# ✅ 預期回應：{"ok":true} 或包含 ok 的 JSON

# 測試 admin/carbon（需要 Paul deploy Worker 後才能驗 SQL 改動）
curl -s https://api.paulkuo.tw/api/formosa/admin/carbon \
  -H "X-Admin-Token: ${FORMOSA_ADMIN_TOKEN}" | jq '{water_bottles_total, hotel_nights_total}'
# ✅ 預期：water_bottles_total ≥ 3, hotel_nights_total ≥ 1
```

### 4-2. 前端頁面測試（git push 觸發 auto-deploy 後）

1. **登入** Tracker → 打卡 → 確認打卡成功區塊下方出現「🌱 今日善足跡」收合面板
2. **展開面板** → 填入水瓶 2 瓶、回收 1 瓶、住宿選「有」
3. **按送出** → 顯示「✅ 已記錄」→ 面板自動收合
4. **重新展開** → 確認可以再次填寫送出（覆蓋更新）
5. **不填直接收合** → 確認不會觸發任何 API 呼叫或錯誤

### 4-3. Dashboard 驗證（需 Paul deploy Worker 後）

開 Dashboard 頁面，確認碳足跡區塊的「瓶裝水」和「住宿」數字不再是 0。

### Smoke Test 確認清單

- [ ] API daily-report POST 回傳 ok
- [ ] API admin/carbon 的 water_bottles_total 和 hotel_nights_total 有值
- [ ] 前端面板出現在打卡成功後
- [ ] 面板預設收合，展開/收合正常
- [ ] 填寫送出後顯示「已記錄」
- [ ] Dashboard 水瓶和住宿數字正確
- [ ] 不填不送也不報錯

---

## Step 5：回報

完成後寫入 `worklogs/worklog-2026-04-10.md`：

```markdown
# Worklog 2026-04-10

## 完成日誌（最新在上）
- {HH:MM} Issue #162 admin/carbon SQL 改撈 formosa_daily_reports 表 ({commit hash}) Code
- {HH:MM} Issue #162 i18n dailyReport keys 精簡，移除交通相關（4 語系）({commit hash}) Code
- {HH:MM} Issue #162 恢復今日善足跡選填 UI：水瓶 + 住宿收合面板 ({commit hash}) Code

## 待辦快照
### 高優先 🔴
- (無，本次任務完成即可)

## 待 Paul 執行
- [ ] Worker deploy: `cd ~/Desktop/01_專案進行中/paulkuo.tw/worker && wrangler deploy --config wrangler.toml` → 驗證: `curl https://api.paulkuo.tw/health` 確認版本更新
- [ ] 前端已 auto-deploy（git push 觸發 Cloudflare Pages）→ 驗證: 瀏覽器開 Tracker 頁面確認善足跡面板出現

## Smoke Test 結果
- [ ] API daily-report POST: {pass/fail}
- [ ] API admin/carbon 水瓶住宿有值: {pass/fail}
- [ ] 前端面板出現且互動正常: {pass/fail}
- [ ] Dashboard 數字正確: {pass/fail}（需 Paul deploy Worker 後才能驗）

## 技術備忘
- {如果有踩坑紀錄寫在這裡}
```

---

## 摘要：執行順序

```
git pull origin main
    ↓
Step 0：偵察（6 項確認）
    ↓ 全部 OK
Step 1：前端加回善足跡面板
    檔案：src/pages/projects/formosa-esg-2026/tracker/_TrackerPage.astro
    ↓
Step 2：i18n 精簡 dailyReport keys
    檔案：src/i18n/translations/{zh-Hant,zh-Hans,en,ja}.ts
    ↓
Step 3：Worker admin/carbon SQL 改撈 daily_reports
    檔案：worker/src/formosa.js（handleFormosaAdminCarbon，約第 1092 行）
    ↓
git add + commit + push（觸發前端 auto-deploy）
    ↓
Step 4：Smoke Test（API → 前端 → Dashboard）
    ↓
Step 5：寫 worklog 回報
    ↓
提醒 Paul 跑 wrangler deploy（Worker 端）
```
