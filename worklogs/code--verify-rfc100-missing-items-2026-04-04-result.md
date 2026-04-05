# RFC #100 偵察結果 — 2026-04-04

> 偵察工單來源：`worklogs/code--verify-rfc100-missing-items-2026-04-04.md`
> 結論：**三項功能全部存在於 main 分支**。Cowork 用 GitHub MCP 搜尋時可能因搜尋範圍不足而遺漏。

---

### 項目 1：handleFormosaHealthAlert（RFC #100 A1）
- **狀態：✅ 存在**
- **位置：**`worker/src/formosa.js:2330`
- **呼叫處：**`worker/src/index.js:458`（cron handler 內）
- **相關 commit：** worklog 記載為 15:30 Issue #100 實作批次的一部分
- **備註：**
  - 函式完整實作，含 D1 健康檢查、KV flush 停滯檢查（>30min）
  - 退避序列：`[0, 10, 30, 60, 120]` 分鐘（L2328），與文件一致
  - KV keys：`alert:backoff_level`（L2360/2374/2393）、`alert:last_sent`（L2367/2375/2392），與文件一致
  - Secret：`FORMOSA_ALERT_USER_ID`（L2332），與文件一致
  - 恢復推播：prevLevel > 0 時送 ✅ 恢復訊息並清除 backoff（L2361-2368）

---

### 項目 2：Service Worker (sw.js)（RFC #100 A2）
- **狀態：✅ 存在**
- **位置：**`public/sw.js`（99 行）
- **註冊處：**`src/pages/projects/formosa-esg-2026/tracker/_TrackerPage.astro:2289-2290`
- **Worker 靜態通過：**`worker/src/index.js:167`（sw.js 列入靜態資源 passthrough）
- **備註：**
  - Cache name：`formosa-v1`
  - 策略完整實作：
    - `_astro/*` → cache-first（hashed immutable assets）
    - `/images/`、manifest.json、favicon → cache-first
    - formosa 相關 HTML → network-first，fallback to cache，再 fallback to offline.html
    - API → network-only（不 cache）
    - 外部資源 → skip
  - Scope 限定：只 cache `/projects/formosa-esg-2026/` 或 `/formosa` 路徑下的 HTML（L81）

---

### 項目 3：Offline Fallback (offline.html)（RFC #100 A2 附屬）
- **狀態：✅ 存在**
- **位置：**`public/offline.html`（59 行）
- **備註：**
  - 中文友善提示頁面，深色主題
  - 標題：「目前無網路連線」
  - 告知使用者：「您的打卡紀錄已安全儲存在手機中，連線後會自動上傳」
  - 有「重新整理」按鈕（`location.reload()`）
  - Worker index.js L167 將 `/offline.html` 列入靜態資源 passthrough

---

### 附加：buildStatsMessage 雙條件
- **computeRank 有被呼叫嗎：✅ 是**
  - `formosa.js:1485`：`const rank = computeRank(totalKm, checkins);`
- **等級判斷邏輯：✅ 雙條件 (km + checkins)**
  - `computeRank()`（L858-867）：遍歷 TITLES，需同時 `km >= TITLES[i].km && checkins >= TITLES[i].checkins`
  - `buildStatsMessage()`（L1473-1485）：先用 haversine 算 totalKm（含雜訊過濾：<10m 跳過、速度 >300km/h 跳過），再帶入 computeRank
- **與 Dashboard 一致嗎：✅ 是（邏輯一致，名稱不同）**
  - Worker 端：`computeRank(km, checkins)`（L858）
  - Dashboard 前端：`getTitle(checkins, km)`（`_TrackerPage.astro:901`）
  - 注意：**參數順序不同**（worker: km, checkins; frontend: checkins, km），但內部邏輯完全相同
  - TITLES 門檻值完全一致（9 級，km: 0/15/45/90/135/180/225/270/300，checkins: 1/5/10/15/20/25/30/35/40）
  - Worker 端名稱是中文硬編碼（煉氣香客等），前端用 i18n keys（`_i18n.levels['1']`）— 這是預期行為（LINE Bot 只推中文）
  - Worker 端 `handleFormosaUser()`（L928）也呼叫 `computeRank(totalKm, checkins)`，Dashboard API 與 Chat Bot 一致

---

## 結論

| 項目 | Cowork 判定 | Code 偵察結果 | 差異原因推測 |
|------|------------|--------------|-------------|
| A1 handleFormosaHealthAlert | 找不到 | **L2330 完整存在** | GitHub MCP 可能只讀了檔案前段（formosa.js 2400+ 行） |
| A2 sw.js | 找不到 | **public/sw.js 存在** | GitHub MCP 搜尋路徑可能未含 public/ |
| A2 offline.html | 找不到 | **public/offline.html 存在** | 同上 |
| buildStatsMessage 雙條件 | 待確認 | **雙條件，與 Dashboard 一致** | — |

## Cowork 行動建議

1. **operations-runbook** Scenario 2（flush stalled → HealthAlert 推播）：**可信**，程式碼完整
2. **smoke-test-checklist** Service Worker 驗證項：**應保留**，sw.js 與 offline.html 都已部署
3. **RFC #100 文件**：三項聲稱均屬實，無需更正
4. 唯一需確認：`FORMOSA_ALERT_USER_ID` secret 是否已在 Cloudflare Workers 設定？（程式碼在 L2334 會 skip 如果缺少）
