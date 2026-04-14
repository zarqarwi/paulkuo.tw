# R4 起駕前盤查結果：使用者旅程 + 邊界人物 + 營運韌性

**日期：** 2026-04-10
**審計者：** Claude Code (Sonnet 4.6)
**性質：** 🔍 偵察 + 少量修復建議

---

## 盤查一：使用者旅程完整性

### 1.1 LIFF 開啟 → 隱私同意

- ✅ LIFF init 失敗有 fallback（AuthGate.astro:379-391 — `liff.init` `.catch` → reset 按鈕 + 顯示「LINE 登入初始化失敗，請重新整理頁面」）
- ✅ `liff.login()` 失敗也有 fallback（AuthGate.astro:306-318 — `doLiffLogin` try/catch → 顯示「登入時發生錯誤，請稍後再試」）
- ⚠️ P2：隱私同意 D1 失敗時前端**不會卡住**（AuthGate.astro:281-290 — `fetch('/api/formosa/privacy').catch` 時 fallback 直接 `localStorage.setItem('formosa_privacy_agreed','1')` + `unlock()`），但 `privacy_agreed_at` 沒有寫入 D1。下次開 LIFF、`checkExistingPrivacy()` 讀到 localStorage 會跳過同意，所以**使用者不會被重複要求**；但如果換設備就要重新同意。可接受。
- ✅ 隱私狀態儲存雙保險：D1 `privacy_agreed_at` 欄位 + localStorage `formosa_privacy_agreed`。`handleFormosaUserSync` 回傳 `privacy_agreed` 欄位，AuthGate.astro:237 同步到 localStorage，重開 LIFF 不重複要求。

### 1.2 第一次打卡

- ✅ 第一次打卡（DB 無此 user）flow 正常：`handleFormosaCheckin` 全程 KV，不需要 user 先存在 D1，只驗 GPS 座標 + rate limit + activity status（formosa.js:362-474）
- ✅ GPS accuracy > 100m 有過濾且有提示：TrackerPage.astro:725-728 — `if (pos.coords.accuracy > 100)` → 顯示 `trackingWaiting`（i18n），不記錄該點
- ⚠️ P1：KV buffer 寫入成功後 5 分鐘內若使用者重開頁面，`loadUserStats()` 從 D1 讀 GPS points（formosa.js:995），D1 尚未 flush → `checkins` 和 `km` 偏低，並會**覆寫** localStorage 數值（TrackerPage.astro:1104-1106）。使用者會看到數字倒退。
  - **建議修復**：`loadUserStats()` 更新 localStorage 時，只在 server 數值 >= 本地數值時才覆寫：
    ```js
    if (s.checkins > getSavedCheckins()) lsSet('formosa_checkins', s.checkins);
    if (s.total_km > getSavedKm()) lsSet('formosa_km', s.total_km.toFixed(2));
    ```

### 1.3 GPS 自動追蹤

- ✅ 前端用 `watchPosition`（TrackerPage.astro:717），持續監聽位置變化
- ✅ 網路斷線有 offline retry queue（GP-6，TrackerPage.astro:672-688）：失敗的打卡存入 `formosa_checkin_queue`，頁面重新載入時自動 flush 到 `/api/formosa/track/sync`
- ✅ GPS track 每 10 點或每 60 秒自動 persist 到 localStorage（GP-1，TrackerPage.astro:752-756）
- ⚠️ P2（需實機驗證）：手機鎖屏後 LINE in-app browser 的 watchPosition 是否繼續運作，行為取決於 iOS/Android 版本與 LINE App 背景執行權限。**前端沒有說明「鎖屏後追蹤可能暫停」**，建議在 GPS banner 或 FAQ 補充說明。

### 1.4 填問卷 → 看等級 → 分享卡片

- ✅ 重複送問卷防護：Worker 端有 KV rate limit（10 分鐘最多 2 次，formosa.js:275-278）；前端 `formosa_survey_done === 'true'` 後不再顯示問卷 flow（TrackerPage.astro:2234）；server 端 `formosa_surveys` 沒有 UNIQUE 限制（允許重複記錄，但 rate limit 已擋住大多數情況）
- ✅ 等級計算 `computeRank`（frontend 版）即時運算，無快取延遲，基於 localStorage km/checkins
- ⚠️ P2：OG 圖片首次產生需 Canvas 渲染 + R2 upload（`uploadOgImage()`，TrackerPage.astro:1125）。`checkins >= 2` 才觸發，上傳過程非同步、用戶無 loading 反饋。分享時若 R2 尚未完成，`handleFormosaOgServe` 有 fallback 回預設 OG 圖（formosa.js:2182），**不會白畫面，只是不是個人化版本**。

