# Formosa ESG 起駕前第二輪盤查報告

**執行時間**: 2026-04-10  
**方法**: 迴歸驗證 + 邊界條件 + 併發路徑 + 部署一致性（純掃查，不改程式碼）

---

## 摘要

| 面向 | 結果 |
|------|------|
| 迴歸驗證 (A) | **有問題** — 2 個 FIX 留有殘餘錯誤 |
| 邊界條件 (B) | 4 個確認安全，2 個有低風險 |
| 併發路徑 (C) | 1 個架構安全，2 個低風險 |
| 部署一致性 (D) | **不一致** — Dashboard 部署了舊版本 |

- 🔴 起駕前必修：**2 個**
- 🟡 活動期間觀察：**4 個**
- 🟢 確認安全：**9 個**

---

## 面向 A：迴歸驗證

### A.1 FIX-1 迴歸：formosa_phone localStorage

- **結果**: 🟢 通過
- **lsSet 安全性**: `lsSet` 定義於 `_TrackerPage.astro:583-585`，有 try/catch 包裹，Safari private browsing 不會 throw ✅
- **寫入時機**: 第 1507 行 `if (data.phone) { lsSet('formosa_phone', data.phone); }` 在 `showCard('done')` 之前、問卷成功回應後觸發 — 不在失敗路徑 ✅
- **key 一致性**: 寫入 `formosa_phone`（line 1508），讀出 `lsGet('formosa_phone')`（line 2151）— 完全一致 ✅
- **LIFF ↔ Safari 隔離**: LIFF 寫入的 localStorage Safari 讀不到，此為已知預期行為（CLAUDE.md 有記載），不是 bug

---

### A.2 FIX-2 迴歸：等級門檻統一

- **結果**: 🔴 未完全修復
- **發現**: Dashboard 的 TITLES checkins 門檻從未更新

| 位置 | checkins 門檻 | 狀態 |
|------|--------------|------|
| `worker/src/formosa.js:924` | 1/5/10/15/20/25/30/35/40 | ✅ |
| `tracker/_TrackerPage.astro:1028` | 1/5/10/15/20/25/30/35/40 | ✅ |
| `my/_MyPage.astro:209` | 1/5/10/15/20/25/30/35/40 | ✅ |
| `dashboard/_DashboardPage.astro:287` | **1/3/5/6/8/10/12/14/14** | 🔴 舊值！ |

**Live 驗證**（curl `/dashboard/`）確認：部署中的 Dashboard 仍顯示 `checkins: 1,3,5,6,8,10,12,14,14`。

**副作用排查**:
- TITLES 陣列長度仍為 9，未越界風險 ✅
- Dashboard TITLES 沒有 `img` 欄位，但 Dashboard 不渲染公仔圖，無 crash 風險 ✅
- 影響：管理後台的等級分佈統計（rank counts）對 Dashboard 用戶顯示的等級與香客自己看到的不同

---

### A.3 FIX-3 迴歸：碳排係數統一

- **結果**: 🔴 LINE Bot 說明文字未修復
- **Worker 計算**: `worker/src/formosa.js:957` 用 0.12013 ✅
- **前端顯示**: `my/_MyPage.astro:513,520,532`、`dashboard/_DashboardPage.astro:916,945` 皆用 0.12013 ✅
- **LINE Bot 回覆文字** (`worker/src/formosa-i18n.js`):

| locale | 碳排說明顯示 | 狀態 |
|--------|------------|------|
| zh-Hant (line 54) | `0.48 kg CO₂e/km` | 🔴 未修 |
| en (line 89) | `0.48 kg CO₂e/km` | 🔴 未修 |
| ja (line 124) | `0.48 kg CO₂e/km` | 🔴 未修 |
| zh-Hans (line 159) | `0.48 kg CO₂e/km` | 🔴 未修 |

**Dead code**: `formosa.js:1631` 有 `buildCarbonInfoMessage()` 函式包含正確的 0.12013，但此函式**從未被呼叫**——碳關鍵字觸發路徑 (`line 1470`) 呼叫的是 `botMsg(locale, 'carbon', ...)` 從 formosa-i18n.js 讀取 0.48。

**影響**：使用者問「碳足跡」關鍵字時，LINE Bot 回覆的係數與實際計算不符（0.48 vs 0.12013，差 4 倍）。

**全局確認**：程式碼中無 `0.21`、`0.47515` 殘留（原 grep 結果中只有 i18n 說明文字提到 0.21 作為對比數據，非計算用）。

---

### A.4 FIX-4 迴歸：buildStatsMessage 改用 haversine

