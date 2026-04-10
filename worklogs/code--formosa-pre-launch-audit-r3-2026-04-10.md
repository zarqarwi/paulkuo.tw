# Formosa 起駕前盤點 R3 — 資料品質 & 防禦韌性

> 來源：Cowork session 2026-04-10
> 目標：Code session 執行
> 建議模型：**Opus + Max effort**（涉及跨檔案語義追蹤，需要深度理解資料流）

---

## 背景

R1 + R2 已修復 6 項 P0（等級門檻、碳排係數、成就卡、LINE Bot、Dashboard TITLES、i18n 碳文字）。
兩輪都切「資料一致性 + 修復驗證」，R3 換角度切「**資料品質 & 防禦韌性**」——
確保 4/12 起駕後萬人同時使用時，系統不只數據正確，還能承受異常輸入和邊界狀況。

---

## Step 0 — 偵察指令

開始前先跑這些指令建立全貌，**不要改任何東西**：

```bash
# 1. Geofence 下游：追蹤 'remote' source 在距離計算和碳足跡是否被排除
rg -n "remote" worker/formosa.js
rg -n "source" worker/formosa.js | head -40
rg -n "haversine\|totalDistance\|computeRank" worker/formosa.js src/pages/projects/formosa-esg-2026/

# 2. 錯誤處理：GPS 失敗、網路斷線、Worker 超時的 UX
rg -n "catch\|error\|fail\|timeout\|fallback" src/pages/projects/formosa-esg-2026/_TrackerPage.astro | head -30
rg -n "catch\|error\|fail\|timeout" worker/formosa.js | head -30

# 3. 輸入驗證：checkin API 有沒有擋壞資料
rg -n "typeof\|isNaN\|parseFloat\|parseInt\|JSON.parse\|validate" worker/formosa.js | head -30
rg -n "lat\|lng\|latitude\|longitude" worker/formosa.js | head -20

# 4. Cron flush 容錯：KV → D1 失敗時怎麼辦
rg -n "cron\|flush\|scheduled\|alarm" worker/formosa.js | head -30
rg -n "try\|catch\|retry\|rollback" worker/formosa.js | head -30

# 5. eventMode 開關：關閉後哪些入口被封鎖
rg -rn "eventMode\|event_mode\|EVENT_MODE" src/pages/projects/formosa-esg-2026/ worker/formosa.js
```

---

## 面向 1 — Geofence 下游過濾完整性 🔴 最高優先

**核心問題**：Worker checkin 時用 `lat >= 23.4 && lat <= 24.9 && lng >= 120.1 && lng <= 121.0` 標記 `source: 'remote'`，但下游有沒有確實排除？

逐一確認：

| 下游環節 | 檢查重點 | 預期正確行為 |
|---------|---------|------------|
| **距離計算（haversine）** | 計算 totalDistance 時，是否只加總 source ≠ 'remote' 的打卡 | `remote` 點不算距離 |
| **等級判定（computeRank）** | computeRank 用的距離是否排除 remote | 排除 remote 後的距離判定等級 |
| **碳足跡** | 碳排 = 距離 × 0.12013，距離來源如果包含 remote 就錯了 | 同上 |
| **Dashboard 統計** | 管理者看到的用戶里程、碳排，是否排除 remote | 排除 |
| **分享卡片** | MyPage / ShareCard 顯示的里程碳排 | 排除 |
| **LINE Bot** | buildStatsMessage 的里程碳排 | 排除 |

**如果發現 remote 沒被排除**：這是 P0，必須修——否則使用者在家開 GPS 也會累積里程。

---

## 面向 2 — 錯誤處理 & 降級體驗

逐項確認使用者看到的 UX：

| 情境 | 檢查什麼 | 預期行為 |
|------|---------|---------|
| **GPS 權限被拒絕** | `getCurrentPosition` / `watchPosition` 的 error callback | 有 toast 或 UI 提示，不是靜默失敗 |
| **GPS 取得超時** | timeout 設定值是多少？超時後 UX？ | 有 fallback 或重試提示 |
| **網路斷線時打卡** | fetch checkin API 的 catch 處理 | 進入 retry queue（formosa_checkin_queue），不遺失資料 |
| **Worker 8 秒超時** | Promise.race 8s timeout 的 response body | 回傳明確的 error，前端能正確顯示 |
| **D1 寫入失敗** | Worker 裡 D1 insert/update 的 try-catch | 不 crash，回傳 error，KV buffer 保底 |
| **localStorage 已滿** | setItem 有沒有 try-catch | 不會讓整個打卡流程壞掉 |

