# mazu.today 資料模型參考文件

> 最後更新：2026-04-04 | 適用版本：commit 4275cc6 之後

本文件記錄 mazu.today（Formosa ESG 2026 白沙屯媽祖進香 GPS 追蹤系統）的完整資料模型，
涵蓋 Cloudflare D1、KV、R2 三層儲存的結構與用途。

---

## 基礎架構綁定（wrangler.toml）

| 綁定名稱 | 類型 | 用途 |
|-----------|------|------|
| `AUTH_DB` | D1 (paulkuo-auth) | 核心資料庫，所有 Formosa + Auth 資料表 |
| `TICKER_KV` | KV | GPS 緩衝、Rate Limit、分散式鎖、狀態旗標 |
| `FORMOSA_OG` | R2 | OG 分享卡片圖片（動態產生） |
| `TQEF_AUDIO` | R2 | TQEF 專案音檔（非 Formosa） |

Cron 排程：
- 每 5 分鐘：GPS flush（KV → D1 批次寫入）
- 每小時：其他維護任務（stock/fitbit 等）

---

## D1 資料表：Formosa ESG

### `formosa_users` — 香客資料

| 欄位 | 類型 | 說明 |
|------|------|------|
| `line_user_id` | TEXT PRIMARY KEY | LINE User ID，主鍵 |
| `display_name` | TEXT | LINE 顯示名稱 |
| `picture_url` | TEXT | LINE 頭像 URL |
| `role` | TEXT DEFAULT 'pilgrim' | 角色：pilgrim / volunteer / manager / owner |
| `language` | TEXT DEFAULT 'zh-TW' | 偏好語言（zh-TW / en / ja） |
| `phone` | TEXT | 手機號碼（成就卡門檻之一） |
| `participant_status` | TEXT DEFAULT 'active' | 狀態：active / completed / withdrawn |
| `created_at` | TEXT | 建立時間 |
| `updated_at` | TEXT | 最後更新 |

備註：`role` 對應三層權限系統（owner / manager / volunteer），由 admin API 設定。

### `formosa_surveys` — 問卷回答

| 欄位 | 類型 | 說明 |
|------|------|------|
| `id` | INTEGER PRIMARY KEY | 自增 ID |
| `line_user_id` | TEXT | 外鍵，關聯 formosa_users |
| `q1` | TEXT | 問題 1 回答（JSON array） |
| `q2` | TEXT | 問題 2 回答 |
| `q3` | TEXT | 問題 3 回答 |
| `q4` | TEXT | 問題 4 回答 |
| `q5` | TEXT | 問題 5 回答 |
| `q6` | TEXT | 問題 6 回答 |
| `transport_primary` | TEXT | 主要交通方式 |
| `transport_km` | REAL | 交通里程 |
| `transport_breakdown` | TEXT | 交通方式分佈（JSON） |
| `carbon_estimate` | REAL | 預估碳排量（kg CO₂） |
| `completed` | INTEGER DEFAULT 0 | 是否完成問卷 |
| `submitted_at` | TEXT | 提交時間 |
| `updated_at` | TEXT | 最後更新 |
| ...其餘欄位 | | 問卷 Q7-Q10（改版後精簡為 10 題） |

備註：問卷從 13 題精簡為 10 題（Q13→Q10 改版），部分欄位以 JSON array 儲存多選題。

### `formosa_gps_points` — GPS 打卡點

| 欄位 | 類型 | 說明 |
|------|------|------|
| `id` | INTEGER PRIMARY KEY | 自增 ID |
| `line_user_id` | TEXT | 外鍵 |
| `lat` | REAL | 緯度 |
| `lng` | REAL | 經度 |
| `altitude` | REAL | 海拔（可能為 null） |
| `accuracy` | REAL | GPS 精度（公尺） |
| `source` | TEXT | 來源：auto / manual / photo |
| `timestamp` | TEXT | 打卡時間 |
| `created_at` | TEXT | 寫入 D1 時間（≠ 打卡時間，因 KV buffer 延遲） |

備註：
- `source` 三種來源：auto（自動追蹤）、manual（手動打卡）、photo（拍照打卡）
- 資料先寫 KV buffer，cron 每 5 分鐘 flush 到此表，所以 `created_at` 會晚於 `timestamp`
- INSERT OR IGNORE 防重複（dedup by timestamp + userId）

### `formosa_daily_reports` — 每日碳足跡摘要