### 1.5 善足跡日記

- ✅ `handleFormosaDailyReport` GET 無打卡記錄時回傳 `{ ok: true, reports: [], total_gwp: 0, total_wu: 0, count: 0 }`（formosa.js:2070），正常空結果
- ✅ 前端善足跡日記是**輸入表單**，不是歷史查看頁，無空狀態顯示問題
- ✅ 無打卡記錄的人看到的 Tracker 頁面：CTA 卡片（問卷入口）+ GPS banner（定位中），km = 0、等級「煉氣香客」，顯示正常

---

## 盤查二：邊界人物

### 2.1 活動中途加入的人

- ✅ `TEST_MODE = new Date() < LAUNCH_DATE`（TrackerPage.astro:571），4/14 加入的人 TEST_MODE = false，正確
- ✅ 新用戶 km = 0、checkins = 0 → `computeRank` → 煉氣香客（tier 1），等級顯示正常
- ✅ 進度條是基於個人 km/checkins，不是活動整體進度，中途加入不顯示異常
- ✅ 頭部 badge「4/12 – 4/20 進香足跡記錄」為靜態文字，不會顯示「已過 N 天」之類導致新人困惑的動態資訊

### 2.2 GPS 權限拒絕的人

- ✅ `navigator.geolocation` 被拒絕時（error.code === 1）有 UI 反饋：TrackerPage.astro:761-768 — pulse 關閉、顯示 `_i18n.locationDenied`（已 i18n）
- ⚠️ P2：只有文字提示 `locationDenied`，**無引導使用者進系統設定的按鈕或連結**。建議補一個「如何開啟定位」的 FAQ 連結或 toast
- ⚠️ P1（設計決策）：GPS 權限拒絕時 `gpsCheckinBtn` 被 hide（TrackerPage.astro:767）。**GPS 被拒的用戶無法打卡**，但可以填問卷、看 dashboard。這是目前架構的設計限制，不算 bug，但應在 FAQ 補充說明。

### 2.3 沒加 LINE OA 好友的人

- ✅ LIFF 登入不需要 follow OA，所有功能（打卡、問卷、足跡頁）都可以正常使用
- ✅ OA 引導橫幅（Issue #140）：TrackerPage.astro:609-630 — `window.__liffFriendship === false` 時顯示 `oaFriendBanner`（包含加好友連結 @539fkwjd），可關閉且用 localStorage 記憶 dismiss 狀態
- ✅ 確認前端沒有依賴 webhook follow event 的狀態 — LIFF login 用 `handleFormosaUserSync`，與 webhook 完全獨立

### 2.4 非繁體中文的使用者

- ✅ AuthGate `autoRedirectByLanguage()`（AuthGate.astro:330-357）依 `liff.getAppLanguage()` 自動 redirect 到 `/en/`、`/ja/`、`/zh-cn/` 路徑
- ✅ 前端 UI 文字（toast、alert、banner）均透過 `_i18n` 物件傳入，已 i18n
- ⚠️ P2：**Worker 端回傳的錯誤訊息是固定中文字串**，例如：
  - `'打卡太頻繁，請稍後再試'`（formosa.js:386）
  - `'活動目前暫停中'`（formosa.js:374）
  - `'提交太頻繁，請稍後再試'`（formosa.js:277）
  
  非中文用戶遇到 429/403 時看到的是中文錯誤。這些訊息通常會被前端用 _i18n 覆蓋（`paused`、`tooFrequent` 等），**請確認前端是否有用對應 i18n key 覆蓋掉 API error message**，而不是直接顯示 `result.error`。

---

## 盤查三：營運韌性

### 3.1 Health Alert

