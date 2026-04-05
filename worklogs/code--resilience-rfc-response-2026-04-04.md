# Code Session: 韌性交叉比對回覆 (Issue #98)

**日期**：2026-04-04
**來源**：Paul 指派，回應 Cowork 開的 Issue #98
**產出**：Issue #98 comment（結論）+ 本 worklog（完整分析過程）

---

## 分析方法

逐項用 grep/git log 對 `main` 分支最新程式碼驗證，不做任何程式碼修改。

---

## 第一部分：R1-R10 防護驗證

### R1: Checkin 寫 KV 不碰 D1 ✅

```
grep "TICKER_KV.put|bufferKey|gps:" worker/src/formosa.js
```
結果：`handleFormosaCheckin`（line 337-438）全程只操作 KV。
- `bufferKey = gps:${ts}:${userId}:...` → `TICKER_KV.put(bufferKey, ...)` (line 385-395)
- 無任何 `AUTH_DB.prepare` 呼叫
- `gps_count:${userId}` 也是寫 KV (line 417)

### R2: 8 秒 timeout race → 202 + waitUntil ✅

```
grep "race|timeout|waitUntil|202" worker/src/formosa.js
```
結果：
- `const timeout = new Promise(resolve => setTimeout(() => resolve('timeout'), 8000));` (line 426)
- `const result = await Promise.race([work, timeout]);` (line 428)
- timeout → `ctx.waitUntil(work)` + 回 202 (line 430-432)

### R3: Dedup（userId + 10 秒）✅

```
grep "dedup|dedupKey|tsRounded" worker/src/formosa.js
```
結果：
- `tsRounded = ts.slice(0, 18)` (line 377) — ~10 秒粒度
- `dedupKey = checkin_dedup:${userId}:${tsRounded}` (line 378)
- 存在則直接回 200 + `deduplicated: true` (line 380-382)
- dedup key TTL 60 秒 (line 420)

Issue #92 修復 commit：
```
git log --oneline --grep="92" → 3cfd56b fix(checkin): add idempotency to prevent retry double-counting (#92)
```
已 merge。

### R4: Rate limit 全走 KV ✅

```
grep "checkRateLimitKV" worker/src/formosa.js
```
結果：13 處呼叫，覆蓋所有端點類型：
- checkin: 5 req/60s (line 359)
- submit: 2 req/600s (line 250)
- trackSync: 10 req/60s (line 473)
- admin endpoints: 30 req/60s (lines 68, 622, 969, 1009, 1094, 1125, 1207, 1876)
- feedback: 5 req/60s (line 2157)

`checkRateLimitKV` 實作 (line 326-333)：純 KV 操作，window-based counter。

### R5: Flush 分散式鎖 TTL 90 秒 ✅

```
grep -A 5 "flush_lock" worker/src/formosa.js
```
結果：
- `lockKey = 'formosa:flush_lock'` (line 514)
- `expirationTtl: 90` (line 521)
- finally block 檢查 `currentLock === lockId` 才刪（防誤刪下一輪的鎖）(line 609-612)

### R6: Flush D1 失敗 → 延長 KV TTL ✅

結果（line 571-580）：
```javascript
catch (e) {
  // D1 write failed — extend KV TTL to prevent data loss
  await Promise.all(valid.map(async (entry) => {
    await env.TICKER_KV.put(entry.key, JSON.stringify(entry.data), { expirationTtl: 86400 });
  }));
  continue;
}
```
重寫 TTL 為 86400（24hr），確保資料不因 D1 故障而過期消失。

### R7: INSERT OR IGNORE 防重複 ✅

```
grep "INSERT OR IGNORE" worker/src/formosa.js
```
結果（line 562）：
```sql
INSERT OR IGNORE INTO formosa_gps_points (user_id, lat, lng, altitude, accuracy, source, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)
```
搭配 unique index `idx_gps_user_ts ON (user_id, timestamp)` (line 164)。

### R8: 活動狀態控制 KV-based ✅

`getFormosaStatus` (line 10-14) 讀 KV `formosa_status`。
三處檢查：
- handleFormosaCheckin (line 347-353)
- handleFormosaTrackSync (line 451-453)
- handleFormosaSubmit 沒有直接檢查（但 submit 是問卷提交，不需要 pause 控制）

### R9: 前端失敗重送佇列 GP-6 ⚠️

```
grep "checkin_queue|formosa_checkin_queue" src/pages/projects/formosa-esg-2026/tracker/
```
結果：
- `queueFailedCheckin` (line 588-593)：存 localStorage，上限 50 筆
- `flushCheckinQueue` (line 595-605)：讀 queue → POST `/api/formosa/track/sync` → 成功清空

