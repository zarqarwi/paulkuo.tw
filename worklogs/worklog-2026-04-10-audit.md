# Formosa ESG 起駕前程式碼盤點報告

**Date**: 2026-04-10
**Auditor**: Claude Code (Opus)
**Scope**: 五大面向邏輯一致性盤點
**Approach**: Read-only — 不改程式碼，僅 trace 與記錄

---

## 盤點摘要

- 總共檢查 **~20 個核心檔案**，**~45 個邏輯點**
- 🔴 高風險（建議起駕前修）：**6 個**
- 🟡 中風險（可活動後處理）：**7 個**
- 🟢 低風險 / 資訊：**8 個**

### 🔴 高風險清單（快速總覽）

| # | 問題 | 面向 | 位置 |
|---|------|------|------|
| R1 | `formosa_phone` 從未寫入 localStorage → 成就卡永遠無法解鎖 | 一/五 | `_TrackerPage.astro:2146` reads, nowhere writes |
| R2 | Dashboard/MyPage 等級門檻與 Tracker/Worker 不一致 | 一/三 | Dashboard:288-296, MyPage:210-218 vs Tracker:1029-1037 |
| R3 | LINE Bot `buildStatsMessage` 只檢查打卡次數、忽略里程 | 三 | `formosa.js:1611` |
| R4 | LINE Bot 碳排訊息顯示 "0.48" 但實際計算用 0.12013 | 三 | `formosa.js:1633`, `formosa-i18n.js:54,89,124,159` |
| R5 | MyPage 碳排用舊錯誤係數 0.21 | 三 | `_MyPage.astro:513,520` |
| R6 | `formosa_daily_reports` 表未被 backup workflow 涵蓋 | 二 | `.github/workflows/backup-d1.yml` |

---

## 面向一：打卡功能核心邏輯

### 打卡 API 完整 Flow

```
POST /api/formosa/checkin (index.js:406)
  → handleFormosaCheckin (formosa.js:362-475)
    1. OPTIONS/method guard (363-368)
    2. Activity status check via KV `formosa_status` (371-378)
    3. JSON parse, user_id default to 'anonymous_'+Date.now() (380-381)
    4. Rate limit: 5 req / 60s / userId via KV (384)
    5. Sedan volunteer upsert if sedan token (390-398)
    6. validateGPS(lat, lng) (400-404)
    7. Geofence: lat 23.4-24.9, lng 120.1-121.0 → 'checkin'; else 'remote' (407-408)
    8. Timestamp: client-provided or new Date().toISOString() (410)
    9. Dedup: KV key `checkin_dedup:{userId}:{tsRounded}` 60s TTL (413-419)
   10. KV buffer write: `gps:{ts}:{userId}:{uuid}` TTL 3 days (424-431)
   11. Batch track_points (capped 1000) (434-448)
   12. Approximate count update in KV (450-453)
   13. 8s timeout race → 202 Accepted + ctx.waitUntil (462-469)
```

**關鍵架構**：打卡不直接寫 D1，而是 buffer 在 KV → cron 每 5 分鐘 flush 到 D1（`handleFormosaFlushBuffer`, formosa.js:543-644）。這對高併發非常有利。

### Edge Cases（已處理）

| Edge Case | 處理方式 | 位置 |
|-----------|---------|------|
| 重複打卡（10s 內） | KV dedup key, 60s TTL | formosa.js:413-419 |
| Rate limit (>5 req/min) | 429 response | formosa.js:384 |
| GPS 超出範圍 | validateGPS 檢查 -90~90, -180~180 | formosa.js:343-348 |
| 定位失敗/拒絕/逾時 | 各有 toast 提示 | _TrackerPage.astro:711-768, 1968-1972 |
| 離線打卡 | localStorage queue + flushCheckinQueue | _TrackerPage.astro:1893-1901 |
| 503 server error | 1 次 retry (1.5s delay) | _TrackerPage.astro:1882-1884 |
| KV 寫入超時 (>8s) | 202 + ctx.waitUntil 背景完成 | formosa.js:462-468 |
| 活動暫停/結束 | 403 response | formosa.js:371-378 |
| GPS 精度 >100m | 前端 discard | _TrackerPage.astro:724-728 |
| D1 flush 失敗 | 延長 KV TTL 防資料遺失 | formosa.js:606-614 |
| Flush lock 競爭 | 分散式鎖 90s TTL | formosa.js:549-557 |
| D1 重複寫入 | INSERT OR IGNORE + unique index | formosa.js:598 |
| DOM readiness | 等 `formosa-unlocked` 事件 | _TrackerPage.astro:2555-2558 |

