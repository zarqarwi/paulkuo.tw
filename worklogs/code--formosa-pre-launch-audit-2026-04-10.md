# Handoff: Formosa ESG 起駕前程式碼盤點

**From**: Cowork  
**To**: Code (建議 Opus + Max effort)  
**Date**: 2026-04-10  
**Priority**: 🔴 高 — 4/12 起駕，這是最後一次完整盤點機會  
**風險等級**: L2（盤點 only，不改程式碼，但結果決定是否需要緊急修復）

---

## 背景

4/12 白沙屯媽祖起駕，系統需承載數千人同時使用。Phase 4 所有 Issue 已結案，但 Paul 要求在起駕前做一次「程式碼層級的邏輯一致性盤點」，確保核心功能在不同介面不會各說各話。

這不是功能開發，是**審計任務**——逐一 trace 程式碼，確認五大面向的邏輯完整性。產出是一份盤點報告，不是 PR。

---

## Step 0: 偵察（先做這些，建立全局地圖）

```bash
# 1. Worker API 端點總覽
grep -rn "router\.\(get\|post\|put\|delete\|patch\)" worker/src/ --include="*.ts" --include="*.js"

# 2. 打卡相關邏輯
grep -rn "checkin\|check-in\|check_in" worker/src/ --include="*.ts" --include="*.js"
grep -rn "checkin\|check-in\|check_in" src/ --include="*.astro" --include="*.ts" --include="*.js"

# 3. 等級/距離/碳足跡計算
grep -rn "level\|distance\|carbon\|footprint\|haversine" worker/src/ --include="*.ts" --include="*.js"
grep -rn "level\|distance\|carbon\|footprint" src/ --include="*.astro" --include="*.ts" --include="*.js"

# 4. 分享卡片 / OG / 成就卡
grep -rn "share\|achievement\|card\|og-image\|shareCard" src/ --include="*.astro" --include="*.ts" --include="*.js"

# 5. D1 schema（所有 table）
grep -rn "CREATE TABLE\|CREATE INDEX" worker/ --include="*.sql"
grep -rn "D1\|\.prepare\|\.exec" worker/src/ --include="*.ts" --include="*.js" | head -50

# 6. Cron / 定時任務
grep -rn "scheduled\|cron" worker/src/ --include="*.ts" --include="*.js"

# 7. 活動時間相關的硬編碼
grep -rn "2026-04\|startDate\|endDate\|eventStart\|eventEnd\|活動" worker/src/ --include="*.ts" --include="*.js"
grep -rn "2026-04\|startDate\|endDate\|eventStart\|eventEnd" src/ --include="*.astro" --include="*.ts" --include="*.js"

# 8. KV 操作
grep -rn "TICKER_KV\|\.put\|\.get\|\.delete\|\.list" worker/src/ --include="*.ts" --include="*.js" | head -50
```

以上 grep 結果會幫你建立一張「哪段邏輯在哪個檔案」的地圖。接下來按面向逐一深入。

---

## 面向一：打卡功能核心邏輯

### 盤點項目

**1.1 打卡 API 端點**
- 找到打卡的 POST endpoint，完整 trace：request validation → GPS 座標寫入 D1 → response
- 確認有無防重複打卡邏輯（同一人短時間內連續打卡）
- 確認 GPS 座標 validation（緯度 -90~90、經度 -180~180、非 0/0）
- 確認時區處理（UTC vs Asia/Taipei）

**1.2 前端打卡觸發**
- LIFF 環境下 `navigator.geolocation.getCurrentPosition` 的呼叫方式
- 錯誤處理：定位失敗、使用者拒絕授權、逾時、網路斷線
- 打卡後的 UI 回饋（loading → success/error）
- 注意：Astro template 裡的 DOM 操作要等 `formosa-unlocked` 事件（已知陷阱）

**1.3 打卡次數計算**
- 成就卡門檻：打卡≥3次 + 完成問卷 + 留電話，三者缺一不可
- 確認 Worker 端計算打卡次數的 SQL（是 COUNT(*) from checkins WHERE userId = ? 還是其他寫法）
- 確認前端顯示的打卡次數是從 API 拿的，不是前端自己 count 的