**觸發時機：**
1. `postCheckin` 成功後 (line 1717) — 順便 flush 之前累積的
2. `visibilitychange` 回 visible 時 (line 2226) — tab 切回來
3. ❌ `trackerInit()` 內**沒有呼叫**

**缺口**：首次載入頁面時不 flush。使用者隔天重開頁面，queue 裡的資料要等到下一次操作才送出。

### R10: Geofence 自動標記 remote ✅

```javascript
const inRange = lat >= 23.4 && lat <= 24.9 && lng >= 120.1 && lng <= 121.0;
const source = inRange ? (data.source || 'checkin') : 'remote';
```
(line 371-372)

---

## 第二部分：分歧點詳細分析

### 分歧 1：Worker 端 retry

**前端 retry 現況**（`_TrackerPage.astro:1709-1739`）：
```javascript
function postCheckin(payload, retries) {
  fetch(API_BASE + '/api/formosa/checkin', { ... })
    .then(function(res) {
      if (res.ok) {
        // 成功（200-299，包含 202）→ 標記 uploaded + flush queue
      } else if (res.status === 503 && retries > 0) {
        setTimeout(function() { postCheckin(payload, retries - 1); }, 1500);
      } else {
        // 其他錯誤 → queueFailedCheckin
      }
    })
    .catch(function(err) {
      if (retries > 0) {
        setTimeout(function() { postCheckin(payload, retries - 1); }, 1500);
      } else {
        queueFailedCheckin(...)
      }
    });
}
postCheckin(checkinPayload, 1);  // 最多 retry 1 次
```

初始 `retries = 1`，所以最多打 2 次 API call（原始 + 1 次 retry）。

**防線層次：**
1. 前端 retry 1 次（503 或網路錯誤）
2. 失敗 → localStorage queue（上限 50 筆）
3. 下次成功時 / visibilitychange 時 → flush queue via `/track/sync`
4. Worker 端 dedup 防重複計數

**結論：不需要 Worker 端 retry。現有防線足夠。**

### 分歧 2：KV buffer TTL

**TTL 出現位置：**
- GPS buffer 初始寫入：`expirationTtl: 86400` (line 395, 409, 490)
- D1 失敗後重寫：`expirationTtl: 86400` (line 577)
- 計數快取：`expirationTtl: 86400 * 30` (line 417, 498, 597) — 這是 count，不是 GPS 資料

**KV list 效能評估：**
- flush 用 `list({ prefix: 'gps:', limit: 1000, cursor })` 分頁 (line 530)
- 正常情況：5 分鐘 cron × 正常 flush = buffer 中 key 數量 < 100
- 異常情況（D1 掛 3 天 + 100 人 × 100 點/天）= 30,000 keys → 30 頁 list → 可能 15-20 秒，在 90 秒鎖 TTL 內
- 10 天 TTL = 90,000 keys → 90 頁 → 30-45 秒，接近 90 秒鎖上限

**結論：改 3 天（259200）最平衡。**

### 分歧 3：深度健康端點

**現有 `/health` 回傳**（`index.js:135-141`）：
```json
{
  "status": "ok",
  "fitbit_token": "valid|expired|missing",
  "fitbit_last_refresh": "2026-04-04T...",
  "fitbit_hours_ago": 2.3,
  "fitbit_stale": false,
  "stock_cache_age_sec": 180,
  "tse_trading": false,
  "timestamp": "2026-04-04T..."
}
```
完全沒有 Formosa 相關資訊。

**結論：擴充 `/health` 加 Formosa 欄位，不開新端點。** 理由：
- 一個 `/health` 端點 = health-check.yml 只打一個 URL
- 新端點要處理 CORS、rate limit、routing
- D1 `SELECT 1` + KV `list({ prefix: 'gps:', limit: 1 })` 就夠判斷

### 分歧 4：前端 graceful degradation

**postCheckin 完整流程**（追蹤每個 HTTP status）：

| 回應 | 前端行為 | 使用者看到 |
|------|---------|-----------|
| 200 | 標記 uploaded + flush queue | ✓ 打卡完成 |
| 202 | 同 200（res.ok 涵蓋） | ✓ 打卡完成 |
| 429 | 顯示「太頻繁」，不 enqueue | ⏳ 打卡太頻繁 |
| 500 | queueFailedCheckin | ⚠️ 打卡已記錄，同步稍後重試 |
| 503 | retry 1 次 → 再失敗 → queue | ⚠️ 同上 |
| 網路錯誤 | retry 1 次 → 再失敗 → queue | ⚠️ 打卡已記錄，待連線後同步 |

