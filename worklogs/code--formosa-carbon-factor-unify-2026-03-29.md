# Handoff: 碳足跡架構重構 — GPS 速度推算 + 係數統一 + Bug 修復

**來源**：Cowork session（2026-03-29）
**目標**：Code session 執行
**優先級**：🔴 高（上線前必修，影響使用者看到的數據正確性）

---

## 背景

Cowork 比對了前端 `tracker/index.astro` 和 Worker `formosa.js` 的碳足跡公式，發現：

1. **嚴重 Bug**：「我的進香足跡」碳足跡永遠顯示 45.00 kg CO₂e，不管走多遠都不變
2. LINE Bot 文案和 carbon_saved 用舊係數，跟 Ecoinvent 3.10 不一致
3. 每日碳足跡回報（daily report）需要使用者手動填交通方式，但 **GPS 軌跡的移動速度就能自動推算交通方式**

**Paul 決定**：用 GPS 速度推算取代手動填報交通方式，大幅簡化使用者體驗。問卷中的交通方式題目也可以移除。

---

## Bug 分析：碳足跡永遠 45.00

Worker `handleFormosaUser` GET（約 line 674）：

```javascript
const carbonKg = dailyAgg?.total_gwp > 0 ? dailyAgg.total_gwp : (survey?.carbon_total_kg || 0);
```

**問題鏈**：
1. 使用者填問卷時前端算出 `carbon_total_kg = 45.00`，送給 Worker 存進 `formosa_surveys`
2. 之後只有 GPS 打卡，沒提交每日回報 → `dailyAgg.total_gwp` 永遠是 0
3. 系統永遠 fallback 到問卷的 45.00
4. GPS 里程完全沒有反映到碳足跡數字上

---

## 新架構：GPS 速度推算碳排

### 核心邏輯

在 Worker 端計算 `handleFormosaUser` GET 時，用相鄰 GPS 點的速度推算交通方式：

```javascript
const SPEED_THRESHOLDS = [
  { maxSpeed: 8,    mode: 'walk',    gwp: 0 },        // < 8 km/h → 步行
  { maxSpeed: 20,   mode: 'bike',    gwp: 0.01220 },   // 8-20 km/h → 腳踏車
  { maxSpeed: 40,   mode: 'scooter', gwp: 0.13734 },   // 20-40 km/h → 機車
  { maxSpeed: 80,   mode: 'car',     gwp: 0.30479 },   // 40-80 km/h → 汽車
  { maxSpeed: Infinity, mode: 'hsr', gwp: 0.07487 }    // > 80 km/h → 高鐵/火車
];

function inferTransportMode(speedKmh) {
  for (const t of SPEED_THRESHOLDS) {
    if (speedKmh <= t.maxSpeed) return t;
  }
}
```

### 計算流程

在現有的 Haversine 距離累計迴圈裡，同時推算碳排：

```javascript
const pts = points?.results || [];
let totalKm = 0;
let totalCarbon = 0;
const transportBreakdown = { walk: 0, bike: 0, scooter: 0, car: 0, hsr: 0 };

for (let i = 1; i < pts.length; i++) {
  const dist = haversine(pts[i-1].lat, pts[i-1].lng, pts[i].lat, pts[i].lng);
  const timeDiffHours = (new Date(pts[i].timestamp) - new Date(pts[i-1].timestamp)) / 3600000;

  if (dist < 0.01 || timeDiffHours <= 0) continue; // 濾掉雜訊

  const speed = dist / timeDiffHours;
  const transport = inferTransportMode(speed);

  totalKm += dist;
  const segmentCarbon = dist * transport.gwp;
  totalCarbon += segmentCarbon;
  transportBreakdown[transport.mode] = (transportBreakdown[transport.mode] || 0) + dist;
}
```

### 碳足跡合成（取代舊的 fallback 邏輯）

```javascript
// GPS 推算的交通碳排
const gpsCarbon = totalCarbon;

// 每日回報的非交通碳排（住宿、瓶裝水等，如果有填的話）
const dailyNonTransport = dailyAgg?.hotel_carbon || 0 + dailyAgg?.water_carbon || 0;

// 合成碳足跡
const carbonKg = gpsCarbon + dailyNonTransport;

// 碳節省量（如果全程開車要排多少）
const carbonSaved = totalKm * GWP_FACTORS.car - gpsCarbon;
```

### API 回傳格式更新

```javascript
stats: {
  total_km: +totalKm.toFixed(2),
  checkins,
  carbon_kg: +carbonKg.toFixed(2),
  carbon_saved_kg: +carbonSaved.toFixed(2),
  transport_breakdown: transportBreakdown,  // 新增：各交通方式的公里數
  // ...
}
```

---

## 前端顯示更新

碳足跡區塊建議改成**雙指標**顯示：

```
🌱 碳足跡

💨 X.XX kg CO₂e    ← GPS 推算的實際碳排
🌿 省下 Y.YY kg     ← 比開車少排了多少

🚶 步行 18.5 km | 🛵 機車 1.2 km | 🚗 汽車 0.5 km   ← 交通方式明細
🌳 相當於 Z.ZZ 棵樹的年吸收量
```

