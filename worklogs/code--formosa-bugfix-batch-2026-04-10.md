# Handoff: Formosa Bug 修復批次 — 2026-04-10

> 來源：Cowork session（Paul 確認 #127/#143/#144/#145 已關閉）
> 目標：Code session 接手修復剩餘 5 個 open bugs
> 起駕日：4/12（剩 2 天）

---

## 背景

Formosa ESG 2026 白沙屯進香 tracker 目前有 5 個 open bug issues。
其中 3 個是 4/2 的舊回報，之後陸續有修復（redirect、LIFF Published、GPS pipeline），
**很可能已經不存在了**，但 issue 沒關。

所以這次的策略是：**先驗證，能關的先關，剩下的才修。**

---

## 建議模型

Sonnet · Effort: Medium（驗證為主，修復量不大）

---

## Step 0：偵察 — 先驗後修

以下 3 個 issue 都是 4/2 回報，之後已有大量修復上線。
**先驗證是否仍可重現，能關就關。**

### #128 — 打卡次數自動增加（30→40）
- **可能已被 #145 修復**（GPS 歷史點重複上傳，merge 時漏標 `_uploaded: true`）
- 驗證：查 D1 該用戶（`U14164b4b3b7b6997b7b19feed35d22c8`）最近的 checkin 記錄，看有沒有異常重複
```bash
# 查 checkin 是否有重複時間戳
grep -rn "_uploaded\|gpsTrackPoints\|mergeGps" src/pages/projects/formosa-esg-2026/tracker/_TrackerPage.astro
```
- 如果 `_uploaded: true` 邏輯正確 → 應該已修，close #128 並加 comment 說明被 #145 附帶修復
- 如果仍有問題 → 排查 `processCheckin()` 是否有重複觸發

### #129 — Desktop Chrome LINE 登入按鈕失敗
- **LIFF channel 已於 4/5 Published**，之前是 Developing 狀態，非 LINE 環境無法登入
- 驗證：
```bash
# 確認 LIFF init 有 fallback
grep -rn "liff\.login\|liff\.init\|isInClient\|isLoggedIn" src/pages/projects/formosa-esg-2026/ --include="*.astro" --include="*.js"
```
- 用桌面 Chrome 開 https://mazu.today/projects/formosa-esg-2026/tracker/ 測試登入
- 如果能正常登入 → close #129，comment 說明 LIFF Published 後已解決
- 如果仍失敗 → 檢查 `liff.login()` 的 redirectUri 設定

### #130 — Tracker link 404 + 分享連結空白
- **mazu.today custom domain 4/4 已生效**，redirect rules 已修
- 驗證：
```bash
curl -s -o /dev/null -w "%{http_code}" https://mazu.today/projects/formosa-esg-2026/tracker/
curl -s -o /dev/null -w "%{http_code}" https://paulkuo.tw/projects/formosa-esg-2026/tracker/
```
- 測試分享功能產生的 URL 是否正常（從前端 share 邏輯找出 URL 格式）
- 如果都 200 且頁面正常 → close #130
- 如果有問題 → 檢查 `_redirects` 和 Cloudflare Dashboard redirect rules

---

## Step 1：需要修復的 Bugs

### #131 — LINE 連結縮圖未顯示媽祖圖片（OG Image） `L1`
- **風險等級**：L1（純前端 meta tag，push main 即可）
- 偵察：
```bash
grep -rn "og:image\|twitter:image" src/pages/projects/formosa-esg-2026/ --include="*.astro"
grep -rn "og:image" src/layouts/ --include="*.astro"
# 確認 og-worker.js 的 OG 攔截邏輯
grep -rn "og:image\|formosa" wrangler.jsonc
```
- 確認 tracker 頁面的 `<meta property="og:image">` 是否指向正確的媽祖圖片
- LINE 的 OG 快取很慢，修完後可用 https://poker.line.naver.jp/ 強制刷新
- 注意：根目錄 `wrangler.jsonc` 是 og-worker.js（社群爬蟲 OG 攔截），不是前端部署

### #158 — GPS 定位飄移 + 軌跡僅顯示直線 `L2`
- **風險等級**：L2（GPS 資料管線 + 前端軌跡渲染），需 PR + preview
- 設備：Android 15 / OPPO CPH2305 / LINE 26.4.0
- User ID：`U14164b4b3b7b6997b7b19feed35d22c8`（跟 #128 同一人，GPS 品質可能本身較差）
- 偵察：
```bash
grep -rn "cluster\|simplify\|filter.*gps\|polyline\|accuracy" src/pages/projects/formosa-esg-2026/ --include="*.astro" --include="*.js"
grep -rn "gps\|coordinate\|latitude\|longitude" worker/src/ --include="*.js"
```
- **建議修法**：
  1. 前端加 GPS accuracy 閾值（`coords.accuracy > 100` 的點丟棄）
  2. 檢查 polyline 渲染是否有遺漏中間 GPS 點（只取首尾）
  3. 檢查 server-side clustering 是否過度簡化
- ⚠️ 這是 P2，4/12 前如果時間不夠，加個簡單的 accuracy filter 就好，不用大改

---

## 驗證清單

完成後請逐項確認：

- [ ] #128 驗證：D1 無異常重複 → close / 或找到新根因修復
- [ ] #129 驗證：桌面 Chrome 能登入 → close / 或修復 LIFF fallback
- [ ] #130 驗證：tracker URL 200 + 分享連結正常 → close / 或修復 routing
- [ ] #131 修復：OG Image 指向媽祖圖片 + LINE Preview 工具確認
- [ ] #158 修復：加 accuracy filter + polyline 中間點確認

---

## 注意事項

1. **已知陷阱**：`_redirects` 的 `:splat` 語法（Issue #90 P0 事故），不要亂改
2. **根目錄 wrangler.jsonc 是 og-worker.js**，不是前端部署用的
3. **前端部署是 git push → Pages auto-build**，不是 wrangler deploy
4. **Worker 部署**：`cd worker && wrangler deploy --config wrangler.toml`（Paul 本機跑）
5. **CDN 快取 max-age=3600**，新部署最多等 1 小時生效

---

## 回報格式

完成後寫 worklog，格式：
```
## 完成日誌
- {HH:MM} #128 驗證結果 (close / 需修)
- {HH:MM} #129 驗證結果 (close / 需修)
- {HH:MM} #130 驗證結果 (close / 需修)
- {HH:MM} #131 OG Image 修復 ({commit hash})
- {HH:MM} #158 GPS accuracy filter ({commit hash})

## 待 Paul 執行
- [ ] Worker deploy（如有改動）→ 驗證: curl https://api.paulkuo.tw/api/formosa/health
- [ ] LINE OG 快取刷新（#131）→ 驗證: LINE Preview 工具
```

🤖 Handoff by Cowork (2026-04-10)
