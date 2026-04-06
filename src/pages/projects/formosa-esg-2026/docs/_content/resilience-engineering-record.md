# mazu.today 韌性工程紀錄：從萬人壓測到系統補強的完整歷程

## 為什麼需要韌性工程？

mazu.today 是一套為白沙屯媽祖進香設計的 GPS 打卡追蹤系統。活動期間（4/12 起駕，為期 8-9 天），預期數千到上萬名香客同時使用手機打卡、累積里程、分享進度。

這不是一般的 Web App——它有幾個特殊挑戰：行動網路不穩（鄉間、隧道、人潮密集區）、使用高峰集中在起駕和駐駕時段、而且系統一旦掛掉，沒有「稍後再試」的餘裕，因為進香隊伍不會等你。

我們的技術架構是 Astro 前端 + Cloudflare Pages + Workers + D1（SQLite）+ KV，月成本只有 $5 美元的 Workers Paid 方案。在這樣的預算限制下，韌性必須從架構設計層面解決，而不是靠砸錢買更多伺服器。

---

## 第一章：壓力測試揭露的致命瓶頸

### 壓測設計

2026 年 3 月底，我們用 Grafana k6 在本機跑了四輪壓力測試（R1-R4），模擬從 800 到 5,000 個虛擬使用者（VU）的並發打卡場景。

### 發現的問題

**R1-R2（HTTP 層）**：800 VU 時成功率 99.99%，但 1,200 VU 以上開始下降，5,000 VU 時成功率剩 91%。更嚴重的是「回復力測試」（突波後回到正常流量）只有 54% 成功——系統被衝爆後回不來。

**R3-R4（D1 驗證）**：找到根因。D1 底層是 SQLite，有 single-writer lock 的先天限制。500 個 VU 混合讀寫時，HTTP 回應 200（看起來成功），但 D1 實際寫入為 0——資料全部靜默丟失。

這意味著：如果上萬人同時打卡，系統「看起來正常運作」，但資料根本沒存進去。

### 解法：KV Buffer 架構

核心思路：**打卡不再直接寫 D1，改寫 KV（key-value store）**。

KV 是 Cloudflare 的分散式鍵值存儲，寫入幾乎不會失敗，也不受 single-writer lock 限制。打卡資料先暫存在 KV，每 5 分鐘由 cron job 批次 flush 到 D1。

這個架構轉換是整個韌性工程的基石。

---

## 第二章：在 KV Buffer 之上，逐層堆疊防護

KV Buffer 解決了最大的瓶頸，但一個能撐萬人的系統不能只靠一層防護。從 3 月底到 4 月初，我們陸續建立了 10 層韌性機制：

**R1 — Checkin 寫 KV 不碰 D1**
打卡的寫入路徑完全繞過 D1，消除 single-writer lock 瓶頸。

**R2 — 8 秒 timeout race + 202 Accepted**
Worker 用 `Promise.race` 設 8 秒上限。超時就先回 202（已接受），背景用 `ctx.waitUntil` 繼續處理。使用者不會卡在 loading 畫面。

**R3 — 伺服器端去重（dedup）**
用 userId + 10 秒時間戳粒度產生 dedup key。同一個人在 10 秒內重複送出的打卡，第二次會被靜默忽略。這是為了防止前端 auto-retry 導致的打卡次數暴增（Issue #92 的教訓）。

**R4 — 全面 KV-based rate limiting**
打卡（5次/分鐘）、問卷（2次/10分鐘）、GPS 軌跡（10次/分鐘）、管理 API——四個入口都有獨立的速率限制，而且限速邏輯本身也走 KV，不依賴 D1。

**R5 — Flush 分散式鎖**
cron flush 用 KV 實作分散式鎖（TTL 90 秒），防止多個 Worker instance 同時 flush 造成重複寫入。

**R6 — Flush 失敗自動延長 KV TTL**
如果 flush 到 D1 失敗，不是把資料丟掉，而是自動延長 KV 中資料的存活時間，等下一輪 flush 再試。

**R7 — INSERT OR IGNORE 防重複**
flush 寫入 D1 時用 `INSERT OR IGNORE`，即使同一筆資料被 flush 兩次，也不會產生重複記錄。

**R8 — 活動狀態控制**
用 KV 儲存活動狀態（進行中/暫停/結束），可以隨時從 Dashboard 控制。暫停時打卡 API 會優雅地回應「活動暫停中」。

**R9 — 前端失敗重送佇列**
打卡失敗時，資料存入 localStorage 的 queue。下次成功打卡時自動補送。

**R10 — Geofence 自動標記**
超出進香路線範圍的打卡不是拒絕，而是標記為 `remote`，事後分析時可以過濾。

