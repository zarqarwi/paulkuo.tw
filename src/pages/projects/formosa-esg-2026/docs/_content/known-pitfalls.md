# mazu.today 已知陷阱清單

> 最後更新：2026-04-04 | 從實際事故和開發經驗提煉

這份清單記錄我們在開發 mazu.today 過程中踩過的坑、發現的限制、建立的防護 SOP。
分為五大類：架構陷阱、前端陷阱、部署陷阱、第三方服務陷阱、流程陷阱。

---

## 一、架構陷阱

### 1.1 D1 Single-Writer 瓶頸（嚴重度：致命）

**現象**：並發 500+ 寫入時，D1（底層 SQLite）的 single-writer lock 導致 58% 資料靜默丟失——HTTP 回 200 但 D1 實際寫入 0 筆。

**發現過程**：壓力測試 R1-R4（2026-03-25~26），從 5000 VU 逐步調參，最終在 R4 真實場景模擬中確認 60% 失敗率。

**解法**：KV Buffer 架構。打卡寫 KV（分散式、幾乎不失敗）→ Cron 每 5 分鐘 batch flush 到 D1。已實作並部署（2026-03-29）。

**殘留風險**：KV 的 list 操作有 1000 key 上限，極端情況需分批處理。flush 失敗時靠延長 TTL 保護，但 3 天 TTL 內必須成功至少一次。

---

### 1.2 同一 D1 實例共用問題

**現象**：Formosa 和 TQEF 共用 `AUTH_DB`（同一個 D1 實例）。D1 single-writer lock 不分表——任何一邊的大量寫入都會影響另一邊。

**影響**：如果 TQEF 批次匯入大量翻譯語料，可能拖慢 Formosa 的 cron flush。

**緩解**：Formosa 已改用 KV buffer，直接寫入不碰 D1，只在 cron 低頻 flush 時才寫 D1，降低衝突機率。

---

### 1.3 KV TTL 與 flush 的時間差

**現象**：KV key 的 TTL = 3 天。如果 cron flush 持續失敗超過 3 天，資料會被 KV 自動清除。

**防護**：flush 失敗時自動延長 KV TTL，確保資料不會在未成功寫入 D1 前過期。Health check 每 30 分鐘檢測 lastFlush 時間戳，異常時 LINE 推播告警。

---

## 二、前端陷阱

### 2.1 Astro Template 的 Script 提取行為（嚴重度：高）

**現象**：Astro 編譯時會把 `<template>` 裡的 `<script is:inline>` 提取到頁面層級執行。如果頁面有 AuthGate（密碼閘門），script 在 AuthGate 解鎖前就執行了，所有 `getElementById` / `querySelector` 都回 null，整頁 crash。

**受影響**：所有 AuthGate 保護的頁面（tracker 問卷、打卡頁面等）。

**解法**：延遲 DOM 操作到 `formosa-unlocked` 自訂事件。

```javascript
document.addEventListener('formosa-unlocked', trackerInit, { once: true });
```

**注意**：這不是 bug，是 Astro 設計如此。每次新增 AuthGate 頁面都要記得用這個 pattern。

---

### 2.2 querySelector 抓錯元素（嚴重度：高）

**事故**：Issue #93（2026-04-03）。刪除死碼時沒注意 `querySelector('.checkin-big-btn')` 在同一頁面命中了問卷按鈕而非打卡按鈕，導致打卡功能失效。

**根因**：121KB 的 `_TrackerPage.astro` 太大，同一 class name 在不同區塊重複使用。

**防護規則**：
- 優先用 `getElementById`（唯一性保證）而非 `querySelector`
- 刪除程式碼前，逐行檢查 UI 副作用（button state、toast、animation、querySelector 依賴）
- `grep 'window.xxx ='` 確認同名函式只有一份

---

### 2.3 同名函式多次賦值（嚴重度：中）

**事故**：Issue #93 同一事件。`window.manualCheckin` 在 L687 和 L1829 各賦值一次，L1829 覆蓋了 L687，形成死碼。真正的打卡路徑是 `processCheckin → postCheckin`，`doBasicCheckin` 從未被呼叫。

**防護**：新增功能前先搜尋既有同名函式，修改而非重複建立。

---

### 2.4 localStorage 跨環境隔離（嚴重度：中）

**現象**：LINE in-app browser 和 Safari 的 localStorage 是隔離的。使用者在 LINE 裡填的問卷，切到 Safari 看不到。

