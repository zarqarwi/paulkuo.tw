# Code Handoff：Server-Side Clustering + Dashboard Rate Limit

> 產出日期：2026-03-31
> 來源：Cowork session
> 目標：讓 dashboard 地圖改用 Worker 端 clustering，不再在瀏覽器跑；加 admin API rate limit 防濫用

---

## 背景

4/12 起駕後預估萬人同時使用，GPS 資料量會暴增。目前 dashboard 的地圖有三個問題：

1. `/api/formosa/data` 只回傳最新 200 筆原始 GPS 點，資料不完整
2. 前端 `buildClusterLayer()` 在瀏覽器做 grid clustering（gridSize=0.02），點多了會卡
3. Worker 已有 `/api/formosa/admin/clusters` endpoint（grid 0.018°, ~2km），但前端沒接

另外 admin API 目前沒有 rate limit，任何人拿到 token 都能無限打。

---

## Step 0 偵察

```bash
# 1. 確認 clusters endpoint 存在
grep -n "handleFormosaAdminClusters\|admin/clusters" worker/src/formosa.js | head -10

# 2. 確認前端 buildClusterLayer 的位置
grep -n "buildClusterLayer\|gridSize\|cluster" src/pages/projects/formosa-esg-2026/dashboard/index.astro | head -20

# 3. 確認 fetchAll 目前打了哪些 API
grep -n "fetch.*formosa\|fetchAll" src/pages/projects/formosa-esg-2026/dashboard/index.astro | head -15

# 4. 確認現有的 KV cache key
grep -n "formosa_data_cache\|formosa_cluster" worker/src/formosa.js | head -10

# 5. 確認 rate limit 函式
grep -n "checkRateLimitKV\|ratelimit" worker/src/formosa.js | head -10
```

---

## 修改範圍

| 檔案 | 改動 |
|------|------|
| `worker/src/formosa.js` | 強化 clusters endpoint + KV 快取 + admin rate limit |
| `dashboard/index.astro` | fetchAll 加入 clusters API + 地圖改用 server clusters |

---

## Part A：Worker 端（formosa.js）

### A-1：強化 `/api/formosa/admin/clusters`

現有的 `handleFormosaAdminClusters` 已經做了基本的 grid clustering，但需要加強：

**加入 query parameter 支援：**

```
GET /api/formosa/admin/clusters?zoom=9&since=2026-04-12T00:00:00Z
```

| 參數 | 用途 | 預設值 |
|------|------|--------|
| `zoom` | Leaflet zoom level，用來動態調整 grid cell 大小 | 9 |
| `since` | 只查這個時間之後的點（活動期間過濾用） | 無（查全部） |

**Zoom → Cell Size 對照：**

```javascript
function zoomToCellSize(zoom) {
  // zoom 越大 = 越近 = cell 越小 = 更精細
  const map = {
    6: 0.2,     // ~22km — 全台概覽
    7: 0.1,     // ~11km
    8: 0.05,    // ~5.5km
    9: 0.025,   // ~2.7km — 預設
    10: 0.012,  // ~1.3km
    11: 0.006,  // ~650m
    12: 0.003,  // ~330m
    13: 0.0015, // ~165m — 街道級
  };
  return map[Math.min(Math.max(zoom, 6), 13)] || 0.025;
}
```

**改寫 clustering 查詢，支援 `since` 過濾：**

```javascript
// 現有的可能是 SELECT * FROM formosa_gps_points
// 改成支援 since
let sql = 'SELECT user_id, lat, lng, source, created_at FROM formosa_gps_points';
const params = [];
if (since) {
  sql += ' WHERE created_at >= ?';
  params.push(since);
}
const { results } = await env.AUTH_DB.prepare(sql).bind(...params).all();
```

**回傳格式保持不變（已有的 front/tail/spread_km 都留著），加幾個欄位：**