### 預期產出
- [ ] 打卡 API 的完整 flow diagram（哪個檔案、哪幾行）
- [ ] edge case 清單（有處理 / 沒處理）
- [ ] 風險評估：有沒有在萬人同時打卡時可能出問題的地方

---

## 面向二：資料備份

### 盤點項目

**2.1 D1 Backup Workflow**
- `.github/workflows/` 裡的 D1 backup workflow，確認 wrangler 路徑是指向 `worker/wrangler.toml`（Issue #156 的修正）
- 確認 workflow trigger（手動 / cron）
- 確認備份涵蓋的 database 和 table

**2.2 KV 資料保護**
- Plan A 移除了 3 處 `TICKER_KV.delete()`（commit e82ca73e / a4b6fd2）
- 全局搜尋確認目前沒有任何 `TICKER_KV.delete()` 殘留
- 確認 KV 的 TTL 設定（有沒有資料會自動過期）

**2.3 備份覆蓋率**
- 列出 D1 裡所有 table
- 對照 backup workflow，確認每張 table 都有被備份到
- 特別注意：如果 backup 是 database level 就沒問題，如果是 table level 要確認清單完整

### 預期產出
- [ ] D1 table 清單 vs backup 覆蓋率矩陣
- [ ] KV delete 操作殘留搜尋結果（預期為 0）
- [ ] backup workflow 最近一次成功執行的時間（查 GitHub Actions）

---

## 面向三：等級呈現一致性（最關鍵）

### 核心問題
同一個使用者的「等級 / 里程 / 碳足跡 / 打卡次數」會出現在三個地方。這三個地方必須用同一套計算邏輯，不能各算各的。

### 三個呈現點

| # | 介面 | 描述 | 預期位置 |
|---|------|------|----------|
| A | Tracker 自己的畫面 | 香客在 LIFF 裡看到的自己的等級、里程、碳足跡 | `src/` 前端 + API response |
| B | Dashboard 管理後台 | 管理者看到的每位用戶數據 | Dashboard 頁面 + API response |
| C | 分享卡片 | 分享到 LINE/社群的成就卡上的數字 | share/achievement 相關元件 + API |

### 盤點項目

**3.1 等級判定邏輯**
- 找出所有「根據距離判定等級」的程式碼（前端 + Worker）
- 確認 A/B/C 三處用的是同一組門檻值（distance thresholds）
- 如果門檻值寫在多處，列出所有位置，標記是否一致
- 特別注意：前端有沒有 hardcode 門檻值而非從 API 取得？

**3.2 里程計算**
- 找出累計里程的計算邏輯（Worker SQL or JS）
- 確認 A/B/C 三處顯示的里程都來自同一個 API 欄位
- 確認沒有前端自己重新計算里程的情況

**3.3 碳足跡數字**
- 碳排係數 0.12013（Issue #103 修正後的值）
- 全局搜尋：`grep -rn "0.12013\|0.47515\|carbonFactor\|CARBON" worker/ src/`
- 確認三處用的都是 0.12013，沒有殘留舊值 0.47515

**3.4 公仔 / 圖示**
- 等級對應的公仔圖示，判定邏輯在哪裡？
- A 和 C 有沒有可能因為 cache 顯示不同等級的公仔？

### 預期產出
- [ ] 「計算源頭 → 呈現點」的追蹤表：每個數字從哪裡算出來、經過哪些 API、最終顯示在哪
- [ ] 不一致風險清單（如果有的話）
- [ ] 具體的檔案名稱 + 行號

---

## 面向四：路徑計算與碳數據

### 盤點項目

**4.1 GPS → 距離算法**
- GP-1~GP-9 管線修復（8f08e5d）後的 Haversine 或等效實作
- 是在 Worker 端算還是前端算？
- 有沒有跳點過濾（例如 GPS 漂移突然跳到 100km 外）？
- 最大合理速度門檻是多少？（進香隊伍步行速度大約 4-6 km/h）