**影響**：不能依賴 localStorage 作為跨瀏覽器的持久存儲。問卷和打卡資料以 server-side 為準。

**利用**：localStorage 仍可作為同一環境內的暫存（離線打卡佇列 `formosa_checkin_queue`），但不能假設跨環境一致。

---

### 2.5 照片縮圖不可行（嚴重度：低）

**現象**：嘗試三次實作照片上傳後的縮圖預覽，都沒成功（各種瀏覽器相容問題）。

**結論**：放棄縮圖，改用文字示意（已上傳 N 張 + 狀態）。不再嘗試。

---

## 三、部署陷阱

### 3.1 _redirects 的 :splat 語法（嚴重度：致命）

**事故**：Issue #90 P0（2026-04-02）。Cloudflare Pages 的 `_redirects` 檔案用了 `:splat`，但忘了在目標 URL 裡保留前綴路徑。

**錯誤寫法**：
```
/projects/formosa-esg-2026/*  https://mazu.today/:splat  301
```
→ `/projects/formosa-esg-2026/feedback/` 被 redirect 到 `mazu.today/feedback/`（遺失路徑段）

**正確寫法**：
```
/projects/formosa-esg-2026/*  https://mazu.today/projects/formosa-esg-2026/:splat  301
```

**後續事故**：修復 redirect 時的 Worker route 變更又觸發 Error 1101，形成連鎖故障。

**SOP**：所有 `_redirects` 和 Worker route 變更標記為**高風險**，需完整回歸測試（paulkuo.tw 和 mazu.today 所有子路徑）。

---

### 3.2 wrangler.toml 覆蓋問題（嚴重度：高）

**現象**：根目錄的 `wrangler.jsonc` 會覆蓋 `worker/wrangler.toml` 的設定。部署 Worker 必須帶 `--config` 參數。

**正確指令**：
```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw/worker && wrangler deploy --config wrangler.toml
```

少了 `--config wrangler.toml` 就會用到根目錄的設定，部署結果完全不對。

---

### 3.3 CDN 快取延遲（嚴重度：中）

**現象**：Cloudflare CDN `max-age=3600`，新部署最多等 1 小時才生效。

**驗證 SOP**：
1. 先用 GitHub API 檢查 main HEAD 的檔案內容（確認 push 成功）
2. 如果 push 成功但線上沒更新 → CDN 快取問題，hard refresh 或等待
3. 用 JS inspect script 內容確認版本

---

### 3.4 Cron 與 Git 操作衝突（嚴重度：高）

**現象**：本機 cron 每 10 分鐘跑 `git stash/pop`。如果在 commit + push 過程中被 cron 插入，commit 會被 stash 覆蓋。

**事故**：2026-04-03 LCA crash，花了 3 輪 wrangler deploy 才發現 commit 被 cron baseline 覆寫。

**防護**：commit + push 要原子操作，或在部署前暫停 cron。

---

### 3.5 GitHub API 推大檔案會截斷（嚴重度：致命）

**事故**：2026-03-31。Cowork 用 GitHub MCP `create_or_update_file` 推 108KB 的 `tracker/index.astro`，被截斷為 1.7KB，導致 main 壞掉。

**鐵律**：
- 所有程式碼變更 → Code session（本機編輯 + git push）
- Cowork → 只做文件交接、問題分析、結果驗證
- 如果 Cowork 必須編輯小檔案（<5KB），GitHub API 是最後手段

---

## 四、第三方服務陷阱

### 4.1 LINE OA 自動回應 vs Webhook 衝突（嚴重度：中）

**現象**：LINE Official Account Manager 的「自動回應」和 Webhook 同時啟用 → 使用者收到兩則回覆，且自動回應的 OG image 顯示 paulkuo.tw 首頁照片而非活動 OG。

**解法**：關閉 OA Manager 的自動回應（設定 → 自動回應 → 關閉），只用 Webhook。

---

### 4.2 LINE Webhook URL 必須用自訂域名（嚴重度：高）

**現象**：LINE webhook 必須用 `api.paulkuo.tw`，`workers.dev` 域名已失效。

**原因**：LINE 的 webhook URL 驗證對 `workers.dev` 有問題（可能是 SSL 或 redirect 造成）。

---

### 4.3 Cloudflare Workers 免費版限制（已解決）

**原限制**：100K 請求/天。活動期間萬人使用會超標。

**解法**：已升級 Workers Paid（$5/月），無日請求上限。2026-04-04 已完成。

