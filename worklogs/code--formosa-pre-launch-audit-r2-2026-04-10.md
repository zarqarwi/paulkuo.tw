# Handoff: Formosa ESG 起駕前第二輪盤查

**From**: Cowork  
**To**: Code (建議 Opus + High effort — 需要深入推理邊界條件和併發場景)  
**Date**: 2026-04-10  
**Priority**: 🔴 高 — 起駕前最後一輪徹底盤查  
**風險等級**: L2（純盤查，不改程式碼，發現問題先報告）

---

## 背景

第一輪盤點（五面向靜態邏輯追蹤）已完成，找到 6 個 🔴 並修復了 4 個（4847de5, ab8bf87, ede715a）。Worker 已部署（63fcada3）。

這是第二輪，目的不同：

| 輪次 | 方法 | 目的 |
|------|------|------|
| R1 ✅ | 靜態讀碼，追蹤邏輯一致性 | 找「各說各話」|
| **R2** | **迴歸驗證 + 邊界條件 + 併發路徑** | **確認修完沒壞別的 + 找極端場景的坑** |

**重要原則：這輪只掃不改。** 如果發現問題，寫進報告讓 Paul 決定要不要在起駕前修。

---

## 面向 A：FIX-1~4 迴歸驗證

剛改完的 4 個修復有沒有副作用？逐一檢查。

### A.1 FIX-1 迴歸：formosa_phone localStorage 寫入
- `_TrackerPage.astro` 問卷提交後加了 `lsSet('formosa_phone', data.phone)` — 確認：
  - `lsSet` 函式在哪裡定義？有沒有 try/catch？（Safari private browsing 會 throw）
  - 問卷提交失敗時會不會也觸發 lsSet？（應該只在成功後寫入）
  - 成就卡判定那端讀的是 `lsGet('formosa_phone')` 還是其他 key？大小寫完全一致嗎？
  - 如果使用者在 LIFF 填了問卷（寫入 localStorage），然後在 Safari 開 Tracker，Safari 讀不到 LIFF 的 localStorage — 這是預期行為還是 bug？

### A.2 FIX-2 迴歸：等級門檻統一
- MyPage 的 TITLES 從 `1/3/5/6/8/10/12/14/14` 改成 `1/5/10/15/20/25/30/35/40`
  - TITLES 陣列的 **長度** 有沒有變？如果其他地方用 `TITLES.length` 或 index 存取，會不會越界？
  - 公仔圖片的數量跟等級數量是否匹配？（9 個等級 = 9 張圖？）
  - Dashboard 那邊有沒有也改到？還是只改了 MyPage？（R1 報告說 Dashboard 也用舊門檻）

### A.3 FIX-3 迴歸：碳排係數統一
- MyPage 三處 `0.21 → 0.12013` + LINE Bot `0.48 → 0.12013`
  - 全局搜尋確認沒有遺漏：`grep -rn "0\.21\|0\.48\|0\.47515" src/ worker/`（預期 0 matches）
  - 碳排顯示的單位有沒有跟著確認？（kg CO₂ / km？kg CO₂ / person·km？）
  - 數字變小了（0.48 → 0.12），使用者看到的碳足跡會驟降 — 如果有舊用戶看過之前的數字，會不會困惑？（這不是 bug，但可能需要 UX 層面的說明）

### A.4 FIX-4 迴歸：buildStatsMessage 改用 haversine
- 現在要查全部 GPS 點計算里程 — 如果使用者有 1000 個 GPS 點，這個計算的效能如何？
- `computeRank(km, checkins)` 函式：
  - 參數 `checkins` 是打卡次數還是打卡記錄陣列？
  - 它的等級門檻是不是用的 FIX-2 統一後的值？
  - 如果使用者還沒有任何 GPS 點（剛註冊），回傳什麼？會不會 crash？

---

## 面向 B：邊界條件深掘

第一輪確認了「參與彈性完全通過」和「高併發架構設計良好」，但有些邊界條件只看結構看不出來，需要 trace 到具體程式碼。

### B.1 首次打卡的邊界
- 使用者第一次打卡時，`上一次打卡位置` 不存在 — 距離計算怎麼處理？
  - 是跳過第一次不算距離？還是回傳 0？
  - 如果回傳 null/undefined，會不會導致前端 render 出 `NaN km`？

### B.2 同一地點打卡兩次
- GPS 座標完全相同（例如在同一個定點連按兩次），Haversine 回傳 0
  - 打卡次數 +1 但距離 +0 — 這是正確行為嗎？
  - 累計里程不變但打卡次數增加 — 前端顯示會不會讓使用者困惑？

