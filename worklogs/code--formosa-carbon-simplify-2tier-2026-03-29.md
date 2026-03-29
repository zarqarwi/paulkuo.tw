
# Handoff: 碳足跡簡化為 2 級架構（Raymond 建議）

**來源**：Cowork session（2026-03-29）
**目標**：Code session 執行
**優先級**：🔴 高（接續上一輪 `code--formosa-carbon-factor-unify` 的改動）
**前置**：Worker + 前端已部署（5 級版本），本次要再簡化

---

## 背景

Raymond（ESG 顧問）review 了我們的 GPS 速度推算架構，指出：

1. **碳排計算不是目的**，減排提醒和相對比較才是
2. 車輛/機車/共乘排放差太多，GPS 速度分不出來，**細分 5 級沒意義**
3. 要做嚴謹碳排宣告得走 EPD + PCR 標準，我們的場景不需要
4. 簡化成 **兩種情境** 就好：零排放 vs. 統一參考值
5. 問卷/前端要加註記：「這是簡化估算，目的是提醒共乘與減排意識」

**Paul 決定**：快速那一級統一用**巴士（0.47515 kg CO₂e/km）**，不用共乘（省得算人數）。

---

## 改動範圍

### 1. Worker `formosa.js` — SPEED_THRESHOLDS 從 5 級改 2 級

**現在的 5 級（要改掉）：**
```javascript
const SPEED_THRESHOLDS = [
  { maxSpeed: 8,    mode: 'walk',    gwp: 0 },
  { maxSpeed: 20,   mode: 'bike',    gwp: 0.01220 },
  { maxSpeed: 40,   mode: 'scooter', gwp: 0.13734 },
  { maxSpeed: 80,   mode: 'car',     gwp: 0.30479 },
  { maxSpeed: Infinity, mode: 'hsr', gwp: 0.07487 }
];
```

**改成 2 級：**
```javascript
const SPEED_THRESHOLDS = [
  { maxSpeed: 15,   mode: 'zero_emission', gwp: 0 },          // ≤ 15 km/h → 步行/腳踏車，零排放
  { maxSpeed: Infinity, mode: 'motorized', gwp: 0.47515 }     // > 15 km/h → 統一用巴士係數
];
```

> **為什麼切在 15 km/h？** 一般步行 4-6，快走 7-8，腳踏車 10-15。15 以上幾乎都是有動力的交通工具。

### 2. Worker — transportBreakdown 簡化

```javascript
// 舊的 5 種
const transportBreakdown = { walk: 0, bike: 0, scooter: 0, car: 0, hsr: 0 };

// 新的 2 種
const transportBreakdown = { zero_emission: 0, motorized: 0 };
```

### 3. Worker — carbon_saved 計算更新

```javascript
// 碳節省量 = 如果全程都搭巴士的碳排 - 實際碳排
// （因為快速段已經用巴士係數了，所以節省量就是零排放段省下的）
const carbonSaved = totalKm * GWP_FACTORS.bus - totalCarbon;
```

> 注意：上一輪用 `GWP_FACTORS.car` 當假設基準，這次改用 `GWP_FACTORS.bus`（0.47515）跟快速段統一。

### 4. 前端 `tracker/index.astro` — 交通明細顯示簡化

**現在可能有 5 種交通方式明細，改成只顯示兩段：**

```
🌱 碳足跡（估算）

💨 X.XX kg CO₂e
🌿 省下 Y.YY kg（相比搭車）

🚶 零排放移動 18.5 km | 🚌 交通工具 3.2 km
```

- 不再列出機車/汽車/高鐵等細項
- 加上「估算」字樣

### 5. 前端 — 加註記文字

在碳足跡區塊下方加一行小字：

```
📝 碳排數據為簡化估算，以步行/腳踏車（零排放）與大眾交通工具兩種情境計算，目的是提醒減排與鼓勵共乘，非精確碳盤查數據。
```

### 6. LINE Bot 碳足跡小知識文案簡化

上一輪已經更新成 Ecoinvent 3.10 各交通工具的係數列表。配合 2 級架構，文案改成：

```
🌱 碳足跡小知識

進香途中我們用兩種方式估算你的碳足跡：
🚶 步行/腳踏車 → 零排放 ✨
🚌 搭乘交通工具 → 約 0.48 kg CO₂e/km

走越多、搭越少，碳足跡越低！
🌿 鼓勵大家多走路、多共乘，一起愛護地球 🌍

📝 此為簡化估算，目的是提醒減排意識
```

---

## Step 0 偵察

```bash
# 1. 找到 SPEED_THRESHOLDS 的位置
grep -n "SPEED_THRESHOLDS\|maxSpeed\|inferTransportMode" worker/src/formosa.js

# 2. 找到 transportBreakdown
grep -n "transportBreakdown\|zero_emission\|motorized\|walk.*bike.*scooter" worker/src/formosa.js

# 3. 找到 carbon_saved / carbonSaved 計算
grep -n "carbonSaved\|carbon_saved\|hypothetical\|GWP_FACTORS.car" worker/src/formosa.js

# 4. 找到前端交通明細顯示
grep -n "transport_breakdown\|transportBreakdown\|walk.*km\|bike.*km\|scooter.*km" src/pages/projects/formosa-esg-2026/tracker/index.astro

# 5. 找到 LINE Bot 碳足跡文案
grep -n "碳足跡小知識\|kg.*km\|步行.*排放" worker/src/formosa.js
```

---

## 驗證方式

1. `grep -n "maxSpeed" worker/src/formosa.js` → 只有 2 筆（15 和 Infinity）
2. `grep -n "scooter\|bike\|hsr" worker/src/formosa.js` → SPEED_THRESHOLDS 裡不再出現這三個 mode
3. 用測試帳號步行打卡 → 碳排接近 0
4. 前端碳足跡區塊有「估算」字樣和註記文字
5. 前端交通明細只有「零排放」和「交通工具」兩段

---

## 不需要改的

- Haversine 距離計算 — 不變
- 等級系統 TITLES / computeRank — 不變
- 每日回報表單（上一輪已精簡）— 不變
- GWP_FACTORS 完整列表 — 保留（住宿、水等其他用途還需要）

---

## 注意事項

- 這是接續 `code--formosa-carbon-factor-unify-2026-03-29.md` 的改動，那一輪的 5 級架構已經部署了
- 本次只是把 5 級壓縮成 2 級，邏輯框架（GPS 速度推算 + 碳排合成）不變
- 閾值 15 km/h 如果上線後覺得太高或太低，可以微調，不影響其他邏輯

---

## 回報格式

完成後在 worklog 記錄：
```
- {HH:MM} 碳足跡簡化為 2 級架構（Raymond 建議）：巴士統一係數 + 前端註記 ({commit hash}) Code
```