| 欄位 | 類型 | 說明 |
|------|------|------|
| `id` | INTEGER PRIMARY KEY | 自增 ID |
| `line_user_id` | TEXT | 外鍵 |
| `date` | TEXT | 日期（YYYY-MM-DD） |
| `total_km` | REAL | 當日總里程 |
| `carbon_saved` | REAL | 當日減碳量（kg CO₂） |
| `checkin_count` | INTEGER | 當日打卡次數 |
| `created_at` | TEXT | 建立時間 |

### `formosa_feedback` — 使用者回饋

| 欄位 | 類型 | 說明 |
|------|------|------|
| `id` | INTEGER PRIMARY KEY | 自增 ID |
| `line_user_id` | TEXT | 外鍵 |
| `category` | TEXT | 類別：bug / ux / environment |
| `content` | TEXT | 回饋內容 |
| `status` | TEXT DEFAULT 'open' | 狀態：open / in-progress / fixed / wontfix |
| `created_at` | TEXT | 建立時間 |

備註：Issue 關閉時 GitHub Actions 自動更新 status 為 fixed（需 `<!-- feedback-id: XX -->` 標記）。

---

## KV 鍵值模式（TICKER_KV）

### Formosa GPS 緩衝（核心）

| Key Pattern | TTL | 說明 |
|-------------|-----|------|
| `gps:{timestamp}:{userId}:{uuid}` | 259200s (3天) | GPS 打卡原始資料，每筆一個 key |
| `gps_count:{userId}` | 30天 | 該用戶的 GPS 累計筆數快取 |

**資料流**：香客打卡 → Worker 寫 KV（不碰 D1）→ Cron 每 5 分鐘掃描 `gps:` prefix → batch INSERT OR IGNORE 到 D1 → 刪除已 flush 的 KV key。

### 分散式鎖與狀態

| Key Pattern | TTL | 說明 |
|-------------|-----|------|
| `formosa:lock:gps_flush` | 90s | GPS flush 分散式鎖，防止多 cron 同時執行 |
| `formosa_status` | 無（持久） | 活動狀態：`active` / `paused` / `ended` |
| `formosa:lastFlush` | 無（持久） | 最後一次成功 flush 的 ISO 時間戳 |

### Rate Limiting

| Key Pattern | TTL | 說明 |
|-------------|-----|------|
| `rate:{userId}:{minute}` | 60s | 每分鐘打卡次數（上限 5 次） |

### 統計快取

| Key Pattern | TTL | 說明 |
|-------------|-----|------|
| `formosa:stats` | 60s | Dashboard 統計數據快取（避免頻繁查 D1） |

### 健康監控告警（RFC #100 A1 新增）

| Key Pattern | TTL | 說明 |
|-------------|-----|------|
| `alert:last_sent` | 無（持久） | 最後一次告警推播的 ISO 時間戳 |
| `alert:backoff_level` | 無（持久） | 目前退避等級（0=正常, 1=10min, 2=30min, 3=1hr, 4=2hr cap） |

告警觸發條件：D1 連線失敗、KV→D1 flush 停滯超過 30 分鐘。
退避序列：立即 → 10min → 30min → 1hr → 2hr（cap）。
恢復時推送「✅ 系統已恢復」並重置 backoff_level 為 0。
需設定 secret：`FORMOSA_ALERT_USER_ID`（Paul 的 LINE user ID）。

---

## Service Worker 快取（RFC #100 A2 新增）

| 資源類型 | 快取策略 | 說明 |
|----------|----------|------|
| `_astro/*` hashed assets | Cache-first | CSS/JS 帶 content hash，不可變 |
| Formosa HTML 頁面 | Network-first → cache fallback → offline.html | 優先取最新，離線時用快取 |
| API 請求 | Network-only | 不快取 API 資料 |
| 非 Formosa 頁面 | 不攔截 | SW scope 限定 `/projects/formosa-esg-2026/` |

離線 fallback：`public/offline.html`（友善中文提示，告知打卡已儲存、連線後自動上傳）。

---

## R2 物件儲存

### FORMOSA_OG Bucket — 分享卡片

| 路徑 | 說明 |
|------|------|
| `/api/formosa/og/{userId}.png` | 動態產生的 OG 分享圖片，含公仔 + 等級 + 里程 + QR Code |

產生時機：使用者點「分享」時動態產生並快取。

---

## 資料關聯圖

