# Handoff: Formosa R3 修復 — UserSync 噪音過濾 + source 白名單

> 來源：Cowork session 2026-04-10，R3 audit 完成後
> 目標：Code session 執行
> 建議模型：**Opus + Max effort**（跨檔案語義重構，要確保三處共用函數邏輯一致）
> 預計時間：30-45 分鐘
> 起駕倒數：4/12（剩 2 天）⚠️

---

## 背景

R3 audit 找到 2 個🔴必修項目：

1. **FIX-1 [P0]**：`handleFormosaUserSync`（`formosa.js:1810-1815`）里程計算完全無噪音過濾，而 Stats API 和 LINE Bot 都有三重過濾（<10m, <30s gap, >300km/h）。ShareCard 里程可能比 Stats API 高 2-10 倍，起駕後大量分享會出現失真數據。

2. **FIX-2 [P1]**：TrackSync 和 Checkin batch 的 `pt.source` 無白名單，可偽造 `source:'manual'` 快速刷打卡數升級。

**Paul 額外決定**：在共用過濾函數裡加入 `source !== 'remote'` 排除條件，確保 geofence 外的 GPS 點不計入里程。

---

## Step 0 — 偵察（先查再改）

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw

# 1. 確認 Stats/LINE Bot 的三重過濾在哪裡
grep -n "300\|30s\|10m\|filter.*gps\|gps.*filter\|noise\|haversine" worker/src/formosa.js | head -40

# 2. 確認 UserSync 里程計算位置
sed -n '1800,1830p' worker/src/formosa.js

# 3. 確認 Stats 的過濾邏輯（約 :989）
sed -n '980,1010p' worker/src/formosa.js

# 4. 確認 LINE Bot 的過濾邏輯（約 :1591）
sed -n '1580,1620p' worker/src/formosa.js

# 5. 確認 source 白名單漏洞
sed -n '440,450p' worker/src/formosa.js
sed -n '520,535p' worker/src/formosa.js
grep -n "computeRank\|source.*manual" worker/src/formosa.js | head -20
```

---

## FIX-1：抽共用函數 `computeFilteredKm(pts)`

### 目標

把 Stats API 和 LINE Bot 已有的三重過濾邏輯抽成共用函數，給 UserSync 也用。同時在過濾條件裡加入 `source !== 'remote'` 排除 geofence 外的 GPS 點。

### Step 1：在 formosa.js 適當位置（建議在 haversineKm 函數附近）插入共用函數

```javascript
/**
 * 計算過濾後的里程（公里）
 * 過濾條件：
 *   - source !== 'remote'（排除 geofence 外打卡）
 *   - 相鄰點距離 >= 10m（排除 GPS drift）
 *   - 相鄰點時間差 >= 30 秒（排除短時間爆點）
 *   - 相鄰點速度 <= 300 km/h（排除跳躍點）
 * @param {Array} pts - GPS 點陣列，每個點有 { lat, lng, timestamp, source }
 * @returns {number} 過濾後的總里程（公里）
 */
