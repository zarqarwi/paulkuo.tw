# Handoff: 恢復「今日善足跡」選填區塊（水瓶 + 住宿）

> **來源**：Cowork session（4/10）
> **目標**：Code session
> **風險等級**：L2（前端 UI 改動 + Worker SQL 微調，需 PR + preview）
> **模型建議**：Sonnet / High effort
> **優先級**：🔴 高（4/12 起駕前必須上線）

---

## 背景

問卷從 Q13 優化為 Q10 時，舊版的「每日善足跡回報」（dailyReport）UI 被整個移除了。但 Worker 後端的 `handleFormosaDailyReport` handler 和 D1 的 `formosa_daily_reports` 表仍然完整存在。

現在 Dashboard 的 admin/carbon 顯示「水瓶」和「住宿」永遠是 0，因為：
1. 前端沒有入口讓使用者填報
2. admin/carbon 的 SQL 撈的是 `formosa_surveys` 表的 `water_bottles` 和 `hotel_nights`（新版 submit 不寫這兩欄）

**目標**：在打卡後提供一個輕量的「今日善足跡」選填區塊，讓香客補填水瓶和住宿。

---

## Step 0 偵察

先確認現況，再動手：

```bash
# 1. 確認 handleFormosaDailyReport 存在且完整
grep -n "handleFormosaDailyReport" worker/src/formosa.js | head -5

# 2. 確認 formosa_daily_reports 表 schema
grep -n "formosa_daily_reports" worker/src/formosa.js | head -10

# 3. 確認前端目前的打卡後 UI 結構
grep -n "checkin-success\|after-checkin\|post-checkin\|dailyReport\|daily-report" src/pages/projects/formosa-esg-2026/tracker/_TrackerPage.astro | head -20

# 4. 確認 admin/carbon 的 SQL 查詢
grep -n "water_bottles\|hotel_nights\|formosa_surveys" worker/src/formosa.js | head -15

# 5. 確認 i18n dailyReport keys 還在
grep -n "dailyReport" src/i18n/translations/zh-Hant.ts | head -10

# 6. 確認 /api/formosa/daily-report 路由存在
grep -n "daily-report\|dailyReport\|daily_report" worker/src/index.js | head -10
```

---

## 具體步驟

### Part A：前端 — 恢復精簡版 dailyReport UI

**位置**：`src/pages/projects/formosa-esg-2026/tracker/_TrackerPage.astro`

在打卡成功後的區塊，加入一個**可收合的選填面板**「🌱 今日善足跡」。

**UI 規格**：

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

**互動細節**：
- 預設**收合**（只顯示標題列），點擊展開
- 瓶裝水：數字 stepper（0-99），預設 0
- 回收瓶數：數字 stepper（0-99），預設 0，不能大於瓶裝水數
- 住宿：兩個按鈕「有」「沒有」，預設不選（未填狀態）
- 送出後顯示「✅ 已記錄」，收合面板
- 同一天重複送出 → 覆蓋更新（API 已支援 upsert）
- **不影響打卡流程和等級計算**

**API 呼叫**：

```javascript
// POST /api/formosa/daily-report
fetch(`${API_BASE}/api/formosa/daily-report`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    line_user_id: userId,
    water_bottles: waterCount,
    recycle_bottles: recycleCount,
    hotel: stayedOvernight ? 1 : 0
    // 不送交通欄位，全部走 GPS 自動偵測
  })
});
```

**⚠️ 注意**：交通相關欄位**不要送**。碳足跡的交通部分完全靠 GPS 自動偵測，不讓使用者手動填交通了。API handler 會把沒送的欄位預設為 0，不會出錯。

### Part B：i18n 翻譯更新

**位置**：`src/i18n/translations/` 下四個語系檔

保留 `dailyReport` 區塊，但精簡內容。確認以下 keys 存在：

```javascript
dailyReport: {
  title: '今日善足跡',          // zh-Hant
  waterBottles: '今天喝了幾瓶瓶裝水？',
  recycled: '回收了幾瓶？',
  stayed: '昨晚有住宿嗎？',
  optional: '不填也 OK！填了碳足跡會更完整',
  submit: '送出善足跡',
  submitted: '已記錄',
},
```