```json
{
  "clusters": [
    { "lat": 24.59, "lng": 120.65, "count": 23, "users": 5 }
  ],
  "front": { "user_id": "U...", "lat": 24.7, "lng": 120.7 },
  "tail": { "user_id": "U...", "lat": 23.6, "lng": 120.3 },
  "spread_km": 145.3,
  "total_points": 12500,
  "total_users": 320,
  "zoom": 9,
  "cell_size": 0.025
}
```

### A-2：加 KV 快取

clusters 是讀取頻率高但資料變化慢的 API，加 30 秒 KV 快取：

```javascript
const cacheKey = `formosa_clusters_z${zoom}_${since || 'all'}`;
const cached = await env.TICKER_KV.get(cacheKey, 'json');
if (cached) return jsonResponse(cached);

// ... 做 clustering ...

await env.TICKER_KV.put(cacheKey, JSON.stringify(result), { expirationTtl: 30 });
return jsonResponse(result);
```

### A-3：Admin API Rate Limit

目前 checkin 和 track/sync 有 rate limit，但 admin 端點沒有。加上去防止被暴力打：

**規格：每個 admin token，所有 admin 端點合計 30 次/分鐘。**

在每個 `handleFormosaAdmin*` 函式開頭加：

```javascript
const adminToken = request.headers.get('X-Admin-Token') || 'anonymous';
const rl = await checkRateLimitKV(env.TICKER_KV, `admin:${adminToken}`, 60, 30);
if (!rl.ok) {
  return jsonResponse({ error: 'Rate limit exceeded', retry_after: rl.retry_after }, 429);
}
```

確認 `checkRateLimitKV` 函式已存在且支援自訂的 key prefix。如果不支援，擴充它讓第一個參數可以自由帶 prefix。

---

## Part B：前端 Dashboard（index.astro）

### B-1：fetchAll 加入 clusters API

在現有的 `fetchAll()` 裡加一個 clusters 請求：

```javascript
async function fetchAll() {
  const zoom = map.getZoom();
  const [dataRes, clusterRes, carbonRes, timelineRes, usersRes, surveyRes] = await Promise.all([
    fetch('/api/formosa/data', { headers: ADMIN_HEADERS }).then(r => r.json()),
    fetch('/api/formosa/admin/clusters?zoom=' + zoom, { headers: ADMIN_HEADERS }).then(r => r.json()),
    fetch('/api/formosa/admin/carbon', { headers: ADMIN_HEADERS }).then(r => r.json()),
    fetch('/api/formosa/admin/timeline', { headers: ADMIN_HEADERS }).then(r => r.json()),
    fetch('/api/formosa/admin/users', { headers: ADMIN_HEADERS }).then(r => r.json()),
    fetch('/api/formosa/admin/surveys', { headers: ADMIN_HEADERS }).then(r => r.json())
  ]);
  // ... 現有邏輯 ...
  updateMapClusters(clusterRes);  // 新增
}
```

### B-2：地圖 Cluster Mode 改用 server data

把現有的 `buildClusterLayer(positions)` 改成 `buildClusterLayer(clusterRes)`，吃 server 回傳的已聚合資料：

```javascript
function buildClusterLayer(clusterData) {
  var layerGroup = L.layerGroup();

  // 畫 cluster 圓圈
  clusterData.clusters.forEach(function(c) {
    var radius = Math.max(8, Math.min(40, Math.sqrt(c.count) * 3));
    var opacity = Math.min(0.85, 0.3 + c.count / 100);
    var circle = L.circleMarker([c.lat, c.lng], {
      radius: radius,
      fillColor: '#ff6b00',
      fillOpacity: opacity,
      color: '#ffd700',
      weight: 1
    });
    circle.bindPopup(c.count + ' 筆打卡（' + c.users + ' 人）');
    layerGroup.addLayer(circle);
  });

  // 前鋋/尾巴標記（保持現有邏輯，資料從 clusterData.front / .tail 來）
  if (clusterData.front) {
    var frontMarker = L.marker([clusterData.front.lat, clusterData.front.lng], {
      icon: L.divIcon({ html: '👑', className: 'front-icon', iconSize: [24, 24] })
    }).bindPopup('前鋋');
    layerGroup.addLayer(frontMarker);
  }
  if (clusterData.tail) {
    var tailMarker = L.marker([clusterData.tail.lat, clusterData.tail.lng], {
      icon: L.divIcon({ html: '🏮', className: 'tail-icon', iconSize: [24, 24] })
    }).bindPopup('殿後');
    layerGroup.addLayer(tailMarker);
  }

  return layerGroup;
}
```

