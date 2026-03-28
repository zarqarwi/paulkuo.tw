# Handoff → Code Session: Ticker Bar 數據修復

> 來源：Cowork session 2026-03-28
> 觸發：Paul 要求檢查 paulkuo.tw ticker bar 數據是否正確

---

## 背景

Cowork 透過 Chrome 讀取 paulkuo.tw 首頁 ticker bar（`CostTicker.astro`），發現多項數據矛盾。
Ticker bar 從 `api.paulkuo.tw/ticker` 即時拉資料，而 ticker handler 在 `worker/src/index.js` 的 `handleTicker()` 函式。

---

## 發現的問題

### Bug 1: 累計 < 本月（邏輯矛盾）
- **現象**：ticker 顯示「本月 API = $4.21」但「累計 = $0.38」
- **原因**：`totalUSD` 來自 KV key `costs_summary`（由外部腳本 `sync_costs_to_kv.py` 寫入），`monthUSD` 是從 KV 的 `costs_{date}` 即時計算。`costs_summary` 明顯過時/沒跑。
- **程式碼位置**：`worker/src/index.js` handleTicker() 第 ~30 行
  ```js
  let totalUSD = 0, summaryTokens = 0, summaryCalls = 0;
  try { const sumRaw = await env.TICKER_KV.get('costs_summary'); ... }
  // If no summary yet, fall back to month values
  if (totalUSD === 0) { totalUSD = monthUSD; ... }
  ```
- **問題**：fallback 只在 `totalUSD === 0` 時觸發，但 `costs_summary` 有值（$0.38）卻是舊的，所以不會 fallback

### Bug 2: API 呼叫次數顯示為空
- **現象**：ticker bar 的「API 呼叫」欄位沒有數字
- **原因**：`totalCalls` 同樣來自 `costs_summary` 的 `summaryCalls`，如果 summary 過時，這個值可能是 0
- **前端程式碼**：`src/components/CostTicker.astro` 用 `calls.toLocaleString()` 顯示，0.toLocaleString() = "0" 但前端可能沒渲染

### Bug 3: Ticker vs CostAnalytics 數據不一致
- **現象**：ticker bar 本月 = $4.21，但頁面下方 CostAnalytics 區塊本月 = $0.38
- **原因**：`CostAnalytics.astro` 從 build-time 的 `data/costs.jsonl` 讀取，ticker 從 KV 即時拉
- **根本問題**：`costs.jsonl` 和 KV 的 `costs_{date}` 是兩套不同步的資料來源

### Bug 4: 日均計算不一致
- **Ticker**：$0.420（過去 14 天 daily values 平均）
- **CostAnalytics**：$0.376（從 costs.jsonl 的全部記錄算）

### Bug 5: TWD 匯率寫死
- `CostTicker.astro`：`monthUSD * 32.5`
- `costs.js` logCost：`record.costUSD * 32.5`
- 匯率 hardcode 在多處

---

## Step 0 偵察（先查再改）

```bash
# 1. 確認 costs_summary KV 的值
wrangler kv key get --binding TICKER_KV costs_summary --config worker/wrangler.toml --remote

# 2. 確認今天的 costs 資料
wrangler kv key get --binding TICKER_KV costs_2026-03-28 --config worker/wrangler.toml --remote

# 3. 確認本月有幾天的 costs 資料
for i in $(seq -w 1 28); do echo -n "03-$i: "; wrangler kv key get --binding TICKER_KV "costs_2026-03-$i" --config worker/wrangler.toml --remote 2>/dev/null | head -c 80; echo; done

# 4. 找 sync_costs_to_kv.py 腳本
find . -name "sync_costs*" -o -name "*costs*kv*" | head -20

# 5. 確認 costs.jsonl 最後幾筆
tail -5 data/costs.jsonl

# 6. grep hardcoded 匯率
grep -rn "32.5" worker/src/ src/components/
```

---

## 具體修復步驟

### 修復 1: handleTicker() 的 totalUSD fallback 邏輯

**檔案**：`worker/src/index.js` handleTicker() 的 costs 計算區塊

目前 fallback 只在 `totalUSD === 0` 觸發，但 `costs_summary` 可能有過時的非零值。

**方案 A（推薦）**：讓 totalUSD 永遠 >= monthUSD
```js
// 改為：如果 summary 的 total 比本月還小，代表 summary 過時
if (totalUSD < monthUSD) { 
  totalUSD = monthUSD; 
  summaryTokens = totalTokens; 
  summaryCalls = totalCalls; 
}
```

**方案 B**：直接從 KV daily records 算 total，不依賴 costs_summary
（但需要掃更多天，效能考量）

### 修復 2: 確保 API 呼叫數正確

在修復 1 的 fallback 裡已包含（`summaryCalls = totalCalls`）。
另外確認前端在 calls = 0 時的顯示行為。

### 修復 3: 統一 costs.jsonl 與 KV 的資料

偵察 `sync_costs_to_kv.py` 是否還在用，是否需要更新 `costs.jsonl`。
如果 `CostAnalytics.astro` 繼續用 `costs.jsonl`，需要確保 build 時 jsonl 是最新的。

### 修復 4: TWD 匯率（Nice to have）
抽成 config 常數或從 API 拉即時匯率。至少先集中到 `config.js`。

---

## 驗證方式

1. Deploy 後 `curl https://api.paulkuo.tw/ticker | jq .costs`
2. 確認 `totalUSD >= monthUSD`
3. 確認 `totalCalls > 0`
4. 打開 paulkuo.tw 首頁，確認 ticker bar 數字合理
5. 比對 ticker bar 和 CostAnalytics 區塊的數字是否一致

---

## 注意事項

- Worker deploy 必須帶 `--config`：`wrangler deploy --config worker/wrangler.toml`
- CDN cache max-age=3600，ticker 本身有 60s cache
- ticker_cache KV 也有快取，修改後可能要等快取過期才看到新數字
- `costs_summary` 是被外部腳本寫入的，改 handleTicker 只是加保護，根因要看那個腳本為什麼沒跑

---

## 回報格式

完成後請在 worklog 記錄：
```
- 03-28 HH:MM ticker bar 數據修復：totalUSD fallback + totalCalls 修正 ({commit hash}) Code
```

並附上修復後 `curl /ticker | jq .costs` 的輸出截圖或數值。