---

## 第三章：韌性審計 — 找出盲區

10 層防護看起來很完整，但夠嗎？距離 4/12 起駕只剩 8 天，我們決定做一次全面的韌性審計（resilience audit）。

### Cowork 的系統分析

Cowork session（管家角色）逐行讀完 Worker 程式碼（98K 字元的 formosa.js + 35K 字元的 index.js），統計出：46 個 try blocks、49 個 catch blocks、2 處 retry、7 處 fallback。然後交叉比對壓測報告、worklog、已知事故，找出以下盲區：

**盲區 1：KV TTL 只有 24 小時**
如果 D1 連續掛超過 24 小時，KV 中未 flush 的資料會隨 key 過期消失——這是資料遺失的唯一窗口。

**盲區 2：/health 端點不檢查 Formosa 子系統**
現有的健康檢查只看 fitbit token 和股票快取，完全不知道 D1 或 KV 是否正常。Health check workflow 每小時打一次 /health，但就算 Formosa 全掛了，health check 也會說「一切正常」。

**盲區 3：前端離線佇列不會自動補送**
GP-6 的 retry queue 有 enqueue，但 `trackerInit` 沒有在頁面載入時呼叫 `flushCheckinQueue()`。離線暫存的打卡永遠不會自動補送。

**盲區 4：Dashboard 一掛全掛**
Dashboard 用 `Promise.all` 抓資料。只要其中一個 API timeout（例如地圖 clusters），整個 Dashboard 就白畫面。

**盲區 5：問卷直寫 D1，沒有 KV Buffer**
checkin 有 KV Buffer 保護，但 survey submit 直接寫 D1。D1 掛了，問卷就丟了。

**盲區 6：Webhook 一個 event 炸掉，整批 event 跟著掛**
LINE webhook 的 try-catch 範圍太大，一個 event 處理失敗會影響同 batch 其他 event。

---

## 第四章：交叉比對 — Cowork × Code 的 RFC 機制

韌性審計不能只靠一個視角。我們遇到一個實際問題：不同的 Claude session（Cowork 和 Code）對同一件事可能給出不同建議。例如 Cowork 說「不建議 Worker 端加 retry」，但 Code 之前已經做了前端 retry + Worker dedup——他們說的「retry」根本不是同一件事。

為了解決這個問題，我們建立了一套跨 session 的 RFC（Request for Comments）機制：

1. **Cowork 開 RFC Issue（#98）**：列出 10 項已有防護 + 4 個分歧點 + 4 個待確認風險
2. **Code 從程式碼層面逐項驗證**：確認哪些還有效、哪些被後續修改破壞、哪些是 Cowork 的誤判
3. **Paul 拍板**：對於有分歧的決策（例如 KV TTL 要延長到 3 天還是 10 天），由人類做最終判斷
4. **整理成最終執行工單（#99）**：只放確定要做的項目，按優先級分類

這個流程確保了：AI 之間的分歧有機制可以被發現和解決，而不是各做各的互相矛盾。

### 關鍵決策

**KV TTL：3 天**
Cowork 建議 10 天（最安全），Code 建議 3 天（平衡安全性和 KV list 效能）。Paul 選了 3 天——D1 在 Cloudflare 上連掛超過 3 天的機率極低，而 10 天累積的 KV keys 可能拖慢 flush 掃描。

**Health 端點：擴充現有 /health，不開新端點**
Cowork 建議開新端點 `/api/formosa/health`，Code 認為多一個端點多一個攻擊面。最終共識是在現有 `/health` 加 formosa 區塊，不增加路由複雜度。

---

## 第五章：執行 — 8 項改動，一次到位

Code session 在一次 commit（4275cc6）中完成全部 8 項改動，5 個檔案，+121 -40 行：

### P0（必做）
1. **trackerInit 加 flushCheckinQueue**：頁面載入時自動補送離線暫存的打卡
2. **KV TTL 86400 → 259200**：資料保護窗口從 24 小時擴展到 3 天
3. **/health 加 Formosa 檢查**：D1 連線（SELECT 1）、KV 可用性、待 flush keys 數量、最近 flush 時間
4. **Health check 加 LINE 推播**：系統異常時即時推送告警到 Paul 的 LINE

### P1（強烈建議）
5. **Webhook per-event try-catch**：一個 event 失敗不影響同 batch 其他 event
6. **Dashboard Promise.allSettled**：一個 API 掛了，其他資料仍正常顯示
7. **Survey localStorage fallback**：問卷填寫失敗時暫存本機，下次打卡時自動補送