移除舊的 `transport`、`drove`、`hsr`、`train`、`envImpact`、`autoCalcNote` 等交通相關 keys（不再需要）。

四個語系都要同步更新（zh-Hant、zh-Hans、en、ja）。

### Part C：Worker — 修正 admin/carbon 的 SQL

**位置**：`worker/src/formosa.js`，`handleFormosaAdminCarbon` 函式（約第 1092 行）

目前 admin/carbon 撈的是：
```sql
SELECT ... water_bottles, hotel_nights ... FROM formosa_surveys
```

**改為從 `formosa_daily_reports` 撈**：

```sql
SELECT 
  COALESCE(SUM(water_bottles), 0) as water_total,
  COALESCE(SUM(recycle_bottles), 0) as recycle_total,
  COALESCE(SUM(hotel), 0) as hotel_total
FROM formosa_daily_reports
```

然後回傳的 `water_bottles_total` 和 `hotel_nights_total` 改用這個查詢的結果。

**⚠️ 注意**：`formosa_daily_reports` 的住宿欄位叫 `hotel`（0 或 1），不是 `hotel_nights`。SUM(hotel) 就等於總住宿人晚數。

### Part D：Dashboard 前端（如果有的話）

偵察 `src/pages/projects/formosa-esg-2026/dashboard/_DashboardPage.astro`，確認 admin/carbon 回傳的 `water_bottles_total` 和 `hotel_nights_total` 欄位名沒有變。如果沒有改欄位名，Dashboard 端不用動。

---

## 不要動的東西

- `handleFormosaDailyReport` handler — 完整且正確，不需要改
- `formosa_daily_reports` 表 schema — 已有所有需要的欄位
- `handleFormosaSubmit`（問卷提交）— Q1-Q10 流程不動
- 碳排係數 GWP_FACTORS — 不動（water: 0.10974, hotel: 8.85）
- 等級計算 / 打卡邏輯 — 完全不碰

---

## 驗證方式

### 前端驗證
1. 登入 Tracker → 打卡 → 確認打卡成功區塊下方出現「🌱 今日善足跡」收合面板
2. 展開 → 填入水瓶 2 瓶、回收 1 瓶、住宿「有」 → 送出 → 顯示「✅ 已記錄」
3. 重新整理頁面 → 再展開面板，確認可以再次送出（覆蓋更新）

### API 驗證
```bash
# 確認 daily-report endpoint 正常
curl -X POST https://api.paulkuo.tw/api/formosa/daily-report \
  -H "Content-Type: application/json" \
  -d '{"line_user_id":"test_user","water_bottles":2,"recycle_bottles":1,"hotel":1}'
# 預期：{"ok":true}
```

### Dashboard 驗證
```bash
# 確認 admin/carbon 回傳的水瓶和住宿加總不再是 0（有資料的前提下）
curl https://api.paulkuo.tw/api/formosa/admin/carbon \
  -H "X-Admin-Token: <token>"
# 檢查 water_bottles_total 和 hotel_nights_total
```

---

## 注意事項

1. **LINE in-app browser 相容**：stepper 元件用原生 `<input type="number">` 或自訂按鈕，避免 LINE WebView 的 input 問題
2. **面板預設收合**：不要搶佔打卡成功的視覺重心，善足跡是附加選填
3. **交通欄位不送**：API handler 會把缺的欄位預設 0，但碳足跡的交通計算完全走 GPS，不要讓前端送交通資料造成重複計算
4. **formosa_daily_reports 的 hotel 欄位是 0/1**：不是天數。每天回報一次，SUM 起來就是總人晚數

---

## 回報格式

完成後寫入 `worklogs/worklog-2026-04-10.md`：

```markdown
## 完成日誌
- {HH:MM} 恢復今日善足跡選填 UI（水瓶+住宿）({commit}) Code
- {HH:MM} admin/carbon SQL 改撈 daily_reports 表 ({commit}) Code

## 待 Paul 執行
- [ ] Worker deploy: cd worker && wrangler deploy --config wrangler.toml → 驗證: curl health endpoint
- [ ] 前端已 auto-deploy（git push 觸發）→ 驗證: 瀏覽器開 Tracker 確認面板出現
```