---

### 4.4 LINE Messaging API 訊息量限制

**現況**：已升級 Medium 方案（3000 則/月）。

**風險**：活動期間如果開啟每日推播（假設 1000 位活躍用戶 × 9 天 = 9000 則），會超標。需要時可升級高級版（6000 則/月）或依量付費。

**策略**：推播只用於關鍵通知（告警、活動開始/結束），不做每日摘要推播。

---

## 五、流程陷阱

### 5.1 部署後需雙端驗收（嚴重度：高）

**SOP**：
1. Code deploy → Level 1 smoke test（約 2 分鐘，checklist 在 `handoffs/smoke-test-checklist.md`）
2. Cowork → Chrome MCP hard refresh 驗證
3. 結果分別寫入 worklog 和 Apple Notes 儀表板

**原因**：多次發生「改 A 壞 B」的回歸（Astro scoped CSS + JS 動態元素不相容等）。

---

### 5.2 行動裝置真實流程測試（嚴重度：高）

**事故**：Issue #91。API health check 正常（<3s），但整條 GPS → fetch → UI 鏈路壞了。只測 endpoint 不夠，必須走完整手機使用流程。

**SOP**：涉及打卡/GPS 的 PR → smoke test 必須包含行動裝置真實操作測試。

---

### 5.3 Cowork 不做高風險操作（嚴重度：高）

**規則**：Cowork 可以提出非常規方案，但必須先標示風險、等 Paul 確認才執行。

適用範圍：
- 修改 main branch
- 碰部署管線
- 超出 Cowork 正常職責的操作
- 失敗難以回復的步驟

格式：「我可以做 X，但風險是 Y。要繼續嗎？」

---

### 5.4 診斷報告標信心等級（嚴重度：中）

**事故**：Issue #93。Cowork 診斷「走錯 code path」，Code 實際發現真因是 CORS header 缺少 `X-Line-User-Id`。

**SOP**：Cowork 開的診斷報告必須標信心等級（高/中/低）。中/低信心的要附上調查步驟，讓 Code 自行驗證。

---

### 5.5 品牌名稱拼寫確認（嚴重度：中）

**規則**：交接前確認品牌名、URL、Channel ID 的拼寫。

**重點**：`paulkuo.tw`（不是 Paukuo）。拼錯一旦部署就會上線。

---

### 5.6 回饋自動分級與 Issue 追蹤

**流程**：每次 session 開始 → GET `/api/formosa/feedback` → 分三類：
- **Bug**（功能壞了）→ 直接開 Code 工單 + 標嚴重度
- **UX**（版面/文字/流程）→ 列給 Paul 決策
- **Environment**（手機/網路問題）→ 標記但不處理

**Issue body 必須包含** `<!-- feedback-id: XX -->`，GitHub Actions 關閉 Issue 時自動更新 feedback status。

---

## 六、邏輯陷阱（RFC #100 發現）

### 6.1 等級計算多路徑不一致（嚴重度：高）

**發現**：RFC #100 技術偵查時揭露。系統內有多個地方計算香客等級，邏輯不一致。

| 計算場景 | 邏輯 | 程式碼位置 |
|----------|------|-----------|
| Dashboard API | `computeRank(km, checkins)` — 雙條件 | `formosa.js:927` |
| Chat Bot `buildStatsMessage` | 只看 checkins，不看 km | `formosa.js:1485` |

**影響**：香客在 LINE Bot 問到的等級可能跟 Dashboard 顯示的不同。例如打卡 8 次但只走 2km，Bot 可能說「金丹」但 Dashboard 說「築基」。

**已修復**：
- P0 — Dashboard 從「優先算 manual」改為「全量計算」
- P0+ — Chat Bot `buildStatsMessage` 改用 haversine 算 km + `computeRank(km, checkins)` 雙條件，移除重複 TITLES 陣列，新增 km 顯示
- 現在 Dashboard 和 Chat Bot 完全一致。

**防護**：未來任何涉及等級顯示的改動，必須 grep 所有 `computeRank`、`level`、`rank`、`grade` 相關邏輯，確保一致。

---

### 6.2 沒有自動告警的錯覺（嚴重度：中）

**發現**：RFC #100 外部審查假設系統已有自動告警（每 30 分鐘推播），但實際上 `/health` 是被動 endpoint，沒有接 LINE 推播。所有通知都是排程推播或手動觸發。