- **結果**: 🟢 通過
- `buildStatsMessage` (`formosa.js:1577-1628`) 正確查詢所有 GPS 點，用 haversine 計算里程，與主站點計算邏輯一致 ✅
- `computeRank(totalKm, checkins)` 使用正確的 Worker TITLES（1/5/10/15/20/25/30/35/40）✅
- 效能：1000 GPS 點 → 1000 次迴圈，~1-5ms 估算，在 CF Workers 50ms CPU 預算內安全 ✅
- 0 GPS 點邊界：checkins=0, km=0 → `computeRank(0, 0)` → 回傳 TITLES[0]（level 0 門檻），不會 crash ✅

---

## 面向 B：邊界條件

### B.1 首次打卡邊界

- **結果**: 🟢 安全
- 第一次打卡（1 GPS 點）：`for (let i = 1; i < 1; i++)` 不執行，totalKm=0
- `checkins = pts.filter(p => p.source === 'manual').length || Math.max(pts.length, 1)` → 1 次打卡 = 1
- `computeRank(0, 1)` → 煉氣香客（L1 條件：km≥0, checkins≥1）✅
- 前端顯示「0.00 km」而非 NaN ✅

⚠️ 小觀察（非 bug）：若 `pts` 全部是 auto 點（無 manual），`checkins` fallback 用 `Math.max(pts.length, 1)`，即使沒有真正打卡也會算作 1 次。此為 Worker `/user/:id` 端點的特殊邏輯，與 `buildStatsMessage` 的邏輯（只算 manual）不一致，但不影響正常打卡流程。

---

### B.2 同一地點打卡兩次

- **結果**: 🟢 安全
- Haversine 回傳 0，`dist < 0.01` 過濾 → 距離 +0，打卡次數 +1 ✅
- 行為正確：兩次打卡都記錄，距離不重複計算

---

### B.3 GPS 漂移極端值

- **結果**: 🟡 可接受，但門檻偏寬鬆
- 速度過濾門檻：`speed > 300 km/h` → skip（`formosa.js:997`）
- 額外過濾：`dist < 0.01km`、`timeDiff < 30s`、`timeDiff <= 0`
- **風險分析**：進香隊伍最快約 60km/h（搭車），300km/h 會攔截大多數 GPS 跳點。但若有點在 5 分鐘間隔、距離 50km 的漂移（速度 600km/h），會被正確過濾 ✅。若漂移 < 25km 在 5 分鐘（300km/h），可能通過過濾但仍在台灣進香路線範圍內。
- geofence（lat 23.4-24.9, lng 120.1-121.0）只用於標記 source，不排除距離計算
- 活動期間觀察 GPS 異常用戶的里程數即可

---

### B.4 跨午夜打卡

- **結果**: 🟢 安全
- 系統無「今日里程」欄位，只有**累計里程**（no `todayKm` anywhere in tracker code）
- `formosa_daily_reports` 的 report_date 使用 UTC+8 (`Date.now() + 8 * 3600 * 1000`)，與台灣時區一致 ✅
- cron 推播邏輯（`formosa.js:803`）也用 UTC+8 計算 `now`

---

### B.5 問卷重複提交

- **結果**: 🟡 低風險
- `formosa_surveys` 無 UNIQUE constraint on `user_id` → 同一用戶重複提交會新增多行
- 有 rate limit 保護（`survey:${userId}` → 2 per 600s）
- 成就卡解鎖讀 localStorage `formosa_survey_done`，不依賴 SQL count → 不受影響 ✅
- `buildStatsMessage` 和 `/user/:id` 皆用 `LIMIT 1` → 不受影響 ✅
- 影響：Dashboard 的問卷統計數字可能被少量虛報（同一用戶算多次）。活動期間觀察即可。

---

### B.6 Token / 認證過期

- **結果**: 🟡 未深入驗證（LIFF SDK 自動處理）
- LIFF SDK 通常會自動 refresh access token（有效期 ~30 天，ID token ~10 分鐘）
- LINE Bot userId 儲存在 localStorage `formosa_line_user_id`，不依賴 LIFF session
- Worker API 只用 `X-Line-User-Id` header 做用戶識別，無 JWT expiry 驗證
- 建議：若使用者回報「打卡失敗」但 GPS 正常，指引重新開啟 LIFF（操作手冊已有說明）

---

## 面向 C：併發與資料競爭

### C.1 KV buffer 寫入衝突

- **結果**: 🟢 主要路徑安全，🟡 rate limit 有微小空隙
- GPS 打卡 key：`gps:{ts}:{userId}:{uuid8}` — 每次獨立，不衝突 ✅
- **Rate limit 非原子問題**：`checkRateLimitKV` 做 get → count+1 → put，兩個並發請求可能各讀到 count=4，各寫 5，等效允許 2 次而非 1 次。在 60s 窗口 5 次上限下，實際最多允許 ~6-7 次，不構成安全問題 ✅

