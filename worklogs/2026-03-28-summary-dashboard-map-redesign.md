---
session: code
date: 2026-03-28
---

## 完成項目
- Dashboard 地圖切換至 Carto Dark Matter 暗色底圖
- 繪製白沙屯→北港進香路線 polyline（10 waypoints：白沙屯→通霄→苑裡→大甲→清水→沙鹿→台中→彰化→西螺→北港）
- 起終點（白沙屯、北港）永久標籤，中間 waypoints hover 顯示
- 新增 Route Progress Bar（紅→琥珀→綠漸層，👑 標示前鋒位置，百分比顯示）
- 新增👑神轎（媽祖）marker，以群眾中位點定位，金色光暈效果
- 前鋒/尾巴 marker 加光暈效果（綠/紅 glow ring + 暗色發光標籤）
- 熱力圖/聚類/標記三模式色彩適配暗色主題（增大 radius、更鮮豔色彩）
- 地圖切換按鈕暗色主題（dark bg + amber active）
- Info bar 暗色主題（#0d1117 背景 + #c9d1d9 文字）
- Route tooltip 暗色金邊樣式
- fitBounds 納入全路線 waypoints，避免單人時過度放大
- Commit + push 完成 (40d1367)

## 檔案變動
- `src/pages/projects/formosa-esg-2026/dashboard/index.astro` — +224/-45 行（JS: dark tiles, route polyline, route progress logic, 神轎 marker, glow effects; CSS: 所有暗色主題樣式）
- `worklogs/worklog-2026-03-25.md` — 新增工作紀錄條目

## 未完成 / 卡住
- 三份使用說明書（香客/志工/管理者）— Paul 在 Cowork 進行中
- 說明書需加入「照片不上傳」隱私說明
- Dashboard 地圖在 preview 環境 tile 載入極慢（Carto CDN 在本地 preview browser 網路受限），但 CSS/JS 邏輯全部驗證正確，production 環境正常

## 需要 Paul 手動操作
- 部署到 production：`npm run build && wrangler deploy`（Code session 無法執行 wrangler deploy）
- 部署後在真實瀏覽器確認 Dashboard 地圖暗色主題 + 路線顯示效果

## 給 Cowork 的備註
- Dashboard 地圖重設計已完成並 push，等待部署
- 路線 waypoints 座標是根據 SVG 設計稿手動標定，實際進香路線可能微調——可在 `ROUTE_WAYPOINTS` 陣列中更新座標
- 神轎 marker 目前以「所有用戶 GPS 點的中位數」定位，如果未來有志工即時回報轎班位置，可改為讀取特定 user_id 的座標
- Route progress 計算方式：找到離路線最近的 waypoint 並內插，用累積距離/總距離算百分比
- 注意 cron 每 10 分鐘的 `git stash/pop` 會覆蓋未 commit 的 index.js 變更，本次改動只涉及 dashboard index.astro 所以沒有影響
