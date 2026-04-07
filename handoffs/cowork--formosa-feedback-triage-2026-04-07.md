# Cowork Handoff — Formosa 使用者回報處理 + 流程改善建議

**日期**：2026-04-07
**來源 session**：Cowork（本 session）
**目標 session**：下一個 Cowork session

---

## 本次完成事項

### 1. Feedback #20（Issue #125）— 照片無法點開 ✅ 已結案

- Issue #125 已 closed（Code 處理完畢）
- 但 feedback #20 status 卡在 `triaging`/`wontfix`，沒自動更新
- **已手動 PATCH**：透過 Chrome JS 打 API `PATCH /api/formosa/feedback/20`，status 改為 `fixed`
- 原因：`feedback-auto-close.yml` GitHub Action 還沒部署到 `.github/workflows/`

### 2. Issue #133 — 問卷 UX 引導說明 ✅ 已開

- [Issue #133](https://github.com/zarqarwi/paulkuo.tw/issues/133)
- L1, feedback-pipeline
- 內容：問卷填寫頻率說明 + 碳足跡 = 0 的空狀態引導 + i18n 四語系
- Paul 已確認需要做

### 3. Issue #127 — 打卡多次只顯示兩點 ✅ 根因分析完成，Issue 已更新

- [Issue #127](https://github.com/zarqarwi/paulkuo.tw/issues/127)
- 升級為 **L2**（架構改動）
- **根因**：Tracker 頁面路線完全依賴 localStorage，從不讀 server 歷史 GPS 點
  - 打卡 N 次 = localStorage 只有 N 個點 = 地圖只能畫 N 個點
  - auto 追蹤點只在記憶體，關頁面就丟（GP-1）
  - LINE WebView ↔ Safari localStorage 隔離
  - D1 有完整軌跡但前端沒去拿
- **修復方向**：Tracker 載入時 fetch API 拉歷史 GPS 點 → 合併 localStorage → 去重 → 繪製 polyline
- Issue body 已更新完整根因分析 + 修復方向 + 驗證方式

---

## 待下一個 Cowork session 處理

### 高優先 🔴

1. **等 Code 回報 Issue #127 和 #133 的處理結果**
   - #127 是 L2 架構改動，可能需要多輪 review
   - #133 是 L1 文字改動，應該比較快

2. **驗收 Issue #127 修復**（如果 Code 完成了）
   - 打卡 3+ 次 → 關頁面 → 重開 → 確認歷史路線仍顯示
   - LINE WebView 中確認跨 session 軌跡可見
   - 需要 Paul 手機實測

3. **同步 Apple Notes 儀表板**
   - 本 session Apple Notes MCP 連線 timeout，未能更新
   - 需要同步的內容：
     - Feedback #20 結案
     - Issue #133 開立
     - Issue #127 根因分析 + L2 升級
     - Issue #124 (feedback/log 公開) 已驗收通過

### 中優先 🟡

4. **催促 Code 部署 `feedback-auto-close.yml`**
   - Handoff 文件已存在：`handoffs/code--feedback-auto-close-2026-04-03.md`
   - 部署後 Issue close → feedback status 自動更新為 fixed
   - 活動期間大量回報進來時，這個自動化很重要

5. **建議 Code 在 Dashboard 加 feedback status 編輯功能**
   - 目前遇到例外狀況只能打 API 硬改
   - 加一個下拉選單讓 Paul/Manager 可以直接改 status

---

## 流程改善建議（Paul 已討論確認方向）

### 結案斷鏈問題
- feedback-auto-close.yml 部署後可自動化
- Dashboard 加 status 編輯可處理例外

### 日常流程建議
- Cowork 開場：撈 feedback + 對照 Issues + 確認結案
- 分工：Cowork 分類/開 Issue → Paul 拍板 UX → Code 執行 → Cowork 驗收
- Code 交接時同時確認 Issue close + feedback status 更新

### 4/12 前優先順序
1. Issue #127（路線顯示）— L2，影響香客體驗最大
2. Issue #133（問卷 UX）— L1，文字改動
3. feedback-auto-close 部署 — 活動期間必備

---

## 技術備忘

- Feedback PATCH API：`PATCH https://api.paulkuo.tw/api/formosa/feedback/{id}`，需 `X-Admin-Token` header
- Sandbox bash 無法打外部 API（exit code 56），要用 Chrome JS 或 Paul 本機 curl
- Apple Notes MCP 可能有連線不穩的問題，遇到 timeout 下次 session 再試

---

## auto-memory 更新清單

本 session 應該已有的 memory（請驗證）：
- `project_issue124_feedback_log_public.md` — 已驗收
- `project_issue125_photo_click.md` — 需新增或更新：已結案 + feedback #20 PATCHED

🤖 Handoff by Cowork (2026-04-07)