### 🔴 R1: `formosa_phone` 從未寫入 localStorage

- **問題**：成就卡解鎖需三個條件：`surveyDone && phoneProvided && checkins >= 3`
- `phoneProvided` 讀取 `lsGet('formosa_phone')`（_TrackerPage.astro:2146）
- 電話提交（line 1481-1487）只 POST 到 API，**從未呼叫 `lsSet('formosa_phone', ...)`**
- **結果**：`phoneProvided` 永遠為 `false`，**所有用戶的成就卡永遠無法解鎖**
- **修復**：在 phone submit success callback 加 `lsSet('formosa_phone', data.phone)`

### 🟡 其他打卡相關風險

| # | 問題 | 嚴重度 | 說明 |
|---|------|--------|------|
| GPS (0,0) 被接受 | 🟡 | validateGPS 接受 lat=0, lng=0（Null Island），可能污染距離計算 |
| 打卡次數定義不一致 | 🟡 | `handleFormosaUser`(1005) 只算 `source='manual'`；`handleFormosaUserSync`(1807) 算所有 GPS 點 |
| checkin endpoint 無身份驗證 | 🟡 | POST body 的 user_id 無驗證，任何人可替他人打卡 |
| Rate limit TOCTOU race | 🟢 | 極端併發下可能 6 req 通過而非 5，影響可忽略 |
| Anonymous user_id 不確定性 | 🟢 | `'anonymous_' + Date.now()` 每次不同，無法聚合 |

---

## 面向二：資料備份

### Backup Workflow 配置

- **檔案**：`.github/workflows/backup-d1.yml`
- **Trigger**：cron `0 19 * * *`（UTC 19:00 = 台灣 03:00）+ 手動 `workflow_dispatch`
- **wrangler 路徑**：`--config worker/wrangler.toml` ✅（Issue #156 修正已到位）
- **保留**：GitHub Actions artifact, 90 天
- **失敗通知**：LINE push

### D1 Table 清單 vs 備份覆蓋率

| # | Table | 備份? | 來源 |
|---|-------|-------|------|
| 1 | `formosa_users` | ✅ | formosa.js:99 |
| 2 | `formosa_surveys` | ✅ | formosa.js:111 |
| 3 | `formosa_gps_points` | ✅ | formosa.js:164 |
| 4 | `formosa_daily_reports` | 🔴 **缺** | formosa.js:141 |
| 5 | `users` | ❌ | schema.sql:1 |
| 6 | `sessions` | ❌ | schema.sql:14 |
| 7 | `comments` | ❌ | 004_comments.sql:2 |
| 8 | `comment_likes` | ❌ | 004_comments.sql:19 |
| 9 | `scorecard_evaluations` | ❌ | 005_scorecard_evaluations.sql:2 |
| 10-21 | `tqef_*` (12 tables) | ❌ | tqef-schema.sql |
| 22-23 | `tqef_intake_audio*` (2) | ❌ | tqef-channel-c-schema.sql |
| 24 | `ai_ready_results` | ❌ | eval-worker/src/index.ts |

**覆蓋率：3 / 24 tables (12.5%)**

### 🔴 R6: `formosa_daily_reports` 未備份

這是活動期間會收集「善足跡」每日碳排數據的核心表，與其他三張 formosa 表同在一個 migration block，但 backup workflow 漏掉了。

### KV Delete 搜尋結果

| 檔案 | 行 | 程式碼 | 風險 |
|------|-----|--------|------|
| `social.js` | 353 | `env.TICKER_KV.delete('linkedin_urn')` | 🟡 低 — admin-only 端點 |

**殘留 1 處**（非 0）。Plan A worklog 宣稱已清零，但 `social.js` 這一處未被涵蓋。風險低（admin token refresh 端點），但文件記錄不正確。

