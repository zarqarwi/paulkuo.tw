# Handoff: 統一碳足跡排放係數為 Ecoinvent 3.10

**來源**：Cowork session（2026-03-29）
**目標**：Code session 執行
**優先級**：🔴 高（上線前必修，影響使用者看到的數據正確性）

---

## 背景

Cowork 比對了前端 `tracker/index.astro` 和 Worker `formosa.js` 的碳足跡公式，
發現實際計算用的 GWP_FACTORS（Ecoinvent 3.10）是最新版，
但有兩個地方還在用舊係數，會讓使用者看到的資訊與系統實際計算結果不一致。

---

## Step 0 偵察

先確認現況，再改：

```bash
# 找 LINE Bot 推播的碳足跡小知識文案
grep -n "0.21\|碳足跡小知識\|kg/km" worker/src/formosa.js

# 找 carbon_saved 的舊係數
grep -n "hypothetical\|carbon_saved\|walkKm \*" worker/src/formosa.js

# 確認 GWP_FACTORS 定義位置
grep -n "GWP_FACTORS\|DR_FACTORS" worker/src/formosa.js src/pages/projects/formosa-esg-2026/tracker/index.astro
```

---

## 具體修改

### 修改 1：LINE Bot 碳足跡小知識文案

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

**做法**：找到 Bot 推播文案，將數字更新為 GWP_FACTORS 的四捨五入值（保留小數點兩位即可）。

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

### 修改 2：carbon_saved_kg 計算

**檔案**：`worker/src/formosa.js`
**問題**：全局碳節省量計算用了舊的汽車係數 `0.21`

```javascript
// 目前（舊）
const hypothetical = walkKm * 0.21;

// 應改為
const hypothetical = walkKm * 0.30479;  // GWP_FACTORS.car
```

**更好的做法**：直接引用 GWP_FACTORS.car，避免未來係數更新時又漏改：
```javascript
const hypothetical = walkKm * GWP_FACTORS.car;
```

---

## 驗證方式

1. `grep -n "0.21" worker/src/formosa.js` → 應該不再出現（除非是版本號之類的）
2. `grep -n "0.05\|0.04\|0.03\|0.02" worker/src/formosa.js` → 確認 Bot 文案已更新
3. 部署後，用 LINE Bot 觸發碳足跡小知識推播，確認新數字
4. 在 Dashboard 檢查 carbon_saved_kg 數值是否合理

---

## 注意事項

- 前端 `DR_FACTORS` 和 Worker `GWP_FACTORS` 目前已經一致，**不需要改**
- 等級系統 `TITLES` / `computeRank` 前後端已一致，**不需要改**
- Haversine 距離計算前後端已一致，**不需要改**
- 只改上述兩處即可

---

## 回報格式

完成後在 worklog 記錄：
```
- {HH:MM} 碳足跡係數統一為 Ecoinvent 3.10（Bot 文案 + carbon_saved） ({commit hash}) Code
```