- ✅ 觸發條件明確：D1 `SELECT 1` 失敗 + KV `list({prefix:'gps:', limit:1})` 失敗（formosa.js:2537-2550）
- ✅ Alert 推送到 `FORMOSA_ALERT_USER_ID`（Worker secret，push 到指定 LINE user）
- ✅ 指數退避冷卻機制：`BACKOFF_DELAYS = [0, 10*60, 30*60, 60*60, 2*60*60, 4*60*60]`（formosa.js:2530），避免連續轟炸
- ✅ 恢復時發送 ✅ 恢復通知（formosa.js:2557-2564）
- ⚠️ P2：health alert 只檢查 D1 + KV，不監控 R2 可用性（OG 圖片）和 LINE API 狀態

### 3.2 KV Buffer → D1 Flush 失敗

- ✅ D1 INSERT 失敗時，KV 資料**保留**（extend TTL 3 days，formosa.js:607-614）
- ✅ lock TTL 90 秒自動過期，下一次 cron 不卡住（formosa.js:643 comment）
- ⚠️ P1：**KV buffer TTL = 259200 秒 = 3 天**。若 D1 連續 3 天都 flush 失敗，資料**靜靜消失**。不過 health alert 應在 D1 掛掉後幾分鐘到數小時內告警（backoff 等級 1 = 10 分鐘），理論上不會無人知曉。建議可以 extend TTL 到 7 天作為保險：
  ```js
  // formosa.js:611: { expirationTtl: 259200 } → { expirationTtl: 604800 }
  ```
- ✅ flush lock 防重入：同一時間只有一個 flush 進程（分散式鎖，TTL 90s）

### 3.3 Cron 連續失敗

- ⚠️ P2：**無連續失敗升級告警**。health alert 只檢查 D1/KV 存活，不看「flush 是否成功」。`handleFormosaFlushBuffer` 失敗後只 log `console.error`，不觸發 LINE 告警。建議：若 `formosa:last_flush` 超過 30 分鐘未更新，health alert 也應告警
- ✅ `handleFormosaScheduledPush` 只在 hourly cron 跑（index.js:519 `event.cron !== '*/5 * * * *'` guard），失敗不累積，下一個整點重試

### 3.4 LINE API 限制

- ⚠️ P1：**`multicastLineMessage` 沒有 retry 邏輯**（formosa.js:1764-1784）。`resp.ok` 為 false 時只 log error 繼續下一批，失敗的 user 收不到推播。LINE multicast 回傳 429（rate limit）或 500 時，完全沒有重試機制。
  - **建議**：加簡單 retry with exponential backoff，或至少記錄失敗的 batch 到 KV 供後續補送
- ⚠️ P1：**LINE 方案資訊不一致**：handoff 文件說「NT$1,200/月（6,000 則）」，但 `handleFormosaLineUsage` 回傳 `plan: '中用量 NT$800/月'`（formosa.js:2252）。請確認目前訂閱的實際方案，並更新 code 裡的說明字串
- ⚠️ P2：**無費用超支 alert 機制**。`handleFormosaLineUsage` endpoint 需手動查詢，無自動告警。建議在 health alert cron 加入 LINE quota 使用率檢查（> 80% 時告警）

---

## 彙總表