### KV TTL 重點

| Key Pattern | TTL | 說明 |
|-------------|-----|------|
| `gps:*` buffer | 3 天 | Flush 失敗 3 天以上會丟資料（機率極低） |
| `gps_count:*` | 30 天 | 近似值，flush 後校正 |
| dedup key | 60s | 防重複打卡 |
| flush lock | 90s | 分散式鎖 |

---

## 面向三：等級呈現一致性 ⚠️ 最嚴重

### 計算源頭 → 呈現點 追蹤表

#### 等級門檻（checkins 欄位）

| 位置 | 檔案:行 | checkins 門檻 | 一致? |
|------|---------|--------------|-------|
| Worker computeRank | formosa.js:924-934 | 1/5/10/15/20/25/30/35/40 | ✅ 基準 |
| Worker LINE Bot | formosa.js:1598-1608 | 1/5/10/15/20/25/30/35/40 | ⚠️ 只查 checkins |
| Tracker (LIFF) | _TrackerPage.astro:1029-1037 | 1/5/10/15/20/25/30/35/40 | ✅ |
| Dashboard | _DashboardPage.astro:288-296 | **1/3/5/6/8/10/12/14/14** | 🔴 不一致 |
| MyPage | _MyPage.astro:210-218 | **1/3/5/6/8/10/12/14/14** | 🔴 不一致 |

**km 門檻全部一致**（0/15/45/90/135/180/225/270/300）。

**影響**：同一使用者（例如 6 次打卡 + 90km）在 Tracker 是 Lv2，在 MyPage/Dashboard 是 Lv4。

#### 碳排係數追蹤

| 位置 | 值 | 正確? |
|------|-----|-------|
| Worker SPEED_THRESHOLDS | 0.12013 | ✅ |
| Worker GWP_FACTORS.bus | 0.12013 | ✅ |
| Worker admin/carbon | 0.12013 | ✅ |
| Dashboard fallback | 0.12013 | ✅ |
| **LINE Bot 文字訊息** | **0.48** | 🔴 **錯** |
| **formosa-i18n.js** (4 語言) | **0.48** | 🔴 **錯** |
| **MyPage 碳排節省** | **0.21** | 🔴 **錯**（已知舊值） |
| API 文件 (5 files) | 0.47515 | 🟡 過時 |

#### 里程計算源頭

| 呈現點 | 資料來源 | 一致? |
|--------|---------|-------|
| Tracker (A) | API `/api/formosa/user/:id` → `stats.total_km` → localStorage | ✅ Server 端計算 |
| Dashboard (B) | API `/api/formosa/admin/users` → `walk_km` | ✅ 同一 haversine |
| MyPage | API `/api/formosa/user/sync` → `km` 或 localStorage | ⚠️ sync 端無 noise filter |
| Share Card (C) | localStorage `formosa_km`（同 Tracker） | ✅ |

### 🔴 R2: Dashboard/MyPage 等級門檻不一致

- **修復**：將 `_DashboardPage.astro:288-296` 和 `_MyPage.astro:210-218` 的 checkins 門檻改為 `1/5/10/15/20/25/30/35/40`，與 Worker/Tracker 對齊

### 🔴 R3: LINE Bot buildStatsMessage 只查 checkins

- `formosa.js:1611`：`if (checkins >= TITLES[i].checkins)` — 沒有檢查 `km >= TITLES[i].km`
- 其他所有位置都同時檢查 km AND checkins
- **修復**：加入 km 條件，或呼叫 `computeRank()` 統一邏輯

### 🔴 R4: LINE Bot 碳排訊息顯示 "0.48"

- `formosa.js:1633` + `formosa-i18n.js:54,89,124,159`：四種語言都顯示 "0.48 kg CO2e/km"
- 實際計算用 0.12013
- **修復**：替換為 "0.12"

### 🔴 R5: MyPage 碳排用 0.21

- `_MyPage.astro:513`：`savedKm * 0.21`
- `_MyPage.astro:520`：`savedKm * 0.21 / 22`（樹等量換算）
- `data-model-reference.md` errata 明確記載 "0.21 is wrong old value"
- **修復**：替換為 0.12013

### 🟡 其他一致性問題

