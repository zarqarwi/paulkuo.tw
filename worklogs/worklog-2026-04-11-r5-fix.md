# Worklog 2026-04-11 — R5 Fix

## 完成日誌（最新在上）
- 14:42 R5 audit 全 8 項修復完成，build 通過，已 push (9fa6c9d) Code

### 修復明細

| # | 優先 | 項目 | 檔案 | 修改內容 |
|---|------|------|------|----------|
| P0-1 | 🔴 | dailyReport GET try/catch | `worker/src/formosa.js` | GET 路徑的 migrateFormosa + D1 query 包進 try/catch，失敗回 500 JSON |
| P0-2 | 🔴 | ja.ts i18n key 大小寫 | `src/i18n/translations/ja.ts` | `sec8CollectGps` → `sec8CollectGPS` |
| P1-3 | 🟡 | LINE env key 統一 | `worker/src/formosa.js` | `LINE_CHANNEL_ACCESS_TOKEN` → `FORMOSA_LINE_TOKEN` |
| P1-4 | 🟡 | 碳排係數統一 | 4 語系 `step65TransitDesc` | 拿掉分項數據，改為統一值 0.12013 kgCO₂/km |
| P1-5 | 🟡 | 空 catch 補 log | `worker/src/formosa.js` (4處) | getAuthRole / checkin sedan / flushBuffer KV re-put / getLineProfile |
| P1-6 | 🟡 | MyPage 等級 i18n | `_MyPage.astro` | TITLES 名稱從 hardcode 中文改用 `_t.levels['N']`，新增 levels 到 i18nMyPage |
| P1-7 | 🟡 | 死函數清理 | `worker/src/formosa.js` | 刪除 buildUsageMessage / buildCarbonInfoMessage / buildMenuMessage / haversineKm (~68 行) |
| P1-8a | 🟡 | online 事件 flush | `_TrackerPage.astro` | `window.addEventListener('online', ...)` → flushCheckinQueue |
| P1-8b | 🟡 | ScheduledPush locale guard | `worker/src/formosa.js` | locale 迴圈內加 per-locale try/catch |

## 狀態變更
- R5 P0（2項）：待修 → 已修 (9fa6c9d)
- R5 P1（6項）：待修 → 已修 (9fa6c9d)

## 決策紀錄
- 無特殊決策：所有修復項目均按 Cowork handoff 指令執行

## 阻礙與踩坑
- 無阻礙

## 部署狀態
- 前端：git push 後 Cloudflare Pages auto-deploy（CDN 最多 1 小時生效）
- Worker：**未部署**，等 Paul 手動 `cd worker && wrangler deploy --config wrangler.toml`