### B.3 GPS 漂移的極端值
- 第一輪報告說有跳點過濾 — 具體的門檻是多少？
  - 如果門檻是 100km，那 50km 的漂移就會被算進去
  - 進香隊伍一天最多走 40km 左右，兩次打卡之間如果超過 50km 是否該過濾？
  - 過濾掉的點會不會影響打卡次數計算？（打卡有算進去但距離沒算？）

### B.4 跨午夜打卡
- 「今日里程」和「累計里程」的日期分界是 UTC 0:00 還是 Asia/Taipei 0:00（UTC+8）？
- 如果分界是 UTC 0:00，那台灣時間早上 8:00 前打卡的「今日里程」會歸到昨天
- 確認 cron job 的時間邏輯是否與打卡的時間邏輯一致

### B.5 問卷重複提交
- 同一個使用者提交問卷兩次會怎樣？
  - D1 裡會有兩筆？還是 UPSERT？
  - 如果有兩筆，打卡≥3 + 問卷 + 電話 的判定會不會算成「完成兩次問卷」？
  - `formosa_phone` localStorage 會被覆蓋嗎？

### B.6 Token / 認證過期
- LIFF token 的有效期多長？
- 如果香客走了 4 小時沒操作，再打開 LIFF 打卡，token 過期了會怎樣？
- 有沒有 refresh 機制？還是要使用者重新開啟 LIFF？
- 錯誤訊息是否清楚（不是 500 Internal Error 而是「請重新開啟」之類的）？

---

## 面向 C：併發與資料競爭

第一輪確認了 KV buffer → cron flush → D1 的架構，但要看具體實作。

### C.1 KV buffer 寫入衝突
- 多人同時打卡，KV 的 key 結構是什麼？
  - 如果是 `checkin:{userId}:{timestamp}`，不會衝突
  - 如果是 `checkin:latest`，後到的會覆蓋先到的
- KV 的 write 是否 atomic？有沒有 read-modify-write 的 race condition？

### C.2 Cron flush 期間的資料遺失
- cron 把 KV 資料 flush 到 D1 時，如果同時有新的打卡寫入 KV，新資料會不會被 flush 一起刪掉但沒被寫入 D1？
- flush 的流程是 read → write D1 → delete KV？還是 delete KV → write D1？
- 如果 D1 寫入失敗，KV 的資料已經刪了怎麼辦？

### C.3 Rate limit
- 打卡 API 有 rate limit 嗎？如果有，門檻是多少？
- 如果被 rate limit，使用者看到什麼訊息？
- LINE Bot webhook 有 rate limit 嗎？萬人場景下 Bot 回覆會不會被 LINE 限流？

---

## 面向 D：部署一致性最終確認

### D.1 前端版本
```bash
# 確認 Cloudflare Pages 上跑的是最新的 commit
curl -s https://paulkuo.tw/projects/formosa-esg-2026/tracker/ | grep -i "version\|commit\|build"
# 或者檢查 JS bundle 裡有沒有修復後的等級門檻
curl -s https://paulkuo.tw/projects/formosa-esg-2026/tracker/ | grep -o "5,10,15,20,25,30,35,40"
```

### D.2 Worker 版本
```bash
# 確認 Worker 回應的版本
curl -s https://api.paulkuo.tw/health
# 或打一個 API 確認碳排係數
curl -s https://api.paulkuo.tw/formosa/config | grep -i carbon
```

### D.3 前後端版本對齊
- 前端部署是 git push 觸發 Pages auto-build，Worker 是 wrangler deploy
- 確認兩邊跑的都是 FIX-1~4 之後的版本，沒有一邊新一邊舊

---

## 回報格式

```markdown
# Formosa ESG 起駕前第二輪盤查報告

## 摘要
- 迴歸驗證：{通過/有問題} 
- 邊界條件：{N} 個確認安全 / {M} 個有風險
- 併發路徑：{評估}
- 部署一致性：{確認/不一致}

## 面向 A：迴歸驗證
### A.1 FIX-1 ...
- 結果：🟢/🟡/🔴
- 發現：...

（逐項列出）

## 面向 B：邊界條件
（逐項列出）

## 面向 C：併發與資料競爭
（逐項列出）

## 面向 D：部署一致性
（逐項列出）

## 風險總結
- 🔴 起駕前必修：（如果有）
- 🟡 活動期間觀察：（列出需要盯的指標）
- 🟢 確認安全：（列出已排除的風險）
```

---

## 注意事項

- **純盤查，不改程式碼**。發現問題寫報告，不要直接修
- 用本機 `cat` 讀完整檔案，不要依賴 GitHub MCP（截斷風險）
- 碳排係數等常數一律讀原始碼確認，不要引用 memory 的值
- 第一輪盤點報告如果還在本機，可以參考作為 baseline
- curl 測試用的 endpoint 參考 Project Instructions 裡的 Tracker URL 和 API