function computeFilteredKm(pts) {
  if (!pts || pts.length < 2) return 0;
  
  // 排除 remote 點並按時間排序
  const filtered = pts
    .filter(p => p.source !== 'remote')
    .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
  
  let totalKm = 0;
  for (let i = 1; i < filtered.length; i++) {
    const prev = filtered[i - 1];
    const curr = filtered[i];
    
    const dist = haversineKm(prev.lat, prev.lng, curr.lat, curr.lng);
    const timeDiff = ((curr.timestamp || 0) - (prev.timestamp || 0)) / 1000; // 秒
    
    // 三重過濾
    if (dist < 0.01) continue;                          // < 10m 跳過
    if (timeDiff > 0 && timeDiff < 30) continue;        // < 30s 跳過
    const speed = timeDiff > 0 ? (dist / timeDiff) * 3600 : 0;
    if (speed > 300) continue;                           // > 300 km/h 跳過
    
    totalKm += dist;
  }
  
  return totalKm;
}
```

### Step 2：找到 Stats API 和 LINE Bot 的過濾邏輯

偵察步驟已確認位置後，**確認這兩處的過濾條件和上面的共用函數邏輯一致**。

如果一致 → 直接把這兩處的 inline 計算替換成 `computeFilteredKm(pts)` 調用。

如果略有差異 → **以 Stats API 的邏輯為準**（它是主要的計算依據），調整共用函數後替換。

### Step 3：找到 UserSync 的里程計算（`formosa.js:1810-1815` 附近）

原本大概長這樣：
```javascript
// 某種直接累加所有 GPS 點的邏輯
const totalKm = gpsPoints.reduce((sum, pt, i) => {
  if (i === 0) return 0;
  return sum + haversineKm(gpsPoints[i-1].lat, gpsPoints[i-1].lng, pt.lat, pt.lng);
}, 0);
```

替換成：
```javascript
const totalKm = computeFilteredKm(gpsPoints);
```

---

## FIX-2：source 白名單

### 在 formosa.js 頂部（或 VALID_SOURCES 適合的位置）加入

```javascript
const VALID_SOURCES = new Set(['auto', 'manual', 'photo', 'checkin', 'remote']);
```

### 在 TrackSync handler（`formosa.js:444` 附近）對每個 track point 做 sanitize

```javascript
// 找到處理 track_points 的地方，在 source 賦值前加
const sanitizedSource = VALID_SOURCES.has(pt.source) ? pt.source : 'auto';
// 然後用 sanitizedSource 代替 pt.source 寫入 D1
```

### 在 Checkin batch handler（`formosa.js:525` 附近）做同樣處理

```javascript
const sanitizedSource = VALID_SOURCES.has(pt.source) ? pt.source : 'auto';
```

---

## 吳心恬雙等級 bug 調查

**症狀**：同時顯示「煉氣」（Tracker 等級卡）和「元嬰」（成就卡彈窗）

**假設**：FIX-1 修復後，UserSync 里程降低 → computeRank 重算 → 等級降回正確值，雙等級自然消失

**操作**：
1. 修完 FIX-1 後，找到吳心恬的 line_user_id
2. 查她的 GPS points 數量和里程（過濾前 vs 過濾後差多少）
3. 重新跑一次 UserSync → 確認 MyPage 等級和 Tracker 等級一致

如果修完 FIX-1 後雙等級還在，才需要深入查成就卡彈窗的觸發條件。

---

## 驗證 Checklist

- [ ] `computeFilteredKm` 函數存在且有 remote 排除條件
- [ ] Stats API 和 LINE Bot 都改用 `computeFilteredKm`（或 inline 邏輯一致）
- [ ] UserSync 里程改用 `computeFilteredKm`
- [ ] `VALID_SOURCES` Set 存在
- [ ] TrackSync 和 Checkin batch 都用 `sanitizedSource`
- [ ] 找一個測試用戶手動觸發 UserSync，確認里程數字合理（不比 Stats API 高太多）
- [ ] 吳心恬雙等級確認（修 FIX-1 後）

---

## 部署方式

這些是 Worker 改動：
```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw/worker
wrangler deploy --config wrangler.toml
```

⚠️ Paul 本機執行（Code 沒有 wrangler 部署權限）

---

## 回報格式

完成後更新 `worklogs/worklog-2026-04-10.md`：

```markdown
## 完成日誌
- {HH:MM} R3-FIX-1 computeFilteredKm 共用函數 + remote 排除 ({commit hash}) Code
- {HH:MM} R3-FIX-2 VALID_SOURCES 白名單 ({commit hash}) Code
- {HH:MM} 吳心恬雙等級 bug 確認（{修好了 / 還需要查}）Code

## 待 Paul 執行
- [ ] Worker deploy → 驗證: curl https://api.paulkuo.tw/api/formosa/health
- [ ] 確認分享卡里程數字合理（MyPage 里程 ≈ Stats API 里程）

## 決策紀錄
- remote 排除：加在 computeFilteredKm 裡，所有下游統一行為，符合 Paul 決策

## 阻礙與踩坑
- {如有}
```

---

## 注意事項

1. **Stats API 邏輯是基準** — 如果三處邏輯略有差異，以 Stats API 為準
2. **FIX-1 是主菜，FIX-2 是配菜** — 如果時間有限，先確保 FIX-1 正確再動 FIX-2
3. **Worker 部署必須帶 `--config`** — 根目錄的 `wrangler.jsonc` 是 og-worker，不是主 Worker
4. **前端部署不需要動** — 這兩個修復都是 Worker 邏輯
5. **R3 中的 🟡 觀察項目本次不修** — 403 UX、Cron 效能等留待活動結束後處理