**額外發現：問卷 submit 沒有 localStorage fallback**
- `handleFormosaSubmit` 回 500 → 前端 catch → 只有 console.error + toast
- 問卷資料在 DOM 中（各 textarea/checkbox），不像 GPS 有 localStorage 備份
- 影響：使用者填完 10 題問卷 → submit 失敗 → 資料丟失（除非使用者不關頁面重試）
- 4/12 前不建議修（邏輯複雜），但應知道這個風險

---

## 第三部分：盲區補充詳細分析

### 1. Cron baseline 覆蓋事故

**修復 commit**：`07e9247` — 在 `.github/workflows/external-eval.yml` 加 `git pull --rebase origin main`

**驗證**：
```
git log --oneline --after="2026-04-03" --grep="external eval"
→ 1b9d53f chore: external eval temporal baseline 2026-04-04
```
4/4 baseline 已成功推送，代表 rebase 生效。

**殘餘風險**：接近零。Actions 只改 `ai-ready-opt/` 目錄，不會跟 `src/` 或 `worker/` 衝突。

### 2. LINE webhook 訊息遺失

**問題**：try-catch 包住整個 for loop（`formosa.js:193-231`）。
單一 event 處理 throw → 後續 event 全部跳過。

**影響評估**：
- LINE 通常每次 webhook 送 1-5 個 events
- 最常見的 throw 來源：`getLineProfile` 失敗（LINE API 限流或 timeout）
- 如果第一個 event 的 profile fetch 失敗 → 剩下的 events 全丟

**修復建議**：把 try-catch 移入 for loop 內部。

### 3. Dashboard fetchAll Promise.all

**程式碼**（`_DashboardPage.astro:287-328`）：

6 個 fetch 用 `Promise.all`：
1. `/api/formosa/data`
2. `/api/formosa/admin/carbon`
3. `/api/formosa/admin/timeline`
4. `/api/formosa/admin/surveys`
5. `/api/formosa/admin/clusters?zoom=N`（admin only）
6. `/api/formosa/admin/users`（admin only）

**#5 clusters 是最重的端點**（GPS 全表掃描 + 距離計算），最容易 timeout。

一個掛 → 整個 Dashboard 空白 → `lastUpdated` 顯示「載入失敗」。
改 `Promise.allSettled` 後，clusters 掛了 Dashboard 仍能顯示 KPI、Carbon、Timeline 等面板。

### 4. CDN 快取

**Astro 產出物結構**：
- `_astro/xxx.abc123.js` — content hash，無快取問題
- `projects/formosa-esg-2026/tracker/index.html` — 無 hash，靠 `max-age=3600`

**Worker API**：回 `Cache-Control: public, max-age=60`（1 分鐘），不影響。

**緊急修 bug 策略**：Cloudflare Pages dashboard → Purge cache → 全站立即更新。
或者 `curl -X POST "https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache" -H "Authorization: Bearer {token}" -d '{"purge_everything":true}'`

---

## 給 Cowork 的備註

### Issue #98 沒覆蓋到的風險

1. **問卷 submit 無 localStorage fallback**：GPS 有（queueFailedCheckin），問卷沒有。使用者填完 10 題 submit 失敗 → 資料丟失。4/12 前不建議修（工程量大），但 Cowork 應知道。

2. **handleFormosaSubmit 直接寫 D1**（`formosa.js:259-306`）：不像 checkin 走 KV buffer，submit 直接 `AUTH_DB.prepare().run()`。D1 掛了 → submit 直接 500。但 submit 頻率低（每人只提交一次問卷），風險可控。

3. **migrateFormosa 每次 webhook 都跑**（`formosa.js:194`）：每個 LINE webhook 事件都呼叫 `migrateFormosa(env.AUTH_DB)`，跑 4 個 CREATE TABLE IF NOT EXISTS + 12 個 ALTER TABLE。雖然 D1 會快速跳過已存在的表/列，但在高併發時仍是不必要的 D1 負載。建議活動開始後用 KV flag 標記「已 migrate」，跳過後續呼叫。

4. **flushCheckinQueue 用 `/track/sync` 而非 `/checkin`**（`_TrackerPage.astro:598`）：queue 裡的 payload 只有 `{lat, lng, datetime, source}`，沒有 `track_points`。`/track/sync` 期望的是 `{user_id, points: [...]}`，格式不同。需確認 `/track/sync` 能正確處理這種 payload。