```
formosa_users (line_user_id PK)
  ├── formosa_surveys (line_user_id FK)
  ├── formosa_gps_points (line_user_id FK)
  ├── formosa_daily_reports (line_user_id FK)
  └── formosa_feedback (line_user_id FK)

KV Buffer
  gps:{ts}:{userId}:{uuid} ──(cron flush)──→ formosa_gps_points

R2
  FORMOSA_OG/{userId}.png ←── 動態產生自 formosa_users + gps_points 統計
```

---

## 成就卡門檻（商業邏輯）

解鎖成就卡需同時滿足三個條件：
1. 打卡次數 ≥ 3
2. 問卷已完成（formosa_surveys.completed = 1）
3. 已留手機號碼（formosa_users.phone IS NOT NULL）

---

## 等級系統

9 級香客等級，**雙條件判定**（累計里程 + 累計打卡次數，兩者都要達標）：

等級計算統一（RFC #100 修復）：Dashboard 和 Chat Bot 現在都使用 `computeRank(km, checkins)` 雙條件判定，全部 GPS 點計入，不再區分 source 類型。Chat Bot 也加入了 haversine 里程計算和噪音過濾（<10m, <30s, >300km/h），與 Dashboard 完全一致。LINE Bot 回覆新增 km 顯示。

| 等級 | 名稱 | 最低里程 | 最低打卡 | 來源 |
|------|------|----------|----------|------|
| 1 | 煉氣 | 0 km | 1 次 | formosa.js:846 TITLES[0] |
| 2 | 築基 | 15 km | 5 次 | formosa.js:846 TITLES[1] |
| 3 | 金丹 | 45 km | 10 次 | formosa.js:846 TITLES[2] |
| 4 | 元嬰 | 90 km | 15 次 | formosa.js:846 TITLES[3] |
| 5 | 化神 | 135 km | 20 次 | formosa.js:846 TITLES[4] |
| 6 | 煉虛 | 180 km | 25 次 | formosa.js:846 TITLES[5] |
| 7 | 合體 | 225 km | 30 次 | formosa.js:846 TITLES[6] |
| 8 | 大乘 | 270 km | 35 次 | formosa.js:846 TITLES[7] |
| 9 | 飛升 | 300 km | 40 次 | formosa.js:846 TITLES[8] |

⚠️ **勘誤**：本表 2026-04-04 初版誤填了不存在於程式碼的門檻值，已於同日修正。
正確值來源為 `worker/src/formosa.js` 第 846 行的 `TITLES` 陣列。
注意：formosa.js 第 1473 行有第二份 TITLES 陣列（用於 Chat Bot），值相同但缺 `sub` 欄位。

### 碳排係數 GWP_FACTORS（formosa.js:1907-1911，Ecoinvent 3.10）

| 項目 | 係數 | 單位 | 來源行 |
|------|------|------|--------|
| walk | 0 | kg CO₂e/km | 基準（零排放） |
| car | 0.30479 | kg CO₂e/km | formosa.js:1908 |
| scooter | 0.13734 | kg CO₂e/km | formosa.js:1908 |
| bike | 0.01220 | kg CO₂e/km | formosa.js:1908 |
| bus | 0.47515 | kg CO₂e/km | formosa.js:1909 |
| mrt | 0.07575 | kg CO₂e/km | formosa.js:1909 |
| train | 0.07575 | kg CO₂e/km | formosa.js:1909 |
| hsr | 0.07487 | kg CO₂e/km | formosa.js:1909 |
| water | 0.10974 | kg CO₂e/瓶 | formosa.js:1910 |
| recycle | -0.00265 | kg CO₂e/瓶 | formosa.js:1910（回收抵扣） |
| hotel | 8.85 | kg CO₂e/晚 | formosa.js:1910 |

速度推斷門檻（formosa.js:877-880）：≤ 15 km/h → zero_emission, > 15 km/h → motorized (0.47515)

⚠️ **勘誤**：本段 2026-04-04 初版寫「機車 0.05、汽車 0.21、遊覽車 0.04」，皆為錯誤舊值，已於同日修正。

---

## 補充：非 Formosa 的表（同一 D1）

同一個 `AUTH_DB` 裡還有：
- `users` + `sessions`：OAuth 認證（Google/LINE/Facebook）
- `tqef_*` 系列（14 張表）：翻譯品質評估系統，與 Formosa 無關

這些表共用同一 D1 實例，但邏輯完全獨立。注意 D1 的 single-writer 限制會互相影響——這也是為什麼 Formosa 改用 KV buffer 的原因之一。
