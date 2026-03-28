---
session: code
date: 2026-03-28
---

## 完成項目
- 修復 Formosa 追蹤器 iOS Safari 照片儲存問題：a-download 在 iOS 不可用，改用 Web Share API 讓使用者手動儲存圖片
- 拆分照片輸入為「拍照」(capture=environment) 與「選照片」兩個按鈕，解決 iOS 拍照後不存相簿的問題
- 新增明確的綠色儲存提示 UI，拍照處理後出現 Save 按鈕觸發 navigator.share()
- Dashboard External Score 趨勢圖加入 calibration history（10 筆校準 + test-run 作為早期數據點）
- Dashboard 敘述文字依 Paul review 調整
- Formosa 分享卡：移除 QR code，改放 NET-ZERO 合作夥伴 logo

## 檔案變動
- `src/pages/projects/formosa-esg-2026/tracker/index.astro` — 照片儲存流程重寫（Web Share API + 拆分拍照/選照片按鈕 + 儲存提示 UI）
- `worker/src/formosa.js` — 配合照片輸入拆分調整
- `src/pages/projects/formosa-esg-2026/my/index.astro` — 分享卡移除 QR code，加入 NET-ZERO logo
- `public/images/formosa/logo-netzero.jpg` — 新增 NET-ZERO logo 圖檔
- `public/images/formosa/logo-ssbti.jpg` — 新增 SBTi logo 圖檔
- `src/pages/tools/ai-ready-dashboard.astro` — 敘述文字微調 + calibration history 圖表

## 未完成 / 卡住
- Wrangler CLI 登入過期，`wrangler pages deploy --branch main` 失敗（但 git push 已觸發 Cloudflare Pages 自動部署，production 有更新）
- 分享卡底部是否要加 `paulkuo.tw/formosa` 小字尚未決定

## 需要 Paul 手動操作
- 終端機執行 `wrangler login` 重新授權 Cloudflare 帳號，下次手動部署才能使用

## 給 Cowork 的備註
- iOS Safari 照片儲存限制已確認：無法程式化存入相簿，最終方案是 Web Share API + 使用者手動儲存，這是平台限制非 bug
- Formosa 分享卡設計方向從 QR code 轉為合作夥伴 logo，如有後續設計需求請以此為基準
- Dashboard calibration history 已上線，External Score 趨勢圖現在顯示從校準期到正式追蹤的完整時間線
