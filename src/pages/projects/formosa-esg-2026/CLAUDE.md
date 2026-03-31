# Formosa ESG 2026 — 專案規則

此檔案由 Claude Code 在此目錄工作時自動讀取，搭配根目錄 `CLAUDE.md` 的通用規則使用。

---

## 專案資訊

- Tracker：https://paulkuo.tw/projects/formosa-esg-2026/tracker/（密碼：g-formosa）
- LINE Bot：@539fkwjd / LIFF ID: 2009588321-rXVntTKg
- 技術：Astro 前端 + Cloudflare Workers + D1
- 起駕日：4/12

---

## 部署後 Smoke Test（Level 1）

每次 deploy 後，**只驗這次改動碰到的區塊**，結果寫進 worklog。

| 區塊 | 驗證項目 |
|------|---------|
| 進入流程 | 密碼解鎖正常、頁面能載入 |
| GPS | banner 出現「定位中」或「追蹤中」、打卡按鈕可按、成功動畫有觸發 |
| 公仔/等級 | 圖片大小正常（120×120px）、等級名稱 badge 有顯示、升級有觸發 |
| 問卷 | 13 題卡片能翻頁、進度條更新、照片按鈕可用、確認提交能送出 |
| 獎勵卡 | 公仔大小正常（150×150px）、統計數據正確、分享按鈕可用 |
| 碳足跡 | 「今日善足跡回報」展開/收合正常、欄位可填數字 |
| 足跡頁 | /my/ 能載入、地圖有渲染、統計數據有顯示 |
| Worker API | checkin endpoint 回 200、資料有寫入 D1 |

---

## 已知陷阱

- **Astro scoped CSS**：`<style>` 預設 scoped，JS 用 `innerHTML` 動態建立的元素不會有 `data-astro-cid` 屬性 → 這類元素的 CSS 必須用 `:global()` 或 `is:inline`
- **CDN 快取**：`max-age=3600`，部署後最多等 1 小時才生效，驗證時務必 hard refresh
- **LINE in-app browser**：localStorage 跟 Safari 是隔離的，不能假設共享
- **leafletImage**：0.4.0 無法截取 Leaflet 1.9 的 Canvas renderer，改用 html2canvas
- **根目錄 wrangler.jsonc**：會覆蓋 `worker/wrangler.toml`，部署 Worker 必須帶 `--config`

---

## 檔案結構速查

```
src/pages/projects/formosa-esg-2026/
├── index.astro          # 專案首頁
├── tracker/index.astro  # Tracker 主頁（114KB，含 HTML+CSS+JS）
├── my/index.astro       # 個人足跡頁
├── guide/               # 使用說明
└── _components/         # AuthGate 等共用元件

worker/
├── src/formosa.js       # Worker API（checkin, GPS, daily report）
└── wrangler.toml        # Worker 設定（必須用 --config 指定）

public/images/formosa/
├── level-{1-9}.webp     # 公仔圖（1200×1200px，WebP 優先）
└── level-{1-9}.png      # 公仔圖（PNG 備用）
```
