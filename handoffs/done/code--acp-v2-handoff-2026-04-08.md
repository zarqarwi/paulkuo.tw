# Handoff: ACP 個人端 v2 改版

> **來源**: Cowork session 2026-04-08
> **目標**: Code session
> **專案**: paulkuo.tw — AI Collaboration Portfolio

---

## 背景

Beyond Man-Days 白皮書已完成（zh-TW v2 + ja + zh-cn），論述了五維框架和三層證據架構。現在要把論述落地成可用的工具。ACP 個人端 v1 已上線，但使用體驗不足以讓企業信賴或吸引合作夥伴。這次改版的目標是讓工具「明確、可用、可擴展」。

完整改版規格在：workspace 裡的 `acp-v2-spec.md`（也已存到 Paul 的 AI Collaboration Portfolio 資料夾）

---

## 改版三階段

### Phase 1：表單 UX 優化 + GitHub 整合深化
- GitHub auto-fetch 擴充：從 `zarqarwi` 帳號自動抓取 Command/Delivery/Quality/Influence 維度的數據
- 目標：至少 8/20 題自動帶入，手動填寫時間 < 5 分鐘
- 已自動帶入的欄位標記「✅ Auto-filled from GitHub」
- 每題加 tooltip 說明
- 手動欄位加 evidence URL
- UX 完成後呼叫 Stitch 做第三方驗證

### Phase 2：結果頁體驗
- 五維雷達圖 + Level 1-5 判定 + 一句話定位語
- 各維度深入解讀卡片（得分依據、相對位置、改善建議）
- 證據透明度區塊（Auto-fetched / Evidenced / Self-reported 比例）
- Layer 3 AI 校驗比對解讀
- 基準線：Paul Kuo 的實際分數 + Level 1-5 門檻值（需 Paul 跑一次確認）

### Phase 3：儲存 + 可分享 URL
- D1 schema（portfolios table）
- API endpoints: POST /api/acp/save, GET /api/acp/{id}, PUT /api/acp/{id}, GET /api/acp/{id}/og
- URL: paulkuo.tw/portfolio/{id}
- 動態 OG image（雷達圖 + Level badge）
- 社群分享按鈕（X / LinkedIn / Threads）

---

## Step 0 偵察（Code session 開始時先做）

```bash
# 1. 確認現有 ACP 相關檔案
find src -type f -name "*collab*" -o -name "*acp*" -o -name "*portfolio*"

# 2. 確認 Worker 現有的 ACP endpoints
grep -rn "acp" worker/src/

# 3. 確認 D1 現況
grep -rn "D1" worker/wrangler.toml

# 4. 確認 GitHub API 目前抓了什麼
grep -rn "github" src/pages/tools/ai-collab-portfolio/ --include="*.astro" --include="*.jsx" --include="*.tsx"
```

---

## 驗證方式

每個 Phase 完成後用 paulkuo.tw 的真實數據做 smoke test：

- **Phase 1**: 連接 GitHub `zarqarwi`，確認 ≥8 題自動帶入，數值合理
- **Phase 2**: Paul 跑完整流程，結果頁的 Level 判定和改善建議要合理（特別是 Influence 維度應被標記為最弱）
- **Phase 3**: 產生可分享 URL，無登入狀態下能看到完整結果頁，OG 預覽正確

---

## 注意事項

- Worker 已有 `acp.js`（Layer 2 GitHub Auto-Fetch + Layer 3 AI Verification），擴充即可，不需要重寫
- Workers AI binding 已存在 wrangler.toml，不需新增
- D1 binding 可能需要新增（確認 wrangler.toml）
- 前端是 Astro + React island，保持一致
- 不做用戶帳號系統，Phase 3 用 owner_token 做輕量權限
- 不做 HR 組織端（等個人端穩定後再做）

---

## 回報格式

每個 Phase 完成後寫 worklog：
```
- {HH:MM} ACP v2 Phase {N}: {做了什麼} ({commit hash}) Code
```

Phase 3 完成後觸發 session-handoff，通知 Cowork 做社群推廣準備。