**4.2 碳排計算公式**
- `碳足跡 = 距離 × 碳排係數` — 確認公式完整
- 搭車 vs 步行有沒有不同的係數？
- 善足跡選填（Issue #162）的資料如何影響碳排計算？

**4.3 累計 vs 單次**
- 「今日里程」和「累計里程」的分界邏輯（UTC 0:00 還是 Asia/Taipei 0:00）
- 同一地點打卡兩次，距離是 0 還是會重複計算？
- 跨午夜的邊界處理

### 預期產出
- [ ] 距離計算的完整 flow（GPS 點 → 過濾 → Haversine → 累加 → 儲存）
- [ ] 碳排公式和所有係數的位置
- [ ] 邊界條件處理清單

---

## 面向五：參與彈性

### 核心原則
進香不是比賽。使用者隨時可以加入、可以中途退出、可以暫停幾天再回來，這些行為都不應該影響他的參與資格和累計數據。

### 盤點項目

**5.1 加入時間限制**
- 有沒有 `startDate` / `endDate` 的硬編碼限制打卡 API？
- 如果有，是不是活動期間外就完全不能用？
- 活動第五天才第一次打卡的人，能不能正常註冊和使用？

**5.2 中斷後的狀態保留**
- 連續幾天不打卡，再回來打，累計里程和等級是否完整保留？
- 有沒有任何 cron job 會清理「不活躍用戶」的資料？
- KV 或 D1 裡有沒有 TTL 或自動清除機制會影響用戶資料？

**5.3 GPS 軌跡的連續性**
- 中斷後第一次打卡，如果地理位置跟上次差很遠，距離計算怎麼處理？
- 有沒有「上一次打卡位置」的概念？如果有，中斷期間這個值怎麼處理？

**5.4 流程順序**
- 問卷和打卡的順序是否綁定？能不能先打卡再填問卷？
- 手機號碼可以後補嗎？
- 這三個條件（打卡≥3、問卷、電話）的判定是在「領成就卡」的時候才檢查，還是每次打卡都檢查？

**5.5 重新加入**
- 使用者封鎖 LINE OA 再解封，或刪除 LIFF 再重開，userId 不變的前提下資料是否保留？
- 有沒有「刪除帳號」的功能？如果有，是軟刪除還是硬刪除？

### 預期產出
- [ ] 時間限制相關的硬編碼清單（如果有）
- [ ] 「中斷→回來」的 happy path 確認
- [ ] 可能影響參與彈性的邏輯清單

---

## 回報格式

完成盤點後，請產出一份 `worklogs/worklog-2026-04-10-audit.md`，格式：

```markdown
# Formosa ESG 起駕前程式碼盤點報告

## 盤點摘要
- 總共檢查 {N} 個檔案，{M} 個邏輯點
- 🟢 無風險：{數量}
- 🟡 低風險（可活動後處理）：{數量}
- 🔴 高風險（建議起駕前修）：{數量}

## 面向一：打卡功能
...（每個面向的具體發現）

## 面向二：資料備份
...

## 面向三：等級呈現一致性
...（這個面向要特別詳細，列出每個數字的源頭和呈現點）

## 面向四：路徑計算與碳數據
...

## 面向五：參與彈性
...

## 建議行動
- 🔴 {需要緊急修的} → 開 Issue #{N}
- 🟡 {可以活動後處理的} → 記錄到 Issue #155
```

---

## 注意事項

- **這是盤點，不是修改**。除非發現 🔴 高風險問題，否則不要改程式碼
- 如果發現需要修的問題，先寫進報告，開 Issue，讓 Paul 決定要不要在起駕前修
- 碳排係數要讀原始碼確認，不要用 memory 裡的值（4/04 幻值事故教訓）
- GitHub MCP 大檔案會截斷，關鍵檔案要用本機 `cat` 讀完整內容
- Worker 部署是 `cd worker && wrangler deploy --config wrangler.toml`，前端是 git push
