# Code Handoff: KV Operations 成本審計

**來源**: Cowork session
**日期**: 2026-04-06
**優先級**: 🟡 P2（不影響功能，但影響成本）

---

## 背景

Cloudflare 帳單 $44.63/月，其中 KV operations 佔 $37.50（84%）：

| 項目 | 次數 | 費用 |
|------|------|------|
| KV Write | 4,512,234 | $25.00 |
| KV Delete | 1,310,623 | $10.00 |
| KV Read | 4,132,874 | $2.50 |
| Workers Paid 月費 | — | $5.00 |
| Taiwan GST 5% | — | $2.13 |

活動尚未開始（4/12 起駕），這只是測試期 + cron 數據。正式上線萬人後 KV 會爆。

免費額度提醒：KV 免費 1M reads + 1M writes/月，超出後 Read $0.50/M、Write $5.00/M、Delete $5.00/M。

---

## Step 0 偵察

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw

# 列出所有 KV put/get/delete 呼叫
grep -n "\.put\|\.get\|\.delete\|\.list" worker/src/formosa.js | grep -i "kv\|FORMOSA" | head -50

# 特別看 KV namespace 綁定名稱
grep -n "env\.\w*KV\|env\.FORMOSA" worker/src/formosa.js | head -30

# 看 cron handler 裡的 KV 操作
grep -n -A 5 "handleScheduled\|handleFormosaCluster\|handleFormosaHealth" worker/src/formosa.js | grep "\.put\|\.get\|\.delete"

# 看 KV Buffer 相關
grep -n "buffer\|Buffer\|flush\|Flush" worker/src/formosa.js | head -20
```

---

## 重點排查方向

### 1. KV Write 4.5M 次 — 最大嫌疑犯

可能來源：
- **KV Buffer flush**：壓測時實作的 buffer 機制，每次 flush 可能產生大量 write
- **打卡寫入**：每次 GPS checkin 寫 KV
- **Cron 聚合**：每 10 分鐘跑 clustering/heatmap，結果寫回 KV
- **Rate limit 計數器**：每個請求都 put rate limit key
- **Health alert backoff**：每 30 分鐘 cron 寫 backoff state

### 2. KV Delete 1.3M 次 — 異常高

正常使用不太會有這麼多 delete。可能來源：
- **Buffer 清理**：flush 後 delete 暫存 key
- **Rate limit 過期清理**：刪除過期的 rate limit key
- **舊資料清理 cron**
- **TTL 失效後的手動清理**（KV 有原生 TTL，不需手動 delete）

### 3. KV Read 4.1M 次 — 費用低但可順便優化

每個請求都讀 KV 驗證 auth / rate limit / session 等。

---

## 優化建議（供 Code 評估）

### A. 用 D1 取代部分 KV 用途
D1 免費額度：50M row reads + 25M row writes/月，遠大於 KV。

適合搬到 D1 的：
- Rate limit 計數（write 密集，D1 有 SQL 可做 upsert）
- Clustering / heatmap 結果（寫一次讀多次）
- 用戶 session / auth 狀態（已在 D1 的 formosa_users 表）

不適合搬的：
- 需要 <1ms 延遲的即時數據（KV edge cache 優勢）
- 極小的 key-value pair（KV 更適合）

### B. 減少 KV 操作頻率
- Rate limit：改用 Durable Objects 或 in-memory（single isolate 內有效）
- Cron 聚合結果：降頻（10min → 30min），或只在資料變更時寫入
- Buffer flush：批次合併（多筆寫成一個大 JSON，而非逐筆寫）

### C. 善用 KV TTL 取代手動 delete
- `KV.put(key, value, { expirationTtl: 3600 })` → 自動過期，免 delete 費用
- 把所有手動 delete 改成 TTL 設定

---

## 驗證方式

修改後觀察 Cloudflare Dashboard → Workers & Pages → KV：
1. Daily KV operations 趨勢圖
2. 對比修改前後的 write/delete 數量
3. 確認功能不受影響（打卡、Dashboard、推播）

---

## 回報格式

```
## KV 操作審計結果
- Write 4.5M 來源拆解：
  - {來源 1}: 估計 {N}M 次
  - {來源 2}: 估計 {N}M 次
- Delete 1.3M 來源拆解：
  - {來源 1}: 估計 {N}M 次

## 優化方案
- [ ] {方案 A}：預估節省 {N}M writes/月
- [ ] {方案 B}：預估節省 {N}M deletes/月

## 修改清單
- {file}: {改動描述}
```

---

## 注意事項

- 不要影響現有功能——先審計、列數字、提方案，不要直接改
- 活動 4/12 開始，大改建議等活動結束後（凍結期 4/11-4/13）
- 如果找到「quick win」（如 TTL 取代 delete），可以先做
