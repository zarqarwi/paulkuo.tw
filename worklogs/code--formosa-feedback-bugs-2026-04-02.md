# Code Session 工單：Feedback 回饋修復（2026-04-02）

## 背景

4/2 凌晨義工測試回報了 8 筆問題，Cowork 已分類並開了 5 張 GitHub Issues。
3 筆 Bug + 2 筆 UX 改善，需在 4/12 起駕前全部處理完。
Paul 已同意所有 UX 建議。

---

## Issues 清單與優先順序

| 優先 | Issue | 類型 | 標題 |
|------|-------|------|------|
| P0 | #82 | Bug | LINE Bot 打卡連結 404 |
| P0 | #83 | Bug | 分享連結給朋友顯示空白頁面 |
| P0 | #84 | Bug | 非 LINE 瀏覽器按「用 LINE 登入」錯誤畫面 |
| P1 | #85 | UX | 足跡資料與等級成就數字不同步 |
| P1 | #86 | UX | 問卷改為按鈕觸發，不要進頁面就顯示 |

---

## Step 0：偵察（先查再改）

每個 issue 開工前先跑以下偵察，確認現狀：

```bash
# Issue #82 — LINE Bot tracker URL
grep -rn "TRACKER_URL\|trackerUrl\|mazu\.today.*tracker\|paulkuo\.tw.*tracker" worker/src/formosa.js worker/src/formosa-i18n.js

# Issue #83 — 分享連結 URL
grep -rn "share\|分享\|shareUrl\|shareCard" src/pages/projects/formosa-esg-2026/tracker/_TrackerPage.astro

# Issue #84 — LIFF 登入 fallback
grep -rn "liff\.login\|liff\.init\|isInClient\|isLoggedIn" src/pages/projects/formosa-esg-2026/tracker/_TrackerPage.astro

# Issue #85 — stats 資料來源
grep -rn "stats\|checkin_count\|total_km\|level" src/pages/projects/formosa-esg-2026/tracker/_TrackerPage.astro | head -30

# Issue #86 — 問卷區塊結構
grep -rn "survey\|questionnaire\|問卷\|fb-form\|formSection" src/pages/projects/formosa-esg-2026/tracker/_TrackerPage.astro | head -20
```

---

## 具體修復指引

### #82 LINE Bot 打卡連結 404

**問題**：Bot 回覆的 tracker link 可能還指向 paulkuo.tw 或 workers.dev 舊路徑。
**查**：`formosa.js` 裡的 `TRACKER_URL` / `PROJECT_URL` 常數，以及 `formosa-i18n.js` 裡 botMsg 模板。
**改**：所有 tracker 相關 URL 改為 `https://mazu.today/projects/formosa-esg-2026/tracker/`。
**注意**：同時檢查 `feedbackUrl`、`guideUrl`、`shareUrl` 是否也需要改成 mazu.today。

### #83 分享連結空白頁面

**問題**：分享功能產生的連結，朋友點進去空白。
**查**：tracker 頁面的分享按鈕產生的 URL 格式。可能帶了 `?user=xxx` 之類的參數。
**改**：確保分享 URL 指向公開可訪問的頁面，不依賴 localStorage 或 user-specific 資料才能渲染。
**截圖**：https://api.paulkuo.tw/api/formosa/feedback-image/1775095095920-bf5cfa59.png

### #84 非 LINE 瀏覽器登入異常

**問題**：電腦版 Chrome 按「用 LINE 登入」跳錯誤畫面。
**查**：`liff.init()` 和 `liff.login()` 的 error handling，特別是 `liff.isInClient()` 為 false 時的行為。
**改**：
  - 如果 `!liff.isInClient()`，用 `liff.login({ redirectUri })` 跳轉 LINE Login 網頁版
  - 加 try/catch 在 liff.init 包一層，失敗時顯示友善的錯誤訊息而不是白屏
**前提**：Paul 需要先去 LINE Developers Console 把 LIFF channel 設為 Published（這步 Code 做不了，已通知 Paul）
**截圖**：https://api.paulkuo.tw/api/formosa/feedback-image/1775101873968-1e623d0f.png

### #85 足跡資料與等級成就不同步

**問題**：打卡下方的足跡統計 vs「我的等級成就紀錄」數字不一致。
**查**：兩個區塊分別從哪個 API / 哪個變數取資料。可能一個用 localStorage 快取的舊值，另一個用即時 API 回應。
**改**：統一兩處讀同一份 stats 物件，確保頁面載入後一次 fetch → 一份資料 → 兩處同步顯示。
**截圖**：
  - https://api.paulkuo.tw/api/formosa/feedback-image/1775096083236-63e491a6.png
  - https://api.paulkuo.tw/api/formosa/feedback-image/1775096217112-4dc7f1b6.png

### #86 問卷改為按鈕觸發

**問題**：進頁面就顯示一堆問卷題目，用戶還沒開始走就被問卷嚇到。
**改**：
  1. 問卷區塊預設 `display: none`
  2. 新增一個 CTA 按鈕：「參與紀錄善足跡活動」
  3. 點擊按鈕後展開問卷（可用簡單的 toggle，不需動畫）
  4. 按鈕文案用 i18n key，保持多語系支援
**位置**：`_TrackerPage.astro` 的問卷相關區塊

---

## 驗證方式（Smoke Test）

每個 issue 修完 deploy 後，Code session 必須跑以下驗證並在 worklog 記錄結果：

### Level 1 — 基本功能

```
□ #82：用 curl 模擬 LINE webhook，確認 Bot 回覆的 tracker URL 是 mazu.today 開頭
□ #83：開分享連結（無登入狀態），頁面正常顯示（不是空白）
□ #84：在非 LINE 瀏覽器打開 tracker，點「用 LINE 登入」→ 跳轉 LINE Login 網頁（不是白屏/錯誤）
□ #85：打卡後，頁面下方足跡數字 = 等級成就紀錄數字
□ #86：進入 tracker 頁面 → 看不到問卷 → 按「參與紀錄善足跡活動」→ 問卷展開
```

### Level 2 — 回歸

```
□ 問卷填寫 → 送出 → 成功回應
□ 打卡功能正常（GPS → 送出 → 有回應）
□ 等級公仔顯示正確
□ 分享卡片可以產生並開啟
```

---

## 回報格式

修完後請在 worklog 寫入：

```markdown
## 完成日誌
- {HH:MM} 修復 Issue #XX {標題} ({commit hash}) Code
  - Smoke test: PASS / FAIL
  - 備註: {任何需要注意的事}

## 需要 Cowork 跟進
- 更新 _LogPage.astro：將 #{issue} 從「處理中」移到「已修復」
- {其他需要 Cowork 做的事}
```

---

## 注意事項

1. **部署 Worker 必須帶 --config**：`cd worker && wrangler deploy --config wrangler.toml`
2. **CDN 快取 max-age=3600**，前端驗證要 hard refresh
3. **cron 每 10 分鐘跑 git stash/pop**，commit + push 要原子操作
4. **#84 的 LIFF Published** 需要 Paul 手動操作，Code 先把程式碼改好，Paul 操作後才能完整驗證
5. **品牌名稱**（Feedback #5 的建議）Paul 尚未最終決定，暫時不改

---

## GitHub Issues 連結

- https://github.com/zarqarwi/paulkuo.tw/issues/82
- https://github.com/zarqarwi/paulkuo.tw/issues/83
- https://github.com/zarqarwi/paulkuo.tw/issues/84
- https://github.com/zarqarwi/paulkuo.tw/issues/85
- https://github.com/zarqarwi/paulkuo.tw/issues/86
