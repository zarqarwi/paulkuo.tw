建議模型: Sonnet

# Code Handoff — 修復訪客數據顯示 + 降低 Analytics 節流

> 日期：2026-04-21
> 來源：Cowork 調查結果
> Task Size: S

---

## Step -1 環境準備

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw && git pull
```

---

## 背景

paulkuo.tw 的訪客數據出了兩個問題：

1. **Dashboard ROI 區段訪客永遠顯示 0** — `dashboard.astro` line 440 讀取 `analytics.overview.visits`，但 `analytics:overview` KV 的實際結構是 `{ daily: [...], total1d: {visits, pageViews}, total7d: {...}, total30d: {...} }`，根本沒有頂層 `.visits` 欄位。這個 bug 從 Phase B（2026-04-05）加入 ROI 區段起就壞了，一直沒被發現。

2. **Ticker bar 訪客數據過時（停在 91 很久）** — `visitors.js` 的 `fetchAnalyticsOverview()` 有 6 小時節流，加上 Cloudflare Web Analytics API 偶爾回傳不完整數據，導致 KV 裡的 `analytics:overview` 長時間沒更新。用 `?refresh=1` 強制刷新後數據恢復正常（91 → 139）。

### 影響範圍

- `dashboard.astro` — **不在** `docs/shared-files.json`，純前端頁面，不影響其他子專案
- `visitors.js` — **不在** `docs/shared-files.json`，但改的是節流間隔（不改 API 行為），對 Formosa/媽祖進香活動零影響
- 兩個改動都不碰 `worker/src/index.js`、`auth.js`、`utils.js` 等共用模組

---

## Step 0 偵察

先確認目前程式碼狀態跟預期一致：

```bash
# 確認 dashboard.astro line 440 的 bug
sed -n '438,445p' src/pages/dashboard.astro

# 確認 visitors.js 的節流設定
sed -n '159,168p' worker/src/visitors.js
```

預期看到：
- dashboard.astro: `analytics.overview.visits || analytics.overview.humanVisits`（錯誤路徑）
- visitors.js: `6 * 3600 * 1000`（6 小時節流）

---

## Step 1：修復 dashboard.astro 訪客數據路徑

**檔案**：`src/pages/dashboard.astro`
**行號**：440

將：
```javascript
var visitors = (analytics && analytics.overview && (analytics.overview.visits || analytics.overview.humanVisits)) || 0;
```

改為：
```javascript
var visitors = (analytics && analytics.overview && analytics.overview.total30d && analytics.overview.total30d.visits) || 0;
```

**原因**：`analytics:overview` KV 的結構是 `{ daily, total1d, total7d, total30d }`，ROI 區段應該用 `total30d.visits` 來計算 30 天的每訪客成本。

---

## Step 2：降低 Analytics 節流時間

**檔案**：`worker/src/visitors.js`
**行號**：159, 164

將：
```javascript
  // 節流：6 小時內不重複查（force 時跳過）
```
改為：
```javascript
  // 節流：3 小時內不重複查（force 時跳過）
```

以及將：
```javascript
      if (elapsed < 6 * 3600 * 1000) {
```
改為：
```javascript
      if (elapsed < 3 * 3600 * 1000) {
```

**原因**：6 小時太長，cron 每小時跑一次但大部分都被節流擋掉。降到 3 小時讓數據更即時，同時不會超出 Cloudflare Analytics API 的合理負載。

---

## Step 3：Commit + Deploy

```bash
git add src/pages/dashboard.astro worker/src/visitors.js && git commit -m "fix: 修正 dashboard 訪客數據路徑 + 降低 analytics 節流至 3h

- dashboard.astro: overview.visits → overview.total30d.visits（ROI 區段從上線就壞了）
- visitors.js: fetchAnalyticsOverview 節流 6h → 3h（避免數據過時）
" && git push
```

然後部署 Worker：

```bash
cd worker && wrangler deploy --config wrangler.toml && cd ..
```

前端會在下次 Cloudflare Pages build 自動部署（或手動 `npm run build && wrangler deploy`）。

---

## 驗證方式

### Worker 驗證（deploy 後立刻做）

```bash
# 1. 強制刷新 analytics
curl -s 'https://api.paulkuo.tw/analytics?refresh=1' -H 'Authorization: Bearer {GOVERNANCE_TOKEN}' | jq '.overview.total30d'

# 2. 確認 ticker 拿到正確數據
curl -s 'https://api.paulkuo.tw/ticker' | jq '.visitors'
```

預期：`visits` 應該是正常的三位數（目前約 139），不是 91。

### 前端驗證（Pages deploy 後）

1. 開 https://paulkuo.tw/dashboard/ → ROI 區段的「訪客」欄位應顯示正常數字（非 0）
2. 首頁 ticker bar 的訪客數應與 dashboard 一致

---

## 注意事項

- ⚠️ 部署 Worker 時**必須** `cd worker && wrangler deploy --config wrangler.toml`，不要在根目錄跑
- dashboard.astro 是前端靜態頁面，改動需要 Pages 重新 build 才生效
- 不需要跑跨子專案 Smoke Test — 兩個檔案都不在 shared-files.json 裡

---

## 回報格式

```
✅ dashboard.astro 訪客路徑修復 (commit {SHA})
✅ visitors.js 節流降為 3h (同上 commit)
✅ Worker deploy 成功
✅ Smoke: /analytics?refresh=1 → total30d.visits = {N}
✅ Smoke: /ticker → visitors.visits = {N}
⬜ Pages deploy 後驗證 dashboard ROI 區段
```

---

## 本輪 Metrics

S size × 2 fixes / 1 commit / 影響範圍：dashboard + analytics 節流