| 問題 | 位置 | 說明 |
|------|------|------|
| MyPage 公仔圖用 .png，Tracker 用 .webp | MyPage:210-218 vs Tracker:1029-1037 | 不會 404 但效能差 |
| Admin API 不回傳 rank | formosa.js:1262-1277 | Dashboard 被迫 client-side 算（用錯門檻） |
| API 文件仍寫 0.47515 | docs/_content/*.md (5 files) | 文件過時 |

---

## 面向四：路徑計算與碳數據

### 距離計算完整 Flow

```
[Frontend] navigator.geolocation.watchPosition (enableHighAccuracy)
  → accuracy > 100m? → discard
  → dist < 10m AND time < 30s? → discard
  → haversine(R=6371) → addKm(dist) to localStorage
  → POST /api/formosa/checkin with GPS points

[Worker] KV buffer (TTL 3 days)
  → Cron flush (*/5 * * * *) → D1 INSERT OR IGNORE

[Worker] /api/formosa/user/:id → distance calculation:
  → SELECT * FROM formosa_gps_points WHERE user_id=? ORDER BY timestamp ASC
  → For each consecutive pair:
     dist < 0.01 km? → skip
     timeDiff <= 0?   → skip
     timeDiff < 30s?  → skip
     speed > 300 km/h? → skip (drift)
     speed <= 15 km/h? → zero_emission (walking)
     speed > 15 km/h?  → motorized → carbon += dist * 0.12013
  → carbonSaved = totalKm * 0.12013 - gpsCarbon