| 項目 | 結果 | 風險等級 | 建議處理時間 |
|------|------|---------|------------|
| 1.1 LIFF init 失敗 fallback | ✅ | — | — |
| 1.1 Privacy D1 失敗 fallback | ⚠️ | P2 | 活動後 |
| 1.1 隱私狀態不重複要求 | ✅ | — | — |
| 1.2 第一次打卡 flow | ✅ | — | — |
| 1.2 GPS accuracy 過濾 | ✅ | — | — |
| 1.2 D1 flush 前頁面重開數字倒退 | ⚠️ | P1 | 今天（4/10） |
| 1.3 watchPosition 持續追蹤 | ✅ | — | — |
| 1.3 鎖屏後追蹤行為未說明 | ⚠️ | P2 | 活動期間 |
| 1.3 offline queue + retry | ✅ | — | — |
| 1.4 重複問卷防護 | ✅ | — | — |
| 1.4 等級即時計算 | ✅ | — | — |
| 1.4 OG 圖片首次生成有 fallback | ⚠️ | P2 | 活動後 |
| 1.5 善足跡日記空狀態 | ✅ | — | — |
| 2.1 中途加入顯示正常 | ✅ | — | — |
| 2.2 GPS 拒絕有 UI 反饋 | ✅ | — | — |
| 2.2 GPS 拒絕無引導進設定 | ⚠️ | P2 | 活動期間 |
| 2.2 GPS 拒絕無法打卡（設計限制） | ⚠️ | P1 | 今天補 FAQ |
| 2.3 無 OA 好友功能可用 | ✅ | — | — |
| 2.3 OA 引導橫幅 | ✅ | — | — |
| 2.4 i18n 自動 redirect | ✅ | — | — |
| 2.4 Worker 錯誤訊息無 i18n | ⚠️ | P2 | 活動後 |
| 3.1 Health alert 觸發與冷卻 | ✅ | — | — |
| 3.1 Health alert 不監控 R2/LINE | ⚠️ | P2 | 活動後 |
| 3.2 KV flush 失敗資料保留 | ✅ | — | — |
| 3.2 KV TTL 3 天，D1 掛 3 天資料消失 | ⚠️ | P1 | 今天 extend TTL |
| 3.3 Cron 失敗無升級告警 | ⚠️ | P2 | 活動後 |
| 3.4 multicastLineMessage 無 retry | ⚠️ | P1 | 今天（4/10） |
| 3.4 LINE 方案資訊不一致 | ⚠️ | P1 | 今天確認 |
| 3.4 無費用超支 alert | ⚠️ | P2 | 活動後 |

---

## 今日必修 P1 清單（4/10）

### Fix-A：loadUserStats 數字保護（TrackerPage.astro）

D1 flush 前重開頁面 checkins/km 倒退問題：

```js
// TrackerPage.astro:1101-1107 附近，loadUserStats() 中
// 原本：
lsSet('formosa_checkins', s.checkins);
lsSet('formosa_km', s.total_km.toFixed(2));

// 改為：
if (s.checkins > getSavedCheckins()) lsSet('formosa_checkins', s.checkins);
if (s.total_km > getSavedKm()) lsSet('formosa_km', s.total_km.toFixed(2));
```

### Fix-B：KV buffer TTL 延長（worker/src/formosa.js）

D1 掛 3 天資料消失問題：

```js
// formosa.js:611，handleFormosaFlushBuffer D1 失敗時 extend TTL
// 原本：{ expirationTtl: 259200 }  // 3 days
// 改為：{ expirationTtl: 604800 }  // 7 days
```

也要同步更新初始寫入的 TTL（formosa.js:432，bufferKey write）和 track_points 寫入（formosa.js:445）：
```js
// formosa.js:432: { expirationTtl: 259200 } → { expirationTtl: 604800 }
// formosa.js:525: { expirationTtl: 259200 } → { expirationTtl: 604800 }
```

### Fix-C：LINE 方案確認

請 Paul 確認：目前實際訂閱的 LINE 方案是 NT$800/月 還是 NT$1,200/月？
- 若是 NT$800 → 更新 handoff 文件，`handleFormosaLineUsage` 的說明字串保持正確
- 若是 NT$1,200 → 更新 formosa.js:2252 的 `plan` 字串

### Fix-D：multicastLineMessage retry（Worker）

活動期間可能發生 LINE API 429 或網路瞬斷：

```js
// formosa.js:1769-1783 — 加基本 retry
async function multicastBatch(batch, token, messages, maxRetry = 2) {
  for (let attempt = 0; attempt <= maxRetry; attempt++) {
    const resp = await fetch('https://api.line.me/v2/bot/message/multicast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ to: batch, messages })
    });
    if (resp.ok) return { status: resp.status };
    if (attempt < maxRetry && (resp.status === 429 || resp.status >= 500)) {
      await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
      continue;
    }
    const error = await resp.json().catch(() => resp.text());
    console.error('LINE multicast error:', JSON.stringify({ status: resp.status, error }));
    return { status: resp.status, error };
  }
}
```

---

## 注意事項

- Fix-A 只改前端，不影響 Worker，deploy 前端即可
- Fix-B 改 Worker formosa.js，需 `cd worker && wrangler deploy --config wrangler.toml`
- Fix-C 只是確認，不一定需要改 code
- Fix-D 改 Worker，影響 multicast 行為，要注意 setTimeout 在 Workers 的支援（CF Workers 支援 setTimeout）