重點不是要改架構，而是確認每個 catch block 都有**對使用者友善的提示**，不是 console.error 就沒了。

---

## 面向 3 — 輸入驗證 & 安全

Checkin API（`/api/formosa/checkin`）接受的 payload：

```
lat, lng, userId, source, photo?, ...
```

逐項檢查：

| 欄位 | 檢查重點 |
|------|---------|
| **lat / lng** | 是否驗證為 number 且在合理範圍（-90~90 / -180~180）？非數字怎麼處理？ |
| **userId** | 空值或非字串怎麼處理？有沒有 XSS 風險（userId 會顯示在 Dashboard）？ |
| **source** | 是否限制為已知值（checkin/remote/auto/photo）？隨意填會怎樣？ |
| **payload 大小** | 有沒有 body size limit？Issue #136 修過 100KB 限制，確認還在 |
| **rate limit** | 確認 10 req/min/user 有效，且無法被繞過（如偽造 userId） |
| **photo upload** | 照片 URL 有沒有驗證？能不能注入惡意 URL？ |

**注意**：不需要做到滴水不漏，但基本的 typeof check + 範圍檢查應該有。

---

## 面向 4 — Cron Flush 容錯

KV buffer → D1 的 cron flush 是資料管線的關鍵環節。

| 檢查項目 | 問題 |
|---------|------|
| **flush 失敗後 KV 資料** | 失敗時有沒有保留 KV 裡的資料，下次 cron 會重試？還是直接 delete 了？ |
| **部分成功** | 100 筆資料 flush，第 50 筆 D1 寫入失敗，前 49 筆和後 51 筆怎麼辦？ |
| **cron 重疊** | 上一輪 cron 還沒跑完，下一輪觸發了，會不會重複寫入？ |
| **error logging** | flush 失敗有沒有記 log？活動期間能不能在 Cloudflare dashboard 看到？ |

**重要提醒**：R1 audit 已確認 Plan A 移除了 `TICKER_KV.delete()`（commit a4b6fd2），但要確認這個修復在 cron flush 路徑上也生效——cron flush 完成後有沒有刪 KV？

---

## 面向 5 — eventMode 開關

`eventMode` 控制活動是否啟用。確認：

| 檢查項目 | 問題 |
|---------|------|
| **開啟路徑** | eventMode 怎麼觸發？手動？cron？日期判斷？ |
| **關閉後的入口封鎖** | Tracker 頁面、打卡按鈕、GPS 追蹤、問卷、分享卡——哪些被停用？ |
| **關閉後的資料** | 使用者的歷史資料（里程、等級、碳排）是否還能查看？ |
| **TEST_MODE 與 eventMode 的關係** | GP-9 用日期判斷 TEST_MODE，跟 eventMode 有衝突嗎？ |

---

## 回報格式

完成後請依以下格式回報：

```
## R3 盤點結果

### 🔴 必須修復
- [項目] — [一句話描述問題 + 影響]

### 🟡 建議觀察
- [項目] — [風險描述]

### 🟢 確認安全
- [面向X 項目] — [簡述確認方式]

### 修復建議（如有 🔴）
- [具體修復方向 + 涉及檔案]
```

---

## 注意事項

1. **只讀不改**：這是 audit，除非 Paul 確認要修才動手
2. **R1/R2 已修復的不要重複查**：等級門檻、碳排係數、成就卡條件已經修過了
3. **Geofence 下游是最高優先**：如果 remote 標記沒被排除，萬人打卡會產生大量垃圾資料
4. **cron flush 是第二優先**：資料遺失比資料不正確更嚴重
5. 記得寫 worklog 到 `worklogs/worklog-2026-04-10.md`（追加到既有的）