```

### 碳排公式完整列表

| 交通方式 | 係數 (kg CO2e/人km) | 來源 |
|---------|---------------------|------|
| walk | 0 | GWP_FACTORS, formosa.js:2032 |
| bike | 0.01220 | GWP_FACTORS |
| car | 0.30479 | GWP_FACTORS |
| scooter | 0.13734 | GWP_FACTORS |
| bus | 0.12013 | GWP_FACTORS (也用於 GPS 推斷的 motorized) |
| mrt/train | 0.07575 | GWP_FACTORS |
| hsr | 0.07487 | GWP_FACTORS |
| water (bottle) | 0.10974 kg/bottle | GWP_FACTORS |
| recycle | -0.00265 kg/bottle | GWP_FACTORS |
| hotel | 8.85 kg/night | GWP_FACTORS |

### 善足跡（Issue #162）

- 前端只送 `water_bottles`, `recycle_bottles`, `hotel`
- 交通碳排由 GPS 數據推斷，不靠用戶自報（避免重複計算）
- 日報 keyed by `UNIQUE(user_id, report_date)`，同日重送覆蓋

### 邊界條件

| 條件 | 處理方式 |
|------|---------|
| 同地點打卡兩次 | 距離 < 10m → skip，正確回傳 0 新增里程 |
| GPS 漂移 | 前端 accuracy >100m discard + server speed >300 km/h discard |
| 跨午夜 | 無「今日里程」概念，純累計，無邊界問題 |
| 日報日期 | UTC+8 手動 offset：`Date.now() + 8 * 3600 * 1000` |

### 🟡 LINE Bot 距離計算無過濾

- `formosa.js:1809-1814`：`handleFormosaUserSync` 用裸 `haversineKm()` 無任何過濾
- 無 speed check、無 min distance、無 time gap filter
- 結果：sync 回傳的 km 可能被 GPS noise 灌水
- Tracker 會被 `loadUserStats()` 覆蓋成正確值，但使用者可能短暫看到不一致數字

### 🟢 Hardcoded coefficient

- `formosa.js:1132` hardcode `0.12013` 而非用 `GWP_FACTORS.bus`，maintenance risk

---

## 面向五：參與彈性

### 5.1 時間限制

| 位置 | 類型 | 影響 |
|------|------|------|
| formosa.js:808 | Push 通知限 4/12-4/20 | 🟢 只影響推播，不影響打卡 |
| formosa.js:371-378 | 活動狀態閘（admin 控制） | 🟡 暫停/結束時全部打卡被擋 |

**沒有 hardcoded startDate/endDate 限制打卡 API**。第五天才加入的人可以正常註冊使用。

### 5.2 中斷後狀態保留：✅ 通過

- D1 資料永久保存，無 TTL、無 auto-cleanup
- **零** `DELETE FROM formosa_*` 存在於整個 codebase
- 無 cron 清理不活躍用戶
- KV buffer 3 天 TTL + 每 5 分鐘 flush → 極低風險

### 5.3 GPS 斷續後的距離

- 中斷多日後，如果在不同城市打卡（例如 200km 外），時間差很大 → speed 很低 → **通過 300 km/h filter → 距離會被計入**
- 例：200km gap / 3 days = 2.78 km/h → 被算為步行
- 這在進香場景可能是合理的（不同地點打卡），但也可能灌水
- **無「上一次打卡位置」的跳點保護機制**

### 5.4 流程順序

- 前端流程：先問卷 → 再打卡（UI 引導）
- 但 **server-side 打卡 API 不檢查問卷完成狀態**，可獨立呼叫
- 電話可後補（`handleFormosaPhoneUpdate`，formosa.js:1896-1919）
- **三個條件在「顯示成就卡」時才檢查**（_TrackerPage.astro:2144-2152），不是每次打卡
- 順序不綁定，可任意順序完成

### 5.5 重新加入

- Block/unblock LINE OA：無 `unfollow` handler → 不刪資料 → 重新 follow 時 upsert → 資料完整保留 ✅
- LIFF 重開：`/api/formosa/user/sync` 每次 login 都同步 server 資料 → localStorage 重建 ✅
- 刪除帳號：**無此功能** → 不可能意外刪資料 ✅

### 🔴 R1（同面向一）: formosa_phone 成就卡 bug

重複列出因為這直接影響參與彈性——使用者滿足所有條件仍無法領成就卡。

---

## 建議行動

### 🔴 起駕前必修（建議 4/11 前完成）

| # | 問題 | 修復方式 | 預估工時 |
|---|------|---------|---------|
| R1 | formosa_phone 未存 localStorage | phone submit callback 加 `lsSet('formosa_phone', phone)` | 5 min |
| R2 | Dashboard/MyPage 等級門檻不一致 | 對齊 checkins 為 `1/5/10/15/20/25/30/35/40` | 10 min |
| R3 | LINE Bot 等級只查 checkins | buildStatsMessage 加 km 條件或用 computeRank | 10 min |
| R4 | LINE Bot 碳排顯示 0.48 | formosa.js:1633 + formosa-i18n.js 4 處改為 0.12 | 10 min |
| R5 | MyPage 碳排用 0.21 | _MyPage.astro:513,520 改為 0.12013 | 5 min |
| R6 | formosa_daily_reports 未備份 | backup-d1.yml 加一段 export | 10 min |

**總計約 50 分鐘修復 + 測試部署時間**

### 🟡 活動後可處理

| # | 問題 | 說明 |
|---|------|------|
| 1 | GPS (0,0) validation | validateGPS 加 `(lat === 0 && lng === 0)` 排除 |
| 2 | 打卡次數定義不一致 | handleFormosaUser vs handleFormosaUserSync 統一 |
| 3 | LINE Bot sync 距離無過濾 | handleFormosaUserSync 加 noise filter |
| 4 | checkin 無身份驗證 | 加 X-Line-User-Id 對照 |
| 5 | API 文件 0.47515 過時 | 更新 5 個 docs/_content/ 檔案 |
| 6 | MyPage .png → .webp | 統一圖片格式 |
| 7 | social.js 殘留 1 處 TICKER_KV.delete | 低風險但文件不正確 |

---

## 附錄：高併發架構評估

### 優勢
- ✅ 打卡寫 KV（高吞吐），不直接寫 D1
- ✅ 8 秒 timeout + ctx.waitUntil 優雅降級
- ✅ 100KB payload limit 防濫用
- ✅ KV dedup + rate limit + D1 INSERT OR IGNORE 三重防護
- ✅ 離線 queue + 自動 retry

### 注意
- ⚠️ Flush 時如 >5000 buffered points，可能接近 Worker 30s CPU limit
- ⚠️ D1 batch 上限 100 statements/batch，在邊界運作
- ⚠️ KV count 是近似值（flush 後校正）