---

### C.2 Cron flush 資料遺失風險

- **結果**: 🟢 設計安全
- **KV 從不被手動 delete**，只靠 TTL（3天）自然過期
- flush 流程：list KV keys → 批次 `INSERT OR IGNORE` 到 D1 → 不刪 KV
- D1 寫入失敗：延長 KV TTL 至 3 天（`formosa.js:611`）✅
- 新打卡在 flush 期間寫入：用新 key，與正在被 flush 的 batch 完全獨立 ✅
- `INSERT OR IGNORE` 確保重複 flush 冪等 ✅

---

### C.3 Rate limit 與 KV 吞吐

- **結果**: 🟡 KV 寫入上限在萬人場景有理論瓶頸
- 打卡：5次/分鐘/用戶 ✅，問卷：2次/10分鐘/用戶 ✅，feedback：5次/分鐘/IP ✅
- Cloudflare KV write 全域上限約 1,000 ops/s
- 每次打卡寫 3 個 KV keys（gps point + count + dedup） → 10,000 同時打卡 = 30,000 KV writes/s，超過上限
- **實際緩解**：香客不會在同一秒鐘一起打卡（分散在整個行程中），而且 rate limit 限制同一用戶 5 次/分鐘
- 活動期間監控 KV error rate，若出現 503，考慮降低 batch 密度

---

## 面向 D：部署一致性

### D.1 前端版本

- **Tracker** (`/tracker/`): Live 頁面 TITLES checkins = `1,5,10,15,20,25,30,35,40` ✅
- **Dashboard** (`/dashboard/`): Live 頁面 TITLES checkins = `1,3,5,6,8,10,12,14,14` 🔴 **舊版**

### D.2 Worker 版本

- Health check: `{"d1":"ok","kv":"ok","lastFlush":"2026-04-10T13:42:55Z"}` ✅
- Worker 在線、D1 正常、KV 正常，cron 最近已成功 flush

### D.3 前後端版本對齊

- Worker + Tracker + MyPage：三者一致，使用 FIX-1~4 ✅
- **Dashboard**：source code 和 live 頁面均為舊版，FIX-2 未同步 🔴
- Carbon 計算層（Worker + 前端）：一致 ✅
- Carbon 說明文字（LINE Bot）：與計算層不一致（0.48 vs 0.12013）🔴

---

## 風險總結

### 🔴 起駕前必修

**R2-1: Dashboard TITLES checkins 門檻未同步**
- 位置：`dashboard/_DashboardPage.astro:287-297`
- 問題：checkins 仍為 `1/3/5/6/8/10/12/14/14`，應改為 `1/5/10/15/20/25/30/35/40`（與 Worker/Tracker/MyPage 一致）
- 影響：管理後台顯示的等級分佈與香客自己看到的不同，誤導管理者

**R2-2: formosa-i18n.js 碳排說明文字仍顯示 0.48**
- 位置：`worker/src/formosa-i18n.js:54, 89, 124, 159`（四種語言）
- 問題：LINE Bot 回覆「碳足跡」關鍵字時告訴使用者係數是 0.48，但實際計算是 0.12013
- 影響：使用者會困惑（碳足跡數字比說明中的低很多）；`buildCarbonInfoMessage()` 在 formosa.js:1631 有正確值但是死碼，可以整合或改由此函式提供

---

### 🟡 活動期間觀察

- **GPS 漂移**：速度上限 300km/h 偏寬，活動期間監控里程異常用戶（正常步行 7 天最多 ~75km）
- **問卷重複行**：formosa_surveys 無 UNIQUE，活動後清理重複資料即可；survey 統計數字可能略微虛高
- **Rate limit 微小容忍度**：允許比限制多 ~1-2 次請求，影響極小
- **KV 寫入量**：若同時打卡人數突破 ~300 人/秒，KV ops/s 可能逼近上限；監控 CF KV error rate

---

### 🟢 確認安全

- FIX-1 formosa_phone localStorage：寫入時機正確、key 一致、try/catch 保護
- FIX-4 buildStatsMessage haversine：邏輯正確、效能可接受
- 首次打卡 (B.1)：km=0 正確渲染
- 同地點重複打卡 (B.2)：距離不重算、次數正常 +1
- 跨午夜時區 (B.4)：UTC+8 正確、無「今日里程」分界問題
- Cron flush 安全性 (C.2)：KV 不刪除、INSERT OR IGNORE、失敗時 TTL 延長
- Worker 在線、D1/KV 正常
- 碳排計算本身（Worker + 前端）一致用 0.12013
- TITLES 陣列長度一致（9 個）、無越界風險