前端需要改的地方：
- 碳足跡數字改讀 API 回傳的 `carbon_kg`（不再用 localStorage 的固定值）
- 新增交通方式明細顯示（`transport_breakdown`）
- 「少開車 XX 公里」改成「省下 XX kg 碳排」
- 棵樹換算用 `carbon_saved_kg / 240`（正面表述）

---

## 每日善足跡回報簡化

因為交通方式已由 GPS 自動推算，每日回報表單可以**大幅精簡**：

### 移除的欄位
- ~~步行 km~~（GPS 自動算）
- ~~開車 km~~（GPS 速度推算）
- ~~共乘人數~~（移除）
- ~~機車 km~~（GPS 速度推算）
- ~~腳踏車 km~~（GPS 速度推算）
- ~~公車 km~~（GPS 速度推算）
- ~~捷運 km~~（GPS 速度推算）
- ~~火車 km~~（GPS 速度推算）
- ~~高鐵 km~~（GPS 速度推算）

### 保留的欄位
- 🚗 **你怎麼到白沙屯的？**（交通方式 + 大約公里數）→ 算「到場碳排」，GPS 追蹤開始前的那段
- 🏨 **今天有住宿嗎？**（開關）→ 12.5 kg CO₂e/晚
- 💧 **瓶裝水幾瓶？**（數字）→ 0.10974 kg/瓶
- ♻️ **回收幾瓶？**（數字）→ -0.00265 kg/瓶

表單從原本十幾個欄位縮減到 3-4 個，使用者體驗大幅改善。

---

## 問卷精簡

問卷中涉及交通方式的題目可以移除或改為選填，因為 GPS 會自動推算。

具體要看目前問卷 13 題中哪些是交通相關的（由 Code session 偵察確認）。

---

## 修改 2：LINE Bot 碳足跡小知識文案

Bot 推播的簡化係數跟實際計算差距很大，統一改成 Ecoinvent 3.10：

```
🌱 碳足跡小知識（Ecoinvent 3.10）

進香途中的碳排放來源：
🚗 開車：0.30 kg/km
🛵 機車：0.14 kg/km
🚌 公車：0.48 kg/km
🚂 火車：0.08 kg/km
🚄 高鐵：0.07 kg/km
🚇 捷運：0.08 kg/km
🚶 步行：0 kg/km ✨

💧 每瓶瓶裝水：0.11 kg
♻️ 每瓶回收：-0.003 kg
🏨 每晚旅宿：12.5 kg
```

---

## 修改 3：carbon_saved_kg 全局計算

```javascript
// 舊（硬編碼 0.21）
const hypothetical = walkKm * 0.21;

// 新（引用 GWP_FACTORS.car）
const hypothetical = walkKm * GWP_FACTORS.car;
```

---

## Step 0 偵察

```bash
# 1. 確認目前碳足跡 fallback 邏輯
grep -n "carbon_total_kg\|total_gwp\|carbonKg" worker/src/formosa.js

# 2. 確認 Haversine 迴圈位置（要在這裡加速度推算）
grep -n "haversine\|totalKm\|for.*pts.length" worker/src/formosa.js

# 3. 確認每日回報表單欄位
grep -n "dr_walk\|dr_car\|dr_scooter\|getDrVal" src/pages/projects/formosa-esg-2026/tracker/index.astro

# 4. 確認問卷中交通相關題目
grep -n "transport\|交通\|Q[0-9]" src/pages/projects/formosa-esg-2026/tracker/index.astro

# 5. 找 LINE Bot 舊係數
grep -n "0.21\|碳足跡小知識\|kg/km" worker/src/formosa.js

# 6. 找 carbon_saved 舊係數
grep -n "hypothetical\|carbon_saved\|walkKm \*" worker/src/formosa.js
```

---

## 驗證方式

1. 用測試帳號打卡 3-5 次（步行速度），確認碳足跡顯示接近 0 而非 45.00
2. 模擬一筆高速移動的 GPS 點（開車速度），確認碳排會增加
3. 確認 `transport_breakdown` 在 API 回傳中有正確的交通方式分佈
4. 確認每日回報表單已精簡（交通欄位移除）
5. `grep -n "0.21" worker/src/formosa.js` → 應不再出現
6. Dashboard 的 carbon_saved_kg 數值是否合理

---

## 注意事項

- 前端 `DR_FACTORS` 和 Worker `GWP_FACTORS` 目前已一致，**不需要改**（但前端的 `calcDailyCarbon` 函數可以大幅簡化）
- 等級系統 `TITLES` / `computeRank` 前後端已一致，**不需要改**
- Haversine 距離計算前後端已一致，**不需要改**
- 速度推算有噪音風險（GPS 漂移 → 誤判交通方式），建議加 sanity check：
  - 兩點時間差 < 30 秒的片段跳過（太短不可靠）
  - 距離 < 10 米的跳過
  - 速度 > 300 km/h 的跳過（GPS 漂移異常值）

---

## 回報格式

完成後在 worklog 記錄：
```
- {HH:MM} 碳足跡架構重構：GPS 速度推算 + 每日回報精簡 + 係數統一 ({commit hash}) Code
```
