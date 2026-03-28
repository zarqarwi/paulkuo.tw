# Handoff → Code Session: Visit Beacon 重新實作

> 來源：Cowork session 2026-03-28
> 原因：先前 Code session 回報的 392df34 commit 不存在於 remote main，改動遺失

---

## 背景

paulkuo.tw 目前依賴 Cloudflare Web Analytics（RUM）統計訪客數，但 RUM 有 adaptive sampling 問題（見文章 analytics-sampling-trap）。需要自建 visit beacon 做精確統計，並將自有數據優先顯示在 ticker bar 和儀表板。

---

## Step 0 偵察

```bash
# 確認目前 visitors.js 有哪些 export
grep -n "export.*function\|export.*async" worker/src/visitors.js

# 確認目前 index.js 的 /analytics 路由
grep -n "analytics" worker/src/index.js

# 確認 BaseLayout 有沒有已存在的 beacon script
grep -n "beacon\|/analytics/visit" src/layouts/BaseLayout.astro

# 確認 ENDPOINTS 陣列
grep -n "ENDPOINTS" worker/src/index.js

# 確認 cron handler
grep -n "handleScheduled\|cron" worker/src/index.js
```

---

## 具體實作步驟

### Step 1: worker/src/visitors.js — 新增三個函式

#### 1a. handleVisitBeacon（POST /analytics/visit）
```
- 接收前端 POST 請求
- 用 request IP + User-Agent 做 SHA-256 hash → visitor ID
- KV key `analytics:visit-set:{date}` 儲存當日 visitor hash 陣列（TTL 2 天）
- KV key `analytics:visits:{date}` 儲存 { total, unique }（TTL 35 天）
- 每次請求 total++，如果 hash 不在 set 裡則 unique++
- 回傳 { ok: true }
```

#### 1b. fetchZoneUniqueVisitors（Cron 用）
```
- 呼叫 Cloudflare Zone Analytics API 取得 uniques
- 寫入 KV `analytics:zone-uniques:{date}`（TTL 35 天）
- 用途：Zone uniques - beacon unique = AI/Bot 訪客數
```

#### 1c. 修改 fetchAnalyticsOverview
```
- 讀取 beacon visits KV（analytics:visits:{date}）
- 如果有值，用 beacon visits 覆蓋 RUM visits
- 寫回 analytics:overview KV
```

### Step 2: worker/src/index.js — 路由 + import + cron

```
- import { handleVisitBeacon, fetchZoneUniqueVisitors } from './visitors.js'
- 路由：if (path === '/analytics/visit' && method === 'POST') return handleVisitBeacon(request, env, corsHeaders);
- ENDPOINTS 陣列加入 '/analytics/visit'
- handleScheduled 的 hourly block 加入 fetchZoneUniqueVisitors(env)
```

### Step 3: src/layouts/BaseLayout.astro — 前端 beacon script

在 BaseLayout 的 `</body>` 前加入 inline script：
```html
<script is:inline>
(function() {
  // 過濾 bot
  if (navigator.webdriver) return;
  // 發送 beacon
  fetch('https://api.paulkuo.tw/analytics/visit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: location.pathname, ref: document.referrer || '' })
  }).catch(function(){});
})();
</script>
```

---

## 驗證方式

```bash
# 1. Worker JS 語法檢查
node -c worker/src/visitors.js && node -c worker/src/index.js

# 2. Merge conflict 檢查
grep -rn "<<<<<<" worker/src/ src/layouts/

# 3. 引用完整性：確認 import、route、ENDPOINTS、cron 都有
grep -n "handleVisitBeacon" worker/src/index.js
grep -n "fetchZoneUniqueVisitors" worker/src/index.js
grep -n "/analytics/visit" worker/src/index.js
grep -n "analytics/visit" src/layouts/BaseLayout.astro

# 4. git diff 確認改動範圍合理
git diff --stat
```

---

## 完成後

1. `git add` 只加改動的三個檔案
2. `git commit -m "feat(analytics): self-hosted visit beacon with IP+UA hash dedup"`
3. `git push origin main`
4. 回報 commit hash + `git log --oneline -3` 輸出

⚠️ **不需要 wrangler deploy**，Paul 會手動跑。
⚠️ KV visit-set 用 array 實作即可，目前日訪客量 ~50 完全沒問題。

---

## 注意事項

- BaseLayout.astro 已經有 duration beacon（`/analytics/beacon`），新的 visit beacon 跟它結構一致
- 不要動到現有的 handleAnalyticsBeacon（那是 duration tracking）
- CORS headers 要正確（用現有的 corsHeaders pattern）
- visitor hash 用 SHA-256（Web Crypto API），不要用 MD5
