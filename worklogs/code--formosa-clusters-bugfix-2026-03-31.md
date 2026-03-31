# Handoff: Fix `/api/formosa/admin/clusters` 500 Error

**Target**: Code session
**Priority**: 🔴 高（Dashboard 地圖 clustering 功能完全不可用）
**Date**: 2026-03-31

---

## 背景

Server-side clustering handoff（commit `4f62706`）部署後，`/api/formosa/admin/clusters` endpoint 回 500 Internal Server Error。其他 formosa endpoint（`/health`、`/api/formosa/data`）正常回 200。

---

## Step 0：偵察（先查再改）

```bash
# 1. 確認目前的 500（重現）
curl -s -w "\n%{http_code}" "https://paulkuo-ticker.paul-4bf.workers.dev/api/formosa/admin/clusters?zoom=9" -H "X-Admin-Token: g-formosa"

# 2. 開 wrangler tail 看真實 error stack
cd ~/Desktop/01_專案進行中/paulkuo.tw/worker && wrangler tail --config wrangler.toml

# 然後在另一個 terminal 再打一次 curl，看 tail 裡的 console.error 輸出

# 3. 確認 D1 table schema
wrangler d1 execute paulkuo-auth --remote --config wrangler.toml --command "PRAGMA table_info(formosa_gps_points);"

# 4. 確認 checkRateLimitKV 函式定義
grep -n "function checkRateLimitKV" src/formosa.js
```

---

## 已知的可疑點（兩個）

### 疑點 1：`checkRateLimitKV` 缺少 `async`

**檔案**：`worker/src/formosa.js`
**位置**：搜尋 `function checkRateLimitKV`

目前定義：
```js
function checkRateLimitKV(kv, userId, windowSec, maxRequests) {
  const window = Math.floor(Date.now() / (windowSec * 1000));
  const key = `rl:${userId}:${window}`;
  const raw = await kv.get(key);  // ← await 在非 async function 裡
  ...
}
```

如果確認缺少 `async`，修復：
```js
async function checkRateLimitKV(kv, userId, windowSec, maxRequests) {
```

> 注意：這個函式也被 `handleFormosaAdminStatus`（POST）和 `handleFormosaSubmit` 使用，修好後要確認這兩個 endpoint 也正常。

### 疑點 2：SQL 欄位名稱可能不匹配

clusters handler 的 SQL：
```sql
SELECT lat, lng, user_id, created_at FROM formosa_gps_points
```

但 `/api/formosa/data` 回傳的 GPS 資料 key 是 `timestamp`，不是 `created_at`。
用 Step 0 的 `PRAGMA table_info` 確認 D1 實際欄位名稱。

如果欄位是 `timestamp` 而非 `created_at`，需要更新 clusters handler 裡所有 `created_at` 引用：
- SQL SELECT
- WHERE clause（`since` 過濾）
- `latestByUser` 比對邏輯（`p.created_at`）
- `twoHoursAgo` 過濾（`p.created_at < twoHoursAgo`）

---

## 具體修復步驟

1. 跑 Step 0 偵察，確認真實 error message
2. 根據偵察結果修復（大概率是上面兩個疑點之一或兩者皆是）
3. 修改 `worker/src/formosa.js`
4. 本地測試：`wrangler dev --config wrangler.toml` → 打 curl 確認 200
5. 部署：`wrangler deploy --config wrangler.toml`

---

## 驗證方式

```bash
# 基本回應（應該回 200 + JSON）
curl -s -w "\n%{http_code}" "https://paulkuo-ticker.paul-4bf.workers.dev/api/formosa/admin/clusters?zoom=9" -H "X-Admin-Token: g-formosa"

# 帶 since 參數
curl -s -w "\n%{http_code}" "https://paulkuo-ticker.paul-4bf.workers.dev/api/formosa/admin/clusters?zoom=9&since=2026-03-30T00:00:00Z" -H "X-Admin-Token: g-formosa"

# 預期回應結構：
# { "clusters": [...], "front": {...}, "tail": {...}, "spread_km": 0, "total_points": 9, "total_users": 1, "zoom": 9 }
```

---

## 注意事項

- ⚠️ Worker deploy 必須帶 `--config wrangler.toml`（在 worker/ 目錄下）
- ⚠️ `checkRateLimitKV` 是共用函式，改了要確認不影響其他用到的 endpoint
- ⚠️ 部署後等 CDN 快取過期（最多 1hr），或用 hard refresh 驗證

---

## 回報格式

```
clusters bugfix 完成：
- 根因：{實際 error message}
- 修復：{改了什麼}
- 驗證：clusters?zoom=9 回 {status code}，回傳 {N} 個 clusters
- commit：{hash}
```
