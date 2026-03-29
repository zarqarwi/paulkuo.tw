# Handoff: 碳足跡係數統一 + 碳足跡顯示 Bug 修復

**來源**：Cowork session（2026-03-29）
**目標**：Code session 執行
**優先級**：🔴 高（上線前必修，影響使用者看到的數據正確性）

---

## 背景

Cowork 比對了前端 `tracker/index.astro` 和 Worker `formosa.js` 的碳足跡公式，發現：

1. 實際計算用的 GWP_FACTORS（Ecoinvent 3.10）是最新版，但 LINE Bot 文案和 carbon_saved 用舊係數
2. **嚴重 Bug**：「我的進香足跡」頁面的碳足跡永遠顯示 45.00 kg CO₂e，不管走多遠、有沒有搭車都不變

---

## Bug 分析：碳足跡永遠 45.00

### 根本原因

Worker `handleFormosaUser` GET 回傳碳足跡的優先邏輯（約 line 674）：

```javascript
const carbonKg = dailyAgg?.total_gwp > 0 ? dailyAgg.total_gwp : (survey?.carbon_total_kg || 0);
```

**問題鏈**：
1. 使用者填完問卷時，前端計算出 `carbon_total_kg = 45.00`（基於問卷答案），直接送給 Worker 存進 `formosa_surveys`
2. 使用者之後只有 GPS 打卡，**沒有提交每日碳足跡回報**（daily report）
3. 所以 `dailyAgg.total_gwp` 永遠是 0
4. 系統永遠 fallback 到問卷的 `carbon_total_kg = 45.00`
5. 而且問卷碳排是 client 算好送來的，Worker 不驗證也不重算

**結果**：不管使用者打卡幾次、走了多遠，碳足跡永遠是問卷那次的 45.00。

### 截圖佐證

前端顯示：
- 10 個定位點，20.2 公里
- 碳足跡：45.00 kg CO₂e（固定不變）
- 相當於少開車 20.2 公里（這個用的是 GPS km，是對的）
- 相當於 0.19 棵樹的年吸收量（用 45.00 算的，也是錯的）

---

## Step 0 偵察

```bash
# 1. 確認碳足跡 fallback 邏輯
grep -n "carbon_total_kg\|total_gwp\|carbonKg" worker/src/formosa.js

# 2. 確認問卷碳排存入方式
grep -n "carbon.*total\|carbon.*breakdown" worker/src/formosa.js

# 3. 找前端碳足跡顯示邏輯
grep -n "total_gwp\|carbonKg\|carbon\|碳足跡" src/pages/projects/formosa-esg-2026/tracker/index.astro

# 4. 找 LINE Bot 舊係數
grep -n "0.21\|碳足跡小知識\|kg/km" worker/src/formosa.js

# 5. 找 carbon_saved 舊係數
grep -n "hypothetical\|carbon_saved\|walkKm \*" worker/src/formosa.js
```

---

## 具體修改

### 修改 1（Bug 修復）：碳足跡應動態計算，不依賴問卷靜態值

**檔案**：`worker/src/formosa.js`（handleFormosaUser GET）

**目前邏輯**（壞的）：
```javascript
const carbonKg = dailyAgg?.total_gwp > 0 ? dailyAgg.total_gwp : (survey?.carbon_total_kg || 0);
```

**建議改法**：碳足跡應該用三層來源合併計算：

```javascript
// 1. 每日回報的碳排（如果有的話）
const dailyCarbon = dailyAgg?.total_gwp || 0;

// 2. GPS 步行里程 → 碳排 = 0（步行不排碳，但可以算「節省」多少）
// totalKm 已經算好了（Haversine 累計）

// 3. 問卷碳排只在沒有任何其他數據時才用
let carbonKg;
if (dailyCarbon > 0) {
  // 有每日回報，用每日回報
  carbonKg = dailyCarbon;
} else if (totalKm > 0) {
  // 有 GPS 打卡但沒每日回報 → 假設全程步行，碳排 = 0
  // 但「節省碳排」= totalKm * GWP_FACTORS.car
  carbonKg = 0;
} else {
  // 完全沒數據，用問卷值
  carbonKg = survey?.carbon_total_kg || 0;
}
```

**同時更新前端換算文字**：
```javascript
// 「少開車 XX 公里」應改用 carbonKg 反算，或直接用 totalKm
// 「相當於 XX 棵樹」應基於實際 carbonKg
var treesEquiv = (carbonKg / 240).toFixed(2);  // 一棵樹年吸收約 240 kg CO₂
```

**⚠️ 設計決策（需 Paul 確認）**：
- 方案 A：有 GPS 打卡但沒每日回報 → 碳排顯示 0（因為步行 = 0 碳）
- 方案 B：有 GPS 打卡但沒每日回報 → 顯示「節省了 XX kg 碳排」（正面表述）
- 方案 C：碳足跡區塊改成顯示「碳節省量」而非「碳排放量」（因為進香大多步行）

建議採 **方案 B**，因為香客主要是步行，顯示「你用雙腳走了 20.2 公里，相當於省下 XX kg 碳排」更有成就感。

### 修改 2：LINE Bot 碳足跡小知識文案

**檔案**：`worker/src/formosa.js`
**問題**：Bot 推播的簡化係數跟實際計算差距很大

| 交通方式 | Bot 目前顯示 | Ecoinvent 3.10 正確值 |
|---------|------------|-------------------|
| 開車 | 0.21 | 0.30 |
| 機車 | 0.05 | 0.14 |
| 公車 | 0.04 | 0.48 |
| 火車 | 0.04 | 0.08 |
| 高鐵 | 0.03 | 0.07 |
| 捷運 | 0.02 | 0.08 |
| 瓶裝水 | 0.08 | 0.11 |
| 旅宿 | 10 | 12.5 |

建議更新為：
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

### 修改 3：carbon_saved_kg 計算

**檔案**：`worker/src/formosa.js`
**問題**：全局碳節省量計算用了舊的汽車係數 `0.21`

```javascript
// 目前（舊）
const hypothetical = walkKm * 0.21;

// 應改為（直接引用 GWP_FACTORS.car，避免未來漏改）
const hypothetical = walkKm * GWP_FACTORS.car;
```

---

## 驗證方式

1. **Bug 修復驗證**：用測試帳號打卡幾次，檢查碳足跡是否不再固定 45.00
2. `grep -n "0.21" worker/src/formosa.js` → 應不再出現
3. `grep -n "carbon_total_kg" worker/src/formosa.js` → 確認 fallback 邏輯已更新
4. 部署後用 LINE Bot 觸發碳足跡小知識推播，確認新數字
5. Dashboard 檢查 carbon_saved_kg 數值

---

## 注意事項

- 前端 `DR_FACTORS` 和 Worker `GWP_FACTORS` 目前已一致，**不需要改**
- 等級系統 `TITLES` / `computeRank` 前後端已一致，**不需要改**
- Haversine 距離計算前後端已一致，**不需要改**
- 修改 1 涉及設計決策（方案 A/B/C），Code session 可先問 Paul 或直接採方案 B

---

## 回報格式

完成後在 worklog 記錄：
```
- {HH:MM} 碳足跡顯示 bug 修復 + 係數統一 Ecoinvent 3.10 ({commit hash}) Code
```
