---
session: code
date: 2026-03-28
---

## 完成項目
- AuthGate 恢復原本淺色設計（⛩️ + 白色卡片），移除先前的深色全螢幕樣式
- Auth Gate 顯示時隱藏 NavBar（#main-nav display:none）
- Auth Gate 顯示時隱藏 Footer（加入 DOMContentLoaded fallback 解決 DOM 時序問題）
- 驗證通過後自動恢復 NavBar 和 Footer
- 另一個 session 已加入 LINE Login 模式（lineLogin prop），本 session 未改動該部分

## 檔案變動
- `src/pages/projects/formosa-esg-2026/_components/AuthGate.astro` — 重寫樣式回淺色、修正 footer 隱藏時序

## 相關 Commits
- `a562ee8` — fix: revert auth gate to original light design, keep NavBar hidden
- `5b49b06` — fix: hide footer on auth gate (defer query until DOM ready)

## 未完成 / 卡住
- 無

## 需要 Paul 手動操作
- 確認線上部署版本是否正確顯示（NavBar 隱藏、淺色設計）
- 注意：另一個 session 可能已在 AuthGate 加入 LINE Login 相關 props 和邏輯，兩邊可能需要 merge

## 給 Cowork 的備註
- Paul 明確表示原本的入口設計已經很好看，不要改成深色，只需隱藏 NavBar
- AuthGate 現在支援 `lineLogin` prop（由另一個 session 加入），但本 session 的改動是基於純密碼模式
- Footer 隱藏需要 DOMContentLoaded fallback，因為 inline script 執行時 footer DOM 尚未 parse