### B-3：Zoom 變化時重新拉 clusters

加一個防抖（debounce），避免快速縮放時連打 API：

```javascript
var clusterFetchTimer = null;
map.on('zoomend', function() {
  if (currentMode !== 'cluster') return;
  clearTimeout(clusterFetchTimer);
  clusterFetchTimer = setTimeout(function() {
    fetch('/api/formosa/admin/clusters?zoom=' + map.getZoom(), { headers: ADMIN_HEADERS })
      .then(r => r.json())
      .then(data => updateMapClusters(data));
  }, 300);
});
```

### B-4：保留 Markers 和 Heat 模式不動

Markers（原始點）和 Heat（熱力圖）模式繼續吃 `/api/formosa/data` 的原始 GPS 資料，不需要改。只有 Cluster 模式改用 server clusters。

---

## 驗證方式

### Worker 端

```bash
# 1. clusters endpoint 帶 zoom 參數
curl "https://paulkuo-ticker.paul-4bf.workers.dev/api/formosa/admin/clusters?zoom=9" \
  -H "X-Admin-Token: <TOKEN>"

# 預期：回傳 clusters 陣列 + front/tail + zoom + cell_size

# 2. 不同 zoom 得到不同粒度
curl "...?zoom=12" ...  # cell 更小，clusters 更多
curl "...?zoom=7" ...   # cell 更大，clusters 更少

# 3. KV 快取命中（第二次 < 10ms）
time curl "...?zoom=9" ...   # 第一次
time curl "...?zoom=9" ...   # 第二次，應該快很多

# 4. Rate limit（連打 31 次，第 31 次應該 429）
for i in $(seq 1 31); do
  curl -s -o /dev/null -w "%{http_code}\n" "...?zoom=9" -H "X-Admin-Token: <TOKEN>"
done
```

### 前端

1. 開 dashboard，切到 Cluster 模式
2. 確認圓圈大小和數量反映 server 回傳的資料
3. 縮放地圖，確認 cluster 粒度會隨 zoom 變化
4. 確認 Markers 和 Heat 模式不受影響
5. 開 Network tab 確認 `/admin/clusters?zoom=X` 有在打
6. 快速縮放，確認不會連打（debounce 生效）

---

## 注意事項

- **不要刪掉** 前端的 `buildClusterLayer` 舊邏輯，改寫就好。萬一 server endpoint 掛了可以 fallback
- clusters endpoint 如果 D1 查詢太慢（>2s），考慮加 `LIMIT 50000` 避免 scan 全表
- `checkRateLimitKV` 可能需要確認是否支援非 userId 的 key（例如 `admin:xxx`），不支援就小改一下
- 部署順序：**先部署 Worker**（`wrangler deploy --config worker/wrangler.toml`），再部署前端。因為前端改完會開始打新 API，Worker 要先準備好
- KV 快取 TTL 30 秒是保守值。活動高峰期如果 D1 壓力大，可以考慮調到 60 秒

---

## 回報格式

```
完成項目：
- [ ] clusters endpoint 支援 zoom + since 參數 (commit hash)
- [ ] clusters KV 快取 30s (commit hash)
- [ ] admin API rate limit 30 次/分 (commit hash)
- [ ] 前端 cluster mode 改用 server clusters (commit hash)
- [ ] zoomend debounce 重新拉 clusters (commit hash)

驗證結果：
- clusters API 回傳正確：✅/❌
- zoom 粒度變化正常：✅/❌
- KV 快取命中：✅/❌
- rate limit 生效（第 31 次 429）：✅/❌
- 前端 cluster mode 正常顯示：✅/❌
- markers/heat mode 不受影響：✅/❌
```
