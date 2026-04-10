# R4 起駕前盤查：使用者旅程 + 邊界人物 + 營運韌性

**日期：** 2026-04-10
**來源：** Cowork → Code
**模型建議：** Sonnet（中度複雜度，需閱讀前端 + Worker 多檔案但邏輯判斷為主）
**性質：** 🔍 偵察為主，發現問題可修

---

## 背景

R1-R3 都是「由內往外」看程式邏輯和數據一致性。R4 換個角度——「由外往內」，模擬真實使用者的旅程，找出可能讓人卡住的地方。

**時程：起駕 4/12，凍結期 4/11 開始。今天（4/10）和明天（4/11 白天前）還能修 code。** R4 查出的問題按風險分級處理：
- **P0**（使用者完全無法使用）：立即修，今天 deploy
- **P1**（功能受限但可繞過）：今天或明天修
- **P2**（體驗不佳但不影響核心）：記錄，活動期間再處理

---

## 盤查一：使用者旅程完整性

模擬一個全新香客的完整流程，逐步檢查每個環節的 error handling：

### 1.1 LIFF 開啟 → 隱私同意
- 前端 `tracker.astro` 或對應元件：LIFF init 失敗時有沒有 fallback 提示？
- `handleFormosaPrivacyAgree` 如果 D1 寫入失敗，前端會卡住嗎？
- 隱私同意狀態是存在哪裡？重新開 LIFF 會不會重複要求同意？

### 1.2 第一次打卡
- `handleFormosaCheckin`：第一次打卡（DB 裡沒有此 user）的 flow 是否正常？
- GPS 精度差（accuracy > 100m）的情況，前端有沒有提示或過濾？
- KV buffer 寫入成功但 D1 flush 前，使用者看得到自己的打卡嗎？

### 1.3 GPS 自動追蹤
- 前端的 watchPosition / 定時打卡邏輯在哪？
- 使用者切到背景（手機鎖屏）後 GPS 追蹤會停嗎？前端有說明嗎？
- 網路斷線時，前端有 offline queue / retry 嗎？還是打卡就丟了？

### 1.4 填問卷 → 看等級 → 分享卡片
- `handleFormosaSubmit`：重複送問卷（survey_done 已經 = 1）會怎樣？
- 等級計算 `computeRank` 的結果在前端是即時更新還是有快取延遲？
- 分享卡片 `handleFormosaOgImage`：第一次產生 OG 圖片需要多久？使用者會不會等太久？

### 1.5 善足跡日記
- `handleFormosaDailyReport`：使用者沒有任何打卡紀錄時回傳什麼？前端顯示什麼？

---

## 盤查二：邊界人物

### 2.1 活動中途加入的人
- 4/14 才第一次開 LIFF 的人，tracker 頁面的「起駕」日期 / 進度條會不會顯示異常？
- 進香已走一半，新用戶的 km = 0，排行或等級顯示是否正常？

### 2.2 GPS 權限拒絕的人
- 前端在 `navigator.geolocation` 被拒絕時的 UX 是什麼？
- 沒有 GPS 的人能手動打卡嗎？能填問卷嗎？能看別人的進度嗎？
- 前端有沒有「請開啟定位」的引導提示？

### 2.3 沒加 LINE OA 好友的人
- LIFF 登入但沒 follow OA 的人，`handleFormosaWebhook` 的 follow event 不會觸發
- 這些人會收不到推播，但功能本身都能用對吧？確認前端沒有依賴 webhook follow 的狀態
- Issue #140 的 OA 引導橫幅在這個情境下會顯示嗎？

### 2.4 非繁體中文的使用者
- i18n 切到 en/ja/zh-cn 後，所有 API 錯誤訊息是中文還是有多語系？
- 前端的 toast / alert 訊息有過 i18n 嗎？

---

## 盤查三：營運韌性

### 3.1 Health Alert
- `handleFormosaHealthAlert`：觸發條件是什麼？D1 掛掉 / KV 掛掉 / flush 失敗各會怎樣？
- Alert 推送到哪？`FORMOSA_ALERT_USER_ID` 對應的 LINE user 是誰？
- 有沒有 alert 冷卻機制（避免連續轟炸）？

### 3.2 KV Buffer → D1 Flush 失敗
- `handleFormosaFlushBuffer`：D1 INSERT 失敗時，KV 的資料會保留還是被刪除？
- flush lock（90 秒）卡住時，下一次 cron 會怎樣？
- KV buffer 裡的資料 TTL 是 3 天——如果連續 3 天 flush 都失敗，資料會靜靜消失嗎？

### 3.3 Cron 連續失敗
- cron 每 5 分鐘跑一次。如果連續 3 次失敗（15 分鐘），有沒有升級告警？
- `handleFormosaScheduledPush`（每小時）失敗時，排程推播會累積還是跳過？

### 3.4 LINE API 限制
- LINE Messaging API 的 rate limit 是多少？萬人場景推播會不會撞到？
- `handleFormosaPush` 有沒有 retry 邏輯？還是單次失敗就放棄？
- 我們的方案是 NT$1,200/月（6,000 則），超額 NT$0.2/則——有沒有費用超支的 alert 機制？

---

## 產出格式

請用以下格式回報每個項目：

```
### 1.1 LIFF 開啟 → 隱私同意
- ✅ LIFF init 失敗有 fallback（file:line — 描述）
- ⚠️ P2：隱私同意 D1 失敗無前端提示（file:line — 建議）
- ✅ 隱私狀態存 D1，不會重複要求
```

最後附一個彙總表：

```
| 項目 | 結果 | 風險等級 | 建議處理時間 |
|------|------|---------|------------|
| ... | ✅/⚠️/🔴 | P0/P1/P2 | 立即/4-11前/活動期間/活動後 |
```

---

## 注意事項

- 前端檔案在 `src/pages/projects/formosa-esg-2026/` 下
- Worker 檔案在 `worker/src/formosa.js` + `worker/src/index.js`
- 如果某個問題需要瀏覽器實測才能確認（例如 LIFF 行為），標註「需實機驗證」
- Worklog 寫到 `worklogs/code--formosa-pre-launch-audit-r4-result-2026-04-10.md`
