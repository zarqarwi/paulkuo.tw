# Code Handoff — Dashboard 看不到媽祖定位（Issue #173）

> 日期：2026-04-15
> 來源：Feedback #29（2026-04-13 13:09）
> 優先級：P1 · 風險等級 L2（Dashboard + Worker clusters）
> 建議模型：Sonnet + low effort（先偵察，可能只是 fallback 邏輯）

## 背景

使用者在活動第二天（4/13）回報 Dashboard 看不到媽祖（皇冠 👑）的定位。

皇冠定位依賴 PR #119 的 sedan tracking：`/admin/clusters` 的 `sedan` 欄位取 30 分鐘內轎班志工 GPS 中位數，無資料時 fallback 到前鋒座標。

**關鍵疑點：PR #119 目前仍為 open 狀態（未 merge）**，所以生產環境可能跑的是舊邏輯（只顯示 sedan，沒有 fallback）。

## Step 0 — 偵察（必做）

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw

# A. 確認 PR #119 目前狀態
gh pr view 119 --repo zarqarwi/paulkuo.tw --json state,mergedAt,baseRefName,headRefName

# B. 確認 main 是否已包含 sedan fallback 邏輯
grep -n "is_sedan\|sedan_volunteer\|fallback" worker/src/formosa.js | head

# C. 線上 clusters 回應（確認目前是否有 sedan / fallback 欄位）
curl -s 'https://api.paulkuo.tw/api/formosa/admin/clusters' \
  -H 'X-Admin-Token: gf-admin' | jq 'keys, .sedan, .activeSedan, .totalSedan'

# D. Dashboard 前端皇冠邏輯
grep -rn "crown\|皇冠\|mazuMarker\|sedan" src/pages/projects/formosa-esg-2026/ | head -30
```

## 可能原因（排序）

1. **PR #119 未 merge**：生產環境跑舊邏輯，皇冠原本就不存在 → 使用者看不到理所當然。
2. **Sedan 志工沒上線**：PR #119 已 merge，但沒有人用 `gf-sedan` 打卡 → clusters.sedan = null → fallback 邏輯可能尚未實作或沒生效。
3. **前端條件過嚴**：sedan = null 時整個 marker 隱藏（沒走 fallback 渲染）。

## 修復步驟

### Phase 1 — 決定方向
根據 Step 0 結果決定：
- **情境 A：PR #119 未 merge** → 評估活動期間是否可以 merge。風險 L2，需 preview。若 Paul 同意，直接合併並 deploy。
- **情境 B：已 merge 但 sedan 無資料** → 確保 fallback 到前鋒位置永遠有效；找志工協調，讓至少 1 位轎班用 `gf-sedan` 打卡。
- **情境 C：前端條件過嚴** → 修 `_DashboardPage.astro` 讓皇冠在 fallback 座標也渲染，只是 popup 顯示「推估位置（無轎班 GPS）」。

### Phase 2 — 最小侵入修復
即使 PR #119 暫不 merge，也可以快速改 Dashboard 前端：當 `sedan` 為 null 時，用 `clusters[0]`（前鋒第一群）作為皇冠位置，並在 popup 標注「推估位置」。

### Phase 3 — 驗證
- 用 `gf-admin` 登入 Dashboard 確認皇冠有顯示且座標合理。
- 手機 LINE 瀏覽器打開 Dashboard 驗證（與回報者同一入口）。

## 注意事項

- 活動期間 merge 大型 PR（#119）風險較高，優先考慮 Phase 2 的前端最小修復。
- 改 Worker `/admin/clusters` 必須 `wrangler deploy --config worker/wrangler.toml`（Code session 無法跑，需 Paul 本機）。
- 修完後記得去 Feedback #29 PATCH status 為 fixed。