### P2（有時間就做）
8. **migrateFormosa in-memory flag**：migration check 不再每次 webhook 都跑，用記憶體 flag 做一次性檢查

---

## 第六章：補強後的完整架構

### 資料流：一次打卡經過的所有保護層

```
香客按下「打卡」
  ↓
[前端] GPS 定位 + 照片（可選）
  ↓
[前端] Rate limit 檢查（5次/分鐘）
  ↓
[前端] 送出 API 請求
  ↓                         ↓（失敗時）
  ↓                    存入 localStorage queue
  ↓                    下次頁面載入自動補送 ← [R9 + P0-1 修復]
  ↓
[Worker] 8 秒 timeout race ← [R2]
  ↓（超時）→ 回 202 Accepted + 背景繼續處理
  ↓
[Worker] Dedup 檢查（userId + 10秒窗口）← [R3]
  ↓（重複）→ 靜默忽略，回 200
  ↓
[Worker] Rate limit（KV-based）← [R4]
  ↓（超限）→ 回 429
  ↓
[Worker] Geofence 檢查 ← [R10]
  ↓（超出範圍）→ 標記 remote，仍寫入
  ↓
[KV] 寫入 gps:{timestamp}:{userId}:{randomId} ← [R1]
  ↓  TTL = 3 天 ← [P0-2 加長]
  ↓
[Worker] 回 200 OK（資料安全落地在 KV）
```

```
每 5 分鐘 cron 觸發
  ↓
[Worker] 嘗試取得分散式鎖 ← [R5]
  ↓（取鎖失敗）→ 跳過本輪
  ↓
[Worker] list KV keys（prefix: gps:, batch 50）
  ↓
[Worker] batch INSERT OR IGNORE → D1 ← [R7]
  ↓（成功）→ 刪除已 flush 的 KV keys + 寫入 lastFlush 時間戳
  ↓（失敗）→ 延長 KV TTL ← [R6]，下一輪再試
  ↓
[KV] 更新 formosa:last_flush ← [P0-3 新增]
```

```
每 30 分鐘 Health Check（活動期間）
  ↓
[GitHub Actions] 打 6 個端點
  ↓
[GitHub Actions] 打 /health → 檢查 formosa.d1 + formosa.kv ← [P0-3]
  ↓（異常）
  ↓→ 開 GitHub Issue
  ↓→ LINE 推播告警給 Paul ← [P0-4]
```

### 韌性層次總覽

| 層次 | 保護什麼 | 機制 |
|------|---------|------|
| 前端 | 使用者體驗 | 離線佇列 + 自動補送 + survey fallback |
| API 入口 | 過載防護 | Rate limit（KV-based）+ timeout race + dedup |
| 資料寫入 | 不丟資料 | KV Buffer（3天 TTL）+ INSERT OR IGNORE |
| 資料 flush | 一致性 | 分散式鎖 + 失敗延長 TTL + 批次處理 |
| Webhook | 訊息處理 | per-event try-catch + 不影響同 batch |
| Dashboard | 管理介面 | Promise.allSettled + 部分降級 |
| 監控 | 即時告警 | /health 深度檢查 + LINE 推播 + GitHub Issue |
| 活動控制 | 營運彈性 | KV-based 暫停/結束 + geofence 標記 |

---

## 第七章：費用與資源

整套系統的月營運成本：**$5 美元**（Cloudflare Workers Paid plan）。

這 $5 包含：每月 1,000 萬次 Worker 請求、1,000 萬次 KV 讀取、100 萬次 KV 寫入、2,500 萬行 D1 讀取、5,000 萬行 D1 寫入、5GB D1 儲存。

以萬人活動 8-9 天的規模，這些額度綽綽有餘。

Health check 用 GitHub Actions 免費方案（每月 2,000 分鐘），LINE 告警用 Medium 方案（每月 3,000 則推播）。

我們評估過 Cloudflare Pro（$25/月）、Load Balancing（$5/月起）、Durable Objects 等付費選項，結論是：目前架構的韌性瓶頸不在基礎設施，而在程式碼層面的防護完整度。Issue #99 的 8 項改動補上了所有已知缺口，不需要額外花錢。

---

## 結語

這套韌性架構的核心哲學是：**不靠硬體擴容，靠架構設計。**

KV Buffer 解決了 D1 的先天瓶頸，10 層防護確保每一個環節都有 fallback。跨 session 的 RFC 機制確保不同 AI 視角的分歧被發現和解決。最終的驗證結果是 `/health` 端點回傳全綠：d1 ok、kv ok、系統就緒。

用 $5/月的成本，撐住上萬人同時使用的宗教文化活動——這是工程師能為社會做的最具體的貢獻之一。