**修復**：A1 — 新增 `handleFormosaHealthAlert()`，cron 每 5 分鐘主動檢查，異常時 LINE 推播（含指數退避）。

**教訓**：文件記載的防護層不等於已實作的防護層。韌性工程紀錄裡寫的「10 層防護」要確認每一層都有對應程式碼。

---

### 6.3 Cowork 參考文件引入幻值導致連鎖錯誤（嚴重度：高）

**事故**：2026-04-04。Cowork 撰寫 `data-model-reference.md` 時，等級門檻段落填入了不存在於程式碼的數值（如 Lv.2 寫 5km/3次，實際 Worker 是 15km/5次）。隨後 Cowork 又用這份文件當「正確基準」去比對香客說明書和 i18n 翻譯檔，判定原本正確的值是「錯的」，產出 code prompt 要求 Code session 修改 4 語系翻譯檔。Code session 執行完畢但在 push 前被攔截。

**根因**：Cowork 產出的文件未經原始碼驗證就被當作 source of truth，且交叉驗證時是「自己產出的文件 A 比對自己產出的文件 B」，形成自我驗證迴圈。

**時間線**：
1. Cowork 寫 data-model-reference.md（門檻值錯誤）
2. Cowork 拿 data-model 比對說明書 → 判定說明書「錯」
3. 產出 code prompt，Code session 改了 4 語系 i18n
4. 準備建 API 端點文件時，讀 Worker 原始碼才發現 TITLES 陣列跟 data-model 不一致
5. 緊急攔截，revert 等級相關變更

**已修復**：data-model-reference.md 等級段落已改回 Worker 實際值，並加上程式碼行號來源標註。

**防護**：
- Cowork 產出的任何包含程式碼常數（門檻、係數、設定值）的文件，上版前必須由 Code session 或 Paul 用 `grep` 比對原始碼
- data-model 等級表每一列標註程式碼來源行號，防止未來再次偏移
- 未來調整等級門檻時，同步更新路徑：`formosa.js TITLES` → `i18n levels.{N}.req` → 香客說明書 → data-model-reference.md

### 6.4 住宿碳排係數前後端不一致（嚴重度：中）

**事故**：2026-04-04 韌性審計發現。Worker `GWP_FACTORS.hotel = 8.85`（formosa.js:1910），但 4 語系 i18n 翻譯檔顯示 `12.5 kg/晚`。使用者看到 12.5，系統算 8.85。

**根因**：碳排係數統一作業（2026-03-29, code--formosa-carbon-factor-unify）更新了 Worker GWP_FACTORS，但 i18n 翻譯檔中的顯示文字未同步修改。兩個值在不同檔案、不同層（後端計算 vs 前端 UI），沒有自動校驗機制。

**影響**：
- 計算結果正確（用 8.85）
- 使用者看到的說明數字不正確（顯示 12.5）
- ESG 報告如引用 UI 截圖可能造成混淆

**修復**：i18n 4 語系的 `12.5` → `8.85`，由 Code session 執行（code-prompt-hotel-coefficient-fix.md）。

**防護**：
- 碳排係數有「單一來源」原則：`formosa.js GWP_FACTORS` 是唯一真值
- 任何在 UI 顯示的係數，必須能追溯到 GWP_FACTORS 的對應 key
- data-model-reference.md 已補齊完整係數表並標註行號

---

## 快速查詢索引

| 關鍵字 | 對應陷阱 | 章節 |
|--------|----------|------|
| D1 寫入失敗 | single-writer lock | 1.1 |
| 資料丟失 | KV buffer + TTL | 1.1, 1.3 |
| 頁面 crash / null | Astro template script | 2.1 |
| 打卡失效 | querySelector 抓錯 | 2.2, 2.3 |
| redirect 壞 | :splat 語法 | 3.1 |
| 部署沒生效 | CDN 快取 / cron 覆蓋 | 3.3, 3.4 |
| 檔案被截斷 | GitHub API 大檔案 | 3.5 |
| LINE 重複回覆 | 自動回應衝突 | 4.1 |
| wrangler 設定錯 | toml 覆蓋 | 3.2 |
| 等級不一致 | 多路徑計算分歧 | 6.1 |
| 告警沒生效 | 被動 endpoint 無推播 | 6.2 |
| 文件幻值連鎖錯誤 | Cowork 參考文件未驗原始碼 | 6.3 |
| 碳排係數前後端不一致 | i18n 顯示值 ≠ Worker 計算值 | 6.4 |
