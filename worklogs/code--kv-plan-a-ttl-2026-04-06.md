# Code Handoff: Plan A — TTL 取代 KV Delete

**來源**: Cowork session (2026-04-06)
**優先級**: 高（4/12 前完成）
**風險等級**: L0（自動安全）
**預估省**: $8-10/月 delete 費用歸零

---

## 背景

KV 審計結果顯示每月 1.3M delete 操作（$10/月），主要來自 buffer flush。
KV 原生支援 `expirationTtl`，設定後 key 會自動過期刪除，**不收 delete 費用**。

## 改動目標

把 buffer flush 時的手動 `kv.delete(key)` 移除，改成寫入時帶 `expirationTtl`。

## 具體位置（worker/src/formosa.js）

### 1. GPS Checkin Buffer 寫入（~L353-452）

找到 `handleFormosaCheckin` 中所有 `FORMOSA_KV.put(...)` 呼叫，加上 expirationTtl：

```js
// 改前
await env.FORMOSA_KV.put(bufferKey, JSON.stringify(data));

// 改後（TTL 30 分鐘，遠大於 5 分鐘 flush 週期，留安全餘量）
await env.FORMOSA_KV.put(bufferKey, JSON.stringify(data), { expirationTtl: 1800 });
```

### 2. Buffer Flush 刪除（~L587, L603）

找到 `handleFormosaFlushBuffer` 中的 `FORMOSA_KV.delete(...)` 呼叫：

```js
// 改前
await env.FORMOSA_KV.delete(key);

// 改後：直接移除這行，TTL 會自動清理
// （或保留但註解掉，方便回滾）
```

### 3. Flush Lock（~L538）

如果 flush lock 也用 kv.put + kv.delete，同樣改成帶 TTL：

```js
// flush lock 設 TTL 10 分鐘（防止 cron 撞車的鎖）
await env.FORMOSA_KV.put('flush-lock', '1', { expirationTtl: 600 });
// 移除對應的 kv.delete('flush-lock')
```

### 4. 其他可能的 delete 呼叫

用 grep 掃一次：
```bash
grep -n '\.delete(' worker/src/formosa.js
```
確認所有 delete 都有對應的 TTL 寫入可以取代。

## 偵察指令（Step 0）

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw
grep -n 'expirationTtl\|\.delete(' worker/src/formosa.js
grep -n 'FORMOSA_KV\.put' worker/src/formosa.js
```

## 驗證方式

1. 本機 `wrangler dev` 測試打卡 → flush → 確認 KV 資料在 TTL 後自動消失
2. 確認 flush 不再報錯（delete 不存在的 key 不會 error，但確認一下）
3. 部署後觀察 Cloudflare Dashboard KV metrics，delete 計數應該趨近 0

## 注意事項

- `expirationTtl` 最小值是 60 秒
- TTL 要設得比 flush 週期（5 分鐘）長，否則資料還沒 flush 就被清了
- 建議 TTL = 1800（30 分鐘），給足安全餘量
- 這個改動不影響任何功能邏輯，只是「誰來刪」的差別

## 部署

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw/worker && wrangler deploy --config wrangler.toml
```

⚠️ 需要 Paul 本機執行 wrangler deploy。
